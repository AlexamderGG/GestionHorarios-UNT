import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const EstadoDocentes = () => {
  const [estado, setEstado] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [semestre, setSemestre] = useState('2024-1');

  useEffect(() => {
    api.get('/horarios/estado-seleccion', { params: { semestre } })
      .then((res) => setEstado(res.data?.data || []))
      .catch((err) => console.error('Error:', err))
      .finally(() => setLoading(false));
  }, [semestre]);

  const completados = estado.filter(e => e.completado).length;
  const pendientes = estado.length - completados;
  const porcentaje = estado.length > 0 ? Math.round((completados / estado.length) * 100) : 0;

  const filtrados = filtro === 'pendientes' ? estado.filter(e => !e.completado)
    : filtro === 'completados' ? estado.filter(e => e.completado)
    : estado;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Estado de Selección de Horarios</h1>

      <div className="bg-white p-4 rounded-lg shadow border border-neutral-200 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Semestre</label>
            <input type="text" value={semestre} onChange={(e) => setSemestre(e.target.value)}
              className="border border-neutral-300 rounded px-3 py-2 text-sm w-28" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Filtro</label>
            <select value={filtro} onChange={(e) => setFiltro(e.target.value)}
              className="border border-neutral-300 rounded px-3 py-2 text-sm w-40">
              <option value="todos">Todos ({estado.length})</option>
              <option value="completados">Completados ({completados})</option>
              <option value="pendientes">Pendientes ({pendientes})</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-lg shadow border border-neutral-200 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-700">Progreso general</span>
          <span className="text-sm text-neutral-500">{completados} de {estado.length} docentes</span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-3">
          <div className="bg-primary-600 h-3 rounded-full transition-all" style={{ width: `${porcentaje}%` }}></div>
        </div>
        <p className="text-xs text-neutral-400 mt-1">{porcentaje}% completado</p>
      </div>

      <div className="bg-white rounded-lg shadow border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="text-left p-3 font-semibold text-neutral-700">Docente</th>
              <th className="text-left p-3 font-semibold text-neutral-700">Email</th>
              <th className="text-left p-3 font-semibold text-neutral-700">Categoría</th>
              <th className="text-center p-3 font-semibold text-neutral-700">Asignaciones</th>
              <th className="text-center p-3 font-semibold text-neutral-700">Con Horario</th>
              <th className="text-center p-3 font-semibold text-neutral-700">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((e) => (
              <tr key={e.docente_id} className="border-b border-neutral-100 hover:bg-neutral-50">
                <td className="p-3 font-medium">{e.nombre}</td>
                <td className="p-3 text-neutral-500 text-xs">{e.email}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 bg-neutral-100 rounded text-xs">{e.categoria}</span>
                </td>
                <td className="p-3 text-center">{e.total_asignaciones}</td>
                <td className="p-3 text-center">{e.asignaciones_con_horario}</td>
                <td className="p-3 text-center">
                  {e.completado ? (
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">Completado</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium">Pendiente</span>
                  )}
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-neutral-400">No hay docentes para mostrar.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EstadoDocentes;
