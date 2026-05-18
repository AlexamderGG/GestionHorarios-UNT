const pool = require('../config/db');

const DIAS_VALIDOS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

const RestriccionModel = {
  getAll: async (filters = {}) => {
    const condiciones = [];
    const valores = [];
    let index = 1;

    if (filters.docente_id) {
      condiciones.push(`r.docente_id = $${index++}`);
      valores.push(Number(filters.docente_id));
    }
    if (filters.dia) {
      condiciones.push(`r.dia = $${index++}`);
      valores.push(filters.dia);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT r.*, d.nombres, d.apellidos, d.email
       FROM restricciones_horarias r
       JOIN docentes d ON d.id = r.docente_id
       ${where}
       ORDER BY
         CASE r.dia
           WHEN 'Lunes' THEN 1
           WHEN 'Martes' THEN 2
           WHEN 'Miercoles' THEN 3
           WHEN 'Jueves' THEN 4
           WHEN 'Viernes' THEN 5
           WHEN 'Sabado' THEN 6
           WHEN 'Domingo' THEN 7
           ELSE 8
         END,
         r.hora_inicio`,
      valores
    );
    return result.rows;
  },

  getByDocente: async (docente_id) => {
    return RestriccionModel.getAll({ docente_id });
  },

  create: async (data) => {
    const { docente_id, dia, hora_inicio, hora_fin, tipo_restriccion = 'No_disponible', motivo } = data;
    const result = await pool.query(
      `INSERT INTO restricciones_horarias (docente_id, dia, hora_inicio, hora_fin, tipo_restriccion, motivo)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [docente_id, dia, hora_inicio, hora_fin, tipo_restriccion, motivo || null]
    );
    return result.rows[0];
  },

  delete: async (id, docente_id = null) => {
    let query = 'DELETE FROM restricciones_horarias WHERE id = $1';
    const params = [id];

    if (docente_id) {
      query += ' AND docente_id = $2';
      params.push(docente_id);
    }

    query += ' RETURNING *';
    const result = await pool.query(query, params);
    return result.rows[0] || null;
  },

  existeSolapamiento: async (docente_id, dia, hora_inicio, hora_fin, excludeId = null) => {
    const params = [docente_id, dia, hora_inicio, hora_fin];
    let exclude = '';
    if (excludeId) {
      params.push(excludeId);
      exclude = `AND id != $${params.length}`;
    }
    const result = await pool.query(
      `SELECT id FROM restricciones_horarias
       WHERE docente_id = $1 AND dia = $2
       AND hora_inicio < $4::time AND hora_fin > $3::time
       ${exclude}
       LIMIT 1`,
      params
    );
    return result.rows[0] || null;
  },
};

RestriccionModel.DIAS_VALIDOS = DIAS_VALIDOS;

module.exports = RestriccionModel;
