import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, Clock, AlertCircle, Send } from 'lucide-react';
import api from '../../services/api'; // Asegúrate de que la ruta coincida con tu estructura

const SecretariaPanel = () => {
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  // Cargar la lista ordenada de docentes
  const fetchDocentes = async () => {
    try {
      setLoading(true);
      // Este endpoint lo crearemos luego en el backend
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
      // Endpoint que actualizará el estado y enviará el correo
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

  // Función para renderizar el badge de colores según el estado
  const renderEstadoBadge = (estado) => {
    switch (estado) {
      case 'Pendiente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
            <Clock size={14} /> Pendiente
          </span>
        );
      case 'Notificado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Mail size={14} /> Eligiendo... (Notificado)
          </span>
        );
      case 'Completado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={14} /> Completado
          </span>
        );
      case 'Automatico':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <AlertCircle size={14} /> Asig. Automática
          </span>
        );
      default:
        return estado;
    }
  };

  // Encontrar el ID del PRIMER docente que está en estado "Pendiente"
  // Esto nos sirve para habilitar el botón SOLO a la persona que le toca
  const idSiguienteEnTurno = docentes.find(d => d.estado_turno === 'Pendiente')?.id;

  if (loading) return <div className="p-6 text-center text-neutral-500">Cargando escalafón docente...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">Panel de Secretaría</h1>
        <p className="text-neutral-600 mt-1">
          Gestión de turnos para selección de horarios por orden de escalafón.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-neutral-600">
            <thead className="text-xs text-neutral-700 uppercase bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Docente</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3 text-center">Años Antigüedad</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {docentes.map((docente, index) => {
                const esSuTurno = docente.id === idSiguienteEnTurno;
                const nombreCompleto = `${docente.apellidos}, ${docente.nombres}`;

                return (
                  <tr key={docente.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-800">{nombreCompleto}</div>
                      <div className="text-xs text-neutral-500">{docente.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {docente.categoria}
                    </td>
                    <td className="px-4 py-3 text-center font-medium">
                      {docente.antiguedad_anios}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {renderEstadoBadge(docente.estado_turno)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {docente.estado_turno === 'Pendiente' ? (
                        <button
                          onClick={() => handleHabilitarTurno(docente.id, nombreCompleto)}
                          disabled={!esSuTurno || actionLoading === docente.id}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            esSuTurno 
                              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                          }`}
                          title={!esSuTurno ? "Debe esperar a que los docentes anteriores finalicen su selección" : ""}
                        >
                          {actionLoading === docente.id ? (
                            'Enviando...'
                          ) : (
                            <>
                              <Send size={16} />
                              Habilitar Turno
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-neutral-400 italic">No requiere acción</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              
              {docentes.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-neutral-500">
                    No se encontraron docentes activos.
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