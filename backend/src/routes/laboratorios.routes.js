const express = require('express');
const router = express.Router();
const { success } = require('../utils/responseHelper');

/**
 * @route   GET /api/laboratorios
 * @desc    Listar todos los laboratorios
 * @module  Modulo 1 - Gestion de datos maestros
 */
router.get('/', (req, res) => {
  // TODO: Implementar en Modulo 1
  success(res, [], 'Endpoint de laboratorios - pendiente de implementacion');
});

/**
 * @route   GET /api/laboratorios/:id
 * @desc    Obtener un laboratorio por ID
 * @module  Modulo 1
 */
router.get('/:id', (req, res) => {
  // TODO: Implementar en Modulo 1
  success(res, null, 'Endpoint de laboratorio por ID - pendiente de implementacion');
});

/**
 * @route   POST /api/laboratorios
 * @desc    Crear un nuevo laboratorio
 * @module  Modulo 1
 */
router.post('/', (req, res) => {
  // TODO: Implementar en Modulo 1
  success(res, req.body, 'Laboratorio creado (mock) - pendiente de implementacion', 201);
});

/**
 * @route   PUT /api/laboratorios/:id
 * @desc    Actualizar un laboratorio
 * @module  Modulo 1
 */
router.put('/:id', (req, res) => {
  // TODO: Implementar en Modulo 1
  success(res, req.body, 'Laboratorio actualizado (mock) - pendiente de implementacion');
});

/**
 * @route   DELETE /api/laboratorios/:id
 * @desc    Eliminar un laboratorio
 * @module  Modulo 1
 */
router.delete('/:id', (req, res) => {
  // TODO: Implementar en Modulo 1
  success(res, null, 'Laboratorio eliminado (mock) - pendiente de implementacion');
});

module.exports = router;
