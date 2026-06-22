const express = require('express');
const router = express.Router();
const cargaController = require('../controllers/carga.controller');
const { authenticate, requireRole } = require('../middleware/auth');

// Solo necesitamos que esté autenticado (el id del docente viene en el token)
router.get('/mi-carga', authenticate, cargaController.getMiCarga);
router.post('/mi-carga', authenticate, cargaController.guardarMiCarga);

// Admin: obtener carga completa de cualquier docente
router.get('/docente/:docente_id', authenticate, cargaController.getCargaDocente);

module.exports = router;