const CursoModel = require('../models/curso.model');
const { success, error } = require('../utils/responseHelper');

const validarCurso = (data, isUpdate = false) => {
  const errores = [];
  const { codigo, nombre, creditos, semestre, ciclo } = data;

  if (!isUpdate || codigo !== undefined) {
    if (!codigo || codigo.trim().length < 2) errores.push('codigo es requerido (min 2 caracteres)');
  }
  if (!isUpdate || nombre !== undefined) {
    if (!nombre || nombre.trim().length < 3) errores.push('nombre es requerido (min 3 caracteres)');
  }
  if (!isUpdate || creditos !== undefined) {
    if (creditos === undefined || creditos < 1 || !Number.isInteger(Number(creditos))) errores.push('creditos debe ser un entero >= 1');
  }
  if (!isUpdate || semestre !== undefined) {
    if (semestre === undefined || semestre < 1 || semestre > 10 || !Number.isInteger(Number(semestre))) errores.push('semestre debe ser un entero entre 1 y 10');
  }
  if (!isUpdate || ciclo !== undefined) {
    if (!ciclo || ciclo.trim().length < 1) errores.push('ciclo es requerido');
  }

  return errores;
};

const CursoController = {
  getAll: async (req, res) => {
    try {
      const cursos = await CursoModel.getAll();
      success(res, cursos, 'Cursos obtenidos correctamente');
    } catch (err) {
      error(res, 'Error al obtener cursos', 500);
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const curso = await CursoModel.getById(id);
      if (!curso) return error(res, 'Curso no encontrado', 404);
      success(res, curso, 'Curso obtenido correctamente');
    } catch (err) {
      error(res, 'Error al obtener curso', 500);
    }
  },

  create: async (req, res) => {
    try {
      const errores = validarCurso(req.body);
      if (errores.length > 0) return error(res, 'Validación fallida', 400, errores);

      const { codigo } = req.body;
      const existe = await CursoModel.existsByCodigo(codigo);
      if (existe) return error(res, 'Ya existe un curso con ese código', 409);

      const curso = await CursoModel.create(req.body);
      success(res, curso, 'Curso creado correctamente', 201);
    } catch (err) {
      console.error(err);
      error(res, 'Error al crear curso', 500);
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const errores = validarCurso(req.body, true);
      if (errores.length > 0) return error(res, 'Validación fallida', 400, errores);

      const cursoExistente = await CursoModel.getById(id);
      if (!cursoExistente) return error(res, 'Curso no encontrado', 404);

      if (req.body.codigo) {
        const existe = await CursoModel.existsByCodigo(req.body.codigo, id);
        if (existe) return error(res, 'Ya existe otro curso con ese código', 409);
      }

      const data = { ...cursoExistente, ...req.body };
      const curso = await CursoModel.update(id, data);
      success(res, curso, 'Curso actualizado correctamente');
    } catch (err) {
      console.error(err);
      error(res, 'Error al actualizar curso', 500);
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const curso = await CursoModel.getById(id);
      if (!curso) return error(res, 'Curso no encontrado', 404);

      await CursoModel.delete(id);
      success(res, null, 'Curso eliminado correctamente');
    } catch (err) {
      error(res, 'Error al eliminar curso', 500);
    }
  }
};

module.exports = CursoController;
