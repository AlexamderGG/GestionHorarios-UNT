import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../services/api';
import { HelpCircle, Inbox, Check, X, Clock, AlertCircle, User, Trash2, Archive } from 'lucide-react';

const AdminExcepciones = () => {
  const [excepciones, setExcepciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [procesandoId, setProcesandoId] = useState(null);
  const [pestañaActiva, setPestañaActiva] = useState('Pendiente');

  const cargarExcepciones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/secretaria/excepciones');
      setExcepciones(res.data?.data || []);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar la lista de excepciones.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarExcepciones(); }, [cargarExcepciones]);

  const resolverSolicitud = async (id, nuevoEstado) => {
    setProcesandoId(id);
    try {
      await api.patch(`/secretaria/excepciones/${id}/estado`, { estado: nuevoEstado });
      setExcepciones(prev => prev.map(item => item.id === id ? { ...item, estado: nuevoEstado } : item));
    } catch (err) {
      alert('Error al actualizar el estado de la solicitud.');
    } finally {
      setProcesandoId(null);
    }
  };

  // 🌟 NUEVA FUNCIÓN: Eliminación física definitiva en Base de Datos
  const borrarDeBaseDeDatos = async (id) => {
    if (!window.confirm('🚨 ¿Está completamente seguro? Esto eliminará de forma irreversible el registro físico de la base de datos.')) {
      return;
    }
    setProcesandoId(id);
    try {
      await api.delete(`/secretaria/excepciones/${id}`);
      // Quitar de inmediato de la memoria del frontend
      setExcepciones(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar el registro.');
    } finally {
      setProcesandoId(null);
    }
  };

  const excepcionesFiltradas = useMemo(() => {
    if (pestañaActiva === 'Pendiente') {
      return excepciones.filter(ex => ex.estado === 'Pendiente');
    }
    if (pestañaActiva === 'Revisadas') {
      return excepciones.filter(ex => ex.estado === 'Aprobado' || ex.estado === 'Rechazado');
    }
    return excepciones;
  }, [excepciones, pestañaActiva]);

  const conteos = useMemo(() => {
    return {
      pendientes: excepciones.filter(ex => ex.estado === 'Pendiente').length,
      revisadas: excepciones.filter(ex => ex.estado === 'Aprobado' || ex.estado === 'Rechazado').length
    };
  }, [excepciones]);

  const getBadgeEstado = (estado) => {
    switch (estado) {
      case 'Aprobado': return 'bg-success-50 text-success-700 border-success-200';
      case 'Rechazado': return 'bg-danger-50 text-danger-700 border-danger-200';
      default: return 'bg-warning-50 text-warning-700 border-warning-200';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-6xl animate-pulse">
        <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4" />
        <div className="h-10 bg-neutral-200 rounded w-1/2 mb-4" />
        <div className="h-64 bg-neutral-200 rounded" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-primary-600" />
          Bandeja de Excepciones de Horario
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Evalúa las justificaciones de cruces horarios enviadas por los docentes de Jefatura y gestiona las permutas correspondientes.
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-2.5 bg-danger-50 text-danger-700 border border-danger-200 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Selectores de pestañas */}
      <div className="flex border-b border-neutral-200 mb-6 gap-2 text-sm">
        <button
          onClick={() => setPestañaActiva('Pendiente')}
          className={`pb-2.5 px-4 font-medium relative transition-all ${
            pestañaActiva === 'Pendiente' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          📥 Pendientes
          {conteos.pendientes > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-700 text-3xs font-bold px-2 py-0.5 rounded-full">
              {conteos.pendientes}
            </span>
          )}
        </button>

        <button
          onClick={() => setPestañaActiva('Revisadas')}
          className={`pb-2.5 px-4 font-medium relative transition-all ${
            pestañaActiva === 'Revisadas' ? 'text-neutral-800 font-bold border-b-2 border-neutral-800' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          📋 Historial Revisadas
          {conteos.revisadas > 0 && (
            <span className="ml-2 bg-neutral-100 text-neutral-600 text-3xs font-bold px-2 py-0.5 rounded-full">
              {conteos.revisadas}
            </span>
          )}
        </button>

        <button
          onClick={() => setPestañaActiva('Todas')}
          className={`pb-2.5 px-4 font-medium relative transition-all ${
            pestañaActiva === 'Todas' ? 'text-neutral-800 font-bold border-b-2 border-neutral-800' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          🔍 Ver Todas ({excepciones.length})
        </button>
      </div>

      {excepcionesFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-neutral-200 rounded-xl shadow-2xs text-neutral-400">
          <Inbox className="w-12 h-12 mb-2 text-neutral-300" />
          <p className="text-sm font-medium">No hay registros en esta sección.</p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200">
                  <th className="p-4">Docente</th>
                  <th className="p-4">Asignatura Afectada</th>
                  <th className="p-4 max-w-xs">Justificación del Cruce</th>
                  <th className="p-4">Alternativas de Permuta</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {excepcionesFiltradas.map((ex) => (
                  <tr key={ex.id} className="hover:bg-neutral-50/40 transition-colors">
                    <td className="p-4 font-semibold text-neutral-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-neutral-400" />
                        {ex.docente}
                      </div>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <span className="font-medium text-neutral-800">{ex.curso_codigo}</span><br />
                      <span className="text-neutral-400 text-3xs">{ex.curso_nombre} ({ex.tipo})</span>
                    </td>

                    <td className="p-4 text-neutral-600 italic max-w-xs break-words">
                      &quot;{ex.motivo}&quot;
                    </td>

                    <td className="p-4">
                      {ex.horarios_solicitados && ex.horarios_solicitados.length > 0 ? (
                        <div className="space-y-1.5">
                          {ex.horarios_solicitados.map((hor, idx) => (
                            <div key={hor.id} className="bg-neutral-50 border border-neutral-200 px-2 py-1 rounded text-3xs text-neutral-700">
                              <span className="font-bold text-primary-700">Opción {idx + 1}:</span> Ciclo {hor.ciclo} · {hor.dia} {hor.hora_inicio?.slice(0,5)} ({hor.docente_apellidos})
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-neutral-400 italic text-2xs">Evaluación y reubicación libre</span>
                      )}
                    </td>

                    <td className="p-4 text-center whitespace-nowrap">
                      <span className={`${getBadgeEstado(ex.estado)} border text-3xs font-bold px-2.5 py-0.5 rounded-full`}>
                        {ex.estado}
                      </span>
                    </td>

                    <td className="p-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {ex.estado === 'Pendiente' ? (
                          <>
                            <button
                              disabled={procesandoId !== null}
                              onClick={() => resolverSolicitud(ex.id, 'Aprobado')}
                              className="p-1 bg-success-600 text-white rounded hover:bg-success-700 transition-colors shadow-2xs"
                              title="Aprobar Solicitud"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={procesandoId !== null}
                              onClick={() => resolverSolicitud(ex.id, 'Rechazado')}
                              className="p-1 bg-danger-600 text-white rounded hover:bg-danger-700 transition-colors shadow-2xs"
                              title="Rechazar Solicitud"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <span className="text-3xs text-neutral-500 font-medium flex items-center gap-1 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200">
                            <Archive className="w-3 h-3 text-neutral-400" /> Archivado
                          </span>
                        )}

                        {/* 🌟 BOTÓN DE ELIMINACIÓN TOTAL */}
                        <button
                          disabled={procesandoId !== null}
                          onClick={() => borrarDeBaseDeDatos(ex.id)}
                          className="p-1 bg-neutral-100 text-neutral-500 hover:bg-danger-50 hover:text-danger-600 rounded border border-neutral-200 transition-colors shadow-3xs"
                          title="Eliminar permanentemente de la Base de Datos"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExcepciones;