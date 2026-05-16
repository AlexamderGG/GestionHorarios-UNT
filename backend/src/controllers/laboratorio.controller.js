const LaboratorioModel = require('../models/laboratorio.model');
const { success, error } = require('../utils/responseHelper');

const validarLaboratorio = (data, isUpdate = false) => {
  const errores = [];
  const { codigo, nombre, capacidad } = data;

  if (!isUpdate || codigo !== undefined) {
    if (!codigo || codigo.trim().length < 2) errores.push('codigo es requerido (min 2 caracteres)');
  }
  if (!isUpdate || nombre !== undefined) {
    if (!nombre || nombre.trim().length < 2) errores.push('nombre es requerido (min 2 caracteres)');
  }
  if (!isUpdate || capacidad !== undefined) {
    if (capacidad === undefined || capacidad < 1 || !Number.isInteger(Number(capacidad))) errores.push('capacidad debe ser un entero >= 1');
  }

  return errores;
};

const LaboratorioController = {
  getAll: async (req, res) => {
    try {
      const laboratorios = await LaboratorioModel.getAll();
      success(res, laboratorios, 'Laboratorios obtenidos correctamente');
    } catch (err) {
      error(res, 'Error al obtener laboratorios', 500);
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const lab = await LaboratorioModel.getById(id);
      if (!lab) return error(res, 'Laboratorio no encontrado', 404);
      success(res, lab, 'Laboratorio obtenido correctamente');
    } catch (err) {
      error(res, 'Error al obtener laboratorio', 500);
    }
  },

  create: async (req, res) => {
    try {
      const errores = validarLaboratorio(req.body);
      if (errores.length > 0) return error(res, 'Validación fallida', 400, errores);

      const { codigo } = req.body;
      const existe = await LaboratorioModel.existsByCodigo(codigo);
      if (existe) return error(res, 'Ya existe un laboratorio con ese código', 409);

      const lab = await LaboratorioModel.create(req.body);
      success(res, lab, 'Laboratorio creado correctamente', 201);
    } catch (err) {
      console.error(err);
      error(res, 'Error al crear laboratorio', 500);
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const errores = validarLaboratorio(req.body, true);
      if (errores.length > 0) return error(res, 'Validación fallida', 400, errores);

      const labExistente = await LaboratorioModel.getById(id);
      if (!labExistente) return error(res, 'Laboratorio no encontrado', 404);

      if (req.body.codigo) {
        const existe = await LaboratorioModel.existsByCodigo(req.body.codigo, id);
        if (existe) return error(res, 'Ya existe otro laboratorio con ese código', 409);
      }

      const data = { ...labExistente, ...req.body };
      const lab = await LaboratorioModel.update(id, data);
      success(res, lab, 'Laboratorio actualizado correctamente');
    } catch (err) {
      console.error(err);
      error(res, 'Error al actualizar laboratorio', 500);
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const lab = await LaboratorioModel.getById(id);
      if (!lab) return error(res, 'Laboratorio no encontrado', 404);

      await LaboratorioModel.delete(id);
      success(res, null, 'Laboratorio eliminado correctamente');
    } catch (err) {
      error(res, 'Error al eliminar laboratorio', 500);
    }
  }
};

module.exports = LaboratorioController;
