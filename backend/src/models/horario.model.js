const pool = require('../config/db');

const construirFiltros = (filters = {}, offset = 1) => {
  const condiciones = [];
  const valores = [];
  let index = offset;

  if (filters.semestre) {
    condiciones.push(`h.semestre = $${index++}`);
    valores.push(filters.semestre);
  }
  if (filters.docente_id) {
    condiciones.push(`d.id = $${index++}`);
    valores.push(Number(filters.docente_id));
  }
  if (filters.aula_id) {
    condiciones.push(`h.aula_id = $${index++}`);
    valores.push(Number(filters.aula_id));
  }
  if (filters.laboratorio_id) {
    condiciones.push(`h.laboratorio_id = $${index++}`);
    valores.push(Number(filters.laboratorio_id));
  }
  if (filters.dia) {
    condiciones.push(`h.dia = $${index++}`);
    valores.push(filters.dia);
  }

  return {
    where: condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '',
    valores,
    nextIndex: index,
  };
};

const selectHorarioCompleto = `
  SELECT
    h.id,
    h.asignacion_id,
    h.semestre,
    h.dia,
    TO_CHAR(h.hora_inicio, 'HH24:MI') AS hora_inicio,
    TO_CHAR(h.hora_fin, 'HH24:MI') AS hora_fin,
    h.aula_id,
    h.laboratorio_id,
    h.generado_automaticamente,
    h.editado_manualmente,
    h.created_at,
    h.updated_at,
    adc.tipo AS tipo_asignacion,
    adc.semestre_asignacion,
    json_build_object(
      'id', d.id,
      'nombres', d.nombres,
      'apellidos', d.apellidos,
      'categoria', d.categoria,
      'tipo_nombramiento', d.tipo_nombramiento,
      'antiguedad_anios', d.antiguedad_anios
    ) AS docente,
    json_build_object(
      'id', c.id,
      'codigo', c.codigo,
      'nombre', c.nombre,
      'creditos', c.creditos,
      'semestre', c.semestre,
      'ciclo', c.ciclo
    ) AS curso,
    CASE WHEN a.id IS NULL THEN NULL ELSE json_build_object(
      'id', a.id,
      'codigo', a.codigo,
      'nombre', a.nombre,
      'capacidad', a.capacidad,
      'ubicacion', a.ubicacion,
      'tipo', a.tipo
    ) END AS aula,
    CASE WHEN l.id IS NULL THEN NULL ELSE json_build_object(
      'id', l.id,
      'codigo', l.codigo,
      'nombre', l.nombre,
      'capacidad', l.capacidad,
      'ubicacion', l.ubicacion
    ) END AS laboratorio,
     -- Obtenemos el código asignado por secretaría como respaldo (fallback)
    COALESCE(a_pref.codigo, l_pref.codigo) AS ambiente_secretaria_codigo
  FROM horarios h
  JOIN asignacion_docente_curso adc ON adc.id = h.asignacion_id
  JOIN docentes d ON d.id = adc.docente_id
  JOIN cursos c ON c.id = adc.curso_id
  LEFT JOIN aulas a ON a.id = h.aula_id
  LEFT JOIN laboratorios l ON l.id = h.laboratorio_id
  -- Joins para capturar el ambiente pre-configurado por la secretaría
  LEFT JOIN aulas a_pref ON a_pref.id = adc.ambiente_preferido_id AND adc.tipo = 'Teoria'
  LEFT JOIN laboratorios l_pref ON l_pref.id = adc.ambiente_preferido_id AND adc.tipo = 'Laboratorio'
`;

