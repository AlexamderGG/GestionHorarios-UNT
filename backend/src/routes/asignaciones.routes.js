const express = require('express');
const router = express.Router();
const AsignacionController = require('../controllers/asignacion.controller');

/**
 * @route   GET /api/asignaciones
 * @desc    Listar asignaciones docente-curso con joins
 * @module  Modulo 1 - Gestion de datos maestros
 */
router.get('/', AsignacionController.getAll);

/**
 * @route   POST /api/asignaciones
 * @desc    Asignar un curso a un docente (teoria o laboratorio)
 * @module  Modulo 1
 * @body    { docente_id, curso_id, tipo, ambiente_preferido_id?, semestre_asignacion, observaciones? }
 */
router.post('/', AsignacionController.create);

/**
 * @route   POST /api/asignaciones/auto
 * @desc    Asignar automaticamente todos los cursos a docentes disponibles
 * @module  Modulo 1
 * @body    { semestre? }
 */
router.post('/auto', AsignacionController.asignarAutomaticamente);

/**
 * @route   POST /api/asignaciones/limpiar
 * @desc    Eliminar TODAS las asignaciones de un semestre
 * @module  Modulo 1
 * @body    { semestre? }
 */
router.post('/limpiar', AsignacionController.limpiarAsignaciones);

/**
 * @route   DELETE /api/asignaciones/:id
 * @desc    Eliminar una asignacion
 * @module  Modulo 1
 */
router.delete('/:id', AsignacionController.delete);

module.exports = router;
