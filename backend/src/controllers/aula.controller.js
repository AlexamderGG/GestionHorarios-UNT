const AulaModel = require('../models/aula.model');
const { success, error } = require('../utils/responseHelper');

const TIPOS_AULA = ['Teoria', 'Auditorio', 'Seminario'];

const validarAula = (data, isUpdate = false) => {
  const errores = [];
  const { codigo, nombre, capacidad, tipo } = data;

  if (!isUpdate || codigo !== undefined) {
    if (!codigo || codigo.trim().length < 2) errores.push('codigo es requerido (min 2 caracteres)');
  }
  if (!isUpdate || nombre !== undefined) {
    if (!nombre || nombre.trim().length < 2) errores.push('nombre es requerido (min 2 caracteres)');
  }
  if (!isUpdate || capacidad !== undefined) {
    if (capacidad === undefined || capacidad < 1 || !Number.isInteger(Number(capacidad))) errores.push('capacidad debe ser un entero >= 1');
  }
  if (tipo !== undefined && !TIPOS_AULA.includes(tipo)) {
    errores.push(`tipo debe ser una de: ${TIPOS_AULA.join(', ')}`);
  }

  return errores;
};

const AulaController = {
  getAll: async (req, res) => {
    try {
      const aulas = await AulaModel.getAll();
      success(res, aulas, 'Aulas obtenidas correctamente');
    } catch (err) {
      error(res, 'Error al obtener aulas', 500);
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const aula = await AulaModel.getById(id);
      if (!aula) return error(res, 'Aula no encontrada', 404);
      success(res, aula, 'Aula obtenida correctamente');
    } catch (err) {
      error(res, 'Error al obtener aula', 500);
    }
  },

  create: async (req, res) => {
    try {
      const errores = validarAula(req.body);
      if (errores.length > 0) return error(res, 'Validación fallida', 400, errores);

      const { codigo } = req.body;
      const existe = await AulaModel.existsByCodigo(codigo);
      if (existe) return error(res, 'Ya existe un aula con ese código', 409);

      const aula = await AulaModel.create(req.body);
      success(res, aula, 'Aula creada correctamente', 201);
    } catch (err) {
      console.error(err);
      error(res, 'Error al crear aula', 500);
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const errores = validarAula(req.body, true);
      if (errores.length > 0) return error(res, 'Validación fallida', 400, errores);

      const aulaExistente = await AulaModel.getById(id);
      if (!aulaExistente) return error(res, 'Aula no encontrada', 404);

      if (req.body.codigo) {
        const existe = await AulaModel.existsByCodigo(req.body.codigo, id);
        if (existe) return error(res, 'Ya existe otra aula con ese código', 409);
      }

      const data = { ...aulaExistente, ...req.body };
      const aula = await AulaModel.update(id, data);
      success(res, aula, 'Aula actualizada correctamente');
    } catch (err) {
      console.error(err);
      error(res, 'Error al actualizar aula', 500);
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const aula = await AulaModel.getById(id);
      if (!aula) return error(res, 'Aula no encontrada', 404);

      await AulaModel.delete(id);
      success(res, null, 'Aula eliminada correctamente');
    } catch (err) {
      error(res, 'Error al eliminar aula', 500);
    }
  }
};

module.exports = AulaController;
