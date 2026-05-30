const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión (docente por email o admin por usuario)
 */
router.post('/login', AuthController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Obtener datos del usuario autenticado
 */
router.get('/me', authenticate, AuthController.me);

/**
 * @route   PUT /api/auth/admin/password
 * @desc    Actualizar la contraseña del administrador con reglas de complejidad
 */
router.put('/admin/password', authenticate, AuthController.changeAdminPassword);

module.exports = router;