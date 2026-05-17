# Módulo 4 - Desarrollo asignado a Alexander

> Implementado por: Alexander  
> Rama sugerida: `modulo4/reportes-frontend`  
> Dependencias principales: React, Tailwind CSS, Axios, jsPDF, html2canvas (Frontend); pg, Express (Backend)  
> Alcance: Generación y exportación de reportes analíticos y operativos en PDF, vista de horario individual por docente y construcción de endpoints SQL analíticos.

---

## 1. Descripción general

Este módulo abarca la implementación completa de la capa de reportes del sistema **Scheduling UNT**, operando tanto en el Frontend como en el Backend. Permite a los administradores extraer, visualizar y descargar en formato PDF estructurado la información generada por el motor de horarios.

El desarrollo consistió en enriquecer la interfaz de usuario con plantillas de impresión ocultas de alta calidad visual, apoyadas por consultas SQL cruzadas (`JOINs`) directamente en la base de datos PostgreSQL para consolidar la data requerida.

---

## 2. Objetivo del módulo

El objetivo principal del Módulo 4 es traducir la complejidad de la matriz general de horarios en documentos formales, portables e imprimibles. Específicamente:

* Proveer un **Reporte Operacional** detallado que desglose el uso de cada ambiente (Aula o Laboratorio) por día y hora.
* Proveer un **Reporte de Gestión** que analice la carga horaria consolidada de cada docente, evaluando su categoría y antigüedad.
* Permitir la consulta rápida en pantalla del **Horario Individual** de un docente específico y su respectiva exportación a PDF.
* Garantizar que la generación de PDFs ocurra en el lado del cliente (Frontend) de manera asíncrona, sin bloquear la interfaz ni requerir servicios pesados en el servidor.

---

## 3. Archivos creados / modificados

### Frontend (Interfaz y Utilidades)

* `frontend/src/pages/Reportes.jsx`: Vista principal del módulo. Se refactorizó completamente para conectarse a la API mediante Axios. Incluye la interfaz de usuario, la lógica de estados de carga y la estructuración de plantillas HTML ocultas (`absolute top-[-9999px]`) optimizadas para impresión.
* `frontend/src/utils/pdf.js`: Nuevo archivo de utilidades. Contiene la función `exportElementToPDF` que abstrae la configuración de `html2canvas` (escalado, CORS) y `jsPDF` (dimensiones A4, cálculo de múltiples páginas).

### Backend (Endpoints de Datos Analíticos)

* `backend/src/routes/reportes.routes.js`: Se reemplazaron las respuestas `mock` (pendientes de implementación) por consultas SQL reales y complejas utilizando el `pool` de conexiones a PostgreSQL.

---

## 4. Funcionalidades implementadas

### 4.1. Endpoint y Reporte Operacional (Ambientes)
* **Backend:** Se creó una consulta SQL cruzando las tablas `horarios`, `asignacion_docente_curso`, `cursos`, `docentes`, `aulas` y `laboratorios`. Retorna un JSON estructurado agrupado por ambiente (Ej. "Aula A101" o "Laboratorio LAB02").
* **Frontend:** Al solicitarlo, el DOM dibuja una tabla limpia con bordes definidos. Se extrae este nodo HTML invisible, se rasteriza y se descarga automáticamente como `Reporte_Operacional_Horarios.pdf`.

### 4.2. Endpoint y Reporte de Gestión (Carga Docente)
* **Backend:** Implementa un análisis SQL que calcula la sumatoria de las horas de clase de cada profesor usando operaciones matemáticas de tiempo en Postgres (`SUM(EXTRACT(EPOCH FROM ...))`), filtrando solo a los docentes activos.
* **Frontend:** Presenta una tabla resumida estilo informe gerencial con la categoría, antigüedad y carga horaria en formato `Reporte_Gestion_Docentes.pdf`.

### 4.3. Vista Dinámica y PDF de Horario Individual
* **Interactividad:** Un `select` carga la lista en vivo de todos los docentes. Al elegir uno, se hace un llamado a `GET /api/reportes/docente/:id`.
* **Vista en pantalla:** Dibuja el horario del docente directamente en la pantalla de manera reactiva, mostrando los bloques, cursos y ambientes asignados.
* **Exportación aislada:** Un botón exclusivo permite convertir esa tabla específica en el documento `Horario_Docente_{id}.pdf`.

