import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { BookOpen, Calendar, Clock, MapPin, CheckCircle, AlertCircle, Inbox } from 'lucide-react';

const MisCursos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [semestre, setSemestre] = useState('');

  const cargarDatos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Primero obtener la configuración para saber el semestre activo
      const resConfig = await api.get('/configuracion');
      const semestreActivo = resConfig.data?.data?.semestre_activo || '2026-1';
      setSemestre(semestreActivo);

      // 2. Luego pedir los cursos de ESE semestre
      const resCursos = await api.get('/docente/mis-cursos', { params: { semestre: semestreActivo } });
      setCursos(resCursos.data?.data || []);
    } catch (err) {
      console.error('Error cargando cursos:', err);
      setErrorMsg(err.response?.data?.message || 'Error al cargar cursos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    cargarDatos(); // Ejecuta tu lógica actual (cargar cursos, asignaciones, etc.)

    // 👇 NUEVO: Consultamos el estado real en la Base de Datos
    const obtenerEstadoTurno = async () => {
      try {
        const responseStatus = await api.get('/docente/mi-estado');
        if (responseStatus.data && responseStatus.data.success) {
          setEstadoTurno(responseStatus.data.data.estado_turno); // Guardamos (Pendiente, Notificado, Completado)
        }
      } catch (error) {
        console.error("Error al cargar el estado del turno:", error);
      }
    };

    obtenerEstadoTurno();
  }, [cargarDatos]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estadoTurno, setEstadoTurno] = useState('');
  const handleFinalizarTurno = async () => {
    if (!window.confirm('¿Está seguro de finalizar? Ya no podrá modificar sus horarios y cederá el turno al siguiente docente.')) {
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await api.post('/docente/finalizar-turno');
      
      if (response.data && response.data.success) {
        // 👇 APAGAMOS EL LOADING E INFORMAREMO EL ESTADO AL INSTANTE
        setIsSubmitting(false); 
        setEstadoTurno('Completado'); 
        
        alert('¡Horario finalizado con éxito! Su turno ha concluido.');
        navigate('/docente/cursos'); 
      }
    } catch (err) {
      console.error('Error al finalizar el turno:', err);
      alert(err.response?.data?.message || 'Hubo un error al finalizar su turno. Intente nuevamente.');
      setIsSubmitting(false); // También se apaga si hay error
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton h-7 w-32 mb-6" />
        <div className="card">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 border-b border-neutral-100 flex items-center gap-4">
              <div className="skeleton h-4 w-16" />
              <div className="skeleton h-4 w-48" />
              <div className="skeleton h-5 w-20 rounded" />
              <div className="skeleton h-4 w-24 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary-600" />
          Mis Cursos
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {cursos.length} curso{cursos.length !== 1 ? 's' : ''} asignado{cursos.length !== 1 ? 's' : ''}
          {semestre && <span className="ml-2 text-neutral-400">· Semestre: {semestre}</span>}
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-4 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700">
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      {cursos.length === 0 ? (
        <EmptyState semestre={semestre} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="text-left p-3 text-xs font-semibold text-neutral-500 uppercase">Código</th>
                  <th className="text-left p-3 text-xs font-semibold text-neutral-500 uppercase">Curso</th>
                  <th className="text-left p-3 text-xs font-semibold text-neutral-500 uppercase">Tipo</th>
                  <th className="text-left p-3 text-xs font-semibold text-neutral-500 uppercase">Ambiente</th>
                  <th className="text-center p-3 text-xs font-semibold text-neutral-500 uppercase">Estado</th>
                  <th className="text-center p-3 text-xs font-semibold text-neutral-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody>
                {cursos.map((c) => (
                  <tr key={`${c.id}-${c.tipo}`} className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors">
                    <td className="p-3 font-mono text-xs text-neutral-600">{c.curso_codigo || '—'}</td>
                    <td className="p-3 font-medium text-neutral-800">{c.curso_nombre || '—'}</td>
                    <td className="p-3">
                      <span className={`badge ${c.tipo === 'Teoria' ? 'badge-primary' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                        {c.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                        <span>
                          {c.horario?.aula?.codigo ||
                          c.horario?.laboratorio?.codigo ||
                          c.horario?.ambiente_secretaria_codigo ||
                          c.aula_codigo ||
                          c.ambiente_codigo ||
                          '—'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {c.tiene_horario ? (
                        <span className="badge-success">
                          <CheckCircle className="w-3 h-3" />
                          Con horario
                        </span>
                      ) : (
                        <span className="badge-warning">
                          <AlertCircle className="w-3 h-3" />
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {c.tiene_horario ? (
                        <button
                          onClick={() => navigate('/docente/horario')}
                          className="btn-ghost flex items-center gap-1 mx-auto text-primary-600 hover:text-primary-700"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          Ver horario
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/docente/seleccionar?asignacion_id=${c.id}`)}
                          className="btn-ghost flex items-center gap-1 mx-auto text-primary-600 hover:text-primary-700"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Seleccionar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="mt-8 flex justify-end border-t pt-4">
              <button
                onClick={handleFinalizarTurno}
                disabled={isSubmitting || estadoTurno === 'Completado'} // 👈 Bloqueo permanente
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isSubmitting || estadoTurno === 'Completado'
                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                }`}
              >
                {isSubmitting ? (
                  'Procesando...'
                ) : estadoTurno === 'Completado' ? (
                  '✓ Horario Finalizado y Confirmado' // 👈 Feedback visual elegante
                ) : (
                  'Confirmar y Finalizar Mi Horario'
                )}
              </button>
            </div>
    </div>
  );
};

const EmptyState = ({ semestre }) => (
  <div className="card">
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-neutral-400" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-800 mb-1">Sin cursos asignados</h3>
      <p className="text-sm text-neutral-500 text-center mb-2">
        No tienes cursos asignados para el semestre <strong>{semestre || 'actual'}</strong>.
      </p>
      <p className="text-xs text-neutral-400 text-center">
        Verifica que el administrador te haya asignado cursos y que el semestre sea correcto.
      </p>
    </div>
  </div>
);

export default MisCursos;