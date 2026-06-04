const pool = require("../config/db");
const HorarioModel = require("../models/horario.model");
const ConfiguracionModel = require("../models/configuracion.model");
const AulaModel = require("../models/aula.model");
const LaboratorioModel = require("../models/laboratorio.model");

const DIAS_VALIDOS = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo",
];

const limpiarTextoDia = (str) => {
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
};

const DIAS_MAPEA_SEGURO = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miercoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sabado",
  domingo: "Domingo"
};

const normalizarHora = (hora) => String(hora).slice(0, 5);

const timeToMinutes = (hora) => {
  const [hours, minutes] = normalizarHora(hora).split(":").map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const generarBloques = (configuracion) => {
  let diasParseados = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];
  
  if (configuracion.dias_habiles) {
    const rawDays = Array.isArray(configuracion.dias_habiles) 
      ? configuracion.dias_habiles 
      : configuracion.dias_habiles.split(',');
      
    const diasLimpios = rawDays
      .map(d => DIAS_MAPEA_SEGURO[limpiarTextoDia(d)])
      .filter(Boolean);

    if (diasLimpios.length > 0) {
      diasParseados = diasLimpios;
    }
  }

  const horaInicio = normalizarHora(configuracion.hora_inicio || "07:00");
  const horaFin = normalizarHora(configuracion.hora_fin || "22:00"); 
  const duracion = Number(configuracion.duracion_bloque || 60);
  
  const bloques = [];
  const inicio = timeToMinutes(horaInicio);
  const fin = timeToMinutes(horaFin);
  const almuerzoInicio = 13 * 60;
  const almuerzoFin = 14 * 60;

  for (const dia of diasParseados) {
    let actual = inicio;

    while (actual + duracion <= fin) {
      if (actual >= almuerzoInicio && actual < almuerzoFin) {
        actual = almuerzoFin;
      }

      if (actual < almuerzoInicio && actual + duracion > almuerzoInicio) {
        actual = almuerzoFin;
      }

      if (actual + duracion > fin) break;

      const bloqueInicio = minutesToTime(actual);
      const bloqueFin = minutesToTime(actual + duracion);
      bloques.push({ dia, hora_inicio: bloqueInicio, hora_fin: bloqueFin });
      actual += duracion;
    }
  }

  return bloques;
};

const ordenarAmbientes = (ambientes, ambientePreferidoId) => {
  if (!ambientePreferidoId) return ambientes;
  const preferidos = ambientes.filter(
    (ambiente) => Number(ambiente.id) === Number(ambientePreferidoId),
  );
  const restantes = ambientes.filter(
    (ambiente) => Number(ambiente.id) !== Number(ambientePreferidoId),
  );
  return [...preferidos, ...restantes];
};

const validarSemestre = (semestre) => {
  if (!semestre || typeof semestre !== "string" || semestre.trim().length < 1) {
    return "El semestre es requerido y debe ser texto no vacío";
  }
  if (!/^\d{4}-[12]$/.test(semestre.trim())) {
    return "El semestre debe tener formato YYYY-1 o YYYY-2. Ejemplo: 2026-1";
  }
  return null;
};

