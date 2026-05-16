const express = require('express');
const router = express.Router();
const CursoController = require('../controllers/curso.controller');

/**
 * @route   GET /api/cursos
 * @desc    Listar todos los cursos activos
 * @module  Modulo 1 - Gestion de datos maestros
 */
router.get('/', CursoController.getAll);

/**
 * @route   GET /api/cursos/:id
 * @desc    Obtener un curso por ID
 * @module  Modulo 1
 */
router.get('/:id', CursoController.getById);

/**
 * @route   POST /api/cursos
 * @desc    Crear un nuevo curso
 * @module  Modulo 1
 * @body    { codigo, nombre, creditos, semestre, ciclo }
 */
router.post('/', CursoController.create);

/**
 * @route   PUT /api/cursos/:id
 * @desc    Actualizar un curso
 * @module  Modulo 1
 */
router.put('/:id', CursoController.update);

/**
 * @route   DELETE /api/cursos/:id
 * @desc    Eliminar (soft-delete) un curso
 * @module  Modulo 1
 */
router.delete('/:id', CursoController.delete);

module.exports = router;
