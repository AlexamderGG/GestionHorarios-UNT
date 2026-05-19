import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../services/api";
import {
  Calendar,
  RefreshCw,
  Zap,
  Filter,
  Users,
  LayoutGrid,
  User,
  MapPin,
  Pencil,
  Trash2,
  Inbox,
  X,
  Save,
  BookOpen,
  Clock,
  GraduationCap,
} from "lucide-react";

const DIAS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];

const timeToMinutes = (t) => {
  const [h, m] = String(t).slice(0, 5).split(":").map(Number);
  return h * 60 + m;
};

// Genera un color unico y consistente para cada curso basado en su codigo
const getColorCurso = (codigo) => {
  let hash = 0;
  for (let i = 0; i < (codigo || "").length; i++) {
    hash = codigo.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return {
    bg: `hsla(${hue}, 75%, 92%, 0.85)`,
    border: `hsla(${hue}, 70%, 35%, 1)`,
    text: `hsla(${hue}, 80%, 22%, 1)`,
    sub: `hsla(${hue}, 60%, 35%, 1)`,
  };
};

const AdminHorarios = () => {
  const [horarios, setHorarios] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [config, setConfig] = useState(null);
  const [filtroDocente, setFiltroDocente] = useState("");
  const [semestre, setSemestre] = useState("2026-1");
  const [cicloActivo, setCicloActivo] = useState("");
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [limpiando, setLimpiando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    api
      .get("/configuracion")
      .then((res) => {
        if (res.data?.data?.semestre_activo) {
          setSemestre(res.data.data.semestre_activo);
        }
      })
      .catch((err) => console.error("Error cargando configuración:", err));
  }, []);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [resHor, resDoc, resConf, resCur, resAsig] = await Promise.all([
        api.get("/horarios", { params: { semestre, docente_id: filtroDocente || undefined } }),
        api.get("/docentes"),
        api.get("/configuracion"),
        api.get("/cursos"),
        api.get("/asignaciones"),
      ]);
      setHorarios(resHor.data?.data || []);
      setDocentes(resDoc.data?.data || []);
      setConfig(resConf.data?.data || null);
      setCursos(resCur.data?.data || []);
      setAsignaciones(resAsig.data?.data || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }, [semestre, filtroDocente]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Determinar ciclos activos según semestre
  const getCiclosActivos = useMemo(() => {
    if (!semestre) return [];
    const part = semestre.split("-");
    if (part.length !== 2) return [];
    const num = parseInt(part[1], 10);
    if (num === 1) return [1, 3, 5, 7, 9];
    if (num === 2) return [2, 4, 6, 8, 10];
    return [];
  }, [semestre]);

  // Seleccionar primer ciclo activo si no hay uno seleccionado
  useEffect(() => {
    if (getCiclosActivos.length > 0 && !cicloActivo) {
      setCicloActivo(String(getCiclosActivos[0]));
    }
  }, [getCiclosActivos, cicloActivo]);

  const handleGenerar = async () => {
    setGenerando(true);
    setMensaje(null);
    try {
      const res = await api.post("/horarios/generar", { semestre, forzar: true });
      if (res.data?.success) {
        setMensaje({ tipo: "exito", texto: `${res.data.data?.generados || 0} horarios generados` });
        cargarDatos();
      }
    } catch (err) {
      setMensaje({ tipo: "error", texto: err.response?.data?.message || "Error al generar" });
    } finally {
      setGenerando(false);
    }
  };

  const handleLimpiar = async () => {
    if (!confirm(`¿Eliminar TODOS los horarios del semestre ${semestre}?`)) return;
    setLimpiando(true);
    setMensaje(null);
    try {
      const res = await api.post("/horarios/limpiar", { semestre });
      if (res.data?.success) {
        setMensaje({ tipo: "exito", texto: `${res.data.data?.eliminados || 0} horarios eliminados` });
        cargarDatos();
      }
    } catch (err) {
      setMensaje({ tipo: "error", texto: err.response?.data?.message || "Error al limpiar" });
    } finally {
      setLimpiando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar este horario?")) return;
    try {
      await api.delete(`/horarios/${id}`);
      cargarDatos();
    } catch (err) {
      alert(err.response?.data?.message || "Error al eliminar");
    }
  };

  const abrirEdicion = (h) => {
    setEditando(h);
    setEditForm({
      dia: h.dia,
      hora_inicio: h.hora_inicio?.slice(0, 5),
      hora_fin: h.hora_fin?.slice(0, 5),
      aula_id: h.aula?.id || "",
      laboratorio_id: h.laboratorio?.id || "",
    });
  };

  const handleGuardarEdicion = async () => {
    try {
      await api.put(`/horarios/${editando.id}`, editForm);
      setEditando(null);
      cargarDatos();
    } catch (err) {
      alert(err.response?.data?.message || "Error al guardar");
    }
  };

  // Generar bloques de 1 hora para visualización
  const generarBloques = () => {
    if (!config) return [];
    const inicio = config.hora_inicio || "07:00";
    const fin = config.hora_fin || "22:00";
    const duracion = 60; // Siempre 1 hora para visualización
    const [hIni, mIni] = inicio.split(":").map(Number);
    const [hFin] = fin.split(":").map(Number);
    const bloques = [];
    for (let i = hIni * 60 + mIni; i + duracion <= hFin * 60; i += duracion) {
      const h1 = String(Math.floor(i / 60)).padStart(2, "0");
      const m1 = String(i % 60).padStart(2, "0");
      const h2 = String(Math.floor((i + duracion) / 60)).padStart(2, "0");
      const m2 = String((i + duracion) % 60).padStart(2, "0");
      bloques.push({ inicio: `${h1}:${m1}`, fin: `${h2}:${m2}`, label: `${h1}:${m1} - ${h2}:${m2}` });
    }
    return bloques;
  };

  const bloques = generarBloques();

  // Filtrar horarios por ciclo
  const horariosPorCiclo = useMemo(() => {
    const map = {};
    for (const h of horarios) {
      const cicloCurso = h.curso?.ciclo;
      if (!cicloCurso) continue;
      if (!map[cicloCurso]) map[cicloCurso] = [];
      map[cicloCurso].push(h);
    }
    return map;
  }, [horarios]);

  // Función para verificar si un horario cubre un bloque
  const horarioEnBloque = (dia, bloqueInicio, bloqueFin, horariosDelCiclo) => {
    const bloqueIniMin = timeToMinutes(bloqueInicio);
    const bloqueFinMin = timeToMinutes(bloqueFin);
    return horariosDelCiclo.find((h) => {
      if (h.dia !== dia) return false;
      const hIniMin = timeToMinutes(h.hora_inicio);
      const hFinMin = timeToMinutes(h.hora_fin);
      return hIniMin <= bloqueIniMin && hFinMin >= bloqueFinMin;
    });
  };

  // Obtener cursos del docente seleccionado
  const cursosDelDocente = useMemo(() => {
    if (!filtroDocente) return [];
    return asignaciones.filter((a) => a.docente_id === Number(filtroDocente) && a.semestre_asignacion === semestre);
  }, [asignaciones, filtroDocente, semestre]);

  const getNombreDocente = (id) => {
    const d = docentes.find((doc) => doc.id === id);
    return d ? `${d.nombres} ${d.apellidos}` : `Docente ${id}`;
  };

  const getNombreCurso = (id) => {
    const c = cursos.find((cur) => cur.id === id);
    return c ? `${c.codigo} — ${c.nombre}` : `Curso ${id}`;
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton h-7 w-48 mb-6" />
        <div className="card p-4 mb-6">
          <div className="flex gap-4">
            <div className="skeleton h-10 w-28" />
            <div className="skeleton h-10 w-56" />
            <div className="skeleton h-10 w-32" />
          </div>
        </div>
        <div className="card overflow-hidden">
          <div className="p-12">
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
            <Calendar className="w-6 h-6 text-primary-600" />
            Gestión de Horarios
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Semestre: <span className="font-semibold text-primary-700">{semestre}</span>
            {getCiclosActivos.length > 0 && (
              <span className="ml-2 text-xs text-neutral-400">(Ciclos activos: {getCiclosActivos.join(", ")})</span>
            )}
          </p>
        </div>
        {mensaje && (
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium animate-slide-down ${
              mensaje.tipo === "exito"
                ? "bg-success-50 text-success-700 border border-success-200"
                : "bg-danger-50 text-danger-700 border border-danger-200"
            }`}
          >
            {mensaje.texto}
            <button onClick={() => setMensaje(null)} className="text-neutral-400 hover:text-neutral-600">
              &times;
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Semestre</label>
            <input type="text" value={semestre} onChange={(e) => setSemestre(e.target.value)} className="input w-28" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              <Users className="w-3.5 h-3.5 inline mr-1 text-neutral-400" />
              Docente
            </label>
            <select value={filtroDocente} onChange={(e) => setFiltroDocente(e.target.value)} className="input w-56">
              <option value="">Todos</option>
              {docentes.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombres} {d.apellidos}
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleGenerar} disabled={generando} className="btn-primary flex items-center gap-2">
            {generando ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Generando...</>
            ) : (
              <><Zap className="w-4 h-4" /> Generar Horarios</>
            )}
          </button>
          <button onClick={handleLimpiar} disabled={limpiando} className="btn-secondary flex items-center gap-2 bg-danger-50 text-danger-700 border-danger-200 hover:bg-danger-100">
            {limpiando ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Limpiando...</>
            ) : (
              <><Trash2 className="w-4 h-4" /> Limpiar Todo</>
            )}
          </button>
          <button onClick={cargarDatos} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Cursos del docente seleccionado */}
        {filtroDocente && cursosDelDocente.length > 0 && (
          <div className="mt-4 p-3 bg-primary-50 rounded-lg border border-primary-200">
            <p className="text-xs font-medium text-primary-700 mb-1.5">Cursos asignados a {getNombreDocente(Number(filtroDocente))}:</p>
            <div className="flex flex-wrap gap-1.5">
              {cursosDelDocente.map((a) => (
                <span key={a.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs bg-white text-primary-700 border border-primary-200 font-medium">
                  <BookOpen className="w-3 h-3" />
                  {getNombreCurso(a.curso_id)} ({a.tipo})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs por ciclo */}
      <div className="flex gap-1 mb-4 bg-neutral-100 rounded-lg p-1 w-fit flex-wrap">
        {getCiclosActivos.map((c) => (
          <button
            key={c}
            onClick={() => setCicloActivo(String(c))}
            className={`flex items-center gap-2 px-4 py-1.5 text-sm rounded-md transition-all duration-150 ${
              cicloActivo === String(c)
                ? "bg-white text-primary-700 shadow-sm font-medium"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Ciclo {c}
          </button>
        ))}
      </div>

      {/* Grid por ciclo */}
      {cicloActivo && (
        <div className="card overflow-hidden mb-6">
          <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-primary-600" />
              Horario Ciclo {cicloActivo}
            </h2>
            <span className="text-xs text-neutral-500">
              {(horariosPorCiclo[cicloActivo] || []).length} clase{(horariosPorCiclo[cicloActivo] || []).length !== 1 ? "s" : ""}
            </span>
          </div>
          {(horariosPorCiclo[cicloActivo] || []).length === 0 ? (
            <div className="p-12 text-center text-neutral-400">
              <Inbox className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
              <p className="text-sm">No hay horarios para el ciclo {cicloActivo}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-neutral-50">
                    <th className="border-b border-r border-neutral-200 p-3 text-left text-xs font-semibold text-neutral-500 uppercase w-28 sticky left-0 bg-neutral-50 z-10">
                      Bloque
                    </th>
                    {DIAS.map((dia) => (
                      <th
                        key={dia}
                        className="border-b border-r border-neutral-200 p-3 text-center text-xs font-semibold text-neutral-500 uppercase min-w-[160px] last:border-r-0"
                      >
                        {dia}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bloques.map((bloque, idx) => (
                    <tr key={bloque.label} className={idx % 2 === 0 ? "bg-white" : "bg-neutral-50/30"}>
                      <td className="border-b border-r border-neutral-200 p-2 text-neutral-600 text-xs font-medium sticky left-0 bg-inherit z-10 whitespace-nowrap">
                        {bloque.label}
                      </td>
                      {DIAS.map((dia) => {
                        const h = horarioEnBloque(dia, bloque.inicio, bloque.fin, horariosPorCiclo[cicloActivo] || []);
                        return (
                          <td
                            key={`${dia}-${bloque.label}`}
                            className="border-b border-r border-neutral-200 p-1 align-top last:border-r-0"
                          >
                            {h ? (
                              (() => {
                                const color = getColorCurso(h.curso?.codigo);
                                return (
                                  <div
                                    className="rounded-lg p-2 border-l-[3px] cursor-pointer hover:shadow-sm transition-all group"
                                    style={{
                                      backgroundColor: color.bg,
                                      borderLeftColor: color.border,
                                    }}
                                    onClick={() => abrirEdicion(h)}
                                  >
                                    <p className="text-xs font-semibold truncate" style={{ color: color.text }}>{h.curso?.codigo}</p>
                                    <p className="text-xs truncate" style={{ color: color.sub }}>{h.curso?.nombre}</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <Clock className="w-3 h-3 flex-shrink-0" style={{ color: color.sub }} />
                                      <span className="text-2xs" style={{ color: color.sub }}>
                                        {h.hora_inicio?.slice(0, 5)} - {h.hora_fin?.slice(0, 5)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <User className="w-3 h-3 flex-shrink-0" style={{ color: color.sub }} />
                                      <span className="text-2xs truncate" style={{ color: color.sub }}>
                                        {h.docente?.nombres} {h.docente?.apellidos}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: color.sub }} />
                                      <span className="text-2xs" style={{ color: color.sub }}>
                                        {h.aula?.codigo || h.laboratorio?.codigo}
                                      </span>
                                    </div>
                                    <div className="flex gap-1 mt-1">
                                      {h.editado_manualmente && (
                                        <span className="badge-warning text-2xs">
                                          <Pencil className="w-2.5 h-2.5" />
                                          Editado
                                        </span>
                                      )}
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleEliminar(h.id); }}
                                        className="text-danger-400 hover:text-danger-600 text-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        Eliminar
                                      </button>
                                    </div>
                                  </div>
                                );
                              })()
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in" onClick={() => setEditando(null)}>
          <div className="card p-6 w-full max-w-md shadow-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-primary-600" />
                Editar Horario
              </h2>
              <button onClick={() => setEditando(null)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Día</label>
                <select value={editForm.dia} onChange={(e) => setEditForm({ ...editForm, dia: e.target.value })} className="input">
                  {DIAS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Hora inicio</label>
                  <input type="time" value={editForm.hora_inicio} onChange={(e) => setEditForm({ ...editForm, hora_inicio: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Hora fin</label>
                  <input type="time" value={editForm.hora_fin} onChange={(e) => setEditForm({ ...editForm, hora_fin: e.target.value })} className="input" />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setEditando(null)} className="btn-ghost">Cancelar</button>
                <button onClick={handleGuardarEdicion} className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHorarios;
