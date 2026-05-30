import XLSX from "xlsx-js-style";

const saveWB = (wb, fileName) => {
  XLSX.writeFile(wb, fileName);
};

/**
 * ============================================================================
 * CLASE BUILDER: Permite construir hojas de Excel con múltiples tablas y 
 * encabezados en una sola pestaña (Imitando la estructura rica del PDF).
 * ============================================================================
 */
class ExcelReportBuilder {
  constructor(maxCols = 5) {
    this.aoa = []; // Array de Arrays (Matriz de celdas)
    this.merges = []; // Celdas combinadas
    this.sectionRows = new Set();
    this.tableHeaderRows = new Set();
    this.dataKeyCells = new Set();
    this.emptyRows = new Set();
    this.maxCols = maxCols;
  }

  padRow(arr) {
    const row = [...arr];
    while (row.length < this.maxCols) row.push("");
    return row;
  }

  addTitle(text) {
    const r = this.aoa.length;
    this.aoa.push(this.padRow([text]));
    this.merges.push({ s: { r, c: 0 }, e: { r, c: this.maxCols - 1 } });
  }

  addSubtitle(text) {
    const r = this.aoa.length;
    this.aoa.push(this.padRow([text]));
    this.merges.push({ s: { r, c: 0 }, e: { r, c: this.maxCols - 1 } });
  }

  addEmptyRow() {
    const r = this.aoa.length;
    this.aoa.push(this.padRow([]));
    this.emptyRows.add(r); // Para quitarle los bordes luego
  }

  addSection(text) {
    const r = this.aoa.length;
    this.aoa.push(this.padRow([text]));
    this.sectionRows.add(r);
    this.merges.push({ s: { r, c: 0 }, e: { r, c: this.maxCols - 1 } });
  }

  addKeyValueRow(pairs) {
    const r = this.aoa.length;
    const rowData = [];
    let c = 0;
    pairs.forEach(pair => {
      rowData.push(pair.k);
      this.dataKeyCells.add(`${r}-${c}`);
      c++;
      rowData.push(pair.v);
      c++;
    });
    this.aoa.push(this.padRow(rowData));
  }

  addRow(arr) {
    this.aoa.push(this.padRow(arr));
  }

  addTable(headers, dataRows) {
    const r = this.aoa.length;
    this.aoa.push(this.padRow(headers));
    this.tableHeaderRows.add(r);
    dataRows.forEach(row => this.aoa.push(this.padRow(row)));
  }

  build(colWidths = []) {
    const ws = XLSX.utils.aoa_to_sheet(this.aoa);
    if (this.merges.length > 0) ws['!merges'] = this.merges;

    if (ws["!ref"]) {
      const range = XLSX.utils.decode_range(ws["!ref"]);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
          if (!ws[cellRef]) continue;

          // ESTILO BASE CON BORDES FUERTES (Delineado)
          let style = {
            font: { name: "Arial", sz: 10, color: { rgb: "111827" } },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } },
            },
            alignment: { vertical: "center", horizontal: "left", wrapText: true },
            fill: { fgColor: { rgb: "FFFFFF" } }
          };

          // APLICACIÓN DE COLORES SEGÚN TIPO DE FILA
          if (this.emptyRows.has(R)) {
            style.border = null; // Quita los bordes en separadores
            style.fill = null;
          } else if (R === 0) { // Título UNT
            style.font = { name: "Arial", sz: 14, bold: true, color: { rgb: "FFFFFF" } };
            style.fill = { fgColor: { rgb: "1D4ED8" } }; // blue-700
            style.alignment.horizontal = "center";
          } else if (R === 1) { // Subtítulo del reporte
            style.font = { name: "Arial", sz: 11, bold: true, color: { rgb: "1E3A8A" } };
            style.alignment.horizontal = "center";
            style.fill = { fgColor: { rgb: "DBEAFE" } }; // blue-100
          } else if (this.sectionRows.has(R)) { // Título de bloque oscuro
            style.font = { name: "Arial", sz: 10, bold: true, color: { rgb: "FFFFFF" } };
            style.fill = { fgColor: { rgb: "334155" } }; // slate-700
          } else if (this.tableHeaderRows.has(R)) { // Cabecera de tabla azul
            style.font = { name: "Arial", sz: 10, bold: true, color: { rgb: "FFFFFF" } };
            style.fill = { fgColor: { rgb: "2563EB" } }; // blue-600
            style.alignment.horizontal = "center";
          } else if (this.dataKeyCells.has(`${R}-${C}`)) { // Llaves de datos (ej. "Docente:")
            style.font.bold = true;
            style.fill = { fgColor: { rgb: "F1F5F9" } }; // slate-100
          } else if (!this.sectionRows.has(R) && !this.tableHeaderRows.has(R) && R > 1) {
            // Filas alternadas cebra suave
            if (R % 2 !== 0 && !this.dataKeyCells.has(`${R}-${C-1}`)) {
              style.fill = { fgColor: { rgb: "F8FAFC" } }; // slate-50
            }
          }

          ws[cellRef].s = style;
        }
      }
    }

    if (colWidths.length > 0) {
      ws["!cols"] = colWidths.map(w => ({ wch: w }));
    }
    return ws;
  }
}

/**
 * 1. Exporta reporte por docente
 */
export const exportarExcelPorDocente = (data) => {
  const { docente, semestre, horarios, cursos, resumen } = data;
  const wb = XLSX.utils.book_new();
  const b = new ExcelReportBuilder(5);

  b.addTitle("UNIVERSIDAD NACIONAL DE TRUJILLO");
  b.addSubtitle(`Reporte de Horario por Docente - Semestre ${semestre}`);
  b.addEmptyRow();

  b.addSection("DATOS DEL DOCENTE");
  b.addKeyValueRow([{ k: "Docente:", v: `${docente.apellidos}, ${docente.nombres}` }, { k: "Categoría:", v: docente.categoria || "-" }]);
  b.addKeyValueRow([{ k: "Tipo:", v: docente.tipo_nombramiento || "-" }, { k: "Especialidad:", v: docente.especialidad || "-" }]);
  b.addKeyValueRow([{ k: "Antigüedad:", v: `${docente.antiguedad_anios || 0} años` }, { k: "Total Horas:", v: `${resumen.total_horas}h` }]);

  b.addEmptyRow();
  b.addSection("HORARIO DE CLASES");
  if (horarios.length > 0) {
    b.addTable(
      ["Día", "Horario", "Curso", "Ciclo", "Ambiente"],
      horarios.map(h => [h.dia, `${h.hora_inicio} - ${h.hora_fin}`, `[${h.curso_codigo}] ${h.curso_nombre}`, h.curso_ciclo, h.aula_codigo ? `Aula ${h.aula_codigo}` : `Lab ${h.lab_codigo}`])
    );
  } else {
    b.addTable(["Mensaje"], [["No hay horarios asignados en el semestre."]]);
  }

  b.addEmptyRow();
  b.addSection("CURSOS ASIGNADOS");
  if (cursos.length > 0) {
    b.addTable(
      ["Código", "Curso", "Ciclo", "Tipo", "Horas"],
      cursos.map(c => [c.codigo, c.nombre, c.ciclo, c.tipo, `${c.horas}h`])
    );
  }

  const ws = b.build([15, 20, 50, 10, 25]);
  XLSX.utils.book_append_sheet(wb, ws, "Reporte Docente");
  saveWB(wb, `Reporte_Docente_${docente.apellidos}_${semestre}.xlsx`);
};

/**
 * 2. Exporta reporte por día
 */
