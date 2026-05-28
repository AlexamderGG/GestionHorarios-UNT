import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DIAS_ORDEN = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

const getDiaIndex = (dia) => DIAS_ORDEN.indexOf(dia) + 1;

/**
 * Genera PDF de reporte por docente (landscape A4)
 */
export const generarPDFPorDocente = (data) => {
  const { docente, semestre, horarios, cursos, resumen } = data;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // Encabezado
  doc.setFillColor(37, 99, 235); // primary-600
  doc.rect(0, 0, pageW, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("UNIVERSIDAD NACIONAL DE TRUJILLO", pageW / 2, 10, { align: "center" });
  doc.setFontSize(11);
  doc.text("Facultad de Ingenieria - Escuela de Ingenieria de Sistemas", pageW / 2, 16, { align: "center" });

  // Subtitulo
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.text(`Reporte de Horario por Docente - Semestre ${semestre}`, 14, 32);

  // Info del docente
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Docente: ${docente.apellidos}, ${docente.nombres}`, 14, 40);
  doc.text(`Categoria: ${docente.categoria || "-"}`, 14, 45);
  doc.text(`Tipo: ${docente.tipo_nombramiento || "-"} | Especialidad: ${docente.especialidad || "-"}`, 14, 50);
  doc.text(`Antiguedad: ${docente.antiguedad_anios || 0} anios | Total horas: ${resumen.total_horas} | Cursos: ${resumen.total_cursos}`, 14, 55);

  // Tabla de horarios (grilla Lunes-Sabado x bloques)
  const horariosPorDia = {};
  DIAS_ORDEN.forEach((d) => (horariosPorDia[d] = []));
  horarios.forEach((h) => {
    if (horariosPorDia[h.dia]) horariosPorDia[h.dia].push(h);
  });

  // Si hay horarios, crear tabla por dia
  if (horarios.length > 0) {
    const bodyRows = [];
    const allHorariosSorted = [...horarios].sort(
      (a, b) => getDiaIndex(a.dia) - getDiaIndex(b.dia) || a.hora_inicio.localeCompare(b.hora_inicio)
    );

    allHorariosSorted.forEach((h) => {
      bodyRows.push([
        h.dia,
        `${h.hora_inicio} - ${h.hora_fin}`,
        `[${h.curso_codigo}] ${h.curso_nombre}`,
        `Ciclo ${h.curso_ciclo}`,
        h.aula_codigo ? `Aula ${h.aula_codigo}` : `Lab ${h.lab_codigo}`,
      ]);
    });

    autoTable(doc, {
      startY: 62,
      head: [["Dia", "Horario", "Curso", "Ciclo", "Ambiente"]],
      body: bodyRows,
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
      styles: { font: "helvetica", cellPadding: 2.5 },
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text("No hay horarios asignados para este docente en el semestre.", 14, 65);
  }

  // Pie de pagina - Lista de cursos
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 70;
  if (finalY < 170) {
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text("Cursos Asignados:", 14, finalY);

    const cursosBody = cursos.map((c) => [
      c.codigo,
      c.nombre,
      c.ciclo,
      c.tipo,
      `${c.horas}h`,
    ]);

    autoTable(doc, {
      startY: finalY + 4,
      head: [["Codigo", "Curso", "Ciclo", "Tipo", "Horas"]],
      body: cursosBody,
      theme: "grid",
      headStyles: { fillColor: [71, 85, 105], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });
  }

  doc.save(`Reporte_Docente_${docente.apellidos}_${semestre}.pdf`);
};

/**
 * Genera PDF de reporte por dia (landscape A4)
 */
export const generarPDFPorDia = (data) => {
  const { dia, semestre, horarios, docentes, ambientes, resumen } = data;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // Encabezado
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("UNIVERSIDAD NACIONAL DE TRUJILLO", pageW / 2, 10, { align: "center" });
  doc.setFontSize(11);
  doc.text("Facultad de Ingenieria - Escuela de Ingenieria de Sistemas", pageW / 2, 16, { align: "center" });

  // Subtitulo
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.text(`Reporte de Horarios - ${dia} - Semestre ${semestre}`, 14, 32);

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Total clases: ${resumen.total_clases} | Docentes: ${resumen.total_docentes} | Ambientes: ${resumen.total_ambientes}`, 14, 40);

  if (horarios.length > 0) {
    const bodyRows = horarios.map((h) => [
      `${h.hora_inicio} - ${h.hora_fin}`,
      `[${h.curso_codigo}] ${h.curso_nombre}`,
      `Ciclo ${h.curso_ciclo}`,
      `${h.docente_apellidos}, ${h.docente_nombres}`,
      h.aula_codigo ? `Aula ${h.aula_codigo}` : `Lab ${h.lab_codigo}`,
    ]);

    autoTable(doc, {
      startY: 46,
      head: [["Horario", "Curso", "Ciclo", "Docente", "Ambiente"]],
      body: bodyRows,
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text("No hay horarios para este dia en el semestre.", 14, 50);
  }

  // Pie - Docentes y ambientes
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 60;
  if (finalY < 160 && docentes.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text("Docentes que imparten clases este dia:", 14, finalY);

    autoTable(doc, {
      startY: finalY + 4,
      head: [["Docente", "Categoria"]],
      body: docentes.map((d) => [d.nombre, d.categoria || "-"]),
      theme: "grid",
      headStyles: { fillColor: [71, 85, 105], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });
  }

  const finalY2 = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : finalY + 20;
  if (finalY2 < 170 && ambientes.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text("Ambientes utilizados este dia:", 14, finalY2);

    autoTable(doc, {
      startY: finalY2 + 4,
      head: [["Codigo", "Nombre"]],
      body: ambientes.map((a) => [a.codigo, a.nombre || "-"]),
      theme: "grid",
      headStyles: { fillColor: [71, 85, 105], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });
  }

  doc.save(`Reporte_${dia}_${semestre}.pdf`);
};

/**
 * Genera PDF de reporte por aula/laboratorio (landscape A4)
 */
export const generarPDFPorAula = (data) => {
  const { ambiente, tipo, semestre, horarios, docentes, resumen } = data;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // Encabezado
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("UNIVERSIDAD NACIONAL DE TRUJILLO", pageW / 2, 10, { align: "center" });
  doc.setFontSize(11);
  doc.text("Facultad de Ingenieria - Escuela de Ingenieria de Sistemas", pageW / 2, 16, { align: "center" });

  // Subtitulo
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.text(`Reporte de ${tipo}: ${ambiente.codigo} - Semestre ${semestre}`, 14, 32);

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Nombre: ${ambiente.nombre || "-"} | Capacidad: ${ambiente.capacidad || "-"} | Total clases: ${resumen.total_clases}`, 14, 40);

  if (horarios.length > 0) {
    const bodyRows = horarios.map((h) => [
      h.dia,
      `${h.hora_inicio} - ${h.hora_fin}`,
      `[${h.curso_codigo}] ${h.curso_nombre}`,
      `Ciclo ${h.curso_ciclo}`,
      `${h.docente_apellidos}, ${h.docente_nombres}`,
    ]);

    autoTable(doc, {
      startY: 46,
      head: [["Dia", "Horario", "Curso", "Ciclo", "Docente"]],
      body: bodyRows,
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text("No hay horarios asignados para este ambiente en el semestre.", 14, 50);
  }

  // Pie - Docentes que usan el ambiente
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 60;
  if (finalY < 170 && docentes.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text("Docentes que utilizan este ambiente:", 14, finalY);

    autoTable(doc, {
      startY: finalY + 4,
      head: [["Docente", "Categoria"]],
      body: docentes.map((d) => [d.nombre, d.categoria || "-"]),
      theme: "grid",
      headStyles: { fillColor: [71, 85, 105], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });
  }

  doc.save(`Reporte_${tipo}_${ambiente.codigo}_${semestre}.pdf`);
};

/**
 * Genera PDF de reporte operacional (por ambiente)
 */
export const generarPDFOperacional = (data, semestre) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("UNIVERSIDAD NACIONAL DE TRUJILLO", pageW / 2, 10, { align: "center" });
  doc.setFontSize(11);
  doc.text("Facultad de Ingenieria - Escuela de Ingenieria de Sistemas", pageW / 2, 16, { align: "center" });

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.text(`Reporte Operacional de Horarios - Semestre ${semestre}`, 14, 32);

  Object.keys(data).forEach((ambienteKey) => {
    const items = data[ambienteKey];
    const bodyRows = [];
    let lastDia = null;

    items.forEach((item) => {
      if (item.dia !== lastDia) {
        if (lastDia !== null) bodyRows.push([{ content: "", colSpan: 3, styles: { fillColor: [226, 232, 240], minCellHeight: 2 } }]);
        bodyRows.push([
          { content: item.dia.toUpperCase(), colSpan: 3, styles: { fillColor: [241, 245, 249], fontStyle: "bold", fontSize: 9 } },
        ]);
        lastDia = item.dia;
      }
      bodyRows.push([
        `${item.hora_inicio} - ${item.hora_fin}`,
        item.curso?.nombre || "-",
        `${item.docente?.apellidos || ""}, ${item.docente?.nombres || ""}`,
      ]);
    });

    autoTable(doc, {
      startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 40,
      head: [[{ content: ambienteKey, colSpan: 3, styles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 11 } }]],
      body: bodyRows,
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: "auto" },
        2: { cellWidth: 60 },
      },
    });
  });

  doc.save(`Reporte_Operacional_${semestre}.pdf`);
};

/**
 * Genera PDF de reporte de gestion
 */
export const generarPDFGestion = (data, semestre) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("UNIVERSIDAD NACIONAL DE TRUJILLO", pageW / 2, 10, { align: "center" });
  doc.setFontSize(11);
  doc.text("Facultad de Ingenieria - Escuela de Ingenieria de Sistemas", pageW / 2, 16, { align: "center" });

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.text(`Reporte de Gestion Docente - Semestre ${semestre}`, 14, 32);

  const bodyRows = data.map((d) => [
    d.nombre,
    d.categoria || "-",
    `${d.antiguedad_anios || 0} anios`,
    `${d.horas} hrs`,
  ]);

  autoTable(doc, {
    startY: 40,
    head: [["Docente", "Categoria", "Antiguedad", "Horas Asignadas"]],
    body: bodyRows,
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 10 },
    bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`Reporte_Gestion_${semestre}.pdf`);
};

/**
 * Genera PDF completo de horarios por ciclo (landscape A4)
 * Incluye encabezado institucional, lista de docentes y grilla por ciclo
 */
export const generarPDFHorariosCompletos = ({
  semestre,
  ciclosActivos,
  horariosPorCiclo,
  asignaciones,
  cursos,
  docentes,
  bloques,
}) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const DIAS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];

  const timeToMinutes = (t) => {
    const [h, m] = String(t).slice(0, 5).split(":").map(Number);
    return h * 60 + m;
  };

  const horarioEnBloque = (dia, bloqueInicio, bloqueFin, horariosDelCiclo) => {
    const bloqueIniMin = timeToMinutes(bloqueInicio);
    const bloqueFinMin = timeToMinutes(bloqueFin);
    return horariosDelCiclo.find((h) => {
      if (h.dia !== dia) return false;
      const hIniMin = timeToMinutes(h.hora_inicio);
      const hFinMin = timeToMinutes(h.hora_fin);
      return hIniMin <= bloqueIniMin && hFinMin >= bloqueFinMin;
    });
  };

  // Calcular resumen de docentes por ciclo
  const getResumenDocentesCiclo = (ciclo) => {
    const asignacionesCiclo = asignaciones.filter((a) => {
      const curso = cursos.find((c) => c.id === a.curso_id);
      return curso?.ciclo === Number(ciclo) && a.semestre_asignacion === semestre;
    });

    const map = new Map();
    asignacionesCiclo.forEach((a) => {
      const curso = cursos.find((c) => c.id === a.curso_id);
      const docente = docentes.find((d) => d.id === a.docente_id);
      const horas = a.tipo === "Teoria" ? curso?.horas_aula || 0 : curso?.horas_lab || 0;
      const key = `${docente?.id}-${curso?.id}-${a.tipo}`;
      if (!map.has(key)) {
        map.set(key, {
          docente: docente ? `${docente.apellidos}, ${docente.nombres}` : "—",
          curso: curso ? `${curso.codigo} - ${curso.nombre}` : "—",
          tipo: a.tipo,
          horas: Number(horas),
          escuela: docente?.escuela || "—",
        });
      }
    });
    return Array.from(map.values());
  };

  const anioAcademico = semestre.split("-")[0] || "2026";

  let startY = 0;
  let isFirstPage = true;

  ciclosActivos.forEach((ciclo, cicloIdx) => {
    const horariosCiclo = horariosPorCiclo[ciclo] || [];
    const resumenDocentes = getResumenDocentesCiclo(ciclo);

    // Nueva pagina si no es la primera
    if (!isFirstPage) {
      doc.addPage();
      startY = 0;
    }
    isFirstPage = false;

    // === ENCABEZADO INSTITUCIONAL ===
    doc.setFillColor(37, 99, 235);
    doc.rect(0, startY, pageW, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("UNIVERSIDAD NACIONAL DE TRUJILLO", pageW / 2, startY + 10, { align: "center" });
    doc.setFontSize(11);
    doc.text("Facultad de Ingenieria - Escuela de Ingenieria de Sistemas", pageW / 2, startY + 16, { align: "center" });

    // === SECCION DE DATOS (2 columnas) ===
    const datosY = startY + 30;

    // Columna izquierda: Datos institucionales
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, datosY, pageW / 2 - 20, 30, 2, 2, "F");
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("DATOS INSTITUCIONALES", 18, datosY + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Universidad: Universidad Nacional de Trujillo`, 18, datosY + 14);
    doc.text(`Escuela: Escuela de Ingenieria de Sistemas`, 18, datosY + 19);
    doc.text(`Ciclo: ${ciclo}`, 18, datosY + 24);
    doc.text(`Anio Academico: ${anioAcademico} | Semestre: ${semestre}`, 18, datosY + 29);

    // Columna derecha: Resumen de docentes
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(pageW / 2 + 6, datosY, pageW / 2 - 20, 34, 2, 2, "F");
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("DOCENTES ASIGNADOS", pageW / 2 + 10, datosY + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    let lineY = datosY + 12;
    resumenDocentes.forEach((r) => {
      if (lineY < datosY + 28) {
        const texto = `${r.docente} | ${r.curso} | ${r.tipo} | ${r.horas}h`;
        doc.text(texto, pageW / 2 + 10, lineY, { maxWidth: pageW / 2 - 24 });
        lineY += 5.5;
      }
    });

    if (resumenDocentes.length === 0) {
      doc.text("Sin asignaciones", pageW / 2 + 10, datosY + 14);
    }

    // === GRILLA DE HORARIO ===
    const grillaY = datosY + 40;

    if (horariosCiclo.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text("No hay horarios generados para este ciclo.", 14, grillaY + 10);
      startY = grillaY + 20;
      return;
    }

    // Preparar body de la tabla
    const bodyRows = [];
    bloques.forEach((bloque) => {
      const row = [`${bloque.inicio} - ${bloque.fin}`];
      DIAS.forEach((dia) => {
        const h = horarioEnBloque(dia, bloque.inicio, bloque.fin, horariosCiclo);
        if (h) {
          row.push(`${h.curso?.codigo}\n${h.docente?.apellidos?.split(" ")[0] || ""}\n${h.aula?.codigo || h.laboratorio?.codigo || ""}`);
        } else {
          row.push("");
        }
      });
      bodyRows.push(row);
    });

    autoTable(doc, {
      startY: grillaY,
      head: [["Bloque", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes"]],
      body: bodyRows,
      theme: "grid",
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontSize: 9,
        halign: "center",
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59],
        valign: "top",
        cellPadding: 1.5,
      },
      columnStyles: {
        0: { cellWidth: 30, fontStyle: "bold", fontSize: 8 },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
      styles: { font: "helvetica", lineColor: [203, 213, 225] },
      didDrawPage: (data) => {
        // Footer en cada pagina
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Scheduling UNT - Escuela de Ingenieria de Sistemas - ${semestre}`, pageW / 2, pageH - 8, { align: "center" });
      },
    });

    startY = doc.lastAutoTable ? doc.lastAutoTable.finalY : grillaY;
  });

  doc.save(`Horarios_Completos_${semestre}.pdf`);
};
