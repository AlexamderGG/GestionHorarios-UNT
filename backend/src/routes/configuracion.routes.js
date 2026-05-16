const express = require('express');
const router = express.Router();
const { success } = require('../utils/responseHelper');

/**
 * @route   GET /api/configuracion
 * @desc    Obtener configuracion del sistema (dias, horas, bloques)
 * @module  Modulo 1 - Gestion de datos maestros
 */
router.get('/', (req, res) => {
  // TODO: Implementar en Modulo 1
  success(res, {
    dias_habiles: ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'],
    hora_inicio: '07:00',
    hora_fin: '22:00',
    duracion_bloque: 120, // minutos (2 horas)
    bloques_por_dia: 6
  }, 'Configuracion actual (mock) - pendiente de implementacion');
});

/**
 * @route   PUT /api/configuracion
 * @desc    Actualizar configuracion
 * @module  Modulo 1
 * @body    { dias_habiles, hora_inicio, hora_fin, duracion_bloque }
 */
router.put('/', (req, res) => {
  // TODO: Implementar en Modulo 1
  success(res, req.body, 'Configuracion actualizada (mock) - pendiente de implementacion');
});

module.exports = router;
