require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3001;

// === Validacion de variables de entorno ===
const requiredVars = ['JWT_SECRET', 'DATABASE_URL'];
const missing = requiredVars.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Error: Faltan variables de entorno requeridas:');
  missing.forEach(key => console.error(`   • ${key}`));
  console.error('\n📋 Copia .env.example como base:');
  console.error('   cp backend/.env.example backend/.env');
  process.exit(1);
}

if (!process.env.ADMIN_USER || process.env.ADMIN_USER === 'admin') {
  console.warn('⚠️  ADMIN_USER no configurado o usa el valor por defecto. Recomendado cambiarlo en .env');
}
if (!process.env.ADMIN_PASS || process.env.ADMIN_PASS === 'admin123') {
  console.warn('⚠️  ADMIN_PASS no configurado o usa el valor por defecto. Recomendado cambiarlo en .env');
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
  console.log(`📋 Entorno: ${process.env.NODE_ENV || 'development'}`);
});
