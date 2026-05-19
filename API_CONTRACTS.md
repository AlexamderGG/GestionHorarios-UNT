# API Contracts - Scheduling UNT

> Documento de contratos de API para desarrollo paralelo de módulos.
> Cada módulo debe respetar estos endpoints, métodos, parámetros y formatos de respuesta.

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
| GET | `/disponibles` | Docentes disponibles por especialidad/semestre | Módulo 1 |
| GET | `/:id` | Obtener un docente por ID | Módulo 1 |
| POST | `/` | Crear docente | Módulo 1 |
| PUT | `/:id` | Actualizar docente | Módulo 1 |
| DELETE | `/:id` | Eliminar (soft-delete) | Módulo 1 |

**Body POST/PUT:**
```json
{
  "nombres": "string",
  "apellidos": "string",
  "email": "string",
  "telefono": "string",
  "categoria": "Principal|Asociado|Auxiliar|Jefe de practica",
  "tipo_nombramiento": "Nombrado|Contratado",
  "especialidad": "string",
  "escuela": "string",
  "semestre_contrato": "2026-1",
  "antiguedad_anios": 0
}
```

- `especialidad`: Área de conocimiento (ej: "Ingenieria de Sistemas", "Matematicas", "Musica").
- `escuela`: Escuela de procedencia (ej: "Ingenieria de Sistemas", "Escuela de Matematicas").
- `semestre_contrato`: Solo para contratados de un semestre. NULL = disponible todos los semestres.

**GET /disponibles Query Params:**
- `especialidad` (string) - Filtrar por especialidad
- `semestre` (string) - Requerido. Semestre activo (ej: "2026-1")

**Lógica de disponibilidad:**
- Docentes `Nombrados` siempre están disponibles.
- Docentes `Contratados` solo disponibles si:
  - `semestre_contrato` es NULL (contrato indefinido), O
  - `semestre_contrato` coincide con el semestre solicitado.

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
  "codigo": "EG-101",
  "nombre": "Desarrollo del Pensamiento Logico Matematico",
  "creditos": 3,
  "ciclo": 1,
  "semestre": "2026-1",
  "especialidad": "Matematicas",
  "horas_aula": 4,
  "horas_lab": 0
}
```

- `ciclo` (INTEGER): Ciclo académico del curso (1 - 10).
- `semestre` (VARCHAR): Periodo académico. Formato `YYYY-1` o `YYYY-2`.
- `especialidad` (VARCHAR): Área del curso. Se usa para validar asignación a docentes.
- `horas_aula` (INTEGER): Horas semanales de teoría/práctica en aula.
- `horas_lab` (INTEGER): Horas semanales de laboratorio.

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

> **Nota:** Los laboratorios son de uso general (sin especialidad). Cualquier curso puede reservarlos según sus `horas_lab`.

---

## 5. Asignaciones Docente-Curso

Base path: `/api/asignaciones`

| Método | Endpoint | Descripción | Responsable |
|--------|----------|-------------|---------------|
| GET | `/` | Listar asignaciones | Módulo 1 |
| POST | `/` | Asignar curso a docente | Módulo 1 |
| DELETE | `/:id` | Eliminar asignación | Módulo 1 |

**Body POST:**
```json
{
  "docente_id": 1,
  "curso_id": 5,
  "tipo": "Teoria|Laboratorio",
  "ambiente_preferido_id": 1,
  "semestre_asignacion": "2026-1",
  "ciclo": 1
}
```

**Validaciones de especialidad:**
- Si el docente es `Contratado`, su `especialidad` debe coincidir con la del curso.
- Si el docente contratado tiene `semestre_contrato`, debe coincidir con `semestre_asignacion`.
- Docentes `Nombrados` pueden dictar cualquier curso (asumen adaptación a la necesidad).

---

## 6. Horarios

Base path: `/api/horarios`

| Método | Endpoint | Descripción | Responsable |
|--------|----------|-------------|---------------|
| GET | `/` | Listar horarios | Módulo 2 |
| POST | `/generar` | Generar horarios automáticamente | Módulo 2 |
| PUT | `/:id` | Editar manualmente un horario | Módulo 2 |

**GET Query Params:**
- `semestre` (string) - Ej: "2026-1"
- `docente_id`, `aula_id`, `laboratorio_id`, `dia`

**Body POST /generar:**
```json
{
  "semestre": "2026-1",
  "forzar": true
}
```

**Lógica del Scheduler:**
1. Lee `semestre_activo` de configuración.
2. Determina ciclos activos: impar (1,3,5,7,9) si semestre termina en -1; par (2,4,6,8,10) si termina en -2.
3. Obtiene asignaciones del semestre para ciclos activos.
4. Ordena por jerarquía: Nombrados > Contratados; luego categoría; luego antigüedad.
5. Para cada asignación, genera N sesiones según `horas_aula` o `horas_lab` del curso.

---

## 7. Configuración

Base path: `/api/configuracion`

| Método | Endpoint | Descripción | Responsable |
|--------|----------|-------------|---------------|
| GET | `/` | Obtener configuración | Módulo 1 |
| PUT | `/` | Actualizar configuración | Módulo 1 |

**Claves de configuración:**
- `dias_habiles`: "Lunes,Martes,Miercoles,Jueves,Viernes"
- `hora_inicio`: "07:00"
- `hora_fin`: "22:00"
- `duracion_bloque`: "120" (minutos)
- `bloques_por_dia`: "6"
- `semestre_activo`: "2026-1"

**Respuesta GET:**
```json
{
  "dias_habiles": ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"],
  "hora_inicio": "07:00",
  "hora_fin": "22:00",
  "duracion_bloque": 120,
  "bloques_por_dia": 6,
  "semestre_activo": "2026-1"
}
```

> **semestre_activo** determina qué ciclos están activos:
> - Termina en `-1` (impar): ciclos 1, 3, 5, 7, 9
> - Termina en `-2` (par): ciclos 2, 4, 6, 8, 10

---

## Notas de Coordinación

- **Módulo 1** provee seeds completos con especialidades y escuelas.
- **Módulo 2** debe respetar el `semestre_activo` para filtrar ciclos.
- **Módulo 3** puede usar `/api/docentes/disponibles?especialidad=X&semestre=Y` para poblar selectores.
- **Módulo 4** reportes pueden agrupar por especialidad o escuela.
