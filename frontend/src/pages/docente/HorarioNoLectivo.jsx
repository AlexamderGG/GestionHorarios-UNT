import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../services/api";
import { Clock, Calendar, Save, Trash2, Plus, X, AlertCircle, CheckCircle2, Building2, BookOpen } from "lucide-react";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const AMBIENTES_BASE = ["Cubículo", "Sala de Profesores", "Laboratorio de Investigación", "Biblioteca Central"];

const HORAS_VALIDAS = [];
for (let i = 7; i <= 22; i++) HORAS_VALIDAS.push(`${String(i).padStart(2, '0')}:00`);

const normalizeDia = (d) => String(d || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

const timeToMinutes = (t) => {
  if (!t || typeof t !== 'string') return 0;
  const parts = t.slice(0, 5).split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
};

const HorarioNoLectivo = () => {
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const [docenteInfo, setDocenteInfo] = useState(null);
  const [horarioLectivo, setHorarioLectivo] = useState([]); 
  const [actividadesNoLectivas, setActividadesNoLectivas] = useState([]); 
  const [bloquesNoLectivosGuardados, setBloquesNoLectivosGuardados] = useState([]); 
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ actividad_id: "", dia: "Lunes", hora_inicio: "08:00", hora_fin: "09:00", ambiente: "Cubículo" });
  const [guardando, setGuardando] = useState(false);

  const semestre = "2026-1"; 

  const cargarInformacionHoraria = useCallback(async () => {
    setLoading(true);
    try {
      const resPerfil = await api.get("/auth/me");
      const docenteId = resPerfil.data?.data?.id;
      
      if (docenteId) {
        const perfilExtra = await api.get('/docente/mi-perfil').catch(() => null);
        const dataDocente = perfilExtra?.data?.data || resPerfil.data?.data;
        setDocenteInfo(dataDocente);

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
          { id: "produccion", nombre: "Producción Intelectual", horas_asignadas: Number(cargaNL.produccion_intelectual) || 0 },
          { id: "gestion", nombre: "Gestión Administrativa", horas_asignadas: Number(cargaNL.gestion_admin) || 0 },
          { id: "capacitacion", nombre: "Capacitación Docente", horas_asignadas: Number(cargaNL.capacitacion) || 0 },
          { id: "otras", nombre: "Otras Actividades", horas_asignadas: Number(cargaNL.otras_actividades) || 0 }
        ].filter(act => act.horas_asignadas > 0); 

        setActividadesNoLectivas(listaActividades);
        setBloquesNoLectivosGuardados(resNoLectivaAgendada.data?.data || []);
      }
    } catch (err) {
      setMensaje({ tipo: "error", texto: "Error al sincronizar tu disponibilidad." });
    } finally {
      setLoading(false);
    }
  }, [semestre]);

  useEffect(() => { cargarInformacionHoraria(); }, [cargarInformacionHoraria]);

  const esCompletado = docenteInfo?.estado_turno === 'Completado';

  const handleInputChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const verificarCruceFisico = useCallback((diaStr, inicioN, finN) => {
    const targetDia = normalizeDia(diaStr);
    const cruceLectivo = horarioLectivo.find(h => normalizeDia(h.dia) === targetDia && inicioN < timeToMinutes(h.hora_fin) && finN > timeToMinutes(h.hora_inicio));
    if (cruceLectivo) return `Clase/Lab de ${cruceLectivo.curso_nombre}`;
    const cruceNoLectivo = bloquesNoLectivosGuardados.find(h => normalizeDia(h.dia) === targetDia && inicioN < timeToMinutes(h.hora_fin) && finN > timeToMinutes(h.hora_inicio));
    if (cruceNoLectivo) return `Actividad: ${cruceNoLectivo.actividad_nombre}`;
    return null;
  }, [horarioLectivo, bloquesNoLectivosGuardados]);

  const verificacionChoque = useMemo(() => {
    if (!modalOpen) return { hayCruce: false, motivo: "" };
    const inicioN = timeToMinutes(form.hora_inicio);
    const finN = timeToMinutes(form.hora_fin);

    if (inicioN >= finN) return { hayCruce: true, motivo: "La hora de inicio debe ser anterior a la de fin." };
    
    const motivoCruce = verificarCruceFisico(form.dia, inicioN, finN);
    if (motivoCruce) return { hayCruce: true, motivo: `Cruce con: ${motivoCruce}` };

    const actividadSel = actividadesNoLectivas.find(a => a.id === form.actividad_id);
    if (actividadSel) {
      const horasYa = bloquesNoLectivosGuardados.filter(b => b.actividad_id === form.actividad_id).reduce((s, b) => s + ((timeToMinutes(b.hora_fin) - timeToMinutes(b.hora_inicio)) / 60), 0);
      if (horasYa + ((finN - inicioN) / 60) > actividadSel.horas_asignadas) return { hayCruce: true, motivo: `Excede tus horas límite permitidas (${actividadSel.horas_asignadas}h).` };
    }
    return { hayCruce: false, motivo: "" };
  }, [form, modalOpen, verificarCruceFisico, actividadesNoLectivas, bloquesNoLectivosGuardados]);

  const handleGuardarBloque = async (e) => {
    e.preventDefault();
    if (verificacionChoque.hayCruce || guardando || esCompletado) return;
    setGuardando(true);
    try {
      const actividadSel = actividadesNoLectivas.find(a => a.id === form.actividad_id);
      await api.post("/docente/horario-no-lectivo", { ...form, actividad_nombre: actividadSel?.nombre, docente_id: docenteInfo?.id, semestre });
      setMensaje({ tipo: "exito", texto: "Agendado correctamente." });
      setModalOpen(false);
      cargarInformacionHoraria();
    } catch (error) { setMensaje({ tipo: "error", texto: "Error al guardar." }); } 
    finally { setGuardando(false); }
  };

  const handleEliminarBloque = async (id) => {
    if (esCompletado) return;
    if (!confirm("¿Retirar este bloque?")) return;
    try {
      await api.delete(`/docente/horario-no-lectivo/${id}`);
      cargarInformacionHoraria();
    } catch (error) { setMensaje({ tipo: "error", texto: "Error al eliminar." }); }
  };

  const actividadesPendientes = useMemo(() => {
    return actividadesNoLectivas.filter(act => {
      const horasYa = bloquesNoLectivosGuardados
        .filter(b => b.actividad_id === act.id)
        .reduce((s, b) => s + ((timeToMinutes(b.hora_fin) - timeToMinutes(b.hora_inicio)) / 60), 0);
      return horasYa < act.horas_asignadas;
    });
  }, [actividadesNoLectivas, bloquesNoLectivosGuardados]);

  const handleAbrirModal = () => {
    if (actividadesPendientes.length === 0) {
      alert("¡Felicidades! Ya has agendado el 100% de tus actividades no lectivas para este semestre.");
      return;
    }
    setForm(prev => ({ ...prev, actividad_id: actividadesPendientes[0]?.id }));
    setModalOpen(true);
  };

  const listaAmbientesDinamicos = useMemo(() => {
    const guardados = bloquesNoLectivosGuardados.map(b => b.ambiente).filter(Boolean);
    return [...new Set([...AMBIENTES_BASE, ...guardados])].sort();
  }, [bloquesNoLectivosGuardados]);

  if (loading) return <div className="p-10 text-center text-neutral-500 dark:text-neutral-400">Sincronizando información...</div>;

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

      {/* Aviso Completado */}
      {esCompletado && (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl flex gap-3 shadow-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h4 className="font-bold">Horario Completado</h4>
            <p className="text-sm mt-1 text-emerald-700 dark:text-emerald-400">Tu horario ya fue marcado como completado por la secretaría. No puedes agregar ni eliminar más horas.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-7 h-7 text-indigo-600 dark:text-indigo-400" /> Mi Carga No Lectiva
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Establece tus horas de tutoría, investigación y preparación evaluando cruces con tus clases lectivas.</p>
        </div>
        
        {!esCompletado && (
          <button 
            onClick={handleAbrirModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" /> Agendar Horas
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* PANEL DE RESUMEN */}
        <div className="lg:col-span-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" /> Resumen de Obligaciones
          </h2>
          <div className="space-y-3">
            {actividadesNoLectivas.map(act => {
              const horasYa = bloquesNoLectivosGuardados.filter(b => b.actividad_id === act.id).reduce((s, b) => s + ((timeToMinutes(b.hora_fin) - timeToMinutes(b.hora_inicio)) / 60), 0);
              const pct = Math.min(100, (horasYa / act.horas_asignadas) * 100);
              return (
                <div key={act.id} className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-100 dark:border-neutral-700/50">
                  <div className="flex justify-between items-center text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    <span>{act.nombre}</span>
                    <span className="font-mono">{horasYa}h / {act.horas_asignadas}h</span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 mt-2 overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${pct === 100 ? "bg-emerald-500" : "bg-indigo-500 dark:bg-indigo-400"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TABLA PRINCIPAL */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase">
                  <th className="p-4">Día / Horario</th>
                  <th className="p-4">Actividad</th>
                  {!esCompletado && <th className="p-4 text-right">Acción</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm">
                {bloquesNoLectivosGuardados.map(b => (
                  <tr key={b.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="p-4 font-medium text-indigo-600 dark:text-indigo-400">
                      {b.dia} <br/>
                      <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mt-0.5 inline-block">{b.hora_inicio.slice(0,5)} - {b.hora_fin.slice(0,5)}</span>
                    </td>
                    <td className="p-4 font-medium text-neutral-800 dark:text-neutral-200">
                      {b.actividad_nombre} <br/>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mt-1">
                        <Building2 className="w-3.5 h-3.5"/> {b.ambiente}
                      </span>
                    </td>
                    {!esCompletado && (
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleEliminarBloque(b.id)} 
                          className="p-2 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Eliminar bloque"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {bloquesNoLectivosGuardados.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-10 text-center text-neutral-400 dark:text-neutral-500">
                      Aún no has registrado ninguna actividad no lectiva.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL CONFIGURADOR */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            
            <datalist id="ambientes-no-lectivos">
              {listaAmbientesDinamicos.map(a => <option key={a} value={a} />)}
            </datalist>

            <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/40">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">Agendar Bloque de Permanencia</h2>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarBloque} className="p-5 space-y-4">
              
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-neutral-700 dark:text-neutral-300">Selecciona la actividad a agendar</label>
                <select 
                  name="actividad_id" 
                  value={form.actividad_id} 
                  onChange={handleInputChange} 
                  required 
                  className="w-full text-sm p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none font-medium focus:border-indigo-500 dark:focus:border-indigo-400 text-neutral-900 dark:text-white transition-colors"
                >
                  {actividadesPendientes.map(act => {
                    const horasYa = bloquesNoLectivosGuardados
                      .filter(b => b.actividad_id === act.id)
                      .reduce((s, b) => s + ((timeToMinutes(b.hora_fin) - timeToMinutes(b.hora_inicio)) / 60), 0);
                    const horasRestantes = act.horas_asignadas - horasYa;
                    return (
                      <option key={act.id} value={act.id}>
                        {act.nombre} (Te faltan: {horasRestantes}h de {act.horas_asignadas}h)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-neutral-700 dark:text-neutral-300">Día de la semana</label>
                  <select 
                    name="dia" 
                    value={form.dia} 
                    onChange={handleInputChange} 
                    className="w-full text-sm p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-neutral-900 dark:text-white transition-colors"
                  >
                    {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-center text-neutral-700 dark:text-neutral-300">Hora de Inicio</label>
                  <select 
                    name="hora_inicio" 
                    value={form.hora_inicio} 
                    onChange={handleInputChange} 
                    required 
                    className="w-full text-sm p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-center outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-neutral-900 dark:text-white transition-colors"
                  >
                    <option value="" disabled>Seleccione...</option>
                    {HORAS_VALIDAS.map(hora => {
                      const inicioMin = timeToMinutes(hora);
                      const finMin = inicioMin + 60;
                      const motivoOcupado = verificarCruceFisico(form.dia, inicioMin, finMin);
                      return (
                        <option key={`in-${hora}`} value={hora} disabled={!!motivoOcupado}>
                          {hora} {motivoOcupado ? `(Cruce)` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-center text-neutral-700 dark:text-neutral-300">Hora de Fin</label>
                  <select 
                    name="hora_fin" 
                    value={form.hora_fin} 
                    onChange={handleInputChange} 
                    required 
                    className="w-full text-sm p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-center outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-neutral-900 dark:text-white transition-colors"
                  >
                    <option value="" disabled>Seleccione...</option>
                    {HORAS_VALIDAS.map(hora => {
                      const inicioMin = timeToMinutes(form.hora_inicio);
                      const finMin = timeToMinutes(hora);
                      
                      if (!form.hora_inicio || finMin <= inicioMin) {
                        return <option key={`fin-${hora}`} value={hora} disabled>{hora}</option>;
                      }

                      const motivoCruce = verificarCruceFisico(form.dia, inicioMin, finMin);
                      let excedeLímite = false;
                      const actividadSel = actividadesNoLectivas.find(a => a.id === form.actividad_id);
                      if (actividadSel) {
                        const horasYa = bloquesNoLectivosGuardados.filter(b => b.actividad_id === form.actividad_id).reduce((s, b) => s + ((timeToMinutes(b.hora_fin) - timeToMinutes(b.hora_inicio)) / 60), 0);
                        if (horasYa + ((finMin - inicioMin) / 60) > actividadSel.horas_asignadas) excedeLímite = true;
                      }

                      const bloqueado = !!motivoCruce || excedeLímite;
                      let etiqueta = hora;
                      if (motivoCruce) etiqueta += " (Cruce)";
                      else if (excedeLímite) etiqueta += " (Excede límite)";

                      return <option key={`fin-${hora}`} value={hora} disabled={bloqueado}>{etiqueta}</option>;
                    })}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-neutral-700 dark:text-neutral-300">Ambiente de Trabajo / Permanencia</label>
                <input 
                  list="ambientes-no-lectivos" 
                  name="ambiente" 
                  value={form.ambiente} 
                  onChange={handleInputChange} 
                  required
                  placeholder="Ej: Cubículo, Laboratorio Especializado..."
                  className="w-full text-sm p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none font-medium focus:border-indigo-500 dark:focus:border-indigo-400 text-neutral-900 dark:text-white transition-colors"
                />
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1.5">Si vas a trabajar en un aula o ambiente nuevo, bórralo y escríbelo directamente en la caja de texto.</p>
              </div>

              {verificacionChoque.hayCruce && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-xs font-semibold text-red-700 dark:text-red-400 animate-pulse">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{verificacionChoque.motivo}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800 mt-6">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)} 
                  className="px-4 py-2 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={verificacionChoque.hayCruce || guardando} 
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-400 dark:disabled:bg-neutral-700 disabled:cursor-not-allowed rounded-xl shadow-md transition-all flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" /> {guardando ? "Registrando..." : "Confirmar Horario"}
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