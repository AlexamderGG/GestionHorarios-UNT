const express = require('express');
const router = express.Router();
const DocenteAuthController = require('../controllers/docente-auth.controller');
const { authenticate, requireRole } = require('../middleware/auth');

/**
 * @route   GET /api/docente/mis-cursos
 * @desc    Cursos asignados al docente autenticado con estado de horario
 */
router.get('/mis-cursos', authenticate, requireRole('docente'), DocenteAuthController.getMisCursos);

/**
 * @route   GET /api/docente/mi-horario
 * @desc    Horarios del docente autenticado
 * @query   semestre
 */
router.get('/mi-horario', authenticate, requireRole('docente'), DocenteAuthController.getMiHorario);

/**
 * @route   POST /api/docente/seleccionar
 * @desc    Seleccionar un horario para una asignación propia
 * @body    { asignacion_id, dia, hora_inicio, hora_fin, aula_id?, laboratorio_id? }
 */
router.post('/seleccionar', authenticate, requireRole('docente'), DocenteAuthController.seleccionarHorario);

/**
 * @route   DELETE /api/docente/horario/:id
 * @desc    Eliminar un horario propio (solo si no fue editado por admin)
 */
router.delete('/horario/:id', authenticate, requireRole('docente'), DocenteAuthController.eliminarMiHorario);

/**
 * @route   GET /api/docente/ambientes-disponibles
 * @desc    Aulas o labs libres en un día/hora específico
 * @query   asignacion_id, dia, hora_inicio, hora_fin, semestre?
 */
router.get('/ambientes-disponibles', authenticate, requireRole('docente'), DocenteAuthController.getAmbientesDisponibles);

/**
 * @route   GET /api/docente/mis-restricciones
 * @desc    Alias: restricciones del docente autenticado
 */


router.post('/finalizar-turno', authenticate, requireRole('docente'), DocenteAuthController.finalizarTurno);

router.get('/mi-estado', authenticate, requireRole('docente'), DocenteAuthController.getMiEstado);

module.exports = router;
