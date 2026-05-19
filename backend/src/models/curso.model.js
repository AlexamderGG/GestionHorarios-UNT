const pool = require('../config/db');

const CursoModel = {
  getAll: async () => {
    const result = await pool.query('SELECT * FROM cursos WHERE activo = TRUE ORDER BY ciclo, codigo');
    return result.rows;
  },

  getById: async (id) => {
    const result = await pool.query('SELECT * FROM cursos WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  create: async (data) => {
    const { codigo, nombre, creditos, ciclo, semestre, especialidad, horas_aula, horas_lab } = data;
    const result = await pool.query(
      `INSERT INTO cursos (codigo, nombre, creditos, ciclo, semestre, especialidad, horas_aula, horas_lab)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [codigo, nombre, creditos, ciclo, semestre, especialidad || 'Ingenieria de Sistemas', horas_aula || 0, horas_lab || 0]
    );
    return result.rows[0];
  },

  update: async (id, data) => {
    const { codigo, nombre, creditos, ciclo, semestre, especialidad, activo, horas_aula, horas_lab } = data;
    const result = await pool.query(
      `UPDATE cursos
       SET codigo = $1, nombre = $2, creditos = $3, ciclo = $4, semestre = $5, especialidad = $6, activo = $7, horas_aula = $8, horas_lab = $9
       WHERE id = $10 RETURNING *`,
      [codigo, nombre, creditos, ciclo, semestre, especialidad, activo, horas_aula, horas_lab, id]
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
  },

  // Obtener cursos por especialidad
  getByEspecialidad: async (especialidad) => {
    const result = await pool.query(
      'SELECT * FROM cursos WHERE especialidad = $1 AND activo = TRUE ORDER BY ciclo, codigo',
      [especialidad]
    );
    return result.rows;
  },

  // Obtener cursos por ciclo
  getByCiclo: async (ciclo) => {
    const result = await pool.query(
      'SELECT * FROM cursos WHERE ciclo = $1 AND activo = TRUE ORDER BY codigo',
      [ciclo]
    );
    return result.rows;
  }
};

module.exports = CursoModel;
