import * as XLSX from "xlsx";

const DIAS_ORDEN = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

const saveWB = (wb, fileName) => {
  XLSX.writeFile(wb, fileName);
};

/**
 * Exporta reporte por docente a Excel
 */
export const exportarExcelPorDocente = (data) => {
  const { docente, semestre, horarios, cursos, resumen } = data;
  const wb = XLSX.utils.book_new();

  // Hoja 1: Horario
  const horarioRows = horarios.map((h) => ({
    Dia: h.dia,
    "Hora Inicio": h.hora_inicio,
    "Hora Fin": h.hora_fin,
    Curso: `[${h.curso_codigo}] ${h.curso_nombre}`,
    Ciclo: h.curso_ciclo,
    Ambiente: h.aula_codigo ? `Aula ${h.aula_codigo}` : `Lab ${h.lab_codigo}`,
  }));

  const wsHorario = XLSX.utils.json_to_sheet(horarioRows);
  XLSX.utils.book_append_sheet(wb, wsHorario, "Horario");

  // Hoja 2: Cursos
  const cursosRows = cursos.map((c) => ({
    Codigo: c.codigo,
    Curso: c.nombre,
    Ciclo: c.ciclo,
    Tipo: c.tipo,
    Horas: Number(c.horas),
  }));

  const wsCursos = XLSX.utils.json_to_sheet(cursosRows);
  XLSX.utils.book_append_sheet(wb, wsCursos, "Cursos");

  // Hoja 3: Resumen
  const resumenRows = [
    { Campo: "Docente", Valor: `${docente.apellidos}, ${docente.nombres}` },
    { Campo: "Categoria", Valor: docente.categoria || "-" },
    { Campo: "Tipo", Valor: docente.tipo_nombramiento || "-" },
    { Campo: "Especialidad", Valor: docente.especialidad || "-" },
    { Campo: "Antiguedad", Valor: `${docente.antiguedad_anios || 0} anios` },
    { Campo: "Semestre", Valor: semestre },
    { Campo: "Total Cursos", Valor: resumen.total_cursos },
    { Campo: "Total Horas", Valor: resumen.total_horas },
  ];

  const wsResumen = XLSX.utils.json_to_sheet(resumenRows);
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

  saveWB(wb, `Reporte_Docente_${docente.apellidos}_${semestre}.xlsx`);
};

/**
 * Exporta reporte por dia a Excel
 */
export const exportarExcelPorDia = (data) => {
  const { dia, semestre, horarios, docentes, ambientes, resumen } = data;
  const wb = XLSX.utils.book_new();

  // Hoja 1: Horarios
  const horarioRows = horarios.map((h) => ({
    "Hora Inicio": h.hora_inicio,
    "Hora Fin": h.hora_fin,
    Curso: `[${h.curso_codigo}] ${h.curso_nombre}`,
    Ciclo: h.curso_ciclo,
    Docente: `${h.docente_apellidos}, ${h.docente_nombres}`,
    Ambiente: h.aula_codigo ? `Aula ${h.aula_codigo}` : `Lab ${h.lab_codigo}`,
  }));

  const wsHorario = XLSX.utils.json_to_sheet(horarioRows);
  XLSX.utils.book_append_sheet(wb, wsHorario, "Horarios");

  // Hoja 2: Docentes
  const wsDocentes = XLSX.utils.json_to_sheet(docentes.map((d) => ({ Docente: d.nombre, Categoria: d.categoria || "-" })));
  XLSX.utils.book_append_sheet(wb, wsDocentes, "Docentes");

  // Hoja 3: Ambientes
  const wsAmbientes = XLSX.utils.json_to_sheet(ambientes.map((a) => ({ Codigo: a.codigo, Nombre: a.nombre || "-" })));
  XLSX.utils.book_append_sheet(wb, wsAmbientes, "Ambientes");

  // Hoja 4: Resumen
  const resumenRows = [
    { Campo: "Dia", Valor: dia },
    { Campo: "Semestre", Valor: semestre },
    { Campo: "Total Clases", Valor: resumen.total_clases },
    { Campo: "Total Docentes", Valor: resumen.total_docentes },
    { Campo: "Total Ambientes", Valor: resumen.total_ambientes },
  ];

  const wsResumen = XLSX.utils.json_to_sheet(resumenRows);
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

  saveWB(wb, `Reporte_${dia}_${semestre}.xlsx`);
};

