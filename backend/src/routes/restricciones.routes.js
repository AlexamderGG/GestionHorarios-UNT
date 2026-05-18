const express = require('express');
const router = express.Router();
const RestriccionesController = require('../controllers/restricciones.controller');
const { authenticate } = require('../middleware/auth');

/**
 * @route   GET /api/restricciones
 * @desc    Listar restricciones (docente: solo las suyas, admin: todas o filtradas)
 */
router.get('/', authenticate, RestriccionesController.getAll);

/**
 * @route   POST /api/restricciones
 * @desc    Crear restricción horaria
 * @body    { dia, hora_inicio, hora_fin, tipo_restriccion?, motivo?, docente_id? }
 */
router.post('/', authenticate, RestriccionesController.create);

/**
 * @route   DELETE /api/restricciones/:id
 * @desc    Eliminar restricción (docente: solo las suyas, admin: cualquiera)
 */
router.delete('/:id', authenticate, RestriccionesController.remove);

module.exports = router;
