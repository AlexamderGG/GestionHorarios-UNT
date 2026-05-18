const HorarioModel = require('../models/horario.model');
const AsignacionModel = require('../models/asignacion.model');
const AulaModel = require('../models/aula.model');
const LaboratorioModel = require('../models/laboratorio.model');
const ConfiguracionModel = require('../models/configuracion.model');
const { success, error } = require('../utils/responseHelper');

const DIAS_VALIDOS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

const normalizarHora = (hora) => String(hora).slice(0, 5);

const timeToMinutes = (hora) => {
  const [hours, minutes] = normalizarHora(hora).split(':').map(Number);
  return hours * 60 + minutes;
};

const DocenteAuthController = {
  getMisCursos: async (req, res) => {
    try {
      const asignaciones = await AsignacionModel.getByDocente(req.user.id);
      const semestreActual = req.query.semestre || '2024-1';

      const horarios = await HorarioModel.getAll({ docente_id: req.user.id, semestre: semestreActual });
      const horariosPorAsignacion = {};
      horarios.forEach(h => {
        horariosPorAsignacion[h.asignacion_id] = h;
      });

      const cursos = asignaciones.map(a => ({
        ...a,
        tiene_horario: !!horariosPorAsignacion[a.id],
        horario: horariosPorAsignacion[a.id] || null,
      }));

      success(res, cursos, 'Cursos obtenidos correctamente');
    } catch (err) {
      console.error(err);
      error(res, 'Error al obtener cursos', 500);
    }
  },

  getMiHorario: async (req, res) => {
    try {
      const semestre = req.query.semestre || '2024-1';
      const horarios = await HorarioModel.getAll({ docente_id: req.user.id, semestre });
      success(res, horarios, 'Horario obtenido correctamente');
    } catch (err) {
      console.error(err);
      error(res, 'Error al obtener horario', 500);
    }
  },

  seleccionarHorario: async (req, res) => {
    try {
      const { asignacion_id, dia, hora_inicio, hora_fin, aula_id, laboratorio_id } = req.body;

      if (!asignacion_id || !Number.isInteger(Number(asignacion_id))) {
        return error(res, 'asignacion_id es requerido y debe ser entero', 400);
      }
      if (!dia || !DIAS_VALIDOS.includes(dia)) {
        return error(res, `dia debe ser uno de: ${DIAS_VALIDOS.join(', ')}`, 400);
      }

      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      const hIni = normalizarHora(hora_inicio);
      const hFin = normalizarHora(hora_fin);
      if (!timeRegex.test(hIni)) return error(res, 'hora_inicio en formato HH:MM', 400);
      if (!timeRegex.test(hFin)) return error(res, 'hora_fin en formato HH:MM', 400);
      if (timeToMinutes(hIni) >= timeToMinutes(hFin)) return error(res, 'hora_inicio debe ser menor que hora_fin', 400);

      const asignacion = await AsignacionModel.getById(asignacion_id);
      if (!asignacion) return error(res, 'Asignación no encontrada', 404);
      if (asignacion.docente_id !== req.user.id) return error(res, 'Esta asignación no te pertenece', 403);

      const restriccion = await HorarioModel.existeRestriccionDocente({
        docente_id: req.user.id, dia, hora_inicio: hIni, hora_fin: hFin,
      });
      if (restriccion) return error(res, 'Tienes una restricción horaria en ese rango', 409);

      const semestre = asignacion.semestre_asignacion || '2024-1';

      const conflictoDocente = await HorarioModel.existeConflictoDocente({
        docente_id: req.user.id, semestre, dia, hora_inicio: hIni, hora_fin: hFin,
      });
      if (conflictoDocente) return error(res, 'Ya tienes una clase en ese horario', 409);

      const ambientesBase = asignacion.tipo === 'Teoria'
        ? await HorarioModel.getAulasActivas()
        : await HorarioModel.getLaboratoriosActivos();

      const ambientesLibres = [];
      for (const amb of ambientesBase) {
        const conflicto = asignacion.tipo === 'Teoria'
          ? await HorarioModel.existeConflictoAula({ aula_id: amb.id, semestre, dia, hora_inicio: hIni, hora_fin: hFin })
          : await HorarioModel.existeConflictoLaboratorio({ laboratorio_id: amb.id, semestre, dia, hora_inicio: hIni, hora_fin: hFin });
        if (!conflicto) ambientesLibres.push(amb);
      }

      if (ambientesLibres.length === 0) {
        return error(res, 'No hay ambientes disponibles en ese horario', 409);
      }

      let ambienteSeleccionado = null;
      if (asignacion.tipo === 'Teoria') {
        if (aula_id) {
          const aulaOk = ambientesLibres.find(a => Number(a.id) === Number(aula_id));
          if (!aulaOk) return error(res, 'El aula seleccionada no está disponible', 409);
          ambienteSeleccionado = { tipo: 'aula', id: Number(aula_id) };
        } else {
          const preferido = asignacion.ambiente_preferido_id
            ? ambientesLibres.find(a => Number(a.id) === Number(asignacion.ambiente_preferido_id))
            : null;
          ambienteSeleccionado = { tipo: 'aula', id: (preferido || ambientesLibres[0]).id };
        }
      } else {
        if (laboratorio_id) {
          const labOk = ambientesLibres.find(l => Number(l.id) === Number(laboratorio_id));
          if (!labOk) return error(res, 'El laboratorio seleccionado no está disponible', 409);
          ambienteSeleccionado = { tipo: 'laboratorio', id: Number(laboratorio_id) };
        } else {
          const preferido = asignacion.ambiente_preferido_id
            ? ambientesLibres.find(l => Number(l.id) === Number(asignacion.ambiente_preferido_id))
            : null;
          ambienteSeleccionado = { tipo: 'laboratorio', id: (preferido || ambientesLibres[0]).id };
        }
      }

      const horario = await HorarioModel.create({
        asignacion_id: Number(asignacion_id),
        semestre,
        dia,
        hora_inicio: hIni,
        hora_fin: hFin,
        aula_id: ambienteSeleccionado.tipo === 'aula' ? ambienteSeleccionado.id : null,
        laboratorio_id: ambienteSeleccionado.tipo === 'laboratorio' ? ambienteSeleccionado.id : null,
        generado_automaticamente: false,
        editado_manualmente: false,
      });

      const horarioCompleto = await HorarioModel.getById(horario.id);
      success(res, horarioCompleto, 'Horario seleccionado correctamente', 201);
    } catch (err) {
      console.error(err);
      error(res, 'Error al seleccionar horario', 500);
    }
  },

  eliminarMiHorario: async (req, res) => {
    try {
      const { id } = req.params;
      if (!Number.isInteger(Number(id))) return error(res, 'id debe ser entero', 400);

      const horario = await HorarioModel.getById(id);
      if (!horario) return error(res, 'Horario no encontrado', 404);
      if (horario.docente?.id !== req.user.id) return error(res, 'Este horario no te pertenece', 403);
      if (horario.editado_manualmente) return error(res, 'No puedes eliminar horarios editados por el administrador', 403);

      await HorarioModel.delete(id);
      success(res, null, 'Horario eliminado correctamente');
    } catch (err) {
      console.error(err);
      error(res, 'Error al eliminar horario', 500);
    }
  },

  getAmbientesDisponibles: async (req, res) => {
    try {
      const { asignacion_id, dia, hora_inicio, hora_fin, semestre } = req.query;

      if (!asignacion_id || !dia || !hora_inicio || !hora_fin) {
        return error(res, 'asignacion_id, dia, hora_inicio y hora_fin son requeridos', 400);
      }

      const asignacion = await AsignacionModel.getById(Number(asignacion_id));
      if (!asignacion) return error(res, 'Asignación no encontrada', 404);
      if (asignacion.docente_id !== req.user.id) return error(res, 'Esta asignación no te pertenece', 403);

      const sem = semestre || asignacion.semestre_asignacion || '2024-1';
      const hIni = normalizarHora(hora_inicio);
      const hFin = normalizarHora(hora_fin);

      const ambientesBase = asignacion.tipo === 'Teoria'
        ? await HorarioModel.getAulasActivas()
        : await HorarioModel.getLaboratoriosActivos();

      const disponibles = [];
      for (const amb of ambientesBase) {
        const conflicto = asignacion.tipo === 'Teoria'
          ? await HorarioModel.existeConflictoAula({ aula_id: amb.id, semestre: sem, dia, hora_inicio: hIni, hora_fin: hFin })
          : await HorarioModel.existeConflictoLaboratorio({ laboratorio_id: amb.id, semestre: sem, dia, hora_inicio: hIni, hora_fin: hFin });
        if (!conflicto) disponibles.push(amb);
      }

      success(res, disponibles, 'Ambientes disponibles obtenidos correctamente');
    } catch (err) {
      console.error(err);
      error(res, 'Error al obtener ambientes disponibles', 500);
    }
  },
};

module.exports = DocenteAuthController;
