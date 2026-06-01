const pool = require('../config/db');

const DocenteModel = {
  getAll: async () => {
    const result = await pool.query(
      'SELECT * FROM docentes WHERE activo = TRUE ORDER BY antiguedad_anios DESC, categoria, antiguedad_anios DESC'
    );
    return result.rows;
  },

  getById: async (id) => {
    const result = await pool.query('SELECT * FROM docentes WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  create: async (data) => {
    const { nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios } = data;
    const result = await pool.query(
      `INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad || null, escuela || 'Ingenieria de Sistemas', semestre_contrato || null, antiguedad_anios]
    );
    return result.rows[0];
  },

  update: async (id, data) => {
    const { nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios, activo } = data;
    const result = await pool.query(
      `UPDATE docentes 
       SET nombres = $1, apellidos = $2, email = $3, telefono = $4, 
           categoria = $5, tipo_nombramiento = $6, especialidad = $7, escuela = $8, semestre_contrato = $9, antiguedad_anios = $10, activo = $11, updated_at = CURRENT_TIMESTAMP
       WHERE id = $12 RETURNING *`,
      [nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios, activo, id]
    );
    return result.rows[0] || null;
  },

  delete: async (id) => {
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
  },

  // Obtener docentes disponibles segun especialidad
  // Solo docentes cuya especialidad coincida con la del curso
  getDisponiblesPorEspecialidad: async (especialidad) => {
    const result = await pool.query(
      `SELECT * FROM docentes 
       WHERE activo = TRUE 
         AND especialidad = $1
       ORDER BY 
         CASE tipo_nombramiento WHEN 'Nombrado' THEN 1 ELSE 2 END,
         CASE categoria
           WHEN 'Principal' THEN 1
           WHEN 'Asociado' THEN 2
           WHEN 'Auxiliar' THEN 3
           WHEN 'Jefe de practica' THEN 4
           ELSE 5
         END,
         antiguedad_anios DESC`,
      [especialidad]
    );
    return result.rows;
  },

  // Obtener todos los docentes activos ordenados por prioridad
  getDisponiblesPorSemestre: async () => {
    const result = await pool.query(
      `SELECT * FROM docentes 
       WHERE activo = TRUE 
       ORDER BY 
         CASE tipo_nombramiento WHEN 'Nombrado' THEN 1 ELSE 2 END,
         CASE categoria
           WHEN 'Principal' THEN 1
           WHEN 'Asociado' THEN 2
           WHEN 'Auxiliar' THEN 3
           WHEN 'Jefe de practica' THEN 4
           ELSE 5
         END,
         antiguedad_anios DESC`
    );
    return result.rows;
  },

  getDocentesPorEscalafon: async (client = pool) => {
    const query = `
      SELECT 
          d.id, 
          d.nombres, 
          d.apellidos, 
          d.email, 
          d.categoria, 
          d.tipo_nombramiento, 
          d.antiguedad_anios, 
          d.estado_turno
      FROM docentes d
      WHERE d.activo = TRUE
        -- FILTRO MÁGICO: Solo docentes con asignaciones en el semestre activo
        AND d.id IN (
            SELECT adc.docente_id 
            FROM asignacion_docente_curso adc 
            WHERE adc.semestre_asignacion = (
                SELECT valor FROM configuracion WHERE clave = 'semestre_activo' LIMIT 1
            )
        )
      ORDER BY 
          d.antiguedad_anios DESC, -- 1. Prioridad: Mayor antigüedad
          CASE d.categoria         -- 2. Desempate: Nueva jerarquía
              WHEN 'Principal' THEN 1
              WHEN 'Jefe de practica' THEN 2
              WHEN 'Asociado' THEN 3
              WHEN 'Auxiliar' THEN 4
              ELSE 5
          END ASC,
          d.apellidos ASC,         -- 3. Desempate alfabético por si acaso
          d.nombres ASC;
    `;
    const result = await client.query(query);
    return result.rows;
  },

  // También necesitaremos un método rápido para que Secretaría o el Docente actualicen el estado
  updateEstadoTurno: async (id, estado_turno, client = pool) => {
    const query = `
      UPDATE docentes 
      SET estado_turno = $1 
      WHERE id = $2 
      RETURNING id, nombres, apellidos, estado_turno, email;
    `;
    const result = await client.query(query, [estado_turno, id]);
    return result.rows[0] || null;
  },
  updatePassword: async (id, hashedPassword, client = pool) => {
    const query = `
      UPDATE docentes 
      SET password = $1 
      WHERE id = $2
    `;
    await client.query(query, [hashedPassword, id]);
  },

  resetAllTurnos: async (client = pool) => {
    const query = `
      UPDATE docentes 
      SET estado_turno = 'Pendiente', password = NULL
    `;
    await client.query(query);
  }
};

module.exports = DocenteModel;
