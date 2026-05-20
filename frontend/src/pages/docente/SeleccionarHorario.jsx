import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Clock, Calendar, MapPin, CheckCircle, AlertCircle, ArrowRight, ChevronDown } from 'lucide-react';

const DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];

const SeleccionarHorario = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedAsignacion = searchParams.get('asignacion_id');

  const [cursos, setCursos] = useState([]);
  const [config, setConfig] = useState(null);
  const [semestre, setSemestre] = useState('');
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

  // 1. Cargar datos secuencialmente: Configuración -> Cursos
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const resConfig = await api.get('/configuracion');
        const configData = resConfig.data?.data || null;
        setConfig(configData);
        
        const semestreActivo = configData?.semestre_activo || '2026-1';
        setSemestre(semestreActivo);

        const resCursos = await api.get('/docente/mis-cursos', { params: { semestre: semestreActivo } });
        const todosCursos = resCursos.data?.data || [];
        setCursos(todosCursos.filter(c => !c.tiene_horario));
      } catch (err) {
        console.error('Error inicializando Seleccionar Horario:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
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

  const buscarAmbientes = useCallback(async () => {
    if (!asignacionId || !dia || !horaInicio || !horaFin || !semestre) {
      setAmbientes([]);
      return;
    }
    try {
      const res = await api.get('/docente/ambientes-disponibles', {
        params: { asignacion_id: asignacionId, dia, hora_inicio: horaInicio, hora_fin: horaFin, semestre },
      });
      setAmbientes(res.data?.data || []);
      setAmbienteId('');
    } catch (err) {
      console.error('Error buscando ambientes:', err);
      setAmbientes([]);
    }
  }, [asignacionId, dia, horaInicio, horaFin, semestre]);

  useEffect(() => { buscarAmbientes(); }, [buscarAmbientes]);

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

  const calcularHoraFin = (inicio) => {
    if (!inicio || !asignacionSeleccionada) return '';
    const [h, m] = inicio.split(':').map(Number);
    const horasCurso = asignacionSeleccionada.tipo === 'Teoria'
      ? (Number(asignacionSeleccionada.curso_horas_aula) || 0)
      : (Number(asignacionSeleccionada.curso_horas_lab) || 0);
    const totalMinutos = h * 60 + m + horasCurso * 60;
    const hf = String(Math.floor(totalMinutos / 60)).padStart(2, '0');
    const mf = String(totalMinutos % 60).padStart(2, '0');
    return `${hf}:${mf}`;
  };

  if (loading) {
    return (
      <div className="animate-fade-in max-w-xl">
        <div className="skeleton h-7 w-44 mb-6" />
        <div className="card p-6 space-y-4">
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-full" />
          <div className="grid grid-cols-2 gap-3">
            <div className="skeleton h-10 w-full" />
            <div className="skeleton h-10 w-full" />
          </div>
          <div className="skeleton h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary-600" />
          Seleccionar Horario
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Elige día, horario y ambiente para tu curso
          {semestre && <span className="ml-2 text-neutral-400">· Semestre: {semestre}</span>}
        </p>
      </div>

      <div className="card p-6">
        {error && (
          <div className="mb-5 px-4 py-3 bg-danger-50 text-danger-700 border border-danger-200 rounded-lg text-sm flex items-center gap-2 animate-slide-down">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-5 px-4 py-3 bg-success-50 text-success-700 border border-success-200 rounded-lg text-sm flex items-center gap-2 animate-slide-down">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {success}
          </div>
        )}

        {cursos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
            <CheckCircle className="w-10 h-10 mb-3 text-success-400" />
            <p className="text-sm">Todos tus cursos ya tienen horario asignado en este semestre.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Curso</label>
              <select
                value={asignacionId}
                onChange={(e) => setAsignacionId(e.target.value)}
                className="input"
              >
                <option value="">Seleccionar curso</option>
                {cursos.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.curso_codigo} — {c.curso_nombre} ({c.tipo})
                    {c.tipo === 'Teoria'
                      ? (c.curso_horas_aula ? ` · ${c.curso_horas_aula}h` : '')
                      : (c.curso_horas_lab ? ` · ${c.curso_horas_lab}h` : '')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1.5 text-neutral-400" />
                Día
              </label>
              <select
                value={dia}
                onChange={(e) => setDia(e.target.value)}
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
                <select
                  value={horaInicio}
                  onChange={(e) => {
                    const val = e.target.value;
                    setHoraInicio(val);
                    setHoraFin(calcularHoraFin(val));
                  }}
                  className="input"
                >
                  <option value="">Seleccionar</option>
                  {opcionesHora.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  <Clock className="w-3.5 h-3.5 inline mr-1.5 text-neutral-400" />
                  Hora fin
                </label>
                <select
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className="input"
                >
                  <option value="">Seleccionar</option>
                  {opcionesHora.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            {ambientes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 inline mr-1.5 text-neutral-400" />
                  {asignacionSeleccionada?.tipo === 'Teoria' ? 'Aula' : 'Laboratorio'}
                </label>
                <select
                  value={ambienteId}
                  onChange={(e) => setAmbienteId(e.target.value)}
                  className="input"
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
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Confirmar Horario
                </>
              )}
            </button>
          </form>
        )}
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

export default SeleccionarHorario;