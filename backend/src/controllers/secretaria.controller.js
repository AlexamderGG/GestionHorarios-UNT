const DocenteModel = require('../models/docente.model'); // Ajusta la ruta según tu proyecto
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const axios = require('axios');

const SecretariaController = {
  // 1. Obtener la lista de docentes ordenada por escalafón
  getEscalafon: async (req, res) => {
    try {
      const docentes = await DocenteModel.getDocentesPorEscalafon();
      res.json({ success: true, data: docentes });
    } catch (error) {
      console.error('Error al obtener escalafón:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  },

  // 2. Habilitar el turno y enviar credenciales (Individual) - OPTIMIZADO PARA VERCEL
  habilitarTurno: async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect(); 

    try {
      await client.query('BEGIN');

      const docente = await DocenteModel.updateEstadoTurno(id, 'Notificado', client);

      if (!docente) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Docente no encontrado' });
      }

      if (!docente.email || docente.email.trim() === '') {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false, 
          message: `El docente ${docente.nombres} no tiene un correo registrado.` 
        });
      }

      const passwordTemporal = `UNT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const hashedPassword = await bcrypt.hash(passwordTemporal, 10);
      
      await DocenteModel.updatePassword(id, hashedPassword, client);

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
          <h2 style="color: #1a56db;">Estimado/a ${docente.nombres} ${docente.apellidos},</h2>
          <p>Le informamos que es su turno para realizar la selección de horarios por orden de escalafón.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Usuario:</strong> ${docente.email}</p>
            <p><strong>Contraseña Temporal:</strong> ${passwordTemporal}</p>
          </div>
        </div>
      `;

      // Preparamos el paquete de datos para la API de Brevo
      const mailData = {
        sender: { name: "Secretaría Académica UNT", email: process.env.EMAIL_USER },
        to: [{ email: docente.email }],
        subject: 'Su turno para selección de horarios - UNT',
        htmlContent: htmlContent
      };

      await client.query('COMMIT');
      
      // Respondemos a Vercel rápido
      res.json({ 
          success: true, 
          message: 'Turno habilitado. El correo se enviará en breve.', 
          data: docente 
      });

      // 🚀 BYPASS: Enviamos por API Web (Puerto 443), Render no puede bloquearlo
      axios.post('https://api.brevo.com/v3/smtp/email', mailData, {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      })
      .then(response => console.log(`✅ ¡ÉXITO API! Correo enviado a ${docente.email}`))
      .catch(err => console.error(`❌ FALLO API BREVO:`, err.response?.data || err.message));

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al habilitar turno:', error);
      if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Error interno al procesar el turno' });
      }
    } finally {
      client.release(); // Protegemos la base de datos
    }
  },

  // 3. Cambiar el estado del docente de forma manual
  cambiarEstadoManual: async (req, res) => {
    try {
      const { id } = req.params;
      const { estado_turno } = req.body;

      // Validar que el estado sea uno de los permitidos en la BD
      const estadosValidos = ['Pendiente', 'Notificado', 'Completado', 'Automatico'];
      if (!estadosValidos.includes(estado_turno)) {
        return res.status(400).json({ success: false, message: 'Estado no válido' });
      }

      // Actualizamos el estado del docente
      const docenteActualizado = await DocenteModel.updateEstadoTurno(id, estado_turno);

      if (!docenteActualizado) {
        return res.status(404).json({ success: false, message: 'Docente no encontrado' });
      }

      // Si la Secretaría lo regresa a 'Pendiente', invalidamos su sesión activa
      if (estado_turno === 'Pendiente') {
        if (DocenteModel.updatePassword) {
          await DocenteModel.updatePassword(id, null);
        }
        // Guardamos la hora exacta del reinicio en segundos para validación de tokens
        await pool.query(
          'UPDATE docentes SET reset_token_at = EXTRACT(EPOCH FROM NOW()) WHERE id = $1', 
          [id]
        );
      }

      res.json({ success: true, message: 'Estado actualizado manualmente', data: docenteActualizado });
    } catch (error) {
      console.error('Error al cambiar estado manualmente:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }, 

  // 4. Obtener disponibilidad con cruces
  getDocentesDisponibles: async (req, res, next) => {
    try {
      const { dia, hora_inicio, hora_fin, semestre } = req.query;

      if (!dia || !hora_inicio || !hora_fin || !semestre) {
        return res.status(400).json({ 
          success: false, 
          message: "Faltan parámetros obligatorios (dia, hora_inicio, hora_fin, semestre)." 
        });
      }

      const sql = `
        SELECT 
          d.id, 
          d.nombres, 
          d.apellidos,
          d.categoria,
          EXISTS (
            SELECT 1 
            FROM horarios h
            JOIN asignacion_docente_curso adc ON adc.id = h.asignacion_id
            WHERE adc.docente_id = d.id
              AND h.dia = $1
              AND h.hora_inicio < $3
              AND h.hora_fin > $2
              AND adc.semestre_asignacion = $4
          ) as esta_ocupado
        FROM docentes d
        ORDER BY d.apellidos ASC, d.nombres ASC;
      `;

      const result = await pool.query(sql, [dia, hora_inicio, hora_fin, semestre]);
      
      return res.status(200).json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      next(error);
    }
  },

  // 5. NUEVO MÉTODO: Enviar credenciales masivamente (Brevo API + Validación Regex)
  notificarTodos: async (req, res) => {
    const client = await pool.connect();
    try {
      // 1. Obtener el semestre activo de la configuración
      const configQuery = `SELECT valor FROM configuracion WHERE clave = 'semestre_activo'`;
      const configResult = await client.query(configQuery);
      const semestreActivo = configResult.rows.length > 0 ? configResult.rows[0].valor : '2026-1';

      // 2. Obtenemos SOLO los docentes que tengan carga en el semestre activo y posean email
      const query = `
        SELECT DISTINCT d.id, d.nombres, d.apellidos, d.email 
        FROM docentes d
        INNER JOIN asignacion_docente_curso adc ON d.id = adc.docente_id
        WHERE adc.semestre_asignacion = $1
          AND d.email IS NOT NULL 
          AND d.email != ''
      `;
      const result = await client.query(query, [semestreActivo]);
      const docentes = result.rows;

      // 3. EL FILTRO INTELIGENTE: Expresión regular para correos válidos
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      // Filtramos la lista quedándonos solo con los correos que pasen la prueba
      const docentesValidos = docentes.filter(docente => emailRegex.test(docente.email.trim()));

      if (docentesValidos.length === 0) {
        client.release();
        return res.status(404).json({ 
          success: false, 
          message: `No hay docentes con carga en el semestre ${semestreActivo} que posean un correo válido.` 
        });
      }

      // 4. Respondemos de inmediato al Frontend (para no bloquear la petición)
      res.json({ 
        success: true, 
        message: `El proceso inició con éxito. Se enviarán credenciales a ${docentesValidos.length} docentes asignados al semestre ${semestreActivo}.` 
      });

      // 5. Ejecutamos en segundo plano (Fire and Forget masivo)
      (async () => {
        try {
          await client.query('BEGIN');

          // Iteramos SOLO sobre los docentes filtrados
          for (const docente of docentesValidos) {
            try {
              const emailDestino = docente.email.trim();
              const passwordTemporal = `UNT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
              const hashedPassword = await bcrypt.hash(passwordTemporal, 10);
              
              // ACTUALIZACIÓN CORREGIDA: Se cambia el estado a 'Notificado', no 'Completado'
              await DocenteModel.updateEstadoTurno(docente.id, 'Notificado', client);
              await DocenteModel.updatePassword(docente.id, hashedPassword, client);

              const htmlContent = `
                <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; max-w-md; margin: auto; border: 1px solid #e2e8f0; border-radius: 10px;">
                  <h2 style="color: #1a56db; margin-bottom: 20px;">Credenciales de Acceso</h2>
                  <p>Estimado/a <strong>${docente.nombres} ${docente.apellidos}</strong>,</p>
                  <p>El sistema se encuentra habilitado para que registre sus <strong>preferencias y restricciones horarias</strong> para el semestre ${semestreActivo}.</p>
                  <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #edf2f7;">
                    <p style="margin: 5px 0;"><strong>Usuario (Email):</strong> ${emailDestino}</p>
                    <p style="margin: 5px 0;"><strong>Contraseña Temporal:</strong> <span style="font-family: monospace; font-size: 16px; color: #1a56db; font-weight: bold;">${passwordTemporal}</span></p>
                  </div>
                  <p style="font-size: 12px; color: #718096;">Atentamente,<br><strong>Secretaría Académica UNT</strong></p>
                </div>
              `;

              const mailData = {
                sender: { name: "Secretaría Académica UNT", email: process.env.EMAIL_USER },
                to: [{ email: emailDestino }],
                subject: '🔑 Accesos para Registro de Disponibilidad - UNT',
                htmlContent: htmlContent
              };

              // BYPASS: Enviar por API usando Axios
              await axios.post('https://api.brevo.com/v3/smtp/email', mailData, {
                headers: {
                  'api-key': process.env.BREVO_API_KEY,
                  'Content-Type': 'application/json'
                }
              });

              console.log(`✅ Masivo: Correo enviado a ${emailDestino}`);
            } catch (error) {
              // Si un correo falla, el bucle "for" continúa
              console.error(`❌ Masivo: Error enviando a ${docente.email}:`, error.response?.data || error.message);
            }
          }

          // Commit de toda la transacción
          await client.query('COMMIT');
          console.log('✅ Proceso masivo de correos finalizado con éxito.');

        } catch (bgError) {
          await client.query('ROLLBACK');
          console.error('[Sistema] Error crítico en envío masivo de segundo plano:', bgError);
        } finally {
          client.release();
        }
      })();

    } catch (error) {
      client.release();
      console.error('Error al preparar el envío masivo:', error);
      if (!res.headersSent) {
         res.status(500).json({ success: false, message: 'Error interno al procesar el envío masivo.' });
      }
    }
  },
  // Marcar a todos como Completados (Candado global)
  completarTodos: async (req, res) => {
    const client = await pool.connect();
    try {
      // Iniciamos una transacción para que la lectura y escritura sean seguras
      await client.query('BEGIN');

      // 1. Obtener el semestre activo de la configuración
      const configQuery = `SELECT valor FROM configuracion WHERE clave = 'semestre_activo'`;
      const configResult = await client.query(configQuery);
      const semestreActivo = configResult.rows.length > 0 ? configResult.rows[0].valor : '2026-1';

      // 2. Verificar credenciales SOLO de los docentes que tienen carga en el semestre activo
      const checkQuery = `
        SELECT DISTINCT d.id 
        FROM docentes d
        INNER JOIN asignacion_docente_curso adc ON d.id = adc.docente_id
        WHERE adc.semestre_asignacion = $1
          AND (d.password IS NULL OR d.password = '' OR d.email IS NULL OR d.email = '')
      `;
      const checkResult = await client.query(checkQuery, [semestreActivo]);

      // 3. Si encontramos al menos uno con carga pero sin credenciales, cancelamos
      if (checkResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false, 
          message: `Acción cancelada: Se encontraron ${checkResult.rows.length} docente(s) con carga en el semestre ${semestreActivo} sin credenciales o correo. Genere los accesos masivos primero.` 
        });
      }

      // 4. Si pasó la validación, actualizamos a Completado SOLO a los docentes con carga en el semestre
      const updateQuery = `
        UPDATE docentes 
        SET estado_turno = 'Completado' 
        WHERE estado_turno != 'Completado'
          AND id IN (
            SELECT DISTINCT docente_id 
            FROM asignacion_docente_curso 
            WHERE semestre_asignacion = $1
          )
      `;
      await client.query(updateQuery, [semestreActivo]);
      
      // Guardamos los cambios
      await client.query('COMMIT');
      
      return res.json({ 
        success: true, 
        message: 'Todos los turnos de los docentes con carga asignada han sido bloqueados (Completados).' 
      });
    } catch (error) {
      // Si el servidor falla, deshacemos cualquier cambio a medias
      await client.query('ROLLBACK'); 
      console.error('Error al completar todos los turnos:', error);
      return res.status(500).json({ success: false, message: 'Error interno al actualizar los turnos.' });
    } finally {
      client.release();
    }
  }
}; 

module.exports = SecretariaController;