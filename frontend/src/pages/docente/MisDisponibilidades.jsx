import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, CheckCircle, XCircle, Trash2, Plus, AlertCircle, Save } from 'lucide-react';

const MisDisponibilidades = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState(null);
  const [disponibilidades, setDisponibilidades] = useState([]);
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
    if (parseInt(form.hora_inicio) >= parseInt(form.hora_fin)) {
      setError("La hora de inicio debe ser anterior a la hora de fin.");
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
      setError("Error al guardar el bloque de disponibilidad.");
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

  if (loading) return <div className="p-8 text-center text-neutral-500">Cargando configuración...</div>;

  const preferidos = disponibilidades.filter(d => d.tipo === 'PREFERIDO');
  const restringidos = disponibilidades.filter(d => d.tipo === 'RESTRINGIDO');

  return (
    <div className="animate-fade-in max-w-5xl mx-auto pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary-600" />
          Mi Disponibilidad Horaria
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Semestre Activo: <span className="font-semibold text-primary-700">{config?.semestre_activo}</span>
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 mb-8 flex gap-3 text-sm">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p>
          En este semestre, la <strong>Secretaría</strong> será la encargada de asignar los horarios de acuerdo al escalafón docente. 
          Por favor, ingrese los bloques de tiempo en los que <strong>prefiere</strong> dictar clases y aquellos en los que le es <strong>imposible</strong> asistir.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario para agregar */}
        <div className="lg:col-span-1">
          <form onSubmit={agregarBloque} className="card p-5 sticky top-6">
            <h2 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary-600" />
              Añadir Bloque
            </h2>

            {error && (
              <div className="mb-4 text-sm text-danger-600 bg-danger-50 p-3 rounded-lg border border-danger-200">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Tipo de Bloque</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, tipo: 'PREFERIDO' })}
                    className={`py-2 px-3 text-sm rounded-lg font-medium border transition-colors ${
                      form.tipo === 'PREFERIDO' ? 'bg-success-50 border-success-500 text-success-700' : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                    }`}
                  >
                    Preferido
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, tipo: 'RESTRINGIDO' })}
                    className={`py-2 px-3 text-sm rounded-lg font-medium border transition-colors ${
                      form.tipo === 'RESTRINGIDO' ? 'bg-danger-50 border-danger-500 text-danger-700' : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                    }`}
                  >
                    Restringido
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Día</label>
                <select value={form.dia} onChange={(e) => setForm({ ...form, dia: e.target.value })} className="input w-full">
                  {diasDisponibles.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Desde</label>
                  <select value={form.hora_inicio} onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })} className="input w-full font-medium">
                    <option value="">Inicio...</option>
                    {horasDisponibles.map(h => <option key={h} value={h}>{formatAMPM(h)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Hasta</label>
                  <select value={form.hora_fin} onChange={(e) => setForm({ ...form, hora_fin: e.target.value })} className="input w-full font-medium">
                    <option value="">Fin...</option>
                    {horasDisponibles.map(h => <option key={h} value={h}>{formatAMPM(h)}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" disabled={guardando} className="btn-primary w-full mt-2 flex justify-center items-center gap-2">
                {guardando ? 'Guardando...' : <><Save className="w-4 h-4" /> Registrar Bloque</>}
              </button>
            </div>
          </form>
        </div>

        {/* Listado de bloques registrados */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preferencias */}
          <div className="card p-5 border-t-4 border-t-success-500">
            <h3 className="text-base font-bold text-neutral-800 flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-success-600" />
              Horarios Preferidos
            </h3>
            {preferidos.length === 0 ? (
              <p className="text-sm text-neutral-400 italic text-center py-4">No ha registrado horarios preferidos.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {preferidos.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-success-50 border border-success-100 p-3 rounded-lg group">
                    <div>
                      <p className="text-sm font-bold text-success-800">{p.dia}</p>
                      <p className="text-xs text-success-600">{formatAMPM(p.hora_inicio)} - {formatAMPM(p.hora_fin)}</p>
                    </div>
                    <button onClick={() => eliminarBloque(p.id)} className="text-success-400 hover:text-danger-500 transition-colors p-1.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Restricciones */}
          <div className="card p-5 border-t-4 border-t-danger-500">
            <h3 className="text-base font-bold text-neutral-800 flex items-center gap-2 mb-4">
              <XCircle className="w-5 h-5 text-danger-600" />
              Restricciones (No disponible)
            </h3>
            {restringidos.length === 0 ? (
              <p className="text-sm text-neutral-400 italic text-center py-4">No ha registrado restricciones horarias.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {restringidos.map(r => (
                  <div key={r.id} className="flex items-center justify-between bg-danger-50 border border-danger-100 p-3 rounded-lg group">
                    <div>
                      <p className="text-sm font-bold text-danger-800">{r.dia}</p>
                      <p className="text-xs text-danger-600">{formatAMPM(r.hora_inicio)} - {formatAMPM(r.hora_fin)}</p>
                    </div>
                    <button onClick={() => eliminarBloque(r.id)} className="text-danger-400 hover:text-danger-600 transition-colors p-1.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
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