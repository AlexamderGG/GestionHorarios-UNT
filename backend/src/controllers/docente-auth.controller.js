const HorarioModel = require("../models/horario.model");
const AsignacionModel = require("../models/asignacion.model");
const AulaModel = require("../models/aula.model");
const LaboratorioModel = require("../models/laboratorio.model");
const ConfiguracionModel = require("../models/configuracion.model");
const DocenteModel = require('../models/docente.model');
const CursoModel = require("../models/curso.model"); // 👇 IMPORTACIÓN INYECTADA CORRECTAMENTE
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../config/db');
const { success, error } = require("../utils/responseHelper");

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const DIAS_VALIDOS = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo",
];

const normalizarHora = (hora) => String(hora).slice(0, 5);

//  Función auxiliar para convertir "HH:MM" a valor numérico de horas
const timeToHours = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours + minutes / 60;
};

const timeToMinutes = (hora) => {
  const [hours, minutes] = normalizarHora(hora).split(":").map(Number);
  return hours * 60 + minutes;
};

const DocenteAuthController = {
  getMisCursos: async (req, res) => {
    try {
      const semestreActual = req.query.semestre || "2026-1";
      const docenteId = Number(req.user.id);

      if (!docenteId || isNaN(docenteId)) {
        return error(res, "ID de docente inválido en el token", 400);
      }

      console.log(`[getMisCursos] docenteId=${docenteId}, semestre=${semestreActual}`);

      const asignaciones = await AsignacionModel.getByDocente(docenteId, semestreActual);
      console.log(`[getMisCursos] asignaciones encontradas: ${asignaciones.length}`);

      const horarios = await HorarioModel.getAll({
        docente_id: docenteId,
        semestre: semestreActual,
      });
      const horariosPorAsignacion = {};
      horarios.forEach((h) => {
        horariosPorAsignacion[h.asignacion_id] = h;
      });

      const cursos = asignaciones.map((a) => ({
        ...a,
        tiene_horario: !!horariosPorAsignacion[a.id],
        horario: horariosPorAsignacion[a.id] || null,
      }));

      success(res, cursos, "Cursos obtenidos correctamente");
    } catch (err) {
      console.error("[getMisCursos] ERROR:", err);
      error(res, "Error al obtener cursos", 500);
    }
  },

  getMiHorario: async (req, res) => {
    try {
      const semestre = req.query.semestre || "2026-1";
      const horarios = await HorarioModel.getAll({
        docente_id: req.user.id,
        semestre,
      });
      success(res, horarios, "Horario obtenido correctamente");
    } catch (err) {
      console.error(err);
      error(res, "Error al obtener horario", 500);
    }
  },

  seleccionarHorario: async (req, res) => {
    try {
      //  BARRERA DE SEGURIDAD CONTRA INTENTOS FUERA DE TURNO
      const docente = await DocenteModel.getById(req.user.id);
      if (!docente) return error(res, "Docente no encontrado", 404);

      if (docente.estado_turno === 'Completado') {
        return error(
          res, 
          "Tu turno ya ha finalizado. No puedes seleccionar más horarios. Ponte en contacto con Secretaría Académica si requieres una re-habilitación.", 
          403
        );
      }

      if (docente.estado_turno === 'Pendiente') {
        return error(res, "Debes esperar tu turno activo según el escalafón para seleccionar horarios.", 403);
      }

      if (docente.estado_turno === 'Automatico') {
        return error(res, "Tu horario será asignado de forma automática por el sistema.", 403);
      }
      // 👆 FIN DE LA BARRERA DE SEGURIDAD

      const {
        asignacion_id,
        dia,
        hora_inicio,
        hora_fin,
        aula_id,
        laboratorio_id,
      } = req.body;

      if (!asignacion_id || !Number.isInteger(Number(asignacion_id))) {
        return error(res, "asignacion_id es requerido y debe ser entero", 400);
      }
      if (!dia || !DIAS_VALIDOS.includes(dia)) {
        return error(
          res,
          `dia debe ser uno de: ${DIAS_VALIDOS.join(", ")}`,
          400,
        );
      }

      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      const hIni = normalizarHora(hora_inicio);
      const hFin = normalizarHora(hora_fin);
      if (!timeRegex.test(hIni))
        return error(res, "hora_inicio en formato HH:MM", 400);
      if (!timeRegex.test(hFin))
        return error(res, "hora_fin en formato HH:MM", 400);
      if (timeToMinutes(hIni) >= timeToMinutes(hFin))
        return error(res, "hora_inicio debe ser menor que hora_fin", 400);

      // Obtención de la asignación desde la base de datos
      const asignacion = await AsignacionModel.getById(asignacion_id);
      if (!asignacion) return error(res, "Asignación no encontrada", 404);
      if (asignacion.docente_id !== req.user.id)
        return error(res, "Esta asignación no te pertenece", 403);

      //  SOLUCIÓN REFORZADA: Consultar el curso directamente para asegurar las horas
      const cursoInfo = await CursoModel.getById(asignacion.curso_id);
      if (!cursoInfo) return error(res, "El curso asociado a la asignación no existe", 404);

      //  NUEVA BARRERA: VALIDACIÓN DE DURACIÓN ESTRICTA (RESPETAR PLAN DE ESTUDIOS)
      const tipo = asignacion.tipo; // 'Teoria' o 'Laboratorio'
      let horasRequeridas = 0;

      if (tipo === 'Teoria') {
        horasRequeridas = Number(cursoInfo.horas_aula) || 0;
      } else if (tipo === 'Laboratorio') {
        horasRequeridas = Number(cursoInfo.horas_lab) || 0;
      }

      // Si el curso tiene horas definidas, validamos que el bloque coincida exactamente
      if (horasRequeridas > 0) {
        const hIniVal = timeToHours(hIni);
        const hFinVal = timeToHours(hFin);
        const duracionPropuesta = hFinVal - hIniVal;

        // Comparamos usando un margen de error para tipos flotantes (0.001 horas)
        if (Math.abs(duracionPropuesta - horasRequeridas) > 0.001) {
          return error(
            res, 
            `Duración inválida: Esta asignatura '${cursoInfo.nombre}' (${tipo}) requiere exactamente ${horasRequeridas} horas semanales según el plan de estudios. El bloque propuesto (${hIni} - ${hFin}) tiene una duración de ${duracionPropuesta.toFixed(1)} horas.`, 
            400
          );
        }
      }
      // 👆 FIN VALIDACIÓN DURACIÓN

      const restriction = await HorarioModel.existeRestriccionDocente({
        docente_id: req.user.id,
        dia,
        hora_inicio: hIni,
        hora_fin: hFin,
      });
      if (restriction)
        return error(res, "Tienes una restricción horaria en ese rango", 409);

      const semestre = asignacion.semestre_asignacion || "2026-1";

      const conflictoDocente = await HorarioModel.existeConflictoDocente({
        docente_id: req.user.id,
        semestre,
        dia,
        hora_inicio: hIni,
        hora_fin: hFin,
      });
      if (conflictoDocente)
        return error(res, "Ya tienes una clase en ese horario", 409);

      // NUEVA BARRERA: CONFLICTO DE CICLO (Excepción 50/50 Electivos y Laboratorios)
      const conflictoCiclo = await HorarioModel.existeConflictoCiclo({
        ciclo: asignacion.ciclo || asignacion.curso_ciclo || cursoInfo.ciclo, 
        semestre,
        dia,
        hora_inicio: hIni,
        hora_fin: hFin,
        curso_codigo: cursoInfo.codigo, // AÑADIDO
        tipo: asignacion.tipo           // AÑADIDO
      });
      
      if (conflictoCiclo) {
        return error(
          res, 
          `Conflicto de Ciclo: Ya existe otra asignatura regular programada, o se ha alcanzado el límite máximo (2) de laboratorios/electivos simultáneos para el Ciclo ${asignacion.ciclo || cursoInfo.ciclo}.`, 
          409
        );
      }

      const ambientesBase =
        asignacion.tipo === "Teoria"
          ? await HorarioModel.getAulasActivas()
          : await HorarioModel.getLaboratoriosActivos();

      const ambientesLibres = [];
      for (const amb of ambientesBase) {
        const conflicto =
          asignacion.tipo === "Teoria"
            ? await HorarioModel.existeConflictoAula({
                aula_id: amb.id,
                semestre,
                dia,
                hora_inicio: hIni,
                hora_fin: hFin,
              })
            : await HorarioModel.existeConflictoLaboratorio({
                laboratorio_id: amb.id,
                semestre,
                dia,
                hora_inicio: hIni,
                hora_fin: hFin,
              });
        if (!conflicto) ambientesLibres.push(amb);
      }

      if (ambientesLibres.length === 0) {
        return error(res, "No hay ambientes disponibles en ese horario", 409);
      }

      let ambienteSeleccionado = null;
      if (asignacion.tipo === "Teoria") {
        if (aula_id) {
          const aulaOk = ambientesLibres.find(
            (a) => Number(a.id) === Number(aula_id),
          );
          if (!aulaOk)
            return error(res, "El aula seleccionada no está disponible", 409);
          ambienteSeleccionado = { tipo: "aula", id: Number(aula_id) };
        } else {
          const preferido = asignacion.ambiente_preferido_id
            ? ambientesLibres.find(
                (a) =>
                  Number(a.id) === Number(asignacion.ambiente_preferido_id),
              )
            : null;
          ambienteSeleccionado = {
            tipo: "aula",
            id: (preferido || ambientesLibres[0]).id,
          };
        }
      } else {
        if (laboratorio_id) {
          const labOk = ambientesLibres.find(
            (l) => Number(l.id) === Number(laboratorio_id),
          );
          if (!labOk)
            return error(
              res,
              "El laboratorio seleccionado no está disponible",
              409,
            );
          ambienteSeleccionado = {
            tipo: "laboratorio",
            id: Number(laboratorio_id),
          };
        } else {
          const preferido = asignacion.ambiente_preferido_id
            ? ambientesLibres.find(
                (l) =>
                  Number(l.id) === Number(asignacion.ambiente_preferido_id),
              )
            : null;
          ambienteSeleccionado = {
            tipo: "laboratorio",
            id: (preferido || ambientesLibres[0]).id,
          };
        }
      }

      const horario = await HorarioModel.create({
        asignacion_id: Number(asignacion_id),
        semestre,
        dia,
        hora_inicio: hIni,
        hora_fin: hFin,
        aula_id:
          ambienteSeleccionado.tipo === "aula" ? ambienteSeleccionado.id : null,
        laboratorio_id:
          ambienteSeleccionado.tipo === "laboratorio"
            ? ambienteSeleccionado.id
            : null,
        generado_automaticamente: false,
        editado_manualmente: true,
      });

      const horarioCompleto = await HorarioModel.getById(horario.id);
      success(res, horarioCompleto, "Horario seleccionado correctamente", 201);
    } catch (err) {
      console.error(err);
      error(res, "Error al seleccionar horario", 500);
    }
  },

  eliminarMiHorario: async (req, res) => {
    try {
      const { id } = req.params;
      if (!Number.isInteger(Number(id)))
        return error(res, "id debe ser entero", 400);

      const docente = await DocenteModel.getById(req.user.id);
      if (!docente) return error(res, "Docente no encontrado", 404);

      if (docente.estado_turno === 'Completado') {
        return error(res, 'Tu turno ya ha finalizado. No puedes modificar tus horarios.', 403);
      }

      if (docente.estado_turno === 'Pendiente') {
        return error(res, 'Debes esperar tu turno según el escalafón para editar horarios.', 403);
      }

      const horario = await HorarioModel.getById(id);
      if (!horario) return error(res, "Horario no encontrado", 404);
      
      if (horario.docente?.id !== req.user.id)
        return error(res, "Este horario no te pertenece", 403);
      
      const esSuTurnoActivo = docente.estado_turno === 'Notificado';
      
      if (horario.editado_manualmente && !esSuTurnoActivo) {
        return error(
          res,
          "No puedes eliminar horarios editados manualmente sin un turno activo",
          403,
        );
      }

      await HorarioModel.delete(id);
      success(res, null, "Horario eliminado correctamente");
    } catch (err) {
      console.error(err);
      error(res, "Error al eliminar horario", 500);
    }
  },

  getAmbientesDisponibles: async (req, res) => {
    try {
      const docente = await DocenteModel.getById(req.user.id);
      if (!docente || docente.estado_turno === 'Completado' || docente.estado_turno === 'Pendiente') {
        return success(res, [], "No tiene un turno activo para ver ambientes disponibles");
      }
      const { asignacion_id, dia, hora_inicio, hora_fin, semestre } = req.query;

      if (!asignacion_id || !dia || !hora_inicio || !hora_fin) {
        return error(
          res,
          "asignacion_id, dia, hora_inicio y hora_fin son requeridos",
          400,
        );
      }

      const asignacion = await AsignacionModel.getById(Number(asignacion_id));
      if (!asignacion) return error(res, "Asignación no encontrada", 404);
      if (asignacion.docente_id !== req.user.id)
        return error(res, "Esta asignación no te pertenece", 403);

      const sem = semestre || asignacion.semestre_asignacion || "2026-1";
      const hIni = normalizarHora(hora_inicio);
      const hFin = normalizarHora(hora_fin);

      const ambientesBase =
        asignacion.tipo === "Teoria"
          ? await HorarioModel.getAulasActivas()
          : await HorarioModel.getLaboratoriosActivos();

      const disponibles = [];
      for (const amb of ambientesBase) {
        const conflicto =
          asignacion.tipo === "Teoria"
            ? await HorarioModel.existeConflictoAula({
                aula_id: amb.id,
                semestre: sem,
                dia,
                hora_inicio: hIni,
                hora_fin: hFin,
              })
            : await HorarioModel.existeConflictoLaboratorio({
                laboratorio_id: amb.id,
                semestre: sem,
                dia,
                hora_inicio: hIni,
                hora_fin: hFin,
              });
        if (!conflicto) disponibles.push(amb);
      }

      success(
        res,
        disponibles,
        "Ambientes disponibles obtenidos correctamente",
      );
    } catch (err) {
      console.error(err);
      error(res, "Error al obtener ambientes disponibles", 500);
    }
  },

  finalizarTurno: async (req, res) => {
    const docenteId = req.user.id;
    const docenteActual = await DocenteModel.getById(docenteId);

    if (!docenteActual) {
      return res.status(404).json({ success: false, message: 'Docente no encontrado.' });
    }

    if (docenteActual.estado_turno === 'Completado') {
      return res.status(400).json({ 
        success: false, 
        message: 'Acción rechazada: Su turno ya fue finalizado anteriormente.' 
      });
    }

    if (docenteActual.estado_turno !== 'Notificado') {
      return res.status(400).json({ 
        success: false, 
        message: 'Acción rechazada: No tiene un turno activo para finalizar.' 
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await DocenteModel.updateEstadoTurno(docenteId, 'Completado', client);

      const escalafon = await DocenteModel.getDocentesPorEscalafon(client);

      const yaHayDocenteActivo = escalafon.some(d => d.estado_turno === 'Notificado');

      if (!yaHayDocenteActivo) {
        const siguienteDocente = escalafon.find(d => d.estado_turno === 'Pendiente');

        if (siguienteDocente) {
          await DocenteModel.updateEstadoTurno(siguienteDocente.id, 'Notificado', client);

          const passwordTemporal = `UNT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
          const saltRounds = 10;
          const hashedPassword = await bcrypt.hash(passwordTemporal, saltRounds);
          
          if (DocenteModel.updatePassword) {
              await DocenteModel.updatePassword(siguienteDocente.id, hashedPassword, client);
          }

          const mailOptions = {
            from: `"Secretaría Académica UNT" <${process.env.EMAIL_USER}>`,
            to: siguienteDocente.email,
            subject: 'Su turno para selección de horarios - UNT',
            html: `
              <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
                <h2 style="color: #1a56db;">Estimado/a ${siguienteDocente.nombres} ${siguienteDocente.apellidos},</h2>
                <p>El docente anterior ha finalizado. <strong>¡Ya es su turno!</strong></p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
                  <p><strong>Usuario:</strong> ${siguienteDocente.email}</p>
                  <p><strong>Contraseña Temporal:</strong> ${passwordTemporal}</p>
                </div>
              </div>
            `
          };
          await transporter.sendMail(mailOptions);
        }
      } else {
        console.log(`[finalizarTurno] Omitiendo avance automático: ya existe un docente activo subsiguiente armando su horario.`);
      }

      await client.query('COMMIT');
      return res.status(200).json({ success: true, message: 'Turno finalizado con éxito.' });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error en transición automática de turno:', err);
      return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    } finally {
      client.release();
    }
  },

  getMiEstado: async (req, res) => {
    try {
      const docente = await DocenteModel.getById(req.user.id);
      if (!docente) {
        return error(res, "Docente no encontrado", 404);
      }
      success(res, { estado_turno: docente.estado_turno }, "Estado obtenido correctamente");
    } catch (err) {
      console.error(err);
      error(res, "Error al obtener el estado del docente", 500);
    }
  },
  
  // Obtener perfil del docente logueado
  getMiPerfil: async (req, res) => {
    try {
      // Tu middleware de autenticación (authenticate) debería inyectar req.user con el ID del token
      const docenteId = req.user.id; 

      const query = `
        SELECT id, nombres, apellidos, email, estado_turno 
        FROM docentes 
        WHERE id = $1
      `;
      const result = await pool.query(query, [docenteId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Docente no encontrado' });
      }

      return res.json({ success: true, data: result.rows[0] });

    } catch (error) {
      console.error('Error al obtener mi perfil:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  },
};

module.exports = DocenteAuthController;