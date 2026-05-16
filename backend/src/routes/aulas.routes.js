const express = require('express');
const router = express.Router();
const { success } = require('../utils/responseHelper');

/**
 * @route   GET /api/aulas
 * @desc    Listar todas las aulas
 * @module  Modulo 1 - Gestion de datos maestros
 */
router.get('/', (req, res) => {
  // TODO: Implementar en Modulo 1
  success(res, [], 'Endpoint de aulas - pendiente de implementacion');
});

/**
 * @route   GET /api/aulas/:id
 * @desc    Obtener un aula por ID
 * @module  Modulo 1
 */
router.get('/:id', (req, res) => {
  // TODO: Implementar en Modulo 1
  success(res, null, 'Endpoint de aula por ID - pendiente de implementacion');
});

/**
 * @route   POST /api/aulas
 * @desc    Crear un nuevo aula
 * @module  Modulo 1
 */
router.post('/', (req, res) => {
  // TODO: Implementar en Modulo 1
  success(res, req.body, 'Aula creada (mock) - pendiente de implementacion', 201);
});

/**
 * @route   PUT /api/aulas/:id
 * @desc    Actualizar un aula
 * @module  Modulo 1
 */
router.put('/:id', (req, res) => {
  // TODO: Implementar en Modulo 1
  success(res, req.body, 'Aula actualizada (mock) - pendiente de implementacion');
});

/**
 * @route   DELETE /api/aulas/:id
 * @desc    Eliminar un aula
 * @module  Modulo 1
 */
router.delete('/:id', (req, res) => {
  // TODO: Implementar en Modulo 1
  success(res, null, 'Aula eliminada (mock) - pendiente de implementacion');
});

module.exports = router;
