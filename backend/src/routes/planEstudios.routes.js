const express = require('express');
const router = express.Router();
const planEstudiosController = require('../controllers/planEstudios.controller');

// Usamos las nuevas funciones sin pasar por el validador viejo
router.get('/', planEstudiosController.obtenerCursos);
router.post('/', planEstudiosController.crearCurso);
router.put('/:id', planEstudiosController.actualizarCurso);
router.delete('/:id', planEstudiosController.eliminarCurso);

module.exports = router;