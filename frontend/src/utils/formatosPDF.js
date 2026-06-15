import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function fechaHoy() {
  const hoy = new Date();
  return `Trujillo, ${hoy.getDate()} de ${MESES[hoy.getMonth()]} del ${hoy.getFullYear()}`;
}

function parsearSemestre(semestre) {
  // "2026-1" → { anio: "2026", ciclo: "I" }
  if (!semestre) return { anio: '', ciclo: '' };
  const [anio, num] = semestre.split('-');
  return { anio: anio || '', ciclo: num === '1' ? 'I' : num === '2' ? 'II' : num || '' };
}

function nombreCompletoInvertido(docenteNombre) {
  // Intenta formatear como "APELLIDOS, NOMBRES" si viene como "NOMBRES APELLIDOS"
  // Como ya viene en la BD como "nombres apellidos", lo devolvemos tal cual en mayúsculas.
  return (docenteNombre || '').toUpperCase();
}

/**
 * FORMATO N° 1 — Declaración de Carga Horaria Asignada
 * @param {object} datos
 * @param {string} datos.docenteNombre
 * @param {string} datos.docenteDni
 * @param {string} datos.modalidad
 * @param {string} datos.tipo_nombramiento
 * @param {string} datos.categoria
 * @param {string} datos.escuela
 * @param {string} datos.semestre
 * @param {number} datos.horasLectivas
 * @param {Array}  datos.cursos
 * @param {object} datos.form  — campos de carga no lectiva
 */
