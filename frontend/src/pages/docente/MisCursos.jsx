import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { BookOpen, Calendar, Clock, MapPin, CheckCircle, AlertCircle, Inbox, HelpCircle } from 'lucide-react';

const MisCursos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [semestre, setSemestre] = useState('');

  const [config, setConfig] = useState(null);
  
  // Variables de Estado de Control Académico
  const [estadoTurno, setEstadoTurno] = useState('');
  const [docenteEstadoReal, setDocenteEstadoReal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchConfiguracion = async () => {
      try {
        const res = await api.get('/configuracion');
        if (res.data?.data) {
          setConfig(res.data.data);
        }
      } catch (error) {
        console.error("Error cargando la configuración:", error);
      }
    };

    fetchConfiguracion();
  }, []);

  // MEJORA: Unificamos todas las peticiones aquí para evitar llamadas duplicadas
  const cargarDatos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Primero obtener la configuración para saber el semestre activo
      const resConfig = await api.get('/configuracion');
      const semestreActivo = resConfig.data?.data?.semestre_activo || '2026-1';
      setSemestre(semestreActivo);

      // 2. Ejecutar peticiones en paralelo para cargar los datos en tiempo real de la Base de Datos
      const [resCursos, resStatus, resPerfil] = await Promise.all([
        api.get('/docente/mis-cursos', { params: { semestre: semestreActivo } }),
        api.get('/docente/mi-estado').catch(() => null),
        api.get('/auth/me').catch(() => null)
      ]);

      // Guardar Cursos asignados
      setCursos(resCursos?.data?.data || []);

      // Sincronizar el estado del turno actual
      if (resStatus?.data?.success) {
        setEstadoTurno(resStatus.data.data.estado_turno || '');
      }

      // Sincronizar el perfil vivo de la BD
      if (resPerfil?.data?.success) {
        setDocenteEstadoReal(resPerfil.data.data.estado || '');
      }

    } catch (err) {
      console.error('Error cargando componentes de Mis Cursos:', err);
      setErrorMsg(err.response?.data?.message || 'Error al sincronizar la carga académica');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleFinalizarTurno = async () => {
    if (!window.confirm('¿Está seguro de finalizar? Ya no podrá modificar sus horarios y cederá el turno al siguiente docente.')) {
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await api.post('/docente/finalizar-turno');
      
      if (response.data && response.data.success) {
        setIsSubmitting(false); 
        setEstadoTurno('Completado'); 
        setDocenteEstadoReal('Completado');
        alert('¡Horario finalizado con éxito! Su turno ha concluido.');
        navigate('/docente/cursos'); 
      }
    } catch (err) {
      console.error('Error al finalizar el turno:', err);
      alert(err.response?.data?.message || 'Hubo un error al finalizar su turno. Intente nuevamente.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton h-7 w-32 mb-6 dark:opacity-20" />
        <div className="card dark:bg-neutral-800 dark:border-neutral-700">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 border-b border-neutral-100 dark:border-neutral-700 flex items-center gap-4">
              <div className="skeleton h-4 w-16 dark:opacity-20" />
              <div className="skeleton h-4 w-48 dark:opacity-20" />
              <div className="skeleton h-5 w-20 rounded dark:opacity-20" />
              <div className="skeleton h-4 w-24 ml-auto dark:opacity-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          Mis Cursos
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          {cursos.length} curso{cursos.length !== 1 ? 's' : ''} asignado{cursos.length !== 1 ? 's' : ''}
          {semestre && <span className="ml-2 text-neutral-400 dark:text-neutral-500">· Semestre: {semestre}</span>}
        </p>
      </div>

      {/* Solo se muestra si el modo turnos está activado Y el turno no está completado */}
      {(String(config?.docentes_pueden_asignar).toLowerCase() === 'true' && estadoTurno !== 'Completado' && docenteEstadoReal !== 'Completado') && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs sm:text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2.5 shadow-3xs animate-fade-in">
          <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-amber-900 dark:text-amber-100 mb-0.5">¿Presenta cruces de horario externos?</span>
            Si no tiene disponibilidad para dictar algunos cursos por cruce de horarios ajenos a la escuela o a la UNT, déjelos en estado <strong className="text-amber-950 dark:text-amber-100">"Pendiente"</strong> y finalice su horario general. Posteriormente, diríjase a la sección <strong className="text-amber-950 dark:text-amber-100">"Excepciones"</strong> para enviar su justificación y proponer alternativas de permuta.
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-4 bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800/50 rounded-lg text-sm text-danger-700 dark:text-danger-400">
          <strong className="dark:text-danger-300">Error:</strong> {errorMsg}
        </div>
      )}

      {cursos.length === 0 ? (
        <EmptyState semestre={semestre} />
      ) : (
        <div className="card overflow-hidden dark:bg-neutral-800 dark:border-neutral-700">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Código</th>
                  <th className="text-left p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Curso</th>
                  <th className="text-left p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Tipo</th>
                  <th className="text-left p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Ambiente</th>
                  <th className="text-center p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Estado</th>
                  <th className="text-center p-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody>
                {cursos.map((c) => (
                  <tr key={`${c.id}-${c.tipo}`} className="border-b border-neutral-100 dark:border-neutral-700/50 hover:bg-neutral-50/50 dark:hover:bg-neutral-700/30 transition-colors">
                    <td className="p-3 font-mono text-xs text-neutral-600 dark:text-neutral-400">{c.curso_codigo || '—'}</td>
                    <td className="p-3 font-medium text-neutral-800 dark:text-neutral-200">{c.curso_nombre || '—'}</td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-medium border ${
                        c.tipo === 'Teoria' 
                          ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-800/50' 
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/50'
                      }`}>
                        {c.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
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
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-bold bg-success-50 text-success-700 border border-success-200 dark:bg-success-900/30 dark:text-success-400 dark:border-success-800/50">
                          <CheckCircle className="w-3 h-3" /> Con horario
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-bold bg-warning-50 text-warning-700 border border-warning-200 dark:bg-warning-900/30 dark:text-warning-400 dark:border-warning-800/50">
                          <AlertCircle className="w-3 h-3" /> Pendiente
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {c.tiene_horario ? (
                        <button
                          onClick={() => navigate('/docente/horario')}
                          className="btn-ghost flex items-center gap-1 mx-auto text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 dark:hover:bg-neutral-700"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          Ver horario
                        </button>
                      ) : (
                        // AQUÍ ENTRA LA MAGIA DEL INTERRUPTOR
                        String(config?.docentes_pueden_asignar).toLowerCase() === 'true' ? (
                          <button
                            onClick={() => navigate(`/docente/seleccionar?asignacion_id=${c.id}`)}
                            className="btn-ghost flex items-center gap-1 mx-auto text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 dark:hover:bg-neutral-700"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            Seleccionar
                          </button>
                        ) : (
                          <span 
                            className="flex items-center justify-center gap-1 mx-auto text-neutral-400 dark:text-neutral-500 cursor-not-allowed text-sm font-medium" 
                            title="La secretaría asignará este horario"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            En espera
                          </span>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-end border-t border-neutral-200 dark:border-neutral-700 pt-4">
        <button
          onClick={handleFinalizarTurno}
          disabled={isSubmitting || estadoTurno === 'Completado'} 
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isSubmitting || estadoTurno === 'Completado'
              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed border border-neutral-200 dark:border-neutral-700' 
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
          }`}
        >
          {isSubmitting ? (
            'Procesando...'
          ) : estadoTurno === 'Completado' ? (
            '✓ Horario Finalizado y Confirmado'
          ) : (
            'Confirmar y Finalizar Mi Horario'
          )}
        </button>
      </div>
    </div>
  );
};

const EmptyState = ({ semestre }) => (
  <div className="card dark:bg-neutral-800 dark:border-neutral-700">
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-900/50 flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-1">Sin cursos asignados</h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center mb-2">
        No tienes cursos asignados para el semestre <strong className="dark:text-neutral-300">{semestre || 'actual'}</strong>.
      </p>
      <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center">
        Verifica que el administrador te haya asignado cursos y que el semestre sea correcto.
      </p>
    </div>
  </div>
);

export default MisCursos;