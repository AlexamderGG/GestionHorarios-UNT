// ============================================================
// TESTS MANUALES - Modulo 2 (Algoritmo de Horarios)
// ============================================================
// Ejecutar con: node backend/tests/test_modulo2.js
// Requiere backend corriendo en localhost:3001 y BD con seeds.
// ============================================================

const http = require('http');

const baseUrl = 'localhost';
const port = 3001;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: baseUrl,
      port,
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('========================================');
  console.log('TESTS MODULO 2 - Algoritmo de Horarios');
  console.log('========================================\n');

  let res = await request('POST', '/api/horarios/generar', { semestre: '2024-1', forzar: true });
  console.log('POST /api/horarios/generar ->', res.status, res.body.message);
  if (res.body.success) {
    console.log('  Generados:', res.body.data.generados);
    console.log('  No asignados:', res.body.data.no_asignados);
  }

  res = await request('GET', '/api/horarios?semestre=2024-1');
  console.log('GET /api/horarios?semestre=2024-1 ->', res.status, res.body.message);
  if (res.body.success) console.log('  Registros:', res.body.data.length);

  res = await request('GET', '/api/estadisticas?semestre=2024-1');
  console.log('GET /api/estadisticas?semestre=2024-1 ->', res.status, res.body.message);
  if (res.body.success) {
    console.log('  Total docentes:', res.body.data.total_docentes);
    console.log('  Ocupacion:', `${res.body.data.ocupacion_aulas}%`);
  }

  console.log('\n========================================');
  console.log('TESTS FINALIZADOS');
  console.log('========================================');
}

runTests().catch(console.error);
