import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DIAS_CORTOS = {
  Lunes: "LU",
  Martes: "MA",
  Miercoles: "MI",
  Miércoles: "MI",
  Jueves: "JU",
  Viernes: "VI",
  Sabado: "SA",
  Sábado: "SA",
  Domingo: "DO"
};

// Calcula las horas de diferencia entre dos horas ("07:00", "09:00" -> 2)
const calcularHoras = (inicio, fin) => {
  if (!inicio || !fin) return 0;
  const mIni = parseInt(inicio.split(":")[0]) * 60 + parseInt(inicio.split(":")[1] || 0);
  const mFin = parseInt(fin.split(":")[0]) * 60 + parseInt(fin.split(":")[1] || 0);
  return (mFin - mIni) / 60;
};

const normalizarDia = (dia) =>
  String(dia || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const diaCorto = (dia) => {
  const limpio = normalizarDia(dia);
  return DIAS_CORTOS[limpio] || limpio.slice(0, 2).toUpperCase();
};

const formatearHorario = (dia, inicio, fin) => {
  const ini = inicio ? String(inicio).slice(0, 5) : "";
  const fn = fin ? String(fin).slice(0, 5) : "";
  return `${diaCorto(dia)} (${ini}-${fn})`;
};

const AZUL_CLARO = [211, 225, 242];
const TEXTO_NEGRO = [0, 0, 0];

export const generarPDF_F03 = ({ perfil, horariosLectivos, horariosNoLectivos, config, semestre }) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const semestreStr = semestre || "2026-1";
  const anio = semestreStr.split("-")[0];
  const ciclo = semestreStr.split("-")[1] === "2" ? "II" : "I";

  const nombreCompleto = perfil?.nombreCompleto || "";
  const dni = perfil?.dni || "";
  const categoria = perfil?.categoria || "";
  const escuela = perfil?.escuela || "Ingeniería de Sistemas";

  const margen = 14;
  const anchoPagina = doc.internal.pageSize.getWidth();

  // ============================================================
  // ENCABEZADO FORMAL
  // ============================================================
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXTO_NEGRO);

  // Fila 1: Facultad / Dpto. Académico
  autoTable(doc, {
    startY: 12,
    margin: { left: margen, right: margen },
    body: [
      [
        { content: "Facultad / Filial:", styles: { fontStyle: "bold" } },
        { content: "Ingeniería" },
        { content: "Dpto. Académico:", styles: { fontStyle: "bold" } },
        { content: escuela }
      ]
    ],
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 1.5, textColor: TEXTO_NEGRO },
    columnStyles: { 0: { cellWidth: 32 }, 2: { cellWidth: 36 } }
  });

  let y = doc.lastAutoTable.finalY;

  // Fila 2: DNI / Docente / Categoría
  autoTable(doc, {
    startY: y,
    margin: { left: margen, right: margen },
    body: [
      [
        { content: "DNI", styles: { fontStyle: "bold", halign: "center" } },
        { content: dni, styles: { halign: "center" } },
        { content: "Docente:", styles: { fontStyle: "bold" } },
        { content: nombreCompleto },
        { content: categoria, styles: { halign: "center" } }
      ]
    ],
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 1.5, textColor: TEXTO_NEGRO },
    columnStyles: {
      0: { cellWidth: 14 },
      1: { cellWidth: 26 },
      2: { cellWidth: 20 },
      3: { cellWidth: "auto" },
      4: { cellWidth: 36 }
    }
  });

  y = doc.lastAutoTable.finalY;

  // Fila 3: Año académico / Ciclo
  autoTable(doc, {
    startY: y,
    margin: { left: margen, right: margen },
    body: [
      [
        { content: "AÑO ACADÉMICO:", styles: { fontStyle: "bold" } },
        { content: anio },
        { content: "SEMESTRE:", styles: { fontStyle: "bold" } },
        { content: ciclo }
      ]
    ],
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 1.5, textColor: TEXTO_NEGRO },
    columnStyles: { 0: { cellWidth: 40 }, 2: { cellWidth: 28 } }
  });

  y = doc.lastAutoTable.finalY + 5;

  // ============================================================
  // TABLA CONSOLIDADA CHL + CHNL
  // ============================================================
  let totalCHL = 0;
  let totalCHNL = 0;

  const filasCHL = (horariosLectivos || []).map(h => {
    const horas = calcularHoras(h.hora_inicio, h.hora_fin);
    totalCHL += horas;
    return [
      formatearHorario(h.dia, h.hora_inicio, h.hora_fin),
      h.curso?.nombre || h.curso_nombre || "Asignatura",
      "F11",
      h.aula?.codigo || h.laboratorio?.codigo || h.ambiente_codigo || "-",
      { content: `${horas}`, styles: { halign: "center" } }
    ];
  });

  const filasCHNL = (horariosNoLectivos || []).map(nl => {
    const horas = calcularHoras(nl.hora_inicio, nl.hora_fin);
    totalCHNL += horas;
    return [
      formatearHorario(nl.dia, nl.hora_inicio, nl.hora_fin),
      nl.actividad_nombre || nl.curso?.nombre || "Actividad Académica",
      "F11",
      nl.ambiente || nl.aula?.codigo || "Cubículo",
      { content: `${horas}`, styles: { halign: "center" } }
    ];
  });

  const bodyConsolidado = [
    ...filasCHL,
    [
      {
        content: "CARGA HORARIA NO LECTIVA (CHNL)",
        colSpan: 5,
        styles: { fillColor: AZUL_CLARO, fontStyle: "bold", halign: "center" }
      }
    ],
    ...filasCHNL,
    [
      {
        content: "TOTAL HORAS CARGA ACADÉMICA",
        colSpan: 4,
        styles: { fillColor: AZUL_CLARO, fontStyle: "bold", halign: "right" }
      },
      {
        content: `${totalCHL + totalCHNL}`,
        styles: { fillColor: AZUL_CLARO, fontStyle: "bold", halign: "center" }
      }
    ]
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: margen, right: margen },
    head: [["HORARIO", "CARGA HORARIA LECTIVA (CHL)", "LUGAR", "AULA", "TOTAL"]],
    body: bodyConsolidado,
    theme: "grid",
    headStyles: {
      fillColor: AZUL_CLARO,
      textColor: TEXTO_NEGRO,
      fontSize: 8.5,
      fontStyle: "bold",
      halign: "center"
    },
    styles: { fontSize: 8, cellPadding: 1.8, textColor: TEXTO_NEGRO },
    columnStyles: {
      0: { cellWidth: 34 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: 32, halign: "center" },
      4: { cellWidth: 18, halign: "center" }
    }
  });

  y = doc.lastAutoTable.finalY + 3;

  // Leyenda de lugares
  doc.setFont("helvetica", "italic");
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  const leyendaTexto =
    "LUGAR: (F01: \"CC. Agropecuarias\", F02: \"CC. Biológicas\"; F03: \"CC. Económicas\"; F04: \"CC. Físicas y Matemáticas\"; F05: \"CC. Sociales\"; F06: \"Derecho y Ciencias Políticas\"; F07: \"Educación y Comunicación\"; F08: \"Enfermería\"; F09: \"Estomatología\"; F10: \"Farmacia y Bioquímica\"; F11: \"Ingeniería\"; F12: \"Ingeniería Química\"; F13: \"Medicina\"; F14: \"Filial Valle Jequetepeque\"; F15: \"Filial Huamachuco\", F16: \"Filial Santiago de Chuco\"; OA: \"Oficina Administrativa\"; SC: \"Salida de Campo\").";
  doc.text(leyendaTexto, margen, y, { maxWidth: anchoPagina - margen * 2, align: "justify", lineHeightFactor: 1.2 });

  // ============================================================
  // PÁGINA 2: DISTRIBUCIÓN MATRICIAL SEMANAL
  // ============================================================
  doc.addPage();

  // Encabezado de página 2 con datos del docente
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...TEXTO_NEGRO);
  doc.text("DISTRIBUCIÓN MATRICIAL SEMANAL DE ACTIVIDADES", anchoPagina / 2, 10, { align: "center" });

  // Ficha del docente en la cabecera de la matriz
  autoTable(doc, {
    startY: 14,
    margin: { left: margen, right: margen },
    body: [
      [
        { content: "Docente:", styles: { fontStyle: "bold" } },
        { content: nombreCompleto },
        { content: "Categoría:", styles: { fontStyle: "bold" } },
        { content: categoria },
        { content: "Escuela:", styles: { fontStyle: "bold" } },
        { content: escuela }
      ],
      [
        { content: "Año Académico:", styles: { fontStyle: "bold" } },
        { content: anio },
        { content: "Semestre:", styles: { fontStyle: "bold" } },
        { content: ciclo },
        { content: "DNI:", styles: { fontStyle: "bold" } },
        { content: dni }
      ]
    ],
    theme: "grid",
    styles: { fontSize: 7.5, cellPadding: 1.2, textColor: TEXTO_NEGRO },
    columnStyles: { 0: { cellWidth: 28 }, 2: { cellWidth: 22 }, 4: { cellWidth: 20 } }
  });

  // --- CONSTRUCCIÓN DE LA MATRIZ DE TIEMPO ---
  const horasEje = [];
  const hIni = parseInt(String(config?.hora_inicio || "07:00").split(":")[0], 10);
  const hFin = parseInt(String(config?.hora_fin || "22:00").split(":")[0], 10);
  for (let h = hIni; h < hFin; h++) {
    horasEje.push({
      inicio: `${String(h).padStart(2, "0")}:00`,
      fin: `${String(h + 1).padStart(2, "0")}:00`,
      label: `${String(h).padStart(2, "0")}:00 - ${String(h + 1).padStart(2, "0")}:00`
    });
  }

  const columnasDias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

  const unificados = [
    ...(horariosLectivos || []).map(h => ({ ...h, es_lectivo: true })),
    ...(horariosNoLectivos || []).map(nl => ({
      dia: nl.dia,
      hora_inicio: nl.hora_inicio,
      hora_fin: nl.hora_fin,
      es_lectivo: false,
      curso: { nombre: nl.actividad_nombre || "Actividad" },
      aula: { codigo: nl.ambiente || "Cubículo" }
    }))
  ];

  const timeToMin = (t) => {
    const p = String(t).slice(0, 5).split(":").map(Number);
    return p[0] * 60 + p[1];
  };

  const filasMatriz = horasEje.map(bloque => {
    const bIni = timeToMin(bloque.inicio);
    const bFin = timeToMin(bloque.fin);
    const fila = [bloque.label];

    columnasDias.forEach(dia => {
      const limpioDia = normalizarDia(dia).toLowerCase();
      const coincidencias = unificados.filter(h => {
        const hDia = normalizarDia(h.dia).toLowerCase();
        return hDia === limpioDia && timeToMin(h.hora_inicio) < bFin && timeToMin(h.hora_fin) > bIni;
      });

      if (coincidencias.length > 0) {
        const item = coincidencias[0];
        const ambiente = item.aula?.codigo || item.laboratorio?.codigo || "Cubículo";
        const txt = `${item.curso?.nombre || "Actividad"}\n[${ambiente}]`;
        fila.push({ content: txt, styles: { halign: "center", fontSize: 6 } });
      } else {
        fila.push("");
      }
    });

    return fila;
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 3,
    margin: { left: margen, right: margen },
    head: [["Horario", ...columnasDias]],
    body: filasMatriz,
    theme: "grid",
    headStyles: {
      fillColor: AZUL_CLARO,
      textColor: TEXTO_NEGRO,
      fontSize: 8,
      fontStyle: "bold",
      halign: "center"
    },
    styles: {
      fontSize: 6.5,
      cellPadding: 1,
      borderLineWidth: 0.15,
      borderColor: [150, 150, 150],
      halign: "center"
    },
    columnStyles: {
      0: { cellWidth: 26, fontStyle: "bold", fillColor: [245, 245, 245], fontSize: 7 }
    }
  });

  // --- FIRMAS ---
  const finalY = doc.lastAutoTable.finalY + 25;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);

  // Firma 1: Docente
  doc.line(20, finalY, 70, finalY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(nombreCompleto, 45, finalY + 4, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text(`Docente ${categoria}`, 45, finalY + 8, { align: "center" });

  // Firma 2: Director
  doc.line(85, finalY, 135, finalY);
  doc.setFont("helvetica", "bold");
  doc.text("DIRECTOR DE DEPARTAMENTO", 110, finalY + 4, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text("Dpto. Académico de Sistemas", 110, finalY + 8, { align: "center" });

  // Firma 3: Decano
  doc.line(150, finalY, 195, finalY);
  doc.setFont("helvetica", "bold");
  doc.text("V°B° DECANO", 170, finalY + 4, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text("Fac. Ingeniería", 170, finalY + 8, { align: "center" });

  // Guardar
  const apellido = perfil?.nombreCompleto?.split(" ").slice(-2).join("_") || "Docente";
  doc.save(`F03-CAD_Horario_${apellido}_${semestreStr}.pdf`);
};
