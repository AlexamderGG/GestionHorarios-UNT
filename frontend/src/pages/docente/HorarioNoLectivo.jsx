import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../services/api";
import { 
  Clock, Calendar, Save, Trash2, Plus, X, AlertCircle, CheckCircle2, Building2, BookOpen
} from "lucide-react";

// Días de la semana universitarios
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

// Sugerencias base de ambientes no lectivos
const AMBIENTES_BASE = ["Cubículo", "Sala de Profesores", "Laboratorio de Investigación", "Biblioteca Central"];

// 🚀 CAMBIO: Generar bloques horarios de 07:00 a 22:00 (SOLO HORAS ENTERAS)
const HORAS_VALIDAS = [];
for (let i = 7; i <= 22; i++) {
  HORAS_VALIDAS.push(`${String(i).padStart(2, '0')}:00`);
}

const timeToMinutes = (t) => {
  if (!t) return 0;
  const [h, m] = String(t).slice(0, 5).split(":").map(Number);
  return h * 60 + m;
};

const HorarioNoLectivo = () => {
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const [docenteInfo, setDocenteInfo] = useState(null);
  
  // Datos del backend
  const [horarioLectivo, setHorarioLectivo] = useState([]); 
  const [actividadesNoLectivas, setActividadesNoLectivas] = useState([]); 
  const [bloquesNoLectivosGuardados, setBloquesNoLectivosGuardados] = useState([]); 

  // Estado del Formulario para agregar bloque
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    actividad_id: "",
    dia: "Lunes",
    hora_inicio: "08:00",
    hora_fin: "10:00",
    ambiente: "Cubículo"
  });
  const [guardando, setGuardando] = useState(false);

  const semestre = "2026-1"; 

  const cargarInformacionHoraria = useCallback(async () => {
    setLoading(true);
    try {
      const resPerfil = await api.get("/auth/me");
      const docenteId = resPerfil.data?.data?.id;
      setDocenteInfo(resPerfil.data?.data);

      if (docenteId) {
        const [resLectiva, resActividades, resNoLectivaAgendada] = await Promise.all([
          api.get(`/docente/${docenteId}/horario-lectivo`, { params: { semestre } }),
          api.get(`/carga/docente/${docenteId}`, { params: { semestre } }), 
          api.get(`/docente/${docenteId}/horario-no-lectivo`, { params: { semestre } })
        ]);

        setHorarioLectivo(resLectiva.data?.data || []);
        
        const cargaNL = resActividades.data?.data?.cargaNoLectiva || {};
        const listaActividades = [
          { id: "preparacion", nombre: "Preparación de Clases", horas_asignadas: Number(cargaNL.preparacion_clases) || 0 },
          { id: "tutoria", nombre: "Tutoría y Consejería", horas_asignadas: Number(cargaNL.tutoria_consejeria) || 0 },
          { id: "asesoria", nombre: "Asesoría de Tesis", horas_asignadas: Number(cargaNL.asesoria_tesis) || 0 },
          { id: "investigacion", nombre: "Investigación", horas_asignadas: Number(cargaNL.investigacion) || 0 },
          { id: "responsabilidad", nombre: "Responsabilidad Social", horas_asignadas: Number(cargaNL.responsabilidad_social) || 0 },
          { id: "gestion", nombre: "Gestión Administrativa", horas_asignadas: Number(cargaNL.gestion_admin) || 0 }
        ].filter(act => act.horas_asignadas > 0); 

        setActividadesNoLectivas(listaActividades);
        setBloquesNoLectivosGuardados(resNoLectivaAgendada.data?.data || []);
      }
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: "error", texto: "Error al sincronizar tu disponibilidad horaria." });
    } finally {
      setLoading(false);
    }
  }, [semestre]);

  useEffect(() => {
    cargarInformacionHoraria();
  }, [cargarInformacionHoraria]);

  const handleInputChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // FUNCIÓN AISLADA PARA VERIFICAR CRUCES EN CUALQUIER RANGO
  const verificarCruceFisico = useCallback((diaStr, inicioN, finN) => {
    const cruceLectivo = horarioLectivo.some(h => {
      if (h.dia.toLowerCase() !== diaStr.toLowerCase()) return false;
      return inicioN < timeToMinutes(h.hora_fin) && finN > timeToMinutes(h.hora_inicio);
    });
    if (cruceLectivo) return true;

    const cruceNoLectivo = bloquesNoLectivosGuardados.some(h => {
      if (h.dia.toLowerCase() !== diaStr.toLowerCase()) return false;
      return inicioN < timeToMinutes(h.hora_fin) && finN > timeToMinutes(h.hora_inicio);
    });
    if (cruceNoLectivo) return true;

    return false;
  }, [horarioLectivo, bloquesNoLectivosGuardados]);


  const verificacionChoque = useMemo(() => {
    if (!modalOpen) return { hayCruce: false, motivo: "" };

    const inicioN = timeToMinutes(form.hora_inicio);
    const finN = timeToMinutes(form.hora_fin);

    if (inicioN >= finN) return { hayCruce: true, motivo: "La hora de inicio debe ser menor a la hora de fin." };
    if (verificarCruceFisico(form.dia, inicioN, finN)) return { hayCruce: true, motivo: "El rango seleccionado entra en conflicto con una actividad existente." };

    const actividadSel = actividadesNoLectivas.find(a => a.id === form.actividad_id);
    if (actividadSel) {
      const horasYaAgendadas = bloquesNoLectivosGuardados
        .filter(b => b.actividad_id === form.actividad_id)
        .reduce((sum, b) => sum + ((timeToMinutes(b.hora_fin) - timeToMinutes(b.hora_inicio)) / 60), 0);
      
      const horasNuevas = (finN - inicioN) / 60;
      if (horasYaAgendadas + horasNuevas > actividadSel.horas_asignadas) {
        return { hayCruce: true, motivo: `Excedes las horas asignadas para esta actividad. Máximo permitido: ${actividadSel.horas_asignadas}h.` };
      }
    }

    return { hayCruce: false, motivo: "" };
  }, [form, modalOpen, verificarCruceFisico, actividadesNoLectivas, bloquesNoLectivosGuardados]);

  const listaAmbientesDinamicos = useMemo(() => {
    const guardados = bloquesNoLectivosGuardados.map(b => b.ambiente).filter(Boolean);
    return [...new Set([...AMBIENTES_BASE, ...guardados])].sort();
  }, [bloquesNoLectivosGuardados]);

  const handleGuardarBloque = async (e) => {
    e.preventDefault();
    if (verificacionChoque.hayCruce || !form.actividad_id || guardando) return;

    setGuardando(true);
    try {
      const actividadSel = actividadesNoLectivas.find(a => a.id === form.actividad_id);
      const payload = {
        ...form,
        actividad_nombre: actividadSel?.nombre,
        docente_id: docenteInfo?.id,
        semestre
      };

      await api.post("/docente/horario-no-lectivo", payload);
      setMensaje({ tipo: "exito", texto: "Bloque horario no lectivo agendado correctamente." });
      setModalOpen(false);
      cargarInformacionHoraria();
    } catch (error) {
      setMensaje({ tipo: "error", texto: "Error al registrar las horas no lectivas." });
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarBloque = async (id) => {
    if (!confirm("¿Deseas retirar este bloque de tu horario no lectivo?")) return;
    try {
      await api.delete(`/docente/horario-no-lectivo/${id}`);
      setMensaje({ tipo: "exito", texto: "Bloque horario liberado." });
      cargarInformacionHoraria();
    } catch (error) {
      setMensaje({ tipo: "error", texto: "No se pudo eliminar el bloque." });
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-neutral-500">Sincronizando mallas y disponibilidad lectiva...</div>;
  }

  return (
    <div className="p-6 md:p-8 lg:p-10 w-full mx-auto space-y-6 flex flex-col h-full text-neutral-900 dark:text-white transition-colors duration-300">
      
      {/* Alertas Globales */}
      {mensaje && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 p-4 rounded-xl shadow-xl text-white ${mensaje.tipo === 'exito' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {mensaje.tipo === 'exito' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{mensaje.texto}</span>
          <button onClick={() => setMensaje(null)} className="ml-2 opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-7 h-7 text-indigo-600" /> Mi Carga No Lectiva
          </h1>
          <p className="text-sm text-neutral-500">Establece tus horas de tutoría, investigación y preparación evaluando cruces con tus clases lectivas.</p>
        </div>
        <button 
          onClick={() => {
            if (actividadesNoLectivas.length === 0) {
              alert("No tienes actividades no lectivas asignadas por la secretaría para este semestre.");
              return;
            }
            setForm(prev => ({ ...prev, actividad_id: actividadesNoLectivas[0]?.id }));
            setModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all"
        >
          <Plus className="w-4 h-4" /> Agendar Horas No Lectivas
        </button>
      </div>

      {/* Grid Distribuidor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* PANEL DE CONTROL DE HORAS ASIGNADAS */}
        <div className="lg:col-span-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" /> Resumen de Obligaciones
          </h2>
          <div className="space-y-3">
            {actividadesNoLectivas.map(act => {
              const horasAgendadas = bloquesNoLectivosGuardados
                .filter(b => b.actividad_id === act.id)
                .reduce((sum, b) => sum + ((timeToMinutes(b.hora_fin) - timeToMinutes(b.hora_inicio)) / 60), 0);
              const porcentaje = Math.min(100, (horasAgendadas / act.horas_asignadas) * 100);

              return (
                <div key={act.id} className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-100 dark:border-neutral-800">
                  <div className="flex justify-between items-center text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    <span>{act.nombre}</span>
                    <span className="font-mono">{horasAgendadas}h / {act.horas_asignadas}h</span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 mt-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${porcentaje === 100 ? "bg-emerald-500" : "bg-indigo-500"}`} 
                      style={{ width: `${porcentaje}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AGENDA COMPLETA DEL DOCENTE (LECTIVA + NO LECTIVA) */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 font-bold text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neutral-400" /> Cronograma de Permanencia del Semestre
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-400 uppercase bg-neutral-50/40 dark:bg-transparent">
                  <th className="p-3">Día</th>
                  <th className="p-3">Horario</th>
                  <th className="p-3">Actividad / Curso</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Ambiente Asignado</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm">
                
                {horarioLectivo.map((lect, idx) => (
                  <tr key={`lect-${idx}`} className="bg-blue-50/20 dark:bg-blue-950/10">
                    <td className="p-3 font-semibold text-blue-700 dark:text-blue-400">{lect.dia}</td>
                    <td className="p-3 font-mono text-xs">{lect.hora_inicio} - {lect.hora_fin}</td>
                    <td className="p-3 font-medium">{lect.curso_nombre}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded text-2xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Lectiva (Clase)</span></td>
                    <td className="p-3 text-xs text-neutral-500 flex items-center gap-1 mt-1.5"><Building2 className="w-3.5 h-3.5" /> {lect.ambiente_codigo || "Aula/Lab"}</td>
                    <td className="p-3 text-right text-xs text-neutral-400 italic">Fijo</td>
                  </tr>
                ))}

                {bloquesNoLectivosGuardados.map((bloque) => (
                  <tr key={bloque.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                    <td className="p-3 font-semibold text-indigo-600 dark:text-indigo-400">{bloque.dia}</td>
                    <td className="p-3 font-mono text-xs">{bloque.hora_inicio} - {bloque.hora_fin}</td>
                    <td className="p-3 font-medium">{bloque.actividad_nombre}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded text-2xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">No Lectiva</span></td>
                    <td className="p-3 text-xs text-neutral-600 dark:text-neutral-300 font-medium flex items-center gap-1 mt-1.5"><Building2 className="w-3.5 h-3.5 text-indigo-400" /> {bloque.ambiente}</td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => handleEliminarBloque(bloque.id)} 
                        className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Retirar bloque"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {horarioLectivo.length === 0 && bloquesNoLectivosGuardados.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-neutral-400">No registras ninguna actividad académica agendada para esta semana.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL CONFIGURADOR DE HORAS NO LECTIVAS */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden">
            
            <datalist id="ambientes-no-lectivos">
              {listaAmbientesDinamicos.map(a => <option key={a} value={a} />)}
            </datalist>

            <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/20">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold">Agendar Bloque de Permanencia</h2>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleGuardarBloque} className="p-5 space-y-4">
              
              <div>
                <label className="block text-xs font-semibold mb-1">Selecciona la actividad a agendar</label>
                <select name="actividad_id" value={form.actividad_id} onChange={handleInputChange} required className="w-full text-sm p-2.5 bg-neutral-50 dark:bg-neutral-800 border rounded-lg outline-none font-medium">
                  {actividadesNoLectivas.map(act => (
                    <option key={act.id} value={act.id}>{act.nombre} (Máx asignado: {act.horas_asignadas}h)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Día de la semana</label>
                  <select name="dia" value={form.dia} onChange={handleInputChange} className="w-full text-sm p-2.5 bg-neutral-50 dark:bg-neutral-800 border rounded-lg outline-none">
                    {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                
                {/* 🚀 COMBOBOX HORA DE INICIO (BLOQUEO DINÁMICO HORAS ENTERAS) */}
                <div>
                  <label className="block text-xs font-semibold mb-1 text-center">Hora de Inicio</label>
                  <select 
                    name="hora_inicio" 
                    value={form.hora_inicio} 
                    onChange={handleInputChange} 
                    required 
                    className="w-full text-sm p-2.5 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-center outline-none"
                  >
                    <option value="" disabled>Seleccione...</option>
                    {HORAS_VALIDAS.map(hora => {
                      const inicioMin = timeToMinutes(hora);
                      const finMin = inicioMin + 60; // Verifica bloque mínimo de 1 hora
                      const ocupado = verificarCruceFisico(form.dia, inicioMin, finMin);
                      return (
                        <option key={`in-${hora}`} value={hora} disabled={ocupado}>
                          {hora} {ocupado ? '(Ocupado)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 🚀 COMBOBOX HORA DE FIN (BLOQUEO DINÁMICO HORAS ENTERAS) */}
                <div>
                  <label className="block text-xs font-semibold mb-1 text-center">Hora de Fin</label>
                  <select 
                    name="hora_fin" 
                    value={form.hora_fin} 
                    onChange={handleInputChange} 
                    required 
                    className="w-full text-sm p-2.5 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-center outline-none"
                  >
                    <option value="" disabled>Seleccione...</option>
                    {HORAS_VALIDAS.map(hora => {
                      const inicioMin = timeToMinutes(form.hora_inicio);
                      const finMin = timeToMinutes(hora);
                      
                      if (!form.hora_inicio || finMin <= inicioMin) {
                        return <option key={`fin-${hora}`} value={hora} disabled>{hora}</option>;
                      }

                      const cruce = verificarCruceFisico(form.dia, inicioMin, finMin);
                      
                      let excedeLímite = false;
                      const actividadSel = actividadesNoLectivas.find(a => a.id === form.actividad_id);
                      if (actividadSel) {
                        const horasYa = bloquesNoLectivosGuardados
                          .filter(b => b.actividad_id === form.actividad_id)
                          .reduce((sum, b) => sum + ((timeToMinutes(b.hora_fin) - timeToMinutes(b.hora_inicio)) / 60), 0);
                        
                        const horasNuevas = (finMin - inicioMin) / 60;
                        if (horasYa + horasNuevas > actividadSel.horas_asignadas) excedeLímite = true;
                      }

                      const bloqueado = cruce || excedeLímite;
                      let etiqueta = hora;
                      if (cruce) etiqueta += " (Cruce)";
                      else if (excedeLímite) etiqueta += " (Excede límite)";

                      return (
                        <option key={`fin-${hora}`} value={hora} disabled={bloqueado}>
                          {etiqueta}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Ambiente de Trabajo / Permanencia</label>
                <input 
                  list="ambientes-no-lectivos"
                  name="ambiente"
                  value={form.ambiente}
                  onChange={handleInputChange}
                  required
                  placeholder="Ej: Cubículo, Laboratorio Especializado..."
                  className="w-full text-sm p-2.5 bg-neutral-50 dark:bg-neutral-800 border rounded-lg outline-none font-medium focus:border-indigo-500"
                />
                <p className="text-[10px] text-neutral-400 mt-1">Si vas a trabajar en un aula o ambiente nuevo, bórralo y escríbelo directamente en la caja de texto.</p>
              </div>

              {/* AVISO CRÍTICO DE CRUCE EN TIEMPO REAL */}
              {verificacionChoque.hayCruce && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-xs font-semibold text-red-700 dark:text-red-400 animate-pulse">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{verificacionChoque.motivo}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-700">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={verificacionChoque.hayCruce || !form.actividad_id || guardando}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> {guardando ? "Registrando..." : "Confirmar Horario"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default HorarioNoLectivo;