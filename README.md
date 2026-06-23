# Scheduling UNT - Sistema de Gestión Automática de Horarios

> **Proyecto:** Escuela de Ingeniería de Sistemas - Universidad Nacional de Trujillo  
> **Stack:** Node.js + Express (Backend) | React + Vite + Tailwind (Frontend) | PostgreSQL (BD)

---

## Descripción General

Aplicación web para la gestión automática de horarios académicos. El sistema asigna horarios respetando la jerarquía docente (nombrados vs contratados, categoría y antigüedad), evita cruces de horarios y doble reserva de ambientes, distribuye la carga horaria equitativamente, y proporciona dashboard con gráficos y reportes.

**Funcionalidades clave:**

- Semestre activo configurable (impar/par) que determina ciclos activos.
- Asignación manual y automática de cursos a docentes respetando especialidad y límite de 20h semanales.
- Docentes seleccionan sus horarios desde su portal personal.
- Scheduler con prioridad: Nombrados > Contratados; Principal > Asociado > Auxiliar > Jefe de práctica.

---

## Estructura del Proyecto

```
scheduling-unt/
├── backend/
│   ├── src/
│   │   ├── config/        # Configuración (DB, etc.)
│   │   ├── controllers/   # Lógica de negocio
│   │   ├── models/        # Modelos / queries SQL
│   │   ├── routes/        # Definición de endpoints API
│   │   ├── services/      # Servicios auxiliares (scheduler, demo)
│   │   ├── utils/         # Helpers (responseHelper, etc.)
│   │   └── app.js         # Configuración de Express
│   ├── .env               # Variables de entorno (NO subir a git)
│   ├── .env.example       # Plantilla de variables
│   ├── package.json
│   └── server.js          # Punto de entrada
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/    # Componentes reutilizables (Layout, Navbar, etc.)
│   │   ├── pages/         # Vistas principales
│   │   │   ├── admin/     # Dashboard, Asignaciones, Docentes, Horarios, Configuración, Reportes
│   │   │   └── docente/   # Mis Cursos, Mi Horario, Seleccionar Horario
│   │   ├── hooks/         # Hooks personalizados
│   │   ├── services/      # Cliente Axios (api.js)
│   │   ├── App.jsx        # Router principal
│   │   ├── main.jsx       # Punto de entrada React
│   │   └── index.css      # Estilos base + Tailwind
│   ├── package.json
│   ├── vite.config.js     # Proxy a backend en desarrollo
│   ├── tailwind.config.js
│   └── postcss.config.js
├── database/
│   ├── migrations/
│   │   ├── 001_init.sql              # Creación de tablas iniciales
│   │   ├── 002_alter_cursos.sql      # Reestructura ciclos y semestres
│   │   └── 003_labs_genericos.sql    # Laboratorios genéricos + horas en cursos
│   └── seeds/
│       ├── 001_test_data.sql         # 20 docentes con especialidades, aulas y labs
│       ├── 002_demo_config.sql       # Configuración de modo demo
│       └── 003_cursos_documento.sql  # 77 cursos reales de la EIS (10 ciclos, con horas)
├── API_CONTRACTS.md       # Contratos de API
├── MODULO1.md             # Docs del Módulo 1 implementado
└── README.md              # Este archivo
```

---

## Requisitos Previos

- **Node.js** >= 18.x
- **PostgreSQL** >= 14.x
- **npm**

---

## Instrucciones de Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/scheduling-unt.git
cd scheduling-unt
```

### 2. Crear base de datos y ejecutar migraciones

```bash
# Crear la base de datos (solicitará contraseña de postgres)
createdb -U postgres scheduling_unt

