import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

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
      bloques.push(`${h1}:${m1} - ${h2}:${m2}`);
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
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Gestión de Horarios</h1>
        {mensaje && (
          <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
            mensaje.tipo === 'exito' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {mensaje.texto}
            <button onClick={() => setMensaje(null)} className="ml-3 text-lg leading-none">&times;</button>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg shadow border border-neutral-200 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Semestre</label>
            <input type="text" value={semestre} onChange={(e) => setSemestre(e.target.value)}
              className="border border-neutral-300 rounded px-3 py-2 text-sm w-28" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Docente</label>
            <select value={filtroDocente} onChange={(e) => setFiltroDocente(e.target.value)}
              className="border border-neutral-300 rounded px-3 py-2 text-sm w-56">
              <option value="">Todos</option>
              {docentes.map(d => (
                <option key={d.id} value={d.id}>{d.nombres} {d.apellidos}</option>
              ))}
            </select>
          </div>
          <button onClick={handleGenerar} disabled={generando}
            className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition font-medium">
            {generando ? 'Generando...' : 'Generar Horarios'}
          </button>
          <button onClick={cargarDatos}
            className="px-4 py-2 bg-neutral-200 text-neutral-800 rounded-lg hover:bg-neutral-300 transition">
            Refrescar
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-4 bg-neutral-100 rounded-lg p-1 w-fit">
        {[
          { key: 'grilla', label: 'Grilla General' },
          { key: 'docente', label: 'Por Docente' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 text-sm rounded-md transition ${tab === t.key ? 'bg-white text-primary-700 shadow-sm font-medium' : 'text-neutral-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'grilla' && (
        <div className="bg-white rounded-lg shadow border border-neutral-200 overflow-auto">
          {horarios.length === 0 ? (
            <div className="p-12 text-center text-neutral-400">No hay horarios. Usa "Generar Horarios".</div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-100">
                  <th className="border border-neutral-200 p-3 text-left font-semibold text-neutral-700 w-36 sticky left-0 bg-neutral-100 z-10">Bloque</th>
                  {DIAS.map(dia => (
                    <th key={dia} className="border border-neutral-200 p-3 text-center font-semibold text-neutral-700 min-w-[180px]">{dia}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bloques.map((bloque, idx) => {
                  const bloqueInicio = bloque.split(' - ')[0];
                  return (
                    <tr key={bloque} className={idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}>
                      <td className="border border-neutral-200 p-2 text-neutral-600 font-medium sticky left-0 bg-inherit z-10 whitespace-nowrap">{bloque}</td>
                      {DIAS.map(dia => {
                        const h = horarios.find(hr => hr.dia === dia && hr.hora_inicio?.slice(0, 5) === bloqueInicio);
                        return (
                          <td key={`${dia}-${bloque}`} className="border border-neutral-200 p-1 align-top">
                            {h ? (
                              <div className="bg-primary-50 border border-primary-200 rounded p-2 text-xs cursor-pointer hover:bg-primary-100"
                                onClick={() => abrirEdicion(h)}>
                                <p className="font-semibold text-primary-800">{h.curso?.codigo}</p>
                                <p className="text-neutral-600">{h.docente?.nombres} {h.docente?.apellidos}</p>
                                <p className="text-neutral-500">{h.aula?.codigo || h.laboratorio?.codigo}</p>
                                <div className="flex gap-1 mt-1">
                                  {h.editado_manualmente && <span className="px-1 bg-amber-100 text-amber-700 rounded text-[10px]">Editado</span>}
                                  <button onClick={(e) => { e.stopPropagation(); handleEliminar(h.id); }}
                                    className="text-red-500 hover:text-red-700 text-[10px]">Eliminar</button>
                                </div>
                              </div>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'docente' && (
        <div className="space-y-4">
          {Object.values(horariosPorDocente).length === 0 ? (
            <div className="bg-white rounded-lg shadow border border-neutral-200 p-12 text-center text-neutral-400">
              No hay horarios para mostrar.
            </div>
          ) : (
            Object.values(horariosPorDocente).map(({ docente, horarios: hs }) => (
              <div key={docente?.id} className="bg-white rounded-lg shadow border border-neutral-200 p-4">
                <h3 className="font-semibold text-neutral-800 mb-2">
                  {docente?.nombres} {docente?.apellidos}
                  <span className="text-xs text-neutral-400 ml-2">({hs.length} clases)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {hs.map(h => (
                    <div key={h.id} className="border border-neutral-200 rounded p-2 text-xs cursor-pointer hover:bg-neutral-50"
                      onClick={() => abrirEdicion(h)}>
                      <span className="font-medium">{h.dia}</span> {h.hora_inicio?.slice(0, 5)}-{h.hora_fin?.slice(0, 5)}
                      <p className="text-neutral-500">{h.curso?.codigo} — {h.aula?.codigo || h.laboratorio?.codigo}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {editando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditando(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Editar Horario</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Día</label>
                <select value={editForm.dia} onChange={(e) => setEditForm({ ...editForm, dia: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm">
                  {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Hora inicio</label>
                  <input type="time" value={editForm.hora_inicio}
                    onChange={(e) => setEditForm({ ...editForm, hora_inicio: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Hora fin</label>
                  <input type="time" value={editForm.hora_fin}
                    onChange={(e) => setEditForm({ ...editForm, hora_fin: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setEditando(null)}
                  className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800">Cancelar</button>
                <button onClick={handleGuardarEdicion}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHorarios;