export function generarFormatoN1(datos) {
  const { docenteNombre, docenteDni, modalidad, tipo_nombramiento, categoria, escuela, semestre, horasLectivas, cursos = [], form = {} } = datos;
  const { anio, ciclo } = parsearSemestre(semestre);
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();

  // ── ENCABEZADO ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('FORMATO N° 1', pw / 2, 18, { align: 'center' });
  doc.setFontSize(11);
  doc.text('DECLARACION DE CARGA HORARIA ASIGNADA', pw / 2, 25, { align: 'center' });

  // ── I. DATOS DEL PROFESOR ──
  let y = 32;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('I. DATOS SOBRE LA SITUACION DEL PROFESOR:', 14, y);
  y += 5;

  // Fila: Facultad / Dpto. Académico
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    body: [
      [
        { content: 'FACULTAD:', styles: { fontStyle: 'bold' } },
        { content: 'Ingeniería' },
        { content: 'DPTO. ACADEMICO:', styles: { fontStyle: 'bold' } },
        { content: escuela || 'Dpto. de Ingeniería de Sistemas' }
      ]
    ],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1.5, textColor: [0, 0, 0] },
    columnStyles: { 0: { cellWidth: 24 }, 1: { cellWidth: 62 }, 2: { cellWidth: 32 }, 3: { cellWidth: 'auto' } }
  });
  y = doc.lastAutoTable.finalY;

  // Tabla: Nombre | Condición | Categoría | Modalidad
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['NOMBRE COMPLETO', 'CONDICION', 'CATEGORIA', 'MODALIDAD']],
    body: [[
      nombreCompletoInvertido(docenteNombre),
      tipo_nombramiento || '...........',
      categoria || '...........',
      modalidad ? `${modalidad}` : '...........'
    ]],
    theme: 'grid',
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontSize: 9, fontStyle: 'bold', halign: 'center' },
    styles: { fontSize: 9, cellPadding: 2, textColor: [0, 0, 0] },
    columnStyles: { 0: { cellWidth: 70 }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' } }
  });
  y = doc.lastAutoTable.finalY;

  // Año académico / Ciclo / Inicio / Final
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    body: [[
      { content: 'AÑO ACADEMICO:', styles: { fontStyle: 'bold' } },
      { content: anio },
      { content: 'CICLO(SEM):', styles: { fontStyle: 'bold' } },
      { content: ciclo },
      { content: 'INICIO:', styles: { fontStyle: 'bold' } },
      { content: '....../....../......' },
      { content: 'FINAL:', styles: { fontStyle: 'bold' } },
      { content: '....../....../......' }
    ]],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1.5, textColor: [0, 0, 0] },
  });
  y = doc.lastAutoTable.finalY + 3;

  // ── SECCIÓN 1: TRABAJO LECTIVO ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('1. TRABAJO LECTIVO.- Datos completos y con claridad', 14, y + 4);
  y += 6;

  const cursosBody = cursos.map(c => {
    const esTeo = c.tipo === 'Teoria' || c.tipo === 'Teoría';
    const esPra = c.tipo === 'Practica' || c.tipo === 'Práctica';
    const esLab = c.tipo === 'Laboratorio';
    return [
      c.curso_codigo || '-',
      c.curso_nombre || '-',
      '-',
      'Ing. Sistemas',
      c.ciclo || '-',
      c.grupo || '-',
      '-',
      esTeo ? c.horas_asignadas : '-',
      esPra ? c.horas_asignadas : '-',
      esLab ? c.horas_asignadas : '-',
      c.horas_asignadas
    ];
  });
  cursosBody.push([
    '', { content: 'TOTAL', styles: { fontStyle: 'bold' } },
    '', '', '', '', '', '', '', '',
    { content: horasLectivas, styles: { fontStyle: 'bold' } }
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['CODIGO', 'NOMBRE DEL CURSO', 'CUR.', 'ESCUELA PROF.', 'CIC.', 'SEC.', 'N° AL.', 'H.T.', 'H.P.', 'H.L.', 'Total']],
    body: cursosBody,
    theme: 'grid',
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontSize: 7.5, fontStyle: 'bold', halign: 'center' },
    styles: { fontSize: 8, halign: 'center', cellPadding: 1.5, textColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 14 },
      1: { halign: 'left', cellWidth: 48 },
      3: { cellWidth: 20 },
      7: { cellWidth: 10 },
      8: { cellWidth: 10 },
      9: { cellWidth: 10 },
      10: { cellWidth: 12 }
    }
  });
  y = doc.lastAutoTable.finalY + 3;

  // ── SECCIONES 2–10: CARGA NO LECTIVA ──
  const noLectivaItems = [
    { n: 2, label: 'PREPARACION Y EVALUACION (Max 50% de Trabajo Lectivo)', detalle: form.preparacion_clases_detalle, horas: form.preparacion_clases || 0 },
    { n: 3, label: 'CONSEJERIA: Señalar número de alumnos y el ciclo académico con los que se desarrolla. (Como mínimo una 01 hora semanal).', detalle: form.tutoria_consejeria_detalle, horas: form.tutoria_consejeria || 0 },
    { n: 4, label: 'INVESTIGACION: Consignar el N° de inscripción, código, nombre y duración del proyecto. (Como mínimo 04 y 05 horas semanales, según modalidad de trabajo de docentes ordinarios).', detalle: form.investigacion_detalle, horas: form.investigacion || 0 },
    { n: 5, label: 'CAPACITACION: Señale lo referente a este rubro en el marco de los planes de cada Facultad (como máximo 05 semanales).', detalle: form.capacitacion_detalle, horas: form.capacitacion || 0 },
    { n: 6, label: 'ACTIVIDADES DE GOBIERNO: Si desempeña cargo indique.', detalle: form.gestion_admin_detalle, horas: form.gestion_admin || 0 },
    { n: 7, label: 'ACTIVIDADES DE ADMINISTRACION: Si desempeña cargo indique.', detalle: form.produccion_intelectual_detalle, horas: form.produccion_intelectual || 0 },
    { n: 8, label: 'ASESORIA DE TESIS, EXAMENES PROFESIONALES Y EXPERIENCIA PROFESIONAL: Indicar el número de Resolución Decanal, precisando el nombre y duración de la actividad programada.', detalle: form.asesoria_tesis_detalle, horas: form.asesoria_tesis || 0 },
    { n: 9, label: 'RESPONSABILIDAD SOCIAL UNIVERSITARIA: Señalar actividad, proyecto programa a ejecutarse en beneficio de la comunidad local o regional. (Como máximo 02 horas semanales)', detalle: form.responsabilidad_social_detalle, horas: form.responsabilidad_social || 0 },
    { n: 10, label: 'COMITES TECNICOS Y COMISIONES: Consignar el número de Resolución autoritativa indicando el lapso de vigencia.', detalle: form.otras_actividades_detalle, horas: form.otras_actividades || 0 },
  ];

  const totalNoLectivo = noLectivaItems.reduce((s, i) => s + i.horas, 0);
  const totalGeneral = horasLectivas + totalNoLectivo;

  const noLectivaBody = noLectivaItems.map(item => [
    { content: item.label, styles: { halign: 'left', fontStyle: 'normal', fontSize: 7.5 } },
    { content: item.detalle || '', styles: { halign: 'left', fontSize: 7.5 } },
    { content: item.horas || 0, styles: { halign: 'center', fontSize: 8 } }
  ]);
  noLectivaBody.push([
    { content: '', styles: {} },
    { content: 'TOTAL', styles: { fontStyle: 'bold', halign: 'right', fontSize: 9 } },
    { content: totalGeneral, styles: { fontStyle: 'bold', halign: 'center', fontSize: 9, fillColor: [240, 240, 240] } }
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [[
      { content: 'Actividad', styles: { halign: 'center' } },
      { content: 'Descripción / Detalle', styles: { halign: 'center' } },
      { content: 'Horas', styles: { halign: 'center' } }
    ]],
    body: noLectivaBody,
    theme: 'grid',
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2, textColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 16 }
    }
  });
  y = doc.lastAutoTable.finalY + 6;

  // ── FECHA Y FIRMAS ──
  if (y > 250) { doc.addPage(); y = 20; }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(fechaHoy(), pw - 14, y, { align: 'right' });
  y += 32;

  doc.line(14, y, 70, y);
  doc.line(80, y, 130, y);
  doc.line(140, y, 196, y);
  doc.setFontSize(8.5);
  doc.text('Firma del Profesor', 42, y + 5, { align: 'center' });
  doc.text('Firma del Director de Dpto.', 105, y + 5, { align: 'center' });
  doc.text('V° B° DECANO FAC.', 168, y + 5, { align: 'center' });

  const nombre = (docenteNombre || 'Docente').replace(/\s+/g, '_');
  doc.save(`Formato1_CargaHoraria_${nombre}_${semestre}.pdf`);
}

