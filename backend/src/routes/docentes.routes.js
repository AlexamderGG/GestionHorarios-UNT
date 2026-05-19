const express = require('express');
const router = express.Router();
const DocenteController = require('../controllers/docente.controller');

/**
 * @route   GET /api/docentes
 * @desc    Listar todos los docentes activos
 * @module  Modulo 1 - Gestion de datos maestros
 */
router.get('/', DocenteController.getAll);

/**
 * @route   GET /api/docentes/disponibles
 * @desc    Obtener docentes disponibles por especialidad y semestre
 * @query   especialidad, semestre
 * @module  Modulo 1
 */
router.get('/disponibles', DocenteController.getDisponibles);

/**
 * @route   GET /api/docentes/:id
 * @desc    Obtener un docente por ID
 * @module  Modulo 1
 */
router.get('/:id', DocenteController.getById);

/**
 * @route   POST /api/docentes
 * @desc    Crear un nuevo docente
 * @module  Modulo 1
 * @body    { nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios }
 */
router.post('/', DocenteController.create);

/**
 * @route   PUT /api/docentes/:id
 * @desc    Actualizar un docente
 * @module  Modulo 1
 */
router.put('/:id', DocenteController.update);

/**
 * @route   DELETE /api/docentes/:id
 * @desc    Eliminar (soft-delete) un docente
 * @module  Modulo 1
 */
router.delete('/:id', DocenteController.delete);

module.exports = router;
