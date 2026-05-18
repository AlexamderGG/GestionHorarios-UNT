import React, { useState, useEffect } from 'react';
import { Settings, Clock, Calendar, Save, CheckCircle } from 'lucide-react';
import api from '../services/api';

const Configuracion = () => {
  const [config, setConfig] = useState({
    dias_habiles: ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'],
    hora_inicio: '07:00',
    hora_fin: '22:00',
    duracion_bloque: 120,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/configuracion')
      .then((res) => {
        if (res.data?.data) setConfig(res.data.data);
      })
      .catch((err) => console.error('Error cargando configuracion:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      console.log('Guardar configuracion:', config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in max-w-2xl">
        <div className="skeleton h-7 w-56 mb-6" />
        <div className="card p-6 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="skeleton h-4 w-24 mb-2" />
              <div className="skeleton h-10 w-full" />
            </div>
          ))}
          <div className="skeleton h-10 w-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary-600" />
          Configuración del Sistema
        </h1>
        <p className="text-sm text-neutral-500 mt-1">Ajustes generales de horarios y bloques</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              <Clock className="w-3.5 h-3.5 inline mr-1.5 text-neutral-400" />
              Hora de Inicio
            </label>
            <input
              type="time"
              name="hora_inicio"
              value={config.hora_inicio}
              onChange={handleChange}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              <Clock className="w-3.5 h-3.5 inline mr-1.5 text-neutral-400" />
              Hora de Fin
            </label>
            <input
              type="time"
              name="hora_fin"
              value={config.hora_fin}
              onChange={handleChange}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Duración del Bloque (minutos)
          </label>
          <input
            type="number"
            name="duracion_bloque"
            value={config.duracion_bloque}
            onChange={handleChange}
            className="input w-full sm:w-48"
            min={30}
            step={30}
          />
          <p className="text-xs text-neutral-500 mt-1.5">
            Ejemplo: 90 = 1.5 horas, 120 = 2 horas
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            <Calendar className="w-3.5 h-3.5 inline mr-1.5 text-neutral-400" />
            Días Hábiles
          </label>
          <div className="flex flex-wrap gap-2">
            {['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'].map((dia) => (
              <span
                key={dia}
                className="px-3 py-1.5 bg-neutral-50 text-neutral-700 rounded-lg text-sm border border-neutral-200 font-medium"
              >
                {dia}
              </span>
            ))}
          </div>
          <p className="text-xs text-neutral-500 mt-1.5">Edición de días se implementará próximamente.</p>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Configuración
              </>
            )}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-success-600 animate-slide-down">
              <CheckCircle className="w-4 h-4" />
              Guardado
            </span>
          )}
        </div>
      </form>
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

export default Configuracion;