/**
 * FORMATO N° 2 — DJ de No Incompatibilidad (Sede Central)
 */
export function generarFormatoN2Central(datos) {
  const { docenteNombre, docenteDni, modalidad, tipo_nombramiento, escuela, semestre } = datos;
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const margen = 20;
  const ancho = pw - margen * 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('FORMATO N° 2', pw / 2, 20, { align: 'center' });
  doc.setFontSize(11);
  doc.text('DECLARACION JURADA DE NO ESTAR INCURSO EN CAUSALES', pw / 2, 28, { align: 'center' });
  doc.text('DE INCOMPATIBILIDAD O IMPEDIMENTO LABORAL', pw / 2, 34, { align: 'center' });

  let y = 50;

  // Párrafo introductorio
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  const dpto = escuela ? `Dpto. de ${escuela}` : 'Dpto. de Ingeniería de Sistemas';
  const intro = `Yo, ${nombreCompletoInvertido(docenteNombre)} identificado con DNI. Nro ${docenteDni || '.........'} con Código IBM Nro ............. del Departamento Académico ${dpto} Facultad de Ingeniería; en el marco del programa de Homologación de la remuneración de los docentes universitarios, dispuesto por el D.U. Nro 033-2006 y D.S. Nro 019-2006-EF, DECLARO BAJO JURAMENTO Y EN HONOR A LA VERDAD, que:`;
  const introLines = doc.splitTextToSize(intro, ancho);
  doc.text(introLines, margen, y);
  y += introLines.length * 5.5 + 6;

  // Párrafo 1
  const p1 = ` NO ESTOY INCURSO en causales de incompatibilidad laboral y NO TENGO impedimento para ejercer la docencia en la Universidad Nacional de Trujillo, de conformidad con lo previsto en el capitulo VII de las Incompatibilidades e Impedimentos, del Titulo VI: Los Profesores, del Estatuto Institucional vigente.`;
  const p1Lines = doc.splitTextToSize(p1, ancho);
  doc.text(p1Lines, margen, y);
  y += p1Lines.length * 5.5 + 6;

  // Párrafo 2
  const modalidadHoras = modalidad === 'Tiempo Parcial' ? 'Tiempo Parcial 20 H' : 'Tiempo Completo 40 H';
  const p2 = ` Soy docente ${tipo_nombramiento || 'Nombrado'}, a ${modalidadHoras} y NO desempeño cargo público o privado en horas que coincidan con el horario establecido en la Universidad Nacional de Trujillo (De conformidad con los articulos 270ro y 277ro del Estatuto Institucional vigente).`;
  const p2Lines = doc.splitTextToSize(p2, ancho);
  doc.text(p2Lines, margen, y);
  y += p2Lines.length * 5.5 + 6;

  // Párrafo 3 (negrita)
  doc.setFont('helvetica', 'bold');
  const p3 = ` EN CASO DE FALTAR A LA VERDAD ME SOMETO A LAS SANCIONES QUE SEAN APLICABLES DE ACUERDO A LEY; ASIMISMO, DE ENCONTRARME INCURSO EN SITUACION DE INCOMPATIBILIDAD O IMPEDIMENTO PARA EJERCER LA DOCENCIA EN LA U.N.T., ME SOMETO A LAS SANCIONES PREVISTAS POR SU ESTATUTO,`;
  const p3Lines = doc.splitTextToSize(p3, ancho);
  doc.text(p3Lines, margen, y);
  y += p3Lines.length * 5.5 + 4;

  // Párrafo 4 (negrita + cursiva)
  doc.setFont('helvetica', 'bolditalic');
  const p4 = `Y AUTORIZO AL FUNCIONARIO COMPETENTE DISPONGA EL DESCUENTO DE MI PLANILLA DE HABERES, DEL MONTO QUE LA UNIDAD DE REMUNERACIONES LIQUIDE COMO PAGOS INDEBIDOS POR EL LAPSO DE TIEMPO LABORADO ILEGALMENTE.`;
  const p4Lines = doc.splitTextToSize(p4, ancho);
  doc.text(p4Lines, margen, y);
  y += p4Lines.length * 5.5 + 10;

  // Fecha
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.text(fechaHoy(), pw - margen, y, { align: 'right' });
  y += 40;

  // Firma
  doc.line(pw / 2 - 35, y, pw / 2 + 35, y);
  doc.setFontSize(9.5);
  doc.text('FIRMA DEL DECLARANTE', pw / 2, y + 5, { align: 'center' });
  doc.text(`DNI: ${docenteDni || '.........'}`, pw / 2, y + 11, { align: 'center' });
  y += 25;

  // Nota al pie
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const nota = 'Nota: Los docentes deben suscribir de forma obligatoria el presente formato en cada Semestre Académico, en el reverso de la Declaracion de Carga Horaria Asignada';
  const notaLines = doc.splitTextToSize(nota, ancho);
  doc.text(notaLines, margen, y + 10);

  const nombre = (docenteNombre || 'Docente').replace(/\s+/g, '_');
  doc.save(`Formato2_DJ_SedessCentral_${nombre}_${semestre}.pdf`);
}

