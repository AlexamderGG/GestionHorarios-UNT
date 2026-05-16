# API Contracts - Scheduling UNT

> Documento de contratos de API para desarrollo paralelo de módulos.
> Cada módulo debe respetar estos endpoints, métodos, parámetros y formatos de respuesta.
> En fase inicial, los endpoints devuelven mocks; los equipos deben reemplazar por lógica real.

---

## Formato de Respuesta Estándar

Todas las respuestas deben seguir este formato JSON:

```json
{
  "success": true|false,
  "message": "string",
  "data": {}|[]|null
}
```

En caso de error:

```json
{
  "success": false,
  "message": "Error descriptivo",
  "errors": {} // opcional, para validaciones
}
```

---

## 1. Docentes

Base path: `/api/docentes`

| Método | Endpoint | Descripción | Responsable |
|--------|----------|-------------|---------------|
| GET | `/` | Listar todos los docentes (activos) | Módulo 1 |
| GET | `/:id` | Obtener un docente por ID | Módulo 1 |
| POST | `/` | Crear docente | Módulo 1 |
| PUT | `/:id` | Actualizar docente | Módulo 1 |
| DELETE | `/:id` | Eliminar (soft-delete recomendado) | Módulo 1 |

**Body POST/PUT:**
```json
{
  "nombres": "string",
  "apellidos": "string",
  "email": "string",
  "telefono": "string",
  "categoria": "Principal|Asociado|Auxiliar|Jefe de practica",
  "tipo_nombramiento": "Nombrado|Contratado",
  "antiguedad_anios": 0
}
```

---

## 2. Cursos

Base path: `/api/cursos`

| Método | Endpoint | Descripción | Responsable |
|--------|----------|-------------|---------------|
| GET | `/` | Listar cursos | Módulo 1 |
| GET | `/:id` | Obtener curso por ID | Módulo 1 |
| POST | `/` | Crear curso | Módulo 1 |
| PUT | `/:id` | Actualizar curso | Módulo 1 |
| DELETE | `/:id` | Eliminar curso | Módulo 1 |

**Body POST/PUT:**
```json
{
  "codigo": "IS101",
  "nombre": "Introduccion a la Programacion",
  "creditos": 4,
  "semestre": 1,
  "ciclo": "2024-1"
}
```

---

## 3. Aulas

Base path: `/api/aulas`

| Método | Endpoint | Descripción | Responsable |
|--------|----------|-------------|---------------|
| GET | `/` | Listar aulas | Módulo 1 |
| GET | `/:id` | Obtener aula por ID | Módulo 1 |
| POST | `/` | Crear aula | Módulo 1 |
| PUT | `/:id` | Actualizar aula | Módulo 1 |
| DELETE | `/:id` | Eliminar aula | Módulo 1 |

---

## 4. Laboratorios

Base path: `/api/laboratorios`

| Método | Endpoint | Descripción | Responsable |
|--------|----------|-------------|---------------|
| GET | `/` | Listar laboratorios | Módulo 1 |
| GET | `/:id` | Obtener laboratorio por ID | Módulo 1 |
| POST | `/` | Crear laboratorio | Módulo 1 |
| PUT | `/:id` | Actualizar laboratorio | Módulo 1 |
| DELETE | `/:id` | Eliminar laboratorio | Módulo 1 |

---

## 5. Asignaciones Docente-Curso

Base path: `/api/asignaciones`

| Método | Endpoint | Descripción | Responsable |
|--------|----------|-------------|---------------|
| GET | `/` | Listar asignaciones (con joins a docente/curso) | Módulo 1 |
| POST | `/` | Asignar curso a docente | Módulo 1 |
| DELETE | `/:id` | Eliminar asignación | Módulo 1 |

**Body POST:**
```json
{
  "docente_id": 1,
  "curso_id": 5,
  "tipo": "Teoria|Laboratorio",
  "ambiente_preferido_id": 1, // opcional
  "semestre_asignacion": "2024-1"
}
```

**Validaciones:**
- Un mismo curso no puede asignarse dos veces al mismo docente con el mismo tipo y semestre.
- `ambiente_preferido_id` debe referir a una aula (si tipo=Teoria) o laboratorio (si tipo=Laboratorio).

---

## 6. Horarios

Base path: `/api/horarios`

| Método | Endpoint | Descripción | Responsable |
|--------|----------|-------------|---------------|
| GET | `/` | Listar horarios (filtros por query params) | Módulo 2 |
| POST | `/generar` | Ejecutar algoritmo de generación automática | Módulo 2 |
| PUT | `/:id` | Editar manualmente un horario | Módulo 2 |

