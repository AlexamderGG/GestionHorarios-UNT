import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const DemoPanel = () => {
  const [estado, setEstado] = useState(null);
  const [turnos, setTurnos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stepMinutes, setStepMinutes] = useState(15);

  const cargarEstado = async () => {
    try {
      const res = await api.get('/demo/estado');
      const data = res.data?.data;
      setEstado(data?.config || null);
      setTurnos(data?.turnos || null);
      if (data?.config?.demo_step_minutes) setStepMinutes(data.config.demo_step_minutes);
    } catch (err) {
      console.error('Error cargando demo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarEstado(); }, []);

  const toggleDemo = async () => {
    try {
      await api.put('/configuracion', {
        configuracion: { demo_mode: String(!estado?.demo_mode) },
      });
      cargarEstado();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const toggleSeleccion = async () => {
    try {
      await api.put('/configuracion', {
        configuracion: { seleccion_abierta: String(!estado?.seleccion_abierta) },
      });
      cargarEstado();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const guardarStep = async () => {
    try {
      await api.put('/configuracion', {
        configuracion: { demo_step_minutes: String(stepMinutes) },
      });
      cargarEstado();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const avanzarTurno = async () => {
    try {
      await api.post('/demo/avanzar-turno');
      cargarEstado();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const resetear = async () => {
    try {
      await api.post('/demo/reset');
      cargarEstado();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
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
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Panel de Demo</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow border border-neutral-200 p-5">
          <h3 className="text-sm font-medium text-neutral-700 mb-3">Modo Demo</h3>
          <button onClick={toggleDemo}
            className={`w-full py-2 rounded-lg text-sm font-medium transition ${
              estado?.demo_mode
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
            }`}>
            {estado?.demo_mode ? 'Activo' : 'Inactivo'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow border border-neutral-200 p-5">
          <h3 className="text-sm font-medium text-neutral-700 mb-3">Selección Abierta</h3>
          <button onClick={toggleSeleccion}
            className={`w-full py-2 rounded-lg text-sm font-medium transition ${
              estado?.seleccion_abierta
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
            }`}>
            {estado?.seleccion_abierta ? 'Abierta' : 'Cerrada'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow border border-neutral-200 p-5">
          <h3 className="text-sm font-medium text-neutral-700 mb-3">Minutos por Turno</h3>
          <div className="flex gap-2">
            <input type="number" value={stepMinutes} min={1}
              onChange={(e) => setStepMinutes(Number(e.target.value))}
              className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm w-20" />
            <button onClick={guardarStep}
              className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
              OK
            </button>
          </div>
        </div>
      </div>

      {estado?.demo_mode && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow border border-neutral-200 p-5">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Control de Turnos</h3>
            <div className="text-center mb-4">
              <p className="text-3xl font-bold text-primary-700">Turno {estado.demo_turno_actual}</p>
              {turnos?.turnoActual && (
                <p className="text-neutral-600 mt-1">
                  <span className="font-medium">{turnos.turnoActual.nombre}</span>
                  <span className="text-neutral-400 text-sm ml-1">({turnos.turnoActual.categoria})</span>
                </p>
              )}
              <p className="text-xs text-neutral-400 mt-1">de {turnos?.totalTurnos || 0} turnos totales</p>
            </div>
            <div className="flex gap-2">
              <button onClick={avanzarTurno}
                className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
                Avanzar Turno
              </button>
              <button onClick={resetear}
                className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 text-sm">
                Reset
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border border-neutral-200 p-5">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Lista de Turnos</h3>
            <div className="max-h-80 overflow-y-auto space-y-1">
              {turnos?.turnos?.map((t) => (
                <div key={t.turno}
                  className={`flex items-center justify-between p-2 rounded text-sm ${
                    t.turno === estado.demo_turno_actual
                      ? 'bg-primary-50 border border-primary-200'
                      : t.turno < estado.demo_turno_actual
                      ? 'bg-neutral-50 text-neutral-400'
                      : ''
                  }`}>
                  <div>
                    <span className="font-mono text-xs text-neutral-400 mr-2">#{t.turno}</span>
                    <span className={t.turno === estado.demo_turno_actual ? 'font-semibold text-primary-800' : ''}>
                      {t.nombre}
                    </span>
                  </div>
                  <span className="text-xs text-neutral-400">{t.categoria}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoPanel;
