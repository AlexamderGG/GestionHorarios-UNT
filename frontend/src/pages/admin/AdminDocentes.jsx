import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  FileDown,
  Loader2,
  Layers,
  CalendarDays // Ícono para el horario
} from "lucide-react";
import { generarFormatoN1, generarFormatoN2Central, generarFormatoN2Valles } from "../../utils/formatosPDF";
import { generarPDF_F03 } from "../../utils/reportHorarioDocente"; // 🚀 Asegúrate de que esta ruta sea correcta

const CATEGORIAS = ["Principal", "Asociado", "Auxiliar", "Jefe de practica"];
const TIPOS_NOMBRAMIENTO = ["Nombrado", "Contratado"];
const MODALIDADES = ["Tiempo Completo", "Tiempo Parcial"];

const ESCUELAS_BASE = [
  "Ingenieria de Sistemas", "Escuela de Matemáticas", "Escuela de Fisica",
  "Escuela de Lengua y Literatura", "Escuela de CC. Psicologicas", "Escuela de Filosofia",
  "Escuela de Ciencias de la Educación", "Escuela de Administracion", "Escuela de Artes",
  "Escuela de Estudios Generales", "Escuela de Derecho", "Escuela de Ingenieria Ambiental", "Escuela de Ingeniería Industrial", 
  "Contabilidad y Finanzas", "Escuela de Ciencias Sociales", "Escuela de Economía"
];

