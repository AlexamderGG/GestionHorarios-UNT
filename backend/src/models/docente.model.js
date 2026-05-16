const pool = require('../config/db');

const DocenteModel = {
  getAll: async () => {
    const result = await pool.query(
      'SELECT * FROM docentes WHERE activo = TRUE ORDER BY tipo_nombramiento DESC, categoria, antiguedad_anios DESC'
    );
    return result.rows;
  },

  getById: async (id) => {
    const result = await pool.query('SELECT * FROM docentes WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  create: async (data) => {
    const { nombres, apellidos, email, telefono, categoria, tipo_nombramiento, antiguedad_anios } = data;
    const result = await pool.query(
      `INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, antiguedad_anios)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [nombres, apellidos, email, telefono, categoria, tipo_nombramiento, antiguedad_anios]
    );
    return result.rows[0];
  },

  update: async (id, data) => {
    const { nombres, apellidos, email, telefono, categoria, tipo_nombramiento, antiguedad_anios, activo } = data;
    const result = await pool.query(
      `UPDATE docentes 
       SET nombres = $1, apellidos = $2, email = $3, telefono = $4, 
           categoria = $5, tipo_nombramiento = $6, antiguedad_anios = $7, activo = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 RETURNING *`,
      [nombres, apellidos, email, telefono, categoria, tipo_nombramiento, antiguedad_anios, activo, id]
    );
    return result.rows[0] || null;
  },

  delete: async (id) => {
    // Soft delete
    const result = await pool.query(
      'UPDATE docentes SET activo = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  },

  existsByEmail: async (email, excludeId = null) => {
    const query = excludeId
      ? 'SELECT 1 FROM docentes WHERE email = $1 AND id != $2'
      : 'SELECT 1 FROM docentes WHERE email = $1';
    const params = excludeId ? [email, excludeId] : [email];
    const result = await pool.query(query, params);
    return result.rowCount > 0;
  }
};

module.exports = DocenteModel;
