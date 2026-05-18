const HorarioModel = require('../models/horario.model');
const SchedulerService = require('../services/scheduler.service');
const { success, error } = require('../utils/responseHelper');

const validarFiltros = (query) => {
  const errores = [];
  const enteros = ['docente_id', 'aula_id', 'laboratorio_id'];

  enteros.forEach((campo) => {
    if (query[campo] !== undefined && query[campo] !== '' && !Number.isInteger(Number(query[campo]))) {
      errores.push(`${campo} debe ser entero`);
    }
  });

  if (query.dia && !SchedulerService.DIAS_VALIDOS.includes(query.dia)) {
    errores.push(`dia debe ser uno de: ${SchedulerService.DIAS_VALIDOS.join(', ')}`);
  }

  if (query.semestre && SchedulerService.validarSemestre(String(query.semestre))) {
    errores.push(SchedulerService.validarSemestre(String(query.semestre)));
  }

  return errores;
};

const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
};

const HorariosController = {
  getAll: async (req, res) => {
    try {
      const errores = validarFiltros(req.query);
      if (errores.length > 0) return error(res, 'Validación fallida', 400, errores);

      const horarios = await HorarioModel.getAll(req.query);
      success(res, horarios, 'Horarios obtenidos correctamente');
    } catch (err) {
      console.error(err);
      error(res, 'Error al obtener horarios', 500);
    }
  },

  getEstadoSeleccion: async (req, res) => {
    try {
      const semestre = req.query.semestre || '2024-1';
      const estado = await HorarioModel.getEstadoSeleccion(semestre);
      success(res, estado, 'Estado de selección obtenido correctamente');
    } catch (err) {
      console.error(err);
      error(res, 'Error al obtener estado de selección', 500);
    }
  },

  generar: async (req, res) => {
    try {
      const { semestre = '2024-1', forzar = false } = req.body || {};
      const resultado = await SchedulerService.generarHorarios({ semestre, forzar: parseBoolean(forzar) });

      if (!resultado.ok) {
        return error(res, resultado.message, resultado.status || 400, resultado.errors || null);
      }

      success(res, resultado.data, resultado.message, resultado.status || 201);
    } catch (err) {
      console.error(err);
      error(res, 'Error al generar horarios', 500);
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      if (!Number.isInteger(Number(id))) return error(res, 'id debe ser entero', 400);

      const validacion = await SchedulerService.validarEdicionManual(id, req.body || {});
      if (!validacion.ok) {
        return error(res, validacion.message, validacion.status || 400, validacion.errors || null);
      }

      await HorarioModel.update(id, validacion.data);
      const horarioActualizado = await HorarioModel.getById(id);
      success(res, horarioActualizado, 'Horario actualizado manualmente correctamente');
    } catch (err) {
      console.error(err);
      error(res, 'Error al actualizar horario', 500);
    }
  },

  remove: async (req, res) => {
    try {
      const { id } = req.params;
      if (!Number.isInteger(Number(id))) return error(res, 'id debe ser entero', 400);

      const horario = await HorarioModel.getById(id);
      if (!horario) return error(res, 'Horario no encontrado', 404);

      await HorarioModel.delete(id);
      success(res, null, 'Horario eliminado correctamente');
    } catch (err) {
      console.error(err);
      error(res, 'Error al eliminar horario', 500);
    }
  },
};

module.exports = HorariosController;
