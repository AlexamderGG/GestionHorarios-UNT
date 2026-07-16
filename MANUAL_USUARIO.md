# Manual de Usuario — Scheduling UNT

## Sistema de Gestión Automática de Horarios Académicos

**Universidad Nacional de Trujillo — Escuela de Ingeniería de Sistemas**

> Versión: 1.0  
> Fecha: Julio 2026  
> Plataforma web: [https://gestion-horarios-sistemas-unt.vercel.app/](https://gestion-horarios-sistemas-unt.vercel.app/)

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Acceso al Sistema](#2-acceso-al-sistema)
3. [Credenciales de Acceso](#3-credenciales-de-acceso)
4. [Panel de Administración](#4-panel-de-administración)
   - 4.1 [Dashboard Principal](#41-dashboard-principal)
   - 4.2 [Gestión de Docentes](#42-gestión-de-docentes)
   - 4.3 [Gestión de Cursos](#43-gestión-de-cursos)
   - 4.4 [Gestión de Ambientes (Aulas y Laboratorios)](#44-gestión-de-ambientes-aulas-y-laboratorios)
   - 4.5 [Asignación de Cursos a Docentes](#45-asignación-de-cursos-a-docentes)
   - 4.6 [Generación y Gestión de Horarios](#46-generación-y-gestión-de-horarios)
   - 4.7 [Estado de Selección de Docentes](#47-estado-de-selección-de-docentes)
   - 4.8 [Gestión de Excepciones](#48-gestión-de-excepciones)
   - 4.9 [Panel de Secretaría](#49-panel-de-secretaría)
   - 4.10 [Planificación de Secretaría](#410-planificación-de-secretaría)
   - 4.11 [Plan de Estudios](#411-plan-de-estudios)
   - 4.12 [Reportes y Exportación PDF](#412-reportes-y-exportación-pdf)
   - 4.13 [Configuración del Sistema](#413-configuración-del-sistema)
5. [Portal del Docente](#5-portal-del-docente)
   - 5.1 [Mis Cursos Asignados](#51-mis-cursos-asignados)
   - 5.2 [Mi Horario Semanal](#52-mi-horario-semanal)
   - 5.3 [Selección de Horario](#53-selección-de-horario)
   - 5.4 [Mis Excepciones](#54-mis-excepciones)
   - 5.5 [Mis Disponibilidades](#55-mis-disponibilidades)
   - 5.6 [Carga Horaria](#56-carga-horaria)
   - 5.7 [Horario No Lectivo](#57-horario-no-lectivo)
6. [Flujo de Trabajo General](#6-flujo-de-trabajo-general)
7. [Preguntas Frecuentes](#7-preguntas-frecuentes)

---

## 1. Introducción

**Scheduling UNT** es una aplicación web diseñada para la gestión automática de horarios académicos de la Escuela de Ingeniería de Sistemas de la Universidad Nacional de Trujillo. El sistema permite:

- Gestionar datos maestros: docentes, cursos, aulas y laboratorios.
- Asignar cursos a docentes de forma manual o automática, respetando la jerarquía docente.
- Generar horarios automáticamente evitando conflictos de docentes y ambientes.
- Permitir a los docentes seleccionar sus propios horarios.
- Exportar reportes analíticos y operativos en formato PDF.
- Gestionar excepciones, disponibilidades y restricciones horarias.

**Requisitos del navegador:**
- Google Chrome (última versión recomendada)
- Mozilla Firefox
- Microsoft Edge
- Safari

El sistema es responsivo y funciona tanto en computadoras de escritorio como en dispositivos móviles.

---

## 2. Acceso al Sistema

Para acceder al sistema, abra su navegador web e ingrese la siguiente dirección:

```
https://gestion-horarios-sistemas-unt.vercel.app/
```

Se mostrará la pantalla de inicio de sesión con el formulario de acceso.

### Proceso de login

1. En el campo **"Usuario o Correo"**, ingrese:
   - **Administrador:** escriba `admin`
   - **Docente:** escriba su correo electrónico institucional (ejemplo: `c.ramirez@unt.edu.pe`)
2. En el campo **"Contraseña"**, ingrese la contraseña correspondiente.
3. Haga clic en el botón **"Ingresar al Sistema"**.
4. Si las credenciales son correctas, será redirigido automáticamente al panel correspondiente a su rol.

> **Nota:** Si el texto ingresado contiene el símbolo `@`, el sistema asume que es un docente e intenta autenticarlo como tal. Si no contiene `@`, se autentica como administrador.

---

## 3. Credenciales de Acceso

### Administrador

| Campo | Valor |
|-------|-------|
| **Usuario** | `admin` |
| **Contraseña** | `admin123` |

### Docente

| Campo | Valor |
|-------|-------|
| **Correo** | Correo electrónico asignado (ejemplo: `c.ramirez@unt.edu.pe`) |
| **Contraseña** | `docente123` |

#### Correos de docentes de prueba incluidos en el sistema

| Docente | Correo | Especialidad | Tipo |
|---------|--------|--------------|------|
| C. Ramírez | `c.ramirez@unt.edu.pe` | Ingeniería de Sistemas | Nombrado |
| J. Pérez | `j.perez@unt.edu.pe` | Matemáticas | Contratado |
| P. Sánchez | `p.sanchez@unt.edu.pe` | Física | Contratado |
| C. Torres | `c.torres@unt.edu.pe` | Comunicación | Contratado |
| F. Rojas | `f.rojas@unt.edu.pe` | Música | Contratado |
| I. Luna | `i.luna@unt.edu.pe` | Danza Folklórica | Contratado |

> Todos los docentes de prueba usan la contraseña: `docente123`

---

## 4. Panel de Administración

Al iniciar sesión como administrador, será redirigido al Dashboard principal (`/admin`).

---

### 4.1 Dashboard Principal

**Ruta:** `/admin` o `/admin/dashboard`

El dashboard muestra una vista general del estado del sistema con las siguientes secciones:

- **Indicadores clave:** Total de docentes activos, cursos activos, aulas activas y laboratorios activos.
- **Porcentaje de ocupación:** Gráfico que indica el porcentaje de ambientes ocupados frente al total disponible.
- **Distribución Teoría vs Laboratorio:** Gráfico de distribución de clases entre teoría y laboratorio.
- **Carga horaria por docente:** Gráfico que muestra la distribución de horas semanales asignadas a cada docente.
- **Uso por ambiente:** Gráfico que indica cuántas clases se programaron en cada aula y laboratorio.

Todos los gráficos se actualizan automáticamente al cambiar el semestre activo desde la configuración.

---

### 4.2 Gestión de Docentes

**Ruta:** `/admin/docentes`

Permite administrar el registro completo de docentes del sistema.

#### Funcionalidades disponibles

- **Listar docentes:** Tabla con todos los docentes activos mostrando nombre, apellidos, email, categoría, tipo de nombramiento, especialidad y antigüedad.
- **Crear docente:** Haga clic en el botón **"Nuevo Docente"** y complete el formulario con los siguientes campos:

| Campo | Descripción | Obligatorio |
|-------|-------------|-------------|
| Nombres | Nombre completo del docente | Sí |
| Apellidos | Apellidos del docente | Sí |
| Email | Correo electrónico (debe ser único) | Sí |
| Teléfono | Número de contacto | No |
| Categoría | Principal, Asociado, Auxiliar o Jefe de Práctica | Sí |
| Tipo de Nombramiento | Nombrado o Contratado | Sí |
| Especialidad | Área de conocimiento (ej: Ingeniería de Sistemas, Matemáticas) | Sí |
| Escuela | Escuela de procedencia | No |
| Semestre de Contrato | Solo para contratados por semestre específico | No |
| Antigüedad (años) | Años de servicio | Sí |

- **Editar docente:** Haga clic en el ícono de edición en la tabla.
- **Eliminar docente:** Haga clic en el ícono de eliminación. El sistema realiza un *soft-delete* (el registro se desactiva sin eliminarlo físicamente para preservar la integridad referencial).

#### Reglas de validación

- El correo electrónico debe ser único en el sistema.
- La categoría debe ser una de: Principal, Asociado, Auxiliar o Jefe de Práctica.
- La antigüedad no puede ser negativa.
- Docentes contratados con semestre de contrato definido solo están disponibles para ese semestre.

---

### 4.3 Gestión de Cursos

**Ruta:** Administrable desde las secciones de asignaciones y plan de estudios.

Los cursos están pre-cargados en el sistema con los 77 cursos reales de la Escuela de Ingeniería de Sistemas, organizados en 10 ciclos. Cada curso tiene:

| Campo | Descripción |
|-------|-------------|
| Código | Código único del curso (ej: EG-101, EL-301) |
| Nombre | Nombre completo del curso |
| Créditos | Número de créditos |
| Ciclo | Ciclo del plan de estudios (1-10) |
| Especialidad | Área de conocimiento del curso |
| Horas Aula | Horas semanales de teoría/práctica en aula |
| Horas Lab | Horas semanales de laboratorio |

---

### 4.4 Gestión de Ambientes (Aulas y Laboratorios)

**Ruta:** `/admin/ambientes`

#### Aulas

Las aulas son espacios destinados para clases de teoría y práctica general. Cada aula tiene:

- **Código:** Identificador único (ej: A101)
- **Nombre:** Nombre descriptivo
- **Capacidad:** Número máximo de estudiantes
- **Ubicación:** Edificio o piso
- **Tipo:** Tipo de aula

#### Laboratorios

Los laboratorios son de **uso general** (no tienen especialidad asignada). Cualquier curso puede reservar cualquier laboratorio según sus horas de laboratorio (`horas_lab`). Cada laboratorio tiene:

- **Código:** Identificador único (ej: LAB01)
- **Nombre:** Nombre descriptivo
- **Capacidad:** Número máximo de estudiantes
- **Ubicación:** Edificio o piso

#### Funcionalidades

- Listar, crear, editar y eliminar aulas y laboratorios.
- Los ambientes se desactivan con *soft-delete* para preservar registros históricos.

---

### 4.5 Asignación de Cursos a Docentes

**Ruta:** `/admin/asignaciones`

Esta sección permite asignar cursos a docentes, que es el paso previo necesario para que el generador automático de horarios funcione.

#### Asignación Manual

1. Seleccione el **docente** del menú desplegable.
2. Seleccione el **curso** a asignar.
3. Defina el **tipo**: Teoría o Laboratorio.
4. (Opcional) Seleccione un **ambiente preferido**.
5. El sistema asigna automáticamente el semestre activo y el ciclo del curso.
6. Haga clic en **"Asignar"**.

#### Asignación Automática

Haga clic en el botón **"Asignar Automático"** para que el sistema distribuya automáticamente los cursos entre los docentes disponibles. La asignación automática:

- Distribuye cursos buscando el docente con **menor carga horaria actual**.
- Respeta la **jerarquía docente**: Nombrados antes que Contratados.
- Respeta la **categoría**: Principal > Asociado > Auxiliar > Jefe de Práctica.
- Considera la **antigüedad** dentro de la misma categoría.
- **Valida especialidad:** Docentes contratados solo pueden dictar cursos que coincidan con su especialidad.
- **Límite de carga:** No puede exceder las 20 horas semanales por docente.

#### Limpiar Asignaciones

El botón **"Limpiar Todo"** elimina todas las asignaciones del semestre activo, permitiendo reasignar desde cero.

#### Indicador de carga horaria

La interfaz muestra un indicador visual de la carga horaria actual de cada docente, facilitando la toma de decisiones durante la asignación manual.

---

### 4.6 Generación y Gestión de Horarios

**Ruta:** `/admin/horarios`

Una vez que existan asignaciones docente-curso, puede generar los horarios automáticamente.

#### Generación Automática

1. Haga clic en el botón **"Generar Horarios"**.
2. El sistema toma todas las asignaciones del semestre activo.
3. El algoritmo de asignación automática ejecuta los siguientes pasos:
   - Lee la configuración del sistema (días hábiles, hora inicio/fin, duración de bloques).
   - Genera los bloques horarios válidos (excluye el horario de almuerzo de 13:00 a 14:00).
   - Ordena las asignaciones por jerarquía docente.
   - Para cada asignación, genera N sesiones según las horas del curso (`horas_aula` o `horas_lab`).
   - Ubica cada sesión en el primer bloque y ambiente disponible.
   - Si no se encuentra ubicación válida, registra el conflicto.
4. El sistema muestra un resumen con el número de horarios generados y los conflictos encontrados.

> Si ya existen horarios para el semestre, se solicitará confirmación para reemplazarlos.

#### Edición Manual de Horarios

Para modificar un horario generado automáticamente:

1. Localice el horario en la tabla de horarios.
2. Haga clic en el ícono de edición.
3. Modifique los campos deseados (día, hora de inicio, hora de fin, aula/laboratorio).
4. El sistema validará que la edición no genere conflictos con otros horarios del mismo docente o del mismo ambiente.

#### Consulta de Horarios

Puede filtrar horarios por:
- Semestre
- Docente
- Aula
- Laboratorio
- Día de la semana

---

### 4.7 Estado de Selección de Docentes

**Ruta:** `/admin/estado-docentes`

Muestra una tabla con el progreso de selección de horarios de cada docente. Indica qué docentes ya seleccionaron su horario y cuáles aún no lo han hecho, facilitando el seguimiento del proceso de planificación.

---

### 4.8 Gestión de Excepciones

**Ruta:** `/admin/excepciones`

Permite al administrador gestionar las excepciones registradas por los docentes. Desde esta sección se puede:

- Ver todas las excepciones registradas en el sistema.
- Aprobar o rechazar excepciones.
- Gestionar restricciones horarias de los docentes.

---

### 4.9 Panel de Secretaría

**Ruta:** `/admin/secretaria-turnos`

Panel destinado a la gestión de turnos de secretaría. Permite administrar los turnos asignados y el estado de la selección de horarios.

---

### 4.10 Planificación de Secretaría

**Ruta:** `/admin/planificacion`

Herramienta de planificación para secretaría que permite visualizar y gestionar la planificación general de horarios y asignaciones del periodo académico.

---

### 4.11 Plan de Estudios

**Ruta:** `/admin/plan-estudios`

Permite visualizar y gestionar el plan de estudios de la Escuela de Ingeniería de Sistemas, organizado por ciclos (1 al 10) y semestres. Muestra los cursos de cada ciclo con sus respectivas horas, créditos y especialidad.

---

### 4.12 Reportes y Exportación PDF

**Ruta:** `/admin/reportes`

El sistema genera tres tipos de reportes exportables a formato PDF:

#### Reporte Operacional (Ambientes)

- Muestra el uso detallado de cada ambiente (aula o laboratorio) por día y hora.
- Incluye el nombre del curso, el docente asignado y el horario exacto.
- Se exporta como archivo PDF con formato de tabla profesional.

**Para generar el reporte:**
1. Haga clic en el botón **"Generar Reporte Operacional"**.
2. El sistema mostrará una vista previa del documento.
3. Haga clic en **"Descargar PDF"** para descargar el archivo `Reporte_Operacional_Horarios.pdf`.

#### Reporte de Gestión (Carga Docente)

- Presenta un análisis consolidado de la carga horaria de cada docente.
- Incluye categoría, antigüedad, especialidad y horas semanales asignadas.
- Se exporta como `Reporte_Gestion_Docentes.pdf`.

**Para generar el reporte:**
1. Haga clic en el botón **"Generar Reporte de Gestión"**.
2. Revise la vista previa.
3. Haga clic en **"Descargar PDF"**.

#### Horario Individual por Docente

- Seleccione un docente del menú desplegable.
- El sistema carga y muestra su horario semanal en pantalla.
- Haga clic en **"Descargar PDF"** para exportar el horario individual como `Horario_Docente_{id}.pdf`.

> **Nota:** Si no hay horarios generados para el semestre actual, los reportes mostrarán un mensaje indicando "No hay datos registrados en el semestre".

---

### 4.13 Configuración del Sistema

**Ruta:** `/admin/configuracion`

Permite configurar los parámetros globales del sistema de horarios.

#### Parámetros configurables

| Parámetro | Descripción | Valores por Defecto |
|-----------|-------------|---------------------|
| **Semestre Activo** | Periodo académico actual. Determina qué ciclos están activos. | `2026-1` |
| **Días Hábiles** | Días de la semana en los que se programan clases. | Lunes a Viernes |
| **Hora de Inicio** | Hora de inicio de las clases. | `07:00` |
| **Hora de Fin** | Hora límite de las clases. | `22:00` |
| **Duración del Bloque** | Duración de cada bloque horario en minutos. | `120` (2 horas) |
| **Bloques por Día** | Número máximo de bloques por día. | `6` |

#### Relación Semestre - Ciclos Activos

El semestre activo determina qué ciclos del plan de estudios están en curso:

| Semestre | Ciclos Activos |
|----------|----------------|
| Termina en `-1` (impar) | Ciclos 1, 3, 5, 7, 9 |
| Termina en `-2` (par) | Ciclos 2, 4, 6, 8, 10 |

**Ejemplo:** Si el semestre activo es `2026-1`, se programarán cursos de los ciclos impares (1°, 3°, 5°, 7° y 9°).

---

## 5. Portal del Docente

Al iniciar sesión como docente, será redirigido a su panel personal (`/docente`).

---

### 5.1 Mis Cursos Asignados

**Ruta:** `/docente` o `/docente/cursos`

Muestra la lista de cursos que le han sido asignados para el semestre activo, incluyendo:

- Nombre y código del curso
- Tipo de asignación (Teoría o Laboratorio)
- Ciclo del curso
- Estado de la selección de horario (pendiente o seleccionado)

---

### 5.2 Mi Horario Semanal

**Ruta:** `/docente/horario`

Presenta una cuadrícula (grid) semanal que muestra todos los horarios seleccionados por el docente. La grilla usa bloques de 1 hora para que cursos de múltiples horas (2h, 3h, 4h) ocupen múltiples celdas consecutivas correctamente.

**Funcionalidades:**
- Visualización clara de todos los bloques por día y hora.
- Indicadores de curso, aula/laboratorio y tipo de clase.
- Botón para eliminar un horario propio si es necesario.

---

### 5.3 Selección de Horario

**Ruta:** `/docente/seleccionar`

Permite al docente elegir el día y hora de inicio para cada uno de sus cursos asignados.

#### Proceso de selección

1. Seleccione el **curso** del menú desplegable (se muestran solo los cursos pendientes de selección).
2. El sistema muestra automáticamente las **horas del curso** (`horas_aula` o `horas_lab`).
3. Seleccione el **día de la semana**.
4. Seleccione la **hora de inicio**.
5. La **hora de fin** se calcula automáticamente según la duración del curso.
6. El sistema muestra los **ambientes disponibles** (aulas o laboratorios) para ese día y horario.
7. Seleccione el ambiente preferido.
8. Haga clic en **"Seleccionar Horario"**.

#### Validaciones automáticas

El sistema valida automáticamente:
- **Conflicto de docente:** No permite que un docente tenga dos clases al mismo tiempo.
- **Conflicto de ambiente:** No permite que un aula o laboratorio se reserve dos veces en el mismo horario.
- **Restricciones horarias:** Respeta las restricciones horarias previamente registradas por el docente.
- **Disponibilidad del ambiente:** Solo muestra ambientes que no estén ocupados en el horario seleccionado.

---

### 5.4 Mis Excepciones

**Ruta:** `/docente/excepciones`

Permite al docente registrar y gestionar excepciones (días en los que no estará disponible). El docente puede:

- Crear una nueva excepción indicando el día, rango de horas y motivo.
- Ver el estado de sus excepciones registradas.
- Eliminar excepciones que aún no hayan sido procesadas.

---

### 5.5 Mis Disponibilidades

**Ruta:** `/docente/disponibilidad`

Permite al docente registrar su disponibilidad horaria semanal. Esta información es utilizada por el algoritmo de generación automática para optimizar la asignación de horarios.

---

### 5.6 Carga Horaria

**Ruta:** `/docente/carga-horaria`

Muestra un resumen de la carga horaria semanal del docente:

- Horas totales asignadas.
- Horas de teoría vs horas de laboratorio.
- Límite máximo de 20 horas semanales.
- Indicador visual de utilización.

---

### 5.7 Horario No Lectivo

**Ruta:** `/docente/horario-no-lectivo`

Muestra las actividades no lectivas programadas para el docente, como horas de atención, actividades administrativas u otras funciones asignadas que no son de enseñanza directa.

---

## 6. Flujo de Trabajo General

El flujo típico de uso del sistema es el siguiente:

```
┌─────────────────────────────────────────────────────────┐
│  PASO 1: Configurar el Semestre Activo                  │
│  Admin → Configuración → Definir semestre activo         │
│  (ej: 2026-1 para ciclos impares, 2026-2 para pares)    │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  PASO 2: Registrar/Gestionar Datos Maestros             │
│  Admin → Docentes / Cursos / Ambientes                  │
│  (Los datos están pre-cargados con seeds de prueba)      │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  PASO 3: Asignar Cursos a Docentes                      │
│  Admin → Asignaciones → Manual o Automático              │
│  (Se validan especialidad, límite 20h, disponibilidad)   │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  PASO 4: Generar Horarios                               │
│  Admin → Horarios → "Generar Horarios"                   │
│  (Algoritmo automático con prioridad docente)            │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  PASO 5: Docentes Seleccionan Horarios                  │
│  Docente → Seleccionar Horario → Elegir día y hora      │
│  (Se validan conflictos y restricciones)                 │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  PASO 6: Revisar y Exportar Reportes                    │
│  Admin → Reportes → Descargar PDFs                      │
│  (Operacional, Gestión, Horario Individual)              │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Preguntas Frecuentes

### ¿Qué debo hacer si olvidé mi contraseña?

Contacte al administrador del sistema para restablecer su contraseña.

### ¿Puedo cambiar mi horario después de haberlo seleccionado?

Sí. Diríjase a **Mi Horario** (`/docente/horario`) y haga clic en el ícono de eliminar junto al horario que desea cambiar. Luego regrese a **Seleccionar Horario** para elegir uno nuevo.

### ¿Qué pasa si no me asignaron ningún curso?

Contacte al administrador para que realice la asignación de cursos a su persona desde la sección **Asignaciones**.

### ¿El sistema genera conflictos automáticamente?

No. El algoritmo de generación automática está diseñado para **evitar** conflictos. Si no se encuentra una ubicación válida, la asignación se registra como conflicto y el admin debe resolverla manualmente.

### ¿Puedo usar el sistema desde mi celular?

Sí. La interfaz es responsiva y se adapta a diferentes tamaños de pantalla.

### ¿Cómo cambio el semestre activo?

Solo el administrador puede cambiar el semestre activo desde **Configuración** (`/admin/configuracion`). Al cambiar el semestre, los ciclos activos se ajustan automáticamente.

### ¿Qué significan las categorías docentes?

Las categorías determinan la prioridad en la asignación automática de horarios:

| Prioridad | Categoría |
|-----------|-----------|
| 1 (Mayor) | Principal |
| 2 | Asociado |
| 3 | Auxiliar |
| 4 (Menor) | Jefe de Práctica |

Además, los docentes **Nombrados** tienen prioridad sobre los **Contratados**.

### ¿Qué es el horario de almuerzo?

El sistema excluye automáticamente el bloque de **13:00 a 14:00** de la programación, respetando el horario de almuerzo institucional.

---

*Sistema desarrollado por la Escuela de Ingeniería de Sistemas — Universidad Nacional de Trujillo*
