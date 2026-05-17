import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const Horarios = () => {
  // Filtros
  const [filtroDocente, setFiltroDocente] = useState('');
  const [filtroAula, setFiltroAula] = useState('');
  const [filtroLaboratorio, setFiltroLaboratorio] = useState('');
  const [semestre, setSemestre] = useState('2024-1');

  // Datos de API
  const [docentes, setDocentes] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [laboratorios, setLaboratorios] = useState([]);
  const [config, setConfig] = useState(null);
  const [horarios, setHorarios] = useState([]);

  // Estados UI
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    Promise.all([
      api.get('/docentes'),
      api.get('/aulas'),
      api.get('/laboratorios'),
      api.get('/configuracion'),
    ])
      .then(([resDoc, resAul, resLab, resConf]) => {
        setDocentes(resDoc.data?.data || []);
        setAulas(resAul.data?.data || []);
        setLaboratorios(resLab.data?.data || []);
        setConfig(resConf.data?.data || null);
      })
      .catch((err) => console.error('Error cargando datos iniciales:', err))
      .finally(() => setLoading(false));
  }, []);

  // Cargar horarios según filtros
  const cargarHorarios = useCallback(() => {
    const params = { semestre };
    if (filtroDocente) params.docente_id = filtroDocente;
    if (filtroAula) params.aula_id = filtroAula;
    if (filtroLaboratorio) params.laboratorio_id = filtroLaboratorio;

    api.get('/horarios', { params })
      .then((res) => setHorarios(res.data?.data || []))
      .catch((err) => console.error('Error cargando horarios:', err));
  }, [semestre, filtroDocente, filtroAula, filtroLaboratorio]);

  useEffect(() => {
    if (config) cargarHorarios();
  }, [cargarHorarios, config]);

  // Generar horarios
  const handleGenerar = async () => {
    setGenerando(true);
    setMensaje(null);
    try {
      const res = await api.post('/horarios/generar', { semestre, forzar: true });
      if (res.data?.success) {
        setMensaje({ tipo: 'exito', texto: `¡Horarios generados! ${res.data.data?.generados || 0} clases asignadas. Conflictos: ${res.data.data?.conflictos || 0}` });
        cargarHorarios();
      } else {
        setMensaje({ tipo: 'error', texto: res.data?.message || 'Error al generar' });
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.message || 'Error de conexión' });
    } finally {
      setGenerando(false);
    }
  };

  // Generar bloques horarios desde config
  const generarBloques = () => {
    if (!config) return [];
    const inicio = config.hora_inicio || '07:00';
    const fin = config.hora_fin || '22:00';
    const duracion = Number(config.duracion_bloque) || 120;

    const [hIni, mIni] = inicio.split(':').map(Number);
    const [hFin] = fin.split(':').map(Number);
    const inicioMinutos = hIni * 60 + mIni;
    const finMinutos = hFin * 60;
    const totalMinutos = finMinutos - inicioMinutos;
    const cantidadBloques = Math.floor(totalMinutos / duracion);

    const bloques = [];
    for (let i = 0; i < cantidadBloques; i++) {
      const inicioBloque = inicioMinutos + i * duracion;
      const finBloque = inicioBloque + duracion;
      const h1 = String(Math.floor(inicioBloque / 60)).padStart(2, '0');
      const m1 = String(inicioBloque % 60).padStart(2, '0');
      const h2 = String(Math.floor(finBloque / 60)).padStart(2, '0');
      const m2 = String(finBloque % 60).padStart(2, '0');
      bloques.push(`${h1}:${m1} - ${h2}:${m2}`);
    }
    return bloques;
  };

  // Construir grid
  const dias = (config?.dias_habiles || ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
  const bloques = generarBloques();

  // Indexar horarios: clave = "dia|hora_inicio"
  const horariosIndex = {};
  horarios.forEach(h => {
    const key = `${h.dia}|${h.hora_inicio}`;
    horariosIndex[key] = h;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
          <p className="text-neutral-500">Cargando horarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Gestión de Horarios</h1>
        {mensaje && (
          <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
            mensaje.tipo === 'exito'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {mensaje.texto}
            <button onClick={() => setMensaje(null)} className="ml-3 text-lg leading-none">&times;</button>
          </div>
        )}
      </div>

      {/* Panel de filtros */}
      <div className="bg-white p-4 rounded-lg shadow border border-neutral-200 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Semestre</label>
            <input
              type="text"
              value={semestre}
              onChange={(e) => setSemestre(e.target.value)}
              className="border border-neutral-300 rounded px-3 py-2 text-sm w-28"
              placeholder="2024-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Docente</label>
            <select
              className="border border-neutral-300 rounded px-3 py-2 text-sm w-56"
              value={filtroDocente}
              onChange={(e) => setFiltroDocente(e.target.value)}
            >
              <option value="">Todos los docentes</option>
              {docentes.map(d => (
                <option key={d.id} value={d.id}>{d.nombres} {d.apellidos} ({d.categoria})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Aula</label>
            <select
              className="border border-neutral-300 rounded px-3 py-2 text-sm w-44"
              value={filtroAula}
              onChange={(e) => setFiltroAula(e.target.value)}
            >
              <option value="">Todas las aulas</option>
              {aulas.map(a => (
                <option key={a.id} value={a.id}>{a.codigo} - {a.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Laboratorio</label>
            <select
              className="border border-neutral-300 rounded px-3 py-2 text-sm w-44"
              value={filtroLaboratorio}
              onChange={(e) => setFiltroLaboratorio(e.target.value)}
            >
              <option value="">Todos los labs</option>
              {laboratorios.map(l => (
                <option key={l.id} value={l.id}>{l.codigo} - {l.nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGenerar}
              disabled={generando}
              className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition font-medium"
            >
              {generando ? 'Generando...' : '⚡ Generar Horarios'}
            </button>
            <button
              onClick={cargarHorarios}
              className="px-4 py-2 bg-neutral-200 text-neutral-800 rounded-lg hover:bg-neutral-300 transition"
            >
              🔄 Refrescar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla Grid de Horarios */}
      <div className="bg-white rounded-lg shadow border border-neutral-200 overflow-auto">
        <div className="p-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-800">
            Vista de Horarios — {semestre}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {horarios.length} clases programadas en {dias.length} días × {bloques.length} bloques
          </p>
        </div>

        {horarios.length === 0 ? (
          <div className="p-12 text-center text-neutral-400">
            <p className="text-lg mb-2">📭 No hay horarios generados</p>
            <p className="text-sm">Usa el botón "Generar Horarios" para crear la programación del semestre.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-100">
                  <th className="border border-neutral-200 p-3 text-left font-semibold text-neutral-700 w-36 sticky left-0 bg-neutral-100 z-10">
                    Bloque
                  </th>
                  {dias.map(dia => (
                    <th key={dia} className="border border-neutral-200 p-3 text-center font-semibold text-neutral-700 min-w-[180px]">
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
                    {dias.map(dia => {
                      const key = `${dia}|${bloque.split(' - ')[0]}`;
                      const h = horariosIndex[key];
                      return (
                        <td key={`${dia}-${bloque}`} className="border border-neutral-200 p-2 align-top min-h-[60px]">
                          {h ? (
                            <div className="bg-primary-50 border border-primary-200 rounded p-2 text-xs leading-relaxed">
                              <p className="font-semibold text-primary-800">
                                {h.curso?.codigo || '—'} — {h.curso?.nombre || ''}
                              </p>
                              <p className="text-neutral-600 mt-1">
                                👨‍🏫 {h.docente?.nombres || ''} {h.docente?.apellidos || ''}
                              </p>
                              <p className="text-neutral-500">
                                📍 {h.aula?.codigo || h.laboratorio?.codigo || 'Sin ambiente'}
                              </p>
                              {h.editado_manualmente && (
                                <span className="inline-block mt-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px]">
                                  Editado
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="h-full min-h-[50px] flex items-center justify-center text-neutral-300 text-xs">
                              —
                            </div>
                          )}
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
    </div>
  );
};

export default Horarios;
