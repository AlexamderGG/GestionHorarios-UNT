import React, { useState, useEffect } from "react";
import api from "../services/api";
import {
  FileText,
  FileDown,
  Users,
  Building2,
  Calendar,
  Eye,
  Download,
  Printer,
  BarChart3,
  Search,
  Filter,
  ChevronDown,
  Loader2,
} from "lucide-react";
import {
  generarPDFPorDocente,
  generarPDFPorDia,
  generarPDFPorAula,
  generarPDFOperacional,
  generarPDFGestion,
} from "../utils/reportPDF";
import {
  exportarExcelPorDocente,
  exportarExcelPorDia,
  exportarExcelPorAula,
  exportarExcelOperacional,
  exportarExcelGestion,
} from "../utils/reportExcel";

const DIAS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

const Reportes = () => {
  const [tipoReporte, setTipoReporte] = useState("por-docente");
  const [semestre, setSemestre] = useState("2026-1");

  // Filtros especificos
  const [docenteId, setDocenteId] = useState("");
  const [dia, setDia] = useState("Lunes");
  const [aulaId, setAulaId] = useState("");
  const [labId, setLabId] = useState("");

  // Listas para selects
  const [docentes, setDocentes] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [laboratorios, setLaboratorios] = useState([]);

  // Datos y estados
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loadingLists, setLoadingLists] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoadingLists(true);
      try {
        const [resConfig, resDoc, resAulas, resLabs] = await Promise.all([
          api.get("/configuracion").catch(() => null),
          api.get("/docentes"),
          api.get("/aulas"),
          api.get("/laboratorios"),
        ]);
        if (resConfig?.data?.data?.semestre_activo) {
          setSemestre(resConfig.data.data.semestre_activo);
        }
        if (resDoc?.data?.success) setDocentes(resDoc.data.data || []);
        if (resAulas?.data?.success) setAulas(resAulas.data.data || []);
        if (resLabs?.data?.success) setLaboratorios(resLabs.data.data || []);
      } catch (e) {
        console.error("Error cargando listas:", e);
      } finally {
        setLoadingLists(false);
      }
    };
    init();
  }, []);

  const resetData = () => setData(null);

  const handleGenerar = async () => {
    setLoading(true);
    setData(null);
    try {
      let response;
      switch (tipoReporte) {
        case "por-docente":
          if (!docenteId) {
            alert("Seleccione un docente");
            setLoading(false);
            return;
          }
          response = await api.get("/reportes/por-docente", {
            params: { docente_id: docenteId, semestre },
          });
          break;
        case "por-dia":
          response = await api.get("/reportes/por-dia", {
            params: { dia, semestre },
          });
          break;
        case "por-aula":
          if (!aulaId && !labId) {
            alert("Seleccione un aula o laboratorio");
            setLoading(false);
            return;
          }
          response = await api.get("/reportes/por-aula", {
            params: { aula_id: aulaId || undefined, laboratorio_id: labId || undefined, semestre },
          });
          break;
        case "operacional":
          response = await api.get("/reportes/operacional", { params: { semestre } });
          break;
        case "gestion":
          response = await api.get("/reportes/gestion", { params: { semestre } });
          break;
        default:
          setLoading(false);
          return;
      }
      if (response.data?.success) {
        setData(response.data.data);
      }
    } catch (err) {
      console.error("Error generando reporte:", err);
      alert(err.response?.data?.message || "Error al generar reporte");
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarPDF = async () => {
    if (!data) return;
    setDownloading(true);
    try {
      switch (tipoReporte) {
        case "por-docente":
          generarPDFPorDocente(data);
          break;
        case "por-dia":
          generarPDFPorDia(data);
          break;
        case "por-aula":
          generarPDFPorAula(data);
          break;
        case "operacional":
          generarPDFOperacional(data, semestre);
          break;
        case "gestion":
          generarPDFGestion(data, semestre);
          break;
      }
    } catch (e) {
      console.error("Error PDF:", e);
      alert("Error al generar PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handleExportarExcel = () => {
    if (!data) return;
    try {
      switch (tipoReporte) {
        case "por-docente":
          exportarExcelPorDocente(data);
          break;
        case "por-dia":
          exportarExcelPorDia(data);
          break;
        case "por-aula":
          exportarExcelPorAula(data);
          break;
        case "operacional":
          exportarExcelOperacional(data, semestre);
          break;
        case "gestion":
          exportarExcelGestion(data, semestre);
          break;
      }
    } catch (e) {
      console.error("Error Excel:", e);
      alert("Error al exportar Excel");
    }
  };

  const renderFiltros = () => {
    switch (tipoReporte) {
      case "por-docente":
        return (
          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-full md:w-72">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Docente</label>
              <select value={docenteId} onChange={(e) => { setDocenteId(e.target.value); resetData(); }} className="input">
                <option value="">-- Seleccione --</option>
                {docentes.map((d) => (
                  <option key={d.id} value={d.id}>{`${d.apellidos}, ${d.nombres}`}</option>
                ))}
              </select>
            </div>
          </div>
        );
      case "por-dia":
        return (
          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Dia</label>
              <select value={dia} onChange={(e) => { setDia(e.target.value); resetData(); }} className="input">
                {DIAS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        );
      case "por-aula":
        return (
          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-full md:w-56">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Aula</label>
              <select value={aulaId} onChange={(e) => { setAulaId(e.target.value); setLabId(""); resetData(); }} className="input">
                <option value="">-- Seleccione --</option>
                {aulas.map((a) => (
                  <option key={a.id} value={a.id}>{a.codigo} - {a.nombre}</option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-56">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Laboratorio</label>
              <select value={labId} onChange={(e) => { setLabId(e.target.value); setAulaId(""); resetData(); }} className="input">
                <option value="">-- Seleccione --</option>
                {laboratorios.map((l) => (
                  <option key={l.id} value={l.id}>{l.codigo} - {l.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderPreview = () => {
    if (!data) return null;

    switch (tipoReporte) {
      case "por-docente":
        return <PreviewPorDocente data={data} />;
      case "por-dia":
        return <PreviewPorDia data={data} />;
      case "por-aula":
        return <PreviewPorAula data={data} />;
      case "operacional":
        return <PreviewOperacional data={data} />;
      case "gestion":
        return <PreviewGestion data={data} />;
      default:
        return null;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary-600" />
            Reportes
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Generacion y exportacion de reportes en PDF y Excel</p>
        </div>
      </div>

      {/* Panel de filtros */}
      <div className="card p-5 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-full md:w-56">
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Tipo de Reporte</label>
            <div className="relative">
              <select
                value={tipoReporte}
                onChange={(e) => { setTipoReporte(e.target.value); resetData(); }}
                className="input appearance-none pr-10"
              >
                <option value="por-docente">Por Docente</option>
                <option value="por-dia">Por Dia</option>
                <option value="por-aula">Por Aula / Laboratorio</option>
                <option value="operacional">Operacional</option>
                <option value="gestion">Gestion Docente</option>
              </select>
              <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="w-full md:w-32">
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Semestre</label>
            <input type="text" value={semestre} onChange={(e) => { setSemestre(e.target.value); resetData(); }} className="input" />
          </div>

          {renderFiltros()}

          <button
            onClick={handleGenerar}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Generar Reporte
          </button>
        </div>
      </div>

      {/* Preview y acciones */}
      {data && (
        <div className="mb-4 flex flex-wrap gap-3">
          <button
            onClick={handleDescargarPDF}
            disabled={downloading}
            className="btn-primary flex items-center gap-2"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            Descargar PDF
          </button>
          <button
            onClick={handleExportarExcel}
            className="btn-secondary flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            Exportar Excel
          </button>
        </div>
      )}

      {/* Preview */}
      <div className="card overflow-hidden">
        {data ? (
          renderPreview()
        ) : (
          <div className="p-12 text-center text-neutral-400">
            <FileText className="w-10 h-10 mx-auto mb-3 text-neutral-300" />
            <p className="text-sm">Configure los filtros y haga clic en "Generar Reporte" para visualizar.</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ================= PREVIEW COMPONENTS ================= */

const PreviewPorDocente = ({ data }) => {
  const { docente, semestre, horarios, cursos, resumen } = data;
  return (
    <div className="p-6">
      <div className="border-b border-neutral-200 pb-4 mb-4">
        <h2 className="text-lg font-bold text-neutral-900">Reporte por Docente</h2>
        <p className="text-sm text-neutral-500">Semestre: {semestre}</p>
      </div>

      <div className="bg-neutral-50 rounded-lg p-4 mb-6 border border-neutral-200">
        <h3 className="text-sm font-semibold text-neutral-800 mb-2">Informacion del Docente</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div><span className="text-neutral-500">Nombre:</span> {docente.apellidos}, {docente.nombres}</div>
          <div><span className="text-neutral-500">Categoria:</span> {docente.categoria || "-"}</div>
          <div><span className="text-neutral-500">Tipo:</span> {docente.tipo_nombramiento || "-"}</div>
          <div><span className="text-neutral-500">Especialidad:</span> {docente.especialidad || "-"}</div>
          <div><span className="text-neutral-500">Antiguedad:</span> {docente.antiguedad_anios || 0} anios</div>
          <div><span className="text-neutral-500">Total Horas:</span> {resumen.total_horas}h</div>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-neutral-800 mb-2">Horario Semanal</h3>
      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-primary-50">
              <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase">Dia</th>
              <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase">Horario</th>
              <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase">Curso</th>
              <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase">Ciclo</th>
              <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase">Ambiente</th>
            </tr>
          </thead>
          <tbody>
            {horarios.length === 0 && (
              <tr><td colSpan="5" className="border border-neutral-200 p-4 text-center text-neutral-400">Sin horarios</td></tr>
            )}
            {horarios.map((h) => (
              <tr key={h.id} className="hover:bg-neutral-50">
                <td className="border border-neutral-200 p-2 font-medium">{h.dia}</td>
                <td className="border border-neutral-200 p-2">{h.hora_inicio} - {h.hora_fin}</td>
                <td className="border border-neutral-200 p-2">[{h.curso_codigo}] {h.curso_nombre}</td>
                <td className="border border-neutral-200 p-2">{h.curso_ciclo}</td>
                <td className="border border-neutral-200 p-2">{h.aula_codigo ? `Aula ${h.aula_codigo}` : `Lab ${h.lab_codigo}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-sm font-semibold text-neutral-800 mb-2">Cursos Asignados</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-neutral-100">
              <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase">Codigo</th>
              <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase">Curso</th>
              <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase">Ciclo</th>
              <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase">Tipo</th>
              <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase">Horas</th>
            </tr>
          </thead>
          <tbody>
            {cursos.map((c, i) => (
              <tr key={i} className="hover:bg-neutral-50">
                <td className="border border-neutral-200 p-2 font-medium">{c.codigo}</td>
                <td className="border border-neutral-200 p-2">{c.nombre}</td>
                <td className="border border-neutral-200 p-2">{c.ciclo}</td>
                <td className="border border-neutral-200 p-2">{c.tipo}</td>
                <td className="border border-neutral-200 p-2">{c.horas}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PreviewPorDia = ({ data }) => {
  const { dia, semestre, horarios, docentes, ambientes, resumen } = data;
  return (
    <div className="p-6">
      <div className="border-b border-neutral-200 pb-4 mb-4">
        <h2 className="text-lg font-bold text-neutral-900">Reporte por Dia: {dia}</h2>
        <p className="text-sm text-neutral-500">Semestre: {semestre} | Clases: {resumen.total_clases} | Docentes: {resumen.total_docentes} | Ambientes: {resumen.total_ambientes}</p>
      </div>

      <h3 className="text-sm font-semibold text-neutral-800 mb-2">Horarios</h3>
      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-primary-50">
              <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase">Horario</th>
              <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase">Curso</th>
              <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase">Ciclo</th>
              <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase">Docente</th>
              <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase">Ambiente</th>
            </tr>
          </thead>
          <tbody>
            {horarios.map((h) => (
              <tr key={h.id} className="hover:bg-neutral-50">
                <td className="border border-neutral-200 p-2">{h.hora_inicio} - {h.hora_fin}</td>
                <td className="border border-neutral-200 p-2">[{h.curso_codigo}] {h.curso_nombre}</td>
                <td className="border border-neutral-200 p-2">{h.curso_ciclo}</td>
                <td className="border border-neutral-200 p-2">{h.docente_apellidos}, {h.docente_nombres}</td>
                <td className="border border-neutral-200 p-2">{h.aula_codigo ? `Aula ${h.aula_codigo}` : `Lab ${h.lab_codigo}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-neutral-800 mb-2">Docentes</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-100">
                  <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase">Docente</th>
                  <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase">Categoria</th>
                </tr>
              </thead>
              <tbody>
                {docentes.map((d) => (
                  <tr key={d.id} className="hover:bg-neutral-50">
                    <td className="border border-neutral-200 p-2">{d.nombre}</td>
                    <td className="border border-neutral-200 p-2">{d.categoria || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-neutral-800 mb-2">Ambientes Utilizados</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-100">
                  <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase">Codigo</th>
                  <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase">Nombre</th>
                </tr>
              </thead>
              <tbody>
                {ambientes.map((a, i) => (
                  <tr key={i} className="hover:bg-neutral-50">
                    <td className="border border-neutral-200 p-2 font-medium">{a.codigo}</td>
                    <td className="border border-neutral-200 p-2">{a.nombre || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const PreviewPorAula = ({ data }) => {
  const { ambiente, tipo, semestre, horarios, docentes, resumen } = data;
  return (
    <div className="p-6">
      <div className="border-b border-neutral-200 pb-4 mb-4">
        <h2 className="text-lg font-bold text-neutral-900">Reporte por {tipo}: {ambiente.codigo}</h2>
        <p className="text-sm text-neutral-500">{ambiente.nombre || ""} | Capacidad: {ambiente.capacidad || "-"} | Semestre: {semestre} | Clases: {resumen.total_clases}</p>
      </div>

      <h3 className="text-sm font-semibold text-neutral-800 mb-2">Horarios Asignados</h3>
      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-primary-50">
              <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase">Dia</th>
              <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase">Horario</th>
              <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase">Curso</th>
              <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase">Ciclo</th>
              <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase">Docente</th>
            </tr>
          </thead>
          <tbody>
            {horarios.map((h) => (
              <tr key={h.id} className="hover:bg-neutral-50">
                <td className="border border-neutral-200 p-2 font-medium">{h.dia}</td>
                <td className="border border-neutral-200 p-2">{h.hora_inicio} - {h.hora_fin}</td>
                <td className="border border-neutral-200 p-2">[{h.curso_codigo}] {h.curso_nombre}</td>
                <td className="border border-neutral-200 p-2">{h.curso_ciclo}</td>
                <td className="border border-neutral-200 p-2">{h.docente_apellidos}, {h.docente_nombres}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-sm font-semibold text-neutral-800 mb-2">Docentes que utilizan este ambiente</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-neutral-100">
              <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase">Docente</th>
              <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase">Categoria</th>
            </tr>
          </thead>
          <tbody>
            {docentes.map((d) => (
              <tr key={d.id} className="hover:bg-neutral-50">
                <td className="border border-neutral-200 p-2">{d.nombre}</td>
                <td className="border border-neutral-200 p-2">{d.categoria || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PreviewOperacional = ({ data }) => {
  return (
    <div className="p-6">
      <div className="border-b border-neutral-200 pb-4 mb-4">
        <h2 className="text-lg font-bold text-neutral-900">Reporte Operacional</h2>
        <p className="text-sm text-neutral-500">Horarios agrupados por ambiente</p>
      </div>
      {Object.keys(data).length === 0 && (
        <p className="text-center text-neutral-400 py-8">No hay datos</p>
      )}
      {Object.keys(data).map((ambienteKey) => (
        <div key={ambienteKey} className="mb-6">
          <h3 className="text-sm font-bold bg-neutral-800 text-white p-2 rounded mb-2">{ambienteKey}</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-100">
                  <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase w-1/4">Bloque</th>
                  <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase w-5/12">Curso</th>
                  <th className="border border-neutral-200 p-2 text-left text-xs font-semibold text-neutral-600 uppercase w-1/3">Docente</th>
                </tr>
              </thead>
              <tbody>
                {data[ambienteKey].map((item, idx, arr) => {
                  const esPrimerDia = idx === 0 || item.dia !== arr[idx - 1].dia;
                  return (
                    <React.Fragment key={idx}>
                      {esPrimerDia && (
                        <tr className="bg-neutral-50 font-bold">
                          <td colSpan="3" className="border border-neutral-200 p-2 pl-3 text-xs uppercase text-primary-900">
                            {item.dia}
                          </td>
                        </tr>
                      )}
                      <tr className="hover:bg-neutral-50">
                        <td className="border border-neutral-200 p-2 pl-3">{item.hora_inicio} - {item.hora_fin}</td>
                        <td className="border border-neutral-200 p-2">{item.curso?.nombre}</td>
                        <td className="border border-neutral-200 p-2">{item.docente?.apellidos}, {item.docente?.nombres}</td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

const PreviewGestion = ({ data }) => {
  return (
    <div className="p-6">
      <div className="border-b border-neutral-200 pb-4 mb-4">
        <h2 className="text-lg font-bold text-neutral-900">Reporte de Gestion Docente</h2>
        <p className="text-sm text-neutral-500">Resumen de carga horaria por docente</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-neutral-800 text-white">
              <th className="border border-neutral-300 p-2 text-left text-xs font-semibold uppercase">Docente</th>
              <th className="border border-neutral-300 p-2 text-left text-xs font-semibold uppercase">Categoria</th>
              <th className="border border-neutral-300 p-2 text-left text-xs font-semibold uppercase">Antiguedad</th>
              <th className="border border-neutral-300 p-2 text-left text-xs font-semibold uppercase">Horas Asignadas</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan="4" className="border border-neutral-200 p-4 text-center text-neutral-400">Sin datos</td></tr>
            )}
            {data.map((doc, idx) => (
              <tr key={idx} className="hover:bg-neutral-50">
                <td className="border border-neutral-200 p-2 font-medium">{doc.nombre}</td>
                <td className="border border-neutral-200 p-2">{doc.categoria}</td>
                <td className="border border-neutral-200 p-2 text-center">{doc.antiguedad_anios} anios</td>
                <td className="border border-neutral-200 p-2 text-center font-bold text-primary-700">{doc.horas} hrs</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reportes;
