import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Lock, Plus, Trash2, Clock, Calendar, AlertCircle } from 'lucide-react';

const DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

const MisRestricciones = () => {
  const { user } = useAuth();
  const [restricciones, setRestricciones] = useState([]);
  const [semestre, setSemestre] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ dia: 'Lunes', hora_inicio: '08:00', hora_fin: '10:00', motivo: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      // 1. Obtener la configuración primero
      const resConfig = await api.get('/configuracion');
      const semestreActivo = resConfig.data?.data?.semestre_activo || '2026-1';
      setSemestre(semestreActivo);

      // 2. Usar ese semestre para obtener las restricciones
      const res = await api.get('/docente/mis-restricciones', { params: { semestre: semestreActivo } });
      setRestricciones(res.data?.data || []);
    } catch (err) {
      console.error('Error cargando restricciones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar esta restricción?')) return;
    try {
      await api.delete(`/restricciones/${id}`);
      cargar();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/restricciones', { ...form, semestre });
      setForm({ dia: 'Lunes', hora_inicio: '08:00', hora_fin: '10:00', motivo: '' });
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear restricción');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton h-7 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="skeleton h-5 w-40 mb-4" />
            <div className="space-y-3">
              <div className="skeleton h-10 w-full" />
              <div className="grid grid-cols-2 gap-3">
                <div className="skeleton h-10 w-full" />
                <div className="skeleton h-10 w-full" />
              </div>
              <div className="skeleton h-10 w-full" />
              <div className="skeleton h-10 w-full" />
            </div>
          </div>
          <div className="card p-6">
            <div className="skeleton h-5 w-40 mb-4" />
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-14 w-full rounded-lg" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <Lock className="w-6 h-6 text-primary-600" />
          Mis Restricciones Horarias
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Define horarios en los que no estás disponible 
          {semestre && <span className="ml-2 text-neutral-400">· Semestre: {semestre}</span>}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary-600" />
            Agregar Restricción
          </h2>
          {error && (
            <div className="mb-4 px-4 py-3 bg-danger-50 text-danger-700 border border-danger-200 rounded-lg text-sm flex items-center gap-2 animate-slide-down">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1.5 text-neutral-400" />
                Día
              </label>
              <select
                value={form.dia}
                onChange={(e) => setForm({ ...form, dia: e.target.value })}
                className="input"
              >
                {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  <Clock className="w-3.5 h-3.5 inline mr-1.5 text-neutral-400" />
                  Hora inicio
                </label>
                <input
                  type="time"
                  value={form.hora_inicio}
                  onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  <Clock className="w-3.5 h-3.5 inline mr-1.5 text-neutral-400" />
                  Hora fin
                </label>
                <input
                  type="time"
                  value={form.hora_fin}
                  onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
                  className="input"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Motivo (opcional)</label>
              <input
                type="text"
                value={form.motivo}
                onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                className="input"
                placeholder="Ej: Reunión de facultad"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Agregar Restricción
                </>
              )}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary-600" />
            Restricciones Actuales
            {restricciones.length > 0 && (
              <span className="badge-primary ml-auto">{restricciones.length}</span>
            )}
          </h2>
          {restricciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <Lock className="w-10 h-10 mb-3 text-neutral-300" />
              <p className="text-sm">No tienes restricciones horarias registradas.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {restricciones.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200 group hover:border-neutral-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-warning-50 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-warning-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-800">{r.dia}</span>
                        <span className="text-sm text-neutral-500">
                          {r.hora_inicio?.slice(0, 5)} - {r.hora_fin?.slice(0, 5)}
                        </span>
                      </div>
                      {r.motivo && <p className="text-xs text-neutral-400 mt-0.5">{r.motivo}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => eliminar(r.id)}
                    className="p-2 rounded-lg text-neutral-400 hover:text-danger-600 hover:bg-danger-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="Eliminar restricción"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RefreshCw = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

export default MisRestricciones;