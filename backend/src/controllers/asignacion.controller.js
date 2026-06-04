const AsignacionModel = require('../models/asignacion.model');
const DocenteModel = require('../models/docente.model');
const CursoModel = require('../models/curso.model');
const AulaModel = require('../models/aula.model');
const LaboratorioModel = require('../models/laboratorio.model');
const { success, error } = require('../utils/responseHelper');

const TIPOS_ASIGNACION = ['Teoria', 'Practica', 'Laboratorio'];
const MAX_HORAS_POR_DOCENTE = 20;

// Utilidad para extraer las horas totales del curso según la categoría
const getHorasTotalesCurso = (curso, tipo) => {
  if (!curso) return 0;
  if (tipo === "Teoria") return Number(curso.horas_t) || 0;
  if (tipo === "Practica") return Number(curso.horas_p) || 0;
  if (tipo === "Laboratorio") return Number(curso.horas_l) || 0;
  return 0;
};

// 🌟 FUNCIÓN RESTAURADA Y COMPLETA
const validarAsignacion = (data) => {
  const errores = [];
  const { docente_id, curso_id, tipo, ambiente_preferido_id, semestre_asignacion, ciclo } = data;

  if (!docente_id || !Number.isInteger(Number(docente_id))) errores.push('docente_id es requerido y debe ser entero');
  if (!curso_id || !Number.isInteger(Number(curso_id))) errores.push('curso_id es requerido y debe ser entero');
  if (!TIPOS_ASIGNACION.includes(tipo)) errores.push(`tipo debe ser: ${TIPOS_ASIGNACION.join(', ')}`);
  if (!semestre_asignacion || String(semestre_asignacion).trim().length < 1) errores.push('semestre_asignacion es requerido');
  if (ciclo !== undefined && ciclo !== null && (!Number.isInteger(Number(ciclo)) || Number(ciclo) < 1 || Number(ciclo) > 10)) {
    errores.push('ciclo debe ser un entero entre 1 y 10');
  }
  if (ambiente_preferido_id !== undefined && ambiente_preferido_id !== null && !Number.isInteger(Number(ambiente_preferido_id))) {
    errores.push('ambiente_preferido_id debe ser entero o null');
  }

  return errores;
};

