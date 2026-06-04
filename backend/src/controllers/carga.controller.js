const CargaNoLectiva = require('../models/carga_no_lectiva.model');

exports.getMiCarga = async (req, res) => {
  try {
    const docenteId = req.user.id;
    const semestre = req.query.semestre || '2026-1'; // Idealmente obtenerlo de config

    const resumen = await CargaNoLectiva.getResumenDocente(docenteId, semestre);

    // Definir rangos según modalidad
    const maxHoras = resumen.modalidad === 'Tiempo Parcial' ? 20 : 40;
    const minHoras = resumen.modalidad === 'Tiempo Parcial' ? 10 : 30;

    res.json({
      success: true,
      data: {
        ...resumen,
        limites: { max: maxHoras, min: minHoras }
      }
    });
  } catch (error) {
    console.error('Error al obtener carga horaria:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

exports.guardarMiCarga = async (req, res) => {
  try {
    const docenteId = req.user.id;
    const { semestre, carga } = req.body;

    // 1. Obtener la carga lectiva y modalidad actual para validar
    const resumen = await CargaNoLectiva.getResumenDocente(docenteId, semestre);
    
    // 2. Calcular el total No Lectivo que intenta guardar
    const totalNoLectivo = 
      Number(carga.preparacion_clases || 0) + 
      Number(carga.tutoria_consejeria || 0) + 
      Number(carga.investigacion || 0) + 
      Number(carga.gestion_admin || 0) + 
      Number(carga.capacitacion || 0) + 
      Number(carga.otras_actividades || 0);

    const totalGeneral = resumen.horasLectivas + totalNoLectivo;

    // 3. Validar con los rangos (Mínimos y Máximos)
    const maxHoras = resumen.modalidad === 'Tiempo Parcial' ? 20 : 40;
    const minHoras = resumen.modalidad === 'Tiempo Parcial' ? 10 : 30;

    if (totalGeneral > maxHoras) {
      return res.status(400).json({ 
        success: false, 
        message: `Excedes el límite. Tu máximo es ${maxHoras}h y estás intentando registrar ${totalGeneral}h (Lectivas + No Lectivas).` 
      });
    }

    if (totalGeneral < minHoras) {
      return res.status(400).json({ 
        success: false, 
        message: `No alcanzas el mínimo requerido. Tu mínimo es ${minHoras}h y estás registrando solo ${totalGeneral}h.` 
      });
    }

    // 4. Si pasa las validaciones, guardar en BD
    const guardado = await CargaNoLectiva.upsertCarga(docenteId, semestre, carga);

    res.json({
      success: true,
      message: 'Carga horaria declarada correctamente.',
      data: guardado
    });

  } catch (error) {
    console.error('Error al guardar carga horaria:', error);
    res.status(500).json({ success: false, message: 'Error al procesar la carga horaria' });
  }
};