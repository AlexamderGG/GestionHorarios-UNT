import React, { useState, useEffect } from "react";
import api from "../../services/api";
import {
  Users,
  CheckCircle,
  AlertCircle,
  Filter,
  BarChart3,
} from "lucide-react";

const EstadoDocentes = () => {
  const [estado, setEstado] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("todos");
  const [semestre, setSemestre] = useState("2026-1");

  useEffect(() => {
    api
      .get("/configuracion")
      .then((res) => {
        if (res.data?.data?.semestre_activo) {
          setSemestre(res.data.data.semestre_activo);
        }
      })
      .catch((err) => console.error("Error cargando configuración:", err));
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .get("/horarios/estado-seleccion", { params: { semestre } })
      .then((res) => setEstado(res.data?.data || []))
      .catch((err) => console.error("Error:", err))
      .finally(() => setLoading(false));
  }, [semestre]);

  const completados = estado.filter((e) => e.completado).length;
  const pendientes = estado.length - completados;
  const porcentaje =
    estado.length > 0 ? Math.round((completados / estado.length) * 100) : 0;

  const filtrados =
    filtro === "pendientes"
      ? estado.filter((e) => !e.completado)
      : filtro === "completados"
        ? estado.filter((e) => e.completado)
        : estado;

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton h-7 w-64 mb-6" />
        <div className="card p-4 mb-6">
          <div className="flex gap-4">
            <div className="skeleton h-10 w-28" />
            <div className="skeleton h-10 w-40" />
          </div>
        </div>
        <div className="card p-5 mb-6">
          <div className="skeleton h-5 w-full mb-2" />
          <div className="skeleton h-3 w-full rounded-full" />
        </div>
        <div className="card">
          <div className="p-4">
            <div className="skeleton h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-primary-600" />
          Estado de Selección de Horarios
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Progreso de selección de horarios por docente
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Semestre
            </label>
            <input
              type="text"
              value={semestre}
              onChange={(e) => setSemestre(e.target.value)}
              className="input w-28"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Filtro
            </label>
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="input w-44"
            >
              <option value="todos">Todos ({estado.length})</option>
              <option value="completados">Completados ({completados})</option>
              <option value="pendientes">Pendientes ({pendientes})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-700 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary-600" />
            Progreso general
          </span>
          <span className="text-sm text-neutral-500">
            {completados} de {estado.length} docentes
          </span>
        </div>
        <div className="w-full bg-neutral-100 rounded-full h-2.5">
          <div
            className="bg-primary-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
        <p className="text-xs text-neutral-400 mt-1.5">
          {porcentaje}% completado
        </p>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="text-left p-3 text-xs font-semibold text-neutral-500 uppercase">
                  Docente
                </th>
                <th className="text-left p-3 text-xs font-semibold text-neutral-500 uppercase">
                  Email
                </th>
                <th className="text-left p-3 text-xs font-semibold text-neutral-500 uppercase">
                  Categoría
                </th>
                <th className="text-center p-3 text-xs font-semibold text-neutral-500 uppercase">
                  Asignaciones
                </th>
                <th className="text-center p-3 text-xs font-semibold text-neutral-500 uppercase">
                  Con Horario
                </th>
                <th className="text-center p-3 text-xs font-semibold text-neutral-500 uppercase">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((e) => (
                <tr
                  key={e.docente_id}
                  className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors"
                >
                  <td className="p-3 font-medium text-neutral-800">
                    {e.nombre}
                  </td>
                  <td className="p-3 text-neutral-500 text-xs font-mono">
                    {e.email}
                  </td>
                  <td className="p-3">
                    <span className="badge-primary">{e.categoria}</span>
                  </td>
                  <td className="p-3 text-center text-neutral-700">
                    {e.total_asignaciones}
                  </td>
                  <td className="p-3 text-center text-neutral-700">
                    {e.asignaciones_con_horario}
                  </td>
                  <td className="p-3 text-center">
                    {e.completado ? (
                      <span className="badge-success">
                        <CheckCircle className="w-3 h-3" />
                        Completado
                      </span>
                    ) : (
                      <span className="badge-warning">
                        <AlertCircle className="w-3 h-3" />
                        Pendiente
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-neutral-400">
                    No hay docentes para mostrar.
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

export default EstadoDocentes;
