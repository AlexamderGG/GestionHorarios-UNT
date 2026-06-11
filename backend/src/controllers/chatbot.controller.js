const { OpenAI } = require('openai');
const pool = require('../config/db');

// Configuramos OpenAI con tu nueva clave
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.preguntarBot = async (req, res) => {
  const { pregunta } = req.body;

  try {
    const mensajes = [
      { role: "system", content: "Eres el asistente de la Secretaría de Ingeniería de Sistemas de la UNT. Si te piden laboratorios libres, usa la herramienta disponible. Sé breve." },
      { role: "user", content: pregunta }
    ];

    const herramientas = [{
      type: "function",
      function: {
        name: "buscarLaboratoriosLibres",
        description: "Busca qué laboratorios están sin clases en un día y horario",
        parameters: {
          type: "object",
          properties: {
            dia: { type: "string" },
            horaInicio: { type: "string" },
            horaFin: { type: "string" }
          },
          required: ["dia", "horaInicio", "horaFin"]
        }
      }
    }];

    // Primera llamada a OpenAI
    const primeraRespuesta = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: mensajes,
      tools: herramientas
    });

    const msg = primeraRespuesta.choices[0].message;

    if (msg.tool_calls) {
      const args = JSON.parse(msg.tool_calls[0].function.arguments);
      const labs = await obtenerLabsLibresDesdeDB(args.dia, args.horaInicio, args.horaFin);
      
      // Enviamos la respuesta de la DB a OpenAI para que la redacte
      mensajes.push(msg);
      mensajes.push({
        role: "tool",
        tool_call_id: msg.tool_calls[0].id,
        content: JSON.stringify(labs)
      });

      const final = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: mensajes
      });
      return res.json({ respuesta: final.choices[0].message.content });
    }

    return res.json({ respuesta: msg.content });

  } catch (error) {
    console.error("❌ Error en OpenAI:", error);
    res.status(500).json({ respuesta: "Error al conectar con OpenAI." });
  }
};

// ==========================================
// CONSULTAS SQL
// ==========================================
async function obtenerLabsLibresDesdeDB(dia, horaInicio, horaFin) {
  const client = await pool.connect();
  try {
    const query = `
      SELECT l.codigo, l.nombre
      FROM laboratorios l
      WHERE l.codigo NOT IN (
        SELECT h.laboratorio_codigo
        FROM horarios h
        WHERE h.dia ILIKE $1
          AND h.hora_inicio < $3 
          AND h.hora_fin > $2    
          AND h.laboratorio_codigo IS NOT NULL
      )
    `;
    
    const result = await client.query(query, [dia, horaInicio, horaFin]);
    
    if (result.rows.length === 0) {
      return ["Todos los laboratorios están ocupados en ese horario."];
    }
    
    return result.rows.map(row => row.nombre || row.codigo); 
  } catch (e) {
    console.error("Error SQL:", e);
    return ["Error al consultar la base de datos."];
  } finally {
    client.release();
  }
}