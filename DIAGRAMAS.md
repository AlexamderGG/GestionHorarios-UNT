# Diagramas Técnicos del Sistema de Gestión de Horarios UNT

Este documento consolida todos los diagramas de arquitectura, componentes, secuencia, estados y modelo de datos del sistema **Scheduling UNT** representados utilizando la sintaxis de **Mermaid.js**.

---

## 1. Diagramas de Arquitectura

El sistema está estructurado bajo una arquitectura cliente-servidor clásica de tres capas (Presentación, Negocio, Datos), optimizada para la Web.

```mermaid
graph TD
    subgraph Frontend [Capa de Presentación (Frontend)]
        Vite[Vite Dev Server / Production Build]
        React[React.js SPA]
        Tailwind[Tailwind CSS (Estilos)]
        Axios[Axios (Cliente HTTP)]
        pdfJS[pdf.js / jsPDF / html2canvas (Exportador PDF)]
        
        React --> Tailwind
        React --> Axios
        React --> pdfJS
    end

    subgraph Backend [Capa de Negocio (Backend)]
        Express[Express.js App]
        Routes[Express Routes]
        Controllers[Express Controllers]
        Scheduler[Scheduler Service (Algoritmo)]
        Models[Models (SQL Directo)]
        PGPool[pg.Pool (Conexiones PostgreSQL)]
        
        Express --> Routes
        Routes --> Controllers
        Controllers --> Scheduler
        Controllers --> Models
        Scheduler --> Models
        Models --> PGPool
    end

    subgraph Database [Capa de Datos (Database)]
        PostgreSQL[(PostgreSQL DB)]
    end

    Axios -- "Peticiones HTTP (JSON)" --> Express
    PGPool -- "Consultas SQL" --> PostgreSQL
```

---

## 2. Diagrama de Casos de Uso del Negocio

Representación de los actores del negocio y los casos de uso principales (CUN) que definen los flujos operacionales del sistema de horarios.

```mermaid
graph LR
    subgraph Actores [Actores del Negocio]
        Admin["Administrador<br>(Director / Secretaría)"]
        Docente["Docente UNT"]
        Estudiante["Estudiante UNT<br>(Beneficiario)"]
    end

    subgraph CasosDeUso [Casos de Uso del Negocio]
        CUN1(["CUN1: Configurar Semestre Académico"])
        CUN2(["CUN2: Planificar Carga Docente<br>(Lectiva y No Lectiva)"])
        CUN3(["CUN3: Programar Horarios Académicos<br>(Scheduler / Manual)"])
        CUN4(["CUN4: Seleccionar Horario Preferencial"])
        CUN5(["CUN5: Gestionar Excepciones y Reclamos"])
        CUN6(["CUN6: Consultar y Exportar Reportes"])
    end

    Admin --> CUN1
    Admin --> CUN2
    Admin --> CUN3
    Admin --> CUN5
    Admin --> CUN6

    Docente --> CUN2
    Docente --> CUN4
    Docente --> CUN5
    Docente --> CUN6

    Estudiante --> CUN6
```

---

## 3. Modelo de Datos (ERD)

Diagrama de entidad-relación detallado con todas las tablas del esquema físico de la base de datos PostgreSQL, incluyendo las tablas de asignaciones, restricciones de horario, excepciones y carga no lectiva.

