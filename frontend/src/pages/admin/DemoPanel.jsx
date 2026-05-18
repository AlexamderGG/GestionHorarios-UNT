import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { PlayCircle, ToggleLeft, ToggleRight, Clock, SkipForward, RotateCcw, Users, Settings } from 'lucide-react';

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
      await api.put('/configuracion', { configuracion: { demo_mode: String(!estado?.demo_mode) } });
      cargarEstado();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const toggleSeleccion = async () => {
    try {
      await api.put('/configuracion', { configuracion: { seleccion_abierta: String(!estado?.seleccion_abierta) } });
      cargarEstado();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const guardarStep = async () => {
    try {
      await api.put('/configuracion', { configuracion: { demo_step_minutes: String(stepMinutes) } });
      cargarEstado();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const avanzarTurno = async () => {
    try {
      await api.post('/demo/avanzar-turno');
      cargarEstado();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const resetear = async () => {
    try {
      await api.post('/demo/reset');
      cargarEstado();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton h-7 w-36 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {[...Array(3)].map((_, i) => <div key={i} className="card p-5"><div className="skeleton h-20 w-full rounded-lg" /></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <PlayCircle className="w-6 h-6 text-primary-600" />
          Panel de Demo
        </h1>
        <p className="text-sm text-neutral-500 mt-1">Control del modo demostración y turnos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <ToggleCard
          label="Modo Demo"
          active={estado?.demo_mode}
          onToggle={toggleDemo}
        />
        <ToggleCard
          label="Selección Abierta"
          active={estado?.seleccion_abierta}
          onToggle={toggleSeleccion}
        />
        <div className="card p-5">
          <h3 className="text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-400" />
            Minutos por Turno
          </h3>
          <div className="flex gap-2">
            <input
              type="number"
              value={stepMinutes}
              min={1}
              onChange={(e) => setStepMinutes(Number(e.target.value))}
              className="input flex-1"
            />
            <button onClick={guardarStep} className="btn-primary px-3">
              OK
            </button>
          </div>
        </div>
      </div>

      {estado?.demo_mode && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="text-base font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <SkipForward className="w-4.5 h-4.5 text-primary-600" />
              Control de Turnos
            </h3>
            <div className="text-center mb-5">
              <p className="text-4xl font-bold text-primary-700">Turno {estado.demo_turno_actual}</p>
              {turnos?.turnoActual && (
                <p className="text-neutral-600 mt-1">
                  <span className="font-medium">{turnos.turnoActual.nombre}</span>
                  <span className="text-neutral-400 text-sm ml-1">({turnos.turnoActual.categoria})</span>
                </p>
              )}
              <p className="text-xs text-neutral-400 mt-1">de {turnos?.totalTurnos || 0} turnos totales</p>
            </div>
            <div className="flex gap-2">
              <button onClick={avanzarTurno} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <SkipForward className="w-4 h-4" />
                Avanzar Turno
              </button>
              <button onClick={resetear} className="btn-secondary flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-base font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-primary-600" />
              Lista de Turnos
            </h3>
            <div className="max-h-80 overflow-y-auto space-y-1">
              {turnos?.turnos?.map((t) => (
                <div
                  key={t.turno}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors ${
                    t.turno === estado.demo_turno_actual
                      ? 'bg-primary-50 border border-primary-200'
                      : t.turno < estado.demo_turno_actual
                      ? 'bg-neutral-50 text-neutral-400'
                      : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-neutral-400 w-6">#{t.turno}</span>
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

const ToggleCard = ({ label, active, onToggle }) => (
  <div className="card p-5">
    <h3 className="text-sm font-medium text-neutral-700 mb-3">{label}</h3>
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
        active
          ? 'bg-success-500 text-white hover:bg-success-600'
          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
      }`}
    >
      {active ? (
        <>
          <ToggleRight className="w-5 h-5" />
          Activo
        </>
      ) : (
        <>
          <ToggleLeft className="w-5 h-5" />
          Inactivo
        </>
      )}
    </button>
  </div>
);

export default DemoPanel;
