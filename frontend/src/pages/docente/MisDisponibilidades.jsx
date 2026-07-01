import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, Clock, CheckCircle, XCircle, Trash2, Plus, AlertCircle, Save } from 'lucide-react';

// Función utilitaria para calcular traslapes
const timeToMinutes = (t) => {
  if (!t) return 0;
  const [h, m] = String(t).slice(0, 5).split(':').map(Number);
  return h * 60 + m;
};

const MisDisponibilidades = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState(null);
  const [disponibilidades, setDisponibilidades] = useState([]);
  const [miPerfil, setMiPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  // Formulario
  const [form, setForm] = useState({
    dia: 'Lunes',
    hora_inicio: '',
    hora_fin: '',
    tipo: 'PREFERIDO'
  });

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const resConf = await api.get('/configuracion');
        const configuracion = resConf.data?.data;
        setConfig(configuracion);

        if (configuracion?.semestre_activo) {
          const resDisp = await api.get('/disponibilidades', {
            params: { docente_id: user.id, semestre: configuracion.semestre_activo }
          });
          setDisponibilidades(resDisp.data?.data || []);
        }

        // Obtener el estado del turno del docente
        const resPerfil = await api.get('/docente/mi-perfil');
        setMiPerfil(resPerfil.data?.data);

      } catch (err) {
        console.error("Error cargando datos:", err);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, [user.id]);

  const diasDisponibles = useMemo(() => {
    if (!config?.dias_habiles) return ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
    return Array.isArray(config.dias_habiles) ? config.dias_habiles : config.dias_habiles.split(',');
  }, [config]);

  const horasDisponibles = useMemo(() => {
    const inicio = config?.hora_inicio || "07:00";
    const fin = config?.hora_fin || "22:00";
    const [hIni] = inicio.split(":").map(Number);
    const [hFin] = fin.split(":").map(Number);
    
    const lista = [];
    for (let h = hIni; h <= hFin; h++) {
      lista.push(`${String(h).padStart(2, "0")}:00`);
    }
    return lista;
  }, [config]);

  const formatAMPM = (timeStr) => {
    if (!timeStr) return "";
    const [hourStr] = timeStr.split(":");
    const hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    let displayHour = hour % 12;
    displayHour = displayHour ? displayHour : 12; 
    return `${String(displayHour).padStart(2, "0")}:00 ${ampm}`;
  };

  const agregarBloque = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.hora_inicio || !form.hora_fin) {
      setError("Debe seleccionar una hora de inicio y fin.");
      return;
    }
    
    const startMin = timeToMinutes(form.hora_inicio);
    const endMin = timeToMinutes(form.hora_fin);

    if (startMin >= endMin) {
      setError("La hora de inicio debe ser anterior a la hora de fin.");
      return;
    }

    // 🌟 VALIDACIÓN DE TRASLAPE / BLOQUES REDUNDANTES
    const tieneTraslape = disponibilidades.some(d => {
      if (d.dia !== form.dia) return false;
      const existingStart = timeToMinutes(d.hora_inicio);
      const existingEnd = timeToMinutes(d.hora_fin);
      // Condición estricta de cruce: el nuevo empieza antes de que el otro termine Y termina después de que el otro empiece
      return startMin < existingEnd && endMin > existingStart;
    });

    if (tieneTraslape) {
      setError(`Rango inválido: Ya existe un bloque de disponibilidad registrado el día ${form.dia} que choca con este horario.`);
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        docente_id: user.id,
        semestre: config.semestre_activo,
        ...form
      };
      
      const res = await api.post('/disponibilidades', payload);
      setDisponibilidades([...disponibilidades, res.data.data]);
      setForm({ ...form, hora_inicio: '', hora_fin: '' }); // Limpiar horas
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar el bloque de disponibilidad.");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarBloque = async (id) => {
    try {
      await api.delete(`/disponibilidades/${id}`);
      setDisponibilidades(disponibilidades.filter(d => d.id !== id));
    } catch (err) {
      alert("Error al eliminar el bloque.");
    }
  };

  if (loading) return <div className="p-8 text-center text-neutral-500 dark:text-neutral-400 animate-pulse">Cargando configuración...</div>;

  const preferidos = disponibilidades.filter(d => d.tipo === 'PREFERIDO');
  const restringidos = disponibilidades.filter(d => d.tipo === 'RESTRINGIDO');
  
  // Variable para saber si el docente ya finalizó su proceso
  const isCompletado = miPerfil?.estado_turno === 'Completado';

  return (
    <div className="animate-fade-in max-w-5xl mx-auto pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          Mi Disponibilidad Horaria
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Semestre Activo: <span className="font-semibold text-primary-700 dark:text-primary-400">{config?.semestre_activo}</span>
        </p>
      </div>

      {isCompletado ? (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl mb-6 flex gap-3 shadow-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h4 className="font-bold">Horario Completado</h4>
            <p className="text-sm mt-1 text-emerald-700 dark:text-emerald-400">
              Tu horario ha sido marcado como completado. Ya no puede registrar ni eliminar bloques de disponibilidad. 
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-300 rounded-xl p-4 mb-8 flex gap-3 text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>
            En este semestre, la <strong className="dark:text-blue-200">Secretaría</strong> será la encargada de asignar los horarios de acuerdo al escalafón docente. 
            Por favor, ingrese los bloques de tiempo en los que <strong className="dark:text-blue-200">prefiere</strong> dictar clases y aquellos en los que le es <strong className="dark:text-blue-200">imposible</strong> asistir.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario para agregar */}
        <div className="lg:col-span-1">
          <form onSubmit={agregarBloque} className="card p-5 sticky top-6 dark:bg-neutral-800 dark:border-neutral-700">
            <h2 className="text-lg font-bold text-neutral-800 dark:text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              Añadir Bloque
            </h2>

            {error && (
              <div className="mb-4 text-sm text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/30 p-3 rounded-lg border border-danger-200 dark:border-danger-800/50 animate-slide-down">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Tipo de Bloque</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isCompletado}
                    onClick={() => setForm({ ...form, tipo: 'PREFERIDO' })}
                    className={`py-2 px-3 text-sm rounded-lg font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      form.tipo === 'PREFERIDO' 
                        ? 'bg-success-50 dark:bg-success-900/40 border-success-500 dark:border-success-400 text-success-700 dark:text-success-300' 
                        : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    Preferido
                  </button>
                  <button
                    type="button"
                    disabled={isCompletado}
                    onClick={() => setForm({ ...form, tipo: 'RESTRINGIDO' })}
                    className={`py-2 px-3 text-sm rounded-lg font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      form.tipo === 'RESTRINGIDO' 
                        ? 'bg-danger-50 dark:bg-danger-900/40 border-danger-500 dark:border-danger-400 text-danger-700 dark:text-danger-300' 
                        : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    Restringido
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Día</label>
                <select disabled={isCompletado} value={form.dia} onChange={(e) => setForm({ ...form, dia: e.target.value })} className="input w-full dark:bg-neutral-900 dark:border-neutral-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                  {diasDisponibles.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Desde</label>
                  <select disabled={isCompletado} value={form.hora_inicio} onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })} className="input w-full font-medium dark:bg-neutral-900 dark:border-neutral-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                    <option value="">Inicio...</option>
                    {horasDisponibles.map(h => <option key={h} value={h}>{formatAMPM(h)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Hasta</label>
                  <select disabled={isCompletado} value={form.hora_fin} onChange={(e) => setForm({ ...form, hora_fin: e.target.value })} className="input w-full font-medium dark:bg-neutral-900 dark:border-neutral-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                    <option value="">Fin...</option>
                    {horasDisponibles.map(h => <option key={h} value={h}>{formatAMPM(h)}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" disabled={guardando || isCompletado} className="btn-primary w-full mt-2 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {guardando ? 'Guardando...' : <><Save className="w-4 h-4" /> Registrar Bloque</>}
              </button>
            </div>
          </form>
        </div>

        {/* Listado de bloques registrados */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preferencias */}
          <div className="card p-5 border-t-4 border-t-success-500 dark:bg-neutral-800 dark:border-x-neutral-700 dark:border-b-neutral-700">
            <h3 className="text-base font-bold text-neutral-800 dark:text-white flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-success-600 dark:text-success-400" />
              Horarios Preferidos
            </h3>
            {preferidos.length === 0 ? (
              <p className="text-sm text-neutral-400 dark:text-neutral-500 italic text-center py-4">No ha registrado horarios preferidos.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {preferidos.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-success-50 dark:bg-success-900/20 border border-success-100 dark:border-success-800/50 p-3 rounded-lg group transition-colors">
                    <div>
                      <p className="text-sm font-bold text-success-800 dark:text-success-400">{p.dia}</p>
                      <p className="text-xs text-success-600 dark:text-success-500">{formatAMPM(p.hora_inicio)} - {formatAMPM(p.hora_fin)}</p>
                    </div>
                    {!isCompletado && (
                      <button onClick={() => eliminarBloque(p.id)} className="text-success-400 dark:text-success-600 hover:text-danger-500 dark:hover:text-danger-400 transition-colors p-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Restricciones */}
          <div className="card p-5 border-t-4 border-t-danger-500 dark:bg-neutral-800 dark:border-x-neutral-700 dark:border-b-neutral-700">
            <h3 className="text-base font-bold text-neutral-800 dark:text-white flex items-center gap-2 mb-4">
              <XCircle className="w-5 h-5 text-danger-600 dark:text-danger-400" />
              Restricciones (No disponible)
            </h3>
            {restringidos.length === 0 ? (
              <p className="text-sm text-neutral-400 dark:text-neutral-500 italic text-center py-4">No ha registrado restricciones horarias.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {restringidos.map(r => (
                  <div key={r.id} className="flex items-center justify-between bg-danger-50 dark:bg-danger-900/20 border border-danger-100 dark:border-danger-800/50 p-3 rounded-lg group transition-colors">
                    <div>
                      <p className="text-sm font-bold text-danger-800 dark:text-danger-400">{r.dia}</p>
                      <p className="text-xs text-danger-600 dark:text-danger-500">{formatAMPM(r.hora_inicio)} - {formatAMPM(r.hora_fin)}</p>
                    </div>
                    {!isCompletado && (
                      <button onClick={() => eliminarBloque(r.id)} className="text-danger-400 dark:text-danger-600 hover:text-danger-600 dark:hover:text-danger-400 transition-colors p-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MisDisponibilidades;