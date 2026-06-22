import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Función auxiliar para convertir formato de hora de 24h a 12h (AM/PM) para el PDF
const formatAMPM = (timeStr) => {
  if (!timeStr) return "";
  const [hourStr, minuteStr] = timeStr.split(":");
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  let displayHour = hour % 12;
  displayHour = displayHour ? displayHour : 12;
  return `${String(displayHour).padStart(2, "0")}:${minuteStr || "00"} ${ampm}`;
};

// Función auxiliar para calcular las horas de diferencia entre dos horas ("07:00", "09:00" -> 2)
const calcularHoras = (inicio, fin) => {
  if (!inicio || !fin) return 0;
  const mIni = parseInt(inicio.split(":")[0]) * 60 + parseInt(inicio.split(":")[1] || 0);
  const mFin = parseInt(fin.split(":")[0]) * 60 + parseInt(fin.split(":")[1] || 0);
  return (mFin - mIni) / 60;
};

export const generarPDF_F03 = (miPerfil, horariosLectivos, horariosNoLectivos, config, semestreActive) => {
  // 1. Inicializar documento A4 vertical en milímetros
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const semestre = semestreActive || "2026-1";
  const nombreCompleto = `${miPerfil?.nombres || ""} ${miPerfil?.apellidos || ""}`.toUpperCase().trim();

  // --- ENCABEZADO INSTITUCIONAL ---
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138); // Azul Universitario (#1e3a8a)
  doc.text("UNIVERSIDAD NACIONAL DE TRUJILLO", 15, 15);
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("FACULTAD DE INGENIERÍA · DEPARTAMENTO DE INGENIERÍA DE SISTEMAS", 15, 20);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("FORMATO F03-CAD: HORARIO SEMANAL DE LA CARGA ACADÉMICA DOCENTE", 15, 26);

  // Línea divisoria superior elegante
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.6);
  doc.line(15, 28, 195, 28);

  // --- FICHA INFORMATIVA DEL DOCENTE ---
  const dataFicha = [
    [
      { content: "Docente:", styles: { fillColor: [241, 245, 249], fontStyle: "bold" } },
      { content: nombreCompleto || "SÁNCHEZ TICONA ROBERT JERRY" },
      { content: "DNI:", styles: { fillColor: [241, 245, 249], fontStyle: "bold" } },
      { content: miPerfil?.dni || "19082305" },
      { content: "Año Académico:", styles: { fillColor: [241, 245, 249], fontStyle: "bold" } },
      { content: semestre.split("-")[0] }
    ],
    [
      { content: "Categoría / Régimen:", styles: { fillColor: [241, 245, 249], fontStyle: "bold" } },
      { content: `${miPerfil?.categoria || "ASOCIADO"} / ${miPerfil?.regimen || "TC"}` },
      { content: "Dpto. Académico:", styles: { fillColor: [241, 245, 249], fontStyle: "bold" } },
      { content: "Ingeniería de Sistemas" },
      { content: "Semestre Activo:", styles: { fillColor: [241, 245, 249], fontStyle: "bold" } },
      { content: semestre }
    ]
  ];

  autoTable(doc, {
    startY: 32,
    margin: { left: 15, right: 15 },
    body: dataFicha,
    theme: "plain",
    styles: { fontSize: 8.5, cellPadding: 1.5, borderLineWidth: 0.2, borderColor: [203, 213, 225] },
    columnStyles: { 0: { cellWidth: 32 }, 1: { cellWidth: 55 }, 2: { cellWidth: 12 }, 3: { cellWidth: 28 }, 4: { cellWidth: 26 } }
  });

  let currentY = doc.lastAutoTable.finalY + 6;

  // --- SECCIÓN 1: CARGA HORARIA LECTIVA (CHL) ---
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(30, 58, 138);
  doc.rect(15, currentY, 180, 6, "F");
  doc.text("1. CARGA HORARIA LECTIVA (CHL)", 18, currentY + 4.5);
  
  currentY += 6;

  let totalCHL = 0;
  
  // Formatear filas de carga lectiva
  const filasCHL = horariosLectivos.map(h => {
    const horas = calcularHoras(h.hora_inicio, h.hora_fin);
    totalCHL += horas;
    
    return [
      `${h.dia} ${h.hora_inicio ? h.hora_inicio.slice(0, 5) : ""}-${h.hora_fin ? h.hora_fin.slice(0, 5) : ""}`,
      h.curso?.nombre || h.curso_nombre || "Asignatura",
      "F11", // Facultad de Ingeniería
      h.aula?.codigo || h.laboratorio?.codigo || h.ambiente_codigo || "-",
      { content: `${horas} h`, styles: { halign: "center", fontStyle: "bold" } }
    ];
  });

  // Fila de Total de Carga Lectiva
  filasCHL.push([
    { content: "TOTAL HORAS CARGA LECTIVA (CHL):", colSpan: 4, styles: { halign: "right", fontStyle: "bold", fillColor: [241, 245, 249] } },
    { content: `${totalCHL} h`, styles: { halign: "center", fontStyle: "bold", fillColor: [241, 245, 249] } }
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: 15, right: 15 },
    head: [["Horario Semanal", "Asignatura / Curso", "Lugar", "Aula", "Horas"]],
    body: filasCHL,
    theme: "striped",
    headStyles: { fillColor: [51, 65, 85], fontSize: 8.5, fontStyle: "bold" },
    styles: { fontSize: 8.5, cellPadding: 2, borderLineWidth: 0.1, borderColor: [226, 232, 240] },
    columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 65 }, 2: { cellWidth: 15, halign: 'center' }, 3: { cellWidth: 40 }, 4: { cellWidth: 15, halign: 'center' } }
  });

  currentY = doc.lastAutoTable.finalY + 6;

  // --- SECCIÓN 2: CARGA HORARIA NO LECTIVA (CHNL) ---
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(30, 58, 138);
  doc.rect(15, currentY, 180, 6, "F");
  doc.text("2. CARGA HORARIA NO LECTIVA (CHNL)", 18, currentY + 4.5);

  currentY += 6;

  let totalCHNL = 0;

  // Formatear filas de carga no lectiva
  const filasCHNL = horariosNoLectivos.map(nl => {
    const horas = calcularHoras(nl.hora_inicio, nl.hora_fin);
    totalCHNL += horas;

    return [
      `${nl.dia} ${nl.hora_inicio ? nl.hora_inicio.slice(0, 5) : ""}-${nl.hora_fin ? nl.hora_fin.slice(0, 5) : ""}`,
      nl.curso?.nombre || nl.actividad_nombre || "Actividad Académica",
      "F11",
      nl.aula?.codigo || nl.ambiente || "Cubículo",
      { content: `${horas} h`, styles: { halign: "center", fontStyle: "bold" } }
    ];
  });

  // Fila de Total de Carga No Lectiva
  filasCHNL.push([
    { content: "TOTAL HORAS CARGA NO LECTIVA (CHNL):", colSpan: 4, styles: { halign: "right", fontStyle: "bold", fillColor: [241, 245, 249] } },
    { content: `${totalCHNL} h`, styles: { halign: "center", fontStyle: "bold", fillColor: [241, 245, 249] } }
  ]);

  // FILA GIGANTE DE TOTAL ACADÉMICO
  filasCHNL.push([
    { content: "TOTAL HORAS CARGA ACADÉMICA:", colSpan: 4, styles: { halign: "right", fontStyle: "bold", fillColor: [226, 232, 240], textColor: [30, 58, 138] } },
    { content: `${totalCHL + totalCHNL} h`, styles: { halign: "center", fontStyle: "bold", fillColor: [226, 232, 240], textColor: [30, 58, 138] } }
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: 15, right: 15 },
    head: [["Horario Semanal", "Actividad Académica", "Lugar", "Aula", "Horas"]],
    body: filasCHNL,
    theme: "striped",
    headStyles: { fillColor: [51, 65, 85], fontSize: 8.5, fontStyle: "bold" },
    styles: { fontSize: 8.5, cellPadding: 2, borderLineWidth: 0.1, borderColor: [226, 232, 240] },
    columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 65 }, 2: { cellWidth: 15, halign: 'center' }, 3: { cellWidth: 40 }, 4: { cellWidth: 15, halign: 'center' } }
  });

  currentY = doc.lastAutoTable.finalY + 3;

  // --- LEYENDA (Letras pequeñas debajo de las tablas) ---
  doc.setFont("Helvetica", "italic");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  const leyendaTexto = "LUGAR: (F01: “CC. Agropecuarias”, F02: “CC. Biológicas”; F03: “CC. Económicas”; F04: “CC. Físicas y Matemáticas”; F05: “CC. Sociales”; F06: “Derecho y Ciencias Políticas”; F07: “Educación y Comunicación”; F08: “Enfermería”; F09: “Estomatología”; F10: “Farmacia y Bioquímica”; F11: “Ingeniería”; F12: “Ingeniería Química”; F13: “Medicina”; F14: “Filial Valle Jequetepeque”; F15: “Filial Huamachuco”, F16: “Filial Santiago de Chuco”; OA: “Oficina Administrativa”; SC: “Salida de Campo”).";
  
  doc.text(leyendaTexto, 15, currentY, { maxWidth: 180, align: "justify", lineHeightFactor: 1.2 });

  // --- SALTO DE PÁGINA OBLIGATORIO PARA LA MATRIZ SEMANAL ---
  doc.addPage();
  
  // Encabezado rápido de página 2
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text("DISTRIBUCIÓN MATRICIAL SEMANAL DE ACTIVIDADES", 15, 12);
  doc.setDrawColor(226, 232, 240);
  doc.line(15, 14, 195, 14);

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
  
  // Mapeo unificado para cruzar celdas eficientemente
  const unificados = [
    ...horariosLectivos.map(h => ({ ...h, es_lectivo: true })),
    ...horariosNoLectivos.map(nl => ({
      dia: nl.dia,
      hora_inicio: nl.hora_inicio,
      hora_fin: nl.hora_fin,
      es_lectivo: false,
      curso: { codigo: "CHNL", nombre: nl.curso?.nombre || nl.actividad_nombre },
      aula: { codigo: nl.aula?.codigo || nl.ambiente }
    }))
  ];

  const timeToMin = (t) => {
    const p = t.slice(0, 5).split(":").map(Number);
    return p[0] * 60 + p[1];
  };

  const filasMatriz = horasEje.map(bloque => {
    const bIni = timeToMin(bloque.inicio);
    const bFin = timeToMin(bloque.fin);

    const fila = [bloque.label]; // Primera columna es el eje de horas

    columnasDias.forEach(dia => {
      const limpioDia = dia.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
      
      // Buscar actividades en este bloque y día
      const coincidencias = unificados.filter(h => {
        const hDia = String(h.dia).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
        return hDia === limpioDia && timeToMin(h.hora_inicio) < bFin && timeToMin(h.hora_fin) > bIni;
      });

      if (coincidencias.length > 0) {
        const item = coincidencias[0]; // Tomamos la primera en caso de duplicados
        const ambiente = item.aula?.codigo || item.laboratorio?.codigo || item.ambiente_secretaria_codigo || "Cubículo";
        const txt = `${item.curso?.nombre || "Actividad"}\n[${ambiente}]`;
        
        // Estilo condicional: Celda lectiva (azul claro) o no lectiva (gris/pizarra suave)
        const cellStyle = item.es_lectivo 
          ? { fillColor: [239, 246, 255], textColor: [30, 64, 175], fontStyle: "bold" }
          : { fillColor: [248, 250, 252], textColor: [51, 65, 85] };

        fila.push({ content: txt, styles: cellStyle });
      } else {
        fila.push(""); // Vacío
      }
    });

    return fila;
  });

  autoTable(doc, {
    startY: 18,
    margin: { left: 15, right: 15 },
    head: [["Horario", ...columnasDias]],
    body: filasMatriz,
    theme: "grid",
    headStyles: { fillColor: [71, 85, 105], fontSize: 8, fontStyle: "bold", halign: "center" },
    styles: { fontSize: 6.5, cellPadding: 1, borderLineWidth: 0.1, borderColor: [203, 213, 225], halign: "center" },
    columnStyles: { 0: { cellWidth: 28, fontStyle: "bold", fillColor: [241, 245, 249], fontSize: 7 } }
  });

  // --- SECCIÓN DE FIRMAS (Al final de la página de la matriz) ---
  const finalY = doc.lastAutoTable.finalY + 30;

  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.2);

  // Línea de Firma 1: Docente
  doc.line(20, finalY, 70, finalY);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(nombreCompleto, 45, finalY + 4, { align: "center" });
  doc.setFont("Helvetica", "normal");
  doc.text(`Docente ${miPerfil?.categoria || "Asociado"}`, 45, finalY + 8, { align: "center" });

  // Línea de Firma 2: Director de Departamento
  doc.line(85, finalY, 135, finalY);
  doc.setFont("Helvetica", "bold");
  doc.text("DIRECTOR DE DEPARTAMENTO", 110, finalY + 4, { align: "center" });
  doc.setFont("Helvetica", "normal");
  doc.text("Dpto. Académico de Sistemas", 110, finalY + 8, { align: "center" });

    // Línea de Firma 3: Decano
  doc.line(150, finalY, 195, finalY);
  doc.setFont("Helvetica", "bold");
  doc.text("V°B° DECANO", 170, finalY + 4, { align: "center" });
  doc.setFont("Helvetica", "normal");
  doc.text("Fac. Ingeniería", 170, finalY + 8, { align: "center" });

  // Guardar y descargar automáticamente
  doc.save(`F03-CAD_Horario_${miPerfil?.apellidos || "Docente"}.pdf`);
};