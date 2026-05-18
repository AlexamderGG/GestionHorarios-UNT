const ConfiguracionModel = require('../models/configuracion.model');
const { success, error } = require('../utils/responseHelper');

const CLAVES_VALIDAS = [
  'dias_habiles',
  'hora_inicio',
  'hora_fin',
  'duracion_bloque',
  'bloques_por_dia',
  'demo_mode',
  'demo_turno_actual',
  'demo_step_minutes',
  'seleccion_abierta',
];

const validarConfiguracion = (data) => {
  const errores = [];
  const { clave, valor } = data;

  if (!clave || !CLAVES_VALIDAS.includes(clave)) {
    errores.push(`clave es requerida y debe ser una de: ${CLAVES_VALIDAS.join(', ')}`);
  }
  if (valor === undefined || valor === null || String(valor).trim().length === 0) {
    errores.push('valor es requerido');
  }

  // Validaciones específicas por clave
  if (clave === 'duracion_bloque' || clave === 'bloques_por_dia') {
    if (!Number.isInteger(Number(valor)) || Number(valor) < 1) {
      errores.push(`${clave} debe ser un entero >= 1`);
    }
  }
  if (clave === 'hora_inicio' || clave === 'hora_fin') {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(valor)) errores.push(`${clave} debe estar en formato HH:MM`);
  }

  return errores;
};

const ConfiguracionController = {
  getAll: async (req, res) => {
    try {
      const config = await ConfiguracionModel.getConfiguracionCompleta();
      success(res, config, 'Configuración obtenida correctamente');
    } catch (err) {
      console.error(err);
      error(res, 'Error al obtener configuración', 500);
    }
  },

  update: async (req, res) => {
    try {
      const { configuracion } = req.body;
      if (!configuracion || typeof configuracion !== 'object') {
        return error(res, 'Se requiere un objeto "configuracion" en el body', 400);
      }

      const resultados = [];
      const erroresGlobales = [];

      for (const [clave, valor] of Object.entries(configuracion)) {
        const errores = validarConfiguracion({ clave, valor });
        if (errores.length > 0) {
          erroresGlobales.push({ clave, errores });
          continue;
        }
        const actualizado = await ConfiguracionModel.update(clave, String(valor));
        if (actualizado) resultados.push(actualizado);
      }

      if (erroresGlobales.length > 0) {
        return error(res, 'Algunas claves tienen errores de validación', 400, erroresGlobales);
      }

      const configActualizada = await ConfiguracionModel.getConfiguracionCompleta();
      success(res, configActualizada, 'Configuración actualizada correctamente');
    } catch (err) {
      console.error(err);
      error(res, 'Error al actualizar configuración', 500);
    }
  }
};

module.exports = ConfiguracionController;
