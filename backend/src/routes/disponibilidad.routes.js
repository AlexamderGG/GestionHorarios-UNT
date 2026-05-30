const express = require('express');
const router = express.Router();
const DisponibilidadController = require('../controllers/disponibilidad.controller');
const { authenticate, requireRole } = require('../middleware/auth');

// Todas las rutas requieren que el docente esté autenticado
router.get('/', authenticate, DisponibilidadController.getByDocente);
router.post('/', authenticate, DisponibilidadController.crear);
router.get('/analisis', authenticate, requireRole('admin'), DisponibilidadController.getAnalisisSecretaria);
router.delete('/:id', authenticate, DisponibilidadController.eliminar);

module.exports = router;