const HorarioModel = {
  getAll: async (filters = {}) => {
    const { where, valores } = construirFiltros(filters);
    const result = await pool.query(
      `${selectHorarioCompleto}
       ${where}
       ORDER BY 
         CASE h.dia
           WHEN 'Lunes' THEN 1
           WHEN 'Martes' THEN 2
           WHEN 'Miercoles' THEN 3
           WHEN 'Jueves' THEN 4
           WHEN 'Viernes' THEN 5
           WHEN 'Sabado' THEN 6
           WHEN 'Domingo' THEN 7
           ELSE 8
         END,
         h.hora_inicio,
         c.codigo`,
      valores
    );
    return result.rows;
  },

  getById: async (id) => {
    const result = await pool.query(
      `${selectHorarioCompleto}
       WHERE h.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  countBySemestre: async (semestre, client = pool) => {
    const result = await client.query('SELECT COUNT(*)::int AS total FROM horarios WHERE semestre = $1', [semestre]);
    return result.rows[0]?.total || 0;
  },

  // NUEVO METODO: Cuenta solo los generados automáticamente
  countAutomaticosBySemestre: async (semestre, client = pool) => {
    const result = await client.query('SELECT COUNT(*)::int AS total FROM horarios WHERE semestre = $1 AND generado_automaticamente = TRUE', [semestre]);
    return result.rows[0]?.total || 0;
  },

  deleteBySemestre: async (semestre, client = pool) => {
    const result = await client.query('DELETE FROM horarios WHERE semestre = $1 RETURNING id', [semestre]);
    return result.rowCount;
  },

  // NUEVO METODO: Borra solo los generados automáticamente
  deleteAutomaticosBySemestre: async (semestre, client = pool) => {
    const result = await client.query('DELETE FROM horarios WHERE semestre = $1 AND generado_automaticamente = TRUE RETURNING id', [semestre]);
    return result.rowCount;
  },

  create: async (data, client = pool) => {
    const {
      asignacion_id,
      semestre,
      dia,
      hora_inicio,
      hora_fin,
      aula_id,
      laboratorio_id,
      generado_automaticamente = true,
      editado_manualmente = false,
    } = data;

    const result = await client.query(
      `INSERT INTO horarios
        (asignacion_id, semestre, dia, hora_inicio, hora_fin, aula_id, laboratorio_id, generado_automaticamente, editado_manualmente)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        asignacion_id,
        semestre,
        dia,
        hora_inicio,
        hora_fin,
        aula_id || null,
        laboratorio_id || null,
        generado_automaticamente,
        editado_manualmente,
      ]
    );
    return result.rows[0];
  },

  update: async (id, data) => {
    const { dia, hora_inicio, hora_fin, aula_id, laboratorio_id } = data;
    const result = await pool.query(
      `UPDATE horarios
       SET dia = $1,
           hora_inicio = $2,
           hora_fin = $3,
           aula_id = $4,
           laboratorio_id = $5,
           generado_automaticamente = FALSE,
           editado_manualmente = TRUE,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [dia, hora_inicio, hora_fin, aula_id || null, laboratorio_id || null, id]
    );
    return result.rows[0] || null;
  },

  // MODIFICADO: Excluye asignaciones con horarios ya creados
  getAsignacionesParaScheduling: async (semestre, client = pool) => {
    const semestreTrim = String(semestre).trim();
    const isOddSemester = semestreTrim.endsWith('-1');
    const cicloParityFilter = isOddSemester
      ? "AND c.ciclo % 2 = 1"
      : "AND c.ciclo % 2 = 0";

    const result = await client.query(
      `SELECT
         adc.id AS asignacion_id,
         adc.docente_id,
         adc.curso_id,
         adc.tipo,
         adc.ambiente_preferido_id,
         adc.semestre_asignacion,
         d.nombres AS docente_nombres,
         d.apellidos AS docente_apellidos,
         d.categoria,
         d.tipo_nombramiento,
         d.antiguedad_anios,
         c.codigo AS curso_codigo,
         c.nombre AS curso_nombre,
         c.creditos AS curso_creditos,
         c.ciclo AS curso_ciclo,
         c.horas_aula AS curso_horas_aula,
         c.horas_lab AS curso_horas_lab,
         CASE d.tipo_nombramiento WHEN 'Nombrado' THEN 1 ELSE 2 END AS prioridad_tipo,
         CASE d.categoria
           WHEN 'Principal' THEN 1
           WHEN 'Asociado' THEN 2
           WHEN 'Auxiliar' THEN 3
           WHEN 'Jefe de practica' THEN 4
           ELSE 5
         END AS prioridad_categoria
       FROM asignacion_docente_curso adc
       JOIN docentes d ON d.id = adc.docente_id AND d.activo = TRUE
       JOIN cursos c ON c.id = adc.curso_id AND c.activo = TRUE
       LEFT JOIN horarios h ON h.asignacion_id = adc.id -- Se une para revisar si ya hay horario
       WHERE adc.semestre_asignacion = $1
         AND h.id IS NULL -- Filtrar para traer solo las que NO tienen horario
         ${cicloParityFilter}
       ORDER BY prioridad_tipo ASC, prioridad_categoria ASC, d.antiguedad_anios DESC, d.apellidos ASC, d.nombres ASC, c.codigo ASC`,
      [semestre]
    );
    return result.rows;
  },

  getAulasActivas: async (client = pool) => {
    const result = await client.query('SELECT * FROM aulas WHERE activa = TRUE ORDER BY codigo');
    return result.rows;
  },

  getLaboratoriosActivos: async (client = pool) => {
    const result = await client.query('SELECT * FROM laboratorios WHERE activo = TRUE ORDER BY codigo');
    return result.rows;
  },

  existeConflictoDocente: async ({ docente_id, semestre, dia, hora_inicio, hora_fin, excludeId = null }, client = pool) => {
    const params = [docente_id, semestre, dia, hora_inicio, hora_fin];
    let exclude = '';
    if (excludeId) {
      params.push(excludeId);
      exclude = `AND h.id != $${params.length}`;
    }
    const result = await client.query(
      `SELECT h.id
       FROM horarios h
       JOIN asignacion_docente_curso adc ON adc.id = h.asignacion_id
       WHERE adc.docente_id = $1
         AND h.semestre = $2
         AND h.dia = $3
         AND h.hora_inicio < $5::time
         AND h.hora_fin > $4::time
         ${exclude}
       LIMIT 1`,
      params
    );
    return result.rows[0] || null;
  },

  existeConflictoAula: async ({ aula_id, semestre, dia, hora_inicio, hora_fin, excludeId }, client) => {
    // Base de la consulta
    let sql = `
      SELECT 1 FROM horarios 
      WHERE aula_id = $1 
        AND semestre = $2 
        AND dia = $3 
        AND hora_inicio < $5 
        AND hora_fin > $4
    `;
    const params = [aula_id, semestre, dia, hora_inicio, hora_fin];

    // 🌟 SI VIENE UN ID A EXCLUIR (Modo edición), LO AGREGAMOS DINÁMICAMENTE
    if (excludeId) {
      sql += ` AND id <> $6`;
      params.push(excludeId);
    }

    const executor = client || pool;
    const result = await executor.query(sql, params);
    return result.rows.length > 0;
  },

  existeConflictoLaboratorio: async ({ laboratorio_id, semestre, dia, hora_inicio, hora_fin, excludeId }, client) => {
    let sql = `
      SELECT 1 FROM horarios 
      WHERE laboratorio_id = $1 
        AND semestre = $2 
        AND dia = $3 
        AND hora_inicio < $5 
        AND hora_fin > $4
    `;
    const params = [laboratorio_id, semestre, dia, hora_inicio, hora_fin];

    if (excludeId) {
      sql += ` AND id <> $6`;
      params.push(excludeId);
    }

    const executor = client || pool;
    const result = await executor.query(sql, params);
    return result.rows.length > 0;
  },

  existeConflictoCiclo: async ({ ciclo, semestre, dia, hora_inicio, hora_fin, excludeId = null }, client = pool) => {
    const params = [ciclo, semestre, dia, hora_inicio, hora_fin];
    let exclude = '';
    if (excludeId) {
      params.push(excludeId);
      exclude = `AND h.id != $${params.length}`;
    }
    const result = await client.query(
      `SELECT h.id
       FROM horarios h
       JOIN asignacion_docente_curso adc ON adc.id = h.asignacion_id
       JOIN cursos c ON c.id = adc.curso_id
       WHERE c.ciclo = $1
         AND h.semestre = $2
         AND h.dia = $3
         AND h.hora_inicio < $5::time
         AND h.hora_fin > $4::time
         ${exclude}
       LIMIT 1`,
      params
    );
    return result.rows[0] || null;
  },

  existeRestriccionDocente: async ({ docente_id, dia, hora_inicio, hora_fin }, client = pool) => {
    const result = await client.query(
      `SELECT id, motivo
       FROM restricciones_horarias
       WHERE docente_id = $1
         AND dia = $2
         AND tipo_restriccion = 'No_disponible'
         AND hora_inicio < $4::time
         AND hora_fin > $3::time
       LIMIT 1`,
      [docente_id, dia, hora_inicio, hora_fin]
    );
    return result.rows[0] || null;
  },

  delete: async (id) => {
    const result = await pool.query('DELETE FROM horarios WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  },

  getAsignacionesPendientes: async (semestre) => {
    const result = await pool.query(
      `SELECT
         adc.id AS asignacion_id,
         adc.docente_id,
         adc.curso_id,
         adc.tipo,
         d.nombres AS docente_nombres,
         d.apellidos AS docente_apellidos,
         d.email AS docente_email,
         d.categoria,
         d.tipo_nombramiento,
         c.codigo AS curso_codigo,
         c.nombre AS curso_nombre
       FROM asignacion_docente_curso adc
       JOIN docentes d ON d.id = adc.docente_id AND d.activo = TRUE
       JOIN cursos c ON c.id = adc.curso_id AND c.activo = TRUE
       LEFT JOIN horarios h ON h.asignacion_id = adc.id AND h.semestre = $1
       WHERE adc.semestre_asignacion = $1 AND h.id IS NULL
       ORDER BY d.apellidos, d.nombres, c.codigo`,
      [semestre]
    );
    return result.rows;
  },

  getEstadoSeleccion: async (semestre) => {
    const result = await pool.query(
      `SELECT
         d.id AS docente_id,
         CONCAT(d.nombres, ' ', d.apellidos) AS nombre,
         d.email,
         d.categoria,
         d.tipo_nombramiento,
         COUNT(adc.id)::int AS total_asignaciones,
         COUNT(h.id)::int AS asignaciones_con_horario
       FROM docentes d
       JOIN asignacion_docente_curso adc ON adc.docente_id = d.id AND adc.semestre_asignacion = $1
       LEFT JOIN horarios h ON h.asignacion_id = adc.id AND h.semestre = $1
       WHERE d.activo = TRUE
       GROUP BY d.id, d.nombres, d.apellidos, d.email, d.categoria, d.tipo_nombramiento
       ORDER BY d.apellidos, d.nombres`,
      [semestre]
    );

    return result.rows.map(row => ({
      ...row,
      completado: row.total_asignaciones === row.asignaciones_con_horario,
    }));
  },

  getEstadisticas: async (semestre = null) => {
    const filtros = semestre ? 'WHERE h.semestre = $1' : '';
    const params = semestre ? [semestre] : [];

    const [totales, distribucion, carga, ambientes, horarios] = await Promise.all([
      pool.query(`
        SELECT
          (SELECT COUNT(*)::int FROM docentes WHERE activo = TRUE) AS total_docentes,
          (SELECT COUNT(*)::int FROM cursos WHERE activo = TRUE) AS total_cursos,
          (SELECT COUNT(*)::int FROM aulas WHERE activa = TRUE) AS total_aulas,
          (SELECT COUNT(*)::int FROM laboratorios WHERE activo = TRUE) AS total_laboratorios
      `),
      pool.query(
        `SELECT adc.tipo, COUNT(*)::int AS total
         FROM horarios h
         JOIN asignacion_docente_curso adc ON adc.id = h.asignacion_id
         ${filtros}
         GROUP BY adc.tipo`,
        params
      ),
      pool.query(
        `SELECT
           d.id AS docente_id,
           CONCAT(d.nombres, ' ', d.apellidos) AS nombre,
           COALESCE(SUM(EXTRACT(EPOCH FROM (h.hora_fin - h.hora_inicio)) / 3600), 0)::numeric(10,2) AS horas
         FROM horarios h
         JOIN asignacion_docente_curso adc ON adc.id = h.asignacion_id
         JOIN docentes d ON d.id = adc.docente_id
         ${filtros}
         GROUP BY d.id, d.nombres, d.apellidos
         ORDER BY horas DESC, nombre ASC`,
        params
      ),
      pool.query(
        `SELECT
           COALESCE(a.codigo, l.codigo) AS ambiente,
           COALESCE(a.nombre, l.nombre) AS nombre,
           COALESCE(SUM(EXTRACT(EPOCH FROM (h.hora_fin - h.hora_inicio)) / 3600), 0)::numeric(10,2) AS horas
         FROM horarios h
         LEFT JOIN aulas a ON a.id = h.aula_id
         LEFT JOIN laboratorios l ON l.id = h.laboratorio_id
         ${filtros}
         GROUP BY COALESCE(a.codigo, l.codigo), COALESCE(a.nombre, l.nombre)
         ORDER BY horas DESC, ambiente ASC`,
        params
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total FROM horarios h ${filtros}`,
        params
      ),
    ]);

    const distribucionMap = { teoria: 0, laboratorio: 0 };
    distribucion.rows.forEach((row) => {
      if (row.tipo === 'Teoria') distribucionMap.teoria = row.total;
      if (row.tipo === 'Laboratorio') distribucionMap.laboratorio = row.total;
    });

    return {
      totales: totales.rows[0],
      distribucion: distribucionMap,
      carga_por_docente: carga.rows.map((row) => ({ ...row, horas: Number(row.horas) })),
      uso_por_ambiente: ambientes.rows.map((row) => ({ ...row, horas: Number(row.horas) })),
      total_horarios: horarios.rows[0]?.total || 0,
    };
  },
};

module.exports = HorarioModel;