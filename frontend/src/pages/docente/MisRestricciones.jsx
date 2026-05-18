import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

const MisRestricciones = () => {
  const { user } = useAuth();
  const [restricciones, setRestricciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ dia: 'Lunes', hora_inicio: '08:00', hora_fin: '10:00', motivo: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const cargar = () => {
    api.get('/docente/mis-restricciones')
      .then((res) => setRestricciones(res.data?.data || []))
      .catch((err) => console.error('Error:', err))
      .finally(() => setLoading(false));
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
      await api.post('/restricciones', form);
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
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Mis Restricciones Horarias</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4">Agregar Restricción</h2>
          {error && (
            <div className="mb-4 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Día</label>
              <select
                value={form.dia}
                onChange={(e) => setForm({ ...form, dia: e.target.value })}
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
              >
                {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Hora inicio</label>
                <input
                  type="time"
                  value={form.hora_inicio}
                  onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Hora fin</label>
                <input
                  type="time"
                  value={form.hora_fin}
                  onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Motivo (opcional)</label>
              <input
                type="text"
                value={form.motivo}
                onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Ej: Reunión de facultad"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition font-medium"
            >
              {saving ? 'Guardando...' : 'Agregar Restricción'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-800 mb-4">Restricciones Actuales</h2>
          {restricciones.length === 0 ? (
            <p className="text-neutral-400 text-sm">No tienes restricciones horarias registradas.</p>
          ) : (
            <div className="space-y-2">
              {restricciones.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div>
                    <span className="font-medium text-sm text-neutral-800">{r.dia}</span>
                    <span className="text-neutral-500 text-sm ml-2">{r.hora_inicio?.slice(0, 5)} - {r.hora_fin?.slice(0, 5)}</span>
                    {r.motivo && <p className="text-xs text-neutral-400 mt-0.5">{r.motivo}</p>}
                  </div>
                  <button
                    onClick={() => eliminar(r.id)}
                    className="text-red-500 hover:text-red-700 text-xs font-medium"
                  >
                    Eliminar
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

export default MisRestricciones;
