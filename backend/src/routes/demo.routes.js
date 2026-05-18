const express = require('express');
const router = express.Router();
const DemoController = require('../controllers/demo.controller');
const { authenticate, requireRole } = require('../middleware/auth');

/**
 * @route   GET /api/demo/estado
 * @desc    Obtener estado completo del demo (config + turnos)
 * @query   semestre
 */
router.get('/estado', authenticate, requireRole('admin'), DemoController.getEstado);

/**
 * @route   POST /api/demo/avanzar-turno
 * @desc    Avanzar al siguiente turno en modo demo
 */
router.post('/avanzar-turno', authenticate, requireRole('admin'), DemoController.avanzarTurno);

/**
 * @route   POST /api/demo/reset
 * @desc    Resetear demo al turno 1
 */
router.post('/reset', authenticate, requireRole('admin'), DemoController.reset);

module.exports = router;
