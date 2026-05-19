# Modulo 1 - Gestion de Datos Maestros y Configuracion

> Implementado por: [Eduardo]  
> Rama Git: `modulo1`  
> Dependencias: Node.js, Express, PostgreSQL

---

## Que se implemento

Este modulo cubre la gestion completa de las entidades maestras del sistema y la configuracion global de horarios. Incluye:

### Entidades CRUD

1. **Docentes** (`/api/docentes`)
   - Listar, obtener por ID, crear, actualizar, eliminar (soft-delete).
   - Campos: `nombres`, `apellidos`, `email`, `telefono`, `categoria`, `tipo_nombramiento`, `especialidad`, `escuela`, `semestre_contrato`, `antiguedad_anios`.
   - Validaciones: email unico, campos obligatorios, categoria valida, antiguedad >= 0.
   - **Endpoint especial:** `GET /api/docentes/disponibles?especialidad=X&semestre=Y` - Filtra docentes disponibles por especialidad y semestre activo.

2. **Cursos** (`/api/cursos`)
   - Listar, obtener por ID, crear, actualizar, eliminar (soft-delete).
   - Campos: `codigo`, `nombre`, `creditos`, `ciclo`, `semestre`, `especialidad`, `horas_aula`, `horas_lab`.
   - Validaciones: codigo unico, creditos >= 1, ciclo 1-10, semestre formato YYYY-N, horas >= 0.

3. **Aulas** (`/api/aulas`)
   - Listar, obtener por ID, crear, actualizar, eliminar (soft-delete).
   - Validaciones: codigo unico, capacidad >= 1, tipo valido.

4. **Laboratorios** (`/api/laboratorios`)
   - Listar, obtener por ID, crear, actualizar, eliminar (soft-delete).
   - Laboratorios de uso general (sin especialidad). Cualquier curso puede reservarlos.
   - Validaciones: codigo unico, capacidad >= 1.

5. **Asignaciones Docente-Curso** (`/api/asignaciones`)
   - Listar con joins (muestra nombre de docente, curso y ambiente).
   - Crear y eliminar.
   - Validaciones:
     - No duplicar mismo docente + curso + tipo + semestre.
     - Verificar que docente y curso existan.
     - Verificar que el ambiente preferido exista y corresponda al tipo (aula para Teoria, laboratorio para Laboratorio).
     - **Validacion de especialidad:** Docentes contratados solo pueden dictar cursos que coincidan con su especialidad.
     - **Validacion de semestre de contrato:** Docentes contratados con `semestre_contrato` definido solo disponibles ese semestre.

6. **Configuracion** (`/api/configuracion`)
   - Obtener configuracion completa parseada (dias como array, numeros como int).
   - Actualizar multiples claves en una sola peticion.
   - Claves: `dias_habiles`, `hora_inicio`, `hora_fin`, `duracion_bloque`, `bloques_por_dia`, `semestre_activo`.
   - Validaciones: formato HH:MM para horas, enteros positivos para bloques, formato YYYY-N para semestre_activo.

---

## Archivos creados / modificados

### Migraciones SQL
- `database/migrations/001_init.sql` — Tablas iniciales (incluye especialidad en docentes/cursos, escuela, semestre_contrato).
- `database/migrations/002_alter_cursos.sql` — Agrega ciclo a asignaciones.
- `database/migrations/003_labs_genericos.sql` — Laboratorios genericos + horas en cursos.

### Seeds SQL
- `database/seeds/001_test_data.sql` — 20 docentes (8 nombrados Ing Sistemas + 12 contratados de diversas escuelas), 6 aulas, 5 labs.
- `database/seeds/002_demo_config.sql` — Configuracion incluyendo `semestre_activo`.
- `database/seeds/003_cursos_documento.sql` — 77 cursos reales de la EIS (10 ciclos) con especialidades y horas.

### Modelos (SQL directo con pg pool)
- `backend/src/models/docente.model.js` — Incluye `getDisponiblesPorEspecialidad` y `getDisponiblesPorSemestre`.
- `backend/src/models/curso.model.js` — Incluye especialidad y horas.
- `backend/src/models/aula.model.js`
- `backend/src/models/laboratorio.model.js` — Sin especialidad.
- `backend/src/models/asignacion.model.js` — Incluye ciclo.
- `backend/src/models/configuracion.model.js`