### 4.4. Motor de Exportación Frontend (`pdf.js`)
* Se configuró `html2canvas` con `scale: 2` para garantizar que los textos en el PDF mantengan su nitidez y no se vean pixelados.
* Se implementó lógica matemática para calcular el alto de la imagen contra el alto de una hoja A4 (297mm x 210mm). Si el reporte es muy largo (ej. un reporte operacional de muchas páginas), el algoritmo recorta y añade nuevas páginas al PDF automáticamente mediante un bucle `while`.

---

## 5. Integración con otros módulos

* **Con el Módulo 1:** Consume `/api/docentes` para poblar el menú desplegable de búsqueda de profesores. Respeta los nombres reales de las tablas de datos maestros (como `asignacion_docente_curso`) en sus queries SQL.
* **Con el Módulo 2:** Depende críticamente de la tabla `horarios`. Si el Módulo 2 (Jersson) no ha ejecutado el algoritmo de generación, las consultas analíticas del Módulo 4 devolverán arreglos vacíos de forma segura, y el frontend mostrará mensajes amigables como *"No hay asignaciones registradas"*.

---

## 6. Decisiones de diseño y UI/UX

* **Plantillas Ocultas para PDF:** En lugar de intentar dibujar el PDF directamente con coordenadas (lo cual es tedioso y difícil de mantener), se optó por diseñar las plantillas de reporte usando **Tailwind CSS**. Estas plantillas se renderizan fuera de la pantalla (`top-[-9999px]`), permitiendo usar el poder de HTML/CSS para el diseño, y luego `html2canvas` simplemente "le toma una foto" a esa estructura perfecta.
* **Asincronismo Transparente:** La generación de PDF puede tomar un par de segundos. Se implementaron estados `loadingReporte` que deshabilitan los botones y cambian su texto a "Procesando..." para evitar clics múltiples y mejorar la respuesta visual.
* **Fallo Silencioso (Fallback):** Si un docente no tiene horarios asignados, el panel no se rompe; muestra un estado vacío (Empty State) informativo.

---

## 7. Posibles preguntas del docente

### ¿Por qué la generación del PDF se hace en el Frontend y no en el Backend?
Delegar la generación del PDF al frontend (navegador del cliente) aligera significativamente la carga del servidor Node.js. Generar PDFs en el backend con librerías como Puppeteer consume mucha memoria RAM por cada petición. Con `jsPDF` y `html2canvas`, el servidor solo envía datos en texto (JSON, unos pocos kilobytes) y el dispositivo del usuario hace el trabajo pesado del renderizado.

### ¿Cómo manejas reportes muy largos que no caben en una sola página?
El script de `pdf.js` calcula el alto en píxeles que generó el DOM y lo mapea al tamaño milimétrico de una hoja A4. Si detecta que sobra altura (`heightLeft >= 0`), invoca `pdf.addPage()` y empuja la imagen hacia arriba calculando la diferencia, simulando saltos de página precisos.

### ¿Qué ocurre si la base de datos está vacía y descargo un reporte?
El backend enviará un arreglo o un objeto vacío (`[]` o `{}`). El frontend está protegido contra esto mediante renderizados condicionales (operadores ternarios). En el PDF simplemente se imprimirá el encabezado oficial y un texto indicando "No hay datos registrados en el semestre".

### ¿Por qué tuviste que modificar `reportes.routes.js` en el backend si tu módulo es frontend?
El contrato de la API definía que el backend debía entregar los datos ya estructurados. Aunque mi rol principal era la vista, construí las consultas SQL necesarias (con múltiples JOINs y agregaciones) para garantizar que mi interfaz recibiera la data exacta en el formato correcto, logrando que el sistema sea completamente end-to-end.

---

## 8. Conclusión

El Módulo 4 cierra el ciclo funcional del sistema. Mientras los otros módulos alimentan, procesan y grafican los datos interactivos, este módulo proporciona el mecanismo oficial para exportar la información académica a formatos tangibles (PDF). Destaca por su uso eficiente del DOM para crear plantillas de impresión, una experiencia de usuario sin bloqueos y consultas SQL optimizadas que consolidan toda la complejidad relacional de la universidad en documentos simples y listos para usar.
