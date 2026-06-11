import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Users,
  BookOpen,
  Building2,
  FlaskConical,
  BarChart3,
  Calendar,
  FileDown,
  TrendingUp,
  X,
} from "lucide-react";
import api from "../services/api";

const COLORS = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#16a34a",
  "#0891b2",
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_docentes: 0,
    total_cursos: 0,
    total_aulas: 0,
    total_laboratorios: 0,
    ocupacion_aulas: 0,
    distribucion_teoria_lab: { teoria: 0, practica: 0, laboratorio: 0 },
    carga_por_docente: [],
    uso_por_ambiente: [],
  });
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const [semestre, setSemestre] = useState("");

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        // 1. Obtenemos estrictamente el semestre de la configuración
        const resConf = await api.get("/configuracion");
        const semestreActivo = resConf.data?.data?.semestre_activo || "2026-1";
        setSemestre(semestreActivo);

        // 2. Pedimos las estadísticas filtradas SOLO por ese semestre
        const resStats = await api.get("/estadisticas", {
          params: { semestre: semestreActivo }
        });
        
        if (resStats.data?.data) {
          setStats(resStats.data.data);
        }
      } catch (err) {
        console.error("Error cargando el dashboard:", err);
        setMensaje({ tipo: "error", texto: "Error al cargar las estadísticas del semestre." });
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const dataCargaDocente = (stats.carga_por_docente || []).map((d) => ({
    nombre: d.nombre || d.docente || `Docente ${d.docente_id}`,
    horas: Number(d.horas || 0),
  }));

  const dataDistribucion = [
    {
      name: "Teoría",
      value: Number(stats.distribucion_teoria_lab?.teoria || 0),
    },
    {
      name:"Práctica",
      value: Number(stats.distribucion_teoria_lab?.practica || 0),
    },
    {
      name: "Laboratorio",
      value: Number(stats.distribucion_teoria_lab?.laboratorio || 0),
    },
  ];

  const dataUsoAmbiente = (stats.uso_por_ambiente || []).map((a) => ({
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
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Resumen general del sistema de horarios
          </p>
        </div>
        {mensaje && (
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium animate-slide-down ${
              mensaje.tipo === "exito"
                ? "bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-400 border-success-200 dark:border-success-800/50"
                : "bg-danger-50 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400 border-danger-200 dark:border-danger-800/50"
            }`}
          >
            <span className="flex-1">{mensaje.texto}</span>
            <button
              onClick={() => setMensaje(null)}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Docentes" value={stats.total_docentes} icon={Users} color="primary" />
        <StatCard label="Cursos" value={stats.total_cursos} icon={BookOpen} color="indigo" />
        <StatCard label="Aulas" value={stats.total_aulas} icon={Building2} color="success" />
        <StatCard label="Laboratorios" value={stats.total_laboratorios} icon={FlaskConical} color="warning" />
        <StatCard label="Ocupación" value={`${stats.ocupacion_aulas}%`} icon={TrendingUp} color="danger" />
      </div>

      {/* Quick Actions & Semestre */}
      <div className="card p-5 mb-6 dark:bg-neutral-800 dark:border-neutral-700">
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-4 py-2 rounded-lg border border-primary-200 dark:border-primary-800/50 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-bold">Semestre Activo: {semestre}</span>
          </div>

          <button
            onClick={() => navigate("/admin/horarios")}
            className="btn-primary flex items-center gap-2 ml-auto sm:ml-0"
          >
            <Calendar className="w-4 h-4" />
            Ver Horarios
          </button>
          <button
            onClick={() => navigate("/admin/reportes")}
            className="btn-secondary flex items-center gap-2 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            <FileDown className="w-4 h-4" />
            Reportes
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carga horaria por docente */}
        <div className="card p-5 dark:bg-neutral-800 dark:border-neutral-700">
          <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4.5 h-4.5 text-primary-600 dark:text-primary-400" />
            Carga Horaria por Docente
          </h2>
          {dataCargaDocente.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={dataCargaDocente}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.2} />
                <XAxis
                  dataKey="nombre"
                  tick={{ fill: "currentColor", fontSize: 11 }}
                  className="text-neutral-500 dark:text-neutral-400"
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fill: "currentColor", fontSize: 12 }} 
                  className="text-neutral-500 dark:text-neutral-400" 
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.2)",
                    backgroundColor: "var(--tw-colors-neutral-900, #171717)",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
                <Bar
                  dataKey="horas"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                  name="Horas"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="Sin datos de carga horaria en este semestre." />
          )}
        </div>

        {/* Distribución Teoría vs Práctica vs Laboratorio */}
        <div className="card p-5 dark:bg-neutral-800 dark:border-neutral-700">
          <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
            <FlaskConical className="w-4.5 h-4.5 text-primary-600 dark:text-primary-400" />
            Distribución Teoría vs Práctica vs Laboratorio
          </h2>
          {dataDistribucion.some((d) => d.value > 0) ? (
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
                  labelLine={{ stroke: "currentColor" }}
                  className="text-neutral-700 dark:text-neutral-300"
                >
                  {dataDistribucion.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.2)",
                    backgroundColor: "var(--tw-colors-neutral-900, #171717)",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
                <Legend wrapperStyle={{ color: "currentColor" }} className="text-neutral-600 dark:text-neutral-400" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="Sin datos de distribución en este semestre." />
          )}
        </div>

        {/* Uso por ambiente */}
        <div className="card p-5 lg:col-span-2 dark:bg-neutral-800 dark:border-neutral-700">
          <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
            <Building2 className="w-4.5 h-4.5 text-primary-600 dark:text-primary-400" />
            Uso por Ambiente (horas ocupadas)
          </h2>
          {dataUsoAmbiente.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={dataUsoAmbiente}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.2} />
                <XAxis 
                  type="number" 
                  tick={{ fill: "currentColor", fontSize: 12 }} 
                  className="text-neutral-500 dark:text-neutral-400" 
                />
                <YAxis
                  dataKey="nombre"
                  type="category"
                  tick={{ fill: "currentColor", fontSize: 12 }}
                  className="text-neutral-500 dark:text-neutral-400"
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.2)",
                    backgroundColor: "var(--tw-colors-neutral-900, #171717)",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
                <Bar
                  dataKey="horas"
                  fill="#7c3aed"
                  radius={[0, 4, 4, 0]}
                  name="Horas ocupadas"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="Sin datos de uso de ambientes en este semestre." />
          )}
        </div>
      </div>
    </div>
  );
};

const colorMap = {
  primary: { bg: "bg-primary-50 dark:bg-primary-900/30", icon: "text-primary-600 dark:text-primary-400", border: "border-l-primary-500 dark:border-l-primary-400" },
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-900/30", icon: "text-indigo-600 dark:text-indigo-400", border: "border-l-indigo-500 dark:border-l-indigo-400" },
  success: { bg: "bg-success-50 dark:bg-success-900/30", icon: "text-success-600 dark:text-success-400", border: "border-l-success-500 dark:border-l-success-400" },
  warning: { bg: "bg-warning-50 dark:bg-warning-900/30", icon: "text-warning-600 dark:text-warning-400", border: "border-l-warning-500 dark:border-l-warning-400" },
  danger: { bg: "bg-danger-50 dark:bg-danger-900/30", icon: "text-danger-600 dark:text-danger-400", border: "border-l-danger-500 dark:border-l-danger-400" },
};

const StatCard = ({ label, value, icon: Icon, color }) => {
  const c = colorMap[color] || colorMap.primary;
  return (
    <div className={`card-hover dark:bg-neutral-800 dark:border-neutral-700 p-4 border-l-4 ${c.border}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">{label}</p>
        <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
    </div>
  );
};

const EmptyChart = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-[300px] text-neutral-400 dark:text-neutral-500 bg-neutral-50/50 dark:bg-neutral-800/50 rounded-lg border border-dashed border-neutral-200 dark:border-neutral-700">
    <BarChart3 className="w-10 h-10 mb-3 text-neutral-300 dark:text-neutral-600" />
    <p className="text-sm">{message}</p>
  </div>
);

const DashboardSkeleton = () => (
  <div className="animate-fade-in">
    <div className="mb-8">
      <div className="skeleton h-7 w-40 mb-2 dark:opacity-20" />
      <div className="skeleton h-4 w-64 dark:opacity-20" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="card p-4 dark:bg-neutral-800 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-3">
            <div className="skeleton h-4 w-16 dark:opacity-20" />
            <div className="skeleton w-9 h-9 rounded-lg dark:opacity-20" />
          </div>
          <div className="skeleton h-8 w-12 dark:opacity-20" />
        </div>
      ))}
    </div>
    <div className="card p-5 mb-6 dark:bg-neutral-800 dark:border-neutral-700">
      <div className="flex gap-3">
        <div className="skeleton h-10 w-36 dark:opacity-20" />
        <div className="skeleton h-10 w-28 dark:opacity-20" />
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card p-5 dark:bg-neutral-800 dark:border-neutral-700">
        <div className="skeleton h-5 w-48 mb-4 dark:opacity-20" />
        <div className="skeleton h-[300px] w-full rounded-lg dark:opacity-20" />
      </div>
      <div className="card p-5 dark:bg-neutral-800 dark:border-neutral-700">
        <div className="skeleton h-5 w-48 mb-4 dark:opacity-20" />
        <div className="skeleton h-[300px] w-full rounded-lg dark:opacity-20" />
      </div>
    </div>
  </div>
);

export default Dashboard;