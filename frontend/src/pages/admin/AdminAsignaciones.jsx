import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../services/api";
import {
  Users, BookOpen, Plus, Trash2, Pencil, CheckCircle, AlertCircle, RefreshCw, GraduationCap, Building2, FlaskConical, X, Save, Search, Filter, Zap, Clock, Ban, Layers
} from "lucide-react";

const MAX_HORAS_DOCENTE = 20;

const timeToMinutes = (t) => {
  if (!t) return 0;
  const [h, m] = String(t).slice(0, 5).split(":").map(Number);
  return h * 60 + m;
};

const AdminAsignaciones = () => {
  const [cursos, setCursos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoAsignando, setAutoAsignando] = useState(false);
  const [limpiando, setLimpiando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const [filtroEspecialidad, setFiltroEspecialidad] = useState("");
  const [filtroCiclo, setFiltroCiclo] = useState("");
  const [searchCurso, setSearchCurso] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [asignacionEdicion, setAsignacionEdicion] = useState(null); 
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState("");
  
  const [numGrupos, setNumGrupos] = useState({ Teoria: 1, Practica: 1, Laboratorio: 1 });
  const [checkedPartes, setCheckedPartes] = useState([]); 
  const [aulaPref, setAulaPref] = useState("");
  const [labPref, setLabPref] = useState("");

  const [editAmbiente, setEditAmbiente] = useState("");
  const [aulas, setAulas] = useState([]);
  const [laboratorios, setLaboratorios] = useState([]);
  const [guardando, setGuardando] = useState(false);

  const [horarios, setHorarios] = useState([]);
  const [ambientesOcupados, setAmbientesOcupados] = useState([]);
  const [cargandoDisponibilidad, setCargandoDisponibilidad] = useState(false);

  const semestre = config?.semestre_activo || "2026-1";

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [resCursos, resDocentes, resAsig, resConf, resAulas, resLabs, resHorarios] = await Promise.all([
        api.get("/cursos"), api.get("/docentes"), api.get("/asignaciones"), api.get("/configuracion"), api.get("/aulas"), api.get("/laboratorios"), api.get("/horarios").catch(() => ({ data: { data: [] } }))
      ]);
      setCursos(resCursos.data?.data || []);
      setDocentes(resDocentes.data?.data || []);
      setAsignaciones(resAsig.data?.data || []);
      setConfig(resConf.data?.data || null);
      setAulas(resAulas.data?.data || []);
      setLaboratorios(resLabs.data?.data || []);
      setHorarios(resHorarios.data?.data || []);
    } catch (err) {
      setMensaje({ tipo: "error", texto: "Error al cargar datos" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const ciclosActivos = useMemo(() => {
    if (!semestre) return [];
    const num = parseInt(semestre.split("-").pop(), 10);
    return num === 1 ? [1, 3, 5, 7, 9] : [2, 4, 6, 8, 10];
  }, [semestre]);

  const cursosFiltrados = cursos.filter((c) => {
    return (!filtroEspecialidad || c.especialidad?.toLowerCase() === filtroEspecialidad.toLowerCase()) &&
           (!filtroCiclo || c.ciclo === Number(filtroCiclo)) &&
           (!searchCurso || c.codigo?.toLowerCase().includes(searchCurso.toLowerCase()) || c.nombre?.toLowerCase().includes(searchCurso.toLowerCase())) &&
           (ciclosActivos.length === 0 || ciclosActivos.includes(Number(c.ciclo))) && !c.deleted_at;
  });

  const especialidades = [...new Set(cursos.map((c) => c.especialidad).filter(Boolean))].sort();

  const getHorasCurso = (curso, tipo) => {
    if (!curso) return 0;
    return tipo === "Teoria" ? Number(curso.horas_t) || 0 : tipo === "Practica" ? Number(curso.horas_p) || 0 : Number(curso.horas_l) || 0;
  };

  const horasPorDocente = useMemo(() => {
    const map = {};
    for (const a of asignaciones) {
      if (a.semestre_asignacion !== semestre) continue;
      map[a.docente_id] = (map[a.docente_id] || 0) + (Number(a.horas_asignadas) || 0);
    }
    return map;
  }, [asignaciones, semestre]);

  const getAsignacionesDeCurso = (cursoId) => asignaciones.filter((a) => a.curso_id === cursoId && a.semestre_asignacion === semestre);

  const abrirModalMasivo = (curso) => {
    setCursoSeleccionado(curso); setDocenteSeleccionado(""); setAsignacionEdicion(null); setCheckedPartes([]); setAulaPref(""); setLabPref("");
    
    const asigs = getAsignacionesDeCurso(curso.id);
    
    const calcularGruposFijos = (tipo) => {
      const asigsTipo = asigs.filter(a => a.tipo === tipo);
      if (asigsTipo.length > 0) {
        const horasTotales = getHorasCurso(curso, tipo);
        const horasAsignadas = Number(asigsTipo[0].horas_asignadas);
        if (horasAsignadas > 0 && horasTotales > 0) {
          return Math.round(horasTotales / horasAsignadas);
        }
      }
      return 1;
    };

    setNumGrupos({ 
      Teoria: calcularGruposFijos('Teoria'), 
      Practica: calcularGruposFijos('Practica'), 
      Laboratorio: calcularGruposFijos('Laboratorio') 
    });
    
    setModalOpen(true); setMensaje(null);
  };

  const abrirModalEditar = async (asig, curso) => {
    setCursoSeleccionado(curso); setDocenteSeleccionado(asig.docente_id); setEditAmbiente(asig.ambiente_preferido_id || ""); setAsignacionEdicion(asig);
    setModalOpen(true); setMensaje(null); setAmbientesOcupados([]);
    setCargandoDisponibilidad(true);
    try {
      const res = await api.get(`/asignaciones/${asig.id}/horario`);
      if (res.data?.data?.ocupados) setAmbientesOcupados(res.data.data.ocupados);
    } catch (err) {
      console.error("Error al verificar disponibilidad:", err);
    } finally {
      setCargandoDisponibilidad(false);
    }
  };

  const toggleParte = (idParte) => setCheckedPartes(prev => prev.includes(idParte) ? prev.filter(p => p !== idParte) : [...prev, idParte]);

  // 🌟 FUNCIÓN INTERCEPTORA PARA EVITAR EL "ESTADO FANTASMA"
  const handleCambioGrupos = (tipo, nuevoValor) => {
    const valorNum = Math.max(1, Number(nuevoValor));
    
    // Cambiamos el divisor
    setNumGrupos(prev => ({ ...prev, [tipo]: valorNum }));

    // Limpiamos la memoria de checkboxes para este tipo de clase
    setCheckedPartes(prev => {
      // 1. ¿El usuario tenía algo marcado en este tipo? (ej. "Teoria-Único")
      const teniaSeleccion = prev.some(item => item.startsWith(`${tipo}-`));
      
      // 2. Borramos todo lo que empiece con este tipo para matar los fantasmas
      let nuevasSelecciones = prev.filter(item => !item.startsWith(`${tipo}-`));

      // 3. Si tenía algo marcado, le marcamos el "Grupo A" (o "Único") por defecto
      if (teniaSeleccion) {
        const grupoPorDefecto = valorNum === 1 ? 'Único' : 'A';
        nuevasSelecciones.push(`${tipo}-${grupoPorDefecto}`);
      }

      return nuevasSelecciones;
    });
  };

  const totalHorasSeleccionadas = useMemo(() => {
    return checkedPartes.reduce((sum, item) => {
      const [tipo] = item.split('-');
      return sum + (getHorasCurso(cursoSeleccionado, tipo) / (numGrupos[tipo] || 1));
    }, 0);
  }, [checkedPartes, cursoSeleccionado, numGrupos]);

  const horasProyectadas = useMemo(() => {
    if (!docenteSeleccionado) return 0;
    const horasActuales = horasPorDocente[docenteSeleccionado] || 0;
    
    if (asignacionEdicion) {
      const horasDeEstaAsig = Number(asignacionEdicion.horas_asignadas) || 0;
      return asignacionEdicion.docente_id === Number(docenteSeleccionado) 
        ? horasActuales 
        : horasActuales + horasDeEstaAsig;
    }
    
    return horasActuales + totalHorasSeleccionadas;
  }, [docenteSeleccionado, horasPorDocente, asignacionEdicion, totalHorasSeleccionadas]);

  const excedeHoras = horasProyectadas > MAX_HORAS_DOCENTE;

  const getDocentesDisponiblesParaMasivo = () => {
    const cursoEsp = cursoSeleccionado?.especialidad?.toLowerCase();
    return docentes.filter(d => !d.deleted_at && (!cursoEsp || d.especialidad?.toLowerCase() === cursoEsp) && ((horasPorDocente[d.id] || 0) + totalHorasSeleccionadas <= MAX_HORAS_DOCENTE));
  };

  const getDocentesDisponiblesParaEdicion = () => {
    const cursoEsp = cursoSeleccionado?.especialidad?.toLowerCase();
    const horasDeEstaAsig = Number(asignacionEdicion.horas_asignadas) || 0;
    
    return docentes.filter(d => {
      if (d.deleted_at) return false;
      if (cursoEsp && d.especialidad?.toLowerCase() !== cursoEsp) return false;
      let horasActuales = horasPorDocente[d.id] || 0;
      if (asignacionEdicion.docente_id === d.id) horasActuales -= horasDeEstaAsig;
      if (horasActuales + horasDeEstaAsig > MAX_HORAS_DOCENTE) return false;

      const bloqueFijo = horarios.find(h => Number(h.asignacion_id) === Number(asignacionEdicion.id));
      if (bloqueFijo) {
        const tieneCruce = horarios.some(h => {
          if (h.dia !== bloqueFijo.dia) return false;
          if (Number(h.id) === Number(bloqueFijo.id)) return false; 
          if (Number(h.docente?.id || h.docente_id) !== Number(d.id)) return false;
          return timeToMinutes(bloqueFijo.hora_inicio) < timeToMinutes(h.hora_fin) && timeToMinutes(bloqueFijo.hora_fin) > timeToMinutes(h.hora_inicio);
        });
        if (tieneCruce) return false;
      }
      return true;
    });
  };

  const handleGuardar = async () => {
    if (!docenteSeleccionado || !cursoSeleccionado) return;
    setGuardando(true);
    try {
      if (asignacionEdicion) {
        await api.put(`/asignaciones/${asignacionEdicion.id}`, { docente_id: Number(docenteSeleccionado), ambiente_preferido_id: editAmbiente ? Number(editAmbiente) : null });
      } else {
        const promises = checkedPartes.map(item => {
          const [tipo, grupo] = item.split('-');
          return api.post('/asignaciones', {
            docente_id: Number(docenteSeleccionado), curso_id: cursoSeleccionado.id, tipo, grupo,
            horas_asignadas: getHorasCurso(cursoSeleccionado, tipo) / (numGrupos[tipo] || 1),
            semestre_asignacion: semestre, ambiente_preferido_id: (tipo === 'Laboratorio' ? labPref : aulaPref) || null
          });
        });
        await Promise.all(promises);
      }
      setMensaje({ tipo: "exito", texto: "Asignaciones guardadas correctamente" });
      setModalOpen(false); cargarDatos();
    } catch (err) {
      setMensaje({ tipo: "error", texto: "Error al guardar" });
    } finally { setGuardando(false); }
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar esta asignación? Su carga horaria se liberará inmediatamente.")) return;
    try { await api.delete(`/asignaciones/${id}`); cargarDatos(); } catch (err) { setMensaje({ tipo: "error", texto: "Error al eliminar" }); }
  };

  const handleAsignacionAutomatica = async () => {
    if (!confirm(`¿Asignar automáticamente todos los cursos del semestre ${semestre}?`)) return;
    setAutoAsignando(true);
    try {
      const res = await api.post("/asignaciones/auto", { semestre });
      setMensaje({ tipo: "exito", texto: `${res.data.data?.creadas || 0} asignaciones creadas, ${res.data.data?.fallidas || 0} fallidas.` });
      cargarDatos();
    } catch (err) { setMensaje({ tipo: "error", texto: "Error automático" }); } finally { setAutoAsignando(false); }
  };

  const handleLimpiarTodo = async () => {
    if (!confirm(`¿Eliminar TODAS las asignaciones del semestre ${semestre}?`)) return;
    setLimpiando(true);
    try {
      await api.post("/asignaciones/limpiar", { semestre });
      setMensaje({ tipo: "exito", texto: "Todas las asignaciones fueron eliminadas." });
      cargarDatos();
    } catch (err) { setMensaje({ tipo: "error", texto: "Error al limpiar" }); } finally { setLimpiando(false); }
  };

  const getNombreDocente = (id) => { const d = docentes.find((doc) => doc.id === id); return d ? `${d.nombres} ${d.apellidos}` : `Docente ${id}`; };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton h-7 w-64 mb-6 dark:opacity-20" />
        <div className="card p-4 mb-6 dark:bg-neutral-800 dark:border-neutral-700">
          <div className="flex flex-wrap gap-4">
            <div className="skeleton h-10 w-40 dark:opacity-20" />
            <div className="skeleton h-10 w-32 dark:opacity-20" />
            <div className="skeleton h-10 w-56 dark:opacity-20" />
          </div>
        </div>
        <div className="card dark:bg-neutral-800 dark:border-neutral-700">
          <div className="p-4">
            <div className="skeleton h-64 w-full rounded-lg dark:opacity-20" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in transition-colors duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2 transition-colors">
            <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            Asignaciones Docente-Curso
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 transition-colors">
            Semestre activo: <span className="font-semibold text-primary-700 dark:text-primary-400">{semestre}</span>
            {ciclosActivos.length > 0 && (
              <span className="ml-2 text-xs text-neutral-400 dark:text-neutral-500">
                (Ciclos activos: {ciclosActivos.join(", ")})
              </span>
            )}
            <span className="ml-3 text-xs text-neutral-400 dark:text-neutral-500">
              Límite: {MAX_HORAS_DOCENTE}h semanales/docente
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {mensaje && !modalOpen && (
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium animate-slide-down ${mensaje.tipo === "exito" ? "bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-400 border border-success-200 dark:border-success-800/50" : "bg-danger-50 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400 border border-danger-200 dark:border-danger-800/50"}`}>
              {mensaje.tipo === "exito" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {mensaje.texto}
              <button onClick={() => setMensaje(null)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <button onClick={handleAsignacionAutomatica} disabled={autoAsignando} className="btn-primary flex items-center gap-2 bg-warning-600 hover:bg-warning-700 dark:bg-warning-500 dark:hover:bg-warning-600 dark:text-white border-none transition-colors">
            {autoAsignando ? <><RefreshCw className="w-4 h-4 animate-spin" /> Asignando...</> : <><Zap className="w-4 h-4" /> Asignar Automático</>}
          </button>
          <button onClick={handleLimpiarTodo} disabled={limpiando} className="btn-secondary flex items-center gap-2 bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-400 border-danger-200 dark:border-danger-800/50 hover:bg-danger-100 dark:hover:bg-danger-900/40 hover:text-danger-800 dark:hover:text-danger-300 transition-colors">
            {limpiando ? <><RefreshCw className="w-4 h-4 animate-spin" /> Limpiando...</> : <><Trash2 className="w-4 h-4" /> Limpiar Todo</>}
          </button>
        </div>
      </div>

      <div className="card p-4 mb-6 dark:bg-neutral-800 dark:border-neutral-700 transition-colors">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 transition-colors">
              <Search className="w-3.5 h-3.5 inline mr-1 text-neutral-400 dark:text-neutral-500" />
              Buscar curso
            </label>
            <input type="text" value={searchCurso} onChange={(e) => setSearchCurso(e.target.value)} className="input w-full dark:bg-neutral-900 dark:border-neutral-700 dark:text-white transition-colors" placeholder="Código o nombre..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 transition-colors">
              <Filter className="w-3.5 h-3.5 inline mr-1 text-neutral-400 dark:text-neutral-500" />
              Especialidad
            </label>
            <select value={filtroEspecialidad} onChange={(e) => setFiltroEspecialidad(e.target.value)} className="input w-48 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white transition-colors">
              <option value="">Todas</option>
              {especialidades.map((esp) => <option key={esp} value={esp}>{esp}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 transition-colors">Ciclo</label>
            <select value={filtroCiclo} onChange={(e) => setFiltroCiclo(e.target.value)} className="input w-28 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white transition-colors">
              <option value="">Todos</option>
              {ciclosActivos.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button onClick={cargarDatos} className="btn-secondary flex items-center gap-2 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 transition-colors">
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
        </div>
      </div>

      <div className="card overflow-hidden dark:bg-neutral-800 dark:border-neutral-700 transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-700 transition-colors">
                <th className="text-left p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase w-24">Código</th>
                <th className="text-left p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Curso</th>
                <th className="text-center p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase w-16">Ciclo</th>
                <th className="text-left p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase w-40">Especialidad</th>
                <th className="text-center p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase w-28">Horas</th>
                <th className="text-left p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Asignaciones</th>
                <th className="text-center p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase w-28">Acción</th>
              </tr>
            </thead>
            <tbody>
              {cursosFiltrados.map((curso) => {
                const asigs = getAsignacionesDeCurso(curso.id);
                return (
                  <tr key={curso.id} className="border-b border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50/50 dark:hover:bg-neutral-700/50 transition-colors">
                    <td className="p-3 font-mono text-xs text-neutral-600 dark:text-neutral-400">{curso.codigo}</td>
                    <td className="p-3 font-medium text-neutral-800 dark:text-neutral-200">{curso.nombre}</td>
                    <td className="p-3 text-center text-neutral-700 dark:text-neutral-300">{curso.ciclo}</td>
                    <td className="p-3 text-neutral-600 dark:text-neutral-400 text-xs">{curso.especialidad || "—"}</td>
                    
                    <td className="p-3 text-center">
                      <div className="inline-flex flex-col sm:flex-row gap-1 px-2 py-1 bg-neutral-100 dark:bg-neutral-900 rounded-md text-2xs font-mono text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 transition-colors">
                        <span title="Horas de Teoría" className={curso.horas_t > 0 ? "text-primary-700 dark:text-primary-400 font-bold" : ""}>T:{curso.horas_t || 0}</span>
                        <span title="Horas de Práctica" className={curso.horas_p > 0 ? "text-primary-700 dark:text-primary-400 font-bold" : ""}>P:{curso.horas_p || 0}</span>
                        <span title="Horas de Laboratorio" className={curso.horas_l > 0 ? "text-primary-700 dark:text-primary-400 font-bold" : ""}>L:{curso.horas_l || 0}</span>
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="flex flex-wrap gap-1.5">
                        {asigs.length === 0 ? (
                          <span className="text-xs text-neutral-400 dark:text-neutral-500">Sin asignar</span>
                        ) : (
                          asigs.map((a) => (
                            <span
                              key={a.id}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-medium border transition-colors ${
                                a.tipo === "Teoria"
                                  ? "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-800/50"
                                  : a.tipo === "Practica"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50"
                                  : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/50"
                              }`}
                            >
                              <span className="opacity-70 font-bold">[{a.grupo || 'Único'}]</span>
                              {a.tipo === "Teoria" ? <Building2 className="w-3 h-3 ml-0.5" /> : a.tipo === "Practica" ? <BookOpen className="w-3 h-3 ml-0.5" /> : <FlaskConical className="w-3 h-3 ml-0.5" />}
                              {getNombreDocente(a.docente_id)}
                              <span className="text-primary-600 dark:text-primary-400 font-bold ml-1">({Number(a.horas_asignadas)}h)</span>
                              <button onClick={() => abrirModalEditar(a, curso)} className="ml-1 text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" title="Editar asignación">
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button onClick={() => handleEliminar(a.id)} className="ml-0.5 text-neutral-400 hover:text-danger-500 dark:hover:text-danger-400 transition-colors" title="Eliminar asignación">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => abrirModalMasivo(curso)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50`}
                        title="Asignar docente"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Asignar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && cursoSeleccionado && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 animate-fade-in transition-colors duration-300" onClick={() => { setModalOpen(false); setAsignacionEdicion(null); }}>
          <div className="card p-6 w-full max-w-2xl shadow-modal animate-scale-in max-h-[90vh] overflow-y-auto bg-white dark:bg-neutral-800 dark:border-neutral-700 transition-colors" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2 transition-colors">
                <GraduationCap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                {asignacionEdicion ? "Modificar Asignación" : "Asignar Docente a Curso"}
              </h2>
              <button onClick={() => { setModalOpen(false); setAsignacionEdicion(null); }} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 transition-colors">{cursoSeleccionado.codigo} — {cursoSeleccionado.nombre}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 transition-colors">
                Ciclo {cursoSeleccionado.ciclo} · {cursoSeleccionado.especialidad || "Sin especialidad"}
              </p>
              <div className="mt-2 flex gap-2">
                <span className={`text-xs px-2 py-0.5 rounded border ${cursoSeleccionado.horas_t > 0 ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800' : 'bg-neutral-100 text-neutral-400 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-700'} font-medium`}>Teoría: {cursoSeleccionado.horas_t || 0}h</span>
                <span className={`text-xs px-2 py-0.5 rounded border ${cursoSeleccionado.horas_p > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' : 'bg-neutral-100 text-neutral-400 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-700'} font-medium`}>Práctica: {cursoSeleccionado.horas_p || 0}h</span>
                <span className={`text-xs px-2 py-0.5 rounded border ${cursoSeleccionado.horas_l > 0 ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800' : 'bg-neutral-100 text-neutral-400 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-700'} font-medium`}>Lab: {cursoSeleccionado.horas_l || 0}h</span>
              </div>
            </div>

            {mensaje && (
              <div className={`mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${mensaje.tipo === 'exito' ? 'bg-success-50 text-success-700 border-success-200 dark:bg-success-900/30 dark:text-success-400 dark:border-success-800/50' : 'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/30 dark:text-danger-400 dark:border-danger-800/50'}`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {mensaje.texto}
              </div>
            )}

            {asignacionEdicion ? (
              <div className="space-y-4">
                <div className="p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800/50">
                  <p className="text-sm text-warning-800 dark:text-warning-300 font-medium">
                    Editando: <span className="font-bold">{asignacionEdicion.tipo} - Grupo [{asignacionEdicion.grupo || 'Único'}] ({asignacionEdicion.horas_asignadas}h)</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 transition-colors">
                    <Users className="w-3.5 h-3.5 inline mr-1 text-neutral-400 dark:text-neutral-500" /> Cambiar Docente
                  </label>
                  <select value={docenteSeleccionado} onChange={(e) => setDocenteSeleccionado(e.target.value)} className="input w-full font-medium text-neutral-800 dark:text-white bg-white dark:bg-neutral-900 dark:border-neutral-700 transition-colors">
                    <option value="">Seleccionar docente...</option>
                    {getDocentesDisponiblesParaEdicion().map((d) => (
                      <option key={d.id} value={d.id}>{d.apellidos}, {d.nombres} ({d.categoria})</option>
                    ))}
                  </select>
                </div>

                {docenteSeleccionado && (
                  <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800/50 transition-colors">
                    <div className="flex items-center justify-between text-sm text-primary-700 dark:text-primary-400 transition-colors">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">Carga calculada:</span>
                      </div>
                      <span className="font-bold text-primary-800 dark:text-primary-300">
                        {horasProyectadas}h / {MAX_HORAS_DOCENTE}h semanales
                      </span>
                    </div>
                    <div className="w-full bg-primary-200 dark:bg-primary-900/50 rounded-full h-2.5 mt-2 overflow-hidden transition-colors">
                      <div
                        className={`h-full transition-all duration-500 ease-out ${excedeHoras ? 'bg-danger-500' : 'bg-primary-600 dark:bg-primary-500'}`}
                        style={{ width: `${Math.min(100, (horasProyectadas / MAX_HORAS_DOCENTE) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 transition-colors">Cambiar Ambiente (Opcional)</label>
                  <select value={editAmbiente} onChange={(e) => setEditAmbiente(e.target.value)} className="input w-full font-medium text-neutral-800 dark:text-white bg-white dark:bg-neutral-900 dark:border-neutral-700 transition-colors" disabled={cargandoDisponibilidad}>
                    <option value="">Sin preferencia / Eliminar ambiente</option>
                    {(asignacionEdicion.tipo === "Teoria" || asignacionEdicion.tipo === "Practica" ? aulas : laboratorios).map((amb) => {
                      const ocupado = ambientesOcupados.includes(Number(amb.id));
                      return <option key={amb.id} value={amb.id} disabled={ocupado}>{amb.codigo} — Cap: {amb.capacidad} {ocupado ? "❌ (OCUPADO)" : "✅"}</option>
                    })}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 transition-colors">
                    1. ¿A quién le vas a asignar carga?
                  </label>
                  <select value={docenteSeleccionado} onChange={(e) => setDocenteSeleccionado(e.target.value)} className="input w-full font-medium text-neutral-800 dark:text-white bg-white dark:bg-neutral-900 dark:border-neutral-700 transition-colors">
                    <option value="">-- Elija un docente primero --</option>
                    {getDocentesDisponiblesParaMasivo().map((d) => (
                      <option key={d.id} value={d.id}>{d.apellidos}, {d.nombres} ({d.categoria})</option>
                    ))}
                  </select>
                </div>

                <div className={`transition-opacity duration-300 ${!docenteSeleccionado ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 transition-colors">
                    2. Selecciona las partes del curso que dictará
                  </label>
                  <div className="space-y-4 mt-2">
                    {['Teoria', 'Practica', 'Laboratorio'].map(tipo => {
                      const horasTotal = getHorasCurso(cursoSeleccionado, tipo);
                      if (horasTotal === 0) return null;

                      const themeColors = { Teoria: "primary", Practica: "emerald", Laboratorio: "indigo" }[tipo];
                      const asigsGuardadas = getAsignacionesDeCurso(cursoSeleccionado.id).filter(a => a.tipo === tipo);
                      
                      const estaBloqueado = asigsGuardadas.length > 0;
                      const horasPorGrupo = horasTotal / (numGrupos[tipo] || 1);
                      const nombresGrupos = numGrupos[tipo] === 1 ? ['Único'] : Array.from({length: numGrupos[tipo]}, (_, i) => String.fromCharCode(65 + i));

                      return (
                        <div key={tipo} className={`p-4 rounded-xl border border-${themeColors}-200 dark:border-${themeColors}-800/50 bg-${themeColors}-50/30 dark:bg-${themeColors}-900/10`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                            <span className={`font-bold text-${themeColors}-700 dark:text-${themeColors}-400`}>{tipo} ({horasPorGrupo}h por grupo)</span>
                            <div className={`flex items-center gap-2 text-sm bg-white dark:bg-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm ${estaBloqueado ? 'opacity-70 cursor-not-allowed' : ''}`}>
                              <span className="text-neutral-600 dark:text-neutral-400 font-medium">Dividir curso en:</span>
                              {/* 🌟 AQUÍ LLAMAMOS A LA FUNCIÓN QUE CORRIGE EL BUG */}
                              <input 
                                type="number" min="1" max="10" 
                                disabled={estaBloqueado}
                                className={`w-12 text-center font-bold outline-none bg-transparent ${estaBloqueado ? 'text-neutral-400 dark:text-neutral-500' : 'dark:text-white'}`}
                                value={numGrupos[tipo]}
                                onChange={(e) => handleCambioGrupos(tipo, e.target.value)}
                              />
                              <span className="text-neutral-600 dark:text-neutral-400 font-medium">grupo(s)</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                            {nombresGrupos.map(grupo => {
                              const idParte = `${tipo}-${grupo}`;
                              const yaAsignado = asigsGuardadas.find(a => (a.grupo || 'Único') === grupo);

                              if (yaAsignado) {
                                return (
                                  <div key={idParte} className="flex flex-col p-2.5 rounded-lg bg-white/50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 opacity-60">
                                    <div className="flex items-center gap-2">
                                      <input type="checkbox" disabled checked className="text-neutral-400" />
                                      <span className="text-sm font-bold line-through text-neutral-500 dark:text-neutral-400">Grupo {grupo}</span>
                                    </div>
                                    <span className="text-2xs text-neutral-500 dark:text-neutral-400 mt-1 pl-6 line-clamp-1">Dictado por: {getNombreDocente(yaAsignado.docente_id)}</span>
                                  </div>
                                );
                              }

                              const isChecked = checkedPartes.includes(idParte);
                              return (
                                <label key={idParte} className={`flex flex-col p-2.5 rounded-lg border-2 cursor-pointer transition-all ${isChecked ? `border-${themeColors}-500 bg-white dark:bg-neutral-800 shadow-sm` : 'border-transparent bg-white/80 dark:bg-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-600'}`}>
                                  <div className="flex items-center gap-2">
                                    <input type="checkbox" className={`w-4 h-4 text-${themeColors}-600 rounded`} checked={isChecked} onChange={() => toggleParte(idParte)} />
                                    <span className={`text-sm font-bold ${isChecked ? `text-${themeColors}-700 dark:text-${themeColors}-400` : 'text-neutral-700 dark:text-neutral-300'}`}>Grupo {grupo}</span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {docenteSeleccionado && (
                  <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800/50 transition-colors">
                    <div className="flex items-center justify-between text-sm text-primary-700 dark:text-primary-400 transition-colors">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">Carga calculada:</span>
                      </div>
                      <span className="font-bold text-primary-800 dark:text-primary-300">
                        {horasProyectadas}h / {MAX_HORAS_DOCENTE}h semanales
                      </span>
                    </div>
                    <div className="w-full bg-primary-200 dark:bg-primary-900/50 rounded-full h-2.5 mt-2 overflow-hidden transition-colors">
                      <div
                        className={`h-full transition-all duration-500 ease-out ${excedeHoras ? 'bg-danger-500' : 'bg-primary-600 dark:bg-primary-500'}`}
                        style={{ width: `${Math.min(100, (horasProyectadas / MAX_HORAS_DOCENTE) * 100)}%` }}
                      />
                    </div>
                    {excedeHoras && <p className="text-xs text-danger-600 dark:text-danger-400 text-right mt-1 animate-pulse font-bold">¡Supera el límite permitido!</p>}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-3 border-t border-neutral-100 dark:border-neutral-700 mt-4 transition-colors">
              <button onClick={() => { setModalOpen(false); setAsignacionEdicion(null); }} className="btn-ghost dark:text-neutral-300 dark:hover:bg-neutral-700 transition-colors">Cancelar</button>
              <button
                onClick={handleGuardar}
                disabled={guardando || !docenteSeleccionado || excedeHoras || (!asignacionEdicion && checkedPartes.length === 0)}
                className="btn-primary flex items-center gap-2 border-none dark:bg-primary-700 dark:hover:bg-primary-600 dark:disabled:bg-primary-800 transition-colors"
              >
                {guardando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {guardando ? "Guardando..." : asignacionEdicion ? "Actualizar Asignación" : "Guardar Asignaciones"}
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAsignaciones;