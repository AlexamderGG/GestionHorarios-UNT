import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, RefreshCw, Zap, Filter, ChevronDown,
  User, Building2, FlaskConical, MapPin, Pencil, Inbox, Search,
} from 'lucide-react';
import api from '../services/api';

const Horarios = () => {
  const [filtroDocente, setFiltroDocente] = useState('');
  const [filtroAula, setFiltroAula] = useState('');
  const [filtroLaboratorio, setFiltroLaboratorio] = useState('');
  const [semestre, setSemestre] = useState('2024-1');
  const [showFilters, setShowFilters] = useState(true);

  const [docentes, setDocentes] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [laboratorios, setLaboratorios] = useState([]);
  const [config, setConfig] = useState(null);
  const [horarios, setHorarios] = useState([]);

  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

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

  const handleGenerar = async () => {
    setGenerando(true);
    setMensaje(null);
    try {
      const res = await api.post('/horarios/generar', { semestre, forzar: true });
      if (res.data?.success) {
        setMensaje({
          tipo: 'exito',
          texto: `Horarios generados: ${res.data.data?.generados || 0} clases. Conflictos: ${res.data.data?.conflictos || 0}`,
        });
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

  const generarBloques = () => {
    if (!config) return [];
    const inicio = config.hora_inicio || '07:00';
    const fin = config.hora_fin || '22:00';
    const duracion = Number(config.duracion_bloque) || 120;

    const [hIni, mIni] = inicio.split(':').map(Number);
    const [hFin] = fin.split(':').map(Number);
    const inicioMinutos = hIni * 60 + mIni;
    const finMinutos = hFin * 60;
    const cantidadBloques = Math.floor((finMinutos - inicioMinutos) / duracion);

    const bloques = [];
    for (let i = 0; i < cantidadBloques; i++) {
      const inicioBloque = inicioMinutos + i * duracion;
      const finBloque = inicioBloque + duracion;
      const h1 = String(Math.floor(inicioBloque / 60)).padStart(2, '0');
      const m1 = String(inicioBloque % 60).padStart(2, '0');
      const h2 = String(Math.floor(finBloque / 60)).padStart(2, '0');
      const m2 = String(finBloque % 60).padStart(2, '0');
      bloques.push({ inicio: `${h1}:${m1}`, fin: `${h2}:${m2}`, label: `${h1}:${m1} - ${h2}:${m2}` });
    }
    return bloques;
  };

  const dias = (config?.dias_habiles || ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
  const bloques = generarBloques();

  const horariosIndex = {};
  horarios.forEach(h => {
    const key = `${h.dia}|${h.hora_inicio}`;
    horariosIndex[key] = h;
  });

  if (loading) {
    return <HorariosSkeleton dias={dias} />;
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Gestión de Horarios</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {horarios.length} clases programadas · {dias.length} días · {bloques.length} bloques
          </p>
        </div>
        {mensaje && (
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium animate-slide-down ${
              mensaje.tipo === 'exito'
                ? 'bg-success-50 text-success-700 border border-success-200'
                : 'bg-danger-50 text-danger-700 border border-danger-200'
            }`}
          >
            <span>{mensaje.texto}</span>
            <button onClick={() => setMensaje(null)} className="text-neutral-400 hover:text-neutral-600">
              <span className="sr-only">Cerrar</span>
              &times;
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between p-4 text-left lg:cursor-default"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-neutral-700">
            <Filter className="w-4 h-4" />
            Filtros y acciones
          </span>
          <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${showFilters ? 'rotate-180' : ''} lg:hidden`} />
        </button>

        {showFilters && (
          <div className="px-4 pb-4 border-t border-neutral-100 pt-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Semestre</label>
                <input
                  type="text"
                  value={semestre}
                  onChange={(e) => setSemestre(e.target.value)}
                  className="input w-28"
                  placeholder="2024-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Docente</label>
                <select
                  className="input w-56"
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
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Aula</label>
                <select
                  className="input w-44"
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
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Laboratorio</label>
                <select
                  className="input w-44"
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
                  className="btn-primary flex items-center gap-2"
                >
                  {generando ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Generar
                    </>
                  )}
                </button>
                <button
                  onClick={cargarHorarios}
                  className="btn-secondary flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Schedule Grid */}
      {horarios.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-neutral-50">
                    <th className="border-b border-r border-neutral-200 p-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider w-36 sticky left-0 bg-neutral-50 z-10">
                      Bloque
                    </th>
                    {dias.map(dia => (
                      <th key={dia} className="border-b border-r border-neutral-200 p-3 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider min-w-[180px] last:border-r-0">
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
                      {dias.map(dia => {
                        const key = `${dia}|${bloque.inicio}`;
                        const h = horariosIndex[key];
                        return (
                          <td key={`${dia}-${bloque.label}`} className="border-b border-r border-neutral-200 p-1.5 align-top last:border-r-0">
                            {h ? <HorarioCell horario={h} /> : <div className="h-16" />}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile List View */}
          <div className="md:hidden space-y-4">
            {dias.map(dia => {
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
                          <div className="flex-shrink-0 w-14 text-center">
                            <p className="text-xs font-medium text-neutral-800">{h.hora_inicio?.slice(0, 5)}</p>
                            <p className="text-xs text-neutral-400">{h.hora_fin?.slice(0, 5)}</p>
                          </div>
                          <div className={`flex-1 rounded-lg p-2.5 border-l-3 ${
                            h.curso?.tipo === 'Laboratorio'
                              ? 'bg-indigo-50/50 border-l-indigo-500'
                              : 'bg-primary-50/50 border-l-primary-500'
                          }`}>
                            <p className="text-sm font-semibold text-neutral-800">
                              {h.curso?.codigo || '—'} — {h.curso?.nombre || ''}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {h.docente?.nombres || ''} {h.docente?.apellidos || ''}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {h.aula?.codigo || h.laboratorio?.codigo || 'Sin ambiente'}
                              </span>
                            </div>
                            {h.editado_manualmente && (
                              <span className="badge-warning mt-1.5">
                                <Pencil className="w-3 h-3" />
                                Editado
                              </span>
                            )}
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

const HorarioCell = ({ horario: h }) => {
  const isLab = h.curso?.tipo === 'Laboratorio';
  return (
    <div
      className={`rounded-lg p-2 border-l-3 cursor-pointer hover:shadow-sm transition-shadow ${
        isLab
          ? 'bg-indigo-50/60 border-l-indigo-500 hover:bg-indigo-50'
          : 'bg-primary-50/60 border-l-primary-500 hover:bg-primary-50'
      }`}
    >
      <p className="text-xs font-semibold text-neutral-800 truncate">
        {h.curso?.codigo || '—'}
      </p>
      <p className="text-xs text-neutral-600 truncate mt-0.5">
        {h.curso?.nombre || ''}
      </p>
      <div className="flex items-center gap-1 mt-1.5">
        <User className="w-3 h-3 text-neutral-400 flex-shrink-0" />
        <span className="text-2xs text-neutral-500 truncate">
          {h.docente?.nombres || ''} {h.docente?.apellidos || ''}
        </span>
      </div>
      <div className="flex items-center gap-1 mt-0.5">
        <MapPin className="w-3 h-3 text-neutral-400 flex-shrink-0" />
        <span className="text-2xs text-neutral-500">
          {h.aula?.codigo || h.laboratorio?.codigo || 'Sin ambiente'}
        </span>
      </div>
      {h.editado_manualmente && (
        <span className="badge-warning mt-1.5 text-2xs">
          <Pencil className="w-2.5 h-2.5" />
          Editado
        </span>
      )}
    </div>
  );
};

const EmptyState = () => (
  <div className="card">
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-neutral-400" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-800 mb-1">No hay horarios generados</h3>
      <p className="text-sm text-neutral-500 text-center max-w-md">
        Use el botón &quot;Generar Horarios&quot; para crear la programación del semestre, o ajuste los filtros para buscar horarios existentes.
      </p>
    </div>
  </div>
);

const HorariosSkeleton = ({ dias }) => (
  <div className="animate-fade-in">
    <div className="mb-6">
      <div className="skeleton h-7 w-48 mb-2" />
      <div className="skeleton h-4 w-64" />
    </div>
    <div className="card p-4 mb-6">
      <div className="flex gap-4">
        <div className="skeleton h-10 w-28" />
        <div className="skeleton h-10 w-56" />
        <div className="skeleton h-10 w-44" />
        <div className="skeleton h-10 w-32" />
      </div>
    </div>
    <div className="card overflow-hidden">
      <div className="flex">
        <div className="w-36 p-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-16 w-full mb-1 rounded" />
          ))}
        </div>
        {dias.slice(0, 5).map((_, i) => (
          <div key={i} className="flex-1 p-1.5">
            {[...Array(6)].map((_, j) => (
              <div key={j} className="skeleton h-16 w-full mb-1 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Horarios;
