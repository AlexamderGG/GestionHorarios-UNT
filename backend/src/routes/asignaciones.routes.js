const express = require('express');
const router = express.Router();
const { success } = require('../utils/responseHelper');

/**
 * @route   GET /api/asignaciones
 * @desc    Listar asignaciones docente-curso
 * @module  Modulo 1 - Gestion de datos maestros
 */
router.get('/', (req, res) => {
  // TODO: Implementar en Modulo 1
  success(res, [], 'Endpoint de asignaciones - pendiente de implementacion');
});

/**
 * @route   POST /api/asignaciones
 * @desc    Asignar un curso a un docente (teoria o laboratorio)
 * @module  Modulo 1
 * @body    { docente_id, curso_id, tipo, ambiente_preferido_id? }
 */
router.post('/', (req, res) => {
  // TODO: Implementar en Modulo 1
  success(res, req.body, 'Asignacion creada (mock) - pendiente de implementacion', 201);
});

/**
 * @route   DELETE /api/asignaciones/:id
 * @desc    Eliminar una asignacion
 * @module  Modulo 1
 */
router.delete('/:id', (req, res) => {
  // TODO: Implementar en Modulo 1
  success(res, null, 'Asignacion eliminada (mock) - pendiente de implementacion');
});

module.exports = router;
