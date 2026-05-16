const pool = require('../config/db');

const ConfiguracionModel = {
  getAll: async () => {
    const result = await pool.query('SELECT * FROM configuracion ORDER BY clave');
    return result.rows;
  },

  getByClave: async (clave) => {
    const result = await pool.query('SELECT * FROM configuracion WHERE clave = $1', [clave]);
    return result.rows[0] || null;
  },

  update: async (clave, valor) => {
    const result = await pool.query(
      `UPDATE configuracion SET valor = $1, updated_at = CURRENT_TIMESTAMP WHERE clave = $2 RETURNING *`,
      [valor, clave]
    );
    return result.rows[0] || null;
  },

  upsert: async (clave, valor, descripcion) => {
    const result = await pool.query(
      `INSERT INTO configuracion (clave, valor, descripcion)
       VALUES ($1, $2, $3)
       ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [clave, valor, descripcion]
    );
    return result.rows[0];
  },

  getConfiguracionCompleta: async () => {
    const rows = await ConfiguracionModel.getAll();
    const config = {};
    rows.forEach(row => {
      if (row.clave === 'dias_habiles') {
        config[row.clave] = row.valor.split(',');
      } else if (row.clave === 'duracion_bloque' || row.clave === 'bloques_por_dia') {
        config[row.clave] = parseInt(row.valor, 10);
      } else {
        config[row.clave] = row.valor;
      }
    });
    return config;
  }
};

module.exports = ConfiguracionModel;
