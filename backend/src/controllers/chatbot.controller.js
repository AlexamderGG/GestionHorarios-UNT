const { OpenAI } = require('openai');
const pool = require('../config/db');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `
Eres el asistente oficial de la Secretaría de Ingeniería de Sistemas de la UNT.
Tu función es ayudar con consultas sobre la gestión de horarios académicos del semestre activo.

PUEDES ayudar con:
- Horarios de docentes (cursos, días, horas, aulas/laboratorios)
- Asignaciones de docentes a cursos
- Laboratorios o aulas libres en un horario específico
- Carga horaria de un docente

Si la pregunta es sobre horarios pero le falta información (ej: no dice el nombre del docente o el día), pide la aclaración necesaria de forma amigable.

Si la pregunta NO tiene ninguna relación con horarios, docentes o asignaciones académicas, responde únicamente:
"Solo puedo ayudarte con consultas sobre horarios, docentes y asignaciones del semestre actual."

Sé breve y directo. Usa listas cuando haya múltiples resultados.
`.trim();

const HERRAMIENTAS = [
  {
    type: "function",
    function: {
      name: "buscarLaboratoriosLibres",
      description: "Busca qué laboratorios están sin clases en un día y horario específico",
      parameters: {
        type: "object",
        properties: {
          dia:        { type: "string", description: "Día de la semana (ej: Lunes)" },
          horaInicio: { type: "string", description: "Hora inicio en formato HH:MM" },
          horaFin:    { type: "string", description: "Hora fin en formato HH:MM" }
        },
        required: ["dia", "horaInicio", "horaFin"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "buscarAulasLibres",
      description: "Busca qué aulas están disponibles (sin clase) en un día y horario específico",
      parameters: {
        type: "object",
        properties: {
          dia:        { type: "string", description: "Día de la semana (ej: Martes)" },
          horaInicio: { type: "string", description: "Hora inicio en formato HH:MM" },
          horaFin:    { type: "string", description: "Hora fin en formato HH:MM" }
        },
        required: ["dia", "horaInicio", "horaFin"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "buscarHorarioDocente",
      description: "Obtiene el horario completo de un docente (cursos, días, horas, ambientes)",
      parameters: {
        type: "object",
        properties: {
          nombreDocente: { type: "string", description: "Nombre o apellido del docente" }
        },
        required: ["nombreDocente"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "buscarHorarioCurso",
      description: "Obtiene el horario de un curso (docente, grupo, día, hora, ambiente)",
      parameters: {
        type: "object",
        properties: {
          nombreCurso: { type: "string", description: "Nombre o código del curso" }
        },
        required: ["nombreCurso"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "buscarCargaDocente",
      description: "Obtiene las asignaciones y total de horas de un docente en el semestre activo",
      parameters: {
        type: "object",
        properties: {
          nombreDocente: { type: "string", description: "Nombre o apellido del docente" }
        },
        required: ["nombreDocente"]
      }
    }
  }
];

exports.preguntarBot = async (req, res) => {
  const { pregunta } = req.body;

  const client = await pool.connect();
  try {
    const semestre = await getSemestreActivo(client);

    const mensajes = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: pregunta }
    ];

    const primeraRespuesta = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: mensajes,
      tools: HERRAMIENTAS
    });

    const msg = primeraRespuesta.choices[0].message;

    if (!msg.tool_calls) {
      return res.json({ respuesta: msg.content });
    }

    // Resolver todas las tool_calls en paralelo
    mensajes.push(msg);

    const toolResults = await Promise.all(
      msg.tool_calls.map(async (tc) => {
        const args = JSON.parse(tc.function.arguments);
        const contenido = await ejecutarHerramienta(tc.function.name, args, semestre, client);
        return { tool_call_id: tc.id, contenido };
      })
    );

    for (const { tool_call_id, contenido } of toolResults) {
      mensajes.push({ role: "tool", tool_call_id, content: contenido });
    }

    const final = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: mensajes
    });

    return res.json({ respuesta: final.choices[0].message.content });

  } catch (error) {
    console.error("❌ Error en chatbot:", error);
    res.status(500).json({ respuesta: "Error al procesar tu consulta." });
  } finally {
    client.release();
  }
};

// ==========================================
// DISPATCHER DE HERRAMIENTAS
// ==========================================
async function ejecutarHerramienta(nombre, args, semestre, client) {
  switch (nombre) {
    case "buscarLaboratoriosLibres":
      return buscarLaboratoriosLibres(args.dia, args.horaInicio, args.horaFin, client);
    case "buscarAulasLibres":
      return buscarAulasLibres(args.dia, args.horaInicio, args.horaFin, client);
    case "buscarHorarioDocente":
      return buscarHorarioDocente(args.nombreDocente, semestre, client);
    case "buscarHorarioCurso":
      return buscarHorarioCurso(args.nombreCurso, semestre, client);
    case "buscarCargaDocente":
      return buscarCargaDocente(args.nombreDocente, semestre, client);
    default:
      return "Herramienta no reconocida.";
  }
}

// ==========================================
// CONSULTAS SQL + FORMATEO COMPACTO
// ==========================================

async function getSemestreActivo(client) {
  const r = await client.query(
    "SELECT valor FROM configuracion WHERE clave='semestre_activo' LIMIT 1"
  );
  return r.rows[0]?.valor || '2026-1';
}

async function buscarLaboratoriosLibres(dia, horaInicio, horaFin, client) {
  try {
    const result = await client.query(`
      SELECT l.codigo, l.nombre, l.capacidad
      FROM laboratorios l
      WHERE l.activo = TRUE
        AND l.id NOT IN (
          SELECT h.laboratorio_id FROM horarios h
          WHERE h.dia ILIKE $1
            AND h.hora_inicio < $3::time
            AND h.hora_fin > $2::time
            AND h.laboratorio_id IS NOT NULL
        )
      ORDER BY l.codigo
    `, [dia, horaInicio, horaFin]);

    if (!result.rows.length) return "Todos los laboratorios están ocupados en ese horario.";
    return result.rows.map(r => `${r.codigo} ${r.nombre} (${r.capacidad || '?'} pax)`).join('\n');
  } catch (e) {
    console.error("Error SQL buscarLaboratoriosLibres:", e);
    return "Error al consultar laboratorios.";
  }
}

async function buscarAulasLibres(dia, horaInicio, horaFin, client) {
  try {
    const result = await client.query(`
      SELECT a.codigo, a.nombre, a.capacidad
      FROM aulas a
      WHERE a.activa = TRUE
        AND a.id NOT IN (
          SELECT h.aula_id FROM horarios h
          WHERE h.dia ILIKE $1
            AND h.hora_inicio < $3::time
            AND h.hora_fin > $2::time
            AND h.aula_id IS NOT NULL
        )
      ORDER BY a.codigo
    `, [dia, horaInicio, horaFin]);

    if (!result.rows.length) return "Todas las aulas están ocupadas en ese horario.";
    return result.rows.map(r => `${r.codigo} ${r.nombre} (${r.capacidad || '?'} pax)`).join('\n');
  } catch (e) {
    console.error("Error SQL buscarAulasLibres:", e);
    return "Error al consultar aulas.";
  }
}

async function buscarHorarioDocente(nombreDocente, semestre, client) {
  try {
    const result = await client.query(`
      SELECT
        h.dia,
        TO_CHAR(h.hora_inicio, 'HH24:MI') AS inicio,
        TO_CHAR(h.hora_fin, 'HH24:MI') AS fin,
        c.codigo, c.nombre AS curso,
        adc.tipo, adc.grupo,
        COALESCE(a.codigo, l.codigo) AS ambiente
      FROM horarios h
      JOIN asignacion_docente_curso adc ON adc.id = h.asignacion_id
      JOIN docentes d ON d.id = adc.docente_id
      JOIN cursos c ON c.id = adc.curso_id
      LEFT JOIN aulas a ON a.id = h.aula_id
      LEFT JOIN laboratorios l ON l.id = h.laboratorio_id
      WHERE h.semestre = $2
        AND (
          LOWER(d.nombres || ' ' || d.apellidos) ILIKE '%' || LOWER($1) || '%'
          OR LOWER(d.apellidos || ' ' || d.nombres) ILIKE '%' || LOWER($1) || '%'
        )
      ORDER BY
        CASE h.dia WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miércoles' THEN 3
          WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 ELSE 6 END,
        h.hora_inicio
    `, [nombreDocente, semestre]);

    if (!result.rows.length) return `No se encontraron horarios para "${nombreDocente}" en el semestre ${semestre}.`;
    return result.rows.map(r =>
      `${r.dia} ${r.inicio}-${r.fin} | ${r.codigo} ${r.curso} | ${r.tipo} Grp.${r.grupo} | ${r.ambiente || 'Sin ambiente'}`
    ).join('\n');
  } catch (e) {
    console.error("Error SQL buscarHorarioDocente:", e);
    return "Error al consultar horario del docente.";
  }
}

async function buscarHorarioCurso(nombreCurso, semestre, client) {
  try {
    const result = await client.query(`
      SELECT
        h.dia,
        TO_CHAR(h.hora_inicio, 'HH24:MI') AS inicio,
        TO_CHAR(h.hora_fin, 'HH24:MI') AS fin,
        d.apellidos || ', ' || d.nombres AS docente,
        adc.tipo, adc.grupo,
        COALESCE(a.codigo, l.codigo) AS ambiente
      FROM horarios h
      JOIN asignacion_docente_curso adc ON adc.id = h.asignacion_id
      JOIN docentes d ON d.id = adc.docente_id
      JOIN cursos c ON c.id = adc.curso_id
      LEFT JOIN aulas a ON a.id = h.aula_id
      LEFT JOIN laboratorios l ON l.id = h.laboratorio_id
      WHERE h.semestre = $2
        AND (
          LOWER(c.nombre) ILIKE '%' || LOWER($1) || '%'
          OR LOWER(c.codigo) ILIKE '%' || LOWER($1) || '%'
        )
      ORDER BY adc.grupo, adc.tipo,
        CASE h.dia WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miércoles' THEN 3
          WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 ELSE 6 END,
        h.hora_inicio
    `, [nombreCurso, semestre]);

    if (!result.rows.length) return `No se encontró horario para el curso "${nombreCurso}" en el semestre ${semestre}.`;
    return result.rows.map(r =>
      `${r.dia} ${r.inicio}-${r.fin} | ${r.docente} | ${r.tipo} Grp.${r.grupo} | ${r.ambiente || 'Sin ambiente'}`
    ).join('\n');
  } catch (e) {
    console.error("Error SQL buscarHorarioCurso:", e);
    return "Error al consultar horario del curso.";
  }
}

async function buscarCargaDocente(nombreDocente, semestre, client) {
  try {
    const result = await client.query(`
      SELECT
        d.apellidos || ', ' || d.nombres AS docente,
        d.categoria,
        c.codigo, c.nombre AS curso,
        adc.tipo, adc.grupo, adc.horas_asignadas
      FROM asignacion_docente_curso adc
      JOIN docentes d ON d.id = adc.docente_id
      JOIN cursos c ON c.id = adc.curso_id
      WHERE adc.semestre_asignacion = $2
        AND d.activo = TRUE
        AND (
          LOWER(d.nombres || ' ' || d.apellidos) ILIKE '%' || LOWER($1) || '%'
          OR LOWER(d.apellidos || ' ' || d.nombres) ILIKE '%' || LOWER($1) || '%'
        )
      ORDER BY c.codigo, adc.tipo
    `, [nombreDocente, semestre]);

    if (!result.rows.length) return `No se encontraron asignaciones para "${nombreDocente}" en el semestre ${semestre}.`;

    const { docente, categoria } = result.rows[0];
    const total = result.rows.reduce((s, r) => s + (r.horas_asignadas || 0), 0);
    const detalle = result.rows.map(r =>
      `${r.codigo} ${r.curso} | ${r.tipo} Grp.${r.grupo} | ${r.horas_asignadas}h`
    ).join('\n');

    return `Docente: ${docente} (${categoria})\nTotal: ${total}h\n${detalle}`;
  } catch (e) {
    console.error("Error SQL buscarCargaDocente:", e);
    return "Error al consultar carga del docente.";
  }
}