```mermaid
erDiagram
    docentes {
        int id PK
        string nombres
        string apellidos
        string email
        string telefono
        string categoria
        string tipo_nombramiento
        string especialidad
        string escuela
        string semestre_contrato
        int antiguedad_anios
        boolean activo
        string estado_turno
        int reset_token_at
        string password
        string modalidad
        string dni
        timestamp created_at
        timestamp updated_at
    }

    cursos {
        int id PK
        string codigo UK
        string nombre
        int creditos
        int ciclo
        string semestre
        string especialidad
        boolean activo
        timestamp created_at
    }

    aulas {
        int id PK
        string codigo UK
        string nombre
        int capacidad
        string ubicacion
        string tipo
        boolean activa
        timestamp created_at
    }

    laboratorios {
        int id PK
        string codigo UK
        string nombre
        int capacidad
        string ubicacion
        boolean activo
        timestamp created_at
    }

    configuracion {
        int id PK
        string clave UK
        string valor
        string descripcion
        boolean docentes_pueden_asignar
        timestamp updated_at
    }

    asignacion_docente_curso {
        int id PK
        int docente_id FK
        int curso_id FK
        string tipo
        string grupo
        int horas_asignadas
        int ambiente_preferido_id
        string semestre_asignacion
        int ciclo
        text observaciones
        timestamp created_at
    }

    horarios {
        int id PK
        int asignacion_id FK
        string semestre
        string dia
        time hora_inicio
        time hora_fin
        int aula_id FK
        int laboratorio_id FK
        boolean generado_automaticamente
        boolean editado_manualmente
        timestamp created_at
        timestamp updated_at
    }

    restricciones_horarias {
        int id PK
        int docente_id FK
        string dia
        time hora_inicio
        time hora_fin
        string tipo_restriccion
        text motivo
        timestamp created_at
    }

    excepciones_horario {
        int id PK
        int docente_id FK
        int asignacion_id FK
        text motivo
        string estado
        int_array horarios_solicitados_ids
        timestamp created_at
    }

    disponibilidad_docente {
        int id PK
        int docente_id FK
        string semestre
        string dia
        time hora_inicio
        time hora_fin
        string tipo
        timestamp creado_en
    }

    carga_no_lectiva {
        int id PK
        int docente_id FK
        string semestre
        int preparacion_clases
        int tutoria_consejeria
        int investigacion
        int gestion_admin
        int capacitacion
        int asesoria_tesis
        int responsabilidad_social
        int produccion_intelectual
        int otras_actividades
        int total_horas
        string preparacion_clases_detalle
        string tutoria_consejeria_detalle
        string investigacion_detalle
        string gestion_admin_detalle
        string capacitacion_detalle
        string otras_actividades_detalle
        string asesoria_tesis_detalle
        string responsabilidad_social_detalle
        string produccion_intelectual_detalle
        timestamp fecha_registro
    }

    horarios_no_lectivos {
        int id PK
        int docente_id FK
        string actividad_id
        string actividad_nombre
        string dia
        time hora_inicio
        time hora_fin
        string ambiente
        string semestre
        timestamp created_at
    }

    docentes ||--o{ asignacion_docente_curso : "dicta"
    cursos ||--o{ asignacion_docente_curso : "tiene"
    docentes ||--o{ restricciones_horarias : "tiene"
    docentes ||--o{ excepciones_horario : "solicita"
    docentes ||--o{ disponibilidad_docente : "registra"
    docentes ||--o{ carga_no_lectiva : "declara"
    docentes ||--o{ horarios_no_lectivos : "programa"

    asignacion_docente_curso ||--o{ horarios : "genera"
    asignacion_docente_curso ||--o{ excepciones_horario : "afecta"

    aulas ||--o{ horarios : "alberga"
    laboratorios ||--o{ horarios : "alberga"
```

---

## 4. Diagrama de Componentes

Muestra la organización física de los componentes de código tanto en el Frontend (React) como en el Backend (Node/Express) y cómo se agrupan e interactúan.

```mermaid
graph TD
    subgraph Client_App [React Frontend App]
        Router[App Router - App.jsx]
        
        subgraph Views_Admin [Vistas Administrador]
            Dashboard[AdminDashboard.jsx]
            AdminDocentes[AdminDocentes.jsx]
            AdminAsignaciones[AdminAsignaciones.jsx]
            AdminAmbientes[AdminAmbientes.jsx]
            PlanificacionSecretaria[PlanificacionSecretaria.jsx]
            Reportes[Reportes.jsx]
        end

        subgraph Views_Docente [Vistas Docente]
            MiHorario[MiHorario.jsx]
            HorarioNoLectivo[HorarioNoLectivo.jsx]
            MisDisponibilidades[MisDisponibilidades.jsx]
            CargaHoraria[CargaHoraria.jsx]
        end

        subgraph Components [Componentes Compartidos]
            Navbar[Navbar.jsx]
            Layout[Layout.jsx]
        end

        subgraph Services_Frontend [Servicios de Comunicación y Utilidades]
            API_Client[api.js (Axios Instance)]
            pdfUtil[pdf.js (html2canvas + jsPDF)]
        end

        Router --> Views_Admin
        Router --> Views_Docente
        Views_Admin --> Components
        Views_Docente --> Components
        Views_Admin --> API_Client
        Views_Docente --> API_Client
        Reportes --> pdfUtil
        MiHorario --> pdfUtil
    end

    subgraph Server_App [Express Backend App]
        Server[Server.js / App.js]
        
        subgraph Routes_Backend [Rutas de la API]
            DocentesRoutes[docentes.routes.js]
            CursosRoutes[cursos.routes.js]
            AsignacionesRoutes[asignaciones.routes.js]
            HorariosRoutes[horarios.routes.js]
            ReportesRoutes[reportes.routes.js]
            SecretariaRoutes[secretaria.routes.js]
        end

        subgraph Controllers_Backend [Controladores HTTP]
            DocentesCtrl[docente.controller.js]
            CursosCtrl[curso.controller.js]
            AsignacionesCtrl[asignacion.controller.js]
            HorariosCtrl[horarios.controller.js]
            ReportesCtrl[reportes.controller.js]
            SecretariaCtrl[secretaria.controller.js]
        end

        subgraph Services_Backend [Servicios de Lógica de Negocio]
            SchedulerService[scheduler.service.js (Algoritmo)]
        end

        subgraph Models_Backend [Modelos de Acceso SQL]
            DocenteModel[docente.model.js]
            CursoModel[curso.model.js]
            AsignacionModel[asignacion.model.js]
            HorarioModel[horario.model.js]
            AulaModel[aula.model.js]
            LabModel[laboratorio.model.js]
        end

        Server --> Routes_Backend
        DocentesRoutes --> DocentesCtrl
        CursosRoutes --> CursosCtrl
        AsignacionesRoutes --> AsignacionesCtrl
        HorariosRoutes --> HorariosCtrl
        ReportesRoutes --> ReportesCtrl
        SecretariaRoutes --> SecretariaCtrl

        HorariosCtrl --> SchedulerService
        
        DocentesCtrl --> DocenteModel
        CursosCtrl --> CursoModel
        AsignacionesCtrl --> AsignacionModel
        HorariosCtrl --> HorarioModel
        ReportesCtrl --> HorarioModel
        SecretariaCtrl --> HorarioModel
        
        SchedulerService --> HorarioModel
        SchedulerService --> AulaModel
        SchedulerService --> LabModel
    end

    API_Client -- "Solicitudes HTTP (JSON)" --> Server
```

