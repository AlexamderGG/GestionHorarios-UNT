import React, { useEffect, useState } from 'react';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_docentes: 0,
    total_cursos: 0,
    total_aulas: 0,
    ocupacion_aulas: 0,
    distribucion_teoria_lab: { teoria: 0, laboratorio: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Modulo 3 - Conectar con endpoint real de estadisticas
    api.get('/estadisticas')
      .then((res) => {
        if (res.data?.data) setStats(res.data.data);
      })
      .catch((err) => console.error('Error cargando estadisticas:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-10 text-neutral-500">Cargando dashboard...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow border border-neutral-200">
          <p className="text-sm text-neutral-500">Total Docentes</p>
          <p className="text-2xl font-bold text-neutral-900">{stats.total_docentes}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-neutral-200">
          <p className="text-sm text-neutral-500">Total Cursos</p>
          <p className="text-2xl font-bold text-neutral-900">{stats.total_cursos}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-neutral-200">
          <p className="text-sm text-neutral-500">Total Aulas</p>
          <p className="text-2xl font-bold text-neutral-900">{stats.total_aulas}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-neutral-200">
          <p className="text-sm text-neutral-500">Ocupación Aulas</p>
          <p className="text-2xl font-bold text-primary-600">{stats.ocupacion_aulas}%</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-neutral-200 mb-6">
        <h2 className="text-lg font-semibold text-neutral-800 mb-4">Acciones Rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition">
            Generar Horarios
          </button>
          <button className="px-4 py-2 bg-neutral-200 text-neutral-800 rounded hover:bg-neutral-300 transition">
            Ver Horarios
          </button>
          <button className="px-4 py-2 bg-neutral-200 text-neutral-800 rounded hover:bg-neutral-300 transition">
            Descargar Reporte
          </button>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
        <strong>Nota para el desarrollador (Módulo 3):</strong> Aquí deben integrarse los gráficos de Recharts 
        (barras para carga horaria, pastel para uso de ambientes, etc.) y la tabla grid de horarios.
      </div>
    </div>
  );
};

export default Dashboard;
