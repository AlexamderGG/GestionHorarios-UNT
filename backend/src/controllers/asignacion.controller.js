const AsignacionModel = require('../models/asignacion.model');
const DocenteModel = require('../models/docente.model');
const CursoModel = require('../models/curso.model');
const AulaModel = require('../models/aula.model');
const LaboratorioModel = require('../models/laboratorio.model');
const ConfiguracionModel = require('../models/configuracion.model');
const { success, error } = require('../utils/responseHelper');

const TIPOS_ASIGNACION = ['Teoria', 'Laboratorio'];
const MAX_HORAS_POR_DOCENTE = 20; // Límite máximo de horas semanales por docente

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

      const { docente_id, curso_id, tipo, ambiente_preferido_id, semestre_asignacion } = req.body;

      // Validar que docente exista
      const docente = await DocenteModel.getById(docente_id);
      if (!docente) return error(res, 'El docente no existe', 404);

      // Validar que curso exista
      const curso = await CursoModel.getById(curso_id);
      if (!curso) return error(res, 'El curso no existe', 404);

      // Validar que el ciclo del curso corresponda al semestre activo (impar/par)
      const cicloNum = Number(curso.ciclo);
      const semestreNum = parseInt(semestre_asignacion.split('-').pop(), 10);
      const esCicloImpar = cicloNum % 2 === 1;
      const esSemestreImpar = semestreNum === 1;
      if (esCicloImpar !== esSemestreImpar) {
        const tipoCiclo = esCicloImpar ? 'impar' : 'par';
        const tipoSemestre = esSemestreImpar ? 'impar' : 'par';
        return error(res, `El curso belongs to a cycle ${tipoCiclo} (${cicloNum}) but the semester is ${tipoSemestre}`, 409);
      }

      // Validar especialidad: docente debe coincidir con especialidad del curso
      if (docente.especialidad && curso.especialidad && 
          docente.especialidad.toLowerCase() !== curso.especialidad.toLowerCase()) {
        return error(res, 
          `El docente tiene especialidad '${docente.especialidad}' pero el curso requiere '${curso.especialidad}'`, 
          409);
      }

      // Validar límite de horas del docente
      const horasAsignadas = await AsignacionModel.getHorasAsignadasPorDocente(docente_id, semestre_asignacion);
      const horasCurso = tipo === 'Teoria' ? (Number(curso.horas_aula) || 0) : (Number(curso.horas_lab) || 0);
      if (horasAsignadas + horasCurso > MAX_HORAS_POR_DOCENTE) {
        return error(res, 
          `El docente ya tiene ${horasAsignadas}h asignadas. Con este curso superaría el límite de ${MAX_HORAS_POR_DOCENTE}h semanales.`, 
          409);
      }

      // Validar que el curso no tenga ya asignación del mismo tipo (cualquier docente)
      const cursoYaAsignado = await AsignacionModel.existsCursoAsignado(curso_id, tipo, semestre_asignacion);
      if (cursoYaAsignado) {
        return error(res, `El curso ya tiene asignado un docente para ${tipo}. Solo se permite un docente por tipo.`, 409);
      }

      // Validar ambiente preferido si se proporciona
      if (ambiente_preferido_id) {
        if (tipo === 'Teoria') {
          const aula = await AulaModel.getById(ambiente_preferido_id);
          if (!aula) return error(res, 'El aula preferida no existe', 404);
        } else {
          const lab = await LaboratorioModel.getById(ambiente_preferido_id);
          if (!lab) return error(res, 'El laboratorio preferido no existe', 404);
        }
      }

      // Validar duplicado (mismo docente, mismo curso, mismo tipo)
      const duplicado = await AsignacionModel.existsDuplicate(docente_id, curso_id, tipo, semestre_asignacion);
      if (duplicado) return error(res, 'Ya existe una asignación de este tipo para el docente, curso y semestre', 409);

      // Si no se envia ciclo, tomarlo del curso
      if (!req.body.ciclo && curso.ciclo) {
        req.body.ciclo = curso.ciclo;
      }

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

  // 👇 OPTIMIZADO: Asegura tipos numéricos, captura el ambiente y usa responseHelper
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

      // Importamos las herramientas necesarias localmente para el chequeo de conflictos
      const pool = require('../config/db');
      const HorarioModel = require('../models/horario.model');

      // 1. Obtener la asignación actual para saber el tipo de curso (Teoria/Laboratorio)
      const asignacion = await AsignacionModel.getById(idAsignacion);
      if (!asignacion) return error(res, 'Asignación no encontrada', 404);

      // 2. 👇 VALIDACIÓN DE CRUCES: Buscamos si este curso ya cuenta con un horario físico establecido
      const resHorario = await pool.query('SELECT * FROM horarios WHERE asignacion_id = $1', [idAsignacion]);
      const horarioExistente = resHorario.rows[0];

      if (horarioExistente && idAmbiente) {
        // Si ya tiene un horario reservado, verificamos que el nuevo salón esté libre en ese día y rango de horas
        if (asignacion.tipo === 'Teoria') {
          const conflicto = await HorarioModel.existeConflictoAula({
            aula_id: idAmbiente,
            semestre: horarioExistente.semestre,
            dia: horarioExistente.dia,
            hora_inicio: horarioExistente.hora_inicio,
            hora_fin: horarioExistente.hora_fin,
            excludeId: horarioExistente.id // Excluimos el registro actual
          });
          if (conflicto) return error(res, 'El aula seleccionada ya se encuentra ocupada por otra clase en ese mismo horario.', 409);
        } else {
          const conflicto = await HorarioModel.existeConflictoLaboratorio({
            laboratorio_id: idAmbiente,
            semestre: horarioExistente.semestre,
            dia: horarioExistente.dia,
            hora_inicio: horarioExistente.hora_inicio,
            hora_fin: horarioExistente.hora_fin,
            excludeId: horarioExistente.id
          });
          if (conflicto) return error(res, 'El laboratorio seleccionado ya se encuentra ocupado por otra clase en ese mismo horario.', 409);
        }
      }

      // 3. Si todo está limpio, ejecutamos la actualización en cascada
      const asignacionActualizada = await AsignacionModel.updateDocente(idAsignacion, idDocente, idAmbiente);

      return success(res, asignacionActualizada, 'Asignación y ambientes actualizados con éxito en el calendario');
    } catch (err) {
      console.error('Error detallado en editarAsignacion:', err);
      return error(res, 'Error al modificar la asignación en el servidor', 500);
    }
  },

  // Asignación automática de todos los cursos activos a docentes disponibles
  asignarAutomaticamente: async (req, res) => {
    try {
      const { semestre } = req.body || {};
      const semestre_asignacion = semestre || '2026-1';

      const semestreNum = parseInt(semestre_asignacion.split('-').pop(), 10);
      const esSemestreImpar = semestreNum === 1;

      const cursos = await CursoModel.getAll();
      const cursosActivos = cursos.filter(c => {
        if (!c.activo) return false;
        const esCicloImpar = Number(c.ciclo) % 2 === 1;
        return esCicloImpar === esSemestreImpar;
      });

      const docentes = await DocenteModel.getAll();
      const docentesActivos = docentes.filter(d => d.activo !== false);

      const asignacionesExistentes = await AsignacionModel.getAllBySemestreConCursos(semestre_asignacion);
      const horasPorDocente = {};
      for (const a of asignacionesExistentes) {
        const horas = a.tipo === 'Teoria' ? (Number(a.horas_aula) || 0) : (Number(a.horas_lab) || 0);
        horasPorDocente[a.docente_id] = (horasPorDocente[a.docente_id] || 0) + horas;
      }

      const asignacionesCreadas = [];
      const asignacionesFallidas = [];

      for (const curso of cursosActivos) {
        if (Number(curso.horas_aula) > 0) {
          const asignadoTeoria = await AsignacionModel.existsCursoAsignado(curso.id, 'Teoria', semestre_asignacion);
          if (!asignadoTeoria) {
            const docente = encontrarDocenteDisponible(docentesActivos, curso, 'Teoria', semestre_asignacion, horasPorDocente);
            if (docente) {
              const nueva = await AsignacionModel.create({
                docente_id: docente.id,
                curso_id: curso.id,
                tipo: 'Teoria',
                semestre_asignacion,
                ciclo: curso.ciclo,
              });
              const horas = Number(curso.horas_aula) || 0;
              horasPorDocente[docente.id] = (horasPorDocente[docente.id] || 0) + horas;
              asignacionesCreadas.push({ ...nueva, docente_nombres: `${docente.nombres} ${docente.apellidos}`, curso_codigo: curso.codigo });
            } else {
              asignacionesFallidas.push({ curso: curso.codigo, tipo: 'Teoria', motivo: 'No hay docente disponible (límite de horas o sin especialidad)' });
            }
          }
        }

        if (Number(curso.horas_lab) > 0) {
          const asignadoLab = await AsignacionModel.existsCursoAsignado(curso.id, 'Laboratorio', semestre_asignacion);
          if (!asignadoLab) {
            const docente = encontrarDocenteDisponible(docentesActivos, curso, 'Laboratorio', semestre_asignacion, horasPorDocente);
            if (docente) {
              const nueva = await AsignacionModel.create({
                docente_id: docente.id,
                curso_id: curso.id,
                tipo: 'Laboratorio',
                semestre_asignacion,
                ciclo: curso.ciclo,
              });
              const horas = Number(curso.horas_lab) || 0;
              horasPorDocente[docente.id] = (horasPorDocente[docente.id] || 0) + horas;
              asignacionesCreadas.push({ ...nueva, docente_nombres: `${docente.nombres} ${docente.apellidos}`, curso_codigo: curso.codigo });
            } else {
              asignacionesFallidas.push({ curso: curso.codigo, tipo: 'Laboratorio', motivo: 'No hay docente disponible (límite de horas o sin especialidad)' });
            }
          }
        }
      }

      success(res, {
        semestre: semestre_asignacion,
        creadas: asignacionesCreadas.length,
        fallidas: asignacionesFallidas.length,
        asignaciones: asignacionesCreadas,
        conflictos: asignacionesFallidas,
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

  // Agregar al objeto AsignacionController en asignacion.controller.js
  obtenerHorarioAsignacion: async (req, res) => {
    try {
      const { id } = req.params;
      const pool = require('../config/db');
      
      // 1. Consultamos si esta asignación ya tiene un horario físico en el calendario
      const resHorario = await pool.query(
        `SELECT id, dia, 
                TO_CHAR(hora_inicio, 'HH24:MI') as hora_inicio, 
                TO_CHAR(hora_fin, 'HH24:MI') as hora_fin, 
                semestre 
         FROM horarios WHERE asignacion_id = $1`, 
        [Number(id)]
      );
      
      const horario = resHorario.rows[0];
      
      // Si el curso no está programado aún, devolvemos listas vacías sin errores
      if (!horario) {
        return res.json({ success: true, data: { horario: null, ocupados: [] } });
      }
      
      // 2. Buscamos qué aulas o laboratorios están ocupados en ese mismo rango horario
      // EXCLUYENDO el ID de este mismo horario para que su salón actual figure libre para él mismo
      const resOcupados = await pool.query(
        `SELECT aula_id, laboratorio_id 
         FROM horarios 
         WHERE semestre = $1 
           AND dia = $2 
           AND hora_inicio < $4::time 
           AND hora_fin > $3::time
           AND id != $5`,
        [horario.semestre, horario.dia, horario.hora_inicio, horario.hora_fin, horario.id]
      );
      
      // Extraemos los IDs de los ambientes ocupados limpios de nulos
      const ocupadosIds = resOcupados.rows.reduce((acc, row) => {
        if (row.aula_id) acc.push(Number(row.aula_id));
        if (row.laboratorio_id) acc.push(Number(row.laboratorio_id));
        return acc;
      }, []);
      
      // Devolvemos el combo completo a la secretaría
      return res.json({ 
        success: true, 
        data: { 
          horario, 
          ocupados: ocupadosIds // Lista negra directa de IDs ocupados
        } 
      });
    } catch (err) {
      console.error('Error en obtenerHorarioAsignacion:', err);
      return res.status(500).json({ success: false, message: 'Error al consultar el horario y ocupación' });
    }
  },
};

function encontrarDocenteDisponible(docentes, curso, tipo, semestre, horasPorDocente) {
  const cursoEsp = curso.especialidad?.toLowerCase();
  const horasCurso = tipo === 'Teoria' ? (Number(curso.horas_aula) || 0) : (Number(curso.horas_lab) || 0);

  const candidatos = docentes.filter(d => {
    if (cursoEsp && d.especialidad?.toLowerCase() !== cursoEsp) return false;
    const horasActuales = horasPorDocente[d.id] || 0;
    if (horasActuales + horasCurso > MAX_HORAS_POR_DOCENTE) return false;
    return true;
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