# Ejecutar migraciones en orden
psql -U postgres -d scheduling_unt -f database/migrations/001_init.sql
psql -U postgres -d scheduling_unt -f database/migrations/002_alter_cursos.sql
psql -U postgres -d scheduling_unt -f database/migrations/003_labs_genericos.sql
psql -U postgres -d scheduling_unt -f database/migrations/004_carga_no_lectiva.sql
psql -U postgres -d scheduling_unt -f database/migrations/005_horario_no_lectivos.sql
```

### 3. Cargar datos de prueba (seeds)

```bash
# En orden:
psql -U postgres -d scheduling_unt -f database/seeds/001_test_data.sql
psql -U postgres -d scheduling_unt -f database/seeds/002_demo_config.sql
psql -U postgres -d scheduling_unt -f database/seeds/003_cursos_documento.sql
```

> **Nota:** `001_test_data.sql` inserta 20 docentes, 6 aulas y 5 laboratorios.  
> `003_cursos_documento.sql` inserta 77 cursos reales de la EIS con `horas_aula` y `horas_lab`.

### 4. Configurar Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

**Archivo `.env` obligatorio:**

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=tu_password
DB_NAME=scheduling_unt
PORT=3001
NODE_ENV=development

# JWT (cualquier string secreto)
JWT_SECRET=mi_clave_secreta_123
JWT_EXPIRES_IN=8h

# Credenciales de admin
ADMIN_USER=admin
ADMIN_PASS=admin123

# Contraseña única para todos los docentes
DOCENTE_PASSWORD=docente123
```

> El backend estará en: `http://localhost:3001`

### 5. Configurar Frontend

```bash
cd frontend
npm install
npm run dev
```

> El frontend estará en: `http://localhost:5173`
> El proxy de Vite redirige `/api` al backend automáticamente.

### 6. Acceder al sistema

Abre `http://localhost:5173` en el navegador.

#### Credenciales de acceso

| Rol     | Usuario / Email                      | Contraseña   |
| ------- | ------------------------------------ | ------------ |
| Admin   | `admin` (campo "Usuario")            | `admin123`   |
| Docente | Cualquier email de la tabla docentes | `docente123` |

**Emails de docentes de prueba (seed 001):**

- `c.ramirez@unt.edu.pe` (Ing. Sistemas, Nombrado)
- `j.perez@unt.edu.pe` (Matemáticas, Contratado)
- `p.sanchez@unt.edu.pe` (Física, Contratado)
- `c.torres@unt.edu.pe` (Comunicación, Contratado)
- `f.rojas@unt.edu.pe` (Música, Contratado - electivo)
- `i.luna@unt.edu.pe` (Danza Folklórica, Contratado - electivo)
- etc.

---

## Flujo de uso rápido

1. **Admin** entra con `admin / admin123`.
2. Va a **Configuración** y define el **Semestre Activo** (ej. `2026-1` para ciclos impares, `2026-2` para pares).
3. Va a **Asignaciones** y asigna cursos a docentes manualmente o presiona **"Asignar Automático"**.
4. Presiona **"Generar Horarios"** en Dashboard o Horarios para ejecutar el scheduler.
5. **Docente** entra con su email y `docente123`, va a **"Mis Cursos"** y selecciona horario.

---

## Convenciones y Estilo de Código

- **Backend:** Modelos SQL directos con `pg` pool (sin ORM). Respuestas estandarizadas con `success()` / `error()`.
- **Frontend:** React funcional + hooks. Tailwind CSS. `lucide-react` para íconos. `recharts` para gráficos.
- **Base de datos:** Tablas en plural, snake_case. Soft-delete con `activo`/`activa`. IDs `SERIAL PRIMARY KEY`.
- **Git:** Usar ramas por feature: `feature/nombre-descriptivo`.

---

## Estado de Implementación

| Módulo       | Estado        | Descripción                                                       |
| ------------ | ------------- | ----------------------------------------------------------------- |
| **Módulo 1** | ✅ Completado | CRUD maestro, asignaciones, configuración, seeds reales           |
| **Módulo 2** | ✅ Completado | Scheduler automático con prioridad y distribución equitativa      |
| **Módulo 3** | ✅ Completado | Dashboard, grilla de horarios, gestión de docentes y asignaciones |
| **Módulo 4** | ✅ Completado | Vista docente (mis cursos, mi horario, seleccionar horario)       |

---