export const exportarExcelPorDia = (data) => {
  const { dia, semestre, horarios, docentes, ambientes, resumen } = data;
  const wb = XLSX.utils.book_new();
  const b = new ExcelReportBuilder(5);

  b.addTitle("UNIVERSIDAD NACIONAL DE TRUJILLO");
  b.addSubtitle(`Reporte de Horarios - ${dia} - Semestre ${semestre}`);
  b.addEmptyRow();

  b.addSection("RESUMEN DEL DÍA");
  b.addKeyValueRow([{ k: "Total Clases:", v: resumen.total_clases }, { k: "Total Docentes:", v: resumen.total_docentes }]);
  b.addKeyValueRow([{ k: "Total Ambientes:", v: resumen.total_ambientes }, { k: "", v: "" }]);

  b.addEmptyRow();
  b.addSection("HORARIOS ASIGNADOS");
  if (horarios.length > 0) {
    b.addTable(
      ["Horario", "Curso", "Ciclo", "Docente", "Ambiente"],
      horarios.map(h => [`${h.hora_inicio} - ${h.hora_fin}`, `[${h.curso_codigo}] ${h.curso_nombre}`, h.curso_ciclo, `${h.docente_apellidos}, ${h.docente_nombres}`, h.aula_codigo ? `Aula ${h.aula_codigo}` : `Lab ${h.lab_codigo}`])
    );
  } else {
    b.addTable(["Mensaje"], [["No hay horarios para este día."]]);
  }

  b.addEmptyRow();
  b.addSection("DOCENTES ASIGNADOS HOY");
  b.addTable(["Docente", "Categoría", "", "", ""], docentes.map(d => [d.nombre, d.categoria || "-", "", "", ""]));

  b.addEmptyRow();
  b.addSection("AMBIENTES UTILIZADOS");
  b.addTable(["Código", "Nombre", "", "", ""], ambientes.map(a => [a.codigo, a.nombre || "-", "", "", ""]));

  const ws = b.build([20, 50, 10, 45, 25]);
  XLSX.utils.book_append_sheet(wb, ws, "Reporte Día");
  saveWB(wb, `Reporte_${dia}_${semestre}.xlsx`);
};

/**
 * 3. Exporta reporte por aula
 */
export const exportarExcelPorAula = (data) => {
  const { ambiente, tipo, semestre, horarios, docentes, resumen } = data;
  const wb = XLSX.utils.book_new();
  const b = new ExcelReportBuilder(5);

  b.addTitle("UNIVERSIDAD NACIONAL DE TRUJILLO");
  b.addSubtitle(`Reporte de ${tipo}: ${ambiente.codigo} - Semestre ${semestre}`);
  b.addEmptyRow();

  b.addSection("DATOS DEL AMBIENTE");
  b.addKeyValueRow([{ k: "Nombre:", v: ambiente.nombre || "-" }, { k: "Capacidad:", v: ambiente.capacidad || "-" }]);
  b.addKeyValueRow([{ k: "Total Clases:", v: resumen.total_clases }, { k: "Total Docentes:", v: resumen.total_docentes }]);

  b.addEmptyRow();
  b.addSection("HORARIOS ASIGNADOS");
  if (horarios.length > 0) {
    b.addTable(
      ["Día", "Horario", "Curso", "Ciclo", "Docente"],
      horarios.map(h => [h.dia, `${h.hora_inicio} - ${h.hora_fin}`, `[${h.curso_codigo}] ${h.curso_nombre}`, h.curso_ciclo, `${h.docente_apellidos}, ${h.docente_nombres}`])
    );
  } else {
    b.addTable(["Mensaje"], [["No hay horarios asignados."]]);
  }

  b.addEmptyRow();
  b.addSection("DOCENTES QUE UTILIZAN EL AMBIENTE");
  b.addTable(["Docente", "Categoría", "", "", ""], docentes.map(d => [d.nombre, d.categoria || "-", "", "", ""]));

  const ws = b.build([15, 20, 50, 10, 45]);
  XLSX.utils.book_append_sheet(wb, ws, "Reporte Aula");
  saveWB(wb, `Reporte_${tipo}_${ambiente.codigo}_${semestre}.xlsx`);
};

/**
 * 4. Exporta reporte operacional
 */
