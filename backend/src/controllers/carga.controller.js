const CargaNoLectiva = require('../models/carga_no_lectiva.model');
const AsignacionModel = require('../models/asignacion.model');

exports.getMiCarga = async (req, res) => {
  try {
    const docenteId = req.user.id;
    const semestre = req.query.semestre || '2026-1'; // Idealmente obtenerlo de config

    const resumen = await CargaNoLectiva.getResumenDocente(docenteId, semestre);

    // Definir la cantidad EXACTA requerida según modalidad
    const horasRequeridas = resumen.modalidad === 'Tiempo Parcial' ? 20 : 40;

    res.json({
      success: true,
      data: {
        ...resumen,
        // Enviamos el mismo valor como max, min y requerido para no romper tu frontend
        limites: { max: horasRequeridas, min: horasRequeridas, requerido: horasRequeridas }
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
      Number(carga.asesoria_tesis || 0) + 
      Number(carga.responsabilidad_social || 0) + 
      Number(carga.produccion_intelectual || 0) + 
      Number(carga.investigacion || 0) + 
      Number(carga.gestion_admin || 0) + 
      Number(carga.capacitacion || 0) + 
      Number(carga.otras_actividades || 0);

    const totalGeneral = resumen.horasLectivas + totalNoLectivo;

    // 3. Validar con la hora EXACTA (20 o 40)
    const horasRequeridas = resumen.modalidad === 'Tiempo Parcial' ? 20 : 40;

    // Si el total no es estrictamente igual al requerido, lo bloqueamos
    if (totalGeneral !== horasRequeridas) {
      return res.status(400).json({ 
        success: false, 
        message: `Acción rechazada: Debes justificar exactamente ${horasRequeridas}h según tu modalidad. Actualmente estás sumando ${totalGeneral}h (Lectivas + No Lectivas).` 
      });
    }

    // 4. Si pasa la validación exacta, guardar en BD
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

exports.getCargaDocente = async (req, res) => {
  try {
    const docenteId = parseInt(req.params.docente_id, 10);
    const semestre = req.query.semestre || '2026-1';

    const [resumen, cursos] = await Promise.all([
      CargaNoLectiva.getResumenDocente(docenteId, semestre),
      AsignacionModel.getByDocente(docenteId, semestre)
    ]);

    const horasRequeridas = resumen.modalidad === 'Tiempo Parcial' ? 20 : 40;

    res.json({
      success: true,
      data: {
        ...resumen,
        cursos,
        limites: { max: horasRequeridas, min: horasRequeridas, requerido: horasRequeridas }
      }
    });
  } catch (error) {
    console.error('Error al obtener carga del docente:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};