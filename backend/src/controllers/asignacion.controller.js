const AsignacionModel = require('../models/asignacion.model');
const DocenteModel = require('../models/docente.model');
const CursoModel = require('../models/curso.model');
const AulaModel = require('../models/aula.model');
const LaboratorioModel = require('../models/laboratorio.model');
const { success, error } = require('../utils/responseHelper');

const TIPOS_ASIGNACION = ['Teoria', 'Laboratorio'];

const validarAsignacion = (data) => {
  const errores = [];
  const { docente_id, curso_id, tipo, ambiente_preferido_id, semestre_asignacion } = data;

  if (!docente_id || !Number.isInteger(Number(docente_id))) errores.push('docente_id es requerido y debe ser entero');
  if (!curso_id || !Number.isInteger(Number(curso_id))) errores.push('curso_id es requerido y debe ser entero');
  if (!TIPOS_ASIGNACION.includes(tipo)) errores.push(`tipo debe ser: ${TIPOS_ASIGNACION.join(', ')}`);
  if (!semestre_asignacion || semestre_asignacion.trim().length < 1) errores.push('semestre_asignacion es requerido');
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

      // Validar duplicado
      const duplicado = await AsignacionModel.existsDuplicate(docente_id, curso_id, tipo, semestre_asignacion);
      if (duplicado) return error(res, 'Ya existe una asignación de este tipo para el docente, curso y semestre', 409);

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
  }
};

module.exports = AsignacionController;
