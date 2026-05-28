import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../services/api";
import {
  Users,
  BookOpen,
  Plus,
  Trash2,
  Pencil, // Inyectado para el botón de edición
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

const AdminAsignaciones = () => {
  const [cursos, setCursos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoAsignando, setAutoAsignando] = useState(false);
  const [limpiando, setLimpiando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Filters
  const [filtroEspecialidad, setFiltroEspecialidad] = useState("");
  const [filtroCiclo, setFiltroCiclo] = useState("");
  const [searchCurso, setSearchCurso] = useState("");

  // Assignment modal
  const [modalOpen, setModalOpen] = useState(false);
  const [asignacionEdicion, setAsignacionEdicion] = useState(null); // 👇 NUEVO: Estado para controlar el modo edición
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState("");
  const [tipoAsignacion, setTipoAsignacion] = useState("Teoria");
  const [ambientePreferido, setAmbientePreferido] = useState("");
  const [aulas, setAulas] = useState([]);
  const [laboratorios, setLaboratorios] = useState([]);
  const [guardando, setGuardando] = useState(false);

  const [ambientesOcupados, setAmbientesOcupados] = useState([]);
  const [cargandoDisponibilidad, setCargandoDisponibilidad] = useState(false);

  const semestre = config?.semestre_activo || "2026-1";

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [resCursos, resDocentes, resAsig, resConf, resAulas, resLabs] = await Promise.all([
        api.get("/cursos"),
        api.get("/docentes"),
        api.get("/asignaciones"),
        api.get("/configuracion"),
        api.get("/aulas"),
        api.get("/laboratorios"),
      ]);
      setCursos(resCursos.data?.data || []);
      setDocentes(resDocentes.data?.data || []);
      setAsignaciones(resAsig.data?.data || []);
      setConfig(resConf.data?.data || null);
      setAulas(resAulas.data?.data || []);
      setLaboratorios(resLabs.data?.data || []);
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

  // Determine active cycles based on semester
  const getCiclosActivos = () => {
    if (!semestre) return [];
    const part = semestre.split("-");
    if (part.length !== 2) return [];
    const num = parseInt(part[1], 10);
    return num === 1 ? [1, 3, 5, 7, 9] : [2, 4, 6, 8, 10];
  };

  const ciclosActivos = getCiclosActivos();

  // Filter courses
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

  // Calculate hours per teacher from current assignments
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
    setAsignacionEdicion(null); // Desactiva modo edición
    setModalOpen(true);
    setMensaje(null);
  };

  // 👇 NUEVO: Función para abrir el modal precargado en Modo Edición
  const abrirModalEditar = async (asig, curso) => {
    setCursoSeleccionado(curso);
    setDocenteSeleccionado(asig.docente_id);
    setTipoAsignacion(asig.tipo);
    setAmbientePreferido(asig.ambiente_preferido_id || "");
    setAsignacionEdicion(asig);
    setModalOpen(true);
    setMensaje(null);
    setAmbientesOcupados([]); // Limpiar estados previos

    setCargandoDisponibilidad(true);
    try {
      // Llamamos al nuevo endpoint unificado de secretaría
      const res = await api.get(`/asignaciones/${asig.id}/horario`);
      const data = res.data?.data;

      // Si el backend nos devuelve la lista negra de ocupados, la cargamos directamente
      if (data && data.ocupados) {
        setAmbientesOcupados(data.ocupados);
      }
    } catch (err) {
      console.error("Error al verificar disponibilidad de ambientes:", err);
    } finally {
      setCargandoDisponibilidad(false);
    }
  };

  const getDocentesDisponibles = () => {
    if (!cursoSeleccionado) return [];
    const cursoEsp = cursoSeleccionado.especialidad?.toLowerCase();
    const horasCurso = tipoAsignacion === "Teoria"
      ? (Number(cursoSeleccionado.horas_aula) || 0)
      : (Number(cursoSeleccionado.horas_lab) || 0);

    return docentes.filter((d) => {
      if (d.deleted_at) return false;
      if (cursoEsp && d.especialidad?.toLowerCase() !== cursoEsp) return false;
      
      // MODIFICADO: Si estamos editando y evaluamos al docente actual, le restamos el peso
      // de la asignación antigua para que no se autodescarte por sobrecarga de horas.
      let horasActuales = horasPorDocente[d.id] || 0;
      if (asignacionEdicion && asignacionEdicion.docente_id === d.id && asignacionEdicion.tipo === tipoAsignacion) {
        horasActuales -= horasCurso;
      }

      if (horasActuales + horasCurso > MAX_HORAS_DOCENTE) return false;
      return true;
    });
  };

  // MODIFICADO: Soporta peticiones POST (Crear) y PUT (Editar) de forma transparente
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
        // MODO EDICIÓN
        res = await api.put(`/asignaciones/${asignacionEdicion.id}`, payload);
      } else {
        // MODO CREACIÓN
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

  // MODIFICADO: Excluye la asignación actual en edición para que no cause falsos positivos consigo misma
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
        <div className="skeleton h-7 w-64 mb-6" />
        <div className="card p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="skeleton h-10 w-40" />
            <div className="skeleton h-10 w-32" />
            <div className="skeleton h-10 w-56" />
          </div>
        </div>
        <div className="card">
          <div className="p-4">
            <div className="skeleton h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-600" />
            Asignaciones Docente-Curso
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Semestre activo: <span className="font-semibold text-primary-700">{semestre}</span>
            {ciclosActivos.length > 0 && (
              <span className="ml-2 text-xs text-neutral-400">
                (Ciclos activos: {ciclosActivos.join(", ")})
              </span>
            )}
            <span className="ml-3 text-xs text-neutral-400">
              Límite: {MAX_HORAS_DOCENTE}h semanales/docente
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {mensaje && !modalOpen && (
            <div
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium animate-slide-down ${
                mensaje.tipo === "exito"
                  ? "bg-success-50 text-success-700 border border-success-200"
                  : "bg-danger-50 text-danger-700 border border-danger-200"
              }`}
            >
              {mensaje.tipo === "exito" ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {mensaje.texto}
              <button onClick={() => setMensaje(null)} className="text-neutral-400 hover:text-neutral-600 ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <button
            onClick={handleAsignacionAutomatica}
            disabled={autoAsignando}
            className="btn-primary flex items-center gap-2 bg-warning-600 hover:bg-warning-700"
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
            className="btn-secondary flex items-center gap-2 bg-danger-50 text-danger-700 border-danger-200 hover:bg-danger-100 hover:text-danger-800"
          >
            {limpiando ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Limpiando...</>
            ) : (
              <><Trash2 className="w-4 h-4" /> Limpiar Todo</>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              <Search className="w-3.5 h-3.5 inline mr-1 text-neutral-400" />
              Buscar curso
            </label>
            <input
              type="text"
              value={searchCurso}
              onChange={(e) => setSearchCurso(e.target.value)}
              className="input w-full"
              placeholder="Código o nombre..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              <Filter className="w-3.5 h-3.5 inline mr-1 text-neutral-400" />
              Especialidad
            </label>
            <select
              value={filtroEspecialidad}
              onChange={(e) => setFiltroEspecialidad(e.target.value)}
              className="input w-48"
            >
              <option value="">Todas</option>
              {especialidades.map((esp) => (
                <option key={esp} value={esp}>
                  {esp}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Ciclo</label>
            <select
              value={filtroCiclo}
              onChange={(e) => setFiltroCiclo(e.target.value)}
              className="input w-28"
            >
              <option value="">Todos</option>
              {ciclosActivos.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <button onClick={cargarDatos} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Courses Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="text-left p-3 text-xs font-semibold text-neutral-500 uppercase w-24">Código</th>
                <th className="text-left p-3 text-xs font-semibold text-neutral-500 uppercase">Curso</th>
                <th className="text-center p-3 text-xs font-semibold text-neutral-500 uppercase w-16">Ciclo</th>
                <th className="text-left p-3 text-xs font-semibold text-neutral-500 uppercase w-40">Especialidad</th>
                <th className="text-center p-3 text-xs font-semibold text-neutral-500 uppercase w-20">Horas</th>
                <th className="text-left p-3 text-xs font-semibold text-neutral-500 uppercase">Asignaciones</th>
                <th className="text-center p-3 text-xs font-semibold text-neutral-500 uppercase w-28">Acción</th>
              </tr>
            </thead>
            <tbody>
              {cursosFiltrados.map((curso) => {
                const asigs = getAsignacionesDeCurso(curso.id);
                const tieneTeoria = asigs.some((a) => a.tipo === "Teoria");
                const tieneLab = asigs.some((a) => a.tipo === "Laboratorio");
                const completado = tieneTeoria && (!curso.horas_lab || tieneLab);
                return (
                  <tr
                    key={curso.id}
                    className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors"
                  >
                    <td className="p-3 font-mono text-xs text-neutral-600">{curso.codigo}</td>
                    <td className="p-3 font-medium text-neutral-800">{curso.nombre}</td>
                    <td className="p-3 text-center text-neutral-700">{curso.ciclo}</td>
                    <td className="p-3 text-neutral-600 text-xs">{curso.especialidad || "—"}</td>
                    <td className="p-3 text-center text-neutral-700 text-xs">
                      {curso.horas_aula || 0}h
                      {curso.horas_lab ? ` + ${curso.horas_lab}h lab` : ""}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {asigs.length === 0 ? (
                          <span className="text-xs text-neutral-400">Sin asignar</span>
                        ) : (
                          asigs.map((a) => (
                            <span
                              key={a.id}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-medium ${
                                a.tipo === "Teoria"
                                  ? "bg-primary-50 text-primary-700 border border-primary-200"
                                  : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              }`}
                            >
                              {a.tipo === "Teoria" ? (
                                <Building2 className="w-3 h-3" />
                              ) : (
                                <FlaskConical className="w-3 h-3" />
                              )}
                              {getNombreDocente(a.docente_id)}
                              
                              {/* 👇 NUEVO: Botón de Editar integrado sutilmente */}
                              <button
                                onClick={() => abrirModalEditar(a, curso)}
                                className="ml-1 text-neutral-400 hover:text-primary-600 transition-colors"
                                title="Editar asignación"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>

                              <button
                                onClick={() => handleEliminar(a.id)}
                                className="ml-0.5 text-neutral-400 hover:text-danger-500 transition-colors"
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
                            ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                            : "bg-primary-50 text-primary-700 hover:bg-primary-100"
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
              {cursosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-neutral-400">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                    No se encontraron cursos para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Modal */}
      {modalOpen && cursoSeleccionado && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="card p-6 w-full max-w-lg shadow-modal animate-scale-in max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary-600" />
                {/* MODIFICADO: Título dinámico según el modo */}
                {asignacionEdicion ? "Modificar Asignación" : "Asignar Docente"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <p className="text-sm font-medium text-neutral-800">{cursoSeleccionado.codigo} — {cursoSeleccionado.nombre}</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Ciclo {cursoSeleccionado.ciclo} · {cursoSeleccionado.especialidad || "Sin especialidad"}
                {cursoSeleccionado.horas_aula ? ` · ${cursoSeleccionado.horas_aula}h teoría` : ""}
                {cursoSeleccionado.horas_lab ? ` · ${cursoSeleccionado.horas_lab}h lab` : ""}
              </p>
            </div>

            {mensaje && modalOpen && (
              <div
                className={`mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium ${
                  mensaje.tipo === "exito"
                    ? "bg-success-50 text-success-700 border border-success-200"
                    : "bg-danger-50 text-danger-700 border border-danger-200"
                }`}
              >
                {mensaje.tipo === "exito" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {mensaje.texto}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Tipo de asignación</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoAsignacion("Teoria")}
                    disabled={isTipoYaAsignado(cursoSeleccionado.id, "Teoria")}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      isTipoYaAsignado(cursoSeleccionado.id, "Teoria")
                        ? "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed"
                        : tipoAsignacion === "Teoria"
                          ? "bg-primary-50 text-primary-700 border-primary-200"
                          : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
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
                          ? "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed"
                          : tipoAsignacion === "Laboratorio"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                      }`}
                    >
                      {isTipoYaAsignado(cursoSeleccionado.id, "Laboratorio") ? <Ban className="w-4 h-4" /> : <FlaskConical className="w-4 h-4" />}
                      Laboratorio
                    </button>
                  )}
                </div>
                {isTipoYaAsignado(cursoSeleccionado.id, tipoAsignacion) && (
                  <p className="text-xs text-danger-600 mt-1.5">
                    Este tipo ya está asignado a otro docente. Selecciona el otro tipo o elimina la asignación existente.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  <Users className="w-3.5 h-3.5 inline mr-1 text-neutral-400" />
                  Docente
                </label>
                <select
                  value={docenteSeleccionado}
                  onChange={(e) => setDocenteSeleccionado(e.target.value)}
                  className="input w-full"
                  disabled={isTipoYaAsignado(cursoSeleccionado.id, tipoAsignacion)}
                >
                  <option value="">Seleccionar docente...</option>
                  {getDocentesDisponibles().map((d) => {
                    const horas = getHorasDocente(d.id);
                    const horasCurso = tipoAsignacion === "Teoria"
                      ? (Number(cursoSeleccionado.horas_aula) || 0)
                      : (Number(cursoSeleccionado.horas_lab) || 0);
                    
                    // Ajuste de texto para simular la carga real en modo edición
                    let horasBaseCalculo = horas;
                    if (asignacionEdicion && asignacionEdicion.docente_id === d.id && asignacionEdicion.tipo === tipoAsignacion) {
                      horasBaseCalculo -= horasCurso;
                    }

                    return (
                      <option key={d.id} value={d.id}>
                        {d.nombres} {d.apellidos} — {d.tipo_nombramiento} ({d.categoria})
                        {d.especialidad ? ` · ${d.especialidad}` : ""}
                        {` · ${horasBaseCalculo}h/${MAX_HORAS_DOCENTE}h`}
                        {` +${horasCurso}h = ${horasBaseCalculo + horasCurso}h`}
                      </option>
                    );
                  })}
                </select>
                {getDocentesDisponibles().length === 0 && (
                  <p className="text-xs text-danger-600 mt-1.5">
                    No hay docentes disponibles para este curso en el semestre {semestre}.
                  </p>
                )}
              </div>

              {docenteSeleccionado && (
                <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                  <div className="flex items-center gap-2 text-sm text-primary-700">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">
                      Carga calculada: {
                        // Lógica visual adaptativa para el progreso real en la barra de carga
                        (getHorasDocente(Number(docenteSeleccionado)) - 
                        (asignacionEdicion && asignacionEdicion.docente_id === Number(docenteSeleccionado) && asignacionEdicion.tipo === tipoAsignacion ? (tipoAsignacion === "Teoria" ? (Number(cursoSeleccionado.horas_aula) || 0) : (Number(cursoSeleccionado.horas_lab) || 0)) : 0))
                      }h / {MAX_HORAS_DOCENTE}h semanales
                    </span>
                  </div>
                  <div className="w-full bg-primary-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (((getHorasDocente(Number(docenteSeleccionado)) - (asignacionEdicion && asignacionEdicion.docente_id === Number(docenteSeleccionado) && asignacionEdicion.tipo === tipoAsignacion ? (tipoAsignacion === "Teoria" ? (Number(cursoSeleccionado.horas_aula) || 0) : (Number(cursoSeleccionado.horas_lab) || 0)) : 0)) + (tipoAsignacion === "Teoria" ? (Number(cursoSeleccionado.horas_aula) || 0) : (Number(cursoSeleccionado.horas_lab) || 0))) / MAX_HORAS_DOCENTE) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Ambiente preferido (opcional) {cargandoDisponibilidad && <span className="text-xs text-primary-500 animate-pulse">(Validando disponibilidad...)</span>}
                </label>
                <select
                  value={ambientePreferido}
                  onChange={(e) => setAmbientePreferido(e.target.value)}
                  className="input w-full font-medium text-neutral-800"
                  disabled={isTipoYaAsignado(cursoSeleccionado.id, tipoAsignacion) || cargandoDisponibilidad}
                >
                  <option value="">Sin preferencia</option>
                  {tipoAsignacion === "Teoria"
                    ? aulas.map((a) => {
                        // El aula está ocupada si su ID está explícitamente en la lista negra
                        const estaOcupado = ambientesOcupados.includes(Number(a.id));
                        return (
                          <option 
                            key={a.id} 
                            value={a.id} 
                            disabled={estaOcupado}
                          >
                            {a.codigo} — Cap: {a.capacidad} {estaOcupado ? "❌ (OCUPADO EN ESTE HORARIO)" : "✅ (DISPONIBLE)"}
                          </option>
                        );
                      })
                    : laboratorios.map((l) => {
                        const estaOcupado = ambientesOcupados.includes(Number(l.id));
                        return (
                          <option 
                            key={l.id} 
                            value={l.id} 
                            disabled={estaOcupado}
                          >
                            {l.codigo} — Cap: {l.capacidad} {estaOcupado ? "❌ (OCUPADO EN ESTE HORARIO)" : "✅ (DISPONIBLE)"}
                          </option>
                        );
                      })}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button 
                  onClick={() => {
                    setModalOpen(false);
                    setAsignacionEdicion(null);
                  }} 
                  className="btn-ghost"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={guardando || !docenteSeleccionado || isTipoYaAsignado(cursoSeleccionado.id, tipoAsignacion)}
                  className="btn-primary flex items-center gap-2"
                >
                  {guardando ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {asignacionEdicion ? "Actualizar Asignación" : "Guardar Asignación"}
                    </>
                  )}
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