---

## 5. Diagramas de Secuencia (Todos los Casos de Uso)

A continuación se dejan los diagramas de secuencia de interacción para el 100% de los casos de uso:

### 5.1. Módulo de Autenticación y Seguridad

#### CU: Iniciar Sesión (JWT) y Validación de Credenciales
```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Admin / Docente
    participant UI as Login.jsx
    participant api as api.js (Axios)
    participant Ctrl as auth.controller.js / docente.controller.js
    participant Model as docente.model.js
    participant DB as PostgreSQL

    Usuario->>UI: Ingresa DNI/Usuario y Contraseña
    UI->>api: POST /api/auth/login
    activate api
    api->>Ctrl: loginUser(credenciales)
    activate Ctrl
    Ctrl->>Model: getByDni / getByEmail(identifier)
    activate Model
    Model->>DB: SELECT * FROM docentes/usuarios WHERE ...
    DB-->>Model: Datos del usuario + hash contraseña
    deactivate Model
    
    Ctrl->>Ctrl: bcrypt.compare(password, hash)
    alt Credenciales incorrectas
        Ctrl-->>api: Response JSON { success: false, error: 'Credenciales inválidas' }
    else Credenciales válidas
        Ctrl->>Ctrl: jwt.sign(tokenPayload, JWT_SECRET)
        Ctrl-->>api: Response JSON { success: true, token, user }
    end
    deactivate Ctrl
    api-->>UI: Retorna token y datos del usuario
    deactivate api
    UI->>UI: Guarda token en localStorage y redirecciona al Dashboard/Portal
```

---

### 5.2. Módulo de Mantenimiento de Datos Maestros (CRUDs)

#### CU: Registrar/Editar/Eliminar Docente
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrador
    participant UI as AdminDocentes.jsx
    participant Ctrl as docente.controller.js
    participant Model as docente.model.js
    participant DB as PostgreSQL

    Admin->>UI: Rellena formulario (DNI, nombres, apellidos, categoría, etc.) y clic en "Guardar"
    UI->>Ctrl: POST/PUT /api/docentes (datos del docente)
    activate Ctrl
    Ctrl->>Model: crear / actualizar (datos)
    activate Model
    Model->>DB: INSERT/UPDATE docentes SET ...
    DB-->>Model: Docente guardado
    deactivate Model
    Ctrl-->>UI: Response JSON { success: true, docente }
    deactivate Ctrl
    UI-->>Admin: Muestra mensaje de éxito y actualiza lista
```

#### CU: Registrar/Editar/Eliminar Curso
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrador
    participant UI as AdminCursos.jsx
    participant Ctrl as curso.controller.js
    participant Model as curso.model.js
    participant DB as PostgreSQL

    Admin->>UI: Rellena formulario (código, nombre, ciclo, especialidad) y clic en "Guardar"
    UI->>Ctrl: POST/PUT /api/cursos (datos del curso)
    activate Ctrl
    Ctrl->>Model: crear / actualizar (datos)
    activate Model
    Model->>DB: INSERT/UPDATE cursos SET ...
    DB-->>Model: Curso guardado
    deactivate Model
    Ctrl-->>UI: Response JSON { success: true, curso }
    deactivate Ctrl
    UI-->>Admin: Muestra mensaje de éxito y actualiza lista
```

#### CU: Registrar/Editar/Eliminar Ambiente (Aulas/Laboratorios)
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrador
    participant UI as AdminAmbientes.jsx
    participant Ctrl as ambiente.controller.js
    participant Model as aula.model.js / laboratorio.model.js
    participant DB as PostgreSQL

    Admin->>UI: Rellena formulario (código, capacidad, ubicación, tipo) y clic "Guardar"
    UI->>Ctrl: POST/PUT /api/aulas o /api/laboratorios
    activate Ctrl
    Ctrl->>Model: crear / actualizar (datos)
    activate Model
    Model->>DB: INSERT/UPDATE aulas/laboratorios SET ...
    DB-->>Model: Ambiente guardado
    deactivate Model
    Ctrl-->>UI: Response JSON { success: true, ambiente }
    deactivate Ctrl
    UI-->>Admin: Muestra mensaje de éxito y actualiza lista
