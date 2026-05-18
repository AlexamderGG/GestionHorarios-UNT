const RestriccionModel = require('../models/restriccion.model');
const DocenteModel = require('../models/docente.model');
const { success, error } = require('../utils/responseHelper');

const validarRestriccion = (data) => {
  const errores = [];
  const { dia, hora_inicio, hora_fin } = data;

  if (!dia || !RestriccionModel.DIAS_VALIDOS.includes(dia)) {
    errores.push(`dia debe ser uno de: ${RestriccionModel.DIAS_VALIDOS.join(', ')}`);
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!hora_inicio || !timeRegex.test(hora_inicio)) errores.push('hora_inicio requerida en formato HH:MM');
  if (!hora_fin || !timeRegex.test(hora_fin)) errores.push('hora_fin requerida en formato HH:MM');

  if (timeRegex.test(hora_inicio) && timeRegex.test(hora_fin)) {
    const [h1, m1] = hora_inicio.split(':').map(Number);
    const [h2, m2] = hora_fin.split(':').map(Number);
    if (h1 * 60 + m1 >= h2 * 60 + m2) {
      errores.push('hora_inicio debe ser menor que hora_fin');
    }
  }

  return errores;
};

const RestriccionesController = {
  getAll: async (req, res) => {
    try {
      const filters = {};
      if (req.user.role === 'docente') {
        filters.docente_id = req.user.id;
      } else if (req.query.docente_id) {
        filters.docente_id = req.query.docente_id;
      }
      if (req.query.dia) filters.dia = req.query.dia;

      const restricciones = await RestriccionModel.getAll(filters);
      success(res, restricciones, 'Restricciones obtenidas correctamente');
    } catch (err) {
      console.error(err);
      error(res, 'Error al obtener restricciones', 500);
    }
  },

  create: async (req, res) => {
    try {
      const errores = validarRestriccion(req.body);
      if (errores.length > 0) return error(res, 'Validación fallida', 400, errores);

      const docente_id = req.user.role === 'docente' ? req.user.id : Number(req.body.docente_id);
      if (!docente_id) return error(res, 'docente_id es requerido para admin', 400);

      const docente = await DocenteModel.getById(docente_id);
      if (!docente) return error(res, 'El docente no existe', 404);

      const { dia, hora_inicio, hora_fin, tipo_restriccion, motivo } = req.body;

      const solapamiento = await RestriccionModel.existeSolapamiento(docente_id, dia, hora_inicio, hora_fin);
      if (solapamiento) {
        return error(res, 'Ya existe una restricción que se solapa en ese rango de horario', 409);
      }

      const restriccion = await RestriccionModel.create({
        docente_id, dia, hora_inicio, hora_fin, tipo_restriccion, motivo,
      });

      success(res, restriccion, 'Restricción creada correctamente', 201);
    } catch (err) {
      console.error(err);
      error(res, 'Error al crear restricción', 500);
    }
  },

  remove: async (req, res) => {
    try {
      const { id } = req.params;
      if (!Number.isInteger(Number(id))) return error(res, 'id debe ser entero', 400);

      const docente_id = req.user.role === 'docente' ? req.user.id : null;
      const eliminada = await RestriccionModel.delete(id, docente_id);

      if (!eliminada) return error(res, 'Restricción no encontrada', 404);
      success(res, eliminada, 'Restricción eliminada correctamente');
    } catch (err) {
      console.error(err);
      error(res, 'Error al eliminar restricción', 500);
    }
  },
};

module.exports = RestriccionesController;
