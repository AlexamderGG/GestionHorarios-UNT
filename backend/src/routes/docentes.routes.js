const express = require('express');
const router = express.Router();
const { success } = require('../utils/responseHelper');

/**
 * @route   GET /api/docentes
 * @desc    Listar todos los docentes
 * @module  Modulo 1 - Gestion de datos maestros
 */
router.get('/', (req, res) => {
  // TODO: Implementar en Modulo 1
  success(res, [], 'Endpoint de docentes - pendiente de implementacion');
});

/**
 * @route   GET /api/docentes/:id
 * @desc    Obtener un docente por ID
 * @module  Modulo 1
 */
router.get('/:id', (req, res) => {
  // TODO: Implementar en Modulo 1
  success(res, null, 'Endpoint de docente por ID - pendiente de implementacion');
});

/**
 * @route   POST /api/docentes
 * @desc    Crear un nuevo docente
 * @module  Modulo 1
 */
router.post('/', (req, res) => {
  // TODO: Implementar en Modulo 1
  success(res, req.body, 'Docente creado (mock) - pendiente de implementacion', 201);
});

/**
 * @route   PUT /api/docentes/:id
 * @desc    Actualizar un docente
 * @module  Modulo 1
 */
router.put('/:id', (req, res) => {
  // TODO: Implementar en Modulo 1
  success(res, req.body, 'Docente actualizado (mock) - pendiente de implementacion');
});

/**
 * @route   DELETE /api/docentes/:id
 * @desc    Eliminar un docente
 * @module  Modulo 1
 */
router.delete('/:id', (req, res) => {
  // TODO: Implementar en Modulo 1
  success(res, null, 'Docente eliminado (mock) - pendiente de implementacion');
});

module.exports = router;
