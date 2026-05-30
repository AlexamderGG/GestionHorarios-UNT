const express = require('express');
const router = express.Router();
const HorariosController = require('../controllers/horarios.controller');
const { authenticate, requireRole } = require('../middleware/auth');

// =========================================================================
// 1. PRIORIDAD ALTA: Rutas estáticas específicas (Evita conflictos de enrutamiento)
// =========================================================================

/**
 * @route   GET /api/horarios/aulas
 * @desc    Obtener lista de aulas activas para el modal de secretaría
 */
router.get('/aulas', authenticate, HorariosController.getAulas);

/**
 * @route   GET /api/horarios/laboratorios
 * @desc    Obtener lista de laboratorios activos para el modal de secretaría
 */
router.get('/laboratorios', authenticate, HorariosController.getLaboratorios);

/**
 * @route   GET /api/horarios/estado-seleccion
 * @desc    Estado de selección de horarios por docente
 */
router.get('/estado-seleccion', authenticate, requireRole('admin'), HorariosController.getEstadoSeleccion);


// =========================================================================
// 2. PRIORIDAD MEDIA: Rutas base de la colección (Raíz '/')
// =========================================================================

/**
 * @route   GET /api/horarios
 * @desc    Obtener horarios generados filtrables por docente, aula, laboratorio, dia y semestre
 */
router.get('/', HorariosController.getAll);

/**
 * @route   POST /api/horarios
 * @desc    Crear manualmente un horario desde cero (Secretaría Académica)
 */
router.post('/', authenticate, requireRole('admin'), HorariosController.create);


// =========================================================================
// 3. PRIORIDAD MEDIA: Procesos automáticos y utilitarios
// =========================================================================

/**
 * @route   POST /api/horarios/generar
 * @desc    Ejecutar algoritmo de generacion automatica de horarios
 */
router.post('/generar', authenticate, requireRole('admin'), HorariosController.generar);

/**
 * @route   POST /api/horarios/limpiar
 * @desc    Eliminar TODOS los horarios de un semestre
 */
router.post('/limpiar', authenticate, requireRole('admin'), HorariosController.limpiar);

/**
 * @route   POST /api/horarios/reset-turnos
 * @desc    Reiniciar TODOS los turnos de los docentes a 'Pendiente' desde el panel
 * @note    CORREGIDO: Se acortó de '/reset-turnos-desde-panel' a '/reset-turnos' para sincronizar con el frontend
 */
router.post('/reset-turnos', authenticate, requireRole('admin'), HorariosController.resetTurnosDesdePanel);


// =========================================================================
// 4. PRIORIDAD BAJA: Rutas con parámetros dinámicos (SIEMPRE AL FINAL)
// =========================================================================

/**
 * @route   PUT /api/horarios/docente-editar/:id
 * @desc    Permite al docente editar su propio horario en su turno activo sin privilegios de admin
 * @note    NUEVO ENDPOINT BLINDADO PARA DOCENTES
 */
router.put('/docente-editar/:id', authenticate, HorariosController.editarMiHorarioDocente);

/**
 * @route   PUT /api/horarios/:id
 * @desc    Editar manualmente un horario asignado validando cruces y duración
 */
router.put('/:id', authenticate, requireRole('admin'), HorariosController.update);

/**
 * @route   DELETE /api/horarios/:id
 * @desc    Eliminar un horario del calendario
 */
router.delete('/:id', authenticate, requireRole('admin'), HorariosController.remove);

router.get("/ambientes-disponibilidad", authenticate, HorariosController.verificarDisponibilidadAmbiente);

module.exports = router;