/**
 * Exporta reporte por aula a Excel
 */
export const exportarExcelPorAula = (data) => {
  const { ambiente, tipo, semestre, horarios, docentes, resumen } = data;
  const wb = XLSX.utils.book_new();

  // Hoja 1: Horarios
  const horarioRows = horarios.map((h) => ({
    Dia: h.dia,
    "Hora Inicio": h.hora_inicio,
    "Hora Fin": h.hora_fin,
    Curso: `[${h.curso_codigo}] ${h.curso_nombre}`,
    Ciclo: h.curso_ciclo,
    Docente: `${h.docente_apellidos}, ${h.docente_nombres}`,
  }));

  const wsHorario = XLSX.utils.json_to_sheet(horarioRows);
  XLSX.utils.book_append_sheet(wb, wsHorario, "Horarios");

  // Hoja 2: Docentes
  const wsDocentes = XLSX.utils.json_to_sheet(docentes.map((d) => ({ Docente: d.nombre, Categoria: d.categoria || "-" })));
  XLSX.utils.book_append_sheet(wb, wsDocentes, "Docentes");

  // Hoja 3: Resumen
  const resumenRows = [
    { Campo: "Ambiente", Valor: `${tipo} ${ambiente.codigo}` },
    { Campo: "Nombre", Valor: ambiente.nombre || "-" },
    { Campo: "Capacidad", Valor: ambiente.capacidad || "-" },
    { Campo: "Semestre", Valor: semestre },
    { Campo: "Total Clases", Valor: resumen.total_clases },
    { Campo: "Total Docentes", Valor: resumen.total_docentes },
  ];

  const wsResumen = XLSX.utils.json_to_sheet(resumenRows);
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

  saveWB(wb, `Reporte_${tipo}_${ambiente.codigo}_${semestre}.xlsx`);
};

/**
 * Exporta reporte operacional a Excel
 */
export const exportarExcelOperacional = (data, semestre) => {
  const wb = XLSX.utils.book_new();

  Object.keys(data).forEach((ambienteKey) => {
    const items = data[ambienteKey];
    const rows = [];
    let lastDia = null;

    items.forEach((item) => {
      if (item.dia !== lastDia) {
        rows.push({ Dia: item.dia.toUpperCase(), Horario: "", Curso: "", Docente: "" });
        lastDia = item.dia;
      }
      rows.push({
        Dia: item.dia,
        Horario: `${item.hora_inicio} - ${item.hora_fin}`,
        Curso: item.curso?.nombre || "-",
        Docente: `${item.docente?.apellidos || ""}, ${item.docente?.nombres || ""}`,
      });
    });

    const wsName = ambienteKey.replace(/[^a-zA-Z0-9]/g, "").slice(0, 30);
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, wsName || "Reporte");
  });

  saveWB(wb, `Reporte_Operacional_${semestre}.xlsx`);
};

/**
 * Exporta reporte de gestion a Excel
 */
export const exportarExcelGestion = (data, semestre) => {
  const wb = XLSX.utils.book_new();
  const rows = data.map((d) => ({
    Docente: d.nombre,
    Categoria: d.categoria || "-",
    Antiguedad: `${d.antiguedad_anios || 0} anios`,
    "Horas Asignadas": d.horas,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Gestion");
  saveWB(wb, `Reporte_Gestion_${semestre}.xlsx`);
};