```

---

### 5.3. Módulo de Gestión de Asignaciones

#### CU: Registrar Asignación Docente-Curso Manual (con validaciones de especialidad y horas)
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrador
    participant UI as AdminAsignaciones.jsx
    participant Ctrl as asignacion.controller.js
    participant Model as asignacion.model.js
    participant DB as PostgreSQL

    Admin->>UI: Selecciona Docente, Curso, Grupo, Tipo (Teoría/Lab) y Clic "Guardar"
    UI->>Ctrl: POST /api/asignaciones (docente_id, curso_id, tipo, grupo, horas_asignadas)
    activate Ctrl

    Ctrl->>Model: getCargaHorariaSemanal(docente_id, semestre)
    activate Model
    Model->>DB: SELECT SUM(horas_asignadas) FROM asignacion_docente_curso WHERE docente_id = ...
    DB-->>Model: Carga actual (ej. 16 horas)
    deactivate Model

    alt Carga actual + Nuevas horas > 20
        Ctrl-->>UI: Response JSON { success: false, error: 'Excede límite de 20 horas' }
    else Carga dentro del límite
        Ctrl->>Model: validarEspecialidad(docente_id, curso_id)
        activate Model
        Model->>DB: SELECT especialidad de docente y curso
        DB-->>Model: Especialidad Docente, Especialidad Curso
        deactivate Model
        
        alt Docente es contratado y especialidad no coincide
            Ctrl-->>UI: Response JSON { success: false, error: 'Especialidad no coincide con el curso' }
        else Especialidad válida / Docente nombrado
            Ctrl->>Model: crearAsignacion(...)
            activate Model
            Model->>DB: INSERT INTO asignacion_docente_curso (...)
            DB-->>Model: Registro insertado
            deactivate Model
            Ctrl-->>UI: Response JSON { success: true, asignacion: {...} }
        end
    end
    deactivate Ctrl
    UI-->>Admin: Muestra actualización en tabla de asignaciones o error
```

#### CU: Ejecutar Asignación Automática de Cursos
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrador
    participant UI as AdminAsignaciones.jsx
    participant Ctrl as asignacion.controller.js
    participant Model as asignacion.model.js
    participant DB as PostgreSQL

    Admin->>UI: Clic en "Asignar Automático"
    UI->>Ctrl: POST /api/asignaciones/auto (semestre)
    activate Ctrl
    Ctrl->>Model: getDocentesDisponibles(semestre)
    activate Model
    Model->>DB: SELECT * FROM docentes WHERE activo = true
    DB-->>Model: Lista de docentes
    deactivate Model
    Ctrl->>Model: getCursosPorAsignar(semestre)
    activate Model
    Model->>DB: SELECT * FROM cursos WHERE activo = true AND id NOT IN (asignados)
    DB-->>Model: Lista de cursos
    deactivate Model
    
    loop Para cada curso no asignado
        Ctrl->>Ctrl: Buscar docente con la misma especialidad y menor carga horaria (< 20h)
        alt Docente encontrado
            Ctrl->>Model: crearAsignacion(docente_id, curso_id, tipo, grupo)
            activate Model
            Model->>DB: INSERT INTO asignacion_docente_curso (...)
            DB-->>Model: OK
            deactivate Model
        end
    end
    Ctrl-->>UI: Response JSON { success: true, mensaje: 'Asignación automática completada' }
    deactivate Ctrl
    UI-->>Admin: Muestra mensaje de éxito y recarga tabla de asignaciones
```

#### CU: Limpiar todas las asignaciones del semestre
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrador
    participant UI as AdminAsignaciones.jsx
    participant Ctrl as asignacion.controller.js
    participant Model as asignacion.model.js
    participant DB as PostgreSQL

    Admin->>UI: Clic en "Limpiar Todo" y confirma
    UI->>Ctrl: POST /api/asignaciones/limpiar (semestre)
    activate Ctrl
    Ctrl->>Model: eliminarAsignacionesSemestre(semestre)
    activate Model
    Model->>DB: DELETE FROM asignacion_docente_curso WHERE semestre_asignacion = ...
    DB-->>Model: OK
    deactivate Model
    Ctrl-->>UI: Response JSON { success: true, mensaje: 'Asignaciones limpiadas' }
    deactivate Ctrl
    UI-->>Admin: Limpia la tabla en pantalla y actualiza contadores de carga
```

---

### 4.4. Módulo de Disponibilidad y Carga Docente

#### CU: Registrar Disponibilidad Horaria (Docente)
```mermaid
sequenceDiagram
    autonumber
    actor Docente as Docente
    participant UI as MisDisponibilidades.jsx
    participant Ctrl as disponibilidad.controller.js
    participant Model as disponibilidad.model.js
    participant DB as PostgreSQL

    Docente->>UI: Selecciona bloques de tiempo (PREFERIDO/RESTRINGIDO) en calendario y clic "Guardar"
    UI->>Ctrl: POST /api/docentes/disponibilidad (disponibilidades_array)
    activate Ctrl
    Ctrl->>Model: limpiarDisponibilidadSemestre(docente_id, semestre)
    activate Model
    Model->>DB: DELETE FROM disponibilidad_docente WHERE docente_id = ...
    DB-->>Model: OK
    deactivate Model
    
    loop Para cada bloques seleccionado
        Ctrl->>Model: registrarDisponibilidad(docente_id, dia, hora_inicio, hora_fin, tipo)
        activate Model
        Model->>DB: INSERT INTO disponibilidad_docente (...)
        DB-->>Model: OK
        deactivate Model
    end
    Ctrl-->>UI: Response JSON { success: true, mensaje: 'Disponibilidad registrada' }
    deactivate Ctrl
    UI-->>Docente: Muestra notificación de éxito
```

