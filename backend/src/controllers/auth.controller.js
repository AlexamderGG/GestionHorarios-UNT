const jwt = require('jsonwebtoken');
const AuthModel = require('../models/auth.model');
const DocenteModel = require('../models/docente.model');
const { success, error } = require('../utils/responseHelper');

const AuthController = {
  login: async (req, res) => {
    try {
      const { email, password, usuario, role } = req.body;

      if (role === 'admin') {
        const adminUser = process.env.ADMIN_USER || 'admin';
        const adminPass = process.env.ADMIN_PASS || 'admin123';

        if (usuario !== adminUser || password !== adminPass) {
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

      if (!email) return error(res, 'Email es requerido', 400);

      const docente = await AuthModel.findDocenteByEmail(email);
      if (!docente) return error(res, 'Email no registrado', 401);

      const docentePassword = process.env.DOCENTE_PASSWORD || 'docente123';
      if (password !== docentePassword) {
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
};

module.exports = AuthController;
