require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl: {
    rejectUnauthorized: false,
  },
  
  idleTimeoutMillis: 10000, // Cierra conexiones inactivas después de 10 segundos
  connectionTimeoutMillis: 5000, // Si tarda más de 5s en conectar, lanza error en vez de colgarse
});

pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error en la conexión de PostgreSQL:', err);
  process.exit(-1);
});

module.exports = pool;
