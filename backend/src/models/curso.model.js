const pool = require('../config/db');

const CursoModel = {
  getAll: async () => {
    const result = await pool.query('SELECT * FROM cursos WHERE activo = TRUE ORDER BY semestre, codigo');
    return result.rows;
  },

  getById: async (id) => {
    const result = await pool.query('SELECT * FROM cursos WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  create: async (data) => {
    const { codigo, nombre, creditos, semestre, ciclo } = data;
    const result = await pool.query(
      `INSERT INTO cursos (codigo, nombre, creditos, semestre, ciclo)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [codigo, nombre, creditos, semestre, ciclo]
    );
    return result.rows[0];
  },

  update: async (id, data) => {
    const { codigo, nombre, creditos, semestre, ciclo, activo } = data;
    const result = await pool.query(
      `UPDATE cursos 
       SET codigo = $1, nombre = $2, creditos = $3, semestre = $4, ciclo = $5, activo = $6
       WHERE id = $7 RETURNING *`,
      [codigo, nombre, creditos, semestre, ciclo, activo, id]
    );
    return result.rows[0] || null;
  },

  delete: async (id) => {
    const result = await pool.query(
      'UPDATE cursos SET activo = FALSE WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  },

  existsByCodigo: async (codigo, excludeId = null) => {
    const query = excludeId
      ? 'SELECT 1 FROM cursos WHERE codigo = $1 AND id != $2'
      : 'SELECT 1 FROM cursos WHERE codigo = $1';
    const params = excludeId ? [codigo, excludeId] : [codigo];
    const result = await pool.query(query, params);
    return result.rowCount > 0;
  }
};

module.exports = CursoModel;
