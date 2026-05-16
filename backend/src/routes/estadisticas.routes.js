const express = require('express');
const router = express.Router();
const { success } = require('../utils/responseHelper');

/**
 * @route   GET /api/estadisticas
 * @desc    Obtener estadisticas para el dashboard
 * @module  Modulo 2 / Modulo 3
 * @query   periodo?
 */
router.get('/', (req, res) => {
  // TODO: Implementar en Modulo 2 o 3 (segun se acuerde)
  // Datos de ejemplo para que Modulo 3 pueda desarrollar el frontend
  success(res, {
    total_docentes: 0,
    total_cursos: 0,
    total_aulas: 0,
    total_laboratorios: 0,
    ocupacion_aulas: 0,
    distribucion_teoria_lab: { teoria: 0, laboratorio: 0 },
    carga_por_docente: [],
    uso_por_ambiente: []
  }, 'Endpoint de estadisticas - datos de ejemplo');
});

module.exports = router;
