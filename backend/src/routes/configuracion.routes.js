const express = require('express');
const router = express.Router();
const ConfiguracionController = require('../controllers/configuracion.controller');

/**
 * @route   GET /api/configuracion
 * @desc    Obtener configuracion del sistema (dias, horas, bloques)
 * @module  Modulo 1 - Gestion de datos maestros
 */
router.get('/', ConfiguracionController.getAll);

/**
 * @route   PUT /api/configuracion
 * @desc    Actualizar configuracion
 * @module  Modulo 1
 * @body    { configuracion: { clave1: valor1, clave2: valor2, ... } }
 */
router.put('/', ConfiguracionController.update);

module.exports = router;
