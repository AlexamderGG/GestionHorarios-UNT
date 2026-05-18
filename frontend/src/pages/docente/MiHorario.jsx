import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

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
      bloques.push(`${h1}:${m1} - ${h2}:${m2}`);
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
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Mi Horario</h1>
        {demoEstado?.turnoActual && (
          <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            demoEstado.turnoActual.docente_id === user?.id
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {demoEstado.turnoActual.docente_id === user?.id
              ? '🟢 Tu turno — Puedes seleccionar'
              : `🟡 Esperando turno (${demoEstado.turnoActual.nombre})`}
          </div>
        )}
      </div>

      {horarios.length === 0 ? (
        <div className="bg-white rounded-lg shadow border border-neutral-200 p-12 text-center text-neutral-400">
          No tienes horarios asignados. Espera a que el administrador genere los horarios o selecciona desde "Mis Cursos".
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-neutral-200 overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-100">
                <th className="border border-neutral-200 p-3 text-left font-semibold text-neutral-700 w-36 sticky left-0 bg-neutral-100 z-10">
                  Bloque
                </th>
                {DIAS.map(dia => (
                  <th key={dia} className="border border-neutral-200 p-3 text-center font-semibold text-neutral-700 min-w-[160px]">
                    {dia}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bloques.map((bloque, idx) => (
                <tr key={bloque} className={idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}>
                  <td className="border border-neutral-200 p-2 text-neutral-600 font-medium sticky left-0 bg-inherit z-10 whitespace-nowrap">
                    {bloque}
                  </td>
                  {DIAS.map(dia => {
                    const key = `${dia}|${bloque.split(' - ')[0]}`;
                    const h = horariosIndex[key];
                    return (
                      <td key={`${dia}-${bloque}`} className="border border-neutral-200 p-2 align-top">
                        {h ? (
                          <div className="bg-primary-50 border border-primary-200 rounded p-2 text-xs">
                            <p className="font-semibold text-primary-800">{h.curso?.codigo}</p>
                            <p className="text-neutral-600">{h.curso?.nombre}</p>
                            <p className="text-neutral-500 mt-1">
                              {h.aula?.codigo || h.laboratorio?.codigo || 'Sin ambiente'}
                            </p>
                            <button
                              onClick={() => eliminarHorario(h.id)}
                              className="mt-1 text-red-500 hover:text-red-700 text-[10px]"
                            >
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
      )}
    </div>
  );
};

export default MiHorario;
