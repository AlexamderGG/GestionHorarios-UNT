const express = require('express');
const router = express.Router();
const { success } = require('../utils/responseHelper');

/**
 * @route   GET /api/cursos
 * @desc    Listar todos los cursos
 * @module  Modulo 1 - Gestion de datos maestros
 */
router.get('/', (req, res) => {
  // TODO: Implementar en Modulo 1
  success(res, [], 'Endpoint de cursos - pendiente de implementacion');
});

/**
 * @route   GET /api/cursos/:id
 * @desc    Obtener un curso por ID
 * @module  Modulo 1
 */
router.get('/:id', (req, res) => {
  // TODO: Implementar en Modulo 1
  success(res, null, 'Endpoint de curso por ID - pendiente de implementacion');
});

/**
 * @route   POST /api/cursos
 * @desc    Crear un nuevo curso
 * @module  Modulo 1
 */
router.post('/', (req, res) => {
  // TODO: Implementar en Modulo 1
  success(res, req.body, 'Curso creado (mock) - pendiente de implementacion', 201);
});

/**
 * @route   PUT /api/cursos/:id
 * @desc    Actualizar un curso
 * @module  Modulo 1
 */
router.put('/:id', (req, res) => {
  // TODO: Implementar en Modulo 1
  success(res, req.body, 'Curso actualizado (mock) - pendiente de implementacion');
});

/**
 * @route   DELETE /api/cursos/:id
 * @desc    Eliminar un curso
 * @module  Modulo 1
 */
router.delete('/:id', (req, res) => {
  // TODO: Implementar en Modulo 1
  success(res, null, 'Curso eliminado (mock) - pendiente de implementacion');
});

module.exports = router;
