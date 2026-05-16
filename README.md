# Scheduling UNT - Sistema de Gestión Automática de Horarios

> **Proyecto:** Escuela de Ingeniería de Sistemas - Universidad Nacional de Trujillo  
> **Stack:** Node.js + Express (Backend) | React + Vite + Tailwind (Frontend) | PostgreSQL (BD)

---

## Descripción General

Aplicación web para la gestión automática de horarios académicos. El sistema asigna horarios respetando la jerarquía docente (nombrados vs contratados, categoría y antigüedad), evita cruces de horarios y doble reserva de ambientes, y proporciona dashboard con gráficos y reportes en PDF.

---

## Estructura del Proyecto

```
scheduling-unt/
├── backend/
│   ├── src/
│   │   ├── config/        # Configuración (DB, etc.)
│   │   ├── controllers/   # Lógica de negocio (a implementar por módulos)
│   │   ├── models/        # Modelos / queries SQL
│   │   ├── routes/        # Definición de endpoints API
│   │   ├── services/      # Servicios auxiliares
│   │   ├── utils/         # Helpers (responseHelper, etc.)
│   │   └── app.js         # Configuración de Express
│   ├── .env               # Variables de entorno (NO subir a git)
│   ├── .env.example       # Plantilla de variables
│   ├── package.json
│   └── server.js          # Punto de entrada
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/    # Componentes reutilizables (Layout, Navbar)
│   │   ├── pages/         # Vistas principales (Home, Dashboard, Horarios, Reportes, Configuracion)
│   │   ├── hooks/         # Hooks personalizados (useApi)
│   │   ├── services/      # Cliente Axios (api.js)
│   │   ├── utils/         # Helpers frontend
│   │   ├── App.jsx        # Router principal
│   │   ├── main.jsx       # Punto de entrada React
│   │   └── index.css      # Estilos base + Tailwind
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js     # Proxy a backend en desarrollo
│   ├── tailwind.config.js # Configuración de Tailwind
│   └── postcss.config.js
├── database/
│   ├── migrations/
│   │   └── 001_init.sql   # Creación de tablas
│   └── seeds/
│       └── 001_test_data.sql  # Datos de prueba
├── API_CONTRACTS.md       # Contratos de API para desarrollo paralelo
└── README.md              # Este archivo
```

---

## Requisitos Previos

- **Node.js** >= 18.x
- **PostgreSQL** >= 14.x
- **npm** o **yarn**

---

## Instrucciones de Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/scheduling-unt.git
cd scheduling-unt
```

### 2. Configurar Base de Datos (PostgreSQL)

Crear la base de datos:

```bash
psql -U postgres -c "CREATE DATABASE scheduling_unt;"
```

> Nota: Puedes usar pgAdmin, DBeaver o la consola `psql`.

Ejecutar migraciones:

```bash
psql -U postgres -d scheduling_unt -f database/migrations/001_init.sql
```

Cargar datos de prueba:

```bash
psql -U postgres -d scheduling_unt -f database/seeds/001_test_data.sql
```

### 3. Configurar Backend

```bash
cd backend
cp .env.example .env   # Editar .env con tus credenciales de PostgreSQL
npm install
npm run dev             # Inicia en modo desarrollo (nodemon)
```

El backend estará disponible en: `http://localhost:3001`

**Variables de entorno del backend (.env):**

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=tu_password
DB_NAME=scheduling_unt
PORT=3001
NODE_ENV=development
```

### 4. Configurar Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

> El proxy de Vite redirige automáticamente las peticiones `/api` al backend (`http://localhost:3001`).

### 5. Verificar funcionamiento

- Abre el navegador en `http://localhost:5173`
- Deberías ver la página de inicio de Scheduling UNT.
- Puedes probar la salud del backend en `http://localhost:3001/health`

---

## Convenciones y Estilo de Código

- **Backend:** ESLint + Prettier recomendados (aún no configurados, cada módulo puede agregarlos).
- **Frontend:** Tailwind CSS para estilos; componentes funcionales con hooks.
- **Base de datos:** Nombres de tablas en plural, snake_case. IDs autoincrementales con `SERIAL`.
- **Git:** Usar ramas por módulo: `modulo1/gestion-datos`, `modulo2/algoritmo`, etc.

---

## División de Módulos (Trabajo Paralelo)

Este proyecto está diseñado para ser desarrollado en paralelo por 4 programadores. Consulta `API_CONTRACTS.md` para los contratos de API.

### Módulo 1 – Gestión de datos maestros y configuración (Backend)

