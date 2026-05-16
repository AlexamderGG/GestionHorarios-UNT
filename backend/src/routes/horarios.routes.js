const express = require('express');
const router = express.Router();
const { success } = require('../utils/responseHelper');

/**
 * @route   GET /api/horarios
 * @desc    Obtener horarios generados (filtrable por docente, aula, dia)
 * @module  Modulo 2 - Algoritmo de asignacion
 * @query   docente_id, aula_id, laboratorio_id, dia
 */
router.get('/', (req, res) => {
  // TODO: Implementar en Modulo 2
  success(res, [], 'Endpoint de horarios - pendiente de implementacion');
});

/**
 * @route   POST /api/horarios/generar
 * @desc    Ejecutar algoritmo de generacion automatica de horarios
 * @module  Modulo 2
 * @body    { semestre?, anio? }
 */
router.post('/generar', (req, res) => {
  // TODO: Implementar en Modulo 2
  success(res, { generados: 0 }, 'Generacion de horarios (mock) - pendiente de implementacion');
});

/**
 * @route   PUT /api/horarios/:id
 * @desc    Editar manualmente un horario asignado
 * @module  Modulo 2 (backend) / Modulo 4 (frontend)
 * @body    { dia, hora_inicio, hora_fin, aula_id?, laboratorio_id? }
 */
router.put('/:id', (req, res) => {
  // TODO: Implementar en Modulo 2
  success(res, req.body, 'Horario actualizado (mock) - pendiente de implementacion');
});

module.exports = router;
