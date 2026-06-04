import React, { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  X,
  Save,
  GraduationCap,
  AlertCircle,
} from "lucide-react";

const CATEGORIAS = ["Principal", "Asociado", "Auxiliar", "Jefe de practica"];
const TIPOS_NOMBRAMIENTO = ["Nombrado", "Contratado"];
const MODALIDADES = ["Tiempo Completo", "Tiempo Parcial"]; // <-- NUEVO
const ESPECIALIDADES = [
  "Ingenieria de Sistemas", "Matematicas", "Fisica", "Comunicacion",
  "Psicologia", "Filosofia", "Ciencias Sociales", "Administracion",
  "Musica", "Danza Folklorica", "Educacion Fisica", "Derecho", "Ingenieria Ambiental"
];
const ESCUELAS = [
  "Ingenieria de Sistemas", "Escuela de Matematicas", "Escuela de Fisica",
  "Escuela de Comunicacion", "Escuela de Psicologia", "Escuela de Filosofia",
  "Escuela de Ciencias Sociales", "Escuela de Administracion", "Escuela de Artes",
  "Escuela de Educacion Fisica", "Escuela de Derecho", "Escuela de Ingenieria Ambiental"
];

const AdminDocentes = () => {
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const [search, setSearch] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroEspecialidad, setFiltroEspecialidad] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({
    dni: "", // <-- NUEVO
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "",
    categoria: "Auxiliar",
    tipo_nombramiento: "Nombrado",
    modalidad: "Tiempo Completo", // <-- NUEVO
    especialidad: "",
    escuela: "Ingenieria de Sistemas",
    semestre_contrato: "",
    antiguedad_anios: 0,
  });
  const [guardando, setGuardando] = useState(false);

  const cargarDocentes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/docentes");
      setDocentes(res.data?.data || []);
    } catch (err) {
      console.error("Error cargando docentes:", err);
      setMensaje({ tipo: "error", texto: "Error al cargar docentes" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDocentes();
  }, [cargarDocentes]);

  const especialidades = [...new Set(docentes.map((d) => d.especialidad).filter(Boolean))].sort();

  const docentesFiltrados = docentes.filter((d) => {
    const matchSearch =
      !search ||
      `${d.nombres} ${d.apellidos}`.toLowerCase().includes(search.toLowerCase()) ||
      (d.email && d.email.toLowerCase().includes(search.toLowerCase())) ||
      (d.dni && d.dni.includes(search)); // También busca por DNI
    const matchCat = !filtroCategoria || d.categoria === filtroCategoria;
    const matchTipo = !filtroTipo || d.tipo_nombramiento === filtroTipo;
    const matchEsp = !filtroEspecialidad || d.especialidad === filtroEspecialidad;
    return matchSearch && matchCat && matchTipo && matchEsp;
  });

  const abrirCrear = () => {
    setEditando(null);
    setForm({
      dni: "", // <-- NUEVO
      nombres: "",
      apellidos: "",
      email: "",
      telefono: "",
      categoria: "Auxiliar",
      tipo_nombramiento: "Nombrado",
      modalidad: "Tiempo Completo", // <-- NUEVO
      especialidad: "",
      escuela: "Ingenieria de Sistemas",
      semestre_contrato: "",
      antiguedad_anios: 0,
    });
    setMensaje(null);
    setModalOpen(true);
  };

  const abrirEditar = (docente) => {
    setEditando(docente);
    setForm({
      dni: docente.dni || "", // <-- NUEVO
      nombres: docente.nombres || "",
      apellidos: docente.apellidos || "",
      email: docente.email || "",
      telefono: docente.telefono || "",
      categoria: docente.categoria || "Auxiliar",
      tipo_nombramiento: docente.tipo_nombramiento || "Nombrado",
      modalidad: docente.modalidad || "Tiempo Completo", // <-- NUEVO
      especialidad: docente.especialidad || "",
      escuela: docente.escuela || "Ingenieria de Sistemas",
      semestre_contrato: docente.semestre_contrato || "",
      antiguedad_anios: docente.antiguedad_anios ?? 0,
    });
    setMensaje(null);
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "antiguedad_anios" ? Number(value) : value,
    }));
  };

  const handleGuardar = async () => {
    setGuardando(true);
    setMensaje(null);
    try {
      const payload = {
        ...form,
        antiguedad_anios: Number(form.antiguedad_anios),
      };
      if (editando) {
        const res = await api.put(`/docentes/${editando.id}`, payload);
        if (res.data?.success) {
          setMensaje({ tipo: "exito", texto: "Docente actualizado correctamente" });
        } else {
          setMensaje({ tipo: "error", texto: res.data?.message || "Error al actualizar" });
        }
      } else {
        const res = await api.post("/docentes", payload);
        if (res.data?.success) {
          setMensaje({ tipo: "exito", texto: "Docente creado correctamente" });
        } else {
          setMensaje({ tipo: "error", texto: res.data?.message || "Error al crear" });
        }
      }
      setModalOpen(false);
      cargarDocentes();
    } catch (err) {
      setMensaje({
        tipo: "error",
        texto: err.response?.data?.message || "Error de conexión",
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar este docente? Se realizará una eliminación lógica.")) return;
    try {
      await api.delete(`/docentes/${id}`);
      cargarDocentes();
    } catch (err) {
      setMensaje({
        tipo: "error",
        texto: err.response?.data?.message || "Error al eliminar",
      });
    }
  };

  const badgeColor = (tipo) => {
    if (tipo === "Nombrado") return "bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-400 border-success-200 dark:border-success-800/50";
    return "bg-warning-50 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400 border-warning-200 dark:border-warning-800/50";
  };

  const catColor = (cat) => {
    switch (cat) {
      case "Principal": return "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border-primary-200 dark:border-primary-800/50";
      case "Asociado": return "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50";
      case "Auxiliar": return "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700";
      default: return "bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700";
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton h-7 w-64 mb-6 dark:opacity-20" />
        <div className="card p-4 mb-6 dark:bg-neutral-800 dark:border-neutral-700">
          <div className="flex flex-wrap gap-4">
            <div className="skeleton h-10 w-40 dark:opacity-20" />
            <div className="skeleton h-10 w-56 dark:opacity-20" />
            <div className="skeleton h-10 w-32 dark:opacity-20" />
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
            Gestión de Docentes
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {docentes.length} docentes registrados en el sistema
          </p>
        </div>
        <div className="flex items-center gap-3">
          {mensaje && (
            <div
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium animate-slide-down ${
                mensaje.tipo === "exito"
                  ? "bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-400 border border-success-200 dark:border-success-800/50"
                  : "bg-danger-50 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400 border border-danger-200 dark:border-danger-800/50"
              }`}
            >
              {mensaje.tipo === "exito" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {mensaje.texto}
              <button onClick={() => setMensaje(null)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <button onClick={abrirCrear} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Docente
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4 mb-6 dark:bg-neutral-800 dark:border-neutral-700">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              <Search className="w-3.5 h-3.5 inline mr-1 text-neutral-400 dark:text-neutral-500" />
              Buscar
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full dark:bg-neutral-900 dark:border-neutral-700 dark:text-white"
              placeholder="Nombre, email o DNI..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              <Filter className="w-3.5 h-3.5 inline mr-1 text-neutral-400 dark:text-neutral-500" />
              Categoría
            </label>
            <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="input w-40 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white">
              <option value="">Todas</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Tipo</label>
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="input w-36 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white">
              <option value="">Todos</option>
              {TIPOS_NOMBRAMIENTO.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Especialidad</label>
            <select value={filtroEspecialidad} onChange={(e) => setFiltroEspecialidad(e.target.value)} className="input w-48 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white">
              <option value="">Todas</option>
              {especialidades.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
          <button onClick={cargarDocentes} className="btn-secondary flex items-center gap-2 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden dark:bg-neutral-800 dark:border-neutral-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-700">
                <th className="text-left p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Docente</th>
                <th className="text-left p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Contacto</th>
                <th className="text-left p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Categoría</th>
                <th className="text-left p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Contrato / Modalidad</th>
                <th className="text-left p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Especialidad</th>
                <th className="text-left p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Escuela</th>
                <th className="text-center p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase w-20">Antig.</th>
                <th className="text-center p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase w-28">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {docentesFiltrados.map((d) => (
                <tr key={d.id} className="border-b border-neutral-100 dark:border-neutral-700/50 hover:bg-neutral-50/50 dark:hover:bg-neutral-700/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-800 dark:text-neutral-200">{d.nombres} {d.apellidos}</p>
                        {d.semestre_contrato && (
                          <p className="text-2xs text-warning-600 dark:text-warning-400">Contrato: {d.semestre_contrato}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <p className="text-neutral-500 dark:text-neutral-400 text-xs font-mono">{d.email}</p>
                    <p className="text-2xs text-neutral-400 mt-0.5"><span className="font-semibold">DNI:</span> {d.dni || "Sin registrar"}</p>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-medium border ${catColor(d.categoria)}`}>
                      {d.categoria}
                    </span>
                  </td>
                  <td className="p-3 space-y-1">
                    <span className={`flex w-fit items-center px-2 py-0.5 rounded text-2xs font-medium border ${badgeColor(d.tipo_nombramiento)}`}>
                      {d.tipo_nombramiento}
                    </span>
                    <span className="flex w-fit items-center px-2 py-0.5 rounded text-2xs font-medium border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50">
                      {d.modalidad || "Tiempo Completo"}
                    </span>
                  </td>
                  <td className="p-3 text-neutral-600 dark:text-neutral-400 text-xs">{d.especialidad || "—"}</td>
                  <td className="p-3 text-neutral-600 dark:text-neutral-400 text-xs">{d.escuela}</td>
                  <td className="p-3 text-center text-neutral-700 dark:text-neutral-300 text-xs">{d.antiguedad_anios}a</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => abrirEditar(d)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEliminar(d.id)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/30 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {docentesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-neutral-400 dark:text-neutral-500">
                    <Users className="w-8 h-8 mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
                    No se encontraron docentes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 animate-fade-in" onClick={() => setModalOpen(false)}>
          <div className="card p-6 w-full max-w-2xl shadow-modal animate-scale-in max-h-[90vh] overflow-y-auto dark:bg-neutral-800 dark:border-neutral-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                {editando ? "Editar Docente" : "Nuevo Docente"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {mensaje && modalOpen && (
              <div className={`mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border ${mensaje.tipo === "exito" ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/30 dark:text-success-400 dark:border-success-800/50" : "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/30 dark:text-danger-400 dark:border-danger-800/50"}`}>
                {mensaje.tipo === "exito" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {mensaje.texto}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">DNI *</label>
                  <input type="text" name="dni" maxLength="8" value={form.dni} onChange={handleChange} className="input w-full dark:bg-neutral-900 dark:border-neutral-700 dark:text-white" required placeholder="Ej. 12345678" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Email *</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} className="input w-full dark:bg-neutral-900 dark:border-neutral-700 dark:text-white" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Nombres *</label>
                  <input type="text" name="nombres" value={form.nombres} onChange={handleChange} className="input w-full dark:bg-neutral-900 dark:border-neutral-700 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Apellidos *</label>
                  <input type="text" name="apellidos" value={form.apellidos} onChange={handleChange} className="input w-full dark:bg-neutral-900 dark:border-neutral-700 dark:text-white" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Teléfono</label>
                  <input type="text" name="telefono" value={form.telefono} onChange={handleChange} className="input w-full dark:bg-neutral-900 dark:border-neutral-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Modalidad *</label>
                  <select name="modalidad" value={form.modalidad} onChange={handleChange} className="input w-full dark:bg-neutral-900 dark:border-neutral-700 dark:text-white">
                    {MODALIDADES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Categoría *</label>
                  <select name="categoria" value={form.categoria} onChange={handleChange} className="input w-full dark:bg-neutral-900 dark:border-neutral-700 dark:text-white">
                    {CATEGORIAS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Tipo *</label>
                  <select name="tipo_nombramiento" value={form.tipo_nombramiento} onChange={handleChange} className="input w-full dark:bg-neutral-900 dark:border-neutral-700 dark:text-white">
                    {TIPOS_NOMBRAMIENTO.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Especialidad *</label>
                  <select name="especialidad" value={form.especialidad} onChange={handleChange} className="input w-full dark:bg-neutral-900 dark:border-neutral-700 dark:text-white" required>
                    <option value="">Seleccionar...</option>
                    {ESPECIALIDADES.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Escuela *</label>
                  <select name="escuela" value={form.escuela} onChange={handleChange} className="input w-full dark:bg-neutral-900 dark:border-neutral-700 dark:text-white" required>
                    <option value="">Seleccionar...</option>
                    {ESCUELAS.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Antigüedad (años)</label>
                  <input type="number" name="antiguedad_anios" value={form.antiguedad_anios} onChange={handleChange} className="input w-full dark:bg-neutral-900 dark:border-neutral-700 dark:text-white" min={0} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Semestre contrato</label>
                  <input type="text" name="semestre_contrato" value={form.semestre_contrato} onChange={handleChange} className="input w-full dark:bg-neutral-900 dark:border-neutral-700 dark:text-white" placeholder="2026-1 (opcional)" />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setModalOpen(false)} className="btn-ghost dark:text-neutral-300 dark:hover:bg-neutral-700">Cancelar</button>
                <button onClick={handleGuardar} disabled={guardando} className="btn-primary flex items-center gap-2">
                  {guardando ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Guardando...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Guardar</>
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

export default AdminDocentes;