## Supuestos y Decisiones de Diseño

- **Ciclo vs Semestre:**
  - `ciclo` (INTEGER 1-10): ciclo del plan de estudios.
  - `semestre` (VARCHAR): periodo académico formato `YYYY-N`.
  - `semestre_activo` en configuración determina ciclos activos: `-1` → impares (1,3,5,7,9); `-2` → pares (2,4,6,8,10).
- **Especialidad obligatoria:** Todos los docentes deben tener `especialidad` que coincida exactamente con la del curso para poder ser asignados. No hay excepciones por tipo de nombramiento.
- **Límite de carga:** Máximo **20 horas semanales** por docente. El sistema lo valida en frontend y backend.
- **Un curso = un docente por tipo:** Solo un docente puede dar Teoría y solo uno Laboratorio del mismo curso. No se permiten duplicados del mismo tipo.
- **Laboratorios genéricos:** No tienen especialidad. Cualquier curso puede usar cualquier lab.
- **Horas por curso:** `horas_aula` (teoría/práctica en aula) y `horas_lab` (laboratorio). El scheduler genera sesiones según estas horas.
- **Asignación automática:** Distribuye cursos buscando el docente con **menor carga horaria actual** primero, luego por prioridad (Nombrado > Contratado, etc.).
- **Horario docente:** El docente selecciona día e inicio; la hora fin se calcula automáticamente según `horas_aula` o `horas_lab` del curso.
- **Visualización:** La grilla de horarios usa bloques de 1 hora para que cursos de 3h o 4h ocupen múltiples celdas consecutivas correctamente.

---

## Cambios Recientes (última sesión)

### Backend

- **Asignación automática (`/api/asignaciones/auto`)**: distribución equitativa por carga horaria, respeta límite de 20h.
- **Endpoint limpiar asignaciones (`POST /api/asignaciones/limpiar`)**: elimina todas las asignaciones del semestre.
- **Validaciones**: curso ya asignado por tipo, límite de horas, especialidad obligatoria.
- **Modelo `horario.model.js`**: eliminada referencia a `l.especialidad` (labs son genéricos).
- **`getMisCursos`**: carga asignaciones con JOINs completos y filtra por semestre actual.

### Frontend

- **Nueva vista `AdminDocentes.jsx`**: CRUD completo de docentes con combo boxes para especialidad y escuela.
- **Nueva vista `AdminAsignaciones.jsx`**: asignación manual con filtros, indicador de carga horaria por docente, botón "Asignar Automático" y "Limpiar Todo".
- **Configuración**: semestre activo editable, días hábiles toggles, guardado persistente.
- **Dashboard/Horarios/EstadoDocentes**: leen semestre activo desde configuración.
- **SeleccionarHorario (docente)**: combo muestra horas del curso, hora fin calculada automáticamente según duración real del curso.
- **MiHorario (docente)**: grilla de 1h que permite ver cursos de 2h, 3h, 4h ocupando múltiples bloques.

---

## Comandos Útiles

```bash
# Backend
cd backend && npm run dev          # Desarrollo (nodemon)
cd backend && npm start          # Producción

# Frontend
cd frontend && npm run dev         # Servidor Vite
cd frontend && npm run build     # Build de producción
cd frontend && npm run preview   # Previsualizar build

# Base de datos (recargar desde cero)
dropdb -U postgres scheduling_unt
createdb -U postgres scheduling_unt
psql -U postgres -d scheduling_unt -f database/migrations/001_init.sql
psql -U postgres -d scheduling_unt -f database/migrations/002_alter_cursos.sql
psql -U postgres -d scheduling_unt -f database/migrations/003_labs_genericos.sql
psql -U postgres -d scheduling_unt -f database/seeds/001_test_data.sql
psql -U postgres -d scheduling_unt -f database/seeds/002_demo_config.sql
psql -U postgres -d scheduling_unt -f database/seeds/003_cursos_documento.sql
```

---

## Licencia

MIT - Proyecto académico de la Universidad Nacional de Trujillo.
