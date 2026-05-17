const express = require('express');
const router = express.Router();
const EstadisticasController = require('../controllers/estadisticas.controller');

/**
 * @route   GET /api/estadisticas
 * @desc    Obtener estadisticas reales para el dashboard
 * @module  Modulo 2 / Modulo 3
 * @query   semestre?
 */
router.get('/', EstadisticasController.getAll);

module.exports = router;