### Controladores
- `backend/src/controllers/docente.controller.js` — Incluye validaciones de especialidad/escuela/semestre_contrato + endpoint `getDisponibles`.
- `backend/src/controllers/curso.controller.js` — Valida especialidad y horas.
- `backend/src/controllers/aula.controller.js`
- `backend/src/controllers/laboratorio.controller.js`
- `backend/src/controllers/asignacion.controller.js` — Valida especialidad del docente contra especialidad del curso.
- `backend/src/controllers/configuracion.controller.js` — Valida semestre_activo.

### Rutas
- `backend/src/routes/docentes.routes.js` — Agrega `/disponibles`.
- `backend/src/routes/cursos.routes.js`
- `backend/src/routes/aulas.routes.js`
- `backend/src/routes/laboratorios.routes.js`
- `backend/src/routes/asignaciones.routes.js`
- `backend/src/routes/configuracion.routes.js`

### Scheduler adaptado
- `backend/src/models/horario.model.js` — Agrega curso_horas_aula y curso_horas_lab al query.
- `backend/src/services/scheduler.service.js` — Genera N sesiones por asignacion segun horas del curso.

---

## Como probar

### 1. Crear base de datos limpia
```bash
dropdb -U postgres scheduling_unt
createdb -U postgres scheduling_unt
```

### 2. Ejecutar migraciones y seeds
```bash
psql -U postgres -d scheduling_unt -f database/migrations/001_init.sql
psql -U postgres -d scheduling_unt -f database/migrations/002_alter_cursos.sql
psql -U postgres -d scheduling_unt -f database/migrations/003_labs_genericos.sql

psql -U postgres -d scheduling_unt -f database/seeds/001_test_data.sql
psql -U postgres -d scheduling_unt -f database/seeds/002_demo_config.sql
psql -U postgres -d scheduling_unt -f database/seeds/003_cursos_documento.sql
```

### 3. Levantar backend
```bash
cd backend
npm install
npm run dev
```

### 4. Probar endpoints

**Ver configuracion (incluye semestre_activo):**
```bash
curl http://localhost:3001/api/configuracion
```

**Ver docentes disponibles para Matematicas en 2026-1:**
```bash
curl "http://localhost:3001/api/docentes/disponibles?especialidad=Matematicas&semestre=2026-1"
```

**Crear asignacion valida (docente nombrado puede cualquier curso):**
```bash
curl -X POST http://localhost:3001/api/asignaciones \
  -H "Content-Type: application/json" \
  -d '{"docente_id": 1, "curso_id": 1, "tipo": "Teoria", "semestre_asignacion": "2026-1"}'
```

**Intentar asignacion invalida (docente contratado con especialidad diferente):**
```bash
curl -X POST http://localhost:3001/api/asignaciones \
  -H "Content-Type: application/json" \
  -d '{"docente_id": 10, "curso_id": 1, "tipo": "Teoria", "semestre_asignacion": "2026-1"}'
# Error: El docente contratado tiene especialidad 'Musica' pero el curso requiere 'Matematicas'
```

---

## Especialidades implementadas

### Docentes
- **Ingenieria de Sistemas** (8 nombrados + algunos contratados)
- **Matematicas** (2 contratados de Escuela de Matematicas)
- **Fisica** (1 contratado de Escuela de Fisica)
- **Comunicacion** (1 contratado de Escuela de Comunicacion)
- **Psicologia** (1 contratado de Escuela de Psicologia)
- **Filosofia** (1 contratado de Escuela de Filosofia)
- **Ciencias Sociales** (1 contratado)
- **Administracion** (1 contratado de Escuela de Administracion)
- **Musica** (1 contratado de Escuela de Artes, solo semestre 2026-1)
- **Danza Folklorica** (1 contratado de Escuela de Artes, solo semestre 2026-1)
- **Educacion Fisica** (1 contratado de Escuela de Educacion Fisica, solo semestre 2026-1)
- **Derecho** (1 contratado de Escuela de Derecho)
- **Ingenieria Ambiental** (1 contratado)

