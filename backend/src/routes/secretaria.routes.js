const express = require('express');
const router = express.Router();
const SecretariaController = require('../controllers/secretaria.controller');
const ExcepcionController = require("../controllers/excepcion.controller");

const { authenticate, requireRole } = require('../middleware/auth');

// Obtener la lista ordenada
router.get('/docentes-escalafon', SecretariaController.getEscalafon);

// Habilitar turno de un docente por ID
router.post('/habilitar-turno/:id', SecretariaController.habilitarTurno);
// Ruta para el cambio manual (PUT)
router.put('/docentes/:id/estado', SecretariaController.cambiarEstadoManual);

// Endpoints exclusivos de Secretaría / Administrador
router.get("/excepciones", authenticate, requireRole("admin"), ExcepcionController.listarTodasAdmin);
router.patch("/excepciones/:id/estado", authenticate, requireRole("admin"), ExcepcionController.evaluarExcepcion);

// Agregar esta línea abajo de las rutas de excepciones existentes:
router.delete("/excepciones/:id", authenticate, requireRole("admin"), ExcepcionController.eliminarExcepcion);

router.get("/docentes-disponibles", authenticate, requireRole("admin"), SecretariaController.getDocentesDisponibles);

module.exports = router;