import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../services/api";
import { Clock, Calendar, Save, Trash2, X, AlertCircle, CheckCircle2, Building2, BookOpen } from "lucide-react";

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

const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
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
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionAnchor, setSelectionAnchor] = useState(null);
  const [bloquesSeleccionados, setBloquesSeleccionados] = useState([]);

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
  const horasInicioGrid = useMemo(() => HORAS_VALIDAS.slice(0, -1), []);
  const calcularHorasBloque = useCallback((bloque) => {
    return Math.max(0, (timeToMinutes(bloque.hora_fin) - timeToMinutes(bloque.hora_inicio)) / 60);
  }, []);

  const actividadSeleccionada = useMemo(() => {
    return actividadesNoLectivas.find(a => a.id === form.actividad_id);
  }, [actividadesNoLectivas, form.actividad_id]);

  const horasGuardadasPorActividad = useCallback((actividadId) => {
    return bloquesNoLectivosGuardados
      .filter(b => b.actividad_id === actividadId)
      .reduce((total, b) => total + calcularHorasBloque(b), 0);
  }, [bloquesNoLectivosGuardados, calcularHorasBloque]);

  const horasSeleccionadasPorActividad = useCallback((actividadId) => {
    return bloquesSeleccionados
      .filter(b => b.actividad_id === actividadId)
      .reduce((total, b) => total + calcularHorasBloque(b), 0);
  }, [bloquesSeleccionados, calcularHorasBloque]);

  const horasSeleccionadasActual = actividadSeleccionada ? horasSeleccionadasPorActividad(actividadSeleccionada.id) : 0;
  const horasGuardadasActual = actividadSeleccionada ? horasGuardadasPorActividad(actividadSeleccionada.id) : 0;
  const horasTotalActual = actividadSeleccionada ? actividadSeleccionada.horas_asignadas : 0;
  const horasComprometidasActual = horasGuardadasActual + horasSeleccionadasActual;

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

  const obtenerOcupacionCelda = useCallback((diaStr, hora) => {
    const targetDia = normalizeDia(diaStr);
    const inicioN = timeToMinutes(hora);
    const finN = inicioN + 60;

    const lectivo = horarioLectivo.find(h =>
      normalizeDia(h.dia) === targetDia &&
      inicioN < timeToMinutes(h.hora_fin) &&
      finN > timeToMinutes(h.hora_inicio)
    );

    if (lectivo) {
      return {
        tipo: "lectivo",
        titulo: lectivo.curso_nombre || lectivo.curso?.nombre || "Clase lectiva",
        detalle: `${String(lectivo.hora_inicio || "").slice(0, 5)} - ${String(lectivo.hora_fin || "").slice(0, 5)}`
      };
    }

    const noLectivo = bloquesNoLectivosGuardados.find(h =>
      normalizeDia(h.dia) === targetDia &&
      inicioN < timeToMinutes(h.hora_fin) &&
      finN > timeToMinutes(h.hora_inicio)
    );

    if (noLectivo) {
      return {
        tipo: "no-lectivo",
        titulo: noLectivo.actividad_nombre || "Actividad no lectiva",
        detalle: `${String(noLectivo.hora_inicio || "").slice(0, 5)} - ${String(noLectivo.hora_fin || "").slice(0, 5)}`
      };
    }

    return null;
  }, [horarioLectivo, bloquesNoLectivosGuardados]);

  const obtenerBloqueSeleccionadoCelda = useCallback((diaStr, hora) => {
    const targetDia = normalizeDia(diaStr);
    const inicioN = timeToMinutes(hora);
    const finN = inicioN + 60;

    return bloquesSeleccionados.find(b =>
      normalizeDia(b.dia) === targetDia &&
      inicioN < timeToMinutes(b.hora_fin) &&
      finN > timeToMinutes(b.hora_inicio)
    );
  }, [bloquesSeleccionados]);

  const hayCruceConBloquesSeleccionados = useCallback((diaStr, inicioN, finN) => {
    const targetDia = normalizeDia(diaStr);
    return bloquesSeleccionados.find(b =>
      normalizeDia(b.dia) === targetDia &&
      inicioN < timeToMinutes(b.hora_fin) &&
      finN > timeToMinutes(b.hora_inicio)
    );
  }, [bloquesSeleccionados]);

  const esCeldaEnSeleccionActiva = useCallback((diaStr, hora) => {
    if (!isSelecting) return false;
    if (normalizeDia(form.dia) !== normalizeDia(diaStr)) return false;
    const inicioN = timeToMinutes(hora);
    const finN = inicioN + 60;
    return inicioN >= timeToMinutes(form.hora_inicio) && finN <= timeToMinutes(form.hora_fin);
  }, [form.dia, form.hora_inicio, form.hora_fin, isSelecting]);

  const iniciarSeleccionVisual = (diaStr, hora, ocupacion, bloqueSeleccionado) => {
    if (esCompletado || ocupacion) return;
    if (bloqueSeleccionado) {
      setBloquesSeleccionados(prev => prev.filter(b => b.temp_id !== bloqueSeleccionado.temp_id));
      setSelectionAnchor(null);
      setIsSelecting(false);
      return;
    }
    const inicioN = timeToMinutes(hora);
    setSelectionAnchor({ dia: diaStr, inicio: inicioN });
    setIsSelecting(true);
    setForm(prev => ({
      ...prev,
      dia: diaStr,
      hora_inicio: minutesToTime(inicioN),
      hora_fin: minutesToTime(inicioN + 60)
    }));
  };

  const extenderSeleccionVisual = (diaStr, hora) => {
    if (!isSelecting || !selectionAnchor || normalizeDia(selectionAnchor.dia) !== normalizeDia(diaStr)) return;
    const celdaInicio = timeToMinutes(hora);
    const inicioN = Math.min(selectionAnchor.inicio, celdaInicio);
    const finN = Math.max(selectionAnchor.inicio + 60, celdaInicio + 60);
    setForm(prev => ({
      ...prev,
      dia: diaStr,
      hora_inicio: minutesToTime(inicioN),
      hora_fin: minutesToTime(finN)
    }));
  };

  const finalizarSeleccionVisual = () => {
    if (isSelecting && selectionAnchor && actividadSeleccionada) {
      const inicioN = timeToMinutes(form.hora_inicio);
      const finN = timeToMinutes(form.hora_fin);
      const horasBloque = (finN - inicioN) / 60;
      const motivoCruceFisico = verificarCruceFisico(form.dia, inicioN, finN);
      const cruceSeleccionado = hayCruceConBloquesSeleccionados(form.dia, inicioN, finN);
      const horasActuales = horasGuardadasPorActividad(actividadSeleccionada.id) + horasSeleccionadasPorActividad(actividadSeleccionada.id);

      if (inicioN >= finN) {
        setMensaje({ tipo: "error", texto: "La hora de inicio debe ser anterior a la de fin." });
      } else if (motivoCruceFisico) {
        setMensaje({ tipo: "error", texto: `Cruce con: ${motivoCruceFisico}` });
      } else if (cruceSeleccionado) {
        setMensaje({ tipo: "error", texto: "Ese rango cruza con otro bloque que acabas de seleccionar." });
      } else if (horasActuales + horasBloque > actividadSeleccionada.horas_asignadas) {
        setMensaje({ tipo: "error", texto: `Excede las ${actividadSeleccionada.horas_asignadas}h declaradas para ${actividadSeleccionada.nombre}.` });
      } else {
        setBloquesSeleccionados(prev => {
          const yaExiste = prev.some(b =>
            b.actividad_id === actividadSeleccionada.id &&
            normalizeDia(b.dia) === normalizeDia(form.dia) &&
            b.hora_inicio === form.hora_inicio &&
            b.hora_fin === form.hora_fin
          );
          if (yaExiste) return prev;
          return [
            ...prev,
            {
            temp_id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            actividad_id: actividadSeleccionada.id,
            actividad_nombre: actividadSeleccionada.nombre,
            dia: form.dia,
            hora_inicio: form.hora_inicio,
            hora_fin: form.hora_fin
            }
          ];
        });
        setMensaje(null);
      }
    }
    setIsSelecting(false);
    setSelectionAnchor(null);
  };

  const handleGuardarBloque = async (e) => {
    e.preventDefault();
    if (guardando || esCompletado) return;
    if (bloquesSeleccionados.length === 0) {
      setMensaje({ tipo: "error", texto: "Selecciona al menos un bloque en el horario grafico antes de confirmar." });
      return;
    }
    setGuardando(true);
    try {
      await Promise.all(bloquesSeleccionados.map(bloque =>
        api.post("/docente/horario-no-lectivo", {
          actividad_id: bloque.actividad_id,
          actividad_nombre: bloque.actividad_nombre,
          dia: bloque.dia,
          hora_inicio: bloque.hora_inicio,
          hora_fin: bloque.hora_fin,
          ambiente: form.ambiente,
          docente_id: docenteInfo?.id,
          semestre
        })
      ));
      setMensaje({ tipo: "exito", texto: "Agendado correctamente." });
      setModalOpen(false);
      setBloquesSeleccionados([]);
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
    if (esCompletado) return; // Validación extra
    if (actividadesNoLectivas.length === 0) {
      alert("Primero declara tus horas no lectivas en la seccion Carga Horaria. Luego vuelve aqui para ubicarlas en el horario.");
      return;
    }
    if (actividadesPendientes.length === 0) {
      alert("¡Felicidades! Ya has agendado el 100% de tus actividades no lectivas para este semestre.");
      return;
    }
    setBloquesSeleccionados([]);
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
        
        {/* 🚀 BOTÓN AGENDAR HORAS (DESHABILITADO SI ESTÁ COMPLETADO) */}
        <button 
          onClick={handleAbrirModal}
          disabled={esCompletado}
          title={esCompletado ? "Horario completado. No puedes agendar más horas." : "Agendar nuevas horas"}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            esCompletado 
              ? "bg-neutral-200 text-neutral-400 cursor-not-allowed dark:bg-neutral-800 dark:text-neutral-600 shadow-none" 
              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
          }`}
        >
          <Calendar className="w-4 h-4" /> Horario
        </button>
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
                  <th className="p-4 text-right">Acción</th>
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
                    {/* 🚀 BOTÓN ELIMINAR (DESHABILITADO SI ESTÁ COMPLETADO) */}
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleEliminarBloque(b.id)} 
                        disabled={esCompletado}
                        className={`p-2 rounded-lg transition-colors ${
                          esCompletado 
                            ? "text-neutral-300 cursor-not-allowed dark:text-neutral-700" 
                            : "text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        }`}
                        title={esCompletado ? "Horario completado. No se puede eliminar." : "Eliminar bloque"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
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
      {modalOpen && !esCompletado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 w-full max-w-6xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col">
            
            <datalist id="ambientes-no-lectivos">
              {listaAmbientesDinamicos.map(a => <option key={a} value={a} />)}
            </datalist>

            <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/40">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">Agendar horario no lectivo</h2>
              </div>
              <button onClick={() => { setBloquesSeleccionados([]); setModalOpen(false); }} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarBloque} className="p-5 space-y-4 overflow-y-auto">
              
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
                    const horasYa = horasGuardadasPorActividad(act.id) + horasSeleccionadasPorActividad(act.id);
                    const horasRestantes = Math.max(0, act.horas_asignadas - horasYa);
                    return (
                      <option key={act.id} value={act.id}>
                        {act.nombre} ({horasYa}h de {act.horas_asignadas}h · faltan {horasRestantes}h)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-neutral-50 dark:bg-neutral-950/40">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 border-b border-neutral-200 dark:border-neutral-800">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Seleccion grafica del horario
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      Arrastra sobre una columna del horario para marcar el bloque. Las clases lectivas y bloques ya registrados quedan bloqueados visualmente.
                    </p>
                  </div>
                  <div className="text-xs font-semibold px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50">
                    {actividadSeleccionada ? `${actividadSeleccionada.nombre}: ${horasComprometidasActual}h de ${horasTotalActual}h` : "Selecciona una actividad"}
                    {bloquesSeleccionados.length > 0 && (
                      <span className="block text-[10px] font-medium opacity-80 mt-0.5">
                        Por guardar: {bloquesSeleccionados.length} bloque{bloquesSeleccionados.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div className="hidden text-xs font-semibold px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50">
                    Seleccion: {form.dia} · {form.hora_inicio} - {form.hora_fin}
                  </div>
                </div>

                <div
                  className="overflow-auto max-h-[44vh] select-none"
                  onMouseUp={finalizarSeleccionVisual}
                  onMouseLeave={finalizarSeleccionVisual}
                >
                  <div className="min-w-[920px]">
                    <div className="grid grid-cols-[76px_repeat(6,minmax(130px,1fr))] sticky top-0 z-20 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                      <div className="p-2 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 border-r border-neutral-200 dark:border-neutral-800">
                        Hora
                      </div>
                      {DIAS.map(dia => (
                        <div key={dia} className="p-2 text-center text-[11px] font-bold text-neutral-700 dark:text-neutral-200 border-r border-neutral-200 dark:border-neutral-800 last:border-r-0">
                          {dia}
                        </div>
                      ))}
                    </div>

                    {horasInicioGrid.map(hora => (
                      <div key={hora} className="grid grid-cols-[76px_repeat(6,minmax(130px,1fr))] border-b border-neutral-200 dark:border-neutral-800 last:border-b-0">
                        <div className="p-2 text-[11px] font-mono font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100/80 dark:bg-neutral-900/80 border-r border-neutral-200 dark:border-neutral-800 flex items-center">
                          {hora}
                        </div>
                        {DIAS.map(dia => {
                          const ocupacion = obtenerOcupacionCelda(dia, hora);
                          const bloqueSeleccionado = obtenerBloqueSeleccionadoCelda(dia, hora);
                          const seleccionActiva = esCeldaEnSeleccionActiva(dia, hora);
                          const ocupadoLectivo = ocupacion?.tipo === "lectivo";
                          const ocupadoNoLectivo = ocupacion?.tipo === "no-lectivo";

                          return (
                            <button
                              key={`${dia}-${hora}`}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                iniciarSeleccionVisual(dia, hora, ocupacion, bloqueSeleccionado);
                              }}
                              onMouseEnter={() => extenderSeleccionVisual(dia, hora)}
                              className={`h-16 min-h-16 p-2 text-left border-r border-neutral-200 dark:border-neutral-800 last:border-r-0 transition-colors outline-none ${
                                ocupadoLectivo
                                  ? "bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 cursor-not-allowed"
                                  : ocupadoNoLectivo
                                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 cursor-not-allowed"
                                    : bloqueSeleccionado
                                      ? "bg-indigo-600 text-white shadow-inner cursor-pointer"
                                      : seleccionActiva
                                        ? "bg-indigo-500 text-white shadow-inner"
                                      : "bg-white dark:bg-neutral-950 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-neutral-500 dark:text-neutral-400 cursor-crosshair"
                              }`}
                              title={ocupacion ? `${ocupacion.titulo} ${ocupacion.detalle}` : bloqueSeleccionado ? "Click para deseleccionar este bloque" : `Seleccionar ${dia} ${hora}`}
                              aria-disabled={!!ocupacion}
                            >
                              {ocupacion ? (
                                <span className="block overflow-hidden">
                                  <span className="block text-[11px] font-bold leading-tight line-clamp-2">
                                    {ocupacion.titulo}
                                  </span>
                                  <span className="block text-[10px] opacity-75 mt-1">
                                    {ocupacion.detalle}
                                  </span>
                                </span>
                              ) : bloqueSeleccionado ? (
                                <span className="block">
                                  <span className="block text-[11px] font-bold">{bloqueSeleccionado.actividad_nombre}</span>
                                  <span className="block text-[10px] opacity-80 mt-1">{bloqueSeleccionado.hora_inicio} - {bloqueSeleccionado.hora_fin}</span>
                                </span>
                              ) : seleccionActiva ? (
                                <span className="block">
                                  <span className="block text-[11px] font-bold">Seleccionando</span>
                                  <span className="block text-[10px] opacity-80 mt-1">{form.hora_inicio} - {form.hora_fin}</span>
                                </span>
                              ) : (
                                <span className="block text-[10px] opacity-60">Disponible</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="hidden grid-cols-1 sm:grid-cols-3 gap-4">
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

              <div className="sticky bottom-0 z-30 flex items-center justify-end gap-3 pt-4 pb-1 border-t border-neutral-100 dark:border-neutral-800 mt-6 bg-white dark:bg-neutral-900">
                <button 
                  type="button" 
                  onClick={() => { setBloquesSeleccionados([]); setModalOpen(false); }}
                  className="px-4 py-2 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={guardando || bloquesSeleccionados.length === 0}
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
