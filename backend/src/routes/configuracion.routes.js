const express = require('express');
const router = express.Router();
const ConfiguracionController = require('../controllers/configuracion.controller');
const { authenticate, requireRole } = require('../middleware/auth');

/**
 * @route   GET /api/configuracion
 * @desc    Obtener configuracion del sistema (dias, horas, bloques)
 */
router.get('/', authenticate, ConfiguracionController.getAll);

/**
 * @route   PUT /api/configuracion
 * @desc    Actualizar configuracion
 * @body    { configuracion: { clave1: valor1, clave2: valor2, ... } }
 */
router.put('/', authenticate, requireRole('admin'), ConfiguracionController.update);

module.exports = router;
