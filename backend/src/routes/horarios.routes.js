const express = require('express');
const router = express.Router();
const HorariosController = require('../controllers/horarios.controller');

/**
 * @route   GET /api/horarios
 * @desc    Obtener horarios generados filtrables por docente, aula, laboratorio, dia y semestre
 * @module  Modulo 2 - Algoritmo de asignacion
 * @query   docente_id, aula_id, laboratorio_id, dia, semestre
 */
router.get('/', HorariosController.getAll);

/**
 * @route   POST /api/horarios/generar
 * @desc    Ejecutar algoritmo de generacion automatica de horarios
 * @module  Modulo 2
 * @body    { semestre?, forzar? }
 */
router.post('/generar', HorariosController.generar);

/**
 * @route   PUT /api/horarios/:id
 * @desc    Editar manualmente un horario asignado validando cruces
 * @module  Modulo 2 (backend) / Modulo 4 (frontend)
 * @body    { dia?, hora_inicio?, hora_fin?, aula_id?, laboratorio_id? }
 */
router.put('/:id', HorariosController.update);

module.exports = router;
