import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  Calendar, RefreshCw, Zap, Filter, Users, LayoutGrid,
  User, MapPin, Pencil, Trash2, Inbox, X, Save,
} from 'lucide-react';

const DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];

const AdminHorarios = () => {
  const [tab, setTab] = useState('grilla');
  const [horarios, setHorarios] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [config, setConfig] = useState(null);
  const [filtroDocente, setFiltroDocente] = useState('');
  const [semestre, setSemestre] = useState('2024-1');
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({});

  const cargarDatos = useCallback(async () => {
    try {
      const [resHor, resDoc, resConf] = await Promise.all([
        api.get('/horarios', { params: { semestre, docente_id: filtroDocente || undefined } }),
        api.get('/docentes'),
        api.get('/configuracion'),
      ]);
      setHorarios(resHor.data?.data || []);
      setDocentes(resDoc.data?.data || []);
      setConfig(resConf.data?.data || null);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [semestre, filtroDocente]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const handleGenerar = async () => {
    setGenerando(true);
    setMensaje(null);
    try {
      const res = await api.post('/horarios/generar', { semestre, forzar: true });
      if (res.data?.success) {
        setMensaje({ tipo: 'exito', texto: `${res.data.data?.generados || 0} horarios generados` });
        cargarDatos();
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.message || 'Error al generar' });
    } finally {
      setGenerando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar este horario?')) return;
    try {
      await api.delete(`/horarios/${id}`);
      cargarDatos();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const abrirEdicion = (h) => {
    setEditando(h);
    setEditForm({
      dia: h.dia,
      hora_inicio: h.hora_inicio?.slice(0, 5),
      hora_fin: h.hora_fin?.slice(0, 5),
      aula_id: h.aula?.id || '',
      laboratorio_id: h.laboratorio?.id || '',
    });
  };

  const handleGuardarEdicion = async () => {
    try {
      await api.put(`/horarios/${editando.id}`, editForm);
      setEditando(null);
      cargarDatos();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al guardar');
    }
  };

  const generarBloques = () => {
    if (!config) return [];
    const inicio = config.hora_inicio || '07:00';
    const fin = config.hora_fin || '22:00';
    const duracion = Number(config.duracion_bloque) || 120;
    const [hIni, mIni] = inicio.split(':').map(Number);
    const [hFin] = fin.split(':').map(Number);
    const bloques = [];
    for (let i = hIni * 60 + mIni; i + duracion <= hFin * 60; i += duracion) {
      const h1 = String(Math.floor(i / 60)).padStart(2, '0');
      const m1 = String(i % 60).padStart(2, '0');
      const h2 = String(Math.floor((i + duracion) / 60)).padStart(2, '0');
      const m2 = String((i + duracion) % 60).padStart(2, '0');
      bloques.push({ inicio: `${h1}:${m1}`, fin: `${h2}:${m2}`, label: `${h1}:${m1} - ${h2}:${m2}` });
    }
    return bloques;
  };

  const bloques = generarBloques();

  const horariosPorDocente = {};
  horarios.forEach(h => {
    const key = h.docente?.id;
    if (!horariosPorDocente[key]) horariosPorDocente[key] = { docente: h.docente, horarios: [] };
    horariosPorDocente[key].horarios.push(h);
  });

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton h-7 w-48 mb-6" />
        <div className="card p-4 mb-6"><div className="flex gap-4"><div className="skeleton h-10 w-28" /><div className="skeleton h-10 w-56" /><div className="skeleton h-10 w-32" /></div></div>
        <div className="card overflow-hidden"><div className="p-12"><div className="skeleton h-64 w-full rounded-lg" /></div></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary-600" />
            Gestión de Horarios
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Administra y edita los horarios del semestre</p>
        </div>
        {mensaje && (
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium animate-slide-down ${
            mensaje.tipo === 'exito' ? 'bg-success-50 text-success-700 border border-success-200' : 'bg-danger-50 text-danger-700 border border-danger-200'
          }`}>
            {mensaje.texto}
            <button onClick={() => setMensaje(null)} className="text-neutral-400 hover:text-neutral-600">&times;</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Semestre</label>
            <input type="text" value={semestre} onChange={(e) => setSemestre(e.target.value)} className="input w-28" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Docente</label>
            <select value={filtroDocente} onChange={(e) => setFiltroDocente(e.target.value)} className="input w-56">
              <option value="">Todos</option>
              {docentes.map(d => <option key={d.id} value={d.id}>{d.nombres} {d.apellidos}</option>)}
            </select>
          </div>
          <button onClick={handleGenerar} disabled={generando} className="btn-primary flex items-center gap-2">
            {generando ? <><RefreshCw className="w-4 h-4 animate-spin" />Generando...</> : <><Zap className="w-4 h-4" />Generar Horarios</>}
          </button>
          <button onClick={cargarDatos} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab Switch */}
      <div className="flex gap-1 mb-4 bg-neutral-100 rounded-lg p-1 w-fit">
        {[
          { key: 'grilla', label: 'Grilla General', icon: LayoutGrid },
          { key: 'docente', label: 'Por Docente', icon: Users },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-1.5 text-sm rounded-md transition-all duration-150 ${
                tab === t.key ? 'bg-white text-primary-700 shadow-sm font-medium' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Grid View */}
      {tab === 'grilla' && (
        <>
          {horarios.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-neutral-50">
                      <th className="border-b border-r border-neutral-200 p-3 text-left text-xs font-semibold text-neutral-500 uppercase w-36 sticky left-0 bg-neutral-50 z-10">Bloque</th>
                      {DIAS.map(dia => (
                        <th key={dia} className="border-b border-r border-neutral-200 p-3 text-center text-xs font-semibold text-neutral-500 uppercase min-w-[180px] last:border-r-0">{dia}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bloques.map((bloque, idx) => (
                      <tr key={bloque.label} className={idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50/30'}>
                        <td className="border-b border-r border-neutral-200 p-3 text-neutral-600 text-sm font-medium sticky left-0 bg-inherit z-10 whitespace-nowrap">{bloque.label}</td>
                        {DIAS.map(dia => {
                          const h = horarios.find(hr => hr.dia === dia && hr.hora_inicio?.slice(0, 5) === bloque.inicio);
                          return (
                            <td key={`${dia}-${bloque.label}`} className="border-b border-r border-neutral-200 p-1.5 align-top last:border-r-0">
                              {h ? (
                                <div
                                  className={`rounded-lg p-2 border-l-3 cursor-pointer hover:shadow-sm transition-all group ${
                                    h.curso?.tipo === 'Laboratorio'
                                      ? 'bg-indigo-50/60 border-l-indigo-500'
                                      : 'bg-primary-50/60 border-l-primary-500'
                                  }`}
                                  onClick={() => abrirEdicion(h)}
                                >
                                  <p className="text-xs font-semibold text-neutral-800 truncate">{h.curso?.codigo}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                    <User className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                                    <span className="text-2xs text-neutral-500 truncate">{h.docente?.nombres} {h.docente?.apellidos}</span>
                                  </div>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                                    <span className="text-2xs text-neutral-500">{h.aula?.codigo || h.laboratorio?.codigo}</span>
                                  </div>
                                  <div className="flex gap-1 mt-1.5">
                                    {h.editado_manualmente && (
                                      <span className="badge-warning text-2xs"><Pencil className="w-2.5 h-2.5" />Editado</span>
                                    )}
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleEliminar(h.id); }}
                                      className="text-danger-400 hover:text-danger-600 text-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
                                    >
                                      <Trash2 className="w-3 h-3" />Eliminar
                                    </button>
                                  </div>
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
          )}
        </>
      )}

      {/* Per Teacher View */}
      {tab === 'docente' && (
        <div className="space-y-4">
          {Object.values(horariosPorDocente).length === 0 ? (
            <EmptyState />
          ) : (
            Object.values(horariosPorDocente).map(({ docente, horarios: hs }) => (
              <div key={docente?.id} className="card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-800">{docente?.nombres} {docente?.apellidos}</h3>
                    <p className="text-xs text-neutral-500">{hs.length} clase{hs.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {hs.map(h => (
                    <div
                      key={h.id}
                      className="border border-neutral-200 rounded-lg p-2.5 cursor-pointer hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
                      onClick={() => abrirEdicion(h)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-800">{h.dia}</span>
                        <span className="text-xs text-neutral-500">{h.hora_inicio?.slice(0, 5)}-{h.hora_fin?.slice(0, 5)}</span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {h.curso?.codigo} — {h.aula?.codigo || h.laboratorio?.codigo}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in" onClick={() => setEditando(null)}>
          <div className="card p-6 w-full max-w-md shadow-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-primary-600" />
                Editar Horario
              </h2>
              <button onClick={() => setEditando(null)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Día</label>
                <select value={editForm.dia} onChange={(e) => setEditForm({ ...editForm, dia: e.target.value })} className="input">
                  {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Hora inicio</label>
                  <input type="time" value={editForm.hora_inicio} onChange={(e) => setEditForm({ ...editForm, hora_inicio: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Hora fin</label>
                  <input type="time" value={editForm.hora_fin} onChange={(e) => setEditForm({ ...editForm, hora_fin: e.target.value })} className="input" />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setEditando(null)} className="btn-ghost">Cancelar</button>
                <button onClick={handleGuardarEdicion} className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
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
      <h3 className="text-lg font-semibold text-neutral-800 mb-1">No hay horarios</h3>
      <p className="text-sm text-neutral-500 text-center">Use &quot;Generar Horarios&quot; para crear la programación del semestre.</p>
    </div>
  </div>
);

export default AdminHorarios;
