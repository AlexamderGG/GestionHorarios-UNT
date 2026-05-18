import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

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
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Mis Cursos</h1>

      {cursos.length === 0 ? (
        <div className="bg-white rounded-lg shadow border border-neutral-200 p-12 text-center text-neutral-400">
          No tienes cursos asignados actualmente.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="text-left p-3 font-semibold text-neutral-700">Código</th>
                <th className="text-left p-3 font-semibold text-neutral-700">Curso</th>
                <th className="text-left p-3 font-semibold text-neutral-700">Tipo</th>
                <th className="text-left p-3 font-semibold text-neutral-700">Ambiente</th>
                <th className="text-center p-3 font-semibold text-neutral-700">Estado</th>
                <th className="text-center p-3 font-semibold text-neutral-700">Acción</th>
              </tr>
            </thead>
            <tbody>
              {cursos.map((c) => (
                <tr key={`${c.id}-${c.tipo}`} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="p-3 font-mono text-xs">{c.curso_codigo || '—'}</td>
                  <td className="p-3">{c.curso_nombre || '—'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      c.tipo === 'Teoria' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                    }`}>
                      {c.tipo}
                    </span>
                  </td>
                  <td className="p-3 text-neutral-500">{c.ambiente_codigo || '—'}</td>
                  <td className="p-3 text-center">
                    {c.tiene_horario ? (
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">Con horario</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium">Pendiente</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {c.tiene_horario ? (
                      <button
                        onClick={() => navigate('/docente/horario')}
                        className="text-primary-600 hover:text-primary-800 text-xs font-medium"
                      >
                        Ver horario
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/docente/seleccionar?asignacion_id=${c.id}`)}
                        className="text-primary-600 hover:text-primary-800 text-xs font-medium"
                      >
                        Seleccionar horario
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MisCursos;
