const express = require('express');
const router = express.Router();

// Importar rutas de entidades
const docentesRoutes = require('./docentes.routes');
const cursosRoutes = require('./cursos.routes');
const aulasRoutes = require('./aulas.routes');
const laboratoriosRoutes = require('./laboratorios.routes');
const asignacionesRoutes = require('./asignaciones.routes');
const horariosRoutes = require('./horarios.routes');
const estadisticasRoutes = require('./estadisticas.routes');
const reportesRoutes = require('./reportes.routes');
const configuracionRoutes = require('./configuracion.routes');

// Montar rutas
router.use('/docentes', docentesRoutes);
router.use('/cursos', cursosRoutes);
router.use('/aulas', aulasRoutes);
router.use('/laboratorios', laboratoriosRoutes);
router.use('/asignaciones', asignacionesRoutes);
router.use('/horarios', horariosRoutes);
router.use('/estadisticas', estadisticasRoutes);
router.use('/reportes', reportesRoutes);
router.use('/configuracion', configuracionRoutes);

module.exports = router;
