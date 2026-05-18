const ConfiguracionModel = require('../models/configuracion.model');
const HorarioModel = require('../models/horario.model');

const DemoService = {
  getEstadoDemo: async () => {
    const config = await ConfiguracionModel.getConfiguracionCompleta();
    return {
      demo_mode: config.demo_mode || false,
      demo_turno_actual: config.demo_turno_actual || 1,
      demo_step_minutes: config.demo_step_minutes || 15,
      seleccion_abierta: config.seleccion_abierta !== undefined ? config.seleccion_abierta : true,
    };
  },

  avanzarTurno: async () => {
    const estado = await DemoService.getEstadoDemo();
    const nuevoTurno = (estado.demo_turno_actual || 1) + 1;
    await ConfiguracionModel.upsert('demo_turno_actual', String(nuevoTurno), 'Turno actual en modo demo');
    return { ...estado, demo_turno_actual: nuevoTurno };
  },

  reset: async () => {
    await ConfiguracionModel.upsert('demo_turno_actual', '1', 'Turno actual en modo demo');
    return await DemoService.getEstadoDemo();
  },

  getDocenteTurnoActual: async (semestre) => {
    const estado = await DemoService.getEstadoDemo();
    if (!estado.demo_mode) return null;

    const asignaciones = await HorarioModel.getAsignacionesParaScheduling(semestre);

    const docentesMap = new Map();
    for (const a of asignaciones) {
      if (!docentesMap.has(a.docente_id)) {
        docentesMap.set(a.docente_id, {
          docente_id: a.docente_id,
          nombre: `${a.docente_nombres} ${a.docente_apellidos}`,
          categoria: a.categoria,
          tipo_nombramiento: a.tipo_nombramiento,
          antiguedad_anios: a.antiguedad_anios,
          cantidad_asignaciones: 0,
        });
      }
      docentesMap.get(a.docente_id).cantidad_asignaciones++;
    }

    const docentes = Array.from(docentesMap.values());
    let turnoIndex = 0;
    const turnos = [];

    for (const docente of docentes) {
      for (let i = 0; i < docente.cantidad_asignaciones; i++) {
        turnoIndex++;
        turnos.push({
          turno: turnoIndex,
          docente_id: docente.docente_id,
          nombre: docente.nombre,
          categoria: docente.categoria,
          tipo_nombramiento: docente.tipo_nombramiento,
        });
      }
    }

    const turnoActual = turnos.find(t => t.turno === estado.demo_turno_actual) || null;
    return { turnoActual, totalTurnos: turnos.length, turnos };
  },

  getTurnosAsignados: async (semestre) => {
    return DemoService.getDocenteTurnoActual(semestre);
  },
};

module.exports = DemoService;