const AdminDocentes = () => {
  const [docentes, setDocentes] = useState([]);
  const [cursos, setCursos] = useState([]); 
  const [configuracion, setConfiguracion] = useState(null); // 🚀 ESTADO PARA GUARDAR LA CONFIG (Horas inicio/fin)
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const [search, setSearch] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroDepartamento, setFiltroDepartamento] = useState("");
  const [semestreActivo, setSemestreActivo] = useState("2026-1");
  const [descargandoId, setDescargandoId] = useState(null);
  const [dropdownAbierto, setDropdownAbierto] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  
  const [form, setForm] = useState({
    dni: "", 
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "",
    categoria: "Auxiliar",
    tipo_nombramiento: "Nombrado",
    modalidad: "Tiempo Completo", 
    especialidad: "", 
    escuela: "Ingenieria de Sistemas",
    semestre_contrato: "",
    antiguedad_anios: 0,
  });
  const [guardando, setGuardando] = useState(false);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [resDocentes, resConfig, resCursos] = await Promise.all([
        api.get("/docentes"),
        api.get("/configuracion"),
        api.get("/cursos").catch(() => ({ data: { data: [] } }))
      ]);
      setDocentes(resDocentes.data?.data || []);
      setCursos(resCursos.data?.data || []);
      
      const configData = resConfig.data?.data;
      if (configData) {
        setConfiguracion(configData); // 🚀 Guardamos la configuración entera
        if (configData.semestre_activo) setSemestreActivo(configData.semestre_activo);
      }
    } catch (err) {
      console.error("Error cargando datos:", err);
      setMensaje({ tipo: "error", texto: "Error al cargar los datos del servidor" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    if (dropdownAbierto === null) return;
    const handler = () => setDropdownAbierto(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [dropdownAbierto]);

  const departamentosDisponibles = useMemo(() => {
    return [...new Set(cursos.map((c) => c.especialidad).filter(Boolean))].sort();
  }, [cursos]);

  const escuelasSugeridas = useMemo(() => {
    const escuelasDb = docentes.map(d => d.escuela).filter(Boolean);
    return [...new Set([...ESCUELAS_BASE, ...escuelasDb])].sort();
  }, [docentes]);

  // 🚀 LÓGICA DE DESCARGA ACTUALIZADA
  const descargarFormato = async (docente, tipo) => {
    setDescargandoId(docente.id);
    setDropdownAbierto(null);
    
    try {
      // 🚀 SI PIDEN EL FORMATO F03 (EL HORARIO COMPLETO)
      if (tipo === 'f03') {
        const [resLectiva, resNoLectiva] = await Promise.all([
          api.get(`/docente/${docente.id}/horario-lectivo`, { params: { semestre: semestreActivo } }).catch(() => ({ data: { data: [] } })),
          api.get(`/docente/${docente.id}/horario-no-lectivo`, { params: { semestre: semestreActivo } }).catch(() => ({ data: { data: [] } }))
        ]);
        
        const lectivos = resLectiva.data?.data || [];
        const noLectivos = resNoLectiva.data?.data || [];
        
        generarPDF_F03(docente, lectivos, noLectivos, configuracion, semestreActivo);
        return;
      }

      // Si piden los otros formatos de carga horaria...
      const res = await api.get(`/carga/docente/${docente.id}`, { params: { semestre: semestreActivo } });
      const data = res.data?.data || {};
      const cargaNoLectiva = data.cargaNoLectiva || {};
      const datos = {
        docenteNombre: data.docenteNombre || `${docente.nombres} ${docente.apellidos}`,
        docenteDni: data.docenteDni || docente.dni || '',
        modalidad: data.modalidad || docente.modalidad || 'Tiempo Completo',
        tipo_nombramiento: data.tipo_nombramiento || docente.tipo_nombramiento || '',
        categoria: data.categoria || docente.categoria || '',
        escuela: data.escuela || docente.escuela || '',
        semestre: semestreActivo,
        horasLectivas: data.horasLectivas || 0,
        cursos: data.cursos || [],
        form: {
          preparacion_clases: cargaNoLectiva.preparacion_clases || 0,
          preparacion_clases_detalle: cargaNoLectiva.preparacion_clases_detalle || '',
          tutoria_consejeria: cargaNoLectiva.tutoria_consejeria || 0,
          tutoria_consejeria_detalle: cargaNoLectiva.tutoria_consejeria_detalle || '',
          asesoria_tesis: cargaNoLectiva.asesoria_tesis || 0,
          asesoria_tesis_detalle: cargaNoLectiva.asesoria_tesis_detalle || '',
          investigacion: cargaNoLectiva.investigacion || 0,
          investigacion_detalle: cargaNoLectiva.investigacion_detalle || '',
          responsabilidad_social: cargaNoLectiva.responsabilidad_social || 0,
          responsabilidad_social_detalle: cargaNoLectiva.responsabilidad_social_detalle || '',
          produccion_intelectual: cargaNoLectiva.produccion_intelectual || 0,
          produccion_intelectual_detalle: cargaNoLectiva.produccion_intelectual_detalle || '',
          gestion_admin: cargaNoLectiva.gestion_admin || 0,
          gestion_admin_detalle: cargaNoLectiva.gestion_admin_detalle || '',
          capacitacion: cargaNoLectiva.capacitacion || 0,
          capacitacion_detalle: cargaNoLectiva.capacitacion_detalle || '',
          otras_actividades: cargaNoLectiva.otras_actividades || 0,
          otras_actividades_detalle: cargaNoLectiva.otras_actividades_detalle || '',
        }
      };
      
      if (tipo === 'n1') generarFormatoN1(datos);
      else if (tipo === 'n2central') generarFormatoN2Central(datos);
      else if (tipo === 'n2valles') generarFormatoN2Valles(datos);

    } catch (err) {
      setMensaje({ tipo: "error", texto: "Error al obtener datos del docente para generar el formato." });
      console.error(err);
    } finally {
      setDescargandoId(null);
    }
  };

  const docentesFiltrados = docentes.filter((d) => {
    const matchSearch =
      !search ||
      `${d.nombres} ${d.apellidos}`.toLowerCase().includes(search.toLowerCase()) ||
      (d.email && d.email.toLowerCase().includes(search.toLowerCase())) ||
      (d.dni && d.dni.includes(search));
    const matchCat = !filtroCategoria || d.categoria === filtroCategoria;
    const matchTipo = !filtroTipo || d.tipo_nombramiento === filtroTipo;
    const matchDep = !filtroDepartamento || d.especialidad === filtroDepartamento;
    return matchSearch && matchCat && matchTipo && matchDep;
  });

  const abrirCrear = () => {
    setEditando(null);
    setForm({
      dni: "", 
      nombres: "",
      apellidos: "",
      email: "",
      telefono: "",
      categoria: "Auxiliar",
      tipo_nombramiento: "Nombrado",
      modalidad: "Tiempo Completo", 
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
      dni: docente.dni || "", 
      nombres: docente.nombres || "",
      apellidos: docente.apellidos || "",
      email: docente.email || "",
      telefono: docente.telefono || "",
      categoria: docente.categoria || "Auxiliar",
      tipo_nombramiento: docente.tipo_nombramiento || "Nombrado",
      modalidad: docente.modalidad || "Tiempo Completo", 
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
      cargarDatos(); 
    } catch (err) {
      setMensaje({
        tipo: "error",
        texto: err.response?.data?.message || "Error al guardar el docente",
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar este docente? Se realizará una eliminación lógica.")) return;
    try {
      await api.delete(`/docentes/${id}`);
      cargarDatos(); 
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
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Departamento</label>
            <select value={filtroDepartamento} onChange={(e) => setFiltroDepartamento(e.target.value)} className="input w-52 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white">
              <option value="">Todos los Departamentos</option>
              {departamentosDisponibles.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <button onClick={cargarDatos} className="btn-secondary flex items-center gap-2 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700">
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
                <th className="text-left p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Departamento</th>
                <th className="text-left p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Escuela</th>
                <th className="text-center p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase w-20">Antig.</th>
                <th className="text-center p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase w-36">Acciones</th>
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
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setDropdownAbierto(dropdownAbierto === d.id ? null : d.id)}
                          disabled={descargandoId === d.id}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors disabled:opacity-50"
                          title="Descargar formatos"
                        >
                          {descargandoId === d.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <FileDown className="w-4 h-4" />}
                        </button>
                        {dropdownAbierto === d.id && (
                          <div className="absolute right-0 top-8 z-50 w-56 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-1 animate-fade-in">
                            <p className="px-3 py-1.5 text-2xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Formatos Oficiales</p>
                            
                            {/* 🚀 NUEVO BOTÓN PARA FORMATO F03 */}
                            <button
                              onClick={() => descargarFormato(d, 'f03')}
                              className="w-full text-left px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2"
                            >
                              <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
                              Formato F03 — Horario Docente
                            </button>
                            
                            <div className="border-t border-neutral-100 dark:border-neutral-700 my-1"></div>

                            <button
                              onClick={() => descargarFormato(d, 'n1')}
                              className="w-full text-left px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2"
                            >
                              <FileDown className="w-3.5 h-3.5 text-primary-500" />
                              Formato N°1 — Carga Horaria
                            </button>
                            <button
                              onClick={() => descargarFormato(d, 'n2central')}
                              className="w-full text-left px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2"
                            >
                              <FileDown className="w-3.5 h-3.5 text-amber-500" />
                              Formato N°2 — Sede Central
                            </button>
                            <button
                              onClick={() => descargarFormato(d, 'n2valles')}
                              className="w-full text-left px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2"
                            >
                              <FileDown className="w-3.5 h-3.5 text-green-500" />
                              Formato N°2 — Sedes Valles
                            </button>
                          </div>
                        )}
                      </div>
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

      {/* Modal CRUD */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 animate-fade-in" onClick={() => setModalOpen(false)}>
          <div className="card p-6 w-full max-w-2xl shadow-modal animate-scale-in max-h-[90vh] overflow-y-auto dark:bg-neutral-800 dark:border-neutral-700" onClick={(e) => e.stopPropagation()}>
            
            <datalist id="escuelas-sugeridas-list">
              {escuelasSugeridas.map((e) => <option key={e} value={e} />)}
            </datalist>

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
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Departamento *</label>
                  <select name="especialidad" value={form.especialidad} onChange={handleChange} className="input w-full dark:bg-neutral-900 dark:border-neutral-700 dark:text-white" required>
                    <option value="">Seleccionar departamento...</option>
                    {departamentosDisponibles.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Escuela *</label>
                  <input 
                    list="escuelas-sugeridas-list" 
                    name="escuela" 
                    value={form.escuela} 
                    onChange={handleChange} 
                    placeholder="Elegir o escribir escuela..." 
                    className="input w-full dark:bg-neutral-900 dark:border-neutral-700 dark:text-white" 
                    required 
                  />
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