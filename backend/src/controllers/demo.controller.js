const DemoService = require("../services/demo.service");
const ConfiguracionModel = require("../models/configuracion.model");
const { success, error } = require("../utils/responseHelper");

const DemoController = {
  getEstado: async (req, res) => {
    try {
      const semestre = req.query.semestre || "2026-1";
      const estado = await DemoService.getEstadoDemo();
      const turnos = await DemoService.getTurnosAsignados(semestre);

      success(
        res,
        {
          config: estado,
          turnos: turnos || { turnoActual: null, totalTurnos: 0, turnos: [] },
        },
        "Estado del demo obtenido correctamente",
      );
    } catch (err) {
      console.error(err);
      error(res, "Error al obtener estado del demo", 500);
    }
  },

  avanzarTurno: async (req, res) => {
    try {
      const nuevoEstado = await DemoService.avanzarTurno();
      success(res, nuevoEstado, "Turno avanzado correctamente");
    } catch (err) {
      console.error(err);
      error(res, "Error al avanzar turno", 500);
    }
  },

  reset: async (req, res) => {
    try {
      const estado = await DemoService.reset();
      success(res, estado, "Demo reseteado correctamente");
    } catch (err) {
      console.error(err);
      error(res, "Error al resetear demo", 500);
    }
  },
};

module.exports = DemoController;