export const exportarExcelOperacional = (data, semestre) => {
  const wb = XLSX.utils.book_new();

  Object.keys(data).forEach((ambienteKey) => {
    const b = new ExcelReportBuilder(3);
    b.addTitle("UNIVERSIDAD NACIONAL DE TRUJILLO");
    b.addSubtitle(`Reporte Operacional: ${ambienteKey} - Semestre ${semestre}`);
    b.addEmptyRow();

    const items = data[ambienteKey];
    let lastDia = null;

    b.addTable(["Horario", "Curso", "Docente"], []); 

    items.forEach((item) => {
      if (item.dia !== lastDia) {
        b.addSection(item.dia.toUpperCase());
        lastDia = item.dia;
      }
      b.addRow([`${item.hora_inicio} - ${item.hora_fin}`, item.curso?.nombre || "-", `${item.docente?.apellidos || ""}, ${item.docente?.nombres || ""}`]);
    });

    const ws = b.build([20, 60, 45]);
    const wsName = ambienteKey.replace(/[^a-zA-Z0-9]/g, "").slice(0, 30);
    XLSX.utils.book_append_sheet(wb, ws, wsName || "Reporte");
  });

  saveWB(wb, `Reporte_Operacional_${semestre}.xlsx`);
};

/**
 * 5. Exporta reporte de gestión
 */
export const exportarExcelGestion = (data, semestre) => {
  const wb = XLSX.utils.book_new();
  const b = new ExcelReportBuilder(4);

  b.addTitle("UNIVERSIDAD NACIONAL DE TRUJILLO");
  b.addSubtitle(`Reporte de Gestión Docente - Semestre ${semestre}`);
  b.addEmptyRow();

  b.addTable(
    ["Docente", "Categoría", "Antigüedad", "Horas Asignadas"],
    data.map(d => [d.nombre, d.categoria || "-", `${d.antiguedad_anios || 0} años`, `${d.horas} hrs`])
  );

  const ws = b.build([50, 30, 20, 20]);
  XLSX.utils.book_append_sheet(wb, ws, "Gestión Docente");
  saveWB(wb, `Reporte_Gestion_${semestre}.xlsx`);
};

/**
 * 6. NUEVO: Exporta horarios completos por ciclo (El contenido que faltaba)
 */
export const exportarExcelHorariosCompletos = ({ semestre, ciclosActivos, horariosPorCiclo, asignaciones, cursos, docentes, bloques }) => {
  const wb = XLSX.utils.book_new();

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
        });
      }
    });
    return Array.from(map.values());
  };

  ciclosActivos.forEach((ciclo) => {
    const b = new ExcelReportBuilder(6);
    b.addTitle("UNIVERSIDAD NACIONAL DE TRUJILLO");
    b.addSubtitle(`Horario de Clases - Ciclo ${ciclo} - Semestre ${semestre}`);
    b.addEmptyRow();

    b.addSection("DOCENTES ASIGNADOS AL CICLO");
    const resumenDocentes = getResumenDocentesCiclo(ciclo);
    if (resumenDocentes.length > 0) {
      b.addTable(
        ["Docente", "Curso", "Tipo", "Horas", "", ""], 
        resumenDocentes.map(r => [r.docente, r.curso, r.tipo, `${r.horas}h`, "", ""])
      );
    } else {
      b.addTable(["Mensaje", "", "", "", "", ""], [["Sin asignaciones", "", "", "", "", ""]]);
    }
    
    b.addEmptyRow();
    b.addSection("GRILLA DE HORARIO");
    const horariosCiclo = horariosPorCiclo[ciclo] || [];
    
    if (horariosCiclo.length === 0) {
      b.addTable(["Mensaje", "", "", "", "", ""], [["No hay horarios generados para este ciclo.", "", "", "", "", ""]]);
    } else {
      const bodyRows = [];
      const DIAS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];
      
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
      b.addTable(["Bloque", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes"], bodyRows);
    }

    const ws = b.build([18, 20, 20, 20, 20, 20]);
    XLSX.utils.book_append_sheet(wb, ws, `Ciclo ${ciclo}`);
  });

  saveWB(wb, `Horarios_Completos_${semestre}.xlsx`);
};