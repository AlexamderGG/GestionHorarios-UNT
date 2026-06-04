import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Clock, Calendar, MapPin, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

// Función utilitaria
const timeToMinutes = (t) => {
  if (!t) return 0;
  const [h, m] = String(t).slice(0, 5).split(':').map(Number);
  return h * 60 + m;
};

const SeleccionarHorario = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedAsignacion = searchParams.get('asignacion_id');

  // Estados
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
  const [horariosGlobales, setHorariosGlobales] = useState([]);

  // Variables calculadas de configuración
  const DIAS = config?.dias_habiles 
    ? (Array.isArray(config.dias_habiles) ? config.dias_habiles : config.dias_habiles.split(','))
    : ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];

  // Carga inicial (Configuración, Cursos pendientes y Horarios de todos)
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const resConfig = await api.get('/configuracion');
        const configData = resConfig.data?.data || null;
        setConfig(configData);
        
        const semestreActivo = configData?.semestre_activo || '2026-1';
        setSemestre(semestreActivo);

        const [resCursos, resHorarios] = await Promise.all([
          api.get('/docente/mis-cursos', { params: { semestre: semestreActivo } }),
          api.get('/horarios', { params: { semestre: semestreActivo } })
        ]);

        const todosCursos = resCursos.data?.data || [];
        setCursos(todosCursos.filter(c => !c.tiene_horario));
        setHorariosGlobales(resHorarios.data?.data || []);
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

  const calcularHoraFin = (inicio, asig) => {
    const asigRef = asig || asignacionSeleccionada;
    if (!inicio || !asigRef) return "";
    
    const [h, m] = inicio.split(':').map(Number);
    
    // CORRECCIÓN 1: Priorizar 'horas_asignadas' y tener fallbacks sólidos
    let horasAsignadas = Number(asigRef.horas_asignadas || 0);
    
    if (horasAsignadas === 0) {
      if (asigRef.tipo === 'Teoria' || asigRef.tipo === 'Practica') {
        horasAsignadas = Number(asigRef.curso_horas_aula || asigRef.curso_horas_t || asigRef.curso_horas_p || 0);
      } else if (asigRef.tipo === 'Laboratorio') {
        horasAsignadas = Number(asigRef.curso_horas_lab || asigRef.curso_horas_l || 0);
      }
    }
    
    if (horasAsignadas === 0) return "";
    
    const totalMinutos = (h * 60) + m + (horasAsignadas * 60);
    const hf = String(Math.floor(totalMinutos / 60)).padStart(2, '0');
    const mf = String(totalMinutos % 60).padStart(2, '0');
    
    return `${hf}:${mf}`;
  };

  // VALIDACIÓN INTELIGENTE (REGLA 50/50) PARA EL DOCENTE
  const verificarConflicto = (horaIniPropuesta) => {
    if (!asignacionSeleccionada || !dia) return null;
    const horaFinPropuesta = calcularHoraFin(horaIniPropuesta);
    if (!horaFinPropuesta) return null;

    const iniPropuestoMin = timeToMinutes(horaIniPropuesta);
    const finPropuestoMin = timeToMinutes(horaFinPropuesta);
    
    // Validar hora de cierre
    const limiteFinMin = timeToMinutes(config?.hora_fin || '22:00');
    if (finPropuestoMin > limiteFinMin) return `Excede cierre (${config.hora_fin})`;

    const cicloModal = asignacionSeleccionada.curso_ciclo || asignacionSeleccionada.ciclo;
    const isIncomingException = (asignacionSeleccionada.curso_codigo || '').startsWith('EL-') || asignacionSeleccionada.tipo === 'Laboratorio';
    
    let overlapsCount = 0;

    for (const h of horariosGlobales) {
      if (h.dia === dia) {
        const hIniMin = timeToMinutes(h.hora_inicio);
        const hFinMin = timeToMinutes(h.hora_fin);

        if (iniPropuestoMin < hFinMin && finPropuestoMin > hIniMin) {
          // 1. Conflicto Docente (siempre bloqueante)
          const hDocenteId = h.docente?.id || h.docente_id;
          if (String(hDocenteId) === String(user?.id)) {
            return "Cruza con tu horario";
          }

          // 2. Conflicto de Ciclo con Regla 50/50
          const cicloH = h.curso?.ciclo || h.ciclo;
          
          // CORRECCIÓN 2: Asegurar que ambos ciclos existen antes de compararlos
          if (cicloModal && cicloH && String(cicloModal) !== "0" && String(cicloH) === String(cicloModal)) {
            const isExistingException = (h.curso?.codigo || h.curso_codigo || '').startsWith('EL-') || h.tipo === 'Laboratorio' || h.tipo_asignacion === 'Laboratorio';
            
            if (!isIncomingException || !isExistingException) {
              return `Cruce regular Ciclo ${cicloModal}`;
            }
            overlapsCount++;
          }
        }
      }
    }
    
    if (overlapsCount >= 2) return `Ciclo ${cicloModal} lleno`;
    return null; 
  };

  if (loading) {
    return (
      <div className="animate-fade-in max-w-xl">
        <div className="skeleton h-7 w-44 mb-6 dark:opacity-20" />
        <div className="card p-6 space-y-4 dark:bg-neutral-800 dark:border-neutral-700">
          <div className="skeleton h-10 w-full dark:opacity-20" />
          <div className="skeleton h-10 w-full dark:opacity-20" />
          <div className="grid grid-cols-2 gap-3">
            <div className="skeleton h-10 w-full dark:opacity-20" />
            <div className="skeleton h-10 w-full dark:opacity-20" />
          </div>
          <div className="skeleton h-10 w-full dark:opacity-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          Seleccionar Horario
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Elige día, horario y ambiente para tu curso
          {semestre && <span className="ml-2 text-neutral-400 dark:text-neutral-500">· Semestre: {semestre}</span>}
        </p>
      </div>

      <div className="card p-6 dark:bg-neutral-800 dark:border-neutral-700">
        {error && (
          <div className="mb-5 px-4 py-3 bg-danger-50 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400 border border-danger-200 dark:border-danger-800/50 rounded-lg text-sm flex items-center gap-2 animate-slide-down">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-5 px-4 py-3 bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-400 border border-success-200 dark:border-success-800/50 rounded-lg text-sm flex items-center gap-2 animate-slide-down">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {success}
          </div>
        )}

        {cursos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-400 dark:text-neutral-500">
            <CheckCircle className="w-10 h-10 mb-3 text-success-400 dark:text-success-500" />
            <p className="text-sm">Todos tus cursos ya tienen horario asignado en este semestre.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Curso</label>
              <select
                value={asignacionId}
                onChange={(e) => {
                  setAsignacionId(e.target.value);
                  setHoraInicio('');
                  setHoraFin('');
                }}
                className="input dark:bg-neutral-900 dark:border-neutral-700 dark:text-white"
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
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1.5 text-neutral-400 dark:text-neutral-500" />
                Día
              </label>
              <select
                value={dia}
                onChange={(e) => {
                  setDia(e.target.value);
                  setHoraInicio('');
                  setHoraFin('');
                }}
                className="input dark:bg-neutral-900 dark:border-neutral-700 dark:text-white"
                disabled={!asignacionId}
              >
                {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  <Clock className="w-3.5 h-3.5 inline mr-1.5 text-neutral-400 dark:text-neutral-500" />
                  Hora inicio
                </label>
                <select
                  value={horaInicio}
                  onChange={(e) => {
                    const val = e.target.value;
                    setHoraInicio(val);
                    setHoraFin(calcularHoraFin(val));
                  }}
                  className="input w-full font-medium dark:bg-neutral-900 dark:border-neutral-700 dark:text-white disabled:opacity-50"
                  disabled={!asignacionId}
                >
                  <option value="">{asignacionId ? "Seleccionar" : "Elija curso primero"}</option>
                  {opcionesHora.map((h) => {
                    const conflicto = verificarConflicto(h);
                    return (
                      <option key={h} value={h} disabled={!!conflicto}>
                        {h} {conflicto ? ` - (${conflicto})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-500 mb-1.5 text-neutral-400 dark:text-neutral-500">
                  <Clock className="w-3.5 h-3.5 inline mr-1.5" />
                  Hora fin (Auto)
                </label>
                <input
                  type="text"
                  value={horaFin || "Automático"}
                  className="input bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-semibold cursor-not-allowed border-transparent dark:border-neutral-700"
                  disabled
                />
              </div>
            </div>

            {ambientes.length > 0 && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 inline mr-1.5 text-neutral-400 dark:text-neutral-500" />
                  {asignacionSeleccionada?.tipo === 'Teoria' ? 'Aula' : 'Laboratorio'}
                </label>
                <select
                  value={ambienteId}
                  onChange={(e) => setAmbienteId(e.target.value)}
                  className="input dark:bg-neutral-900 dark:border-neutral-700 dark:text-white"
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
              disabled={saving || !horaInicio || !horaFin}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 mt-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

export default SeleccionarHorario;