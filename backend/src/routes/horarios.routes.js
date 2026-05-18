const express = require('express');
const router = express.Router();
const HorariosController = require('../controllers/horarios.controller');
const { authenticate, requireRole } = require('../middleware/auth');

/**
 * @route   GET /api/horarios
 * @desc    Obtener horarios generados filtrables por docente, aula, laboratorio, dia y semestre
 * @query   docente_id, aula_id, laboratorio_id, dia, semestre
 */
router.get('/', HorariosController.getAll);

/**
 * @route   GET /api/horarios/estado-seleccion
 * @desc    Estado de selección de horarios por docente
 * @query   semestre
 */
router.get('/estado-seleccion', authenticate, requireRole('admin'), HorariosController.getEstadoSeleccion);

/**
 * @route   POST /api/horarios/generar
 * @desc    Ejecutar algoritmo de generacion automatica de horarios
 * @body    { semestre?, forzar? }
 */
router.post('/generar', authenticate, requireRole('admin'), HorariosController.generar);

/**
 * @route   PUT /api/horarios/:id
 * @desc    Editar manualmente un horario asignado validando cruces
 * @body    { dia?, hora_inicio?, hora_fin?, aula_id?, laboratorio_id? }
 */
router.put('/:id', authenticate, requireRole('admin'), HorariosController.update);

/**
 * @route   DELETE /api/horarios/:id
 * @desc    Eliminar un horario
 */
router.delete('/:id', authenticate, requireRole('admin'), HorariosController.remove);

module.exports = router;