const SchedulerService = {
  DIAS_VALIDOS,
  normalizarHora,
  timeToMinutes,
  generarBloques,
  validarSemestre,

  generarHorarios: async ({ semestre = "2026-1", forzar = false } = {}) => {
    const semestreNormalizado = String(semestre || "2026-1").trim();
    const errorSemestre = validarSemestre(semestreNormalizado);
    if (errorSemestre) {
      return { ok: false, status: 400, message: errorSemestre };
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const existentesAuto = await HorarioModel.countAutomaticosBySemestre(
        semestreNormalizado,
        client,
      );
      
      if (existentesAuto > 0 && !forzar) {
        await client.query("ROLLBACK");
        return {
          ok: false,
          status: 409,
          message: `Ya existen ${existentesAuto} horarios automáticos para el semestre ${semestreNormalizado}. Envía forzar=true para regenerarlos (los manuales se mantendrán).`,
        };
      }

      let eliminados = 0;
      if (forzar && existentesAuto > 0) {
        eliminados = await HorarioModel.deleteAutomaticosBySemestre(
          semestreNormalizado,
          client,
        );
      }

      const configuracion = await ConfiguracionModel.getConfiguracionCompleta();
      const bloques = generarBloques(configuracion);
      
      const asignaciones = await HorarioModel.getAsignacionesParaScheduling(
        semestreNormalizado,
        client,
      );
      const aulas = await HorarioModel.getAulasActivas(client);
      const laboratorios = await HorarioModel.getLaboratoriosActivos(client);

      if (bloques.length === 0) {
        await client.query("ROLLBACK");
        return {
          ok: false,
          status: 400,
          message: "La configuración no genera bloques horarios válidos",
        };
      }

      const horaFinMaximaStr = configuracion.hora_fin || "22:00";
      const horaFinMaximaMinutos = timeToMinutes(horaFinMaximaStr);

      const generados = [];
      const noAsignados = [];
      const usoPorDia = {};
      const usoPorHora = {};

      for (const asignacion of asignaciones) {
        const isAula = asignacion.tipo === "Teoria" || asignacion.tipo === "Practica";
        const ambientesBase = isAula ? aulas : laboratorios;
        const ambientes = ordenarAmbientes(
          ambientesBase,
          asignacion.ambiente_preferido_id,
        );

        if (ambientes.length === 0) {
          noAsignados.push({
            asignacion_id: asignacion.asignacion_id,
            curso: `${asignacion.curso_codigo} - ${asignacion.curso_nombre}`,
            docente: `${asignacion.docente_nombres} ${asignacion.docente_apellidos}`,
            tipo: asignacion.tipo,
            motivo: isAula ? "No existen aulas activas" : "No existen laboratorios activos",
          });
          continue;
        }

        const horasRequeridas = Number(asignacion.horas_asignadas || 0);

        if (horasRequeridas <= 0) {
          continue;
        }

        const minutosRequeridos = horasRequeridas * 60;
        let asignado = null;
        let ultimoMotivo = "No se encontró bloque disponible";
        let bloqueSeleccionado = null;

        const bloquesOrdenados = [...bloques].sort((a, b) => {
          const usoDiaA = usoPorDia[a.dia] || 0;
          const usoDiaB = usoPorDia[b.dia] || 0;
          if (usoDiaA !== usoDiaB) return usoDiaA - usoDiaB;

          const usoHoraA = usoPorHora[a.hora_inicio] || 0;
          const usoHoraB = usoPorHora[b.hora_inicio] || 0;
          if (usoHoraA !== usoHoraB) return usoHoraA - usoHoraB;

          return DIAS_VALIDOS.indexOf(a.dia) - DIAS_VALIDOS.indexOf(b.dia);
        });

        for (const bloque of bloquesOrdenados) {
          const inicioMin = timeToMinutes(bloque.hora_inicio);
          const finMin = inicioMin + minutosRequeridos;
          const horaFinStr = minutesToTime(finMin);

          if (finMin > horaFinMaximaMinutos) {
            ultimoMotivo = `El bloque ${bloque.dia} ${bloque.hora_inicio} termina a las ${horaFinStr}, excediendo el cierre (${horaFinMaximaStr})`;
            continue;
          }

          const almuerzoInicio = 13 * 60;
          const almuerzoFin = 14 * 60;
          if (inicioMin < almuerzoFin && finMin > almuerzoInicio) {
            ultimoMotivo = `El bloque ${bloque.dia} ${bloque.hora_inicio} cruza el almuerzo`;
            continue;
          }

          const restrictionPayload = {
            docente_id: asignacion.docente_id,
            dia: bloque.dia,
            hora_inicio: bloque.hora_inicio,
            hora_fin: horaFinStr,
          };

          const restriccion = await HorarioModel.existeRestriccionDocente(restrictionPayload, client);

          if (restriccion) {
            ultimoMotivo = `Docente no disponible en ${bloque.dia} ${bloque.hora_inicio}-${horaFinStr}`;
            continue;
          }

          const conflictoDocente = await HorarioModel.existeConflictoDocente(
            {
              docente_id: asignacion.docente_id,
              semestre: semestreNormalizado,
              dia: bloque.dia,
              hora_inicio: bloque.hora_inicio,
              hora_fin: horaFinStr,
            },
            client,
          );

          if (conflictoDocente) {
            ultimoMotivo = `Cruce de docente en ${bloque.dia} ${bloque.hora_inicio}-${horaFinStr}`;
            continue;
          }

          const conflictoCiclo = await HorarioModel.existeConflictoCiclo(
            {
              ciclo: asignacion.curso_ciclo || asignacion.ciclo, 
              semestre: semestreNormalizado,
              dia: bloque.dia,
              hora_inicio: bloque.hora_inicio,
              hora_fin: horaFinStr,
              curso_codigo: asignacion.curso_codigo, 
              tipo: asignacion.tipo                  
            },
            client,
          );

          if (conflictoCiclo) {
            ultimoMotivo = `Ciclo ${asignacion.curso_ciclo || asignacion.ciclo} ocupado/sin excepciones disponibles en ${bloque.dia} ${bloque.hora_inicio}-${horaFinStr}`;
            continue;
          }

          for (const ambiente of ambientes) {
            const conflictoAmbiente = isAula
                ? await HorarioModel.existeConflictoAula(
                    {
                      aula_id: ambiente.id,
                      semestre: semestreNormalizado,
                      dia: bloque.dia,
                      hora_inicio: bloque.hora_inicio,
                      hora_fin: horaFinStr,
                    },
                    client,
                  )
                : await HorarioModel.existeConflictoLaboratorio(
                    {
                      laboratorio_id: ambiente.id,
                      semestre: semestreNormalizado,
                      dia: bloque.dia,
                      hora_inicio: bloque.hora_inicio,
                      hora_fin: horaFinStr,
                    },
                    client,
                  );

            if (conflictoAmbiente) {
              ultimoMotivo = `Ambiente ocupado en ${bloque.dia} ${bloque.hora_inicio}-${horaFinStr}`;
              continue;
            }

            asignado = await HorarioModel.create(
              {
                asignacion_id: asignacion.asignacion_id,
                semestre: semestreNormalizado,
                dia: bloque.dia,
                hora_inicio: bloque.hora_inicio,
                hora_fin: horaFinStr,
                aula_id: isAula ? ambiente.id : null,
                laboratorio_id: !isAula ? ambiente.id : null,
                generado_automaticamente: true,
                editado_manualmente: false,
              },
              client,
            );
            bloqueSeleccionado = bloque;
            break;
          }

          if (asignado) break;
        }

        if (asignado) {
          generados.push(asignado);
          usoPorDia[asignado.dia] = (usoPorDia[asignado.dia] || 0) + 1;
          if (bloqueSeleccionado) {
            usoPorHora[bloqueSeleccionado.hora_inicio] = (usoPorHora[bloqueSeleccionado.hora_inicio] || 0) + 1;
          }
        } else {
          noAsignados.push({
            asignacion_id: asignacion.asignacion_id,
            curso: `${asignacion.curso_codigo} - ${asignacion.curso_nombre}`,
            docente: `${asignacion.docente_nombres} ${asignacion.docente_apellidos}`,
            tipo: asignacion.tipo,
            motivo: ultimoMotivo,
          });
        }
      }

      await client.query("COMMIT");

      const horarios = await HorarioModel.getAll({
        semestre: semestreNormalizado,
      });

      return {
        ok: true,
        status: 201,
        message: "Horarios generados correctamente",
        data: {
          semestre: semestreNormalizado,
          asignaciones_procesadas: asignaciones.length,
          generados: generados.length,
          no_assigned: noAsignados.length,
          eliminados_previos: eliminados,
          conflictos: noAsignados,
          horarios,
        },
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  validarEdicionManual: async (id, body) => {
    const horario = await HorarioModel.getById(id);
    if (!horario) {
      return { ok: false, status: 404, message: "Horario no encontrado" };
    }

    const docenteIdReal = horario.docente?.id || horario.docente_id;

    const data = {
      dia: body.dia !== undefined ? body.dia : horario.dia,
      hora_inicio: body.hora_inicio !== undefined ? normalizarHora(body.hora_inicio) : horario.hora_inicio,
      hora_fin: body.hora_fin !== undefined ? normalizarHora(body.hora_fin) : horario.hora_fin,
      aula_id: body.aula_id !== undefined ? body.aula_id : horario.aula_id,
      laboratorio_id: body.laboratorio_id !== undefined ? body.laboratorio_id : horario.laboratorio_id,
    };

    const errores = [];
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (!DIAS_VALIDOS.includes(data.dia))
      errores.push(`dia debe ser uno de: ${DIAS_VALIDOS.join(", ")}`);
    if (!timeRegex.test(data.hora_inicio))
      errores.push("hora_inicio debe estar en formato HH:MM");
    if (!timeRegex.test(data.hora_fin))
      errores.push("hora_fin debe estar en formato HH:MM");

    if (
      timeRegex.test(data.hora_inicio) &&
      timeRegex.test(data.hora_fin) &&
      timeToMinutes(data.hora_inicio) >= timeToMinutes(data.hora_fin)
    ) {
      errores.push("hora_inicio debe ser menor que hora_fin");
    }

    if (horario.tipo_asignacion === "Teoria" || horario.tipo_asignacion === "Practica") {
      if (!data.aula_id)
        errores.push(`Una asignación de ${horario.tipo_asignacion} debe tener aula_id`);
      data.laboratorio_id = null;
    }

    if (horario.tipo_asignacion === "Laboratorio") {
      if (!data.laboratorio_id)
        errores.push("Una asignación de Laboratorio debe tener laboratorio_id");
      data.aula_id = null;
    }

    if (data.aula_id && data.laboratorio_id) {
      errores.push("Solo se puede asignar aula_id o laboratorio_id, no ambos");
    }

    if (data.aula_id && !Number.isInteger(Number(data.aula_id)))
      errores.push("aula_id debe ser entero");
    if (data.laboratorio_id && !Number.isInteger(Number(data.laboratorio_id)))
      errores.push("laboratorio_id debe ser entero");

    if (errores.length > 0) {
      return {
        ok: false,
        status: 400,
        message: "Validación fallida",
        errors: errores,
      };
    }

    const restriccion = await HorarioModel.existeRestriccionDocente({
      docente_id: docenteIdReal,
      dia: data.dia,
      hora_inicio: data.hora_inicio,
      hora_fin: data.hora_fin,
    });

    if (restriccion) {
      return {
        ok: false,
        status: 409,
        message: "El docente tiene una restricción horaria en ese rango",
      };
    }

    const conflictoDocente = await HorarioModel.existeConflictoDocente({
      docente_id: docenteIdReal,
      semestre: horario.semestre,
      dia: data.dia,
      hora_inicio: data.hora_inicio,
      hora_fin: data.hora_fin,
      excludeId: horario.id,
    });

    if (conflictoDocente) {
      return {
        ok: false,
        status: 409,
        message: "El docente ya tiene una clase en ese horario",
      };
    }

    const asigInfo = await pool.query(
      `SELECT a.tipo, c.ciclo, c.codigo 
       FROM asignacion_docente_curso a 
       JOIN cursos c ON a.curso_id = c.id 
       WHERE a.id = $1`, 
      [horario.asignacion_id]
    );
    
    const cursoCiclo = asigInfo.rows[0]?.ciclo;
    const cursoCodigo = asigInfo.rows[0]?.codigo;
    const asigTipo = asigInfo.rows[0]?.tipo;

    if (cursoCiclo && String(cursoCiclo) !== "0") {
      const conflictoCiclo = await HorarioModel.existeConflictoCiclo({
        ciclo: cursoCiclo,
        semestre: horario.semestre,
        dia: data.dia,
        hora_inicio: data.hora_inicio,
        hora_fin: data.hora_fin,
        excludeId: horario.id,
        curso_codigo: cursoCodigo, 
        tipo: asigTipo             
      });

      if (conflictoCiclo) {
        return {
          ok: false,
          status: 409,
          message: `Conflicto de Ciclo: Ya existe una clase programada (o el límite de 2 laboratorios/electivos cruzados se ha superado) en el ciclo ${cursoCiclo}.`
        };
      }
    }

    if (data.aula_id) {
      const aula = await AulaModel.getById(Number(data.aula_id));
      if (!aula || aula.activa === false) {
        return {
          ok: false,
          status: 404,
          message: "El aula indicada no existe o no está activa",
        };
      }

      const conflictoAula = await HorarioModel.existeConflictoAula({
        aula_id: Number(data.aula_id),
        semestre: horario.semestre,
        dia: data.dia,
        hora_inicio: data.hora_inicio,
        hora_fin: data.hora_fin,
        excludeId: horario.id,
      });
      if (conflictoAula)
        return {
          ok: false,
          status: 409,
          message: "El aula ya está ocupada en ese horario",
        };
    }

    if (data.laboratorio_id) {
      const laboratorio = await LaboratorioModel.getById(Number(data.laboratorio_id));
      if (!laboratorio || laboratorio.activo === false) {
        return {
          ok: false,
          status: 404,
          message: "El laboratorio indicado no existe o no está activo",
        };
      }

      const conflictoLaboratorio = await HorarioModel.existeConflictoLaboratorio({
        laboratorio_id: Number(data.laboratorio_id),
        semestre: horario.semestre,
        dia: data.dia,
        hora_inicio: data.hora_inicio,
        hora_fin: data.hora_fin,
        excludeId: horario.id,
      });
      if (conflictoLaboratorio)
        return {
          ok: false,
          status: 409,
          message: "El laboratorio ya está ocupado en ese horario",
        };
    }

    return {
      ok: true,
      data: {
        dia: data.dia,
        hora_inicio: data.hora_inicio,
        hora_fin: data.hora_fin,
        aula_id: data.aula_id ? Number(data.aula_id) : null,
        laboratorio_id: data.laboratorio_id ? Number(data.laboratorio_id) : null,
      },
    };
  },
};

module.exports = SchedulerService;