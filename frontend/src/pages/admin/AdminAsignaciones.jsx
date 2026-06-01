import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../services/api";
import {
  Users,
  BookOpen,
  Plus,
  Trash2,
  Pencil, 
  CheckCircle,
  AlertCircle,
  RefreshCw,
  GraduationCap,
  Building2,
  FlaskConical,
  X,
  Save,
  Search,
  Filter,
  Zap,
  Clock,
  Ban,
} from "lucide-react";

const MAX_HORAS_DOCENTE = 20;

// 🌟 UTILIDAD: Convertir formatos de tiempo a minutos absolutos para cálculos matemáticos precisos
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

  // Filtros
  const [filtroEspecialidad, setFiltroEspecialidad] = useState("");
  const [filtroCiclo, setFiltroCiclo] = useState("");
  const [searchCurso, setSearchCurso] = useState("");

  // Control de Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [asignacionEdicion, setAsignacionEdicion] = useState(null); 
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState("");
  const [tipoAsignacion, setTipoAsignacion] = useState("Teoria");
  const [ambientePreferido, setAmbientePreferido] = useState("");
  const [aulas, setAulas] = useState([]);
  const [laboratorios, setLaboratorios] = useState([]);
  const [guardando, setGuardando] = useState(false);

  // 🌟 SINCRO: Horarios globales de la malla para validación viva de contingencias
  const [horarios, setHorarios] = useState([]);
  const [ambientesOcupados, setAmbientesOcupados] = useState([]);
  const [cargandoDisponibilidad, setCargandoDisponibilidad] = useState(false);

  const semestre = config?.semestre_activo || "2026-1";

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      // Agregamos la carga de horarios globales en paralelo
      const [resCursos, resDocentes, resAsig, resConf, resAulas, resLabs, resHorarios] = await Promise.all([
        api.get("/cursos"),
        api.get("/docentes"),
        api.get("/asignaciones"),
        api.get("/configuracion"),
        api.get("/aulas"),
        api.get("/laboratorios"),
        api.get("/horarios").catch(() => ({ data: { data: [] } }))
      ]);
      setCursos(resCursos.data?.data || []);
      setDocentes(resDocentes.data?.data || []);
      setAsignaciones(resAsig.data?.data || []);
      setConfig(resConf.data?.data || null);
      setAulas(resAulas.data?.data || []);
      setLaboratorios(resLabs.data?.data || []);
      setHorarios(resHorarios.data?.data || []); // Guardado dinámico
    } catch (err) {
      console.error("Error cargando datos:", err);
      setMensaje({ tipo: "error", texto: "Error al cargar datos" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const getCiclosActivos = () => {
    if (!semestre) return [];
    const part = semestre.split("-");
    if (part.length !== 2) return [];
    const num = parseInt(part[1], 10);
    return num === 1 ? [1, 3, 5, 7, 9] : [2, 4, 6, 8, 10];
  };

  const ciclosActivos = getCiclosActivos();

  const cursosFiltrados = cursos.filter((c) => {
    const matchEspecialidad = !filtroEspecialidad || (c.especialidad && c.especialidad.toLowerCase() === filtroEspecialidad.toLowerCase());
    const matchCiclo = !filtroCiclo || c.ciclo === Number(filtroCiclo);
    const matchSearch = !searchCurso ||
      (c.codigo && c.codigo.toLowerCase().includes(searchCurso.toLowerCase())) ||
      (c.nombre && c.nombre.toLowerCase().includes(searchCurso.toLowerCase()));
    const matchActivo = ciclosActivos.length === 0 || ciclosActivos.includes(Number(c.ciclo));
    return matchEspecialidad && matchCiclo && matchSearch && matchActivo && !c.deleted_at;
  });

  const especialidades = [...new Set(cursos.map((c) => c.especialidad).filter(Boolean))].sort();

  const horasPorDocente = useMemo(() => {
    const map = {};
    for (const a of asignaciones) {
      if (a.semestre_asignacion !== semestre) continue;
      const curso = cursos.find((c) => c.id === a.curso_id);
      if (!curso) continue;
      const horas = a.tipo === "Teoria" ? (Number(curso.horas_aula) || 0) : (Number(curso.horas_lab) || 0);
      map[a.docente_id] = (map[a.docente_id] || 0) + horas;
    }
    return map;
  }, [asignaciones, cursos, semestre]);

  const abrirModal = (curso) => {
    setCursoSeleccionado(curso);
    setDocenteSeleccionado("");
    setTipoAsignacion("Teoria");
    setAmbientePreferido("");
    setAsignacionEdicion(null); 
    setModalOpen(true);
    setMensaje(null);
  };

  const abrirModalEditar = async (asig, curso) => {
    setCursoSeleccionado(curso);
    setDocenteSeleccionado(asig.docente_id);
    setTipoAsignacion(asig.tipo);
    setAmbientePreferido(asig.ambiente_preferido_id || "");
    setAsignacionEdicion(asig);
    setModalOpen(true);
    setMensaje(null);
    setAmbientesOcupados([]); 

    setCargandoDisponibilidad(true);
    try {
      const res = await api.get(`/asignaciones/${asig.id}/horario`);
      const data = res.data?.data;
      if (data && data.ocupados) {
        setAmbientesOcupados(data.ocupados);
      }
    } catch (err) {
      console.error("Error al verificar disponibilidad de ambientes:", err);
    } finally {
      setCargandoDisponibilidad(false);
    }
  };

  // FILTRADO PREMIUM CON EXCLUSIÓN DE DOCENTES NO DISPONIBLES
  const getDocentesDisponibles = () => {
    if (!cursoSeleccionado) return [];
    const cursoEsp = cursoSeleccionado.especialidad?.toLowerCase();
    const horasCurso = tipoAsignacion === "Teoria"
      ? (Number(cursoSeleccionado.horas_aula) || 0)
      : (Number(cursoSeleccionado.horas_lab) || 0);

    return docentes.filter((d) => {
      if (d.deleted_at) return false;
      if (cursoEsp && d.especialidad?.toLowerCase() !== cursoEsp) return false;
      
      // A. Validar tope de carga horaria semanal
      let horasActuales = horasPorDocente[d.id] || 0;
      if (asignacionEdicion && asignacionEdicion.docente_id === d.id && asignacionEdicion.tipo === tipoAsignacion) {
        horasActuales -= horasCurso;
      }
      if (horasActuales + horasCurso > MAX_HORAS_DOCENTE) return false;

      // B. 🔒 EXCLUSIÓN ABSOLUTA: Si el curso ya tiene horario, sacar a los profesores con cruces
      if (asignacionEdicion) {
        const bloqueFijo = horarios.find(h => Number(h.asignacion_id) === Number(asignacionEdicion.id));
        if (bloqueFijo) {
          const tieneCruce = horarios.some(h => {
            if (h.dia !== bloqueFijo.dia) return false;
            if (Number(h.id) === Number(bloqueFijo.id)) return false; // Evitar evaluarse a sí mismo
            
            const agendaProfId = h.docente?.id || h.docente_id;
            if (Number(agendaProfId) !== Number(d.id)) return false;

            // Análisis matemático de colisión de franjas temporales
            const hIni = timeToMinutes(h.hora_inicio);
            const hFin = timeToMinutes(h.hora_fin);
            const bIni = timeToMinutes(bloqueFijo.hora_inicio);
            const bFin = timeToMinutes(bloqueFijo.hora_fin);

            return bIni < hFin && bFin > hIni;
          });

          if (tieneCruce) return false;
        }
      }

      return true;
    });
  };

  const handleGuardar = async () => {
    if (!docenteSeleccionado || !cursoSeleccionado) return;
    setGuardando(true);
    setMensaje(null);
    try {
      const payload = {
        docente_id: Number(docenteSeleccionado),
        curso_id: cursoSeleccionado.id,
        tipo: tipoAsignacion,
        semestre_asignacion: semestre,
        ambiente_preferido_id: ambientePreferido ? Number(ambientePreferido) : null,
      };

      let res;
      if (asignacionEdicion) {
        res = await api.put(`/asignaciones/${asignacionEdicion.id}`, payload);
      } else {
        res = await api.post("/asignaciones", payload);
      }

      if (res.data?.success) {
        setMensaje({ 
          tipo: "exito", 
          texto: asignacionEdicion ? "Asignación modificada correctamente" : "Asignación creada correctamente" 
        });
        setModalOpen(false);
        setAsignacionEdicion(null);
        cargarDatos();
      } else {
        setMensaje({ tipo: "error", texto: res.data?.message || "Error al procesar la asignación" });
      }
    } catch (err) {
      setMensaje({
        tipo: "error",
        texto: err.response?.data?.message || "Error al procesar la asignación",
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar esta asignación?")) return;
    try {
      await api.delete(`/asignaciones/${id}`);
      cargarDatos();
    } catch (err) {
      setMensaje({
        tipo: "error",
        texto: err.response?.data?.message || "Error al eliminar",
      });
    }
  };

  const handleAsignacionAutomatica = async () => {
    if (!confirm(`¿Asignar automáticamente todos los cursos del semestre ${semestre}? Esta acción respetará especialidades y el límite de ${MAX_HORAS_DOCENTE}h por docente.`)) return;
    setAutoAsignando(true);
    setMensaje(null);
    try {
      const res = await api.post("/asignaciones/auto", { semestre });
      if (res.data?.success) {
        setMensaje({
          tipo: "exito",
          texto: `${res.data.data?.creadas || 0} asignaciones creadas, ${res.data.data?.fallidas || 0} fallidas.`,
        });
        cargarDatos();
      } else {
        setMensaje({ tipo: "error", texto: res.data?.message || "Error en asignación automática" });
      }
    } catch (err) {
      setMensaje({
        tipo: "error",
        texto: err.response?.data?.message || "Error en asignación automática",
      });
    } finally {
      setAutoAsignando(false);
    }
  };

  const handleLimpiarTodo = async () => {
    if (!confirm(`¿Eliminar TODAS las asignaciones del semestre ${semestre}? Esta acción no se puede deshacer.`)) return;
    setLimpiando(true);
    setMensaje(null);
    try {
      const res = await api.post("/asignaciones/limpiar", { semestre });
      if (res.data?.success) {
        setMensaje({
          tipo: "exito",
          texto: `${res.data.data?.eliminadas || 0} asignaciones eliminadas.`,
        });
        cargarDatos();
      } else {
        setMensaje({ tipo: "error", texto: res.data?.message || "Error al limpiar asignaciones" });
      }
    } catch (err) {
      setMensaje({
        tipo: "error",
        texto: err.response?.data?.message || "Error al limpiar asignaciones",
      });
    } finally {
      setLimpiando(false);
    }
  };

  const getAsignacionesDeCurso = (cursoId) => {
    return asignaciones.filter((a) => a.curso_id === cursoId && a.semestre_asignacion === semestre);
  };

  const getNombreDocente = (id) => {
    const d = docentes.find((doc) => doc.id === id);
    return d ? `${d.nombres} ${d.apellidos}` : `Docente ${id}`;
  };

  const getHorasDocente = (id) => horasPorDocente[id] || 0;

  const isTipoYaAsignado = (cursoId, tipo) => {
    return asignaciones.some((a) => 
      a.curso_id === cursoId && 
      a.semestre_asignacion === semestre && 
      a.tipo === tipo &&
      (!asignacionEdicion || a.id !== asignacionEdicion.id)
    );
  };

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
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            Asignaciones Docente-Curso
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
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
            <div
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium animate-slide-down ${
                mensaje.tipo === "exito"
                  ? "bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-400 border border-success-200 dark:border-success-800/50"
                  : "bg-danger-50 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400 border border-danger-200 dark:border-danger-800/50"
              }`}
            >
              {mensaje.tipo === "exito" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {mensaje.texto}
              <button onClick={() => setMensaje(null)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <button
            onClick={handleAsignacionAutomatica}
            disabled={autoAsignando}
            className="btn-primary flex items-center gap-2 bg-warning-600 hover:bg-warning-700 dark:bg-warning-500 dark:hover:bg-warning-600 dark:text-white"
          >
            {autoAsignando ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Asignando...</>
            ) : (
              <><Zap className="w-4 h-4" /> Asignar Automático</>
            )}
          </button>
          <button
            onClick={handleLimpiarTodo}
            disabled={limpiando}
            className="btn-secondary flex items-center gap-2 bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-400 border-danger-200 dark:border-danger-800/50 hover:bg-danger-100 dark:hover:bg-danger-900/40 hover:text-danger-800 dark:hover:text-danger-300"
          >
            {limpiando ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Limpiando...</>
            ) : (
              <><Trash2 className="w-4 h-4" /> Limpiar Todo</>
            )}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4 mb-6 dark:bg-neutral-800 dark:border-neutral-700">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              <Search className="w-3.5 h-3.5 inline mr-1 text-neutral-400 dark:text-neutral-500" />
              Buscar curso
            </label>
            <input
              type="text"
              value={searchCurso}
              onChange={(e) => setSearchCurso(e.target.value)}
              className="input w-full dark:bg-neutral-900 dark:border-neutral-700 dark:text-white"
              placeholder="Código o nombre..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              <Filter className="w-3.5 h-3.5 inline mr-1 text-neutral-400 dark:text-neutral-500" />
              Especialidad
            </label>
            <select
              value={filtroEspecialidad}
              onChange={(e) => setFiltroEspecialidad(e.target.value)}
              className="input w-48 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white"
            >
              <option value="">Todas</option>
              {especialidades.map((esp) => (
                <option key={esp} value={esp}>{esp}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Ciclo</label>
            <select
              value={filtroCiclo}
              onChange={(e) => setFiltroCiclo(e.target.value)}
              className="input w-28 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white"
            >
              <option value="">Todos</option>
              {ciclosActivos.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <button onClick={cargarDatos} className="btn-secondary flex items-center gap-2 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700">
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden dark:bg-neutral-800 dark:border-neutral-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-700">
                <th className="text-left p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase w-24">Código</th>
                <th className="text-left p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Curso</th>
                <th className="text-center p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase w-16">Ciclo</th>
                <th className="text-left p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase w-40">Especialidad</th>
                <th className="text-center p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase w-20">Horas</th>
                <th className="text-left p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Asignaciones</th>
                <th className="text-center p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase w-28">Acción</th>
              </tr>
            </thead>
            <tbody>
              {cursosFiltrados.map((curso) => {
                const asigs = getAsignacionesDeCurso(curso.id);
                const tieneTeoria = asigs.some((a) => a.tipo === "Teoria");
                const tieneLab = asigs.some((a) => a.tipo === "Laboratorio");
                const completado = tieneTeoria && (!curso.horas_lab || tieneLab);
                return (
                  <tr key={curso.id} className="border-b border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50/50 dark:hover:bg-neutral-700/50 transition-colors">
                    <td className="p-3 font-mono text-xs text-neutral-600 dark:text-neutral-400">{curso.codigo}</td>
                    <td className="p-3 font-medium text-neutral-800 dark:text-neutral-200">{curso.nombre}</td>
                    <td className="p-3 text-center text-neutral-700 dark:text-neutral-300">{curso.ciclo}</td>
                    <td className="p-3 text-neutral-600 dark:text-neutral-400 text-xs">{curso.especialidad || "—"}</td>
                    <td className="p-3 text-center text-neutral-700 dark:text-neutral-300 text-xs">
                      {curso.horas_aula || 0}h
                      {curso.horas_lab ? ` + ${curso.horas_lab}h lab` : ""}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {asigs.length === 0 ? (
                          <span className="text-xs text-neutral-400 dark:text-neutral-500">Sin asignar</span>
                        ) : (
                          asigs.map((a) => (
                            <span
                              key={a.id}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-medium border ${
                                a.tipo === "Teoria"
                                  ? "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-800/50"
                                  : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/50"
                              }`}
                            >
                              {a.tipo === "Teoria" ? <Building2 className="w-3 h-3" /> : <FlaskConical className="w-3 h-3" />}
                              {getNombreDocente(a.docente_id)}
                              
                              <button
                                onClick={() => abrirModalEditar(a, curso)}
                                className="ml-1 text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                title="Editar asignación"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>

                              <button
                                onClick={() => handleEliminar(a.id)}
                                className="ml-0.5 text-neutral-400 hover:text-danger-500 dark:hover:text-danger-400 transition-colors"
                                title="Eliminar asignación"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => abrirModal(curso)}
                        disabled={completado}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          completado 
                            ? "bg-neutral-100 text-neutral-400 cursor-not-allowed dark:bg-neutral-800 dark:text-neutral-500" 
                            : "bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50"
                        }`}
                        title={completado ? "Curso completamente asignado" : "Asignar docente"}
                      >
                        {completado ? <CheckCircle className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        {completado ? "Listo" : "Asignar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Asignación / Edición */}
      {modalOpen && cursoSeleccionado && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 animate-fade-in"
          onClick={() => { setModalOpen(false); setAsignacionEdicion(null); }}
        >
          <div
            className="card p-6 w-full max-w-lg shadow-modal animate-scale-in max-h-[90vh] overflow-y-auto dark:bg-neutral-800 dark:border-neutral-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                {asignacionEdicion ? "Modificar Asignación (Plan de Contingencia)" : "Asignar Docente"}
              </h2>
              <button
                onClick={() => { setModalOpen(false); setAsignacionEdicion(null); }}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{cursoSeleccionado.codigo} — {cursoSeleccionado.nombre}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Ciclo {cursoSeleccionado.ciclo} · {cursoSeleccionado.especialidad || "Sin especialidad"}
                {cursoSeleccionado.horas_aula ? ` · ${cursoSeleccionado.horas_aula}h teoría` : ""}
                {cursoSeleccionado.horas_lab ? ` · ${cursoSeleccionado.horas_lab}h lab` : ""}
              </p>
            </div>

            {mensaje && modalOpen && (
              <div className={`mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border ${mensaje.tipo === 'exito' ? 'bg-success-50 text-success-700 border-success-200 dark:bg-success-900/30 dark:text-success-400 dark:border-success-800/50' : 'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/30 dark:text-danger-400 dark:border-danger-800/50'}`}>
                <AlertCircle className="w-4 h-4" /> {mensaje.texto}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Tipo de asignación</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoAsignacion("Teoria")}
                    disabled={isTipoYaAsignado(cursoSeleccionado.id, "Teoria")}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      isTipoYaAsignado(cursoSeleccionado.id, "Teoria")
                        ? "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-700"
                        : tipoAsignacion === "Teoria" ? "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/40 dark:text-primary-400 dark:border-primary-800/50" : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-700 dark:hover:bg-neutral-800"
                    }`}
                  >
                    {isTipoYaAsignado(cursoSeleccionado.id, "Teoria") ? <Ban className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                    Teoría
                  </button>
                  {cursoSeleccionado.horas_lab > 0 && (
                    <button
                      type="button"
                      onClick={() => setTipoAsignacion("Laboratorio")}
                      disabled={isTipoYaAsignado(cursoSeleccionado.id, "Laboratorio")}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        isTipoYaAsignado(cursoSeleccionado.id, "Laboratorio")
                          ? "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-700"
                          : tipoAsignacion === "Laboratorio" ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-400 dark:border-indigo-800/50" : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-700 dark:hover:bg-neutral-800"
                      }`}
                    >
                      {isTipoYaAsignado(cursoSeleccionado.id, "Laboratorio") ? <Ban className="w-4 h-4" /> : <FlaskConical className="w-4 h-4" />}
                      Laboratorio
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  <Users className="w-3.5 h-3.5 inline mr-1 text-neutral-400 dark:text-neutral-500" /> Docente Disponible
                </label>
                <select
                  value={docenteSeleccionado}
                  onChange={(e) => setDocenteSeleccionado(e.target.value)}
                  className="input w-full font-medium text-neutral-800 dark:text-white bg-white dark:bg-neutral-900 dark:border-neutral-700"
                  disabled={isTipoYaAsignado(cursoSeleccionado.id, tipoAsignacion)}
                >
                  <option value="">Seleccionar docente...</option>
                  {getDocentesDisponibles().map((d) => {
                    const horas = getHorasDocente(d.id);
                    const horasCurso = tipoAsignacion === "Teoria" ? (Number(cursoSeleccionado.horas_aula) || 0) : (Number(cursoSeleccionado.horas_lab) || 0);
                    
                    let horasBaseCalculo = horas;
                    if (asignacionEdicion && asignacionEdicion.docente_id === d.id && asignacionEdicion.tipo === tipoAsignacion) {
                      horasBaseCalculo -= horasCurso;
                    }

                    return (
                      <option key={d.id} value={d.id}>
                        {d.apellidos}, {d.nombres} ({d.categoria}) · {horasBaseCalculo}h ➜ {horasBaseCalculo + horasCurso}h / {MAX_HORAS_DOCENTE}h max
                      </option>
                    );
                  })}
                </select>
              </div>

              {docenteSeleccionado && (
                <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800/50">
                  <div className="flex items-center gap-2 text-sm text-primary-700 dark:text-primary-400">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">
                      Carga calculada: {
                        (getHorasDocente(Number(docenteSeleccionado)) - 
                        (asignacionEdicion && asignacionEdicion.docente_id === Number(docenteSeleccionado) && asignacionEdicion.tipo === tipoAsignacion ? (tipoAsignacion === "Teoria" ? (Number(cursoSeleccionado.horas_aula) || 0) : (Number(cursoSeleccionado.horas_lab) || 0)) : 0))
                      }h / {MAX_HORAS_DOCENTE}h semanales
                    </span>
                  </div>
                  <div className="w-full bg-primary-200 dark:bg-primary-900/50 rounded-full h-2 mt-2">
                    <div
                      className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (((getHorasDocente(Number(docenteSeleccionado)) - (asignacionEdicion && asignacionEdicion.docente_id === Number(docenteSeleccionado) && asignacionEdicion.tipo === tipoAsignacion ? (tipoAsignacion === "Teoria" ? (Number(cursoSeleccionado.horas_aula) || 0) : (Number(cursoSeleccionado.horas_lab) || 0)) : 0)) + (tipoAsignacion === "Teoria" ? (Number(cursoSeleccionado.horas_aula) || 0) : (Number(cursoSeleccionado.horas_lab) || 0))) / MAX_HORAS_DOCENTE) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Ambiente preferido (opcional)</label>
                <select
                  value={ambientePreferido}
                  onChange={(e) => setAmbientePreferido(e.target.value)}
                  className="input w-full font-medium text-neutral-800 dark:text-white bg-white dark:bg-neutral-900 dark:border-neutral-700"
                  disabled={isTipoYaAsignado(cursoSeleccionado.id, tipoAsignacion) || cargandoDisponibilidad}
                >
                  <option value="">Sin preferencia</option>
                  {tipoAsignacion === "Teoria"
                    ? aulas.map((a) => {
                        const estaOcupado = ambientesOcupados.includes(Number(a.id));
                        return (
                          <option key={a.id} value={a.id} disabled={estaOcupado}>
                            {a.codigo} — Cap: {a.capacidad} {estaOcupado ? "❌ (OCUPADO)" : "✅ (DISPONIBLE)"}
                          </option>
                        );
                      })
                    : laboratorios.map((l) => {
                        const estaOcupado = ambientesOcupados.includes(Number(l.id));
                        return (
                          <option key={l.id} value={l.id} disabled={estaOcupado}>
                            {l.codigo} — Cap: {l.capacidad} {estaOcupado ? "❌ (OCUPADO)" : "✅ (DISPONIBLE)"}
                          </option>
                        );
                      })}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button 
                  onClick={() => { setModalOpen(false); setAsignacionEdicion(null); }} 
                  className="btn-ghost dark:text-neutral-300 dark:hover:bg-neutral-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={guardando || !docenteSeleccionado || isTipoYaAsignado(cursoSeleccionado.id, tipoAsignacion)}
                  className="btn-primary flex items-center gap-2"
                >
                  {guardando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {guardando ? "Guardando..." : asignacionEdicion ? "Actualizar Asignación" : "Guardar Asignación"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAsignaciones;