const pool = require('../config/db');

const CargaNoLectiva = {
  getResumenDocente: async (docenteId, semestre) => {
    // 1. Obtener datos del docente
    const docQuery = await pool.query(
      'SELECT dni, nombres, apellidos, modalidad, tipo_nombramiento, categoria, escuela FROM docentes WHERE id = $1',
      [docenteId]
    );
    const docenteData = docQuery.rows[0] || {};
    const modalidad = docenteData.modalidad || 'Tiempo Completo';
    const docenteNombre = `${docenteData.nombres || ''} ${docenteData.apellidos || ''}`.trim();
    const docenteDni = docenteData.dni || '';

    // 2. Sumar horas lectivas de sus asignaciones en este semestre
    const lectQuery = await pool.query(`
      SELECT COALESCE(SUM(horas_asignadas), 0) AS total_lectivas 
      FROM asignacion_docente_curso 
      WHERE docente_id = $1 AND semestre_asignacion = $2
    `, [docenteId, semestre]);
    
    const horasLectivas = parseInt(lectQuery.rows[0].total_lectivas, 10);

    // 3. Obtener su carga no lectiva guardada (si existe)
    const noLectQuery = await pool.query(`
      SELECT * FROM carga_no_lectiva 
      WHERE docente_id = $1 AND semestre = $2
    `, [docenteId, semestre]);

    return {
      docenteNombre,
      docenteDni,
      modalidad,
      tipo_nombramiento: docenteData.tipo_nombramiento || '',
      categoria: docenteData.categoria || '',
      escuela: docenteData.escuela || '',
      horasLectivas,
      cargaNoLectiva: noLectQuery.rows[0] || null
    };
  },

  // Guardar o actualizar la carga no lectiva (Upsert)
  upsertCarga: async (docenteId, semestre, datos) => {
    const query = `
      INSERT INTO carga_no_lectiva (
        docente_id, semestre, 
        preparacion_clases, preparacion_clases_detalle,
        tutoria_consejeria, tutoria_consejeria_detalle,
        asesoria_tesis, asesoria_tesis_detalle,
        investigacion, investigacion_detalle,
        responsabilidad_social, responsabilidad_social_detalle,
        gestion_admin, gestion_admin_detalle,
        produccion_intelectual, produccion_intelectual_detalle,
        capacitacion, capacitacion_detalle,
        otras_actividades, otras_actividades_detalle
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      ON CONFLICT (docente_id, semestre) 
      DO UPDATE SET 
        preparacion_clases = EXCLUDED.preparacion_clases,
        preparacion_clases_detalle = EXCLUDED.preparacion_clases_detalle,
        tutoria_consejeria = EXCLUDED.tutoria_consejeria,
        tutoria_consejeria_detalle = EXCLUDED.tutoria_consejeria_detalle,
        asesoria_tesis = EXCLUDED.asesoria_tesis,
        asesoria_tesis_detalle = EXCLUDED.asesoria_tesis_detalle,
        investigacion = EXCLUDED.investigacion,
        investigacion_detalle = EXCLUDED.investigacion_detalle,
        responsabilidad_social = EXCLUDED.responsabilidad_social,
        responsabilidad_social_detalle = EXCLUDED.responsabilidad_social_detalle,
        gestion_admin = EXCLUDED.gestion_admin,
        gestion_admin_detalle = EXCLUDED.gestion_admin_detalle,
        produccion_intelectual = EXCLUDED.produccion_intelectual,
        produccion_intelectual_detalle = EXCLUDED.produccion_intelectual_detalle,
        capacitacion = EXCLUDED.capacitacion,
        capacitacion_detalle = EXCLUDED.capacitacion_detalle,
        otras_actividades = EXCLUDED.otras_actividades,
        otras_actividades_detalle = EXCLUDED.otras_actividades_detalle
      RETURNING *;
    `;
    const values = [
      docenteId, semestre, 
      datos.preparacion_clases || 0, datos.preparacion_clases_detalle || '',
      datos.tutoria_consejeria || 0, datos.tutoria_consejeria_detalle || '',
      datos.asesoria_tesis || 0, datos.asesoria_tesis_detalle || '',
      datos.investigacion || 0, datos.investigacion_detalle || '',
      datos.responsabilidad_social || 0, datos.responsabilidad_social_detalle || '',
      datos.gestion_admin || 0, datos.gestion_admin_detalle || '',
      datos.produccion_intelectual || 0, datos.produccion_intelectual_detalle || '',
      datos.capacitacion || 0, datos.capacitacion_detalle || '',
      datos.otras_actividades || 0, datos.otras_actividades_detalle || ''
    ];
    
    const res = await pool.query(query, values);
    return res.rows[0];
  }
};

module.exports = CargaNoLectiva;