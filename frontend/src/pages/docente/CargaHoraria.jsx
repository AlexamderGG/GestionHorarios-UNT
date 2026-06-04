import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Save, CheckCircle, AlertCircle, Clock, BookOpen, Download, Activity, FileClock } from 'lucide-react';
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
    } finally {
      setLoading(false);
    }
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
  const maxHoras = resumen?.limites?.max || 40;
  const minHoras = resumen?.limites?.min || 30;
  const isValido = totalGeneral >= minHoras && totalGeneral <= maxHoras;
  const porcentaje = Math.min((totalGeneral / maxHoras) * 100, 100);

  let statusColor = "bg-primary-500";
  if (totalGeneral > maxHoras) statusColor = "bg-danger-500";
  else if (totalGeneral < minHoras) statusColor = "bg-warning-500";
  else statusColor = "bg-success-500";

  const handleGuardar = async () => {
    if (!isValido) {
      setMensaje({ tipo: 'error', texto: `El total debe estar entre ${minHoras} y ${maxHoras} horas.` });
      return;
    }

    setSaving(true);
    setMensaje(null);
    try {
      await api.post('/carga/mi-carga', { semestre, carga: form });
      setMensaje({ tipo: 'exito', texto: 'Declaración de carga horaria guardada correctamente.' });
      await cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.message || 'Error al guardar.' });
    } finally {
      setSaving(false);
    }
  };

  const generarPDF = () => {
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("UNIVERSIDAD NACIONAL DE TRUJILLO", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text("FACULTAD DE INGENIERÍA", 105, 27, { align: "center" });
    doc.text("ESCUELA DE INGENIERÍA DE SISTEMAS", 105, 34, { align: "center" });
    
    doc.setFontSize(13);
    doc.text("DECLARACIÓN JURADA DE CARGA HORARIA", 105, 45, { align: "center" });
    doc.setFontSize(10);
    doc.text(`SEMESTRE ACADÉMICO: ${semestre}`, 105, 52, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.text(`DOCENTE: ${user.nombres} ${user.apellidos}`, 15, 65);
    doc.text(`MODALIDAD: ${resumen.modalidad}`, 15, 72);
    
    // 1. Carga Lectiva
    doc.setFont("helvetica", "bold");
    doc.text("1. CARGA LECTIVA ASIGNADA", 15, 85);
    
    const cursosBody = misCursos.map(c => [
      c.curso_codigo || c.codigo,
      c.curso_nombre || c.nombre,
      c.tipo,
      c.horas_asignadas + "h"
    ]);

    autoTable(doc, {
      startY: 90,
      head: [['CÓDIGO', 'ASIGNATURA', 'TIPO', 'HORAS']],
      body: cursosBody.length > 0 ? cursosBody : [['-', 'Sin asignaciones', '-', '0h']],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], halign: 'center' },
      styles: { fontSize: 9 },
      columnStyles: { 3: { halign: 'center' } }
    });

    let finalY = doc.lastAutoTable.finalY + 5;
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL HORAS LECTIVAS: ${horasLectivas} horas`, 195, finalY, { align: "right" });

    // 2. Carga No Lectiva Oficial Completa
    finalY += 15;
    doc.setFont("helvetica", "bold");
    doc.text("2. CARGA NO LECTIVA DECLARADA", 15, finalY);

    const noLectivaBody = [
      ['1. Preparación de clases y evaluación', form.preparacion_clases_detalle || '-', form.preparacion_clases + 'h'],
      ['2. Tutoría y Consejería a estudiantes', form.tutoria_consejeria_detalle || '-', form.tutoria_consejeria + 'h'],
      ['3. Dirección / Asesoría de Tesis', form.asesoria_tesis_detalle || '-', form.asesoria_tesis + 'h'],
      ['4. Investigación', form.investigacion_detalle || '-', form.investigacion + 'h'],
      ['5. Responsabilidad Social', form.responsabilidad_social_detalle || '-', form.responsabilidad_social + 'h'],
      ['6. Producción Intelectual', form.produccion_intelectual_detalle || '-', form.produccion_intelectual + 'h'],
      ['7. Gestión Administrativa', form.gestion_admin_detalle || '-', form.gestion_admin + 'h'],
      ['8. Capacitación', form.capacitacion_detalle || '-', form.capacitacion + 'h'],
      ['9. Otras actividades', form.otras_actividades_detalle || '-', form.otras_actividades + 'h']
    ].filter(item => parseInt(item[2]) > 0); // Opcional: Filtra para no mostrar los que tienen 0h

    if (noLectivaBody.length === 0) noLectivaBody.push(['-', 'Sin actividades registradas', '0h']);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['ACTIVIDAD NO LECTIVA', 'DETALLE / DESCRIPCIÓN', 'HORAS']],
      body: noLectivaBody,
      theme: 'grid',
      headStyles: { fillColor: [46, 204, 113], halign: 'center' },
      styles: { fontSize: 8.5 },
      columnStyles: { 
        0: { cellWidth: 60 },
        1: { cellWidth: 'auto' }, 
        2: { cellWidth: 20, halign: 'center' } 
      }
    });

    finalY = doc.lastAutoTable.finalY + 5;
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL HORAS NO LECTIVAS: ${totalNoLectivo} horas`, 195, finalY, { align: "right" });

    // 3. Resumen Final
    finalY += 15;
    if (finalY > 260) { doc.addPage(); finalY = 20; }

    doc.setFillColor(240, 240, 240);
    doc.rect(15, finalY, 180, 15, "F");
    doc.setFontSize(12);
    doc.text(`TOTAL CARGA HORARIA GENERAL: ${totalGeneral} HORAS`, 105, finalY + 10, { align: "center" });

    // Firmas
    finalY += 50;
    if (finalY > 280) { doc.addPage(); finalY = 40; }

    doc.line(40, finalY, 90, finalY);
    doc.line(120, finalY, 170, finalY);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Firma del Docente", 65, finalY + 5, { align: "center" });
    doc.text("Firma del Director de Escuela", 145, finalY + 5, { align: "center" });

    doc.save(`Declaracion_Carga_Horaria_${user.apellidos}_${semestre}.pdf`);
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
          <button onClick={generarPDF} className="btn-secondary flex items-center gap-2 bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600">
            <Download className="w-4 h-4 text-primary-600 dark:text-primary-400" /> Descargar PDF Oficial
          </button>
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
              Límite requerido: Mínimo <strong className="text-neutral-700 dark:text-neutral-300">{minHoras}h</strong> — Máximo <strong className="text-neutral-700 dark:text-neutral-300">{maxHoras}h</strong>
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-neutral-900 dark:text-white leading-none">
              <span className={!isValido ? 'text-danger-500 dark:text-danger-400' : ''}>{totalGeneral}</span> 
              <span className="text-lg text-neutral-400 font-medium"> / {maxHoras}h</span>
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mt-1">Total Horas</p>
          </div>
        </div>

        <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-3 rounded-full overflow-hidden flex">
          <div className={`h-full ${statusColor} transition-all duration-500 ease-out`} style={{ width: `${porcentaje}%` }} />
        </div>
        {!isValido && (
          <p className="text-xs text-danger-500 dark:text-danger-400 mt-2 font-medium">
            {totalGeneral < minHoras ? `Te faltan ${minHoras - totalGeneral}h para alcanzar el mínimo.` : `Has excedido el límite por ${totalGeneral - maxHoras}h.`}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Detalle Lectivo (Solo Lectura) */}
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

        {/* Columna Derecha: Formulario No Lectivo con Detalles Completos */}
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
                {saving ? (
                  <>Guardando...</>
                ) : (
                  <><Save className="w-5 h-5" /> Guardar Declaración</>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CargaHoraria;