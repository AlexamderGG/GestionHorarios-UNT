const DocenteModel = require('../models/docente.model'); // Ajusta la ruta según tu proyecto
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const pool = require('../config/db');



// Configuración del transporte de correo
// (Es altamente recomendado pasar el user y pass a un archivo .env por seguridad)
const transporter = nodemailer.createTransport({
  service: 'gmail', // Cambiar si usas Outlook u otro proveedor
  auth: {
    user: process.env.EMAIL_USER, // Ej: 'secretaria.unt@gmail.com'
    pass: process.env.EMAIL_PASS  // Contraseña de aplicación (no la clave normal)
  }
});

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

  // 2. Habilitar el turno y enviar credenciales
  habilitarTurno: async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect(); // Asumiendo que usas pg (PostgreSQL)

    try {
      await client.query('BEGIN');

      // a. Actualizar el estado del docente a "Notificado" en la BD
      const docente = await DocenteModel.updateEstadoTurno(id, 'Notificado', client);

      if (!docente) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Docente no encontrado' });
      }

      // Generar una credencial temporal (Ej: UNT-8F3A2)
      const passwordTemporal = `UNT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(passwordTemporal, saltRounds);
      
      // Guardar en la base de datos
      await DocenteModel.updatePassword(id, hashedPassword, client);

      // c. Configurar el correo electrónico
      const mailOptions = {
        from: `"Secretaría Académica UNT" <${process.env.EMAIL_USER}>`,
        to: docente.email,
        subject: 'Su turno para selección de horarios - UNT',
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
            <h2 style="color: #1a56db;">Estimado/a ${docente.nombres} ${docente.apellidos},</h2>
            <p>Le informamos que es su turno para realizar la selección de horarios por orden de escalafón.</p>
            <p>Por favor, ingrese al sistema para armar su horario utilizando las siguientes credenciales temporales:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Usuario (Email):</strong> ${docente.email}</p>
              <p><strong>Contraseña Temporal:</strong> ${passwordTemporal}</p>
            </div>
            <p style="color: #b91c1c; font-size: 14px;">
              <strong>Importante:</strong> Le recordamos que una vez finalizada su selección, debe pulsar el botón "Confirmar y Finalizar" en el sistema para ceder el turno al siguiente docente.
            </p>
            <br>
            <p>Atentamente,<br><strong>Secretaría Académica UNT</strong></p>
          </div>
        `
      };

      // d. Enviar el correo
      await transporter.sendMail(mailOptions);
      
      await client.query('COMMIT');
      res.json({ success: true, message: 'Turno habilitado y credenciales enviadas', data: docente });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al habilitar turno:', error);
      res.status(500).json({ success: false, message: 'Error al procesar el turno y enviar el correo' });
    } finally {
      client.release();
    }
  }
};

module.exports = SecretariaController;