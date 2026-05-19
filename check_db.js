const pool = require('./backend/src/config/db');

async function check() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'cursos'
      ORDER BY ordinal_position
    `);
    console.log('=== Estructura de tabla cursos ===');
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

check();
