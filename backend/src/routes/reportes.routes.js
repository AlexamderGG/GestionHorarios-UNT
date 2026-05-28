const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { success, error } = require("../utils/responseHelper");

/**
 * @route   GET /api/reportes/operacional
 * @desc    Reporte operacional: horarios agrupados por aula/laboratorio, día y hora
 * @module  Modulo 4 - Reportes
 */
router.get("/operacional", async (req, res) => {
  const semestre = req.query.semestre || "2026-1";

  try {
    const query = `
      SELECT 
        h.id,
        h.dia,
        h.hora_inicio,
        h.hora_fin,
        c.codigo AS curso_codigo,
        c.nombre AS curso_nombre,
        d.nombres AS docente_nombres,
        d.apellidos AS docente_apellidos,
        a.codigo AS aula_codigo,
        l.codigo AS lab_codigo
      FROM horarios h
      JOIN asignacion_docente_curso adc ON h.asignacion_id = adc.id
      JOIN cursos c ON adc.curso_id = c.id
      JOIN docentes d ON adc.docente_id = d.id
      LEFT JOIN aulas a ON h.aula_id = a.id
      LEFT JOIN laboratorios l ON h.laboratorio_id = l.id
      WHERE h.semestre = $1
      ORDER BY a.codigo, l.codigo, 
        CASE h.dia 
          WHEN 'Lunes' THEN 1 
          WHEN 'Martes' THEN 2 
          WHEN 'Miercoles' THEN 3 
          WHEN 'Jueves' THEN 4 
          WHEN 'Viernes' THEN 5 
          WHEN 'Sabado' THEN 6 
          WHEN 'Domingo' THEN 7 
        END, 
        h.hora_inicio;
    `;

    const { rows } = await pool.query(query, [semestre]);

    const reportestructurado = {};

    rows.forEach((row) => {
      const ambienteKey = row.aula_codigo
        ? `Aula ${row.aula_codigo}`
        : `Laboratorio ${row.lab_codigo}`;

      if (!reportestructurado[ambienteKey]) {
        reportestructurado[ambienteKey] = [];
      }

      reportestructurado[ambienteKey].push({
        dia: row.dia,
        hora_inicio: row.hora_inicio.slice(0, 5),
        hora_fin: row.hora_fin.slice(0, 5),
        curso: { nombre: row.curso_nombre },
        docente: {
          apellidos: row.docente_apellidos,
          nombres: row.docente_nombres,
        },
      });
    });

    success(res, reportestructurado, "Reporte operacional generado con éxito");
  } catch (err) {
    console.error("Error en reporte operacional:", err);
    error(res, "Error al compilar el reporte operacional", 500);
  }
});

/**
 * @route   GET /api/reportes/gestion
 * @desc    Reporte de gestion: resumen por docente (categoria, antiguedad, carga horaria)
 * @module  Modulo 4 - Reportes
 */
router.get("/gestion", async (req, res) => {
  const semestre = req.query.semestre || "2026-1";

  try {
    const query = `
      SELECT 
        d.id,
        CONCAT(d.apellidos, ', ', d.nombres) AS nombre,
        d.categoria,
        d.antiguedad_anios,
        COALESCE(SUM(EXTRACT(EPOCH FROM (h.hora_fin - h.hora_inicio))/3600), 0)::int AS horas
      FROM docentes d
      JOIN asignacion_docente_curso adc ON d.id = adc.docente_id
      JOIN horarios h ON adc.id = h.asignacion_id
      WHERE h.semestre = $1 AND d.activo = TRUE
      GROUP BY d.id, d.apellidos, d.nombres, d.categoria, d.antiguedad_anios
      ORDER BY horas DESC, d.apellidos;
    `;

    const { rows } = await pool.query(query, [semestre]);
    success(res, rows, "Reporte de gestión de docentes generado con éxito");
  } catch (err) {
    console.error("Error en reporte de gestion:", err);
    error(res, "Error al compilar el reporte de gestión", 500);
  }
});

