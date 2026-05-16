// ============================================================
// TESTS MANUALES - Modulo 1 (Gestion de Datos Maestros)
// ============================================================
// Ejecutar con: node backend/tests/test_modulo1.js
// Requiere que el backend este corriendo en localhost:3001
// ============================================================

const http = require("http");

const baseUrl = "localhost";
const port = 3001;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: baseUrl,
      port: port,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log("========================================");
  console.log("TESTS MODULO 1 - Gestion de Datos Maestros");
  console.log("========================================\n");

  // 1. Docentes
  console.log("--- DOCENTES ---");
  let res = await request("GET", "/api/docentes");
  console.log(
    "GET /api/docentes ->",
    res.status,
    res.body.message || res.body.data?.length + " registros",
  );

  res = await request("GET", "/api/docentes/1");
  console.log("GET /api/docentes/1 ->", res.status, res.body.message);

  // 2. Cursos
  console.log("\n--- CURSOS ---");
  res = await request("GET", "/api/cursos");
  console.log(
    "GET /api/cursos ->",
    res.status,
    res.body.message || res.body.data?.length + " registros",
  );

  res = await request("GET", "/api/cursos/1");
  console.log("GET /api/cursos/1 ->", res.status, res.body.message);

  // 3. Aulas
  console.log("\n--- AULAS ---");
  res = await request("GET", "/api/aulas");
  console.log(
    "GET /api/aulas ->",
    res.status,
    res.body.message || res.body.data?.length + " registros",
  );

  // 4. Laboratorios
  console.log("\n--- LABORATORIOS ---");
  res = await request("GET", "/api/laboratorios");
  console.log(
    "GET /api/laboratorios ->",
    res.status,
    res.body.message || res.body.data?.length + " registros",
  );

  // 5. Asignaciones
  console.log("\n--- ASIGNACIONES ---");
  res = await request("GET", "/api/asignaciones");
  console.log(
    "GET /api/asignaciones ->",
    res.status,
    res.body.message || res.body.data?.length + " registros",
  );

  // 6. Configuracion
  console.log("\n--- CONFIGURACION ---");
  res = await request("GET", "/api/configuracion");
  console.log("GET /api/configuracion ->", res.status, res.body.message);

  // 7. Crear un docente (POST)
  console.log("\n--- CREAR DOCENTE (POST) ---");
  const nuevoDocente = {
    nombres: "Camila",
    apellidos: "Ramirez",
    email: "c.ramirez.test@unt.edu.pe",
    telefono: "999999999",
    categoria: "Asociado",
    tipo_nombramiento: "Nombrado",
    antiguedad_anios: 5,
  };
  res = await request("POST", "/api/docentes", nuevoDocente);
  console.log("POST /api/docentes ->", res.status, res.body.message);
  if (res.body.success) {
    const docenteId = res.body.data.id;
    console.log("  Docente creado con ID:", docenteId);

    // Actualizarlo
    console.log("\n--- ACTUALIZAR DOCENTE (PUT) ---");
    res = await request("PUT", `/api/docentes/${docenteId}`, {
      nombres: "Juan Carlos",
      telefono: "111111111",
    });
    console.log(
      `PUT /api/docentes/${docenteId} ->`,
      res.status,
      res.body.message,
    );

    // Eliminarlo
    console.log("\n--- ELIMINAR DOCENTE (DELETE) ---");
    res = await request("DELETE", `/api/docentes/${docenteId}`);
    console.log(
      `DELETE /api/docentes/${docenteId} ->`,
      res.status,
      res.body.message,
    );
  }

  console.log("\n========================================");
  console.log("TESTS FINALIZADOS");
  console.log("========================================");
}

runTests().catch(console.error);
