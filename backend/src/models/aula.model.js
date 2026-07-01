const pool = require('../config/db');

const AulaModel = {
  getAll: async () => {
    // Se quitó la condición "WHERE activa = TRUE" para que siempre devuelva todo lo que existe
    const result = await pool.query('SELECT * FROM aulas ORDER BY codigo');
    return result.rows;
  },

  getById: async (id) => {
    const result = await pool.query('SELECT * FROM aulas WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  create: async (data) => {
    const { codigo, nombre, capacidad, ubicacion, tipo } = data;
    const result = await pool.query(
      `INSERT INTO aulas (codigo, nombre, capacidad, ubicacion, tipo)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [codigo, nombre, capacidad, ubicacion, tipo]
    );
    return result.rows[0];
  },

  update: async (id, data) => {
    // Se quitó el campo "activa" de la actualización ya que no lo usaremos
    const { codigo, nombre, capacidad, ubicacion, tipo } = data;
    const result = await pool.query(
      `UPDATE aulas 
       SET codigo = $1, nombre = $2, capacidad = $3, ubicacion = $4, tipo = $5
       WHERE id = $6 RETURNING *`,
      [codigo, nombre, capacidad, ubicacion, tipo, id]
    );
    return result.rows[0] || null;
  },

  delete: async (id) => {
    // AHORA SÍ HACE UN HARD DELETE (Elimina la fila físicamente de la base de datos)
    const result = await pool.query(
      'DELETE FROM aulas WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  },

  existsByCodigo: async (codigo, excludeId = null) => {
    const query = excludeId
      ? 'SELECT 1 FROM aulas WHERE codigo = $1 AND id != $2'
      : 'SELECT 1 FROM aulas WHERE codigo = $1';
    const params = excludeId ? [codigo, excludeId] : [codigo];
    const result = await pool.query(query, params);
    return result.rowCount > 0;
  }
};

module.exports = AulaModel;