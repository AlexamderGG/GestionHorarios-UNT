const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const AuthModel = require('../models/auth.model');
const DocenteModel = require('../models/docente.model');
const pool = require('../config/db'); // Importamos la conexión para guardar la clave en la tabla configuracion
const { success, error } = require('../utils/responseHelper');

// Función para validar la complejidad de la nueva clave
const isStrongPassword = (password) => {
  // Regex: Mínimo 12 caracteres, al menos 1 mayúscula, 1 minúscula y 1 número
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,}$/;
  return regex.test(password);
};

const AuthController = {
  login: async (req, res) => {
    try {
      const { email, password, usuario, role } = req.body;

      // --- LÓGICA DE ADMIN ---
      if (role === 'admin') {
        const adminUser = process.env.ADMIN_USER || 'admin';

        if (usuario !== adminUser) {
          return error(res, 'Credenciales de administrador inválidas', 401);
        }

        let validPassword = false;

        // 1. Buscamos si el admin ya configuró una contraseña propia en la Base de Datos
        const dbPass = await pool.query("SELECT valor FROM configuracion WHERE clave = 'admin_password'");
        
        if (dbPass.rows.length > 0 && dbPass.rows[0].valor) {
          // 2. Si la encuentra en la BD, la comparamos encriptada con bcrypt
          validPassword = await bcrypt.compare(password, dbPass.rows[0].valor);
        } else {
          // 3. Fallback: Si nunca ha cambiado su clave, usa la original del .env en texto plano
          const adminPassEnv = process.env.ADMIN_PASS || 'admin123';
          validPassword = (password === adminPassEnv);
        }

        if (!validPassword) {
          return error(res, 'Credenciales de administrador inválidas', 401);
        }

        const token = jwt.sign(
          { id: 0, role: 'admin' },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
        );

        return success(res, {
          token,
          user: { id: 0, role: 'admin', nombre: 'Administrador', email: null },
        }, 'Login exitoso');
      }

      // --- LÓGICA DE DOCENTE ---
      if (!email) return error(res, 'Email es requerido', 400);

      const docente = await AuthModel.findDocenteByEmail(email);
      if (!docente) return error(res, 'Email no registrado', 401);

      if (!docente.password) {
        return error(res, 'Aún no se han generado credenciales para su cuenta. Por favor, espere su turno.', 401);
      }

      const validPassword = await bcrypt.compare(password, docente.password);
      if (!validPassword) {
        return error(res, 'Contraseña incorrecta', 401);
      }

      const token = jwt.sign(
        { id: docente.id, role: 'docente' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
      );

      return success(res, {
        token,
        user: {
          id: docente.id,
          role: 'docente',
          nombre: `${docente.nombres} ${docente.apellidos}`,
          email: docente.email,
          categoria: docente.categoria,
          tipo_nombramiento: docente.tipo_nombramiento,
        },
      }, 'Login exitoso');
    } catch (err) {
      console.error(err);
      error(res, 'Error en el servidor', 500);
    }
  },

  me: async (req, res) => {
    try {
      if (req.user.role === 'admin') {
        return success(res, {
          id: 0,
          role: 'admin',
          nombre: 'Administrador',
          email: null,
        });
      }

      const docente = await DocenteModel.getById(req.user.id);
      if (!docente) return error(res, 'Docente no encontrado', 404);

      return success(res, {
        id: docente.id,
        role: 'docente',
        nombre: `${docente.nombres} ${docente.apellidos}`,
        email: docente.email,
        categoria: docente.categoria,
        tipo_nombramiento: docente.tipo_nombramiento,
      });
    } catch (err) {
      console.error(err);
      error(res, 'Error en el servidor', 500);
    }
  },

  // --- NUEVO MÉTODO DE CAMBIO DE CONTRASEÑA ---
  changeAdminPassword: async (req, res) => {
    try {
      // 1. Verificación de seguridad
      if (req.user.role !== 'admin') {
        return error(res, 'Acceso denegado. Solo la secretaría puede realizar esta acción.', 403);
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return error(res, 'Debe proporcionar la contraseña actual y la nueva.', 400);
      }

      // 2. Validación estricta de la nueva contraseña
      if (!isStrongPassword(newPassword)) {
        return error(res, 'La nueva contraseña debe tener al menos 12 caracteres, incluyendo al menos una letra mayúscula, una minúscula y un número.', 400);
      }

      // 3. Validar que la contraseña actual ingresada es correcta
      const dbPass = await pool.query("SELECT valor FROM configuracion WHERE clave = 'admin_password'");
      let isCurrentValid = false;

      if (dbPass.rows.length > 0 && dbPass.rows[0].valor) {
        isCurrentValid = await bcrypt.compare(currentPassword, dbPass.rows[0].valor);
      } else {
        const adminPassEnv = process.env.ADMIN_PASS || 'admin123';
        isCurrentValid = (currentPassword === adminPassEnv);
      }

      if (!isCurrentValid) {
        return error(res, 'La contraseña actual es incorrecta.', 401);
      }

      // 4. Encriptar y persistir la nueva clave en la Base de Datos
      const salt = await bcrypt.genSalt(10);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);

      if (dbPass.rows.length > 0) {
        await pool.query("UPDATE configuracion SET valor = $1 WHERE clave = 'admin_password'", [hashedNewPassword]);
      } else {
        await pool.query("INSERT INTO configuracion (clave, valor) VALUES ('admin_password', $1)", [hashedNewPassword]);
      }

      return success(res, null, 'Contraseña de administrador actualizada con éxito.');
    } catch (err) {
      console.error(err);
      return error(res, 'Error en el servidor al cambiar la contraseña.', 500);
    }
  }
};

module.exports = AuthController;