#### CU: Registrar Carga No Lectiva (Docente)
```mermaid
sequenceDiagram
    autonumber
    actor Docente as Docente
    participant UI as CargaHoraria.jsx
    participant Ctrl as docente.controller.js
    participant Model as carga_no_lectiva.model.js
    participant DB as PostgreSQL

    Docente->>UI: Rellena horas y detalles (tutoría, investigación, etc.) y clic "Guardar"
    UI->>Ctrl: POST /api/docentes/carga-no-lectiva (docente_id, semestre, carga_no_lectiva_data)
    activate Ctrl
    Ctrl->>Model: upsertCargaNoLectiva(docente_id, semestre, data)
    activate Model
    Model->>DB: INSERT INTO carga_no_lectiva (...) ON CONFLICT UPDATE
    DB-->>Model: Registro actualizado (total_horas calculado automáticamente)
    deactivate Model
    Ctrl-->>UI: Response JSON { success: true, carga_no_lectiva }
    deactivate Ctrl
    UI-->>Docente: Actualiza la barra segmentada de carga total (Lectiva + No Lectiva)
```

#### CU: Registrar Horario No Lectivo (Docente)
```mermaid
sequenceDiagram
    autonumber
    actor Docente as Docente
    participant UI as HorarioNoLectivo.jsx
    participant Ctrl as horario_no_lectivo.controller.js
    participant Model as horario_no_lectivo.model.js
    participant DB as PostgreSQL

    Docente->>UI: Selecciona en la grilla el bloque de tiempo para su actividad no lectiva (tutoría, etc.) y clic "Guardar"
    UI->>Ctrl: POST /api/docentes/horarios-no-lectivos (docente_id, actividad_id, dia, hora_inicio, hora_fin, ambiente, semestre)
    activate Ctrl
    
    Ctrl->>Model: validarCruceHorariosNoLectivos(docente_id, dia, hora_inicio, hora_fin, semestre)
    activate Model
    Model->>DB: SELECT EXISTS (cruces en horarios u horarios_no_lectivos)
    DB-->>Model: true / false
    deactivate Model

    alt Hay cruce detectado
        Ctrl-->>UI: Response JSON { success: false, error: 'Ya tienes una actividad en este horario' }
    else Sin cruces
        Ctrl->>Model: registrarHorarioNoLectivo(...)
        activate Model
        Model->>DB: INSERT INTO horarios_no_lectivos (...)
        DB-->>Model: OK
        deactivate Model
        Ctrl-->>UI: Response JSON { success: true }
    end
    deactivate Ctrl
    UI-->>Docente: Muestra la actividad coloreada en la grilla de horarios o el error
```

---

### 4.5. Módulo de Horarios (Programación)

#### CU: Generar Horarios Automáticamente (Scheduler)
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrador
    participant UI as PlanificacionSecretaria.jsx
    participant Ctrl as horarios.controller.js
    participant Srv as scheduler.service.js
    participant Model as horario.model.js
    participant DB as PostgreSQL

    Admin->>UI: Clic en "Generar Horarios"
    UI->>Ctrl: POST /api/horarios/generar (semestre, forzar=true)
    activate Ctrl
    Ctrl->>Model: limpiarHorarios(semestre)
    activate Model
    Model->>DB: DELETE FROM horarios WHERE semestre = ...
    DB-->>Model: OK
    deactivate Model
    
    Ctrl->>Srv: generarHorarios(semestre)
    activate Srv
    Srv->>Model: getAsignacionesPriorizadas(semestre)
    activate Model
    Model->>DB: SELECT con prioridad (Nombrado > Contratado, Jerarquía, Antigüedad)
    DB-->>Model: Lista de asignaciones
    deactivate Model

    loop Para cada asignación
        Srv->>Srv: Buscar bloque horario y ambiente disponible (evitando cruces)
        alt Ambiente disponible y sin cruces
            Srv->>Srv: Registrar asignación temporal
        else Conflicto (Cruce o falta de aulas)
            Srv->>Srv: Registrar conflicto (Asignación sin aula/bloque)
        end
    end

    Srv->>Model: guardarHorarios(horarios_generados)
    activate Model
    Model->>DB: INSERT INTO horarios (...)
    DB-->>Model: OK
    deactivate Model

    Srv-->>Ctrl: Resultado de la generación (horarios, conflictos)
    deactivate Srv
    Ctrl-->>UI: Response JSON { success: true, generados: N, conflictos: [...] }
    deactivate Ctrl
    UI-->>Admin: Muestra estadísticas de éxito y lista de conflictos
