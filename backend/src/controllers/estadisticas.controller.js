const HorarioModel = require('../models/horario.model');
const ConfiguracionModel = require('../models/configuracion.model');
const { success, error } = require('../utils/responseHelper');

const EstadisticasController = {
  getAll: async (req, res) => {
    try {
      const { semestre } = req.query;
      const estadisticasBase = await HorarioModel.getEstadisticas(semestre || null);
      const configuracion = await ConfiguracionModel.getConfiguracionCompleta();

      const totalAmbientes =
        Number(estadisticasBase.totales.total_aulas || 0) + Number(estadisticasBase.totales.total_laboratorios || 0);
      const dias = Array.isArray(configuracion.dias_habiles) ? configuracion.dias_habiles.length : 5;
      const bloquesPorDia = Number(configuracion.bloques_por_dia || 0);
      const capacidadTotalBloques = totalAmbientes * dias * bloquesPorDia;
      const ocupacion = capacidadTotalBloques > 0
        ? Number(((estadisticasBase.total_horarios / capacidadTotalBloques) * 100).toFixed(2))
        : 0;

      success(res, {
        total_docentes: Number(estadisticasBase.totales.total_docentes || 0),
        total_cursos: Number(estadisticasBase.totales.total_cursos || 0),
        total_aulas: Number(estadisticasBase.totales.total_aulas || 0),
        total_laboratorios: Number(estadisticasBase.totales.total_laboratorios || 0),
        ocupacion_aulas: ocupacion,
        distribucion_teoria_lab: estadisticasBase.distribucion,
        carga_por_docente: estadisticasBase.carga_por_docente,
        uso_por_ambiente: estadisticasBase.uso_por_ambiente,
      }, 'Estadísticas obtenidas correctamente');
    } catch (err) {
      console.error(err);
      error(res, 'Error al obtener estadísticas', 500);
    }
  },
};

module.exports = EstadisticasController;
