import React, { useState, useEffect } from 'react';
import { Settings, Clock, Calendar, Save, CheckCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';

const DIAS_OPCIONES = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

const Configuracion = () => {
  const [config, setConfig] = useState({
    dias_habiles: ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'],
    hora_inicio: '07:00',
    hora_fin: '22:00',
    duracion_bloque: 120,
    semestre_activo: '2026-1',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/configuracion')
      .then((res) => {
        if (res.data?.data) {
          const data = res.data.data;
          setConfig((prev) => ({
            ...prev,
            ...data,
            // Ensure dias_habiles is always an array
            dias_habiles: Array.isArray(data.dias_habiles)
              ? data.dias_habiles
              : typeof data.dias_habiles === 'string'
                ? data.dias_habiles.split(',').filter(Boolean)
                : prev.dias_habiles,
          }));
        }
      })
      .catch((err) => {
        console.error('Error cargando configuracion:', err);
        setError('No se pudo cargar la configuración');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'duracion_bloque') {
      setConfig((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setConfig((prev) => ({ ...prev, [name]: value }));
    }
  };

  const toggleDia = (dia) => {
    setConfig((prev) => {
      const existe = prev.dias_habiles.includes(dia);
      const nuevos = existe
        ? prev.dias_habiles.filter((d) => d !== dia)
        : [...prev.dias_habiles, dia];
      return { ...prev, dias_habiles: nuevos };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const payload = {
        configuracion: {
          dias_habiles: config.dias_habiles.join(','),
          hora_inicio: config.hora_inicio,
          hora_fin: config.hora_fin,
          duracion_bloque: String(config.duracion_bloque),
          semestre_activo: config.semestre_activo,
        },
      };
      const res = await api.put('/configuracion', payload);
      if (res.data?.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        // Update local state with server response
        if (res.data?.data) {
          const data = res.data.data;
          setConfig((prev) => ({
            ...prev,
            ...data,
            dias_habiles: Array.isArray(data.dias_habiles)
              ? data.dias_habiles
              : typeof data.dias_habiles === 'string'
                ? data.dias_habiles.split(',').filter(Boolean)
                : prev.dias_habiles,
          }));
        }
      } else {
        setError(res.data?.message || 'Error al guardar');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error de conexión al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in max-w-2xl">
        <div className="skeleton h-7 w-56 mb-6" />
        <div className="card p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
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
        <p className="text-sm text-neutral-500 mt-1">Ajustes generales de horarios, bloques y semestre activo</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Semestre Activo */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            <Calendar className="w-3.5 h-3.5 inline mr-1.5 text-neutral-400" />
            Semestre Activo
          </label>
          <input
            type="text"
            name="semestre_activo"
            value={config.semestre_activo}
            onChange={handleChange}
            className="input w-full sm:w-48"
            placeholder="2026-1"
            pattern="^\d{4}-[12]$"
            required
          />
          <p className="text-xs text-neutral-500 mt-1.5">
            Formato: AAAA-1 (impar) o AAAA-2 (par). Determina qué ciclos están activos.
          </p>
        </div>

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
            {DIAS_OPCIONES.map((dia) => {
              const activo = config.dias_habiles.includes(dia);
              return (
                <button
                  key={dia}
                  type="button"
                  onClick={() => toggleDia(dia)}
                  className={`px-3 py-1.5 rounded-lg text-sm border font-medium transition-colors ${
                    activo
                      ? 'bg-primary-50 text-primary-700 border-primary-200'
                      : 'bg-neutral-50 text-neutral-400 border-neutral-200'
                  }`}
                >
                  {dia}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="text-sm text-danger-600 bg-danger-50 border border-danger-200 rounded-lg px-4 py-2.5">
            {error}
          </div>
        )}

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

export default Configuracion;