```

#### CU: Editar Horario Manualmente (Admin)
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrador
    participant UI as PlanificacionSecretaria.jsx
    participant Ctrl as horarios.controller.js
    participant Srv as scheduler.service.js
    participant Model as horario.model.js
    participant DB as PostgreSQL

    Admin->>UI: Arrastra un curso a otro bloque/ambiente o edita formulario y clic "Actualizar"
    UI->>Ctrl: PUT /api/horarios/:id (dia, hora_inicio, hora_fin, aula_id/laboratorio_id)
    activate Ctrl
    
    Ctrl->>Srv: validarEdicionManual(horario_id, dia, hora_inicio, hora_fin, aula_id, laboratorio_id)
    activate Srv
    Srv->>Model: checkCruceDocenteExcluyendoHorario(docente_id, dia, hora_inicio, hora_fin, horario_id)
    activate Model
    Model->>DB: SELECT EXISTS (...)
    DB-->>Model: false
    deactivate Model
    
    Srv->>Model: checkCruceAmbienteExcluyendoHorario(aula_id, laboratorio_id, dia, hora_inicio, hora_fin, horario_id)
    activate Model
    Model->>DB: SELECT EXISTS (...)
    DB-->>Model: false
    deactivate Model
    
    Srv-->>Ctrl: ValidacionExitosa (Sin cruces)
    deactivate Srv

    Ctrl->>Model: actualizarHorario(horario_id, dia, hora_inicio, hora_fin, aula_id, laboratorio_id)
    activate Model
    Model->>DB: UPDATE horarios SET ...
    DB-->>Model: OK
    deactivate Model
    Ctrl-->>UI: Response JSON { success: true, mensaje: 'Horario actualizado' }
    deactivate Ctrl
    UI-->>Admin: Muestra el cambio en la grilla visual de horarios
```

#### CU: Selección/Guardado de Horario por Docente
```mermaid
sequenceDiagram
    autonumber
    actor Docente as Docente
    participant UI as SeleccionarHorario.jsx
    participant Ctrl as secretaria.controller.js
    participant Model as horario.model.js
    participant DB as PostgreSQL

    Docente->>UI: Selecciona Día, Hora Inicio y Aula/Lab para su curso
    UI->>Ctrl: POST /api/secretaria/guardar-horario (docente_id, asignacion_id, dia, hora_inicio, hora_fin, aula_id/lab_id)
    activate Ctrl
    
    Ctrl->>Model: validarCruceDocente(docente_id, dia, hora_inicio, hora_fin)
    activate Model
    Model->>DB: SELECT EXISTS (horarios del docente cruzados)
    DB-->>Model: true / false
    deactivate Model

    Ctrl->>Model: validarCruceAmbiente(aula_id, lab_id, dia, hora_inicio, hora_fin)
    activate Model
    Model->>DB: SELECT EXISTS (horarios del ambiente cruzados)
    DB-->>Model: true / false
    deactivate Model

    alt Hay cruce de docente o ambiente
        Ctrl-->>UI: Response JSON { success: false, error: 'Conflicto detectado...' }
    else Sin conflictos
        Ctrl->>Model: guardarHorario(horario_data)
        activate Model
        Model->>DB: INSERT INTO horarios/asignacion
        DB-->>Model: OK
        deactivate Model
        Ctrl-->>UI: Response JSON { success: true, horario: {...} }
    end
    deactivate Ctrl
    UI-->>Docente: Muestra confirmación o mensaje de error
```

---

### 4.6. Módulo de Excepciones

#### CU: Solicitar Excepción de Horario (Docente)
```mermaid
sequenceDiagram
    autonumber
    actor Docente as Docente
    participant UI as MiHorario.jsx
    participant Ctrl as excepcion.controller.js
    participant Model as excepcion.model.js
    participant DB as PostgreSQL

    Docente->>UI: Clic en "Solicitar Cambio", llena motivo e IDs de horarios alternativos y clic "Enviar"
    UI->>Ctrl: POST /api/excepciones (docente_id, asignacion_id, motivo, horarios_solicitados_ids)
    activate Ctrl
    Ctrl->>Model: crearExcepcion(docente_id, asignacion_id, motivo, horarios_solicitados_ids)
    activate Model
    Model->>DB: INSERT INTO excepciones_horario (...)
    DB-->>Model: Registro creado
    deactivate Model
    Ctrl-->>UI: Response JSON { success: true, excepcion }
    deactivate Ctrl
    UI-->>Docente: Muestra la solicitud en estado "Pendiente"
```

