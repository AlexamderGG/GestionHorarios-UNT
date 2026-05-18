# Specs Iteración 1 — Sistema de Selección de Horarios Docentes

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express 4.19 + PostgreSQL raw SQL (`pg`) |
| Frontend | React 18.3 + Vite 5.3 + React Router 6.25 + Tailwind CSS 3.4 |
| Auth | JWT (`jsonwebtoken`) — payload `{ id, role }` |
| Respuestas | `{ success, message, data, errors? }` vía `responseHelper.js` |

---

## Cambios Backend

### Dependencia nueva
- `jsonwebtoken` en `backend/package.json`

### Variables de entorno nuevas (`backend/.env.example`)
```
JWT_SECRET=scheduling-unt-secret-2024
JWT_EXPIRES_IN=8h
ADMIN_USER=admin
ADMIN_PASS=admin123
DOCENTE_PASSWORD=docente123
```

### Archivos nuevos

| Archivo | Propósito |
|---------|-----------|
| `src/middleware/auth.js` | Middleware `authenticate` (JWT verify) + `requireRole(...roles)` |
| `src/models/auth.model.js` | `findDocenteByEmail(email)` — busca docente activo por email |
| `src/controllers/auth.controller.js` | `login` (docente por email+pass genérica / admin por usuario+pass hardcodeado), `me` |
| `src/routes/auth.routes.js` | `POST /api/auth/login`, `GET /api/auth/me` |
| `src/models/restriccion.model.js` | CRUD restricciones: `getAll`, `getByDocente`, `create`, `delete`, `existeSolapamiento` |
| `src/controllers/restricciones.controller.js` | `getAll` (docente ve las suyas, admin todas), `create`, `remove` |
| `src/routes/restricciones.routes.js` | `GET /api/restricciones`, `POST /api/restricciones`, `DELETE /api/restricciones/:id` |
| `src/controllers/docente-auth.controller.js` | `getMisCursos`, `getMiHorario`, `seleccionarHorario`, `eliminarMiHorario`, `getAmbientesDisponibles` |
| `src/routes/docente-auth.routes.js` | Rutas bajo `/api/docente/*` protegidas con `requireRole('docente')` |
| `src/services/demo.service.js` | `getEstadoDemo`, `avanzarTurno`, `getDocenteTurnoActual`, `getTurnosAsignados` |
| `src/controllers/demo.controller.js` | `getEstado`, `avanzarTurno`, `reset` |
| `src/routes/demo.routes.js` | `GET /api/demo/estado`, `POST /api/demo/avanzar-turno`, `POST /api/demo/reset` |
| `database/seeds/002_demo_config.sql` | INSERT de claves `demo_mode`, `demo_turno_actual`, `demo_step_minutes`, `seleccion_abierta` |

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/routes/index.js` | +4 requires y +4 `router.use` (auth, restricciones, docente, demo) |
| `src/controllers/horarios.controller.js` | +`remove()`, +`getEstadoSeleccion()` |
| `src/routes/horarios.routes.js` | +`DELETE /:id`, +`GET /estado-seleccion`, auth middleware en generar/update/delete |
| `src/models/horario.model.js` | +`delete(id)`, +`getAsignacionesPendientes(semestre)` |
| `src/controllers/configuracion.controller.js` | +4 claves en `CLAVES_VALIDAS`: `demo_mode`, `demo_turno_actual`, `demo_step_minutes`, `seleccion_abierta` |
| `src/models/configuracion.model.js` | +parseo boolean/number en `getConfiguracionCompleta()` |
| `src/routes/configuracion.routes.js` | +auth middleware |
| `backend/package.json` | +`jsonwebtoken` |

---

## Cambios Frontend

### Archivos nuevos

| Archivo | Propósito |
|---------|-----------|
| `src/context/AuthContext.jsx` | Provider con `loginDocente`, `loginAdmin`, `logout`, `useAuth` |
| `src/components/ProtectedRoute.jsx` | Wrapper que verifica auth + role |
| `src/pages/Login.jsx` | Login dual (docente email / admin usuario) |
| `src/pages/docente/MisCursos.jsx` | HU-02: cursos asignados con estado de horario |
| `src/pages/docente/MiHorario.jsx` | HU-03: grid semanal + indicador turno demo (HU-22) |
| `src/pages/docente/SeleccionarHorario.jsx` | HU-04: selección con validación de conflictos |
| `src/pages/docente/MisRestricciones.jsx` | HU-06/07: CRUD restricciones |
| `src/pages/admin/AdminHorarios.jsx` | HU-11/12/14: gestión admin con tabs |
| `src/pages/admin/EstadoDocentes.jsx` | HU-13: progreso de selección |
| `src/pages/admin/DemoPanel.jsx` | HU-09/10/20/21: control de demo |
| `src/components/TablaHorarios.jsx` | Grid semanal reutilizable |
| `src/components/ModalEditarHorario.jsx` | Modal para editar horario (admin) |
| `src/components/FormularioHorario.jsx` | Form selección horario (docente) |
| `src/utils/demo.js` | Helpers de demo (localStorage) |

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/App.jsx` | Estructura de rutas completa con ProtectedRoute |
| `src/main.jsx` | Envolver en AuthProvider |
| `src/components/Navbar.jsx` | Menú dinámico por rol |
| `src/services/api.js` | Interceptor token + redirect 401 |
| `src/pages/Configuracion.jsx` | Sección demo |

