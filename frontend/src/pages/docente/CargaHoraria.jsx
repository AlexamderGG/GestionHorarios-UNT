import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Save, CheckCircle, AlertCircle, Clock, BookOpen, Download, Activity, FileClock, ShieldAlert } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CargaHoraria = () => {
  const { user } = useAuth();
  const [semestre, setSemestre] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  
  const [resumen, setResumen] = useState(null);
  const [misCursos, setMisCursos] = useState([]);
  
  const [form, setForm] = useState({
    preparacion_clases: 0, preparacion_clases_detalle: '',
    tutoria_consejeria: 0, tutoria_consejeria_detalle: '',
    asesoria_tesis: 0, asesoria_tesis_detalle: '',
    investigacion: 0, investigacion_detalle: '',
    responsabilidad_social: 0, responsabilidad_social_detalle: '',
    produccion_intelectual: 0, produccion_intelectual_detalle: '',
    gestion_admin: 0, gestion_admin_detalle: '',
    capacitacion: 0, capacitacion_detalle: '',
    otras_actividades: 0, otras_actividades_detalle: ''
  });

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const resConfig = await api.get('/configuracion');
      const semestreActivo = resConfig.data?.data?.semestre_activo || '2026-1';
      setSemestre(semestreActivo);

      const [resCarga, resCursos] = await Promise.all([
        api.get('/carga/mi-carga', { params: { semestre: semestreActivo } }),
        api.get('/docente/mis-cursos', { params: { semestre: semestreActivo } })
      ]);

      const dataCarga = resCarga.data.data;
      setResumen(dataCarga);
      setMisCursos(resCursos.data?.data || []);

      if (dataCarga.cargaNoLectiva) {
        setForm({
          preparacion_clases: dataCarga.cargaNoLectiva.preparacion_clases || 0,
          preparacion_clases_detalle: dataCarga.cargaNoLectiva.preparacion_clases_detalle || '',
          tutoria_consejeria: dataCarga.cargaNoLectiva.tutoria_consejeria || 0,
          tutoria_consejeria_detalle: dataCarga.cargaNoLectiva.tutoria_consejeria_detalle || '',
          asesoria_tesis: dataCarga.cargaNoLectiva.asesoria_tesis || 0,
          asesoria_tesis_detalle: dataCarga.cargaNoLectiva.asesoria_tesis_detalle || '',
          investigacion: dataCarga.cargaNoLectiva.investigacion || 0,
          investigacion_detalle: dataCarga.cargaNoLectiva.investigacion_detalle || '',
          responsabilidad_social: dataCarga.cargaNoLectiva.responsabilidad_social || 0,
          responsabilidad_social_detalle: dataCarga.cargaNoLectiva.responsabilidad_social_detalle || '',
          produccion_intelectual: dataCarga.cargaNoLectiva.produccion_intelectual || 0,
          produccion_intelectual_detalle: dataCarga.cargaNoLectiva.produccion_intelectual_detalle || '',
          gestion_admin: dataCarga.cargaNoLectiva.gestion_admin || 0,
          gestion_admin_detalle: dataCarga.cargaNoLectiva.gestion_admin_detalle || '',
          capacitacion: dataCarga.cargaNoLectiva.capacitacion || 0,
          capacitacion_detalle: dataCarga.cargaNoLectiva.capacitacion_detalle || '',
          otras_actividades: dataCarga.cargaNoLectiva.otras_actividades || 0,
          otras_actividades_detalle: dataCarga.cargaNoLectiva.otras_actividades_detalle || ''
        });
      }
    } catch (error) {
      console.error(error);
      setMensaje({ tipo: 'error', texto: 'Error al cargar los datos de tu carga horaria.' });
    } finally { setLoading(false); }
  };

  useEffect(() => { cargarDatos(); }, []);

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    setMensaje(null);
  };

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const horasLectivas = resumen?.horasLectivas || 0;
  const totalNoLectivo = 
    form.preparacion_clases + form.tutoria_consejeria + form.asesoria_tesis +
    form.investigacion + form.responsabilidad_social + form.produccion_intelectual +
    form.gestion_admin + form.capacitacion + form.otras_actividades;
    
  const totalGeneral = horasLectivas + totalNoLectivo;
  
  // NUENA LÓGICA DE HORAS EXACTAS
  // Usamos requerido, o si por alguna razón no viene, hacemos un fallback seguro.
  const horasRequeridas = resumen?.limites?.requerido || resumen?.limites?.max || 40; 
  const isValido = totalGeneral === horasRequeridas; // Validación estricta
  const porcentaje = Math.min((totalGeneral / horasRequeridas) * 100, 100);

  let statusColor = "bg-warning-500"; // Por defecto (si faltan horas)
  if (totalGeneral > horasRequeridas) statusColor = "bg-danger-500";
  else if (totalGeneral === horasRequeridas) statusColor = "bg-success-500";

  const handleGuardar = async () => {
    if (!isValido) {
      setMensaje({ tipo: 'error', texto: `Tu carga debe sumar exactamente ${horasRequeridas} horas (actualmente suma ${totalGeneral}h).` });
      return;
    }
    setSaving(true); setMensaje(null);
    try {
      await api.post('/carga/mi-carga', { semestre, carga: form });
      setMensaje({ tipo: 'exito', texto: 'Declaración de carga horaria guardada correctamente.' });
      await cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.message || 'Error al guardar.' });
    } finally { setSaving(false); }
  };

  // DOCUMENTO 1: REPORTE OFICIAL DE CARGA HORARIA ASIGNADA
  const generarPDFCarga = () => {
    const doc = new jsPDF();
    
    // ENCABEZADO OFICIAL
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("UNIVERSIDAD NACIONAL DE TRUJILLO", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text("FACULTAD DE INGENIERÍA", 105, 27, { align: "center" });
    doc.text("ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMAS", 105, 34, { align: "center" });
    
    doc.setFontSize(12);
    doc.text("DECLARACIÓN JURADA DE CARGA HORARIA ASIGNADA", 105, 45, { align: "center" });
    doc.setFontSize(11);
    doc.text(`SEMESTRE ACADÉMICO ${semestre}`, 105, 52, { align: "center" });

    // PÁRRAFO DE DECLARACIÓN
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const textoDeclaracion = `Yo, ${resumen.docenteNombre}, docente adscrito al Departamento Académico de Ingeniería de Sistemas con la categoría y régimen de dedicación de ${resumen.modalidad}, declaro bajo juramento que para el semestre académico ${semestre}, tengo la siguiente carga horaria:`;
    
    const lineasTexto = doc.splitTextToSize(textoDeclaracion, 170);
    doc.text(lineasTexto, 20, 65);
    
    let finalY = 65 + (lineasTexto.length * 5) + 5;

    // TABLA I: CARGA LECTIVA
    doc.setFont("helvetica", "bold");
    doc.text("I. CARGA LECTIVA (según consolidado de carga lectiva)", 20, finalY);
    
    const cursosBody = misCursos.map((c, i) => [
      i + 1,
      c.curso_nombre || c.nombre,
      "Ing. de Sistemas", 
      c.ciclo || c.curso_ciclo || "-",
      (c.tipo === 'Teoria' || c.tipo === 'Teoría') ? c.horas_asignadas : "-",
      (c.tipo === 'Practica' || c.tipo === 'Práctica') ? c.horas_asignadas : "-",
      c.tipo === 'Laboratorio' ? c.horas_asignadas : "-",
      c.grupo && c.grupo !== 'Único' ? c.grupo : "-",
      "-", 
      c.horas_asignadas
    ]);

    cursosBody.push(["", "TOTAL", "", "", "", "", "", "", "", horasLectivas]);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['N°', 'Asignatura', 'Escuela / Departamento', 'Ciclo', 'Teoría', 'Práctica', 'Lab.', 'N° Grupo', 'N° Est.', 'Total']],
      body: cursosBody,
      theme: 'grid',
      headStyles: { fillColor: [230, 230, 230], textColor: [0,0,0], halign: 'center', fontSize: 8, fontStyle: 'bold' },
      styles: { fontSize: 8, halign: 'center', cellPadding: 1.5, textColor: [0,0,0] },
      columnStyles: { 
        1: { halign: 'left', cellWidth: 45 },
        2: { halign: 'center', cellWidth: 25 }
      },
      willDrawCell: function(data) {
        if (data.row.index === cursosBody.length - 1 && data.section === 'body') {
          doc.setFont("helvetica", "bold");
          doc.setFillColor(240, 240, 240);
        }
      }
    });

    finalY = doc.lastAutoTable.finalY + 10;

    // TABLA II: CARGA NO LECTIVA
    doc.setFont("helvetica", "bold");
    doc.text("II. CARGA NO LECTIVA (Según cronograma de trabajo en portafolio de docente)", 20, finalY);

    const noLectivaBody = [];
    let idx = 1;
    
    const addActividad = (actividad, detalle, horas) => {
      if (horas > 0) noLectivaBody.push([idx++, actividad, detalle || '-', horas]);
    };

    addActividad('Preparación de clases y evaluación', form.preparacion_clases_detalle, form.preparacion_clases);
    addActividad('Tutoría y Consejería a estudiantes', form.tutoria_consejeria_detalle, form.tutoria_consejeria);
    addActividad('Dirección / Asesoría de Tesis', form.asesoria_tesis_detalle, form.asesoria_tesis);
    addActividad('Investigación', form.investigacion_detalle, form.investigacion);
    addActividad('Responsabilidad Social', form.responsabilidad_social_detalle, form.responsabilidad_social);
    addActividad('Producción Intelectual', form.produccion_intelectual_detalle, form.produccion_intelectual);
    addActividad('Gestión Administrativa', form.gestion_admin_detalle, form.gestion_admin);
    addActividad('Capacitación', form.capacitacion_detalle, form.capacitacion);
    addActividad('Otras actividades', form.otras_actividades_detalle, form.otras_actividades);

    if (noLectivaBody.length === 0) noLectivaBody.push(['-', 'Sin actividades registradas', '-', '0']);

    noLectivaBody.push(['', 'TOTAL', '', totalNoLectivo]);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['N°', 'Actividad', 'Descripción de la Actividad (Indicar Proyecto / Resolución)', 'Horas']],
      body: noLectivaBody,
      theme: 'grid',
      headStyles: { fillColor: [230, 230, 230], textColor: [0,0,0], halign: 'center', fontSize: 8, fontStyle: 'bold' },
      styles: { fontSize: 8, halign: 'center', cellPadding: 1.5, textColor: [0,0,0] },
      columnStyles: { 
        1: { halign: 'left', cellWidth: 50 },
        2: { halign: 'left', cellWidth: 'auto' }, 
        3: { cellWidth: 20, halign: 'center' } 
      },
      willDrawCell: function(data) {
        if (data.row.index === noLectivaBody.length - 1 && data.section === 'body') {
          doc.setFont("helvetica", "bold");
          doc.setFillColor(240, 240, 240);
        }
      }
    });

    finalY = doc.lastAutoTable.finalY + 10;
    
    if (finalY > 220) { doc.addPage(); finalY = 20; }

    // TABLA III: RESUMEN
    doc.setFont("helvetica", "bold");
    doc.text("III. RESUMEN DE CARGA HORARIA", 20, finalY);

    autoTable(doc, {
      startY: finalY + 5,
      body: [
        ['Carga Lectiva', horasLectivas],
        ['Carga No Lectiva', totalNoLectivo],
        ['TOTAL', totalGeneral]
      ],
      theme: 'grid',
      styles: { fontSize: 9, halign: 'left', cellPadding: 2, textColor: [0,0,0] },
      columnStyles: { 
        0: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 60 },
        1: { halign: 'center', cellWidth: 30 }
      },
      willDrawCell: function(data) {
        if (data.row.index === 2) doc.setFont("helvetica", "bold");
      }
    });

    finalY = doc.lastAutoTable.finalY + 15;
    if (finalY > 260) { doc.addPage(); finalY = 30; }

    // FECHA Y FIRMAS
    const hoy = new Date();
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Trujillo, ${hoy.getDate()} de ${meses[hoy.getMonth()]} del ${hoy.getFullYear()}`, 190, finalY, { align: "right" });

    finalY += 40; 
    
    doc.line(30, finalY, 80, finalY);
    doc.line(130, finalY, 180, finalY);
    
    doc.text("Firma del Docente", 55, finalY + 5, { align: "center" });
    doc.text("Firma del Director(a) de\nDepartamento Académico", 155, finalY + 5, { align: "center" });

    doc.save(`Declaracion_Carga_Horaria_${resumen.docenteNombre}_${semestre}.pdf`);
  };

  // DOCUMENTO 2: DECLARACIÓN JURADA DE NO INCOMPATIBILIDAD NI IMPEDIMENTO LABORAL
  const generarPDFIncompatibilidad = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFont("helvetica", "bold"); doc.setFontSize(14);
      doc.text("UNIVERSIDAD NACIONAL DE TRUJILLO", 105, 20, { align: "center" });
      doc.setFontSize(12); doc.text("FACULTAD DE INGENIERÍA", 105, 27, { align: "center" });
      doc.text("ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMAS", 105, 34, { align: "center" });
      
      doc.setFontSize(11);
      doc.text("DECLARACIÓN JURADA DE NO ESTAR INCURSO EN CAUSALES DE INCOMPATIBILIDAD", 105, 48, { align: "center" });
      doc.text("O IMPEDIMENTO LABORAL O LEGAL", 105, 54, { align: "center" });

      doc.setFont("helvetica", "normal"); doc.setFontSize(11);
      let textY = 70;
      let startX = 20; 

      const prefixText = `Yo, `;
      doc.text(prefixText, startX, textY);
      startX += doc.getTextWidth(prefixText); 

      doc.setFont("helvetica", "bold");
      const nameText = resumen.docenteNombre;
      doc.text(nameText, startX, textY);
      startX += doc.getTextWidth(nameText); 

      doc.setFont("helvetica", "normal");
      const midText = `, identificado con Documento Nacional de Identidad N° `;
      doc.text(midText, startX, textY);
      startX += doc.getTextWidth(midText); 

      textY += 6;
      startX = 20; 

      doc.setFont("helvetica", "bold");
      const dniText = resumen.docenteDni || '........................';
      doc.text(dniText, startX, textY);
      startX += doc.getTextWidth(dniText); 

      doc.setFont("helvetica", "normal");
      const addressPrefix = `, con domicilio real en ...................................................................................................................`;
      doc.text(addressPrefix, startX, textY);

      textY += 6;
      
      doc.setFont("helvetica", "normal"); doc.setFontSize(10.5);
      textY += 8;
      
      const clausulas = [
        `1. Que, a la fecha no me encuentro incurso en causales de Incompatibilidad horaria, ni impedimento laboral o legal para ejercer la docencia universitaria en la Universidad Nacional de Trujillo durante el Semestre Académico ${semestre}.`,
        `2. Que, no ejerzo cargo ni función pública o privada de manera coincidente o superpuesta con las horas consignadas en mi Malla Horaria Oficial y Declaración de Carga Horaria Asignada de este periodo académico, garantizando estricta exclusividad.`,
        `3. Que, no percibo doble remuneración del Estado, salvo por función docente o de acuerdo a las excepciones de Ley vigentes, cumpliendo a cabalidad con la Ley Universitaria N° 30220 y el Estatuto de la UNT.`,
        `4. Que, asumo total responsabilidad sobre la veracidad de la información y horas declaradas. En caso de comprobarse fraude o falsedad, me someto voluntariamente a los procesos administrativos disciplinarios y acciones penales tipificadas en la Ley N° 27444 (Ley del Procedimiento Administrativo General) y el Código Penal.`
      ];

      clausulas.forEach(clausula => {
        const lines = doc.splitTextToSize(clausula, 170);
        doc.text(lines, 20, textY);
        textY += (lines.length * 5.5) + 3;
      });

      textY += 10;
      const hoy = new Date(); const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      doc.text(`Trujillo, ${hoy.getDate()} de ${meses[hoy.getMonth()]} del ${hoy.getFullYear()}`, 190, textY, { align: "right" });

      textY += 45;
      doc.line(30, textY, 100, textY); 
      doc.text("Firma del Docente", 65, textY + 5, { align: "center" });
      doc.text(`D.N.I. N°: ${resumen.docenteDni || '........................'}`, 65, textY + 10, { align: "center" });

      doc.rect(140, textY - 30, 32, 40); 
      doc.setFontSize(8);
      doc.text("HUELLA DIGITAL", 156, textY + 14, { align: "center" });

      const nArch = resumen.docenteNombre ? resumen.docenteNombre.replace(/\s+/g, '_') : 'Docente';
      doc.save(`DJ_No_Incompatibilidad_${nArch}_${semestre}.pdf`);
    } catch (err) { alert("Error al generar la Declaración Jurada."); console.error(err); }
  };

  if (loading) return <div className="p-10 text-center text-neutral-500 animate-pulse">Cargando tu información de carga horaria...</div>;

  const inputConfig = [
    { label: "1. Preparación de Clases y Eval.", key: "preparacion_clases", placeholder: "Detalle de cursos (Opcional)" },
    { label: "2. Tutoría y Consejería", key: "tutoria_consejeria", placeholder: "Alumnos asignados (Opcional)" },
    { label: "3. Asesoría de Tesis", key: "asesoria_tesis", placeholder: "Ej. Tesis pregrado de Juan Pérez..." },
    { label: "4. Investigación", key: "investigacion", placeholder: "Ej. Proyecto PIC / Artículo Scopus..." },
    { label: "5. Responsabilidad Social", key: "responsabilidad_social", placeholder: "Ej. Proyecto de Extensión..." },
    { label: "6. Producción Intelectual", key: "produccion_intelectual", placeholder: "Ej. Redacción de libro/artículo..." },
    { label: "7. Gestión Administrativa", key: "gestion_admin", placeholder: "Ej. Director de Escuela / Comités..." },
    { label: "8. Capacitación Docente", key: "capacitacion", placeholder: "Ej. Diplomado / Cursos..." },
    { label: "9. Otras Actividades", key: "otras_actividades", placeholder: "Especifique..." }
  ];

  return (
    <div className="max-w-5xl animate-fade-in pb-10">
      <div className="mb-6 flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <FileClock className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            Declaración de Carga Horaria
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Semestre {semestre} · Declara tus horas y actividades de carga no lectiva
          </p>
        </div>
        
        {resumen?.cargaNoLectiva && (
          <div className="flex gap-2">
            <button onClick={generarPDFCarga} className="btn-secondary flex items-center gap-2 bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-xs py-2 px-3">
              <Download className="w-4 h-4 text-primary-600 dark:text-primary-400" /> Carga Horaria PDF
            </button>
            <button onClick={generarPDFIncompatibilidad} className="btn-secondary flex items-center gap-2 bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-xs py-2 px-3">
              <Download className="w-4 h-4 text-red-600 dark:text-red-400" /> DJ Incompatibilidad
            </button>
          </div>
        )}
      </div>

      {mensaje && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-slide-down ${mensaje.tipo === 'error' ? 'bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400 border border-danger-200' : 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400 border border-success-200'}`}>
          {mensaje.tipo === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <CheckCircle className="w-5 h-5 flex-shrink-0" />}
          {mensaje.texto}
        </div>
      )}

      {/* Tarjeta de Resumen y Progreso */}
      <div className="card bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-5 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-500" />
              Modalidad: {resumen?.modalidad}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Total exigido por modalidad: <strong className="text-neutral-700 dark:text-neutral-300">{horasRequeridas}h exactas</strong>
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-neutral-900 dark:text-white leading-none">
              <span className={!isValido ? 'text-danger-500 dark:text-danger-400' : ''}>{totalGeneral}</span> 
              <span className="text-lg text-neutral-400 font-medium"> / {horasRequeridas}h</span>
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mt-1">Total Horas</p>
          </div>
        </div>

        <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-3 rounded-full overflow-hidden flex">
          <div className={`h-full ${statusColor} transition-all duration-500 ease-out`} style={{ width: `${porcentaje}%` }} />
        </div>
        {!isValido && (
          <p className="text-xs text-danger-500 dark:text-danger-400 mt-2 font-medium">
            {totalGeneral < horasRequeridas 
              ? `Te faltan ${horasRequeridas - totalGeneral}h para completar tu requerimiento.` 
              : `Has excedido tu requerimiento por ${totalGeneral - horasRequeridas}h.`}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detalle Lectivo */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 h-full">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-primary-500" /> Carga Lectiva Fija
            </h3>
            <div className="space-y-3">
              {misCursos.length === 0 ? (
                <p className="text-sm text-neutral-500 italic">No tienes cursos asignados aún.</p>
              ) : (
                misCursos.map(c => (
                  <div key={c.id} className="flex justify-between items-start border-b border-neutral-200 dark:border-neutral-700/50 pb-2 last:border-0">
                    <div>
                      <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{c.curso_codigo || c.codigo}</p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight">{c.curso_nombre || c.nombre}</p>
                      <span className="text-[10px] px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded mt-1 inline-block font-medium">
                        {c.tipo}
                      </span>
                    </div>
                    <span className="text-sm font-black text-neutral-700 dark:text-neutral-300">{c.horas_asignadas}h</span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-300 dark:border-neutral-600 flex justify-between items-center">
              <span className="text-sm font-bold text-neutral-600 dark:text-neutral-400">Total Lectivo:</span>
              <span className="text-lg font-black text-primary-700 dark:text-primary-400">{horasLectivas}h</span>
            </div>
          </div>
        </div>

        {/* Formulario desglosado */}
        <div className="lg:col-span-2">
          <div className="card p-5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" /> Desglose de Carga No Lectiva
            </h3>
            
            <div className="space-y-3">
              {inputConfig.map((item) => (
                <div key={item.key} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-neutral-50 dark:bg-neutral-900/50 p-2.5 rounded border border-transparent dark:border-neutral-800">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 md:col-span-4">{item.label}</label>
                  <div className="md:col-span-6">
                    <input 
                      type="text" 
                      placeholder={item.placeholder} 
                      name={`${item.key}_detalle`} 
                      value={form[`${item.key}_detalle`]} 
                      onChange={handleTextChange} 
                      className="input w-full text-xs dark:bg-neutral-900" 
                    />
                  </div>
                  <div className="relative md:col-span-2">
                    <input 
                      type="number" 
                      min="0" 
                      name={item.key} 
                      value={form[item.key]} 
                      onChange={handleNumberChange} 
                      className="input w-full pr-7 text-right font-bold text-primary-700 dark:text-primary-400 dark:bg-neutral-900" 
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-medium">h</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between items-center bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800/50">
              <span className="text-sm font-bold text-amber-800 dark:text-amber-400">Subtotal No Lectivo:</span>
              <span className="text-xl font-black text-amber-700 dark:text-amber-500">{totalNoLectivo}h</span>
            </div>

            <div className="mt-6 border-t border-neutral-200 dark:border-neutral-700 pt-5 flex justify-end">
              <button 
                onClick={handleGuardar} 
                disabled={saving || !isValido} 
                className="btn-primary flex items-center gap-2 py-2.5 px-6 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {saving ? <>Guardando...</> : <><Save className="w-5 h-5" /> Guardar Declaración</>}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CargaHoraria;