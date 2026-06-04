const pool = require('../config/db');
const { success, error } = require('../utils/responseHelper');

const DisponibilidadController = {
  getByDocente: async (req, res) => {
    try {
      const { docente_id, semestre } = req.query;
      const query = `SELECT * FROM disponibilidad_docente WHERE docente_id = $1 AND semestre = $2 ORDER BY dia, hora_inicio`;
      const result = await pool.query(query, [docente_id, semestre]);
      return success(res, result.rows);
    } catch (err) {
      return error(res, 'Error al obtener disponibilidades', 500);
    }
  },

  crear: async (req, res) => {
    try {
      const { docente_id, semestre, dia, hora_inicio, hora_fin, tipo } = req.body;
      const query = `INSERT INTO disponibilidad_docente (docente_id, semestre, dia, hora_inicio, hora_fin, tipo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
      const result = await pool.query(query, [docente_id, semestre, dia, hora_inicio, hora_fin, tipo]);
      return success(res, result.rows[0], 'Bloque registrado exitosamente');
    } catch (err) {
      return error(res, 'Error al guardar disponibilidad', 500);
    }
  },

  eliminar: async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM disponibilidad_docente WHERE id = $1', [id]);
      return success(res, null, 'Bloque eliminado');
    } catch (err) {
      return error(res, 'Error al eliminar', 500);
    }
  },

  getAnalisisSecretaria: async (req, res) => {
    try {
      const { semestre } = req.query;
      
      const docentesQuery = `
        SELECT id, nombres, apellidos, categoria, antiguedad_anios 
        FROM docentes
        ORDER BY CASE categoria WHEN 'Principal' THEN 1 WHEN 'Asociado' THEN 2 WHEN 'Auxiliar' THEN 3 WHEN 'Jefe de practica' THEN 4 ELSE 5 END,
        antiguedad_anios DESC, apellidos ASC
      `;
      const docentesResult = await pool.query(docentesQuery);
      
      const dispResult = await pool.query(`SELECT * FROM disponibilidad_docente WHERE semestre = $1`, [semestre]);

      const asigQuery = `
        SELECT a.id, a.docente_id, a.tipo, a.grupo, a.horas_asignadas, c.nombre as curso_nombre, c.codigo as curso_codigo, c.ciclo as curso_ciclo
        FROM asignacion_docente_curso a
        JOIN cursos c ON a.curso_id = c.id
        WHERE a.semestre_asignacion = $1
      `;
      const asigResult = await pool.query(asigQuery, [semestre]);

      const horResult = await pool.query(`
        SELECT h.id, h.dia, h.hora_inicio, h.hora_fin, a.id as asignacion_id, a.docente_id
        FROM horarios h
        JOIN asignacion_docente_curso a ON h.asignacion_id = a.id
        WHERE a.semestre_asignacion = $1
      `, [semestre]);
      
      const asignacionesProgramadas = horResult.rows.map(r => r.asignacion_id);

      const analisis = docentesResult.rows.map(docente => {
        const susDisponibilidades = dispResult.rows.filter(d => d.docente_id === docente.id);
        const susHorarios = horResult.rows.filter(h => h.docente_id === docente.id);
        
        const susAsignacionesRaw = asigResult.rows.filter(a => a.docente_id === docente.id).map(a => ({
          ...a,
          programado: asignacionesProgramadas.includes(a.id)
        }));

        // 🌟 ORDENAMOS PARA PROCESAR TEORÍA PRIMERO
        susAsignacionesRaw.sort((a, b) => {
          const order = { 'Teoria': 1, 'Practica': 2, 'Laboratorio': 3 };
          return (order[a.tipo] || 9) - (order[b.tipo] || 9);
        });

        // 🌟 ALGORITMO DE FUSIÓN T+P
        const asignacionesAgrupadas = [];
        const procesados = new Set();

        susAsignacionesRaw.forEach(asig => {
          if (procesados.has(asig.id)) return;

          if (asig.tipo === 'Teoria') {
            // Verificar exclusividad: ¿Hay alguien más dictando T o P en este curso?
            const otroDocente = asigResult.rows.some(a => 
              a.curso_id === asig.curso_id && 
              (a.tipo === 'Teoria' || a.tipo === 'Practica') && 
              a.docente_id !== docente.id
            );

            if (!otroDocente) {
              const practicaMatch = susAsignacionesRaw.find(a => 
                a.curso_id === asig.curso_id && a.tipo === 'Practica' && !procesados.has(a.id)
              );

              // Si la encontramos y AMBAS tienen el mismo estado (ambas sin programar o ambas programadas)
              if (practicaMatch && asig.programado === practicaMatch.programado) {
                asignacionesAgrupadas.push({
                  ...asig,
                  id: `${asig.id}-${practicaMatch.id}`, // ID Ficticio combinado
                  ids_reales: [asig.id, practicaMatch.id], // Guardamos los IDs reales para la base de datos
                  tipo: 'Teoria + Practica',
                  horas_asignadas: Number(asig.horas_asignadas) + Number(practicaMatch.horas_asignadas),
                  horas_desglose: [Number(asig.horas_asignadas), Number(practicaMatch.horas_asignadas)],
                  programado: asig.programado
                });
                procesados.add(asig.id);
                procesados.add(practicaMatch.id);
                return;
              }
            }
          }

          // Si no es Teoría o no hubo coincidencia, se va normal
          asignacionesAgrupadas.push({
            ...asig,
            ids_reales: [asig.id],
            horas_desglose: [Number(asig.horas_asignadas)]
          });
          procesados.add(asig.id);
        });

        const totalAsignados = asignacionesAgrupadas.length;
        const totalProgramados = asignacionesAgrupadas.filter(a => a.programado).length;

        return {
          ...docente,
          disponibilidades: susDisponibilidades,
          horarios: susHorarios,
          asignaciones: asignacionesAgrupadas,
          progreso: {
            total: totalAsignados,
            listos: totalProgramados,
            completado: totalAsignados > 0 && totalAsignados === totalProgramados
          }
        };
      });

      const docentesActivos = analisis.filter(d => d.progreso.total > 0);
      return success(res, docentesActivos);
    } catch (err) {
      console.error(err);
      return error(res, 'Error al generar matriz de análisis', 500);
    }
  },
};

module.exports = DisponibilidadController;