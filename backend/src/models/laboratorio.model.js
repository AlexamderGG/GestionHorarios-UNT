const pool = require('../config/db');

const LaboratorioModel = {
  getAll: async () => {
    const result = await pool.query('SELECT * FROM laboratorios WHERE activo = TRUE ORDER BY codigo');
    return result.rows;
  },

  getById: async (id) => {
    const result = await pool.query('SELECT * FROM laboratorios WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  create: async (data) => {
    const { codigo, nombre, capacidad, ubicacion } = data;
    const result = await pool.query(
      `INSERT INTO laboratorios (codigo, nombre, capacidad, ubicacion)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [codigo, nombre, capacidad, ubicacion]
    );
    return result.rows[0];
  },

  update: async (id, data) => {
    const { codigo, nombre, capacidad, ubicacion, activo } = data;
    const result = await pool.query(
      `UPDATE laboratorios
       SET codigo = $1, nombre = $2, capacidad = $3, ubicacion = $4, activo = $5
       WHERE id = $6 RETURNING *`,
      [codigo, nombre, capacidad, ubicacion, activo, id]
    );
    return result.rows[0] || null;
  },

  delete: async (id) => {
    const result = await pool.query(
      'UPDATE laboratorios SET activo = FALSE WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  },

  existsByCodigo: async (codigo, excludeId = null) => {
    const query = excludeId
      ? 'SELECT 1 FROM laboratorios WHERE codigo = $1 AND id != $2'
      : 'SELECT 1 FROM laboratorios WHERE codigo = $1';
    const params = excludeId ? [codigo, excludeId] : [codigo];
    const result = await pool.query(query, params);
    return result.rowCount > 0;
  }
};

module.exports = LaboratorioModel;
