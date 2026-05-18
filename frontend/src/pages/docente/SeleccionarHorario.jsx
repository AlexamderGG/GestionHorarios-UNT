import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];

const SeleccionarHorario = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedAsignacion = searchParams.get('asignacion_id');

  const [cursos, setCursos] = useState([]);
  const [config, setConfig] = useState(null);
  const [asignacionId, setAsignacionId] = useState(preselectedAsignacion || '');
  const [dia, setDia] = useState('Lunes');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [ambientes, setAmbientes] = useState([]);
  const [ambienteId, setAmbienteId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/docente/mis-cursos'),
      api.get('/configuracion'),
    ])
      .then(([resCursos, resConfig]) => {
        const todosCursos = resCursos.data?.data || [];
        setCursos(todosCursos.filter(c => !c.tiene_horario));
        setConfig(resConfig.data?.data || null);
      })
      .catch((err) => console.error('Error:', err))
      .finally(() => setLoading(false));
  }, []);

  const generarOpcionesHora = () => {
    if (!config) return [];
    const inicio = config.hora_inicio || '07:00';
    const fin = config.hora_fin || '22:00';
    const duracion = Number(config.duracion_bloque) || 120;
    const [hIni, mIni] = inicio.split(':').map(Number);
    const [hFin] = fin.split(':').map(Number);
    const opciones = [];
    for (let i = hIni * 60 + mIni; i + duracion <= hFin * 60; i += duracion) {
      const h = String(Math.floor(i / 60)).padStart(2, '0');
      const m = String(i % 60).padStart(2, '0');
      opciones.push(`${h}:${m}`);
    }
    return opciones;
  };

  const buscarAmbientes = async () => {
    if (!asignacionId || !dia || !horaInicio || !horaFin) {
      setAmbientes([]);
      return;
    }
    try {
      const res = await api.get('/docente/ambientes-disponibles', {
        params: { asignacion_id: asignacionId, dia, hora_inicio: horaInicio, hora_fin: horaFin },
      });
      setAmbientes(res.data?.data || []);
      setAmbienteId('');
    } catch (err) {
      console.error('Error buscando ambientes:', err);
      setAmbientes([]);
    }
  };

  useEffect(() => { buscarAmbientes(); }, [asignacionId, dia, horaInicio, horaFin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!asignacionId) { setError('Selecciona un curso'); return; }
    if (!horaInicio || !horaFin) { setError('Selecciona horario'); return; }

    setSaving(true);
    try {
      const asignacion = cursos.find(c => String(c.id) === String(asignacionId));
      const payload = {
        asignacion_id: Number(asignacionId),
        dia,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
      };
      if (asignacion?.tipo === 'Teoria') payload.aula_id = ambienteId ? Number(ambienteId) : undefined;
      else payload.laboratorio_id = ambienteId ? Number(ambienteId) : undefined;

      await api.post('/docente/seleccionar', payload);
      setSuccess('Horario seleccionado correctamente');
      setTimeout(() => navigate('/docente/horario'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al seleccionar horario');
    } finally {
      setSaving(false);
    }
  };

  const opcionesHora = generarOpcionesHora();
  const asignacionSeleccionada = cursos.find(c => String(c.id) === String(asignacionId));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Seleccionar Horario</h1>

      <div className="max-w-xl">
        <div className="bg-white rounded-lg shadow border border-neutral-200 p-6">
          {error && (
            <div className="mb-4 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">{error}</div>
          )}
          {success && (
            <div className="mb-4 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm">{success}</div>
          )}

          {cursos.length === 0 ? (
            <p className="text-neutral-400 text-center py-8">Todos tus cursos ya tienen horario asignado.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Curso</label>
                <select
                  value={asignacionId}
                  onChange={(e) => setAsignacionId(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar curso</option>
                  {cursos.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.curso_codigo} — {c.curso_nombre} ({c.tipo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Día</label>
                <select
                  value={dia}
                  onChange={(e) => setDia(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                >
                  {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Hora inicio</label>
                  <select
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Seleccionar</option>
                    {opcionesHora.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Hora fin</label>
                  <select
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Seleccionar</option>
                    {opcionesHora.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              {ambientes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {asignacionSeleccionada?.tipo === 'Teoria' ? 'Aula' : 'Laboratorio'}
                  </label>
                  <select
                    value={ambienteId}
                    onChange={(e) => setAmbienteId(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Automático (mejor disponible)</option>
                    {ambientes.map(a => (
                      <option key={a.id} value={a.id}>{a.codigo} — {a.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition font-medium"
              >
                {saving ? 'Guardando...' : 'Confirmar Horario'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeleccionarHorario;