#### CU: Aprobar/Rechazar Excepción (Admin)
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrador
    participant UI as PlanificacionSecretaria.jsx
    participant Ctrl as excepcion.controller.js
    participant Model as excepcion.model.js
    participant DB as PostgreSQL

    Admin->>UI: Clic en "Aprobar" o "Rechazar" en la lista de solicitudes
    UI->>Ctrl: PUT /api/excepciones/:id (estado: 'Aprobado' / 'Rechazado')
    activate Ctrl
    
    alt Estado es 'Aprobado'
        Ctrl->>Model: resolverExcepcionAprobada(excepcion_id)
        activate Model
        Model->>DB: UPDATE excepciones_horario SET estado = 'Aprobado'
        Model->>DB: (Opcional) Reasignar horarios en base a los solicitados
        DB-->>Model: OK
        deactivate Model
    else Estado es 'Rechazado'
        Ctrl->>Model: resolverExcepcionRechazada(excepcion_id)
        activate Model
        Model->>DB: UPDATE excepciones_horario SET estado = 'Rechazado'
        DB-->>Model: OK
        deactivate Model
    end

    Ctrl-->>UI: Response JSON { success: true }
    deactivate Ctrl
    UI-->>Admin: Remueve o actualiza la solicitud en la interfaz de gestión
```

---

### 4.7. Módulo de Reportes y Estadísticas

#### CU: Consultar Estadísticas del Dashboard (Admin)
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrador
    participant UI as AdminDashboard.jsx
    participant api as api.js (Axios)
    participant Ctrl as estadisticas.controller.js
    participant Model as horario.model.js
    participant DB as PostgreSQL

    Admin->>UI: Carga la página principal
    UI->>api: GET /api/estadisticas
    activate api
    api->>Ctrl: GET /api/estadisticas
    activate Ctrl
    Ctrl->>Model: getResumenEstadisticas()
    activate Model
    Model->>DB: SELECT COUNT(docentes), COUNT(horarios), Ocupación aulas/labs
    DB-->>Model: Métricas calculadas
    deactivate Model
    Ctrl-->>api: JSON con estadísticas reales
    deactivate Ctrl
    api-->>UI: JSON con estadísticas reales
    deactivate api
    UI->>UI: Renderiza gráficos e indicadores clave en el Dashboard
```

#### CU: Exportar Reportes a PDF (Operacional, Gestión e Individual)
```mermaid
sequenceDiagram
    autonumber
    actor User as Usuario (Admin / Docente)
    participant UI as Reportes.jsx / MiHorario.jsx
    participant api as api.js (Axios)
    participant Ctrl as reportes.controller.js
    participant DB as PostgreSQL
    participant pdf as pdf.js (Utilidad)

    User->>UI: Clic en "Exportar a PDF"
    UI->>api: GET /api/reportes/... (operacional, gestion, etc.)
    activate api
    api->>Ctrl: GET /api/reportes/...
    activate Ctrl
    Ctrl->>DB: SELECT JOINs de Horarios, Cursos, Docentes, Ambientes
    DB-->>Ctrl: Registros estructurados
    Ctrl-->>api: JSON con la data
    deactivate Ctrl
    api-->>UI: JSON con la data
    deactivate api
    
    UI->>UI: Renderiza plantilla HTML oculta (estilo Tailwind en DOM)
    UI->>pdf: exportElementToPDF(elemento_oculto_id, filename)
    activate pdf
    pdf->>pdf: html2canvas(elemento, { scale: 2 })
    pdf-->>pdf: Canvas de alta resolución (imagen del reporte)
    pdf->>pdf: New jsPDF(A4, portrait)
    loop Mientras falte contenido (alto de imagen > alto A4)
        pdf->>pdf: Agregar página e imprimir fragmento
    end
    pdf-->>UI: Descarga del archivo PDF (filename.pdf)
    deactivate pdf
    UI-->>User: Descarga completada con éxito
```

---

## 6. Diagramas de Estado (De Todas las Entidades)

A continuación se modela el ciclo de vida y las transiciones de estado para cada una de las 12 entidades del sistema utilizando etiquetas breves y directas sin comillas ni etiquetas HTML para evitar problemas de visualización e incompatibilidad en lectores Markdown.

### 6.1. Docentes (`docentes`)
Controla el ciclo de vida del docente, la asignación de carga, el envío de credenciales y el estado de su turno de selección en el semestre activo.
```mermaid
stateDiagram-v2
    state "SIN CARGA" as SinCarga
    state "CON CARGA LECTIVA" as ConCargaLectiva
    state "PENDIENTE" as Pendiente
    state "NOTIFICADO" as Notificado
    state "EN PROGRESO" as EnProgreso
    state "COMPLETADO" as Completado

    SinCarga : Docente registrado en el sistema
    ConCargaLectiva : Cursos y grupos lectivos fijados
    Pendiente : Cuenta creada esperando envio
    Notificado : Credenciales enviadas por Brevo
    EnProgreso : Registro de disponibilidad y carga no lectiva
    Completado : Turno bloqueado y carga consolidada

    [*] --> SinCarga : Inicio de Ciclo
    SinCarga --> ConCargaLectiva : Secretaria asigna carga lectiva
    ConCargaLectiva --> Pendiente : Secretaria genera accesos masivos
    Pendiente --> Notificado : notificarTodos()
    Notificado --> EnProgreso : Docente inicia sesion
    EnProgreso --> EnProgreso : Modifica preferencias o declaracion
    EnProgreso --> Completado : Secretaria cierra turno
    Completado --> [*] : Cierre de Semestre
```

