const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión (docente por email o admin por usuario)
 * @body    { email, password } para docente
 * @body    { usuario, password, role: 'admin' } para admin
 */
router.post('/login', AuthController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Obtener datos del usuario autenticado
 */
router.get('/me', authenticate, AuthController.me);

module.exports = router;