**GET Query Params:**
- `docente_id` (int) - Filtrar por docente
- `aula_id` (int) - Filtrar por aula
- `laboratorio_id` (int) - Filtrar por laboratorio
- `dia` (string) - Filtrar por día
- `semestre` (string) - Ej: "2024-1"

**Respuesta GET (ejemplo de item):**
```json
{
  "id": 1,
  "asignacion_id": 3,
  "semestre": "2024-1",
  "dia": "Lunes",
  "hora_inicio": "07:00",
  "hora_fin": "09:00",
  "aula_id": 1,
  "laboratorio_id": null,
  "generado_automaticamente": true,
  "editado_manualmente": false,
  "docente": { "id": 1, "nombres": "...", "apellidos": "...", "categoria": "..." },
  "curso": { "id": 5, "codigo": "IS301", "nombre": "Bases de Datos I" },
  "aula": { "id": 1, "codigo": "A101", "nombre": "..." }
}
```

**Body POST /generar:**
```json
{
  "semestre": "2024-1", // opcional, default actual
  "forzar": false       // opcional, si true borra horarios previos del semestre
}
```

**Restricciones del Algoritmo (Módulo 2):**
1. Orden de asignación por jerarquía:
   - Nombrados: Principal → Asociado → Auxiliar → Jefe de práctica
   - Contratados: misma sub-jerarquía por categoría y antigüedad
2. Un docente no puede tener dos clases al mismo tiempo (teoría o lab).
3. Un aula/laboratorio no puede tener dos clases al mismo tiempo.
4. Respetar configuración de días hábiles, hora inicio/fin y duración de bloque.

---

## 7. Estadísticas

Base path: `/api/estadisticas`

| Método | Endpoint | Descripción | Responsable |
|--------|----------|-------------|---------------|
| GET | `/` | Obtener métricas para dashboard | Módulo 2 o 3 |

**Respuesta:**
```json
{
  "total_docentes": 12,
  "total_cursos": 12,
  "total_aulas": 6,
  "total_laboratorios": 5,
  "ocupacion_aulas": 68.5,
  "distribucion_teoria_lab": { "teoria": 45, "laboratorio": 30 },
  "carga_por_docente": [
    { "docente_id": 1, "nombre": "Carlos Ramirez", "horas": 12 }
  ],
  "uso_por_ambiente": [
    { "ambiente": "A101", "horas": 24 },
    { "ambiente": "LAB01", "horas": 18 }
  ]
}
```

---

## 8. Reportes

Base path: `/api/reportes`

| Método | Endpoint | Descripción | Responsable |
|--------|----------|-------------|---------------|
| GET | `/operacional` | Horarios detallados por ambiente/día | Módulo 4 |
| GET | `/gestion` | Resumen por docente | Módulo 4 |
| GET | `/docente/:docente_id` | Horario individual de un docente | Módulo 4 |

**Query Params comunes:**
- `formato` = `json` | `pdf` (default: `json`)
- `semestre` (string)
- `anio` (string)

**Nota sobre PDF:**
Se recomienda que el backend devuelva JSON estructurado y el frontend (Módulo 4) use `jsPDF` + `html2canvas` para renderizar el PDF. Si el equipo prefiere generar PDF desde el backend, pueden usar librerías como `pdfkit` o `puppeteer`, pero esto sale del contrato inicial.

---

## 9. Configuración

Base path: `/api/configuracion`

| Método | Endpoint | Descripción | Responsable |
|--------|----------|-------------|---------------|
| GET | `/` | Obtener configuración actual | Módulo 1 |
| PUT | `/` | Actualizar configuración | Módulo 1 |

**Respuesta / Body:**
```json
{
  "dias_habiles": ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"],
  "hora_inicio": "07:00",
  "hora_fin": "22:00",
  "duracion_bloque": 120,
  "bloques_por_dia": 6
}
```

---

## Notas de Coordinación

- **Módulo 1** debe proveer los seeds completos para que Módulo 2 pueda probar el algoritmo.
- **Módulo 2** debe publicar un mock de `/api/horarios` con datos ficticios tan pronto tenga la estructura, para que Módulo 3 pueda pintar el grid.
- **Módulo 3** debe usar los componentes de página ya creados (`Dashboard.jsx`, `Horarios.jsx`) y expandirlos.
- **Módulo 4** debe usar `jsPDF` y `html2canvas` ya incluidos en `package.json`.
- Todos los módulos deben usar la instancia de `axios` en `frontend/src/services/api.js` para las peticiones.
