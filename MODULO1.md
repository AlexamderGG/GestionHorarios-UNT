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
   - Validaciones: email unico, campos obligatorios, categoria valida, antiguedad >= 0.

2. **Cursos** (`/api/cursos`)
   - Listar, obtener por ID, crear, actualizar, eliminar (soft-delete).
   - Validaciones: codigo unico, creditos >= 1, semestre entre 1 y 10.

3. **Aulas** (`/api/aulas`)
   - Listar, obtener por ID, crear, actualizar, eliminar (soft-delete).
   - Validaciones: codigo unico, capacidad >= 1, tipo valido.

4. **Laboratorios** (`/api/laboratorios`)
   - Listar, obtener por ID, crear, actualizar, eliminar (soft-delete).
   - Validaciones: codigo unico, capacidad >= 1.

5. **Asignaciones Docente-Curso** (`/api/asignaciones`)
   - Listar con joins (muestra nombre de docente, curso y ambiente).
   - Crear y eliminar.
   - Validaciones:
     - No duplicar mismo docente + curso + tipo + semestre.
     - Verificar que docente y curso existan.
     - Verificar que el ambiente preferido exista y corresponda al tipo (aula para Teoria, laboratorio para Laboratorio).

6. **Configuracion** (`/api/configuracion`)
   - Obtener configuracion completa parseada (dias como array, numeros como int).
   - Actualizar multiples claves en una sola peticion.
   - Validaciones: formato HH:MM para horas, enteros positivos para bloques.

---

## Archivos creados / modificados

### Modelos (SQL directo con pg pool)

- `backend/src/models/docente.model.js`
- `backend/src/models/curso.model.js`
- `backend/src/models/aula.model.js`
- `backend/src/models/laboratorio.model.js`
- `backend/src/models/asignacion.model.js`
- `backend/src/models/configuracion.model.js`

### Controladores (validaciones + logica de negocio)

- `backend/src/controllers/docente.controller.js`
- `backend/src/controllers/curso.controller.js`
- `backend/src/controllers/aula.controller.js`
- `backend/src/controllers/laboratorio.controller.js`
- `backend/src/controllers/asignacion.controller.js`
- `backend/src/controllers/configuracion.controller.js`

### Rutas (conectadas a controladores reales)

- `backend/src/routes/docentes.routes.js`
- `backend/src/routes/cursos.routes.js`
- `backend/src/routes/aulas.routes.js`
- `backend/src/routes/laboratorios.routes.js`
- `backend/src/routes/asignaciones.routes.js`
- `backend/src/routes/configuracion.routes.js`

### Tests

- `backend/tests/test_modulo1.js` - Script Node.js para probar todos los endpoints automaticamente.

---

## Como probar

### 1. Asegurar que la BD este lista

```bash
psql -U postgres -d scheduling_unt -f database/migrations/001_init.sql
psql -U postgres -d scheduling_unt -f database/seeds/001_test_data.sql
```

### 2. Levantar el backend

```bash
cd backend
npm install
npm run dev
```

### 3. Ejecutar tests automaticos

En otra terminal:

```bash
node backend/tests/test_modulo1.js
```

### 4. Probar manualmente con curl (ejemplos)

**Listar docentes:**

```bash
curl http://localhost:3001/api/docentes
```

**Crear docente:**

```bash
curl -X POST http://localhost:3001/api/docentes \
  -H "Content-Type: application/json" \
  -d '{
    "nombres": "Pedro",
    "apellidos": "Gomez",
    "email": "pedro.gomez@unt.edu.pe",
    "telefono": "999888777",
    "categoria": "Principal",
    "tipo_nombramiento": "Nombrado",
    "antiguedad_anios": 10
  }'
```

**Actualizar docente (ID=1):**

```bash
curl -X PUT http://localhost:3001/api/docentes/1 \
  -H "Content-Type: application/json" \
  -d '{"telefono": "111222333"}'
```

**Listar cursos:**

```bash
curl http://localhost:3001/api/cursos
```

**Crear asignacion:**

```bash
curl -X POST http://localhost:3001/api/asignaciones \
  -H "Content-Type: application/json" \
  -d '{
    "docente_id": 1,
    "curso_id": 3,
    "tipo": "Teoria",
    "ambiente_preferido_id": 1,
    "semestre_asignacion": "2024-1"
  }'
```

**Obtener configuracion:**

```bash
curl http://localhost:3001/api/configuracion
```

**Actualizar configuracion:**

```bash
curl -X PUT http://localhost:3001/api/configuracion \
  -H "Content-Type: application/json" \
  -d '{
    "configuracion": {
      "hora_inicio": "08:00",
      "duracion_bloque": 90
    }
  }'
```

---

## Contratos de API respetados

Todos los endpoints cumplen con los contratos definidos en `API_CONTRACTS.md`:

| Endpoint                | Metodo | Estado       |
| ----------------------- | ------ | ------------ |
| `/api/docentes`         | GET    | Implementado |
| `/api/docentes/:id`     | GET    | Implementado |
| `/api/docentes`         | POST   | Implementado |
| `/api/docentes/:id`     | PUT    | Implementado |
| `/api/docentes/:id`     | DELETE | Implementado |
| `/api/cursos`           | GET    | Implementado |
| `/api/cursos/:id`       | GET    | Implementado |
| `/api/cursos`           | POST   | Implementado |
| `/api/cursos/:id`       | PUT    | Implementado |
| `/api/cursos/:id`       | DELETE | Implementado |
| `/api/aulas`            | GET    | Implementado |
| `/api/aulas/:id`        | GET    | Implementado |
| `/api/aulas`            | POST   | Implementado |
| `/api/aulas/:id`        | PUT    | Implementado |
| `/api/aulas/:id`        | DELETE | Implementado |
| `/api/laboratorios`     | GET    | Implementado |
| `/api/laboratorios/:id` | GET    | Implementado |
| `/api/laboratorios`     | POST   | Implementado |
| `/api/laboratorios/:id` | PUT    | Implementado |
| `/api/laboratorios/:id` | DELETE | Implementado |
| `/api/asignaciones`     | GET    | Implementado |
| `/api/asignaciones`     | POST   | Implementado |
| `/api/asignaciones/:id` | DELETE | Implementado |
| `/api/configuracion`    | GET    | Implementado |
| `/api/configuracion`    | PUT    | Implementado |

---

## Notas para los otros modulos

- **Modulo 2:** Ya puede usar los datos de `docentes`, `cursos`, `aulas`, `laboratorios` y `asignaciones` para probar el algoritmo. El endpoint `/api/asignaciones` devuelve joins con nombres para facilitar la visualizacion.
- **Modulo 3:** Los endpoints de configuracion devuelven valores parseados (arrays, enteros). Puede usar `GET /api/configuracion` para pintar los selectores de dias/horas.
- **Modulo 4:** Los reportes de gestion pueden consumir `GET /api/docentes` y `GET /api/asignaciones` para armar los resumenes.

---

## Decisiones de diseno

- **Sin ORM:** Se usan queries SQL directas con el pool de `pg` para mantener el control total sobre las consultas y evitar dependencias pesadas.
- **Soft delete:** `docentes`, `cursos`, `aulas` y `laboratorios` usan banderas `activo`/`activa` en lugar de DELETE fisico, para preservar integridad referencial con `asignaciones` y `horarios`.
- **Merge en updates:** Los endpoints PUT aceptan solo los campos que se quieren cambiar; el controlador mergea con el registro existente antes de actualizar.
- **Validaciones centralizadas:** Cada controlador tiene una funcion `validarX` que retorna un array de errores antes de tocar la BD.
