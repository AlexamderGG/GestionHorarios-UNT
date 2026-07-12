# Manual de Instalación — Scheduling UNT

## Sistema de Gestión Automática de Horarios Académicos

**Universidad Nacional de Trujillo — Escuela de Ingeniería de Sistemas**

> Versión: 1.0  
> Fecha: Julio 2026

---

## Tabla de Contenidos

1. [Descripción General](#1-descripción-general)
2. [Requisitos Previos](#2-requisitos-previos)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Estructura del Proyecto](#4-estructura-del-proyecto)
5. [Instalación Local (Desarrollo)](#5-instalación-local-desarrollo)
   - 5.1 [Clonar el Repositorio](#51-clonar-el-repositorio)
   - 5.2 [Instalar PostgreSQL](#52-instalar-postgresql)
   - 5.3 [Crear la Base de Datos](#53-crear-la-base-de-datos)
   - 5.4 [Ejecutar Migraciones](#54-ejecutar-migraciones)
   - 5.5 [Cargar Datos de Prueba (Seeds)](#55-cargar-datos-de-prueba-seeds)
   - 5.6 [Configurar el Backend](#56-configurar-el-backend)
   - 5.7 [Instalar y Ejecutar el Backend](#57-instalar-y-ejecutar-el-backend)
   - 5.8 [Configurar el Frontend](#58-configurar-el-frontend)
   - 5.9 [Instalar y Ejecutar el Frontend](#59-instalar-y-ejecutar-el-frontend)
   - 5.10 [Ejecutar Frontend y Backend Simultáneamente](#510-ejecutar-frontend-y-backend-simultáneamente)
   - 5.11 [Verificar la Instalación](#511-verificar-la-instalación)
6. [Variables de Entorno](#6-variables-de-entorno)
   - 6.1 [Backend (.env)](#61-backend-env)
   - 6.2 [Frontend (.env)](#62-frontend-env)
7. [Despliegue en Producción](#7-despliegue-en-producción)
   - 7.1 [Arquitectura de Producción](#71-arquitectura-de-producción)
   - 7.2 [Despliegue en Vercel (Frontend)](#72-despliegue-en-vercel-frontend)
   - 7.3 [Despliegue en Railway (Backend)](#73-despliegue-en-railway-backend)
   - 7.4 [Base de Datos en Supabase](#74-base-de-datos-en-supabase)
8. [Reiniciar la Base de Datos desde Cero](#8-reiniciar-la-base-de-datos-desde-cero)
9. [Comandos Útiles de Referencia](#9-comandos-útiles-de-referencia)
10. [Solución de Problemas](#10-solución-de-problemas)

---

## 1. Descripción General

**Scheduling UNT** es una aplicación web full-stack para la gestión automática de horarios académicos de la Escuela de Ingeniería de Sistemas de la Universidad Nacional de Trujillo. El sistema consta de dos componentes principales:

- **Backend:** API REST construida con Node.js y Express, conectada a una base de datos PostgreSQL mediante queries SQL directas (sin ORM).
- **Frontend:** Aplicación SPA construida con React, Vite y Tailwind CSS, comunicada con el backend mediante Axios.

---

## 2. Requisitos Previos

Antes de instalar el proyecto, asegúrese de tener instalados los siguientes programas:

| Programa       | Versión Mínima    | Propósito                                   | Descarga                                               |
| -------------- | ----------------- | ------------------------------------------- | ------------------------------------------------------ |
| **Node.js**    | >= 18.x           | Runtime del backend y frontend              | [nodejs.org](https://nodejs.org/)                      |
| **npm**        | >= 9.x            | Gestor de paquetes (se instala con Node.js) | Incluido con Node.js                                   |
| **PostgreSQL** | >= 14.x           | Sistema de base de datos relacional         | [postgresql.org](https://www.postgresql.org/download/) |
| **Git**        | Cualquier versión | Control de versiones                        | [git-scm.com](https://git-scm.com/)                    |

### Verificar instalación

```bash
# Verificar Node.js
node --version    # Debe mostrar v18.x o superior

# Verificar npm
npm --version     # Debe mostrar 9.x o superior

# Verificar PostgreSQL
psql --version    # Debe mostrar 14.x o superior

# Verificar Git
git --version
```

---

## 3. Stack Tecnológico

| Capa              | Tecnología           | Versión          |
| ----------------- | -------------------- | ---------------- |
| **Runtime**       | Node.js              | >= 18.x          |
| **Backend**       | Express              | ^4.19.2          |
| **Base de Datos** | PostgreSQL           | >= 14.x          |
| **Cliente BD**    | pg (node-postgres)   | ^8.12.0          |
| **Autenticación** | JWT (jsonwebtoken)   | ^9.0.3           |
| **Frontend**      | React                | ^18.3.1          |
| **Bundler**       | Vite                 | ^5.3.4           |
| **Enrutamiento**  | React Router DOM     | ^6.25.1          |
| **Estilos**       | Tailwind CSS         | ^3.4.7           |
| **Gráficos**      | Recharts             | ^2.12.7          |
| **PDF**           | jsPDF + html2canvas  | ^2.5.2 / ^1.4.1  |
| **Excel**         | xlsx + xlsx-js-style | ^0.18.5 / ^1.2.0 |
| **HTTP Client**   | Axios                | ^1.7.2           |
| **Íconos**        | Lucide React         | ^1.20.0          |

---

## 4. Estructura del Proyecto

```
GestionHorarios-UNT/
├── backend/                          # API REST (Node.js + Express)
│   ├── src/
│   │   ├── config/                   # Configuración (db.js - pool PostgreSQL)
│   │   ├── controllers/              # 16 controladores de lógica de negocio
│   │   ├── middleware/                # Middleware de autenticación JWT
│   │   ├── models/                   # 10 modelos con queries SQL directas
│   │   ├── routes/                   # 18 archivos de rutas API
│   │   ├── services/                 # Servicios (scheduler, demo)
│   │   └── utils/                    # Helpers (responseHelper)
│   ├── tests/                        # Scripts de prueba manual
│   ├── .env                          # Variables de entorno (NO subir a git)
│   ├── .env.example                  # Plantilla de variables
│   ├── package.json
│   └── server.js                     # Punto de entrada del servidor
├── frontend/                         # Aplicación SPA (React + Vite)
│   ├── src/
│   │   ├── components/               # Componentes reutilizables
│   │   ├── context/                  # AuthContext, ThemeContext
│   │   ├── hooks/                    # Hooks personalizados
│   │   ├── pages/                    # Vistas principales
│   │   │   ├── admin/                # 9 páginas de administración
│   │   │   └── docente/              # 7 páginas del portal docente
│   │   ├── services/                 # Cliente Axios (api.js)
│   │   ├── utils/                    # Utilidades PDF y Excel
│   │   ├── App.jsx                   # Router principal
│   │   ├── main.jsx                  # Punto de entrada React
│   │   └── index.css                 # Estilos base + Tailwind
│   ├── .env                          # Variables de entorno frontend
│   ├── package.json
│   ├── vite.config.js                # Configuración Vite + proxy
│   ├── tailwind.config.js            # Tema personalizado
│   ├── postcss.config.js             # PostCSS
│   └── vercel.json                   # Reglas de reescritura SPA
├── database/
│   ├── migrations/                   # 5 scripts de migración SQL
│   │   ├── 001_init.sql             # Creación de tablas iniciales
│   │   ├── 002_alter_cursos.sql     # Reestructura ciclos y semestres
│   │   ├── 003_labs_genericos.sql   # Laboratorios genéricos
│   │   ├── 004_carga_no_lectiva.sql # Carga no lectiva
│   │   └── 005_horario_no_lectivos.sql # Horarios no lectivos
│   ├── seeds/                        # 3 scripts de datos iniciales
│   │   ├── 001_test_data.sql        # 20 docentes, 6 aulas, 5 labs
│   │   ├── 002_demo_config.sql      # Configuración de modo demo
│   │   └── 003_cursos_documento.sql # 77 cursos reales EIS
│   └── erd.mmd                       # Diagrama ER en Mermaid
├── package.json                      # Paquete raíz (concurrently)
├── README.md                         # Documentación principal
├── API_CONTRACTS.md                  # Contratos de API
├── MODULO1.md                        # Docs Módulo 1
├── MODULO2.md                        # Docs Módulo 2
├── MODULO4.md                        # Docs Módulo 4
└── DEPLOY.md                         # Guía de despliegue
```

---

## 5. Instalación Local (Desarrollo)

### 5.1 Clonar el Repositorio

```bash
git clone https://github.com/AlexamderGG/GestionHorarios-UNT.git
cd GestionHorarios-UNT
```

---

### 5.2 Instalar PostgreSQL

#### En Windows

1. Descargue el instalador desde [postgresql.org/download/windows](https://www.postgresql.org/download/windows/).
2. Ejecute el instalador y siga el asistente.
3. Defina una contraseña para el usuario `postgres` (recuerde esta contraseña).
4. El puerto por defecto es `5432`.
5. Complete la instalación.

#### En Linux (Ubuntu/Debian)

```bash
# Actualizar repositorios
sudo apt update

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Iniciar el servicio
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Establecer contraseña para el usuario postgres
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'tu_password';"
```

#### En macOS (usando Homebrew)

```bash
# Instalar PostgreSQL
brew install postgresql@16

# Iniciar el servicio
brew services start postgresql@16
```

---

### 5.3 Crear la Base de Datos

```bash
# Conectar a PostgreSQL y crear la base de datos
createdb -U postgres scheduling_unt

# Si se solicita contraseña, ingrésela (la que definió al instalar PostgreSQL)
```

Alternativamente, puede usar el cliente `psql`:

```bash
psql -U postgres
# Dentro del prompt de psql:
CREATE DATABASE scheduling_unt;
\q
```

---

### 5.4 Ejecutar Migraciones

Ejecutar los scripts de migración **en orden secuencial** desde la raíz del proyecto:

```bash
# Migración 1: Creación de tablas iniciales
psql -U postgres -d scheduling_unt -f database/migrations/001_init.sql

# Migración 2: Reestructura de ciclos y semestres
psql -U postgres -d scheduling_unt -f database/migrations/002_alter_cursos.sql

# Migración 3: Laboratorios genéricos + horas en cursos
psql -U postgres -d scheduling_unt -f database/migrations/003_labs_genericos.sql

# Migración 4: Carga no lectiva
psql -U postgres -d scheduling_unt -f database/migrations/004_carga_no_lectiva.sql

# Migración 5: Horarios no lectivos
psql -U postgres -d scheduling_unt -f database/migrations/005_horario_no_lectivos.sql
```

#### Tablas creadas por las migraciones

| Tabla                      | Descripción                                                    |
| -------------------------- | -------------------------------------------------------------- |
| `docentes`                 | Registro de docentes con categoría, nombramiento, especialidad |
| `cursos`                   | Cursos del plan de estudios con horas y ciclo                  |
| `aulas`                    | Aulas disponibles para clases de teoría                        |
| `laboratorios`             | Laboratorios de uso general                                    |
| `configuracion`            | Parámetros globales del sistema (clave-valor)                  |
| `asignacion_docente_curso` | Asignaciones de cursos a docentes                              |
| `horarios`                 | Horarios generados (automática o manualmente)                  |
| `restricciones_horarias`   | Restricciones horarias de docentes                             |

---

### 5.5 Cargar Datos de Prueba (Seeds)

```bash
# Seed 1: 20 docentes, 6 aulas, 5 laboratorios
psql -U postgres -d scheduling_unt -f database/seeds/001_test_data.sql

# Seed 2: Configuración de modo demo
psql -U postgres -d scheduling_unt -f database/seeds/002_demo_config.sql

# Seed 3: 77 cursos reales de la EIS (10 ciclos)
psql -U postgres -d scheduling_unt -f database/seeds/003_cursos_documento.sql
```

#### Contenido incluido en los seeds

**Seed 001 (Docentes, Aulas, Labs):**

- 20 docentes: 8 nombrados de Ingeniería de Sistemas + 12 contratados de diversas escuelas
- 6 aulas con diferentes capacidades
- 5 laboratorios genéricos

**Seed 002 (Configuración Demo):**

- `semestre_activo`: "2026-1"
- `dias_habiles`: Lunes a Viernes
- `hora_inicio`: "07:00"
- `hora_fin`: "22:00"
- `duracion_bloque`: "120" minutos
- `bloques_por_dia`: "6"

**Seed 003 (Cursos):**

- 77 cursos reales de la Escuela de Ingeniería de Sistemas
- Distribuidos en 10 ciclos
- Con especialidades, horas de aula y horas de laboratorio

---

### 5.6 Configurar el Backend

```bash
cd backend

# Copiar la plantilla de variables de entorno
cp .env.example .env
```

Edite el archivo `backend/.env` con la siguiente configuración:

```env
# Base de datos
DATABASE_URL=postgres://postgres:tu_password@localhost:5432/scheduling_unt?sslmode=disable

# Servidor
PORT=3001
NODE_ENV=development

# Autenticación JWT
JWT_SECRET=scheduling-unt-secret-2026
JWT_EXPIRES_IN=8h

# Credenciales de administrador
ADMIN_USER=admin
ADMIN_PASS=admin123

# Contraseña para docentes de prueba
DOCENTE_PASSWORD=docente123
```

> **Importante:** Reemplace `tu_password` con la contraseña real del usuario `postgres` de su base de datos.

---

### 5.7 Instalar y Ejecutar el Backend

```bash
cd backend

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo (con nodemon - auto-reinicia al cambiar código)
npm run dev

# O ejecutar en modo producción
npm start
```

El backend estará disponible en: **http://localhost:3001**

#### Verificar que el backend funciona

```bash
# Probar el endpoint de configuración
curl http://localhost:3001/api/configuracion

# Probar el endpoint de estadísticas
curl http://localhost:3001/api/estadisticas

# Probar login de administrador
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario": "admin", "contrasena": "admin123"}'
```

---

### 5.8 Configurar el Frontend

```bash
cd frontend

# Las dependencias del frontend se instalan desde la raíz (ver paso 5.9)
```

El archivo `frontend/.env` ya viene configurado con:

```env
VITE_API_URL=http://localhost:3001/api
```

En modo desarrollo, Vite configura un proxy que redirige automáticamente las peticiones `/api` al backend en el puerto 3001, por lo que no es necesario configurar CORS manualmente.

---

### 5.9 Instalar y Ejecutar el Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
npm run dev
```

El frontend estará disponible en: **http://localhost:5173**

#### Comandos adicionales del frontend

```bash
# Build de producción (genera la carpeta dist/)
npm run build

# Previsualizar el build de producción
npm run preview
```

---

### 5.10 Ejecutar Frontend y Backend Simultáneamente

Desde la **raíz del proyecto** (no desde backend/ ni frontend/), existe un script configurado con `concurrently`:

```bash
# Instalar dependencias de la raíz
npm install

# Ejecutar backend y frontend simultáneamente
npm run dev
```

Esto ejecutará:

- Backend en http://localhost:3001 (con nodemon)
- Frontend en http://localhost:5173 (con Vite)

---

### 5.11 Verificar la Instalación

1. Abra su navegador en **http://localhost:5173**
2. Debería verse la pantalla de login de "Scheduling UNT"
3. Ingrese las credenciales de administrador:
   - **Usuario:** `admin`
   - **Contraseña:** `admin123`
4. Será redirigido al Dashboard principal
5. Verifique que los gráficos se cargan (si hay datos en la BD)
6. Navegue por las diferentes secciones del panel

---

## 6. Variables de Entorno

### 6.1 Backend (.env)

| Variable           | Descripción                               | Valor por Defecto                                                        | Obligatoria                         |
| ------------------ | ----------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------- |
| `DATABASE_URL`     | URL de conexión a PostgreSQL              | `postgres://postgres:pass@localhost:5432/scheduling_unt?sslmode=disable` | Sí                                  |
| `PORT`             | Puerto del servidor Express               | `3001`                                                                   | No (Railway asigna automáticamente) |
| `NODE_ENV`         | Modo de ejecución                         | `development`                                                            | No                                  |
| `JWT_SECRET`       | Secreto para firmar tokens JWT            | `scheduling-unt-secret-2026`                                             | Sí                                  |
| `JWT_EXPIRES_IN`   | Tiempo de expiración del token            | `8h`                                                                     | No                                  |
| `ADMIN_USER`       | Usuario del administrador                 | `admin`                                                                  | Sí                                  |
| `ADMIN_PASS`       | Contraseña del administrador              | `admin123`                                                               | Sí                                  |
| `DOCENTE_PASSWORD` | Contraseña genérica para docentes         | `docente123`                                                             | Sí                                  |
| `EMAIL_USER`       | Correo para envío de notificaciones       | _(opcional)_                                                             | No                                  |
| `EMAIL_PASS`       | Contraseña de app del correo              | _(opcional)_                                                             | No                                  |
| `BREVO_API_KEY`    | API Key de Brevo (emails transaccionales) | _(opcional)_                                                             | No                                  |
| `OPENAI_API_KEY`   | API Key de OpenAI (chatbot)               | _(opcional)_                                                             | No                                  |

### 6.2 Frontend (.env)

| Variable       | Descripción                | Valor por Defecto           |
| -------------- | -------------------------- | --------------------------- |
| `VITE_API_URL` | URL base de la API backend | `http://localhost:3001/api` |

---

## 7. Despliegue en Producción

### 7.1 Arquitectura de Producción

```
Navegador del usuario
  │
  ├─ https://gestion-horarios-sistemas-unt.vercel.app/  (Frontend - Vercel)
  │    └─ VITE_API_URL → Backend API
  │
  └─ Backend API (Railway o similar)
       └─ DATABASE_URL → Supabase PostgreSQL
```

### 7.2 Despliegue en Vercel (Frontend)

El frontend está desplegado en Vercel con la configuración del archivo `vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Esta configuración permite que React Router maneje las rutas del lado del cliente correctamente.

**URL de producción:** [https://gestion-horarios-sistemas-unt.vercel.app/](https://gestion-horarios-sistemas-unt.vercel.app/)

### 7.3 Despliegue en Railway (Backend)

Para desplegar el backend en Railway:

```bash
# Instalar CLI de Railway
npm i -g @railway/cli

# Login (abre el navegador)
railway login

# Crear proyecto
railway init

# Crear servicio backend
railway add --service backend

# Configurar variables de entorno
railway variable set \
  'DB_HOST=xxx.supabase.co' \
  'DB_PORT=6543' \
  'DB_USER=postgres' \
  'DB_PASS=tu-password' \
  'DB_NAME=postgres' \
  'JWT_SECRET=un-secreto-largo' \
  'JWT_EXPIRES_IN=8h' \
  'ADMIN_USER=admin' \
  'ADMIN_PASS=admin123' \
  'DOCENTE_PASSWORD=docente123' \
  'NODE_ENV=production' \
  --service backend

# Desplegar
railway up ./backend --service backend --path-as-root --detach

# Obtener dominio público
railway domain --service backend
```

> **Nota:** Railway asigna el puerto `PORT` automáticamente. No es necesario configurarlo.

### 7.4 Base de Datos en Supabase

El sistema utiliza Supabase como proveedor de base de datos PostgreSQL en producción.

**Configuración de conexión (Supabase):**

- **Host:** `xxx.supabase.co`
- **Port:** `6543` (pooling en modo transaccional)
- **Database:** `postgres`
- **SSL:** Habilitado por defecto

---

## 8. Reiniciar la Base de Datos desde Cero

Si necesita reiniciar completamente la base de datos:

```bash
# Eliminar la base de datos existente
dropdb -U postgres scheduling_unt

# Crear una nueva base de datos vacía
createdb -U postgres scheduling_unt

# Ejecutar todas las migraciones en orden
psql -U postgres -d scheduling_unt -f database/migrations/001_init.sql
psql -U postgres -d scheduling_unt -f database/migrations/002_alter_cursos.sql
psql -U postgres -d scheduling_unt -f database/migrations/003_labs_genericos.sql
psql -U postgres -d scheduling_unt -f database/migrations/004_carga_no_lectiva.sql
psql -U postgres -d scheduling_unt -f database/migrations/005_horario_no_lectivos.sql

# Cargar todos los datos de prueba
psql -U postgres -d scheduling_unt -f database/seeds/001_test_data.sql
psql -U postgres -d scheduling_unt -f database/seeds/002_demo_config.sql
psql -U postgres -d scheduling_unt -f database/seeds/003_cursos_documento.sql
```

---

## 9. Comandos Útiles de Referencia

### Backend

```bash
# Modo desarrollo (auto-reinicia con nodemon)
cd backend && npm run dev

# Modo producción
cd backend && npm start

# Verificar sintaxis de todos los archivos JS
find backend/src backend/tests -name "*.js" -print0 | xargs -0 -n1 node --check

# Verificar que la app Express carga correctamente
cd backend && node -e "require('./src/app'); console.log('app ok')"

# Ejecutar pruebas del módulo 2
node backend/tests/test_modulo2.js
```

### Frontend

```bash
# Modo desarrollo (servidor Vite)
cd frontend && npm run dev

# Build de producción
cd frontend && npm run build

# Previsualizar build
cd frontend && npm run preview
```

### Base de Datos

```bash
# Conectar a la base de datos
psql -U postgres -d scheduling_unt

# Ver tablas
\dt

# Ver estructura de una tabla
\d docentes

# Contar registros de una tabla
SELECT COUNT(*) FROM docentes;

# Salir de psql
\q
```

---

## 10. Solución de Problemas

### Error: "Cannot find module" al ejecutar el backend

**Causa:** Las dependencias no están instaladas.

**Solución:**

```bash
cd backend
npm install
```

### Error: "ECONNREFUSED" al conectar a la base de datos

**Causa:** PostgreSQL no está ejecutándose o los datos de conexión son incorrectos.

**Solución:**

```bash
# Verificar que PostgreSQL está corriendo
sudo systemctl status postgresql    # Linux
brew services list                  # macOS

# Iniciar el servicio si está detenido
sudo systemctl start postgresql     # Linux
brew services start postgresql@16   # macOS
```

Verifique que los datos en `backend/.env` coincidan con su configuración de PostgreSQL.

### Error: "password authentication failed"

**Causa:** La contraseña de PostgreSQL en `backend/.env` no coincide.

**Solución:**

```bash
# Cambiar la contraseña del usuario postgres
psql -U postgres
ALTER USER postgres WITH PASSWORD 'nueva_contraseña';
\q
```

Actualice `DATABASE_URL` en `backend/.env` con la nueva contraseña.

### Error: "listen EADDRINUSE: address already in use :::3001"

**Causa:** Ya hay un proceso usando el puerto 3001.

**Solución:**

```bash
# Encontrar el proceso que usa el puerto
lsof -i :3001

# Matar el proceso (reemplazar PID)
kill -9 <PID>
```

### Error: "Module not found" al ejecutar el frontend

**Causa:** Las dependencias del frontend no están instaladas.

**Solución:**

```bash
cd frontend
npm install
```

### El frontend no se conecta al backend

**Causa:** El proxy de Vite no está configurado o el backend no está ejecutándose.

**Verificación:**

1. Asegúrese de que el backend esté corriendo en http://localhost:3001
2. Verifique que `frontend/vite.config.js` tenga la configuración de proxy
3. Verifique que `frontend/.env` tenga `VITE_API_URL=http://localhost:3001/api`

### Error de CORS en producción

**Causa:** Las variables de entorno del frontend apuntan a la URL incorrecta del backend.

**Solución:** Verifique que `VITE_API_URL` apunte al dominio correcto del backend en producción.

### Los reportes PDF están vacíos

**Causa:** No se han generado horarios para el semestre actual.

**Solución:** Primero genere horarios desde **Admin > Horarios > Generar Horarios**, luego intente generar los reportes nuevamente.

---

_Sistema desarrollado por la Escuela de Ingeniería de Sistemas — Universidad Nacional de Trujillo_
