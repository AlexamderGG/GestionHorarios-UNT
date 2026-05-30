const HorarioModel = require("../models/horario.model");
const SchedulerService = require("../services/scheduler.service");
const DocenteModel = require('../models/docente.model');
const ConfiguracionModel = require('../models/configuracion.model');
const pool = require('../config/db'); // 🌟 CORREGIDO: Importación única y global en el top
const { success, error } = require("../utils/responseHelper");

const timeToHours = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours + minutes / 60;
};

const validarFiltros = (query) => {
  const errores = [];
  const enteros = ["docente_id", "aula_id", "laboratorio_id"];

  enteros.forEach((campo) => {
    if (
      query[campo] !== undefined &&
      query[campo] !== "" &&
      !Number.isInteger(Number(query[campo]))
    ) {
      errores.push(`${campo} debe ser entero`);
    }
  });

  if (query.dia && !SchedulerService.DIAS_VALIDOS.includes(query.dia)) {
    errores.push(
      `dia debe ser uno de: ${SchedulerService.DIAS_VALIDOS.join(", ")}`,
    );
  }

  if (
    query.semestre &&
    SchedulerService.validarSemestre(String(query.semestre))
  ) {
    errores.push(SchedulerService.validarSemestre(String(query.semestre)));
  }

  return errores;
};

const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
};

