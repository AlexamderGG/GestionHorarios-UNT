import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Configuracion = () => {
  const [config, setConfig] = useState({
    dias_habiles: ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'],
    hora_inicio: '07:00',
    hora_fin: '22:00',
    duracion_bloque: 120,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Modulo 1 / Modulo 3 - Conectar con endpoint real de configuracion
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

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Modulo 1 - Conectar con PUT /api/configuracion
    console.log('Guardar configuracion:', config);
    alert('Configuración guardada (mock)');
  };

  if (loading) {
    return <div className="text-center py-10 text-neutral-500">Cargando configuración...</div>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Configuración del Sistema</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow border border-neutral-200 space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Hora de Inicio</label>
          <input
            type="time"
            name="hora_inicio"
            value={config.hora_inicio}
            onChange={handleChange}
            className="w-full border border-neutral-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Hora de Fin</label>
          <input
            type="time"
            name="hora_fin"
            value={config.hora_fin}
            onChange={handleChange}
            className="w-full border border-neutral-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Duración del Bloque (minutos)</label>
          <input
            type="number"
            name="duracion_bloque"
            value={config.duracion_bloque}
            onChange={handleChange}
            className="w-full border border-neutral-300 rounded px-3 py-2"
            min={30}
            step={30}
          />
          <p className="text-xs text-neutral-500 mt-1">Ejemplo: 90 = 1.5 horas, 120 = 2 horas</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Días Hábiles</label>
          <div className="flex flex-wrap gap-2">
            {['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'].map((dia) => (
              <span key={dia} className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm border border-neutral-200">
                {dia}
              </span>
            ))}
          </div>
          <p className="text-xs text-neutral-500 mt-1">Edición de días se implementará en el Módulo 1.</p>
        </div>
        <div className="pt-4">
          <button
            type="submit"
            className="px-6 py-2 bg-primary-600 text-white font-medium rounded hover:bg-primary-700 transition"
          >
            Guardar Configuración
          </button>
        </div>
      </form>
    </div>
  );
};

export default Configuracion;
