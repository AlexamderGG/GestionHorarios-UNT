const DocenteModel = require('../models/docente.model');
const { success, error } = require('../utils/responseHelper');

const CATEGORIAS_VALIDAS = ['Principal', 'Asociado', 'Auxiliar', 'Jefe de practica'];
const TIPOS_NOMBRAMIENTO = ['Nombrado', 'Contratado'];
const SEMESTRE_REGEX = /^\d{4}-[12]$/;

const validarDocente = (data, isUpdate = false) => {
  const errores = [];
  const { nombres, apellidos, email, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios } = data;

  if (!isUpdate || nombres !== undefined) {
    if (!nombres || nombres.trim().length < 2) errores.push('nombres es requerido (min 2 caracteres)');
  }
  if (!isUpdate || apellidos !== undefined) {
    if (!apellidos || apellidos.trim().length < 2) errores.push('apellidos es requerido (min 2 caracteres)');
  }
  if (!isUpdate || email !== undefined) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errores.push('email no es válido');
  }
  if (!isUpdate || categoria !== undefined) {
    if (!CATEGORIAS_VALIDAS.includes(categoria)) errores.push(`categoria debe ser una de: ${CATEGORIAS_VALIDAS.join(', ')}`);
  }
  if (!isUpdate || tipo_nombramiento !== undefined) {
    if (!TIPOS_NOMBRAMIENTO.includes(tipo_nombramiento)) errores.push(`tipo_nombramiento debe ser: ${TIPOS_NOMBRAMIENTO.join(', ')}`);
  }
  if (!isUpdate || antiguedad_anios !== undefined) {
    if (antiguedad_anios === undefined || antiguedad_anios < 0 || !Number.isInteger(Number(antiguedad_anios))) {
      errores.push('antiguedad_anios debe ser un entero >= 0');
    }
  }
  if (semestre_contrato !== undefined && semestre_contrato !== null && String(semestre_contrato).trim() !== '' && !SEMESTRE_REGEX.test(String(semestre_contrato).trim())) {
    errores.push('semestre_contrato debe tener formato YYYY-1 o YYYY-2');
  }

  return errores;
};

const DocenteController = {
  getAll: async (req, res) => {
    try {
      const docentes = await DocenteModel.getAll();
      success(res, docentes, 'Docentes obtenidos correctamente');
    } catch (err) {
      error(res, 'Error al obtener docentes', 500);
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const docente = await DocenteModel.getById(id);
      if (!docente) return error(res, 'Docente no encontrado', 404);
      success(res, docente, 'Docente obtenido correctamente');
    } catch (err) {
      error(res, 'Error al obtener docente', 500);
    }
  },

  create: async (req, res) => {
    try {
      const errores = validarDocente(req.body);
      if (errores.length > 0) return error(res, 'Validación fallida', 400, errores);

      const { email } = req.body;
      const existe = await DocenteModel.existsByEmail(email);
      if (existe) return error(res, 'Ya existe un docente con ese email', 409);

      const docente = await DocenteModel.create(req.body);
      success(res, docente, 'Docente creado correctamente', 201);
    } catch (err) {
      console.error(err);
      error(res, 'Error al crear docente', 500);
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const errores = validarDocente(req.body, true);
      if (errores.length > 0) return error(res, 'Validación fallida', 400, errores);

      const docenteExistente = await DocenteModel.getById(id);
      if (!docenteExistente) return error(res, 'Docente no encontrado', 404);

      if (req.body.email) {
        const existe = await DocenteModel.existsByEmail(req.body.email, id);
        if (existe) return error(res, 'Ya existe otro docente con ese email', 409);
      }

      const data = { ...docenteExistente, ...req.body };
      const docente = await DocenteModel.update(id, data);
      success(res, docente, 'Docente actualizado correctamente');
    } catch (err) {
      console.error(err);
      error(res, 'Error al actualizar docente', 500);
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const docente = await DocenteModel.getById(id);
      if (!docente) return error(res, 'Docente no encontrado', 404);

      await DocenteModel.delete(id);
      success(res, null, 'Docente eliminado correctamente');
    } catch (err) {
      error(res, 'Error al eliminar docente', 500);
    }
  },

  // Endpoint para obtener docentes disponibles por especialidad
  getDisponibles: async (req, res) => {
    try {
      const { especialidad } = req.query;
      
      if (especialidad) {
        const docentes = await DocenteModel.getDisponiblesPorEspecialidad(especialidad);
        success(res, docentes, 'Docentes disponibles obtenidos');
      } else {
        const docentes = await DocenteModel.getDisponiblesPorSemestre();
        success(res, docentes, 'Docentes disponibles obtenidos');
      }
    } catch (err) {
      console.error(err);
      error(res, 'Error al obtener docentes disponibles', 500);
    }
  },
};

module.exports = DocenteController;
