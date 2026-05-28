import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, Clock, AlertCircle, Send, RotateCcw, RefreshCw } from 'lucide-react';
import api from '../../services/api'; 

const SecretariaPanel = () => {
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [reiniciando, setReiniciando] = useState(false);

  // Cargar la lista ordenada de docentes
  const fetchDocentes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/secretaria/docentes-escalafon'); 
      if (response.data && response.data.success) {
        setDocentes(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar escalafón:', err);
      setError('No se pudo cargar la lista de docentes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocentes();
  }, []);

  const handleHabilitarTurno = async (docenteId, nombreCompleto) => {
    if (!window.confirm(`¿Está seguro de habilitar el turno y enviar las credenciales a ${nombreCompleto}?`)) {
      return;
    }

    try {
      setActionLoading(docenteId);
      const response = await api.post(`/secretaria/habilitar-turno/${docenteId}`);
      
      if (response.data && response.data.success) {
        // Actualizamos el estado localmente para no recargar toda la página
        setDocentes(docentes.map(d => 
          d.id === docenteId ? { ...d, estado_turno: 'Notificado' } : d
        ));
      }
    } catch (err) {
      console.error('Error al habilitar turno:', err);
      alert('Hubo un error al intentar enviar las credenciales y habilitar el turno.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCambioEstadoManual = async (docenteId, nuevoEstado) => {
    if (!window.confirm(`¿Está seguro de cambiar manualmente el estado a "${nuevoEstado}"?`)) return;

    try {
      const response = await api.put(`/secretaria/docentes/${docenteId}/estado`, {
        estado_turno: nuevoEstado
      });

      if (response.data.success) {
        // Actualizar la tabla localmente sin recargar la página
        setDocentes(docentes.map(d => 
          d.id === docenteId ? { ...d, estado_turno: nuevoEstado } : d
        ));
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Hubo un error al actualizar el estado manualmente.');
    }
  };

  const handleReiniciarTurnosGlobal = async () => {
    const confirmar = confirm(
      "¿Está completamente seguro de reiniciar todos los turnos? \n\nEsto restaurará el estado de todos los docentes a 'Pendiente' y detendrá cualquier selección activa en este momento sin borrar los horarios ya guardados."
    );
    
    if (!confirmar) return;

    setReiniciando(true);
    try {
      // 👇 CONECTADO: Apesta directamente al nuevo endpoint ordenado en el módulo de horarios
      const res = await api.post("/horarios/reset-turnos"); 
      
      if (res.data?.success) {
        alert(res.data.message || "Turnos reiniciados correctamente.");
        // 👇 CORREGIDO: Llamada correcta a fetchDocentes() en lugar de cargarDocentes()
        fetchDocentes(); 
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error al solicitar el reinicio de turnos.");
    } finally {
      setReiniciando(false);
    }
  };

  // Encontrar el ID del PRIMER docente que está en estado "Pendiente"
  const idSiguienteEnTurno = docentes.find(d => d.estado_turno === 'Pendiente')?.id;

  if (loading && docentes.length === 0) return <div className="p-6 text-center text-neutral-500">Cargando escalafón docente...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      
      {/* 👇 MODIFICADO: Cabecera alineada en Flexbox con Botón de Actualización Manual y Reset */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Gestión de Turnos (Escalafón)</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Control de flujo y asignación de prioridades horarias para los docentes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Botón de recarga silenciosa en grilla */}
          <button 
            onClick={fetchDocentes} 
            disabled={loading}
            className="p-2 border border-neutral-200 text-neutral-500 hover:bg-neutral-50 rounded-lg transition-colors bg-white"
            title="Actualizar escalafón"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={handleReiniciarTurnosGlobal}
            disabled={reiniciando}
            className="btn-secondary flex items-center gap-2 bg-danger-50 text-danger-700 border-danger-200 hover:bg-danger-100 px-4 py-2 rounded-lg font-medium text-sm transition-all"
          >
            {reiniciando ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Reiniciando...</>
            ) : (
              <><RotateCcw className="w-4 h-4" /> Reiniciar Todos los Turnos</>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-neutral-600">
            <thead className="text-xs text-neutral-700 uppercase bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-4 py-3">Docente</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3 text-center">Años Antigüedad</th>
                <th className="px-4 py-3 text-center">Estado de Turno</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {docentes.map((docente, index) => {
                const esSuTurno = docente.id === idSiguienteEnTurno;
                const nombreCompleto = `${docente.apellidos}, ${docente.nombres}`;

                return (
                  <tr key={docente.id} className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-neutral-900">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-neutral-800">{nombreCompleto}</div>
                      <div className="text-xs text-neutral-400">{docente.email}</div>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {docente.categoria}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-neutral-800">
                      {docente.antiguedad_anios}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select
                        value={docente.estado_turno}
                        onChange={(e) => handleCambioEstadoManual(docente.id, e.target.value)}
                        className={`text-xs font-bold rounded-full px-3 py-1 border border-transparent outline-none cursor-pointer text-center ${
                          docente.estado_turno === 'Completado' ? 'bg-green-100 text-green-800 border-green-200' :
                          docente.estado_turno === 'Notificado' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          docente.estado_turno === 'Automatico' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                          'bg-neutral-100 text-neutral-600 border-neutral-200'
                        }`}
                      >
                        <option value="Pendiente" className="bg-white text-neutral-800">Pendiente</option>
                        <option value="Notificado" className="bg-white text-neutral-800">Notificado / Eligiendo</option>
                        <option value="Completado" className="bg-white text-neutral-800">Completado</option>
                        <option value="Automatico" className="bg-white text-neutral-800">Automático</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {docente.estado_turno === 'Pendiente' ? (
                        <button
                          onClick={() => handleHabilitarTurno(docente.id, nombreCompleto)}
                          disabled={!esSuTurno || actionLoading === docente.id}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            esSuTurno 
                              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                          }`}
                          title={!esSuTurno ? "Debe esperar a que los docentes anteriores finalicen su selección" : ""}
                        >
                          {actionLoading === docente.id ? (
                            <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Procesando...</>
                          ) : (
                            <>
                              <Send size={14} />
                              Habilitar Turno
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-neutral-400 italic font-medium">No requiere acción</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              
              {docentes.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-neutral-400 font-medium">
                    No se encontraron docentes en el escalafón para este semestre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SecretariaPanel;