const HorariosController = {
  getAll: async (req, res) => {
    try {
      const errores = validarFiltros(req.query);
      if (errores.length > 0)
        return error(res, "Validación fallida", 400, errores);

      const horarios = await HorarioModel.getAll(req.query);
      return success(res, horarios, "Horarios obtenidos correctamente");
    } catch (err) {
      console.error(err);
      return error(res, "Error al obtener horarios", 500);
    }
  },

  getEstadoSeleccion: async (req, res) => {
    try {
      const semestre = req.query.semestre || "2026-1";
      const estado = await HorarioModel.getEstadoSeleccion(semestre);
      return success(res, estado, "Estado de selección obtenido correctamente");
    } catch (err) {
      console.error(err);
      return error(res, "Error al obtener estado de selección", 500);
    }
  },

  generar: async (req, res) => {
    try {
      const { semestre = "2026-1", forzar = false } = req.body || {};
      const resultado = await SchedulerService.generarHorarios({
        semestre,
        forzar: parseBoolean(forzar),
      });

      if (!resultado.ok) {
        return error(
          res,
          resultado.message,
          resultado.status || 400,
          resultado.errors || null,
        );
      }

      return success(res, resultado.data, resultado.message, resultado.status || 201);
    } catch (err) {
      console.error(err);
      return error(res, "Error al generar horarios", 500);
    }
  },

  getAulas: async (req, res) => {
    try {
      const aulas = await HorarioModel.getAulasActivas();
      return success(res, aulas, "Aulas obtenidas correctamente");
    } catch (err) {
      console.error(err);
      return error(res, "Error al obtener aulas", 500);
    }
  },

  getLaboratorios: async (req, res) => {
    try {
      const laboratorios = await HorarioModel.getLaboratoriosActivos();
      return success(res, laboratorios, "Laboratorios obtenidos correctamente");
    } catch (err) {
      console.error(err);
      return error(res, "Error al obtener laboratorios", 500);
    }
  },

  create: async (req, res) => {
    try {
      const { asignacion_id, dia, hora_inicio, hora_fin, aula_id, laboratorio_id } = req.body;

      if (!asignacion_id || !Number.isInteger(Number(asignacion_id))) {
        return error(res, "asignacion_id es requerido y debe ser entero", 400);
      }
      if (!dia || !SchedulerService.DIAS_VALIDOS.includes(dia)) {
        return error(res, "El día proporcionado no es válido", 400);
      }
      if (!hora_inicio || !hora_fin) {
        return error(res, "La hora de inicio y fin son requeridas", 400);
      }
      
      const matchCurso = await pool.query(
        `SELECT c.horas_aula, c.horas_lab, a.tipo, c.nombre, c.ciclo, a.docente_id, a.semestre_asignacion
         FROM asignacion_docente_curso a
         JOIN cursos c ON a.curso_id = c.id
         WHERE a.id = $1`,
        [Number(asignacion_id)]
      );

      if (matchCurso.rows.length === 0) {
        return error(res, "La asignación docente-curso especificada no existe", 404);
      }

      const infoCurso = matchCurso.rows[0];
      const tipo = infoCurso.tipo; 
      const semestre = infoCurso.semestre_asignacion || "2026-1";
      const docente_id = infoCurso.docente_id;
      const ciclo = infoCurso.ciclo;

      const yaTieneHorario = await pool.query(
        `SELECT id FROM horarios WHERE asignacion_id = $1`,
        [Number(asignacion_id)]
      );
      if (yaTieneHorario.rows.length > 0) {
        return error(res, "Esta asignación ya cuenta con un horario programado. Use la opción de editar.", 409);
      }

      const horasRequeridas = tipo === 'Teoria' ? Number(infoCurso.horas_aula) : Number(infoCurso.horas_lab);

      if (horasRequeridas > 0) {
        const hIniVal = timeToHours(hora_inicio);
        const hFinVal = timeToHours(hora_fin);
        const duracionPropuesta = hFinVal - hIniVal;

        if (Math.abs(duracionPropuesta - horasRequeridas) > 0.001) {
          return error(
            res,
            `Duración inválida: La asignatura '${infoCurso.nombre}' (${tipo}) requiere exactamente ${horasRequeridas} horas semanales. El bloque propuesto tiene una duración de ${duracionPropuesta.toFixed(1)} horas.`,
            400
          );
        }
      }

      const conflictoCiclo = await HorarioModel.existeConflictoCiclo({
        ciclo,
        semestre,
        dia,
        hora_inicio,
        hora_fin
      });
      if (conflictoCiclo) {
        return error(res, `Conflicto de Ciclo: Ya existe otra asignatura programada para el Ciclo ${ciclo} el día ${dia} en ese rango horario.`, 409);
      }

      const conflictoDocente = await HorarioModel.existeConflictoDocente({
        docente_id,
        semestre,
        dia,
        hora_inicio,
        hora_fin
      });
      if (conflictoDocente) {
        return error(res, "Conflicto de Docente: El profesor seleccionado ya tiene otra clase asignada en ese bloque horario.", 409);
      }

      if (tipo === 'Teoria') {
        if (!aula_id) return error(res, "El aula_id es requerido para asignaciones de tipo Teoría", 400);
        const conflictoAula = await HorarioModel.existeConflictoAula({
          aula_id: Number(aula_id),
          semestre,
          dia,
          hora_inicio,
          hora_fin
        });
        if (conflictoAula) return error(res, "El aula seleccionada ya se encuentra ocupada en ese horario.", 409);
      } else {
        if (!laboratorio_id) return error(res, "El laboratorio_id es requerido para asignaciones de tipo Laboratorio", 400);
        const conflictoLab = await HorarioModel.existeConflictoLaboratorio({
          laboratorio_id: Number(laboratorio_id),
          semestre,
          dia,
          hora_inicio,
          hora_fin
        });
        if (conflictoLab) return error(res, "El laboratorio seleccionado ya se encuentra ocupado en ese horario.", 409);
      }

      const nuevoHorario = await HorarioModel.create({
        asignacion_id: Number(asignacion_id),
        semestre,
        dia,
        hora_inicio,
        hora_fin,
        aula_id: tipo === 'Teoria' ? Number(aula_id) : null,
        laboratorio_id: tipo === 'Laboratorio' ? Number(laboratorio_id) : null,
        generado_automaticamente: false,
        editado_manualmente: true
      });

      const horarioCompleto = await HorarioModel.getById(nuevoHorario.id);
      return success(res, horarioCompleto, "Horario creado manualmente por Secretaría con éxito", 201);

    } catch (err) {
      console.error("Error crítico en creación manual de horario:", err);
      return error(res, "Error al crear el horario manualmente en el servidor", 500);
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      if (!Number.isInteger(Number(id)))
        return error(res, "id debe ser entero", 400);

      const horarioExistente = await HorarioModel.getById(id);
      if (!horarioExistente) return error(res, "Horario no encontrado", 404);

      const validacion = await SchedulerService.validarEdicionManual(
        id,
        req.body || {},
      );
      
      if (!validacion.ok) {
        return error(
          res,
          validacion.message,
          validacion.status || 400,
          validacion.errors || null,
        );
      }

      const matchCurso = await pool.query(
        `SELECT c.horas_aula, c.horas_lab, a.tipo, c.nombre, c.ciclo, h.semestre
         FROM horarios h
         JOIN asignacion_docente_curso a ON h.asignacion_id = a.id
         JOIN cursos c ON a.curso_id = c.id
         WHERE h.id = $1`,
        [Number(id)]
      );

      if (matchCurso.rows.length === 0) {
        return error(res, "No se encontraron los datos del curso vinculados a este horario", 500);
      }

      const infoCurso = matchCurso.rows[0];
      const tipo = infoCurso.tipo; 
      const horasRequeridas = tipo === 'Teoria' ? Number(infoCurso.horas_aula) : Number(infoCurso.horas_lab);

      if (horasRequeridas > 0) {
        const hIniStr = validacion.data.hora_inicio || horarioExistente.hora_inicio;
        const hFinStr = validacion.data.hora_fin || horarioExistente.hora_fin;

        const parseTimeToHours = (tStr) => {
          const [h, m] = String(tStr).slice(0, 5).split(':').map(Number);
          return h + (m / 60);
        };

        const hIniVal = parseTimeToHours(hIniStr);
        const hFinVal = parseTimeToHours(hFinStr);
        const duracionPropuesta = hFinVal - hIniVal;

        if (Math.abs(duracionPropuesta - horasRequeridas) > 0.001) {
          return error(
            res,
            `Duración inválida: La asignatura '${infoCurso.nombre}' (${tipo}) requiere exactamente ${horasRequeridas} horas semanales. El bloque propuesto (${hIniStr} - ${hFinStr}) dura ${duracionPropuesta.toFixed(1)} horas.`,
            400
          );
        }
      }

      const ciclo = infoCurso.ciclo;
      const semestre = infoCurso.semestre;
      const dia = validacion.data.dia || horarioExistente.dia;
      const hora_inicio = validacion.data.hora_inicio || horarioExistente.hora_inicio;
      const hora_fin = validacion.data.hora_fin || horarioExistente.hora_fin;

      const conflictoCiclo = await HorarioModel.existeConflictoCiclo({
        ciclo,
        semestre,
        dia,
        hora_inicio,
        hora_fin,
        excludeId: Number(id)
      });

      if (conflictoCiclo) {
        return error(
          res,
          `Conflicto de Ciclo: Ya existe otra asignatura programada para el Ciclo ${ciclo} el día ${dia} entre las ${hora_inicio} y ${hora_fin}.`,
          409
        );
      }

      await HorarioModel.update(id, validacion.data);
      const horarioActualizado = await HorarioModel.getById(id);
      
      return success(
        res,
        horarioActualizado,
        "Horario actualizado manualmente correctamente",
      );
    } catch (err) {
      console.error("Error crítico en actualización manual:", err);
      if (!res.headersSent) {
        return error(res, "Error al actualizar horario", 500);
      }
    }
  },

  remove: async (req, res) => {
    try {
      const { id } = req.params;
      if (!Number.isInteger(Number(id)))
        return error(res, "id debe ser entero", 400);

      const horario = await HorarioModel.getById(id);
      if (!horario) return error(res, "Horario no encontrado", 404);

      await HorarioModel.delete(id);
      return success(res, null, "Horario eliminado correctamente");
    } catch (err) {
      console.error(err);
      return error(res, "Error al eliminar horario", 500);
    }
  },

  limpiar: async (req, res) => {
    try {
      const { semestre } = req.body || {};
      const semestreNormalizado = String(semestre || "2026-1").trim();
      const errorSemestre = SchedulerService.validarSemestre(semestreNormalizado);
      
      if (errorSemestre) {
        return error(res, errorSemestre, 400);
      }

      // 1. Elimina los horarios (Esto se mantiene)
      const eliminados = await HorarioModel.deleteBySemestre(semestreNormalizado);

      // 2. Retorna la respuesta de éxito directa (Mensaje limpio y sin condiciones)
      return success(
        res, 
        { semestre: semestreNormalizado, eliminados }, 
        `${eliminados} horarios del semestre ${semestreNormalizado} han sido eliminados correctamente.`
      );
    } catch (err) {
      console.error(err);
      return error(res, "Error al limpiar horarios", 500);
    }
  },

  resetTurnosDesdePanel: async (req, res) => {
    try {
      await DocenteModel.resetAllTurnos();
      return success(
        res, 
        null, 
        "Todos los turnos de los docentes han sido reiniciados a 'Pendiente' con éxito."
      );
    } catch (err) {
      console.error("Error crítico al reiniciar turnos desde el panel:", err);
      return error(res, "Error interno al intentar reiniciar los turnos", 500);
    }
  },

  // NUEVO MÉTODO: Permite al docente editar su bloque dentro de su turno activo
  editarMiHorarioDocente: async (req, res) => {
    try {
      const { id } = req.params;
      const { dia, hora_inicio, hora_fin, aula_id, laboratorio_id } = req.body;

      if (!Number.isInteger(Number(id))) return error(res, "id debe ser entero", 400);

      const docente = await DocenteModel.getById(req.user.id);
      if (!docente) return error(res, "Docente no encontrado", 404);
      if (docente.estado_turno !== 'Notificado') {
        return error(res, "Acción rechazada: No puedes modificar horarios fuera de tu turno activo.", 403);
      }

      const horarioExistente = await HorarioModel.getById(id);
      if (!horarioExistente) return error(res, "Horario no encontrado", 404);
      
      const dueñoId = horarioExistente.docente_id || horarioExistente.docente?.id;
      if (Number(dueñoId) !== Number(req.user.id)) {
        return error(res, "Acción rechazada: Este bloque de horario no te pertenece", 403);
      }

      const matchCurso = await pool.query(
        `SELECT c.horas_aula, c.horas_lab, a.tipo, c.nombre, c.ciclo, h.semestre
         FROM horarios h
         JOIN asignacion_docente_curso a ON h.asignacion_id = a.id
         JOIN cursos c ON a.curso_id = c.id
         WHERE h.id = $1`,
        [Number(id)]
      );

      if (matchCurso.rows.length === 0) {
        return error(res, "No se encontraron los datos curriculares del curso", 500);
      }

      const infoCurso = matchCurso.rows[0];
      const tipo = infoCurso.tipo; 
      const semestre = infoCurso.semestre;
      const ciclo = infoCurso.ciclo;

      const normalizarHoraLocal = (time) => String(time).slice(0, 5);
      const hIni = normalizarHoraLocal(hora_inicio || horarioExistente.hora_inicio);
      const hFin = normalizarHoraLocal(hora_fin || horarioExistente.hora_fin);
      const elDia = dia || horarioExistente.dia;

      const horasRequeridas = tipo === 'Teoria' ? Number(infoCurso.horas_aula) : Number(infoCurso.horas_lab);
      if (horasRequeridas > 0) {
        const duracionPropuesta = timeToHours(hFin) - timeToHours(hIni);
        if (Math.abs(duracionPropuesta - horasRequeridas) > 0.001) {
          return error(res, `Duración inválida: Este curso requiere exactamente ${horasRequeridas} horas semanales.`, 400);
        }
      }

      const conflictoDocente = await pool.query(
        `SELECT h.id FROM horarios h 
         JOIN asignacion_docente_curso a ON h.asignacion_id = a.id
         WHERE a.docente_id = $1 AND h.semestre = $2 AND h.dia = $3 
         AND h.hora_inicio < $4 AND h.hora_fin > $5 AND h.id <> $6`,
        [req.user.id, semestre, elDia, hFin, hIni, Number(id)]
      );
      if (conflictoDocente.rows.length > 0) return error(res, "Ya tienes otra clase programada en este rango horario", 409);

      const conflictoCiclo = await pool.query(
        `SELECT h.id FROM horarios h
         JOIN asignacion_docente_curso a ON h.asignacion_id = a.id
         JOIN cursos c ON a.curso_id = c.id
         WHERE c.ciclo = $1 AND h.semestre = $2 AND h.dia = $3
         AND h.hora_inicio < $4 AND h.hora_fin > $5 AND h.id <> $6`,
        [ciclo, semestre, elDia, hFin, hIni, Number(id)]
      );
      if (conflictoCiclo.rows.length > 0) return error(res, "Conflicto de Ciclo: Los alumnos ya tienen otra clase en este horario", 409);

      // 🌟 CORREGIDO: Removido el "h." de la condición final de la consulta de Aula y Lab
      if (tipo === 'Teoria') {
        const targetAula = aula_id || horarioExistente.aula_id || (horarioExistente.aula?.id);
        const conflictoAula = await pool.query(
          `SELECT id FROM horarios WHERE aula_id = $1 AND semestre = $2 AND dia = $3 AND hora_inicio < $4 AND hora_fin > $5 AND id <> $6`,
          [Number(targetAula), semestre, elDia, hFin, hIni, Number(id)]
        );
        if (conflictoAula.rows.length > 0) return error(res, "El aula seleccionada ya se encuentra ocupada", 409);
      } else {
        const targetLab = laboratorio_id || horarioExistente.laboratorio_id || (horarioExistente.laboratorio?.id);
        const conflictoLab = await pool.query(
          `SELECT id FROM horarios WHERE laboratorio_id = $1 AND semestre = $2 AND dia = $3 AND hora_inicio < $4 AND hora_fin > $5 AND id <> $6`,
          [Number(targetLab), semestre, elDia, hFin, hIni, Number(id)]
        );
        if (conflictoLab.rows.length > 0) return error(res, "El laboratorio seleccionado ya se encuentra ocupado", 409);
      }

      await HorarioModel.update(id, {
        dia: elDia,
        hora_inicio: hIni,
        hora_fin: hFin,
        aula_id: tipo === 'Teoria' ? Number(aula_id) : null,
        laboratorio_id: tipo === 'Laboratorio' ? Number(laboratorio_id) : null,
        editado_manualmente: true
      });

      const horarioActualizado = await HorarioModel.getById(id);
      return success(res, horarioActualizado, "Horario modificado correctamente", 200);

    } catch (err) {
      console.error("Error crítico en edición de horario por docente:", err);
      return error(res, "Error interno al intentar guardar las modificaciones", 500);
    }
  },

  //  NUEVO: Lógica unificada exacta del Docente adaptada para el Admin
  verificarDisponibilidadAmbiente: async (req, res) => {
    try {
      const { dia, hora_inicio, hora_fin, tipo, excludeId, semestre } = req.query;

      if (!dia || !hora_inicio || !hora_fin || !tipo || !semestre) {
        return error(res, "Faltan parámetros obligatorios para la validación.", 400);
      }

      const idExcluir = (excludeId && !isNaN(Number(excludeId))) ? Number(excludeId) : -1;
      const pool = require('../config/db');

      let sql = "";
      if (tipo === "Teoria") {
        //  CORRECCIÓN: Eliminamos "a.deleted_at IS NULL" porque esa columna no existe
        sql = `
          SELECT a.id, a.codigo, a.capacidad,
            EXISTS (
              SELECT 1 FROM horarios 
              WHERE aula_id = a.id 
                AND semestre = $1 
                AND dia = $2 
                AND hora_inicio < $4 
                AND hora_fin > $3 
                AND id <> $5
            ) as esta_ocupado
          FROM aulas a
          ORDER BY a.codigo ASC;
        `;
      } else {
        //  CORRECCIÓN: Eliminamos "l.deleted_at IS NULL" porque esa columna no existe
        sql = `
          SELECT l.id, l.codigo, l.capacidad,
            EXISTS (
              SELECT 1 FROM horarios 
              WHERE laboratorio_id = l.id 
                AND semestre = $1 
                AND dia = $2 
                AND hora_inicio < $4 
                AND hora_fin > $3 
                AND id <> $5
            ) as esta_ocupado
          FROM laboratorios l
          ORDER BY l.codigo ASC;
        `;
      }

      const result = await pool.query(sql, [semestre, dia, hora_inicio, hora_fin, idExcluir]);
      
      const dataNormalizada = result.rows.map(r => ({
        id: r.id,
        codigo: r.codigo,
        capacidad: r.capacidad,
        esta_ocupado: r.esta_ocupado
      }));

      return success(res, dataNormalizada, "Disponibilidad de ambientes calculada con éxito");
    } catch (err) {
      console.error("Error en validación viva de ambientes:", err);
      return error(res, "Error al verificar ambientes", 500);
    }
  },

  // 🌟 NUEVO ENDPOINT: Validación de infraestructura idéntica a la lógica del Docente
  getDisponibilidadAmbientesAdmin: async (req, res) => {
    try {
      const { dia, hora_inicio, hora_fin, tipo, semestre, excludeId } = req.query;

      if (!dia || !hora_inicio || !hora_fin || !tipo || !semestre) {
        return error(res, "Faltan parámetros de tiempo obligatorios para el cálculo.", 400);
      }

      const idHorarioExcluir = excludeId && !isNaN(Number(excludeId)) ? Number(excludeId) : -1;
      const normalizarHora = (h) => String(h).slice(0, 5);
      
      const hIni = normalizarHora(hora_inicio);
      const hFin = normalizarHora(hora_fin);
      const elDia = String(dia).trim();

      let sql = "";
      if (tipo === "Teoria" || tipo === "Teoría") {
        sql = `
          SELECT a.id, a.codigo, a.capacidad,
            EXISTS (
              SELECT 1 FROM horarios h
              WHERE h.aula_id = a.id
                AND h.semestre = $1
                AND TRIM(h.dia) = $2
                AND h.hora_inicio < $4
                AND h.hora_fin > $3
                AND h.id <> $5
            ) as esta_ocupado
          FROM aulas a
          WHERE a.deleted_at IS NULL
          ORDER BY a.codigo ASC;
        `;
      } else {
        sql = `
          SELECT l.id, l.codigo, l.capacidad,
            EXISTS (
              SELECT 1 FROM horarios h
              WHERE h.laboratorio_id = l.id
                AND h.semestre = $1
                AND TRIM(h.dia) = $2
                AND h.hora_inicio < $4
                AND h.hora_fin > $3
                AND h.id <> $5
            ) as esta_ocupado
          FROM laboratorios l
          WHERE l.deleted_at IS NULL
          ORDER BY l.codigo ASC;
        `;
      }

      const result = await pool.query(sql, [semestre, elDia, hIni, hFin, idHorarioExcluir]);
      return success(res, result.rows, "Disponibilidades de infraestructura calculadas correctamente.");
    } catch (err) {
      console.error("Error crítico calculando disponibilidad:", err);
      return error(res, "Error interno en el cálculo de infraestructura", 500);
    }
  },
};

module.exports = HorariosController;