### Cursos (por especialidad)
- **Matematicas:** EG-101, EG-104, EG-105, EG-204, EG-205, EP-302, EP-303, EP-502
- **Fisica:** EG-205, EP-304
- **Comunicacion:** EG-102, EL-101
- **Psicologia:** EG-103, EL-302
- **Filosofia:** EG-201, EG-203
- **Ciencias Sociales:** EG-202
- **Administracion:** EP-301, EP-401, EP-402, EP-403, EP-501, EP-601, EP-602, EP-701, EP-801, EE-901, EL-702, EL-901
- **Musica:** EL-102
- **Danza Folklorica:** EL-202
- **Educacion Fisica:** EL-203
- **Derecho:** EL-801
- **Ingenieria Ambiental:** EL-601
- **Ingenieria de Sistemas:** Todos los demas cursos (EE-*, EI-*, EL-101, EL-103, EL-201, EL-301, EL-401, EL-402, EL-501, EL-502, EL-601, EL-602, EL-701, EL-802, EL-902, etc.)

---

## Notas para los otros modulos

- **Modulo 2 (Scheduler):**
  - Usar `semestre_activo` de configuracion para determinar ciclos activos (impar = 1,3,5,7,9; par = 2,4,6,8,10).
  - Filtrar asignaciones por ciclos activos antes de generar horarios.
  - Los docentes contratados con `semestre_contrato` NULL estan disponibles todos los semestres.
  - Los docentes contratados con `semestre_contrato` definido solo estan disponibles ese semestre.
  - Validar que la especialidad del docente coincida con la del curso (solo para contratados).
  - Generar N sesiones por asignacion segun `horas_aula` y `horas_lab` del curso.
  - Los laboratorios son de uso general (sin especialidad); cualquier curso puede reservarlos.

- **Modulo 3 (Dashboard):**
  - Usar `GET /api/docentes/disponibles?especialidad=X&semestre=Y` para poblar selectores de docentes al asignar cursos.
  - El admin debe poder cambiar `semestre_activo` desde la pantalla de configuracion.
  - Mostrar ciclos activos segun paridad del semestre.

- **Modulo 4 (Reportes):**
  - Los reportes de gestion pueden agrupar por especialidad o escuela.
  - El reporte operacional muestra uso de ambientes sin especialidad (todos genericos).

---

## Decisiones de diseno

- **Sin ORM:** Se usan queries SQL directas con el pool de `pg` para mantener el control total sobre las consultas y evitar dependencias pesadas.
- **Soft delete:** `docentes`, `cursos`, `aulas` y `laboratorios` usan banderas `activo`/`activa` en lugar de DELETE fisico, para preservar integridad referencial con `asignaciones` y `horarios`.
- **Merge en updates:** Los endpoints PUT aceptan solo los campos que se quieren cambiar; el controlador mergea con el registro existente antes de actualizar.
- **Validaciones centralizadas:** Cada controlador tiene una funcion `validarX` que retorna un array de errores antes de tocar la BD.
- **Laboratorios genericos:** Se elimino `especialidad` de laboratorios para permitir que cualquier curso reserve cualquier lab segun sus `horas_lab`.
- **Horas en cursos:** `cursos` ahora tiene `horas_aula` y `horas_lab`. El scheduler usa estas horas para determinar cuantas sesiones generar por asignacion.
- **Ciclo vs Semestre:** Despues de la migracion 002, `ciclo` es INTEGER (1-10) y `semestre` es VARCHAR (YYYY-N), alineado con la terminologia academica real de la UNT.
- **Especialidad y Escuela:** Docentes de diversas escuelas pueden dictar cursos de la EIS segun su especialidad. Los nombrados de Ing. Sistemas tienen prioridad y pueden adaptarse a cualquier curso.
- **Semestre de contrato:** Permite contratar docentes externos por un solo semestre (ej: profesores de musica, danza, deporte para electivos).
- **Disponibilidad por semestre:** El endpoint `/api/docentes/disponibles` filtra automaticamente docentes contratados segun el semestre activo, mostrando solo los que estan disponibles.