/**
 * @route   GET /api/reportes/docente/:docente_id
 * @desc    Horario individual detallado de un docente
 * @module  Modulo 4 - Reportes
 */
router.get("/docente/:docente_id", async (req, res) => {
  const { docente_id } = req.params;
  const semestre = req.query.semestre || "2026-1";

  try {
    const query = `
      SELECT 
        h.id,
        h.dia,
        h.hora_inicio,
        h.hora_fin,
        c.codigo AS curso_codigo,
        c.nombre AS curso_nombre,
        a.codigo AS aula_codigo,
        l.codigo AS lab_codigo
      FROM horarios h
      JOIN asignacion_docente_curso adc ON h.asignacion_id = adc.id
      JOIN cursos c ON adc.curso_id = c.id
      LEFT JOIN aulas a ON h.aula_id = a.id
      LEFT JOIN laboratorios l ON h.laboratorio_id = l.id
      WHERE adc.docente_id = $1 AND h.semestre = $2
      ORDER BY 
        CASE h.dia 
          WHEN 'Lunes' THEN 1 
          WHEN 'Martes' THEN 2 
          WHEN 'Miercoles' THEN 3 
          WHEN 'Jueves' THEN 4 
          WHEN 'Viernes' THEN 5 
          WHEN 'Sabado' THEN 6 
          WHEN 'Domingo' THEN 7 
        END, 
        h.hora_inicio;
    `;

    const { rows } = await pool.query(query, [Number(docente_id), semestre]);

    const result = rows.map((row) => ({
      id: row.id,
      dia: row.dia,
      hora_inicio: row.hora_inicio.slice(0, 5),
      hora_fin: row.hora_fin.slice(0, 5),
      curso: { codigo: row.curso_codigo, nombre: row.curso_nombre },
      aula: row.aula_codigo ? { codigo: row.aula_codigo } : null,
      laboratorio: row.lab_codigo ? { codigo: row.lab_codigo } : null,
    }));

    success(res, result, "Horario individual de docente recuperado con éxito");
  } catch (err) {
    console.error("Error en reporte individual:", err);
    error(res, "Error al recuperar el horario del docente", 500);
  }
});

/**
 * @route   GET /api/reportes/por-docente
 * @desc    Reporte completo por docente (info + horario + resumen)
 * @module  Modulo 4 - Reportes
 */
router.get("/por-docente", async (req, res) => {
  const { docente_id, semestre = "2026-1" } = req.query;
  if (!docente_id) {
    return error(res, "docente_id es requerido", 400);
  }

  try {
    // Info del docente
    const docenteRes = await pool.query(
      `SELECT id, nombres, apellidos, categoria, tipo_nombramiento, especialidad, antiguedad_anios
       FROM docentes WHERE id = $1`,
      [Number(docente_id)]
    );
    const docente = docenteRes.rows[0];
    if (!docente) {
      return error(res, "Docente no encontrado", 404);
    }

    // Horarios del docente
    const horariosRes = await pool.query(
      `SELECT
         h.id, h.dia, h.hora_inicio, h.hora_fin,
         c.codigo AS curso_codigo, c.nombre AS curso_nombre, c.ciclo AS curso_ciclo, c.creditos AS curso_creditos,
         a.codigo AS aula_codigo, l.codigo AS lab_codigo
       FROM horarios h
       JOIN asignacion_docente_curso adc ON h.asignacion_id = adc.id
       JOIN cursos c ON adc.curso_id = c.id
       LEFT JOIN aulas a ON h.aula_id = a.id
       LEFT JOIN laboratorios l ON h.laboratorio_id = l.id
       WHERE adc.docente_id = $1 AND h.semestre = $2
       ORDER BY
         CASE h.dia
           WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miercoles' THEN 3
           WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 WHEN 'Sabado' THEN 6 WHEN 'Domingo' THEN 7
         END, h.hora_inicio`,
      [Number(docente_id), semestre]
    );

    // Cursos asignados con horas
    const cursosRes = await pool.query(
      `SELECT
         c.codigo, c.nombre, c.ciclo, adc.tipo,
         COALESCE(SUM(EXTRACT(EPOCH FROM (h.hora_fin - h.hora_inicio))/3600), 0)::numeric(10,1) AS horas
       FROM asignacion_docente_curso adc
       JOIN cursos c ON adc.curso_id = c.id
       LEFT JOIN horarios h ON h.asignacion_id = adc.id AND h.semestre = $2
       WHERE adc.docente_id = $1 AND adc.semestre_asignacion = $2
       GROUP BY c.codigo, c.nombre, c.ciclo, adc.tipo
       ORDER BY c.ciclo, c.codigo`,
      [Number(docente_id), semestre]
    );

    const totalHoras = cursosRes.rows.reduce((sum, c) => sum + Number(c.horas), 0);

    success(res, {
      docente,
      semestre,
      horarios: horariosRes.rows.map(r => ({
        ...r,
        hora_inicio: r.hora_inicio?.slice(0, 5),
        hora_fin: r.hora_fin?.slice(0, 5),
      })),
      cursos: cursosRes.rows,
      resumen: {
        total_cursos: cursosRes.rows.length,
        total_horas: Number(totalHoras.toFixed(1)),
      }
    }, "Reporte por docente generado con exito");
  } catch (err) {
    console.error("Error en reporte por docente:", err);
    error(res, "Error al generar reporte por docente", 500);
  }
});

