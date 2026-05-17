// frontend/src/pages/Reportes.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { exportElementToPDF } from '../utils/pdf';

const Reportes = () => {
  const [docentes, setDocentes] = useState([]);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState('');
  const [loadingDocentes, setLoadingDocentes] = useState(false);
  const [loadingReporte, setLoadingReporte] = useState(false);
  
  const [horarioDocenteData, setHorarioDocenteData] = useState(null);
  const [reporteOperacionalData, setReporteOperacionalData] = useState(null);
  const [reporteGestionData, setReporteGestionData] = useState(null);

  const operacionalRef = useRef(null);
  const gestionRef = useRef(null);
  const individualRef = useRef(null);

  // Obtener docentes del Módulo 1 (Dato maestro)
  useEffect(() => {
    const fetchDocentes = async () => {
      setLoadingDocentes(true);
      try {
        const response = await api.get('/docentes');
        if (response.data && response.data.success) {
          setDocentes(response.data.data);
        }
      } catch (error) {
        console.error('Error cargando docentes de la base de datos:', error);
      } finally {
        setLoadingDocentes(false);
      }
    };
    fetchDocentes();
  }, []);

  // Generar y descargar PDF Operacional
  const handleDescargarOperacional = async () => {
    setLoadingReporte(true);
    try {
      const response = await api.get('/reportes/operacional', { params: { formato: 'json' } });
      if (response.data && response.data.success) {
        setReporteOperacionalData(response.data.data);
        setTimeout(async () => {
          await exportElementToPDF(operacionalRef.current, 'Reporte_Operacional_Horarios.pdf');
          setReporteOperacionalData(null);
          setLoadingReporte(false);
        }, 300);
      }
    } catch (error) {
      console.error('Error cargando reporte operacional:', error);
      setLoadingReporte(false);
    }
  };

  // Generar y descargar PDF Gestión
  const handleDescargarGestion = async () => {
    setLoadingReporte(true);
    try {
      const response = await api.get('/reportes/gestion', { params: { formato: 'json' } });
      if (response.data && response.data.success) {
        setReporteGestionData(response.data.data);
        setTimeout(async () => {
          await exportElementToPDF(gestionRef.current, 'Reporte_Gestion_Docentes.pdf');
          setReporteGestionData(null);
          setLoadingReporte(false);
        }, 300);
      }
    } catch (error) {
      console.error('Error cargando reporte de gestión:', error);
      setLoadingReporte(false);
    }
  };

  // Consultar horario individual
  const handleVerHorarioDocente = async () => {
    if (!docenteSeleccionado) return;
    setLoadingReporte(true);
    try {
      const response = await api.get(`/reportes/docente/${docenteSeleccionado}`);
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

  // Exportar el PDF personalizado con el nombre del docente
  const handleExportarPDFDocente = async () => {
    if (!horarioDocenteData) return;
    
    const docenteActual = docentes.find(d => String(d.id) === String(docenteSeleccionado));
    const nombreArchivo = docenteActual 
      ? `Horario_Docente_${docenteActual.apellidos.replace(/\s+/g, '_')}.pdf`
      : `Horario_Docente_${docenteSeleccionado}.pdf`;
      
    await exportElementToPDF(individualRef.current, nombreArchivo);
  };

  // Resolver el nombre del docente seleccionado para pintarlo en el layout del PDF
  const docenteActual = docentes.find(d => String(d.id) === String(docenteSeleccionado));
  const nombreDocenteCompleto = docenteActual ? `${docenteActual.apellidos}, ${docenteActual.nombres}` : 'No identificado';

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Reportes</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-neutral-200 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-800 mb-2">Reporte Operacional</h2>
            <p className="text-sm text-neutral-600 mb-4">Detalle estructurado de todos los horarios filtrados por ambiente, día y hora.</p>
          </div>
          <button onClick={handleDescargarOperacional} disabled={loadingReporte} className="w-fit px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-neutral-400">
            {loadingReporte ? 'Procesando...' : 'Descargar PDF'}
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-neutral-200 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-800 mb-2">Reporte de Gestión</h2>
            <p className="text-sm text-neutral-600 mb-4">Resumen integral de asignación por docente evaluando categoría y carga horaria.</p>
          </div>
          <button onClick={handleDescargarGestion} disabled={loadingReporte} className="w-fit px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-neutral-400">
            {loadingReporte ? 'Procesando...' : 'Descargar PDF'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-neutral-200 mb-6">
        <h2 className="text-lg font-semibold text-neutral-800 mb-4">Reporte por Docente</h2>
        <div className="flex flex-wrap gap-4 items-end mb-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Seleccionar Docente</label>
            <select className="border border-neutral-300 rounded px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" value={docenteSeleccionado} onChange={(e) => { setDocenteSeleccionado(e.target.value); setHorarioDocenteData(null); }} disabled={loadingDocentes}>
              <option value="">-- Seleccione --</option>
              {docentes.map((doc) => <option key={doc.id} value={doc.id}>{`${doc.apellidos}, ${doc.nombres}`}</option>)}
            </select>
          </div>
          <button onClick={handleVerHorarioDocente} disabled={!docenteSeleccionado || loadingReporte} className="px-4 py-2 bg-neutral-200 text-neutral-800 rounded hover:bg-neutral-300 transition disabled:opacity-50">Ver Horario</button>
          <button onClick={handleExportarPDFDocente} disabled={!horarioDocenteData} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-neutral-300">Exportar PDF</button>
        </div>
        
        <div className="border border-neutral-200 rounded p-4 min-h-[200px]">
          {horarioDocenteData ? (
            <div ref={individualRef} className="p-4 bg-white">
              <div className="border-b pb-4 mb-4">
                <h3 className="text-xl font-bold text-neutral-800">Horario de Clases Semanal</h3>
                {/* Cabecera optimizada para renderizarse de forma nítida en el PDF */}
                <div className="mt-2 text-sm text-neutral-700 bg-neutral-50 p-3 rounded border border-neutral-100">
                  <p className="mb-1 text-base"><strong>Docente:</strong> {nombreDocenteCompleto}</p>
                  <p className="text-xs text-neutral-400 font-mono">Código ID del Docente: {docenteSeleccionado}</p>
                </div>
              </div>
              
              {horarioDocenteData.length === 0 ? (
                <p className="text-center text-neutral-500 my-4">El docente no cuenta con horarios asignados en este ciclo.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-100 text-neutral-700 uppercase text-xs font-semibold">
                        <th className="p-3 border-b">Día</th>
                        <th className="p-3 border-b">Hora Inicio</th>
                        <th className="p-3 border-b">Hora Fin</th>
                        <th className="p-3 border-b">Curso</th>
                        <th className="p-3 border-b">Ambiente</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-neutral-600">
                      {horarioDocenteData.map((item, index) => (
                        <tr key={item.id || index} className="border-b hover:bg-neutral-50">
                          <td className="p-3 font-medium text-neutral-800">{item.dia}</td>
                          <td className="p-3">{item.hora_inicio}</td>
                          <td className="p-3">{item.hora_fin}</td>
                          <td className="p-3"><span className="font-semibold text-neutral-700">[{item.curso?.codigo}]</span> {item.curso?.nombre}</td>
                          <td className="p-3">{item.aula ? `Aula: ${item.aula.codigo}` : item.laboratorio ? `Lab: ${item.laboratorio.codigo}` : 'No asignado'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center text-neutral-400 h-40">
              <p>Seleccione un docente y haga clic en "Ver Horario" para visualizar su horario.</p>
            </div>
          )}
        </div>
      </div>

      {/* VISTA OPERACIONAL PDF OCULTA */}
      <div className="absolute top-[-9999px] left-[-9999px]">
        <div ref={operacionalRef} className="w-[190mm] p-8 bg-white text-neutral-800">
          <h1 className="text-2xl font-bold text-center text-blue-900 mb-2">REPORTE OPERACIONAL DE HORARIOS</h1>
          <p className="text-center text-sm text-neutral-500 mb-6">Scheduling UNT — Reporte de Infraestructura</p>
          {reporteOperacionalData && Object.keys(reporteOperacionalData).length === 0 ? (
            <p className="text-center text-neutral-500">No hay asignaciones registradas en este semestre.</p>
          ) : (
            reporteOperacionalData && Object.keys(reporteOperacionalData).map((ambienteKey) => (
              <div key={ambienteKey} className="mb-6">
                <h3 className="text-lg font-bold bg-neutral-200 p-2 rounded mb-3">{ambienteKey}</h3>
                <table className="w-full border-collapse border border-neutral-300 text-sm">
                  <thead>
                    <tr className="bg-neutral-100 text-left">
                      <th className="border border-neutral-300 p-2">Día</th>
                      <th className="border border-neutral-300 p-2">Bloque</th>
                      <th className="border border-neutral-300 p-2">Curso</th>
                      <th className="border border-neutral-300 p-2">Docente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporteOperacionalData[ambienteKey].map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="border border-neutral-300 p-2">{item.dia}</td>
                        <td className="border border-neutral-300 p-2">{`${item.hora_inicio} - ${item.hora_fin}`}</td>
                        <td className="border border-neutral-300 p-2">{item.curso?.nombre}</td>
                        <td className="border border-neutral-300 p-2">{`${item.docente.apellidos}, ${item.docente.nombres}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      </div>

      {/* VISTA GESTIÓN PDF OCULTA */}
      <div className="absolute top-[-9999px] left-[-9999px]">
        <div ref={gestionRef} className="w-[190mm] p-8 bg-white text-neutral-800">
          <h1 className="text-2xl font-bold text-center text-neutral-900 mb-2">REPORTE RESUMEN DE GESTIÓN DOCENTE</h1>
          <p className="text-center text-sm text-neutral-500 mb-6">Resumen Analítico de Carga Horaria Universitaria</p>
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
                    <td className="border border-neutral-300 p-2 text-center font-bold text-blue-700">{doc.horas} hrs</td>
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

export default Reportes;