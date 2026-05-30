const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');

// Importar rutas de entidades
const authRoutes = require('./auth.routes');
const docentesRoutes = require('./docentes.routes');
const cursosRoutes = require('./cursos.routes');
const aulasRoutes = require('./aulas.routes');
const laboratoriosRoutes = require('./laboratorios.routes');
const asignacionesRoutes = require('./asignaciones.routes');
const horariosRoutes = require('./horarios.routes');
const estadisticasRoutes = require('./estadisticas.routes');
const reportesRoutes = require('./reportes.routes');
const configuracionRoutes = require('./configuracion.routes');
const docenteAuthRoutes = require('./docente-auth.routes');
const demoRoutes = require('./demo.routes');
const secretariaRoutes = require('./secretaria.routes');
const excepcionRoutes = require('./excepcion.routes');

// Rutas públicas
router.use('/auth', authRoutes);

// Rutas protegidas - admin (datos maestros)
router.use('/docentes', authenticate, requireRole('admin'), docentesRoutes);
router.use('/cursos', authenticate, requireRole('admin'), cursosRoutes);
router.use('/aulas', authenticate, requireRole('admin'), aulasRoutes);
router.use('/laboratorios', authenticate, requireRole('admin'), laboratoriosRoutes);
router.use('/asignaciones', authenticate, requireRole('admin'), asignacionesRoutes);
router.use('/estadisticas', authenticate, requireRole('admin'), estadisticasRoutes);
router.use('/reportes', authenticate, requireRole('admin'), reportesRoutes);
router.use('/configuracion', configuracionRoutes);
router.use('/demo', demoRoutes);

// Rutas protegidas - horarios (GET abierto, el resto en el propio router)
router.use('/horarios', horariosRoutes);

// Rutas protegidas - docente autenticado (Maneja mis-cursos, perfil, etc.)
router.use('/docente', docenteAuthRoutes);

// CORRECCIÓN: Separamos las excepciones a su propio prefijo limpio
// Esto evitará conflictos con docenteAuthRoutes y se mapeará en el front como /api/excepciones
router.use('/excepciones', excepcionRoutes);

// Rutas protegidas - secretaría
router.use('/secretaria', secretariaRoutes);

module.exports = router;