### 6.2. Cursos (`cursos`)
Controla la disponibilidad del curso para ser asignado en semestres activos.
```mermaid
stateDiagram-v2
    [*] --> Activo : Crear
    Activo --> Asignado : Asignar docente
    Asignado --> Programado : Programar horario
    Programado --> Activo : Limpiar horario
    Asignado --> Activo : Quitar asignacion
    Activo --> Inactivo : Desactivar
    Inactivo --> Activo : Reactivar
    Inactivo --> [*] : Dar de baja
```

### 6.3. Aulas (`aulas`)
Ciclo de ocupación física de un aula teoría/práctica.
```mermaid
stateDiagram-v2
    [*] --> Activa : Crear
    Activa --> Reservada : Asignar clase
    Reservada --> Activa : Liberar bloque
    Activa --> Inactiva : Mantenimiento
    Inactiva --> Activa : Habilitar
    Inactiva --> [*] : Dar de baja
```

### 6.4. Laboratorios (`laboratorios`)
Ciclo de ocupación física de laboratorios de cómputo/general.
```mermaid
stateDiagram-v2
    [*] --> Activo : Crear
    Activo --> Reservado : Asignar clase
    Reservado --> Activo : Liberar bloque
    Activo --> Inactivo : Mantenimiento
    Inactivo --> Activo : Habilitar
    Inactivo --> [*] : Dar de baja
```

### 6.5. Configuración (`configuracion`)
Estados de guardado de los parámetros operacionales del sistema.
```mermaid
stateDiagram-v2
    [*] --> Por_Defecto : Inicializar
    Por_Defecto --> Modificada : Editar parametros
    Modificada --> Guardada : Persistir en BD
    Guardada --> Modificada : Editar nuevamente
```

### 6.6. Asignación Docente-Curso (`asignacion_docente_curso`)
Controla la carga horaria vinculando el plantel con los cursos en un semestre activo.
```mermaid
stateDiagram-v2
    [*] --> Creada_Sin_Horario : Asignar
    Creada_Sin_Horario --> Programada : Programar
    Programada --> En_Conflicto : Reportar cruce
    En_Conflicto --> Programada : Reprogramar
    Programada --> Creada_Sin_Horario : Limpiar horario
    Creada_Sin_Horario --> [*] : Eliminar
```

### 6.7. Horarios (`horarios`)
Controla el estado de programación de un bloque de clase (generación automática o edición manual).
```mermaid
stateDiagram-v2
    [*] --> Generado_Automatico : Generacion automatica
    [*] --> Creado_Manual : Creacion manual
    Generado_Automatico --> Editado_Manual : Edicion manual
    Creado_Manual --> Editado_Manual : Edicion manual
    Generado_Automatico --> Confirmado : Oficializar
    Editado_Manual --> Confirmado : Oficializar
    Confirmado --> [*] : Cerrar ciclo
    Generado_Automatico --> [*] : Eliminar horario
    Editado_Manual --> [*] : Eliminar horario
```

### 6.8. Restricciones Horarias (`restricciones_horarias`)
Define la inamovibilidad o exclusión de rangos de horas para docentes.
```mermaid
stateDiagram-v2
    [*] --> Registrada : Crear
    Registrada --> Aplicada : Procesar
    Aplicada --> Inactiva : Cambiar disponibilidad
    Registrada --> Inactiva : Eliminar
```

### 6.9. Excepciones de Horario (`excepciones_horario`)
Estados del proceso de reconsideración de un bloque de horario asignado.
```mermaid
stateDiagram-v2
    [*] --> Pendiente : Solicitar
    Pendiente --> Aprobada : Aprobar
    Pendiente --> Rechazada : Rechazar
    Aprobada --> [*] : Finalizar
    Rechazada --> [*] : Finalizar
```

### 6.10. Disponibilidad Docente (`disponibilidad_docente`)
Ciclo de vida de las preferencias horarias declaradas por un profesor.
```mermaid
stateDiagram-v2
    [*] --> Registrada : Guardar
    Registrada --> Evaluada_Scheduler : Leer disponibilidad
    Evaluada_Scheduler --> Sobrescrita : Actualizar disponibilidad
    Sobrescrita --> Registrada : Guardar
    Registrada --> Eliminada : Limpiar
    Eliminada --> [*] : Finalizar
```

### 6.11. Carga No Lectiva (`carga_no_lectiva`)
Ciclo de vida del registro de horas de actividades no lectivas.
```mermaid
stateDiagram-v2
    [*] --> Creada : Inicializar
    Creada --> Actualizada : Guardar actividades
    Actualizada --> Total_Recalculado : Calcular total
    Total_Recalculado --> Actualizada : Editar carga
```

### 6.12. Horarios No Lectivos (`horarios_no_lectivos`)
Programación de bloques de carga no lectiva en la grilla horaria del docente.
```mermaid
stateDiagram-v2
    [*] --> Planificado : Seleccionar
    Planificado --> Validado : Validar cruces
    Validado --> Guardado : Guardar
    Guardado --> Modificado : Mover bloque
    Modificado --> Validado : Revalidar
    Guardado --> Eliminado : Eliminar
    Eliminado --> [*] : Finalizar
```
