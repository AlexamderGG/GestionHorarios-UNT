import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, FileDown, Users, Building2, Eye, Download,
  User, Calendar, CalendarDays
} from 'lucide-react';
import api from '../services/api';
import { exportElementToPDF } from '../utils/pdf';

const Reportes = () => {
  const [docentes, setDocentes] = useState([]);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState('');
  const [semestre, setSemestre] = useState('2026-1');
  
  const [loadingDocentes, setLoadingDocentes] = useState(false);
  const [loadingReporte, setLoadingReporte] = useState(false);

  const [horarioDocenteData, setHorarioDocenteData] = useState(null);
  const [reporteOperacionalData, setReporteOperacionalData] = useState(null);
  const [reporteGestionData, setReporteGestionData] = useState(null);

  const operacionalRef = useRef(null);
  const gestionRef = useRef(null);
  const individualRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingDocentes(true);
      try {
        const [resConfig, resDocentes] = await Promise.all([
          api.get('/configuracion').catch(() => null),
          api.get('/docentes')
        ]);
        
        if (resConfig?.data?.data?.semestre_activo) {
          setSemestre(resConfig.data.data.semestre_activo);
        }
        if (resDocentes?.data?.success) {
          setDocentes(resDocentes.data.data);
        }
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
      } finally {
        setLoadingDocentes(false);
      }
    };
    fetchData();
  }, []);

  const handleSemestreChange = (e) => {
    setSemestre(e.target.value);
    setHorarioDocenteData(null);
    setDocenteSeleccionado('');
  };

  const handleDescargarOperacional = async () => {
    setLoadingReporte(true);
    try {
      const response = await api.get('/reportes/operacional', { params: { formato: 'json', semestre } });
      if (response.data && response.data.success) {
        setReporteOperacionalData(response.data.data);
        setTimeout(async () => {
          await exportElementToPDF(operacionalRef.current, `Reporte_Operacional_Horarios_${semestre}.pdf`);
          setReporteOperacionalData(null);
          setLoadingReporte(false);
        }, 300);
      }
    } catch (error) {
      console.error('Error cargando reporte operacional:', error);
      setLoadingReporte(false);
    }
  };

  const handleDescargarGestion = async () => {
    setLoadingReporte(true);
    try {
      const response = await api.get('/reportes/gestion', { params: { formato: 'json', semestre } });
      if (response.data && response.data.success) {
        setReporteGestionData(response.data.data);
        setTimeout(async () => {
          await exportElementToPDF(gestionRef.current, `Reporte_Gestion_Docentes_${semestre}.pdf`);
          setReporteGestionData(null);
          setLoadingReporte(false);
        }, 300);
      }
    } catch (error) {
      console.error('Error cargando reporte de gestión:', error);
      setLoadingReporte(false);
    }
  };

  const handleVerHorarioDocente = async () => {
    if (!docenteSeleccionado) return;
    setLoadingReporte(true);
    try {
      const response = await api.get(`/reportes/docente/${docenteSeleccionado}`, { params: { semestre } });
      if (response.data && response.data.success) {
        setHorarioDocenteData(response.data.data);
      }
    } catch (error) {
      console.error('Error obteniendo horario individual:', error);
      setHorarioDocenteData(null);
    } finally {
      setLoadingReporte(false);
    }
  };

  const handleExportarPDFDocente = async () => {
    if (!horarioDocenteData) return;
    const docenteActual = docentes.find(d => String(d.id) === String(docenteSeleccionado));
    const nombreArchivo = docenteActual
      ? `Horario_${docenteActual.apellidos.replace(/\s+/g, '_')}_${semestre}.pdf`
      : `Horario_Docente_${docenteSeleccionado}_${semestre}.pdf`;
    await exportElementToPDF(individualRef.current, nombreArchivo);
  };

  const docenteActual = docentes.find(d => String(d.id) === String(docenteSeleccionado));
  const nombreDocenteCompleto = docenteActual ? `${docenteActual.apellidos}, ${docenteActual.nombres}` : 'No identificado';

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary-600" />
            Reportes
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Generación y exportación de reportes en PDF</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-neutral-200 shadow-sm">
          <CalendarDays className="w-4 h-4 text-neutral-500" />
          <label className="text-sm font-medium text-neutral-700 whitespace-nowrap">Semestre:</label>
          <select value={semestre} onChange={handleSemestreChange} className="input py-1.5 h-auto w-32 border-neutral-200">
            <option value="2026-1">2026-1</option>
            <option value="2026-2">2026-2</option>
          </select>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <ReportCard
          title="Reporte Operacional"
          description="Detalle estructurado de todos los horarios filtrados por ambiente, día y hora."
          icon={Building2}
          loading={loadingReporte}
          onDownload={handleDescargarOperacional}
        />
        <ReportCard
          title="Reporte de Gestión"
          description="Resumen integral de asignación por docente evaluando categoría y carga horaria."
          icon={Users}
          loading={loadingReporte}
          onDownload={handleDescargarGestion}
        />
      </div>

      {/* Individual Report */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary-600" />
          Reporte por Docente
        </h2>
        <div className="flex flex-wrap gap-3 items-end mb-6">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Seleccionar Docente</label>
            <select
              className="input"
              value={docenteSeleccionado}
              onChange={(e) => { setDocenteSeleccionado(e.target.value); setHorarioDocenteData(null); }}
              disabled={loadingDocentes}
            >
              <option value="">-- Seleccione --</option>
              {docentes.map((doc) => (
                <option key={doc.id} value={doc.id}>{`${doc.apellidos}, ${doc.nombres}`}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleVerHorarioDocente}
            disabled={!docenteSeleccionado || loadingReporte}
            className="btn-secondary flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Ver Horario
          </button>
          <button
            onClick={handleExportarPDFDocente}
            disabled={!horarioDocenteData}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>

        <div className="border border-neutral-200 rounded-lg p-4 min-h-[200px]">
          {horarioDocenteData ? (
            <div ref={individualRef} className="p-4 bg-white">
              <div className="border-b border-neutral-200 pb-4 mb-4">
                <h3 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  Horario de Clases Semanal
                </h3>
                <div className="mt-3 text-sm text-neutral-700 bg-neutral-50 p-3 rounded-lg border border-neutral-100 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-neutral-900">{nombreDocenteCompleto}</p>
                    <p className="text-xs text-neutral-400 font-mono mt-1">ID: {docenteSeleccionado}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary-100 text-primary-800 text-xs font-semibold">
                      Semestre {semestre}
                    </span>
                  </div>
                </div>
              </div>

              {horarioDocenteData.length === 0 ? (
                <p className="text-center text-neutral-400 my-8">El docente no cuenta con horarios asignados en el semestre {semestre}.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200">
                        <th className="p-3 text-xs font-semibold text-neutral-500 uppercase w-1/4">Hora Inicio</th>
                        <th className="p-3 text-xs font-semibold text-neutral-500 uppercase w-1/4">Hora Fin</th>
                        <th className="p-3 text-xs font-semibold text-neutral-500 uppercase w-1/3">Curso</th>
                        <th className="p-3 text-xs font-semibold text-neutral-500 uppercase w-1/6">Ambiente</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-neutral-600">
                      {horarioDocenteData.map((item, index, arr) => {
                        const esPrimerDia = index === 0 || item.dia !== arr[index - 1].dia;

                        return (
                          <React.Fragment key={item.id || index}>
                            {/* Separador de Día estructurado de forma completa */}
                            {esPrimerDia && (
                              <tr className="bg-neutral-100 font-bold border-b border-neutral-200">
                                <td colSpan="4" className="p-2.5 pl-4 text-primary-900 text-xs uppercase tracking-wider bg-neutral-100/80">
                                  {item.dia}
                                </td>
                              </tr>
                            )}
                            <tr className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                              <td className="p-3 pl-4">{item.hora_inicio}</td>
                              <td className="p-3">{item.hora_fin}</td>
                              <td className="p-3">
                                <span className="font-semibold text-neutral-700">[{item.curso?.codigo}]</span> {item.curso?.nombre}
                              </td>
                              <td className="p-3">
                                {item.aula ? `Aula: ${item.aula.codigo}` : item.laboratorio ? `Lab: ${item.laboratorio.codigo}` : 'No asignado'}
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-neutral-400 h-40">
              <User className="w-10 h-10 mb-3 text-neutral-300" />
              <p className="text-sm">Seleccione un docente y haga clic en &quot;Ver Horario&quot; para visualizar su horario en el semestre {semestre}.</p>
            </div>
          )}
        </div>
      </div>

      {/* Hidden PDF templates */}
      <div className="absolute top-[-9999px] left-[-9999px]">
        <div ref={operacionalRef} className="w-[190mm] p-8 bg-white text-neutral-800">
          <h1 className="text-2xl font-bold text-center text-primary-900 mb-2">REPORTE OPERACIONAL DE HORARIOS</h1>
          <p className="text-center text-sm text-neutral-500 mb-6">Scheduling UNT — Reporte de Infraestructura — Semestre {semestre}</p>
          {reporteOperacionalData && Object.keys(reporteOperacionalData).length === 0 ? (
            <p className="text-center text-neutral-500">No hay asignaciones registradas en este semestre.</p>
          ) : (
            reporteOperacionalData && Object.keys(reporteOperacionalData).map((ambienteKey) => (
              <div key={ambienteKey} className="mb-6 page-break-inside-avoid">
                <h3 className="text-lg font-bold bg-neutral-800 text-white p-2 rounded mb-2">{ambienteKey}</h3>
                <table className="w-full border-collapse border border-neutral-300 text-sm">
                  <thead>
                    <tr className="bg-neutral-100 text-left font-semibold">
                      <th className="border border-neutral-300 p-2 w-1/4">Bloque</th>
                      <th className="border border-neutral-300 p-2 w-5/12">Curso</th>
                      <th className="border border-neutral-300 p-2 w-1/3">Docente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporteOperacionalData[ambienteKey].map((item, idx, arr) => {
                      const esPrimerDia = idx === 0 || item.dia !== arr[idx - 1].dia;

                      return (
                        <React.Fragment key={idx}>
                          {/* Fila divisoria de día inmune a bugs de PDF */}
                          {esPrimerDia && (
                            <tr className="bg-neutral-50 font-bold">
                              <td colSpan="3" className="border border-neutral-300 p-2 pl-3 text-primary-900 bg-neutral-50 font-semibold text-xs uppercase">
                                {item.dia}
                              </td>
                            </tr>
                          )}
                          <tr className="border-b">
                            <td className="border border-neutral-300 p-2 pl-3">{`${item.hora_inicio} - ${item.hora_fin}`}</td>
                            <td className="border border-neutral-300 p-2">{item.curso?.nombre}</td>
                            <td className="border border-neutral-300 p-2">{`${item.docente.apellidos}, ${item.docente.nombres}`}</td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="absolute top-[-9999px] left-[-9999px]">
        <div ref={gestionRef} className="w-[190mm] p-8 bg-white text-neutral-800">
          <h1 className="text-2xl font-bold text-center text-neutral-900 mb-2">REPORTE RESUMEN DE GESTIÓN DOCENTE</h1>
          <p className="text-center text-sm text-neutral-500 mb-6">Resumen Analítico de Carga Horaria Universitaria — Semestre {semestre}</p>
          <table className="w-full border-collapse border border-neutral-300 text-sm">
            <thead>
              <tr className="bg-neutral-800 text-white text-left">
                <th className="border border-neutral-300 p-2">Docente</th>
                <th className="border border-neutral-300 p-2">Categoría</th>
                <th className="border border-neutral-300 p-2">Antigüedad</th>
                <th className="border border-neutral-300 p-2">Horas Asignadas</th>
              </tr>
            </thead>
            <tbody>
              {reporteGestionData && reporteGestionData.length === 0 ? (
                <tr><td colSpan="4" className="p-4 text-center text-neutral-500">No hay horas acumuladas en el semestre actual.</td></tr>
              ) : (
                reporteGestionData && reporteGestionData.map((doc, idx) => (
                  <tr key={idx}>
                    <td className="border border-neutral-300 p-2 font-medium">{doc.nombre}</td>
                    <td className="border border-neutral-300 p-2">{doc.categoria}</td>
                    <td className="border border-neutral-300 p-2 text-center">{doc.antiguedad_anios} años</td>
                    <td className="border border-neutral-300 p-2 text-center font-bold text-primary-700">{doc.horas} hrs</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ReportCard = ({ title, description, icon: Icon, loading, onDownload }) => (
  <div className="card-hover p-6 flex flex-col justify-between">
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary-600" />
        </div>
        <h2 className="text-base font-semibold text-neutral-800">{title}</h2>
      </div>
      <p className="text-sm text-neutral-600 mb-4">{description}</p>
    </div>
    <button
      onClick={onDownload}
      disabled={loading}
      className="btn-primary flex items-center gap-2 w-fit"
    >
      {loading ? (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          Procesando...
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4" />
          Descargar PDF
        </>
      )}
    </button>
  </div>
);

const RefreshCw = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

export default Reportes;