const express = require('express');
const router = express.Router();
const SecretariaController = require('../controllers/secretaria.controller');

// Obtener la lista ordenada
router.get('/docentes-escalafon', SecretariaController.getEscalafon);

// Habilitar turno de un docente por ID
router.post('/habilitar-turno/:id', SecretariaController.habilitarTurno);

module.exports = router;