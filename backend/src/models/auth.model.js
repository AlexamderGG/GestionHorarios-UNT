const pool = require('../config/db');

const AuthModel = {
  findDocenteByEmail: async (email) => {
    const result = await pool.query(
      `SELECT id, nombres, apellidos, email, categoria, tipo_nombramiento, antiguedad_anios
       FROM docentes
       WHERE email = $1 AND activo = TRUE`,
      [email]
    );
    return result.rows[0] || null;
  },
};

module.exports = AuthModel;