/**
 * FORMATO N° 2 — DJ Sedes Desconcentradas (Valles)
 */
export function generarFormatoN2Valles(datos) {
  const { docenteNombre, docenteDni, escuela, semestre } = datos;
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const margen = 20;
  const ancho = pw - margen * 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('DECLARACION JURADA DE LOS DOCENTES QUE PRESTAN SERVICIOS EN SEDES', pw / 2, 20, { align: 'center' });
  doc.text('DESCENTRALIZADAS', pw / 2, 27, { align: 'center' });

  let y = 40;

  // Párrafo introductorio
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  const dpto = escuela ? `Dpto. de ${escuela}` : 'Dpto. de Ingeniería de Sistemas';
  const intro = `Yo, ${nombreCompletoInvertido(docenteNombre)} identificado con DNI. Nro ${docenteDni || '.........'} con Código IBM Nro ............. del Departamento Académico ${dpto} Facultad de Ingeniería; en el marco del reglamento de funcionamiento de Sedes Descentralizadas (RCU Nro 072 CU-COG-2005/UNT) y la Directiva Nro 01-2007-VAC/UNT sobre Racionalización Académica del Personal Docentes que labora en las Sedes descentralizadas (R.C.U. Nro 576-2007/UNT) DECLARO BAJO JURAMENTO Y EN HONOR A LA VERDAD QUE:`;
  const introLines = doc.splitTextToSize(intro, ancho);
  doc.text(introLines, margen, y);
  y += introLines.length * 5.5 + 4;

  // Declaración principal
  doc.setFont('helvetica', 'bold');
  const decl = 'EN MI PRESTACION DE SERVICIOS EN SEDES DESCENTRALIZADAS NO ESTOY INCURSO EN INCOMPATIBILIDAD HORARIA NI CONTRAVENGO LA SIGUIENTE NORMATIVIDAD INSTITUCIONAL:';
  const declLines = doc.splitTextToSize(decl, ancho);
  doc.text(declLines, margen, y);
  y += declLines.length * 5.5 + 4;

  // Cláusulas normativas
  doc.setFont('helvetica', 'normal');
  const clausulas = [
    'Los docentes ordinarios a Dedicación Exclusiva y Tiempo Completo solo pueden tener carga horaria máxima de diez (10) horas semanales (num. 1 de la Directiva).',
    'Los docentes que ejercen cargos académicos y administrativos de: Jefe de Departamento Académico, Director de Escuela Académico Profesional, Director de Sección de Postgrado, Profesor Secretario de Facultad, Jefe de Oficina General, o cargos Directivos en Centros de Producción o líneas de Rentabilidad pueden asumir carga máxima de 05 horas semanales, siempre que sea en forma excepcional y por no contar con docente de la especialidad habilitada para asumir dicha carga. (num. 2 y 3 de la Directiva RCU Nro 005-2009/UNT y art.23 del Reglamento).',
    'Los docentes que ejercen cargo de Decano o Director de Postgrado y aquellos que prestan servicios en Centros de Producción y línea de Rentabilidad no pueden asumir carga horaria en Sedes Descentralizadas. (num. 3 de la Directiva ya art 23 del Reglamento).',
    'Los docentes beneficiados con becas de estudio de maestría o doctorado o Segunda especialidad solo pueden tener carga horaria máxima de tres (03) horas semanales. (num. 4 de la Directiva).',
    'El desarrollo de la carga en sede descentralizada no puede inferir con la carga lectiva y no lectiva asignada en la Sede Central; salvo el caso de las Sedes de Cascas, Huamachuco, Tayabamba y Santiago de Chuco en que se debe contar con Licencia por comisión de servicios y carta de compromiso del docente que asumiría la carga horaria en la Sede Central (num. 5 y 7 de la Directiva y art. 23 del Reglamento).',
    'Los docentes que asumen carga horaria en las Sedes de Huamachuco, Cascas, Santiago de Chuco y Tayabamba no pueden asumir labores durante el mismo periodo en otra Sede (num. 6 de la Directiva).',
  ];

  for (const clausula of clausulas) {
    if (y > 260) { doc.addPage(); y = 20; }
    const lines = doc.splitTextToSize(clausula, ancho);
    doc.text(lines, margen, y);
    y += lines.length * 5.5 + 3;
  }

  y += 3;
  if (y > 255) { doc.addPage(); y = 20; }

  // Cláusula de autorización (cursiva/negrita)
  const auth1 = 'En caso de faltar a la verdad así como de incurrir en incompatibilidad horaria contraviniendo los dispositivos pre-citados me avengo a las sanciones que correspondan,';
  const auth1Lines = doc.splitTextToSize(auth1, ancho);
  doc.text(auth1Lines, margen, y);
  y += auth1Lines.length * 5.5 + 2;

  doc.setFont('helvetica', 'bolditalic');
  const auth2 = 'y autorizo al funcionario competente disponga el descuento del pago por mis servicios en Sedes Descentralizadas, conforme al monto que la unidad de remuneraciones liquide como pago indebido por el periodo ilegalmente laborado.';
  const auth2Lines = doc.splitTextToSize(auth2, ancho);
  doc.text(auth2Lines, margen, y);
  y += auth2Lines.length * 5.5 + 10;

  // Fecha
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.text(fechaHoy(), pw - margen, y, { align: 'right' });
  y += 40;

  // Firma
  doc.line(pw / 2 - 35, y, pw / 2 + 35, y);
  doc.setFontSize(9.5);
  doc.text('FIRMA DEL DECLARANTE', pw / 2, y + 5, { align: 'center' });
  doc.text(`DNI: ${docenteDni || '.........'}`, pw / 2, y + 11, { align: 'center' });
  y += 25;

  // Nota al pie
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const nota = 'Nota: Los docentes deben suscribir de forma obligatoria el presente formato para prestar servicios en cada Sede Descentralizada, al reverso de la Declaración de la Carga Horaria';
  const notaLines = doc.splitTextToSize(nota, ancho);
  doc.text(notaLines, margen, y + 5);

  const nombre = (docenteNombre || 'Docente').replace(/\s+/g, '_');
  doc.save(`Formato2_DJ_SedesValles_${nombre}_${semestre}.pdf`);
}
