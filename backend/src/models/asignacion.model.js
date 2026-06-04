const pool = require("../config/db");

const AsignacionModel = {
  getAll: async () => {
    const result = await pool.query(`
      SELECT 
        adc.id, adc.docente_id, adc.curso_id, adc.tipo, adc.grupo,
        adc.horas_asignadas,
        adc.ambiente_preferido_id, adc.semestre_asignacion, adc.observaciones, adc.created_at,
        d.nombres as docente_nombres, d.apellidos as docente_apellidos, d.categoria as docente_categoria, d.tipo_nombramiento as docente_tipo,
        c.codigo as curso_codigo, c.nombre as curso_nombre, c.creditos as curso_creditos,
        COALESCE(a.codigo, l.codigo) as ambiente_codigo, COALESCE(a.nombre, l.nombre) as ambiente_nombre
      FROM asignacion_docente_curso adc
      JOIN docentes d ON d.id = adc.docente_id
      JOIN cursos c ON c.id = adc.curso_id
      LEFT JOIN aulas a ON a.id = adc.ambiente_preferido_id AND (adc.tipo = 'Teoria' OR adc.tipo = 'Practica')
      LEFT JOIN laboratorios l ON l.id = adc.ambiente_preferido_id AND adc.tipo = 'Laboratorio'
      ORDER BY adc.id DESC
    `);
    return result.rows;
  },

  getById: async (id) => {
    const result = await pool.query(
      `SELECT adc.*, d.nombres as docente_nombres, d.apellidos as docente_apellidos, c.codigo as curso_codigo, c.nombre as curso_nombre
       FROM asignacion_docente_curso adc
       JOIN docentes d ON d.id = adc.docente_id
       JOIN cursos c ON c.id = adc.curso_id
       WHERE adc.id = $1`, [id]
    );
    return result.rows[0] || null;
  },

  create: async (data) => {
    const { docente_id, curso_id, tipo, ambiente_preferido_id, semestre_asignacion, ciclo, observaciones, grupo, horas_asignadas } = data;
    const result = await pool.query(
      `INSERT INTO asignacion_docente_curso
         (docente_id, curso_id, tipo, ambiente_preferido_id, semestre_asignacion, ciclo, observaciones, grupo, horas_asignadas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [docente_id, curso_id, tipo, ambiente_preferido_id || null, semestre_asignacion || "2026-1", ciclo || null, observaciones || null, grupo || 'Único', horas_asignadas || 0]
    );
    return result.rows[0];
  },

  delete: async (id) => {
    const result = await pool.query("DELETE FROM asignacion_docente_curso WHERE id = $1 RETURNING *", [id]);
    return result.rows[0] || null;
  },

  existsDuplicate: async (docente_id, curso_id, tipo, grupo, semestre_asignacion, excludeId = null) => {
    const query = excludeId
      ? `SELECT 1 FROM asignacion_docente_curso WHERE docente_id = $1 AND curso_id = $2 AND tipo = $3 AND grupo = $4 AND semestre_asignacion = $5 AND id != $6`
      : `SELECT 1 FROM asignacion_docente_curso WHERE docente_id = $1 AND curso_id = $2 AND tipo = $3 AND grupo = $4 AND semestre_asignacion = $5`;
    const params = excludeId ? [docente_id, curso_id, tipo, grupo, semestre_asignacion, excludeId] : [docente_id, curso_id, tipo, grupo, semestre_asignacion];
    const result = await pool.query(query, params);
    return result.rowCount > 0;
  },

  getByDocente: async (docente_id, semestre_asignacion = null) => {
    let sql = `
      SELECT 
        adc.id, adc.docente_id, adc.curso_id, adc.tipo, adc.grupo, adc.horas_asignadas, adc.ambiente_preferido_id, adc.semestre_asignacion,
        c.horas_t as curso_horas_t, c.horas_p as curso_horas_p, c.horas_l as curso_horas_l,
        c.codigo as curso_codigo, c.nombre as curso_nombre, c.ciclo,
        COALESCE(a.codigo, l.codigo) as ambiente_codigo, COALESCE(a.nombre, l.nombre) as ambiente_nombre
      FROM asignacion_docente_curso adc
      JOIN docentes d ON d.id = adc.docente_id
      JOIN cursos c ON c.id = adc.curso_id
      LEFT JOIN aulas a ON a.id = adc.ambiente_preferido_id AND (adc.tipo = 'Teoria' OR adc.tipo = 'Practica')
      LEFT JOIN laboratorios l ON l.id = adc.ambiente_preferido_id AND adc.tipo = 'Laboratorio'
      WHERE adc.docente_id = $1
    `;
    const params = [docente_id];
    if (semestre_asignacion) {
      sql += " AND adc.semestre_asignacion = $2";
      params.push(semestre_asignacion);
    }
    const result = await pool.query(sql, params);
    return result.rows;
  },

  updateDocente: async (id, nuevoDocenteId, nuevoAmbienteId = null, client = pool) => {
    const result = await client.query(
      `UPDATE asignacion_docente_curso SET docente_id = $1, ambiente_preferido_id = $2 WHERE id = $3 RETURNING *`,
      [nuevoDocenteId, nuevoAmbienteId, id]
    );
    const asignacion = result.rows[0];
    if (!asignacion) return null;

    if (asignacion.tipo === 'Teoria' || asignacion.tipo === 'Practica') {
      await client.query(`UPDATE horarios SET aula_id = $1, laboratorio_id = NULL WHERE asignacion_id = $2`, [nuevoAmbienteId, id]);
    } else if (asignacion.tipo === 'Laboratorio') {
      await client.query(`UPDATE horarios SET laboratorio_id = $1, aula_id = NULL WHERE asignacion_id = $2`, [nuevoAmbienteId, id]);
    }
    return asignacion;
  },

  getHorasAsignadasPorDocente: async (docente_id, semestre_asignacion) => {
    const result = await pool.query(
      `SELECT COALESCE(SUM(horas_asignadas), 0)::int as total_horas
       FROM asignacion_docente_curso
       WHERE docente_id = $1 AND semestre_asignacion = $2`,
      [docente_id, semestre_asignacion],
    );
    return result.rows[0]?.total_horas || 0;
  },

  existsCursoAsignado: async (curso_id, tipo, grupo, semestre_asignacion) => {
    const result = await pool.query(
      `SELECT 1 FROM asignacion_docente_curso WHERE curso_id = $1 AND tipo = $2 AND grupo = $3 AND semestre_asignacion = $4`,
      [curso_id, tipo, grupo, semestre_asignacion]
    );
    return result.rowCount > 0;
  },

  deleteAllBySemestre: async (semestre_asignacion) => {
    const result = await pool.query(`DELETE FROM asignacion_docente_curso WHERE semestre_asignacion = $1 RETURNING *`, [semestre_asignacion]);
    return result.rowCount;
  },

  getAllBySemestreConCursos: async (semestre_asignacion) => {
    const result = await pool.query(
      `SELECT adc.*, c.horas_t, c.horas_p, c.horas_l
       FROM asignacion_docente_curso adc
       JOIN cursos c ON c.id = adc.curso_id
       WHERE adc.semestre_asignacion = $1`, [semestre_asignacion]
    );
    return result.rows;
  },
};

module.exports = AsignacionModel;