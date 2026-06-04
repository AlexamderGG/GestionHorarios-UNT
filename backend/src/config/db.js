require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  // connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  // ssl: {
  //   rejectUnauthorized: false,
  // },
});

pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error en la conexión de PostgreSQL:', err);
  process.exit(-1);
});

module.exports = pool;
