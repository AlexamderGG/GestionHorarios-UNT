import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { BookOpen, Calendar, Clock, MapPin, ArrowRight, CheckCircle, AlertCircle, Inbox } from 'lucide-react';

const MisCursos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get('/docente/mis-cursos')
      .then((res) => setCursos(res.data?.data || []))
      .catch((err) => console.error('Error cargando cursos:', err))
      .finally(() => setLoading(false));
  }, [user]);

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
        </p>
      </div>

      {cursos.length === 0 ? (
        <EmptyState />
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
                    <td className="p-3 text-neutral-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                      {c.ambiente_codigo || '—'}
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
    </div>
  );
};

const EmptyState = () => (
  <div className="card">
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-neutral-400" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-800 mb-1">Sin cursos asignados</h3>
      <p className="text-sm text-neutral-500 text-center">
        No tienes cursos asignados actualmente. Contacta al administrador si crees que es un error.
      </p>
    </div>
  </div>
);

export default MisCursos;
