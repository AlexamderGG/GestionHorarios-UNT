const ExcepcionModel = require("../models/excepcion.model");

const ExcepcionController = {
  crear: async (req, res, next) => {
    try {
      const docente_id = req.user?.id;
      const { asignacion_id, motivo, horarios_solicitados_ids } = req.body;

      if (!asignacion_id || !motivo) {
        return res.status(400).json({ 
          success: false, 
          message: "El curso afectado y la justificación son obligatorios." 
        });
      }

      // Validamos en el servidor que no exceda las 3 opciones por seguridad
      if (horarios_solicitados_ids && horarios_solicitados_ids.length > 3) {
        return res.status(400).json({
          success: false,
          message: "Solo puedes proponer un máximo de 3 opciones de horario."
        });
      }

      const nuevaExcepcion = await ExcepcionModel.create({
        docente_id,
        asignacion_id,
        motivo,
        horarios_solicitados_ids: horarios_solicitados_ids || []
      });

      return res.status(201).json({
        success: true,
        message: "Solicitud de excepción registrada con éxito.",
        data: nuevaExcepcion
      });
    } catch (error) {
      next(error);
    }
  },

  listarMisExcepciones: async (req, res, next) => {
    try {
      const docente_id = req.user?.id;
      const registros = await ExcepcionModel.getByDocente(docente_id);

      // Mapeamos los datos limpios directo al Frontend
      const dataFormateada = registros.map(r => ({
        id: r.id,
        docente_id: r.docente_id,
        asignacion_id: r.asignacion_id,
        motivo: r.motivo,
        estado: r.estado,
        created_at: r.created_at,
        curso_codigo: r.curso_codigo,
        curso_nombre: r.curso_nombre,
        tipo: r.tipo,
        // Viene formateado como arreglo nativo desde la subconsulta de Postgres
        horarios_solicitados: r.horarios_solicitados || [] 
      }));

      return res.status(200).json({
        success: true,
        data: dataFormateada
      });
    } catch (error) {
      next(error);
    }
  },

  // GET: Listar todas las excepciones del sistema (Rol Admin/Secretaría)
  listarTodasAdmin: async (req, res, next) => {
    try {
      const registros = await ExcepcionModel.getAll();
      const dataFormateada = registros.map(r => ({
        id: r.id,
        docente: `${r.docente_nombres} ${r.docente_apellidos}`.trim(),
        curso_codigo: r.curso_codigo,
        curso_nombre: r.curso_nombre,
        tipo: r.tipo,
        motivo: r.motivo,
        estado: r.estado,
        created_at: r.created_at,
        horarios_solicitados: r.horarios_solicitados || []
      }));

      return res.status(200).json({ success: true, data: dataFormateada });
    } catch (error) {
      next(error);
    }
  },

  // PATCH: Resolver estado de la excepción
  evaluarExcepcion: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { estado } = req.body; // 'Aprobado' o 'Rechazado'

      if (!['Aprobado', 'Rechazado'].includes(estado)) {
        return res.status(400).json({ success: false, message: "Estado de evaluación inválido." });
      }

      const actualizada = await ExcepcionModel.updateEstado(id, estado);
      return res.status(200).json({ 
        success: true, 
        message: `Solicitud marcada como ${estado} con éxito.`,
        data: actualizada 
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE: Eliminar por completo de la BD (Rol Admin/Secretaría)
  eliminarExcepcion: async (req, res, next) => {
    try {
      const { id } = req.params;

      const eliminada = await ExcepcionModel.delete(id);
      
      if (!eliminada) {
        return res.status(404).json({ success: false, message: "La excepción ya no existe o ya fue eliminada." });
      }

      return res.status(200).json({ 
        success: true, 
        message: "Solicitud borrada permanentemente de la base de datos." 
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = ExcepcionController;