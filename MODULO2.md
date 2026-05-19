# Módulo 2 - Desarrollo asignado a Jersson

> Implementado por: Jersson  
> Rama sugerida: `modulo2/algoritmo`  
> Dependencias: Node.js, Express, PostgreSQL  
> Alcance: Backend del algoritmo de generación automática de horarios

---

## 1. Descripción general

Este módulo implementa la lógica backend para generar, consultar y editar horarios académicos dentro del sistema **Scheduling UNT**. El desarrollo se construyó sobre los datos maestros ya entregados por el Módulo 1: docentes, cursos, aulas, laboratorios, asignaciones docente-curso y configuración general del horario.

El módulo reemplaza los endpoints mock de horarios y estadísticas por lógica real conectada a PostgreSQL, respetando la arquitectura existente del proyecto basada en rutas, controladores, modelos SQL y servicios.

---

## 2. Objetivo del módulo

El objetivo del Módulo 2 es automatizar la asignación de horarios académicos evitando conflictos básicos del dominio:

- Un docente no puede dictar dos clases al mismo tiempo.
- Un aula no puede reservarse para dos clases al mismo tiempo.
- Un laboratorio no puede reservarse para dos clases al mismo tiempo.
- Las clases deben ubicarse dentro de los días y horas definidos en la configuración del sistema.
- La generación debe respetar la prioridad docente definida por jerarquía: primero docentes nombrados, luego contratados; dentro de cada grupo se prioriza categoría y antigüedad.

Con esto, el sistema deja de ser solo un CRUD de datos maestros y empieza a generar horarios reales a partir de las asignaciones registradas.

---

## 3. Archivos creados

### `backend/src/models/horario.model.js`

Modelo principal del Módulo 2. Contiene las consultas SQL necesarias para:

- Listar horarios con joins a docentes, cursos, aulas y laboratorios.
- Obtener un horario por ID.
- Crear horarios generados automáticamente.
- Actualizar horarios por edición manual.
- Eliminar horarios de un semestre al regenerar.
- Consultar asignaciones ordenadas por prioridad docente.
- Validar cruces de docente, aula y laboratorio.
- Consultar restricciones horarias docentes.
- Obtener estadísticas reales del sistema.

### `backend/src/services/scheduler.service.js`

Servicio que contiene la lógica principal del algoritmo de asignación. Se encarga de:

- Leer la configuración de días, horas y duración de bloques.
- Generar los bloques horarios válidos.
- Ordenar las asignaciones por jerarquía docente.
- Buscar un bloque y ambiente disponible para cada asignación.
- Respetar ambientes preferidos cuando existan.
- Evitar cruces de docente y ambiente.
- Registrar conflictos cuando una asignación no puede ubicarse.
- Validar ediciones manuales antes de actualizar un horario.

### `backend/src/controllers/horarios.controller.js`

Controlador HTTP para los endpoints del Módulo 2:

- `GET /api/horarios`
- `POST /api/horarios/generar`
- `PUT /api/horarios/:id`

Valida parámetros, llama al servicio o modelo correspondiente y devuelve respuestas con el formato estándar del proyecto.

### `backend/src/controllers/estadisticas.controller.js`

Controlador para alimentar el endpoint `GET /api/estadisticas` con datos reales. Calcula métricas para el dashboard, como totales, ocupación, distribución de clases y carga por docente.

### `backend/tests/test_modulo2.js`

Script de prueba manual para validar los endpoints principales del Módulo 2 desde consola.

---

## 4. Archivos modificados

### `backend/src/routes/horarios.routes.js`

Se reemplazaron las respuestas mock por llamadas reales al `HorariosController`.

Antes los endpoints devolvían datos de ejemplo. Ahora ejecutan la lógica real de generación, consulta y edición manual de horarios.

### `backend/src/routes/estadisticas.routes.js`

Se reemplazó el mock de estadísticas por el `EstadisticasController`, de modo que el dashboard pueda consumir datos reales generados desde la base de datos.

---

## 5. Funcionalidades implementadas

### 5.1 Generación automática de horarios

Endpoint implementado:

```http
POST /api/horarios/generar
```

Body esperado:

```json
{
  "semestre": "2026-1",
  "forzar": true
}
```

Funcionamiento:

1. Valida el formato del semestre.
2. Revisa si ya existen horarios para ese semestre.
3. Si `forzar` es `true`, elimina los horarios previos del semestre.
4. Obtiene la configuración del sistema.
5. Genera bloques de horario válidos.
6. Obtiene asignaciones docente-curso del semestre.
7. Ordena las asignaciones por jerarquía docente.
8. Intenta asignar cada clase a un bloque y ambiente disponible.
9. Guarda los horarios generados.
10. Devuelve resumen de generación, conflictos y horarios finales.

### 5.2 Consulta de horarios con filtros

Endpoint implementado:

```http
GET /api/horarios
```

Filtros soportados:

- `semestre`
- `docente_id`
- `aula_id`
- `laboratorio_id`
- `dia`

Ejemplo:

```http
GET /api/horarios?semestre=2026-1&docente_id=1
```

La respuesta incluye información relacionada de docente, curso, aula o laboratorio.

### 5.3 Edición manual de horarios

Endpoint implementado:

```http
PUT /api/horarios/:id
```

Body permitido:

```json
{
  "dia": "Martes",
  "hora_inicio": "09:00",
  "hora_fin": "11:00",
  "aula_id": 2
}
```

La edición manual valida:

- Existencia del horario.
- Formato de hora.
- Día válido.
- Rango horario correcto.
- Tipo de ambiente según el tipo de asignación.
- Existencia y estado activo del aula o laboratorio.
- Cruce con otro horario del mismo docente.
- Cruce con otra reserva del mismo ambiente.

Cuando se edita un horario, se marca como:

```json
{
  "generado_automaticamente": false,
  "editado_manualmente": true
}
```

### 5.4 Estadísticas reales para dashboard

Endpoint implementado:

```http
GET /api/estadisticas
```

También acepta filtro por semestre:

```http
GET /api/estadisticas?semestre=2026-1
```

Devuelve:

- Total de docentes activos.
- Total de cursos activos.
- Total de aulas activas.
- Total de laboratorios activos.
- Porcentaje de ocupación.
- Distribución entre teoría y laboratorio.
- Carga horaria por docente.
- Uso por ambiente.

---

## 6. Lógica aplicada

La lógica del algoritmo se basa en una asignación secuencial controlada por prioridad docente.

Primero se leen las asignaciones del semestre y se ordenan con esta regla:

1. Docentes nombrados antes que contratados.
2. Categoría docente:
   - Principal
   - Asociado
   - Auxiliar
   - Jefe de práctica
3. Mayor antigüedad dentro de la misma categoría.
4. Orden alfabético y código del curso como criterio estable adicional.

Después, para cada asignación, el sistema intenta ubicar la clase en el primer bloque disponible. Si la asignación tiene ambiente preferido, se intenta usar ese ambiente primero. Si no está disponible, el algoritmo prueba con otros ambientes activos del mismo tipo.

Para una asignación de tipo `Teoria`, solo se usan aulas. Para una asignación de tipo `Laboratorio`, solo se usan laboratorios.

El algoritmo descarta un bloque cuando detecta:

- Restricción horaria del docente.
- Cruce con otra clase del mismo docente.
- Aula ocupada en el mismo día y hora.
- Laboratorio ocupado en el mismo día y hora.

Si no se encuentra ubicación válida, la asignación se reporta en la lista de conflictos.

---

## 7. Integración con el Módulo 1

El Módulo 2 se integra directamente con lo desarrollado en el Módulo 1 porque reutiliza sus tablas y datos maestros:

- `docentes`: se usan para aplicar jerarquía y validar cruces.
- `cursos`: se usan para identificar la clase asignada.
- `aulas`: se usan para asignaciones de teoría.
- `laboratorios`: se usan para asignaciones de laboratorio.
- `asignacion_docente_curso`: es la entrada principal del algoritmo.
- `configuracion`: define días hábiles, hora de inicio, hora de fin y duración del bloque.

No se modificó la lógica del CRUD del Módulo 1. El Módulo 2 consume esos datos y produce registros en la tabla `horarios`.

---

## 8. Validaciones realizadas

### Validaciones de generación

- El semestre debe tener formato `YYYY-1` o `YYYY-2`.
- Si ya existen horarios, no se duplican salvo que `forzar` sea `true`.
- Solo se generan bloques dentro de la configuración del sistema.
- No se asignan clases en bloques que crucen el horario de almuerzo institucional de 13:00 a 14:00.
- Se respeta el tipo de ambiente: teoría en aula y laboratorio en laboratorio.
- Se validan cruces de docente.
- Se validan cruces de aula.
- Se validan cruces de laboratorio.
- Se respetan restricciones horarias docentes de tipo `No_disponible` si existen registros en la tabla `restricciones_horarias`.

### Validaciones de consulta

- `docente_id`, `aula_id` y `laboratorio_id` deben ser enteros cuando se envían.
- `dia` debe ser un día válido.
- `semestre` debe tener formato correcto cuando se envía.

### Validaciones de edición manual

- El horario debe existir.
- `hora_inicio` y `hora_fin` deben tener formato `HH:MM`.
- La hora de inicio debe ser menor que la hora de fin.
- Una clase de teoría debe tener aula.
- Una clase de laboratorio debe tener laboratorio.
- No se permite asignar aula y laboratorio al mismo horario.
- El aula o laboratorio debe existir y estar activo.
- No debe existir cruce con otro horario del docente.
- No debe existir cruce con otra reserva del mismo ambiente.

---

## 9. Pruebas realizadas

Se realizaron validaciones de sintaxis en los archivos del backend con:

```bash
find backend/src backend/tests -name "*.js" -print0 | xargs -0 -n1 node --check
```

También se verificó que la aplicación Express pueda cargarse sin errores de importación:

```bash
cd backend
node -e "require('./src/app'); console.log('app ok')"
```

Resultado esperado:

```bash
app ok
```

Para probar funcionalmente contra base de datos PostgreSQL, ejecutar:

```bash
node backend/tests/test_modulo2.js
```

Este script prueba:

1. Generación de horarios con `forzar=true`.
2. Consulta de horarios del semestre.
3. Consulta de estadísticas reales.

---

## 10. Cómo ejecutar el proyecto

### 10.1 Crear base de datos

```bash
psql -U postgres -c "CREATE DATABASE scheduling_unt;"
```

### 10.2 Ejecutar migración

Desde la raíz del proyecto:

```bash
psql -U postgres -d scheduling_unt -f database/migrations/001_init.sql
```

### 10.3 Cargar datos de prueba

```bash
psql -U postgres -d scheduling_unt -f database/seeds/001_test_data.sql
```

### 10.4 Configurar backend

```bash
cd backend
cp .env.example .env
npm install
```

Editar `.env` con las credenciales locales de PostgreSQL:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=tu_password
DB_NAME=scheduling_unt
PORT=3001
NODE_ENV=development
```

### 10.5 Ejecutar backend

```bash
npm run dev
```

Backend disponible en:

```http
http://localhost:3001
```

### 10.6 Probar generación de horarios

Con Postman, Insomnia o Thunder Client:

```http
POST http://localhost:3001/api/horarios/generar
Content-Type: application/json
```

Body:

```json
{
  "semestre": "2026-1",
  "forzar": true
}
```

### 10.7 Consultar horarios

```http
GET http://localhost:3001/api/horarios?semestre=2026-1
```

### 10.8 Consultar estadísticas

```http
GET http://localhost:3001/api/estadisticas?semestre=2026-1
```

### 10.9 Ejecutar frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend disponible en:

```http
http://localhost:5173
```

---

## 11. Posibles preguntas del docente

### ¿Qué problema resuelve tu módulo?

Mi módulo resuelve la generación automática de horarios. Toma las asignaciones docente-curso creadas en el Módulo 1 y las convierte en horarios reales, evitando cruces de docentes y ambientes.

### ¿Qué datos usa el algoritmo?

Usa docentes, cursos, aulas, laboratorios, asignaciones y configuración. Es decir, no trabaja con datos inventados, sino con la información registrada previamente en el sistema.

### ¿Cómo se respeta la jerarquía docente?

Las asignaciones se ordenan primero por tipo de nombramiento, dando prioridad a los nombrados. Luego se ordenan por categoría: Principal, Asociado, Auxiliar y Jefe de práctica. Finalmente se considera la antigüedad del docente.

### ¿Cómo evitas que un docente tenga dos clases al mismo tiempo?

Antes de insertar un horario, el sistema consulta si el docente ya tiene una clase que se cruce con ese día y rango de horas. Si existe cruce, prueba otro bloque.

### ¿Cómo evitas que un aula o laboratorio se repita?

El algoritmo valida si el aula o laboratorio ya está reservado en el mismo día y horario. Si está ocupado, intenta otro ambiente activo disponible.

### ¿Qué pasa si no se puede ubicar una asignación?

No se inserta un horario inválido. La asignación queda registrada en la lista de conflictos, indicando el motivo por el cual no pudo programarse.

### ¿Por qué usaste un servicio separado para el algoritmo?

Porque el controlador solo debe manejar la petición HTTP. La lógica fuerte del negocio debe estar en un servicio, lo que hace el código más ordenado, mantenible y fácil de probar.

### ¿Tu módulo modifica el trabajo del Módulo 1?

No. El Módulo 1 se mantiene como base de datos maestros. Mi módulo consume esos datos y genera horarios en una tabla diferente.

### ¿Se puede editar manualmente un horario generado?

Sí. El endpoint `PUT /api/horarios/:id` permite mover un horario, pero valida nuevamente que no se generen cruces.

### ¿Qué limitación tiene esta primera versión?

Cada asignación se ubica en un bloque horario. En una versión futura se puede ampliar la lógica para distribuir horas según créditos, grupos múltiples, disponibilidad avanzada o reglas institucionales más complejas.

---

## 12. Conclusión

El Módulo 2 convierte el sistema Scheduling UNT en una aplicación funcional para la planificación académica, porque implementa el motor backend encargado de generar horarios automáticamente. Este módulo se integra con los datos maestros del Módulo 1, respeta la jerarquía docente, evita cruces de docentes y ambientes, permite edición manual validada y entrega estadísticas reales para que los módulos frontend puedan visualizar y reportar la información.

El aporte principal del módulo es que centraliza la lógica de asignación de horarios y deja preparada la base para que los módulos 3 y 4 construyan el dashboard, la vista de horarios y los reportes PDF sobre datos reales.
