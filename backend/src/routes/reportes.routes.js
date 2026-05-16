const express = require('express');
const router = express.Router();
const { success } = require('../utils/responseHelper');

/**
 * @route   GET /api/reportes/operacional
 * @desc    Reporte operacional: horarios por aula/laboratorio, dia y hora
 * @module  Modulo 4 - Reportes (o Modulo 2 si se decide)
 * @query   formato=json|pdf, semestre?, anio?
 */
router.get('/operacional', (req, res) => {
  // TODO: Implementar en Modulo 4 (backend) para entregar datos/estructura PDF
  success(res, [], 'Reporte operacional - pendiente de implementacion');
});

/**
 * @route   GET /api/reportes/gestion
 * @desc    Reporte de gestion: resumen por docente (categoria, antiguedad, carga horaria)
 * @module  Modulo 4 - Reportes
 * @query   formato=json|pdf, semestre?, anio?
 */
router.get('/gestion', (req, res) => {
  // TODO: Implementar en Modulo 4 (backend)
  success(res, [], 'Reporte de gestion - pendiente de implementacion');
});

/**
 * @route   GET /api/reportes/docente/:docente_id
 * @desc    Horario individual de un docente (para PDF)
 * @module  Modulo 4 - Reportes
 * @query   formato=json|pdf, semestre?, anio?
 */
router.get('/docente/:docente_id', (req, res) => {
  // TODO: Implementar en Modulo 4 (backend)
  success(res, [], 'Reporte por docente - pendiente de implementacion');
});

module.exports = router;