/**
 * @route   GET /api/reportes/por-dia
 * @desc    Reporte de horarios para un dia especifico
 * @module  Modulo 4 - Reportes
 */
router.get("/por-dia", async (req, res) => {
  const { dia, semestre = "2026-1" } = req.query;
  if (!dia) {
    return error(res, "dia es requerido", 400);
  }

  try {
    const horariosRes = await pool.query(
      `SELECT
         h.id, h.hora_inicio, h.hora_fin,
         c.codigo AS curso_codigo, c.nombre AS curso_nombre, c.ciclo AS curso_ciclo,
         d.nombres AS docente_nombres, d.apellidos AS docente_apellidos,
         a.codigo AS aula_codigo, l.codigo AS lab_codigo
       FROM horarios h
       JOIN asignacion_docente_curso adc ON h.asignacion_id = adc.id
       JOIN cursos c ON adc.curso_id = c.id
       JOIN docentes d ON adc.docente_id = d.id
       LEFT JOIN aulas a ON h.aula_id = a.id
       LEFT JOIN laboratorios l ON h.laboratorio_id = l.id
       WHERE h.dia = $1 AND h.semestre = $2
       ORDER BY h.hora_inicio, c.ciclo`,
      [dia, semestre]
    );

    // Lista de docentes que ensenan ese dia
    const docentesRes = await pool.query(
      `SELECT DISTINCT
         d.id, CONCAT(d.apellidos, ', ', d.nombres) AS nombre, d.categoria
       FROM horarios h
       JOIN asignacion_docente_curso adc ON h.asignacion_id = adc.id
       JOIN docentes d ON adc.docente_id = d.id
       WHERE h.dia = $1 AND h.semestre = $2
       ORDER BY nombre`,
      [dia, semestre]
    );

    // Lista de aulas/labs usados ese dia
    const ambientesRes = await pool.query(
      `SELECT DISTINCT COALESCE(a.codigo, l.codigo) AS codigo, COALESCE(a.nombre, l.nombre) AS nombre
       FROM horarios h
       LEFT JOIN aulas a ON h.aula_id = a.id
       LEFT JOIN laboratorios l ON h.laboratorio_id = l.id
       WHERE h.dia = $1 AND h.semestre = $2 AND (a.codigo IS NOT NULL OR l.codigo IS NOT NULL)
       ORDER BY codigo`,
      [dia, semestre]
    );

    success(res, {
      dia,
      semestre,
      horarios: horariosRes.rows.map(r => ({
        ...r,
        hora_inicio: r.hora_inicio?.slice(0, 5),
        hora_fin: r.hora_fin?.slice(0, 5),
      })),
      docentes: docentesRes.rows,
      ambientes: ambientesRes.rows,
      resumen: {
        total_clases: horariosRes.rows.length,
        total_docentes: docentesRes.rows.length,
        total_ambientes: ambientesRes.rows.length,
      }
    }, "Reporte por dia generado con exito");
  } catch (err) {
    console.error("Error en reporte por dia:", err);
    error(res, "Error al generar reporte por dia", 500);
  }
});

