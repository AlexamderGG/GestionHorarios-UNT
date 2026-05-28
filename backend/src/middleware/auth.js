const jwt = require('jsonwebtoken');
const DocenteModel = require('../models/docente.model'); // 1. Importamos el modelo

const authenticate = async (req, res, next) => { // 2. Convertimos a async
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token no proporcionado' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // 3. NUEVO PUNTO DE CONTROL: Verificación en tiempo real
    if (req.user.role === 'docente') {
      const docente = await DocenteModel.getById(req.user.id);
      
      // Bloqueamos si el docente ya no existe, si su turno se reinició o si le borraron la clave
      if (!docente || docente.estado_turno === 'Pendiente' || !docente.password || 
        decoded.iat < docente.reset_token_at) {
        return res.status(401).json({ 
          success: false, 
          message: 'Sesión inválida. Su turno ha sido reiniciado y requiere ingresar con sus nuevas credenciales.'
        });
      }
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
};

// La función requireRole se mantiene exactamente igual
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Acceso denegado' });
  }
  next();
};

module.exports = { authenticate, requireRole };