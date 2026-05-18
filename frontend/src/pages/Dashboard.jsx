import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Users, BookOpen, Building2, FlaskConical, BarChart3,
  Zap, Calendar, FileDown, RefreshCw, TrendingUp, ArrowRight, X,
} from 'lucide-react';
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
        setMensaje({ tipo: 'exito', texto: `Horarios generados: ${res.data.data?.generados || 0} clases asignadas.` });
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
    return <DashboardSkeleton />;
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-1">Resumen general del sistema de horarios</p>
        </div>
        {mensaje && (
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium animate-slide-down ${
              mensaje.tipo === 'exito'
                ? 'bg-success-50 text-success-700 border border-success-200'
                : 'bg-danger-50 text-danger-700 border border-danger-200'
            }`}
          >
            <span className="flex-1">{mensaje.texto}</span>
            <button
              onClick={() => setMensaje(null)}
              className="text-neutral-400 hover:text-neutral-600 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          label="Docentes"
          value={stats.total_docentes}
          icon={Users}
          color="primary"
        />
        <StatCard
          label="Cursos"
          value={stats.total_cursos}
          icon={BookOpen}
          color="indigo"
        />
        <StatCard
          label="Aulas"
          value={stats.total_aulas}
          icon={Building2}
          color="success"
        />
        <StatCard
          label="Laboratorios"
          value={stats.total_laboratorios}
          icon={FlaskConical}
          color="warning"
        />
        <StatCard
          label="Ocupación"
          value={`${stats.ocupacion_aulas}%`}
          icon={TrendingUp}
          color="danger"
        />
      </div>

      {/* Quick Actions */}
      <div className="card p-5 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Semestre</label>
            <input
              type="text"
              value={semestre}
              onChange={(e) => setSemestre(e.target.value)}
              className="input w-32"
              placeholder="2024-1"
            />
          </div>
          <button
            onClick={handleGenerar}
            disabled={generando}
            className="btn-primary flex items-center gap-2"
          >
            {generando ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Generar Horarios
              </>
            )}
          </button>
          <button
            onClick={() => navigate('/admin/horarios-general')}
            className="btn-secondary flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Ver Horarios
          </button>
          <button
            onClick={() => navigate('/admin/reportes')}
            className="btn-secondary flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            Reportes
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carga horaria por docente */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4.5 h-4.5 text-primary-600" />
            Carga Horaria por Docente
          </h2>
          {dataCargaDocente.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dataCargaDocente} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="nombre" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)',
                  }}
                />
                <Bar dataKey="horas" fill="#2563eb" radius={[4, 4, 0, 0]} name="Horas" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="Sin datos de carga horaria. Genere horarios primero." />
          )}
        </div>

        {/* Distribución Teoría vs Laboratorio */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <FlaskConical className="w-4.5 h-4.5 text-primary-600" />
            Distribución Teoría vs Laboratorio
          </h2>
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
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="Sin datos de distribución. Genere horarios primero." />
          )}
        </div>

        {/* Uso por ambiente */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-base font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <Building2 className="w-4.5 h-4.5 text-primary-600" />
            Uso por Ambiente (horas ocupadas)
          </h2>
          {dataUsoAmbiente.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dataUsoAmbiente} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="nombre" type="category" tick={{ fontSize: 12 }} width={100} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)',
                  }}
                />
                <Bar dataKey="horas" fill="#7c3aed" radius={[0, 4, 4, 0]} name="Horas ocupadas" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="Sin datos de uso de ambientes. Genere horarios primero." />
          )}
        </div>
      </div>
    </div>
  );
};

const colorMap = {
  primary: { bg: 'bg-primary-50', icon: 'text-primary-600', border: 'border-l-primary-500' },
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-l-indigo-500' },
  success: { bg: 'bg-success-50', icon: 'text-success-600', border: 'border-l-success-500' },
  warning: { bg: 'bg-warning-50', icon: 'text-warning-600', border: 'border-l-warning-500' },
  danger: { bg: 'bg-danger-50', icon: 'text-danger-600', border: 'border-l-danger-500' },
};

const StatCard = ({ label, value, icon: Icon, color }) => {
  const c = colorMap[color] || colorMap.primary;
  return (
    <div className={`card-hover p-4 border-l-4 ${c.border}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-neutral-500 font-medium">{label}</p>
        <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-neutral-900">{value}</p>
    </div>
  );
};

const EmptyChart = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-[300px] text-neutral-400 bg-neutral-50/50 rounded-lg border border-dashed border-neutral-200">
    <BarChart3 className="w-10 h-10 mb-3 text-neutral-300" />
    <p className="text-sm">{message}</p>
  </div>
);

const DashboardSkeleton = () => (
  <div className="animate-fade-in">
    <div className="mb-8">
      <div className="skeleton h-7 w-40 mb-2" />
      <div className="skeleton h-4 w-64" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="skeleton h-4 w-16" />
            <div className="skeleton w-9 h-9 rounded-lg" />
          </div>
          <div className="skeleton h-8 w-12" />
        </div>
      ))}
    </div>
    <div className="card p-5 mb-6">
      <div className="flex gap-3">
        <div className="skeleton h-10 w-32" />
        <div className="skeleton h-10 w-36" />
        <div className="skeleton h-10 w-28" />
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card p-5">
        <div className="skeleton h-5 w-48 mb-4" />
        <div className="skeleton h-[300px] w-full rounded-lg" />
      </div>
      <div className="card p-5">
        <div className="skeleton h-5 w-48 mb-4" />
        <div className="skeleton h-[300px] w-full rounded-lg" />
      </div>
    </div>
  </div>
);

export default Dashboard;
