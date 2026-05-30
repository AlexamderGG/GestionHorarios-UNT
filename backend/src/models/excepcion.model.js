const pool = require("../config/db");

const ExcepcionModel = {
  // 1. Registrar una nueva excepción con un arreglo de hasta 3 horarios propuestos
  create: async ({ docente_id, asignacion_id, motivo, horarios_solicitados_ids }) => {
    const sql = `
      INSERT INTO excepciones_horario (docente_id, asignacion_id, motivo, horarios_solicitados_ids)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query(sql, [docente_id, asignacion_id, motivo, horarios_solicitados_ids || []]);
    return result.rows[0];
  },

  // 2. Obtener el historial trayendo los datos agrupados de las 3 opciones propuestas
  getByDocente: async (docente_id) => {
    const sql = `
      SELECT 
        ex.id,
        ex.docente_id,
        ex.asignacion_id,
        ex.motivo,
        ex.estado,
        ex.created_at,
        c.codigo as curso_codigo,
        c.nombre as curso_nombre,
        adc.tipo,
        COALESCE(
          (
            SELECT json_agg(json_build_object(
              'id', h.id,
              'dia', h.dia,
              'hora_inicio', h.hora_inicio,
              'hora_fin', h.hora_fin,
              'ciclo', cc.ciclo,
              'curso_codigo', cc.codigo,
              'docente_apellidos', dd.apellidos
            ))
            FROM horarios h
            JOIN asignacion_docente_curso a_dc ON a_dc.id = h.asignacion_id
            JOIN cursos cc ON cc.id = a_dc.curso_id
            JOIN docentes dd ON dd.id = a_dc.docente_id
            WHERE h.id = ANY(ex.horarios_solicitados_ids)
          ), '[]'::json
        ) as horarios_solicitados
      FROM excepciones_horario ex
      JOIN asignacion_docente_curso adc ON adc.id = ex.asignacion_id
      JOIN cursos c ON c.id = adc.curso_id
      WHERE ex.docente_id = $1
      ORDER BY ex.created_at DESC
    `;
    const result = await pool.query(sql, [docente_id]);
    return result.rows;
  },

  // 3. Obtener ABSOLUTAMENTE TODAS las excepciones del sistema (Para Secretaría)
  getAll: async () => {
    const sql = `
      SELECT 
        ex.id,
        ex.docente_id,
        ex.asignacion_id,
        ex.motivo,
        ex.estado,
        ex.created_at,
        d.nombres as docente_nombres,
        d.apellidos as docente_apellidos,
        c.codigo as curso_codigo,
        c.nombre as curso_nombre,
        adc.tipo,
        COALESCE(
          (
            SELECT json_agg(json_build_object(
              'id', h.id,
              'dia', h.dia,
              'hora_inicio', h.hora_inicio,
              'hora_fin', h.hora_fin,
              'ciclo', cc.ciclo,
              'curso_codigo', cc.codigo,
              'docente_apellidos', dd.apellidos
            ))
            FROM horarios h
            JOIN asignacion_docente_curso a_dc ON a_dc.id = h.asignacion_id
            JOIN cursos cc ON cc.id = a_dc.curso_id
            JOIN docentes dd ON dd.id = a_dc.docente_id
            WHERE h.id = ANY(ex.horarios_solicitados_ids)
          ), '[]'::json
        ) as horarios_solicitados
      FROM excepciones_horario ex
      JOIN docentes d ON d.id = ex.docente_id
      JOIN asignacion_docente_curso adc ON adc.id = ex.asignacion_id
      JOIN cursos c ON c.id = adc.curso_id
      ORDER BY 
        CASE WHEN ex.estado = 'Pendiente' THEN 1 ELSE 2 END, 
        ex.created_at DESC
    `;
    const result = await pool.query(sql);
    return result.rows;
  },

  // 4. Cambiar el estado de una solicitud ('Aprobado' o 'Rechazado')
  updateEstado: async (id, estado) => {
    const sql = `
      UPDATE excepciones_horario 
      SET estado = $1 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await pool.query(sql, [estado, id]);
    return result.rows[0];
  },
  
  // 5. Eliminar físicamente el registro de la base de datos
  delete: async (id) => {
    const sql = `
      DELETE FROM excepciones_horario 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(sql, [id]);
    return result.rows[0];
  }

};

module.exports = ExcepcionModel;