const AsignacionController = {
  getAll: async (req, res) => {
    try {
      const asignaciones = await AsignacionModel.getAll();
      success(res, asignaciones, 'Asignaciones obtenidas correctamente');
    } catch (err) {
      console.error(err);
      error(res, 'Error al obtener asignaciones', 500);
    }
  },

  create: async (req, res) => {
    try {
      const errores = validarAsignacion(req.body);
      if (errores.length > 0) return error(res, 'Validación fallida', 400, errores);

      const { docente_id, curso_id, tipo, ambiente_preferido_id, semestre_asignacion, horas_asignadas } = req.body;
      const grupo = req.body.grupo || 'Único'; 

      const docente = await DocenteModel.getById(docente_id);
      if (!docente) return error(res, 'El docente no existe', 404);

      const curso = await CursoModel.getById(curso_id);
      if (!curso) return error(res, 'El curso no existe', 404);

      const cicloNum = Number(curso.ciclo);
      const semestreNum = parseInt(semestre_asignacion.split('-').pop(), 10);
      const esCicloImpar = cicloNum % 2 === 1;
      const esSemestreImpar = semestreNum === 1;
      if (esCicloImpar !== esSemestreImpar) {
        const tipoCiclo = esCicloImpar ? 'impar' : 'par';
        const tipoSemestre = esSemestreImpar ? 'impar' : 'par';
        return error(res, `El curso pertenece al ciclo ${tipoCiclo} (${cicloNum}) pero el semestre es ${tipoSemestre}`, 409);
      }

      const cursoYaAsignado = await AsignacionModel.existsCursoAsignado(curso_id, tipo, grupo, semestre_asignacion);
      if (cursoYaAsignado) {
        return error(res, `El curso ya tiene asignado un docente para ${tipo} [Grupo ${grupo}].`, 409);
      }

      if (ambiente_preferido_id) {
        if (tipo === 'Teoria' || tipo === 'Practica') {
          const aula = await AulaModel.getById(ambiente_preferido_id);
          if (!aula) return error(res, 'El aula preferida no existe', 404);
        } else {
          const lab = await LaboratorioModel.getById(ambiente_preferido_id);
          if (!lab) return error(res, 'El laboratorio preferido no existe', 404);
        }
      }

      // Aseguramos guardar el número exacto de horas
      const horasFinales = horas_asignadas !== undefined ? Number(horas_asignadas) : getHorasTotalesCurso(curso, tipo);

      const horasActuales = await AsignacionModel.getHorasAsignadasPorDocente(docente_id, semestre_asignacion);
      if (horasActuales + horasFinales > MAX_HORAS_POR_DOCENTE) {
        return error(res, `Límite superado. El docente ya tiene ${horasActuales}h. Con este grupo llega a ${horasActuales + horasFinales}h.`, 409);
      }

      req.body.grupo = grupo;
      req.body.horas_asignadas = horasFinales;
      if (!req.body.ciclo && curso.ciclo) req.body.ciclo = curso.ciclo;

      const asignacion = await AsignacionModel.create(req.body);
      success(res, asignacion, 'Asignación creada correctamente', 201);
    } catch (err) {
      console.error(err);
      error(res, 'Error al crear asignación', 500);
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const asignacion = await AsignacionModel.getById(id);
      if (!asignacion) return error(res, 'Asignación no encontrada', 404);

      await AsignacionModel.delete(id);
      success(res, null, 'Asignación eliminada correctamente');
    } catch (err) {
      error(res, 'Error al eliminar asignación', 500);
    }
  },

  editarAsignacion: async (req, res) => {
    try {
      const { id } = req.params; 
      const { docente_id, ambiente_preferido_id } = req.body; 

      if (!docente_id) {
        return error(res, 'El docente es requerido', 400);
      }

      const idAsignacion = Number(id);
      const idDocente = Number(docente_id);
      const idAmbiente = ambiente_preferido_id ? Number(ambiente_preferido_id) : null;

      const pool = require('../config/db');
      const HorarioModel = require('../models/horario.model');

      const asignacion = await AsignacionModel.getById(idAsignacion);
      if (!asignacion) return error(res, 'Asignación no encontrada', 404);

      const resHorario = await pool.query('SELECT * FROM horarios WHERE asignacion_id = $1', [idAsignacion]);
      const horarioExistente = resHorario.rows[0];

      if (horarioExistente && idAmbiente) {
        if (asignacion.tipo === 'Teoria' || asignacion.tipo === 'Practica') {
          const conflicto = await HorarioModel.existeConflictoAula({
            aula_id: idAmbiente,
            semestre: horarioExistente.semestre,
            dia: horarioExistente.dia,
            hora_inicio: horarioExistente.hora_inicio,
            hora_fin: horarioExistente.hora_fin,
            excludeId: horarioExistente.id 
          });
          if (conflicto) return error(res, 'El aula seleccionada ya está ocupada en ese horario.', 409);
        } else {
          const conflicto = await HorarioModel.existeConflictoLaboratorio({
            laboratorio_id: idAmbiente,
            semestre: horarioExistente.semestre,
            dia: horarioExistente.dia,
            hora_inicio: horarioExistente.hora_inicio,
            hora_fin: horarioExistente.hora_fin,
            excludeId: horarioExistente.id
          });
          if (conflicto) return error(res, 'El laboratorio seleccionado ya está ocupado en ese horario.', 409);
        }
      }

      const asignacionActualizada = await AsignacionModel.updateDocente(idAsignacion, idDocente, idAmbiente);
      return success(res, asignacionActualizada, 'Asignación actualizada con éxito');
    } catch (err) {
      console.error('Error detallado en editarAsignacion:', err);
      return error(res, 'Error al modificar la asignación en el servidor', 500);
    }
  },

  asignarAutomaticamente: async (req, res) => {
    try {
      const { semestre } = req.body || {};
      const semestre_asignacion = semestre || '2026-1';
      const semestreNum = parseInt(semestre_asignacion.split('-').pop(), 10);
      const esSemestreImpar = semestreNum === 1;

      const cursos = await CursoModel.getAll();
      const cursosActivos = cursos.filter(c => c.activo && (Number(c.ciclo) % 2 === 1) === esSemestreImpar);

      const docentes = await DocenteModel.getAll();
      const docentesActivos = docentes.filter(d => d.activo !== false);

      const asignacionesExistentes = await AsignacionModel.getAllBySemestreConCursos(semestre_asignacion);
      
      const horasPorDocente = {};
      for (const a of asignacionesExistentes) {
        horasPorDocente[a.docente_id] = (horasPorDocente[a.docente_id] || 0) + (Number(a.horas_asignadas) || 0);
      }

      const asignacionesCreadas = [];
      const asignacionesFallidas = [];

      for (const curso of cursosActivos) {
        const asigsExistentesCurso = asignacionesExistentes.filter(a => a.curso_id === curso.id);
        let docentesDelCurso = [...new Set(asigsExistentesCurso.map(a => a.docente_id))];

        // --- 1. ASIGNAR TEORÍA ---
        if (Number(curso.horas_t) > 0) {
          const yaTieneTeoria = asignacionesExistentes.some(a => a.curso_id === curso.id && a.tipo === 'Teoria');
          if (!yaTieneTeoria) {
            const docente = encontrarDocenteDisponible(docentesActivos, curso, Number(curso.horas_t), horasPorDocente, docentesDelCurso, false);
            if (docente) {
              const nueva = await AsignacionModel.create({
                docente_id: docente.id, curso_id: curso.id, tipo: 'Teoria', grupo: 'Único', semestre_asignacion, ciclo: curso.ciclo, horas_asignadas: Number(curso.horas_t)
              });
              horasPorDocente[docente.id] = (horasPorDocente[docente.id] || 0) + Number(curso.horas_t);
              asignacionesCreadas.push({ ...nueva, docente_nombres: `${docente.nombres} ${docente.apellidos}`, curso_codigo: curso.codigo });
              if (!docentesDelCurso.includes(docente.id)) docentesDelCurso.push(docente.id);
            } else {
              asignacionesFallidas.push({ curso: curso.codigo, tipo: 'Teoría', motivo: 'No hay docente con especialidad o límite de horas' });
            }
          }
        }

        // --- 2. ASIGNAR PRÁCTICA ---
        if (Number(curso.horas_p) > 0) {
          const yaTienePractica = asignacionesExistentes.some(a => a.curso_id === curso.id && a.tipo === 'Practica');
          if (!yaTienePractica) {
            const docente = encontrarDocenteDisponible(docentesActivos, curso, Number(curso.horas_p), horasPorDocente, docentesDelCurso, false);
            if (docente) {
              const nueva = await AsignacionModel.create({
                docente_id: docente.id, curso_id: curso.id, tipo: 'Practica', grupo: 'Único', semestre_asignacion, ciclo: curso.ciclo, horas_asignadas: Number(curso.horas_p)
              });
              horasPorDocente[docente.id] = (horasPorDocente[docente.id] || 0) + Number(curso.horas_p);
              asignacionesCreadas.push({ ...nueva, docente_nombres: `${docente.nombres} ${docente.apellidos}`, curso_codigo: curso.codigo });
              if (!docentesDelCurso.includes(docente.id)) docentesDelCurso.push(docente.id);
            } else {
              asignacionesFallidas.push({ curso: curso.codigo, tipo: 'Práctica', motivo: 'Límite de horas o sin especialidad' });
            }
          }
        }

        // --- 3. ASIGNAR LABORATORIO ---
        if (Number(curso.horas_l) > 0) {
          const yaTieneLaboratorio = asignacionesExistentes.some(a => a.curso_id === curso.id && a.tipo === 'Laboratorio');
          
          if (!yaTieneLaboratorio) {
            const horasTotal = Number(curso.horas_l);
            let numGrupos = 1;

            if (horasTotal >= 4) {
              for (let i = 4; i >= 2; i--) {
                if (horasTotal % i === 0 && (horasTotal / i) >= 2) {
                  numGrupos = i;
                  break;
                }
              }
            }

            const horasPorGrupo = horasTotal / numGrupos;
            const nombresGrupos = numGrupos === 1 ? ['Único'] : Array.from({length: numGrupos}, (_, i) => String.fromCharCode(65 + i));

            for (const grupoNombre of nombresGrupos) {
              const docente = encontrarDocenteDisponible(docentesActivos, curso, horasPorGrupo, horasPorDocente, docentesDelCurso, true);
              if (docente) {
                const nueva = await AsignacionModel.create({
                  docente_id: docente.id, curso_id: curso.id, tipo: 'Laboratorio', grupo: grupoNombre, semestre_asignacion, ciclo: curso.ciclo, horas_asignadas: horasPorGrupo
                });
                horasPorDocente[docente.id] = (horasPorDocente[docente.id] || 0) + horasPorGrupo;
                asignacionesCreadas.push({ ...nueva, docente_nombres: `${docente.nombres} ${docente.apellidos}`, curso_codigo: curso.codigo });
                if (!docentesDelCurso.includes(docente.id)) docentesDelCurso.push(docente.id);
              } else {
                asignacionesFallidas.push({ curso: curso.codigo, tipo: `Laboratorio [Grupo ${grupoNombre}]`, motivo: 'No hay docente del curso disponible (Límite máximo 2 profesores)' });
              }
            }
          }
        }
      }

      success(res, {
        semestre: semestre_asignacion, creadas: asignacionesCreadas.length, fallidas: asignacionesFallidas.length,
        asignaciones: asignacionesCreadas, conflictos: asignacionesFallidas,
      }, `Asignación automática completada: ${asignacionesCreadas.length} creadas, ${asignacionesFallidas.length} fallidas`);
    } catch (err) {
      console.error(err);
      error(res, 'Error en asignación automática', 500);
    }
  },

  limpiarAsignaciones: async (req, res) => {
    try {
      const { semestre } = req.body || {};
      const semestre_asignacion = semestre || '2026-1';

      const eliminadas = await AsignacionModel.deleteAllBySemestre(semestre_asignacion);
      success(res, { semestre: semestre_asignacion, eliminadas }, `${eliminadas} asignaciones eliminadas correctamente`);
    } catch (err) {
      console.error(err);
      error(res, 'Error al limpiar asignaciones', 500);
    }
  },

  obtenerHorarioAsignacion: async (req, res) => {
    try {
      const { id } = req.params;
      const pool = require('../config/db');
      
      const resHorario = await pool.query(
        `SELECT id, dia, TO_CHAR(hora_inicio, 'HH24:MI') as hora_inicio, TO_CHAR(hora_fin, 'HH24:MI') as hora_fin, semestre 
         FROM horarios WHERE asignacion_id = $1`, [Number(id)]
      );
      
      const horario = resHorario.rows[0];
      if (!horario) return res.json({ success: true, data: { horario: null, ocupados: [] } });
      
      const resOcupados = await pool.query(
        `SELECT aula_id, laboratorio_id FROM horarios WHERE semestre = $1 AND dia = $2 AND hora_inicio < $4::time AND hora_fin > $3::time AND id != $5`,
        [horario.semestre, horario.dia, horario.hora_inicio, horario.hora_fin, horario.id]
      );
      
      const ocupadosIds = resOcupados.rows.reduce((acc, row) => {
        if (row.aula_id) acc.push(Number(row.aula_id));
        if (row.laboratorio_id) acc.push(Number(row.laboratorio_id));
        return acc;
      }, []);
      
      return res.json({ success: true, data: { horario, ocupados: ocupadosIds } });
    } catch (err) {
      console.error('Error en obtenerHorarioAsignacion:', err);
      return res.status(500).json({ success: false, message: 'Error al consultar el horario' });
    }
  },
};