**Responsable:** _Eduardo_  
**Rama sugerida:** `modulo1/gestion-datos`

**Tareas:**

- Implementar CRUD completo en backend para: `docentes`, `cursos`, `aulas`, `laboratorios`.
- Implementar endpoints de `asignaciones` (asignar curso a docente con tipo y ambiente preferido).
- Implementar endpoint de `configuracion` (días hábiles, horas, duración de bloques).
- Validaciones de negocio (ej. no duplicar asignaciones, validar capacidad de aulas).
- Crear seeds adicionales si es necesario.
- **Archivos principales a modificar:** `backend/src/routes/*.routes.js`, `backend/src/controllers/`, `backend/src/models/`

---

### Módulo 2 – Algoritmo de asignación automática de horarios (Backend)

**Responsable:** _Jersson_  
**Rama sugerida:** `modulo2/algoritmo`

**Tareas:**

- Implementar algoritmo de scheduling que respete jerarquía docente y restricciones de disponibilidad.
- Endpoint `POST /api/horarios/generar`.
- Endpoint `GET /api/horarios` con filtros.
- Endpoint `PUT /api/horarios/:id` para edición manual.
- Alimentar el endpoint `/api/estadisticas` con datos reales.
- **Archivos principales a modificar:** `backend/src/routes/horarios.routes.js`, `backend/src/controllers/horarios.controller.js`, `backend/src/services/scheduler.service.js`

---

### Módulo 3 – Frontend: Dashboard, visualización y gráficos

**Responsable:** _Gian Franco_  
**Rama sugerida:** `modulo3/dashboard-frontend`

**Tareas:**

- Enriquecer `Dashboard.jsx` con tarjetas de resumen, estadísticas y gráficos (Recharts).
- Implementar tabla grid de horarios en `Horarios.jsx` (días x bloques horarios).
- Botón "Generar Horarios" conectado a `POST /api/horarios/generar`.
- Selectores de filtro (docente, aula, laboratorio).
- Consumir endpoints de configuración y datos maestros.
- **Archivos principales a modificar:** `frontend/src/pages/Dashboard.jsx`, `frontend/src/pages/Horarios.jsx`, componentes de gráficos en `frontend/src/components/`

---

### Módulo 4 – Frontend: Reportes PDF y horario individual por docente

**Responsable:** _Alexander_  
**Rama sugerida:** `modulo4/reportes-frontend`

**Tareas:**

- Implementar generación de PDFs en `Reportes.jsx` usando `jsPDF` + `html2canvas`.
- Reporte operacional: detalle por aula/lab, día y hora.
- Reporte de gestión: resumen por docente (categoría, antigüedad, carga horaria).
- Funcionalidad de seleccionar docente y ver/exportar su horario individual.
- Opcional: Interfaz simple de edición manual de horarios (conectar con `PUT /api/horarios/:id`).
- **Archivos principales a modificar:** `frontend/src/pages/Reportes.jsx`, `frontend/src/components/reportes/`, utilidades PDF en `frontend/src/utils/pdf.js`

---

## Supuestos y Decisiones de Diseño

- **Bloques de horario:** 2 horas (120 minutos) por bloque, de 7:00 a 22:00. Esto genera hasta 6 bloques por día (considerando una hora de almuerzo entre 13:00-14:00).
- **Días hábiles:** Lunes a Viernes por defecto. Configurable en tabla `configuracion`.
- **Jerarquía docente:** La prioridad está definida por `tipo_nombramiento` (Nombrado > Contratado) y luego por `categoria` (Principal > Asociado > Auxiliar > Jefe de práctica) y finalmente `antiguedad_anios` DESC.
- **Asignación de ambientes:** Teoría usa `aulas`; Laboratorio usa `laboratorios`. La tabla `horarios` tiene ambos campos (aula_id y laboratorio_id) pero solo uno debe estar poblado según el tipo de asignación.
- **Reportes PDF:** Se generan desde el frontend capturando DOM con `html2canvas` y exportando a PDF con `jsPDF` (para no agregar peso al backend). Si se requiere generación server-side, se puede discutir como mejora futura.

---

## Comandos Útiles

```bash
# Backend
npm run dev          # Desarrollo con nodemon
npm start            # Producción

# Frontend
npm run dev          # Servidor Vite
npm run build        # Build de producción
npm run preview      # Previsualizar build

# Base de datos
psql -U postgres -d scheduling_unt -f database/migrations/001_init.sql
psql -U postgres -d scheduling_unt -f database/seeds/001_test_data.sql
```

---

## Licencia

MIT - Proyecto académico de la Universidad Nacional de Trujillo.
