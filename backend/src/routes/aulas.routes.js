const express = require('express');
const router = express.Router();
const AulaController = require('../controllers/aula.controller');

/**
 * @route   GET /api/aulas
 * @desc    Listar todas las aulas activas
 * @module  Modulo 1 - Gestion de datos maestros
 */
router.get('/', AulaController.getAll);

/**
 * @route   GET /api/aulas/:id
 * @desc    Obtener un aula por ID
 * @module  Modulo 1
 */
router.get('/:id', AulaController.getById);

/**
 * @route   POST /api/aulas
 * @desc    Crear un nuevo aula
 * @module  Modulo 1
 * @body    { codigo, nombre, capacidad, ubicacion, tipo }
 */
router.post('/', AulaController.create);

/**
 * @route   PUT /api/aulas/:id
 * @desc    Actualizar un aula
 * @module  Modulo 1
 */
router.put('/:id', AulaController.update);

/**
 * @route   DELETE /api/aulas/:id
 * @desc    Eliminar (soft-delete) un aula
 * @module  Modulo 1
 */
router.delete('/:id', AulaController.delete);

module.exports = router;
