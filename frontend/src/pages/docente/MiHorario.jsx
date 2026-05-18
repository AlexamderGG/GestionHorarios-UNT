import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Calendar, Trash2, MapPin, User, Inbox, Clock } from 'lucide-react';

const DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];

const MiHorario = () => {
  const { user } = useAuth();
  const [horarios, setHorarios] = useState([]);
  const [config, setConfig] = useState(null);
  const [demoEstado, setDemoEstado] = useState(null);
  const [loading, setLoading] = useState(true);

  const cargarDatos = useCallback(async () => {
    try {
      const [resHorarios, resConfig] = await Promise.all([
        api.get('/docente/mi-horario'),
        api.get('/configuracion'),
      ]);
      setHorarios(resHorarios.data?.data || []);
      setConfig(resConfig.data?.data || null);

      try {
        const resDemo = await api.get('/demo/estado');
        const demoData = resDemo.data?.data?.config;
        if (demoData?.demo_mode) {
          setDemoEstado(resDemo.data?.data?.turnos || null);
        }
      } catch { /* demo no disponible */ }
    } catch (err) {
      console.error('Error cargando horario:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const eliminarHorario = async (id) => {
    if (!confirm('¿Eliminar este horario?')) return;
    try {
      await api.delete(`/docente/horario/${id}`);
      cargarDatos();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const generarBloques = () => {
    if (!config) return [];
    const inicio = config.hora_inicio || '07:00';
    const fin = config.hora_fin || '22:00';
    const duracion = Number(config.duracion_bloque) || 120;
    const [hIni, mIni] = inicio.split(':').map(Number);
    const [hFin] = fin.split(':').map(Number);
    const inicioMin = hIni * 60 + mIni;
    const finMin = hFin * 60;
    const bloques = [];
    for (let i = inicioMin; i + duracion <= finMin; i += duracion) {
      const h1 = String(Math.floor(i / 60)).padStart(2, '0');
      const m1 = String(i % 60).padStart(2, '0');
      const h2 = String(Math.floor((i + duracion) / 60)).padStart(2, '0');
      const m2 = String((i + duracion) % 60).padStart(2, '0');
      bloques.push({ inicio: `${h1}:${m1}`, fin: `${h2}:${m2}`, label: `${h1}:${m1} - ${h2}:${m2}` });
    }
    return bloques;
  };

  const bloques = generarBloques();
  const horariosIndex = {};
  horarios.forEach(h => {
    const key = `${h.dia}|${h.hora_inicio}`;
    horariosIndex[key] = h;
  });

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton h-7 w-36 mb-6" />
        <div className="card overflow-hidden">
          <div className="flex">
            <div className="w-36 p-3">
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 w-full mb-1 rounded" />)}
            </div>
            {DIAS.map((_, i) => (
              <div key={i} className="flex-1 p-1.5">
                {[...Array(5)].map((_, j) => <div key={j} className="skeleton h-14 w-full mb-1 rounded" />)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary-600" />
            Mi Horario
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {horarios.length} clase{horarios.length !== 1 ? 's' : ''} asignada{horarios.length !== 1 ? 's' : ''}
          </p>
        </div>
        {demoEstado?.turnoActual && (
          <div className={`badge ${demoEstado.turnoActual.docente_id === user?.id ? 'badge-success' : 'badge-warning'}`}>
            {demoEstado.turnoActual.docente_id === user?.id ? 'Tu turno — Puedes seleccionar' : `Esperando turno (${demoEstado.turnoActual.nombre})`}
          </div>
        )}
      </div>

      {horarios.length === 0 ? (
        <div className="card">
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-1">Sin horarios asignados</h3>
            <p className="text-sm text-neutral-500 text-center max-w-md">
              No tienes horarios asignados. Espera a que el administrador genere los horarios o selecciona desde &quot;Mis Cursos&quot;.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Grid */}
          <div className="hidden md:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-neutral-50">
                    <th className="border-b border-r border-neutral-200 p-3 text-left text-xs font-semibold text-neutral-500 uppercase w-36 sticky left-0 bg-neutral-50 z-10">
                      Bloque
                    </th>
                    {DIAS.map(dia => (
                      <th key={dia} className="border-b border-r border-neutral-200 p-3 text-center text-xs font-semibold text-neutral-500 uppercase min-w-[160px] last:border-r-0">
                        {dia}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bloques.map((bloque, idx) => (
                    <tr key={bloque.label} className={idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50/30'}>
                      <td className="border-b border-r border-neutral-200 p-3 text-neutral-600 text-sm font-medium sticky left-0 bg-inherit z-10 whitespace-nowrap">
                        {bloque.label}
                      </td>
                      {DIAS.map(dia => {
                        const key = `${dia}|${bloque.inicio}`;
                        const h = horariosIndex[key];
                        return (
                          <td key={`${dia}-${bloque.label}`} className="border-b border-r border-neutral-200 p-1.5 align-top last:border-r-0">
                            {h ? (
                              <div className="bg-primary-50/60 border-l-3 border-l-primary-500 rounded-lg p-2.5 group">
                                <p className="text-xs font-semibold text-primary-800">{h.curso?.codigo}</p>
                                <p className="text-xs text-neutral-600 truncate">{h.curso?.nombre}</p>
                                <div className="flex items-center gap-1 mt-1.5">
                                  <MapPin className="w-3 h-3 text-neutral-400" />
                                  <span className="text-2xs text-neutral-500">
                                    {h.aula?.codigo || h.laboratorio?.codigo || 'Sin ambiente'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => eliminarHorario(h.id)}
                                  className="mt-2 flex items-center gap-1 text-danger-500 hover:text-danger-700 text-2xs opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Eliminar
                                </button>
                              </div>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile List */}
          <div className="md:hidden space-y-4">
            {DIAS.map(dia => {
              const horariosDelDia = horarios.filter(h => h.dia === dia);
              if (horariosDelDia.length === 0) return null;
              return (
                <div key={dia} className="card overflow-hidden">
                  <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
                    <h3 className="text-sm font-semibold text-neutral-800">{dia}</h3>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    {horariosDelDia
                      .sort((a, b) => a.hora_inicio?.localeCompare(b.hora_inicio))
                      .map(h => (
                        <div key={h.id} className="p-3 flex items-start gap-3">
                          <div className="flex-shrink-0 w-14 text-center pt-0.5">
                            <p className="text-xs font-medium text-neutral-800">{h.hora_inicio?.slice(0, 5)}</p>
                            <p className="text-xs text-neutral-400">{h.hora_fin?.slice(0, 5)}</p>
                          </div>
                          <div className="flex-1 bg-primary-50/60 border-l-3 border-l-primary-500 rounded-lg p-2.5">
                            <p className="text-sm font-semibold text-primary-800">{h.curso?.codigo}</p>
                            <p className="text-xs text-neutral-600">{h.curso?.nombre}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3 text-neutral-400" />
                              <span className="text-xs text-neutral-500">
                                {h.aula?.codigo || h.laboratorio?.codigo || 'Sin ambiente'}
                              </span>
                            </div>
                            <button
                              onClick={() => eliminarHorario(h.id)}
                              className="mt-2 flex items-center gap-1 text-danger-500 text-xs"
                            >
                              <Trash2 className="w-3 h-3" />
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default MiHorario;