function cumpleRequisitos(d, curso, horasRequeridas, horasPorDocente) {
  const cursoEsp = curso.especialidad?.toLowerCase();
  if (cursoEsp && d.especialidad?.toLowerCase() !== cursoEsp) return false;
  const horasActuales = horasPorDocente[d.id] || 0;
  if (horasActuales + horasRequeridas > MAX_HORAS_POR_DOCENTE) return false;
  return true;
}

function encontrarDocenteDisponible(docentes, curso, horasRequeridas, horasPorDocente, docentesDelCurso = [], limitarADos = false) {
  
  for (const prefId of docentesDelCurso) {
    const prefDoc = docentes.find(d => d.id === prefId);
    if (prefDoc && cumpleRequisitos(prefDoc, curso, horasRequeridas, horasPorDocente)) {
      return prefDoc;
    }
  }

  if (limitarADos && docentesDelCurso.length >= 2) {
    return null;
  }

  const candidatos = docentes.filter(d => {
    if (docentesDelCurso.includes(d.id)) return false; 
    return cumpleRequisitos(d, curso, horasRequeridas, horasPorDocente);
  });

  candidatos.sort((a, b) => {
    const horasA = horasPorDocente[a.id] || 0;
    const horasB = horasPorDocente[b.id] || 0;
    if (horasA !== horasB) return horasA - horasB;

    const tipoA = a.tipo_nombramiento === 'Nombrado' ? 1 : 2;
    const tipoB = b.tipo_nombramiento === 'Nombrado' ? 1 : 2;
    if (tipoA !== tipoB) return tipoA - tipoB;

    const catOrder = { 'Principal': 1, 'Asociado': 2, 'Auxiliar': 3, 'Jefe de practica': 4 };
    const catA = catOrder[a.categoria] || 5;
    const catB = catOrder[b.categoria] || 5;
    if (catA !== catB) return catA - catB;

    return (b.antiguedad_anios || 0) - (a.antiguedad_anios || 0);
  });

  return candidatos[0] || null;
}

module.exports = AsignacionController;