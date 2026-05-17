const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { success, error } = require('../utils/responseHelper');

/**
 * @route   GET /api/reportes/operacional
 * @desc    Reporte operacional: horarios agrupados por aula/laboratorio, día y hora
 * @module  Modulo 4 - Reportes
 */
router.get('/operacional', async (req, res) => {
  const semestre = req.query.semestre || '2024-1';
  
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
    
    rows.forEach(row => {
      const ambienteKey = row.aula_codigo ? `Aula ${row.aula_codigo}` : `Laboratorio ${row.lab_codigo}`;
      
      if (!reportestructurado[ambienteKey]) {
        reportestructurado[ambienteKey] = [];
      }
      
      reportestructurado[ambienteKey].push({
        dia: row.dia,
        hora_inicio: row.hora_inicio.slice(0, 5),
        hora_fin: row.hora_fin.slice(0, 5),
        curso: { nombre: row.curso_nombre },
        docente: { apellidos: row.docente_apellidos, nombres: row.docente_nombres }
      });
    });
    
    success(res, reportestructurado, 'Reporte operacional generado con éxito');
  } catch (err) {
    console.error('Error en reporte operacional:', err);
    error(res, 'Error al compilar el reporte operacional', 500);
  }
});

/**
 * @route   GET /api/reportes/gestion
 * @desc    Reporte de gestion: resumen por docente (categoria, antiguedad, carga horaria)
 * @module  Modulo 4 - Reportes
 */
router.get('/gestion', async (req, res) => {
  const semestre = req.query.semestre || '2024-1';

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
    success(res, rows, 'Reporte de gestión de docentes generado con éxito');
  } catch (err) {
    console.error('Error en reporte de gestion:', err);
    error(res, 'Error al compilar el reporte de gestión', 500);
  }
});

/**
 * @route   GET /api/reportes/docente/:docente_id
 * @desc    Horario individual detallado de un docente
 * @module  Modulo 4 - Reportes
 */
router.get('/docente/:docente_id', async (req, res) => {
  const { docente_id } = req.params;
  const semestre = req.query.semestre || '2024-1';
  
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
    
    const result = rows.map(row => ({
      id: row.id,
      dia: row.dia,
      hora_inicio: row.hora_inicio.slice(0, 5),
      hora_fin: row.hora_fin.slice(0, 5),
      curso: { codigo: row.curso_codigo, nombre: row.curso_nombre },
      aula: row.aula_codigo ? { codigo: row.aula_codigo } : null,
      laboratorio: row.lab_codigo ? { codigo: row.lab_codigo } : null
    }));
    
    success(res, result, 'Horario individual de docente recuperado con éxito');
  } catch (err) {
    console.error('Error en reporte individual:', err);
    error(res, 'Error al recuperar el horario del docente', 500);
  }
});

module.exports = router;