/**
 * @route   GET /api/reportes/por-aula
 * @desc    Reporte de horarios para un aula o laboratorio especifico
 * @module  Modulo 4 - Reportes
 */
router.get("/por-aula", async (req, res) => {
  const { aula_id, laboratorio_id, semestre = "2026-1" } = req.query;
  if (!aula_id && !laboratorio_id) {
    return error(res, "aula_id o laboratorio_id es requerido", 400);
  }

  try {
    let ambienteInfo = null;
    if (aula_id) {
      const aulaRes = await pool.query(`SELECT id, codigo, nombre, capacidad, tipo FROM aulas WHERE id = $1`, [Number(aula_id)]);
      ambienteInfo = aulaRes.rows[0];
    } else {
      const labRes = await pool.query(`SELECT id, codigo, nombre, capacidad FROM laboratorios WHERE id = $1`, [Number(laboratorio_id)]);
      ambienteInfo = labRes.rows[0];
    }

    if (!ambienteInfo) {
      return error(res, "Ambiente no encontrado", 404);
    }

    const params = aula_id ? [Number(aula_id), semestre] : [Number(laboratorio_id), semestre];
    const whereClause = aula_id ? "h.aula_id = $1" : "h.laboratorio_id = $1";

    const horariosRes = await pool.query(
      `SELECT
         h.id, h.dia, h.hora_inicio, h.hora_fin,
         c.codigo AS curso_codigo, c.nombre AS curso_nombre, c.ciclo AS curso_ciclo,
         d.nombres AS docente_nombres, d.apellidos AS docente_apellidos
       FROM horarios h
       JOIN asignacion_docente_curso adc ON h.asignacion_id = adc.id
       JOIN cursos c ON adc.curso_id = c.id
       JOIN docentes d ON adc.docente_id = d.id
       WHERE ${whereClause} AND h.semestre = $2
       ORDER BY
         CASE h.dia
           WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miercoles' THEN 3
           WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 WHEN 'Sabado' THEN 6 WHEN 'Domingo' THEN 7
         END, h.hora_inicio`,
      params
    );

    // Docentes que usan ese ambiente
    const docentesRes = await pool.query(
      `SELECT DISTINCT
         d.id, CONCAT(d.apellidos, ', ', d.nombres) AS nombre, d.categoria
       FROM horarios h
       JOIN asignacion_docente_curso adc ON h.asignacion_id = adc.id
       JOIN docentes d ON adc.docente_id = d.id
       WHERE ${whereClause} AND h.semestre = $2
       ORDER BY nombre`,
      params
    );

    success(res, {
      ambiente: ambienteInfo,
      tipo: aula_id ? "Aula" : "Laboratorio",
      semestre,
      horarios: horariosRes.rows.map(r => ({
        ...r,
        hora_inicio: r.hora_inicio?.slice(0, 5),
        hora_fin: r.hora_fin?.slice(0, 5),
      })),
      docentes: docentesRes.rows,
      resumen: {
        total_clases: horariosRes.rows.length,
        total_docentes: docentesRes.rows.length,
      }
    }, "Reporte por aula generado con exito");
  } catch (err) {
    console.error("Error en reporte por aula:", err);
    error(res, "Error al generar reporte por aula", 500);
  }
});

module.exports = router;
