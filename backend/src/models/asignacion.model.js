const pool = require("../config/db");

const AsignacionModel = {
  getAll: async () => {
    const result = await pool.query(`
      SELECT 
        adc.id,
        adc.docente_id,
        adc.curso_id,
        adc.tipo,
        adc.ambiente_preferido_id,
        adc.semestre_asignacion,
        adc.observaciones,
        adc.created_at,
        d.nombres as docente_nombres,
        d.apellidos as docente_apellidos,
        d.categoria as docente_categoria,
        d.tipo_nombramiento as docente_tipo,
        c.codigo as curso_codigo,
        c.nombre as curso_nombre,
        c.creditos as curso_creditos,
        COALESCE(a.codigo, l.codigo) as ambiente_codigo,
        COALESCE(a.nombre, l.nombre) as ambiente_nombre
      FROM asignacion_docente_curso adc
      JOIN docentes d ON d.id = adc.docente_id
      JOIN cursos c ON c.id = adc.curso_id
      LEFT JOIN aulas a ON a.id = adc.ambiente_preferido_id AND adc.tipo = 'Teoria'
      LEFT JOIN laboratorios l ON l.id = adc.ambiente_preferido_id AND adc.tipo = 'Laboratorio'
      ORDER BY adc.id DESC
    `);
    return result.rows;
  },

  getById: async (id) => {
    const result = await pool.query(
      `
      SELECT 
        adc.*,
        d.nombres as docente_nombres, d.apellidos as docente_apellidos,
        c.codigo as curso_codigo, c.nombre as curso_nombre
      FROM asignacion_docente_curso adc
      JOIN docentes d ON d.id = adc.docente_id
      JOIN cursos c ON c.id = adc.curso_id
      WHERE adc.id = $1
    `,
      [id],
    );
    return result.rows[0] || null;
  },

  create: async (data) => {
    const {
      docente_id,
      curso_id,
      tipo,
      ambiente_preferido_id,
      semestre_asignacion,
      ciclo,
      observaciones,
    } = data;
    const result = await pool.query(
      `INSERT INTO asignacion_docente_curso
         (docente_id, curso_id, tipo, ambiente_preferido_id, semestre_asignacion, ciclo, observaciones)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        docente_id,
        curso_id,
        tipo,
        ambiente_preferido_id || null,
        semestre_asignacion || "2026-1",
        ciclo || null,
        observaciones || null,
      ],
    );
    return result.rows[0];
  },

  delete: async (id) => {
    const result = await pool.query(
      "DELETE FROM asignacion_docente_curso WHERE id = $1 RETURNING *",
      [id],
    );
    return result.rows[0] || null;
  },

  existsDuplicate: async (
    docente_id,
    curso_id,
    tipo,
    semestre_asignacion,
    excludeId = null,
  ) => {
    const query = excludeId
      ? `SELECT 1 FROM asignacion_docente_curso 
         WHERE docente_id = $1 AND curso_id = $2 AND tipo = $3 AND semestre_asignacion = $4 AND id != $5`
      : `SELECT 1 FROM asignacion_docente_curso 
         WHERE docente_id = $1 AND curso_id = $2 AND tipo = $3 AND semestre_asignacion = $4`;
    const params = excludeId
      ? [docente_id, curso_id, tipo, semestre_asignacion, excludeId]
      : [docente_id, curso_id, tipo, semestre_asignacion];
    const result = await pool.query(query, params);
    return result.rowCount > 0;
  },

  getByDocente: async (docente_id, semestre_asignacion = null) => {
    let sql = `
      SELECT 
        adc.id,
        adc.docente_id,
        adc.curso_id,
        adc.tipo,
        adc.ambiente_preferido_id,
        adc.semestre_asignacion,
        adc.observaciones,
        adc.created_at,
        d.nombres as docente_nombres,
        d.apellidos as docente_apellidos,
        d.categoria as docente_categoria,
        d.tipo_nombramiento as docente_tipo,
        c.codigo as curso_codigo,
        c.nombre as curso_nombre,
        c.creditos as curso_creditos,
        c.horas_aula as curso_horas_aula,
        c.horas_lab as curso_horas_lab,
        COALESCE(a.codigo, l.codigo) as ambiente_codigo,
        COALESCE(a.nombre, l.nombre) as ambiente_nombre
      FROM asignacion_docente_curso adc
      JOIN docentes d ON d.id = adc.docente_id
      JOIN cursos c ON c.id = adc.curso_id
      LEFT JOIN aulas a ON a.id = adc.ambiente_preferido_id AND adc.tipo = 'Teoria'
      LEFT JOIN laboratorios l ON l.id = adc.ambiente_preferido_id AND adc.tipo = 'Laboratorio'
      WHERE adc.docente_id = $1
    `;
    const params = [docente_id];
    if (semestre_asignacion) {
      sql += " AND adc.semestre_asignacion = $2";
      params.push(semestre_asignacion);
    }
    sql += " ORDER BY adc.id DESC";
    const result = await pool.query(sql, params);
    return result.rows;
  },

  // Calcular horas totales asignadas a un docente en un semestre
  getHorasAsignadasPorDocente: async (docente_id, semestre_asignacion) => {
    const result = await pool.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN adc.tipo = 'Teoria' THEN c.horas_aula ELSE c.horas_lab END), 0)::int as total_horas
       FROM asignacion_docente_curso adc
       JOIN cursos c ON c.id = adc.curso_id
       WHERE adc.docente_id = $1 AND adc.semestre_asignacion = $2`,
      [docente_id, semestre_asignacion]
    );
    return result.rows[0]?.total_horas || 0;
  },

  // Verificar si un curso ya tiene asignación de un tipo específico (cualquier docente)
  existsCursoAsignado: async (curso_id, tipo, semestre_asignacion) => {
    const result = await pool.query(
      `SELECT 1 FROM asignacion_docente_curso 
       WHERE curso_id = $1 AND tipo = $2 AND semestre_asignacion = $3`,
      [curso_id, tipo, semestre_asignacion]
    );
    return result.rowCount > 0;
  },

  // Eliminar todas las asignaciones de un semestre
  deleteAllBySemestre: async (semestre_asignacion) => {
    const result = await pool.query(
      `DELETE FROM asignacion_docente_curso WHERE semestre_asignacion = $1 RETURNING *`,
      [semestre_asignacion]
    );
    return result.rowCount;
  },

  // Obtener todas las asignaciones de un semestre con datos de cursos (para cálculo de horas)
  getAllBySemestreConCursos: async (semestre_asignacion) => {
    const result = await pool.query(
      `SELECT adc.*, c.horas_aula, c.horas_lab
       FROM asignacion_docente_curso adc
       JOIN cursos c ON c.id = adc.curso_id
       WHERE adc.semestre_asignacion = $1`,
      [semestre_asignacion]
    );
    return result.rows;
  },
};

module.exports = AsignacionModel;