---

## Mapa HU → Implementación

| HU | Descripción | Backend | Frontend |
|----|-------------|---------|----------|
| HU-01 | Login docente con email | auth.controller login | Login.jsx |
| HU-02 | Ver cursos asignados | docente-auth getMisCursos | MisCursos.jsx |
| HU-03 | Ver horario semanal | GET /api/horarios existente | MiHorario.jsx |
| HU-04 | Seleccionar horario | docente-auth seleccionarHorario | SeleccionarHorario.jsx |
| HU-05 | Eliminar horario propio | docente-auth eliminarMiHorario | Botón en MiHorario |
| HU-06 | Ver restricciones | restricciones getAll | MisRestricciones.jsx |
| HU-07 | Agregar/eliminar restricciones | restricciones create/remove | MisRestricciones.jsx |
| HU-08 | Login admin | auth.controller login | Login.jsx |
| HU-09 | Activar/desactivar demo | configuracion whitelist | DemoPanel.jsx |
| HU-10 | Simular avance tiempo | demo avanzarTurno | DemoPanel.jsx |
| HU-11 | Asignar horario manual | PUT /api/horarios existente | ModalEditarHorario.jsx |
| HU-12 | Ver horarios agrupados | GET /api/horarios existente | AdminHorarios.jsx tabs |
| HU-13 | Estado selección docentes | horarios getEstadoSeleccion | EstadoDocentes.jsx |
| HU-14 | Editar/eliminar admin | horarios delete + PUT | AdminHorarios.jsx |
| HU-15 | No solapar docente | HorarioModel existeConflictoDocente | SeleccionarHorario |
| HU-16 | No doble ocupación aula | HorarioModel existeConflictoAula/Lab | SeleccionarHorario |
| HU-17 | Respetar restricciones | HorarioModel existeRestriccionDocente | SeleccionarHorario |
| HU-18 | Auto timestamps | Backend ya lo hace | — |
| HU-19 | Excluir aulas ocupadas | docente-auth getAmbientesDisponibles | SeleccionarHorario |
| HU-20 | Config step minutes | configuracion whitelist | DemoPanel.jsx |
| HU-21 | Avanzar turno con clic | demo avanzarTurno | DemoPanel.jsx |
| HU-22 | Indicador mi turno | demo getEstado | MiHorario.jsx |

---

## Orden de Ejecución

1. Backend Auth (middleware + model + controller + routes)
2. Backend Restricciones (model + controller + routes)
3. Backend Docente-auth (controller + routes)
4. Backend Horarios (DELETE + estado-seleccion + model)
5. Backend Configuración (whitelist + parseo)
6. Backend Demo (service + controller + routes + seed)
7. Backend proteger rutas existentes
8. Frontend Auth (context + protected route + login + api interceptor)
9. Frontend Rutas + Navbar + Layouts
10. Frontend Docente pages
11. Frontend Admin pages
12. Frontend Demo page
13. Frontend Componentes compartidos
