import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../services/api';

const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2'];

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_docentes: 0,
    total_cursos: 0,
    total_aulas: 0,
    total_laboratorios: 0,
    ocupacion_aulas: 0,
    distribucion_teoria_lab: { teoria: 0, laboratorio: 0 },
    carga_por_docente: [],
    uso_por_ambiente: [],
  });
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [semestre, setSemestre] = useState('2024-1');

  const cargarEstadisticas = () => {
    setLoading(true);
    api.get('/estadisticas')
      .then((res) => {
        if (res.data?.data) setStats(res.data.data);
      })
      .catch((err) => {
        console.error('Error cargando estadísticas:', err);
        setMensaje({ tipo: 'error', texto: 'Error al cargar estadísticas' });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const handleGenerar = async () => {
    setGenerando(true);
    setMensaje(null);
    try {
      const res = await api.post('/horarios/generar', { semestre, forzar: true });
      if (res.data?.success) {
        setMensaje({ tipo: 'exito', texto: `¡Horarios generados! ${res.data.data?.generados || 0} clases asignadas.` });
        cargarEstadisticas();
      } else {
        setMensaje({ tipo: 'error', texto: res.data?.message || 'Error al generar horarios' });
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.message || 'Error de conexión al generar horarios' });
    } finally {
      setGenerando(false);
    }
  };

  // Datos para gráficos
  const dataCargaDocente = (stats.carga_por_docente || []).map(d => ({
    nombre: d.nombre || d.docente || `Docente ${d.docente_id}`,
    horas: Number(d.horas || 0),
  }));

  const dataDistribucion = [
    { name: 'Teoría', value: Number(stats.distribucion_teoria_lab?.teoria || 0) },
    { name: 'Laboratorio', value: Number(stats.distribucion_teoria_lab?.laboratorio || 0) },
  ];

  const dataUsoAmbiente = (stats.uso_por_ambiente || []).map(a => ({
    nombre: a.ambiente,
    horas: Number(a.horas || 0),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
          <p className="text-neutral-500">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        {mensaje && (
          <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
            mensaje.tipo === 'exito' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {mensaje.texto}
            <button onClick={() => setMensaje(null)} className="ml-3 text-lg leading-none">&times;</button>
          </div>
        )}
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <Card titulo="Docentes" valor={stats.total_docentes} icono="👨‍🏫" color="border-l-blue-500" />
        <Card titulo="Cursos" valor={stats.total_cursos} icono="📚" color="border-l-purple-500" />
        <Card titulo="Aulas" valor={stats.total_aulas} icono="🏫" color="border-l-green-500" />
        <Card titulo="Laboratorios" valor={stats.total_laboratorios} icono="🔬" color="border-l-orange-500" />
        <Card titulo="Ocupación" valor={`${stats.ocupacion_aulas}%`} icono="📊" color="border-l-primary-500" />
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white p-5 rounded-lg shadow border border-neutral-200 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Semestre</label>
            <input
              type="text"
              value={semestre}
              onChange={(e) => setSemestre(e.target.value)}
              className="border border-neutral-300 rounded px-3 py-2 text-sm w-32"
              placeholder="2024-1"
            />
          </div>
          <button
            onClick={handleGenerar}
            disabled={generando}
            className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition font-medium"
          >
            {generando ? 'Generando...' : '⚡ Generar Horarios'}
          </button>
          <button
            onClick={() => navigate('/horarios')}
            className="px-5 py-2 bg-neutral-200 text-neutral-800 rounded-lg hover:bg-neutral-300 transition font-medium"
          >
            📅 Ver Horarios
          </button>
          <button
            onClick={() => navigate('/reportes')}
            className="px-5 py-2 bg-neutral-200 text-neutral-800 rounded-lg hover:bg-neutral-300 transition font-medium"
          >
            📄 Descargar Reporte
          </button>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carga horaria por docente */}
        <div className="bg-white p-5 rounded-lg shadow border border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4">📊 Carga Horaria por Docente</h2>
          {dataCargaDocente.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dataCargaDocente} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="nombre" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="horas" fill="#2563eb" radius={[4, 4, 0, 0]} name="Horas" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart texto="Sin datos de carga horaria. Genere horarios primero." />
          )}
        </div>

        {/* Distribución Teoría vs Laboratorio */}
        <div className="bg-white p-5 rounded-lg shadow border border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4">🥧 Distribución Teoría vs Laboratorio</h2>
          {dataDistribucion.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dataDistribucion}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {dataDistribucion.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart texto="Sin datos de distribución. Genere horarios primero." />
          )}
        </div>

        {/* Uso por ambiente */}
        <div className="bg-white p-5 rounded-lg shadow border border-neutral-200 lg:col-span-2">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4">🏢 Uso por Ambiente (horas ocupadas)</h2>
          {dataUsoAmbiente.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dataUsoAmbiente} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="nombre" type="category" tick={{ fontSize: 12 }} width={100} />
                <Tooltip />
                <Bar dataKey="horas" fill="#7c3aed" radius={[0, 4, 4, 0]} name="Horas ocupadas" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart texto="Sin datos de uso de ambientes. Genere horarios primero." />
          )}
        </div>
      </div>
    </div>
  );
};

// Componente tarjeta
const Card = ({ titulo, valor, icono, color }) => (
  <div className={`bg-white p-4 rounded-lg shadow border border-neutral-200 border-l-4 ${color} hover:shadow-md transition`}>
    <div className="flex items-center gap-2 mb-1">
      <span className="text-xl">{icono}</span>
      <p className="text-sm text-neutral-500">{titulo}</p>
    </div>
    <p className="text-2xl font-bold text-neutral-900">{valor}</p>
  </div>
);

// Componente estado vacío
const EmptyChart = ({ texto }) => (
  <div className="flex items-center justify-center h-[300px] text-neutral-400 text-sm bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
    {texto}
  </div>
);

export default Dashboard;
