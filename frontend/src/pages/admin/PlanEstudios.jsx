import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { BookOpen, Plus, Trash2, Edit2, Layers, ShieldAlert, CheckCircle2 } from 'lucide-react';

const PlanEstudios = () => {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [notificacion, setNotificacion] = useState({ tipo: '', mensaje: '' });

  // Estado con TODOS los campos
  const [form, setForm] = useState({
    codigo: '', 
    nombre: '', 
    ciclo: '1', 
    creditos: '4', 
    horas_t: '2', 
    horas_p: '2', 
    horas_l: '0',
    especialidad: '', // Se usa para Departamento
    semestre: '2026-1'
  });

  const fetchCursos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/plan-estudios'); 
      setCursos(res.data.data || res.data);
    } catch (error) {
      mostrarAlerta('error', 'No se pudieron cargar los cursos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCursos();
  }, []);

  const mostrarAlerta = (tipo, mensaje) => {
    setNotificacion({ tipo, mensaje });
    setTimeout(() => setNotificacion({ tipo: '', mensaje: '' }), 4000);
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const abrirModalCrear = () => {
    setIsEditing(false);
    setSelectedId(null);
    setForm({ codigo: '', nombre: '', ciclo: '1', creditos: '4', horas_t: '2', horas_p: '2', horas_l: '0', especialidad: '', semestre: '2026-1' });
    setModalOpen(true);
  };

  const abrirModalEditar = (curso) => {
    setIsEditing(true);
    setSelectedId(curso.id);
    setForm({
      codigo: curso.codigo || '',
      nombre: curso.nombre || '',
      ciclo: String(curso.ciclo || '1'),
      creditos: String(curso.creditos || '0'),
      horas_t: String(curso.horas_t || 0),
      horas_p: String(curso.horas_p || 0),
      horas_l: String(curso.horas_l || 0),
      especialidad: curso.especialidad || '',
      semestre: curso.semestre || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        codigo: form.codigo,
        nombre: form.nombre,
        ciclo: parseInt(form.ciclo) || 1,
        creditos: parseInt(form.creditos) || 0,
        horas_t: parseInt(form.horas_t) || 0,
        horas_p: parseInt(form.horas_p) || 0,
        horas_l: parseInt(form.horas_l) || 0,
        especialidad: form.especialidad,
        semestre: form.semestre
      };

      if (isEditing) {
        await api.put(`/plan-estudios/${selectedId}`, payload);
        mostrarAlerta('success', '¡Curso actualizado correctamente!');
      } else {
        await api.post('/plan-estudios', payload);
        mostrarAlerta('success', '¡Curso agregado exitosamente!');
      }
      setModalOpen(false);
      fetchCursos();
    } catch (error) {
      mostrarAlerta('error', error.response?.data?.message || 'Error al procesar el curso.');
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este curso?')) return;
    try {
      await api.delete(`/plan-estudios/${id}`);
      mostrarAlerta('success', 'Curso eliminado correctamente.');
      fetchCursos();
    } catch (error) {
      mostrarAlerta('error', 'No se pudo eliminar el curso.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Alertas */}
      {notificacion.mensaje && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 p-4 rounded-xl shadow-xl text-white ${notificacion.tipo === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {notificacion.tipo === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          <span className="text-sm font-medium">{notificacion.mensaje}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary-600" /> Plan de Estudios
          </h1>
          <p className="text-sm text-neutral-500">Mantenedor oficial de asignaturas e información curricular.</p>
        </div>
        <button onClick={abrirModalCrear} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md">
          <Plus className="w-4 h-4" /> Agregar Curso
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-neutral-500">Cargando malla curricular...</div>
        ) : cursos.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">No hay cursos registrados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-500 uppercase">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Asignatura</th>
                  {/* Nueva Columna Departamento */}
                  <th className="py-3 px-4">Departamento</th>
                  <th className="py-3 px-4 text-center">Semestre</th>
                  <th className="py-3 px-4 text-center">Ciclo</th>
                  <th className="py-3 px-4 text-center">Créditos</th>
                  <th className="py-3 px-4 text-center">H. Teóricas</th>
                  <th className="py-3 px-4 text-center">H. Prácticas</th>
                  <th className="py-3 px-4 text-center">H. Lab</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm">
                {cursos.map((curso) => (
                  <tr key={curso.id || curso.codigo} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                    <td className="py-4 px-4 font-mono text-xs text-primary-600 font-bold">{curso.codigo}</td>
                    <td className="py-4 px-4 font-medium dark:text-white">{curso.nombre}</td>
                    {/* Renderizamos la especialidad como Departamento */}
                    <td className="py-4 px-4 text-neutral-600 dark:text-neutral-400">{curso.especialidad || '-'}</td>
                    <td className="py-4 px-4 text-center text-neutral-500">{curso.semestre || '-'}</td>
                    <td className="py-4 px-4 text-center">
                    <span className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 text-xs rounded-md font-bold shadow-sm">
                        Ciclo {curso.ciclo || '-'}
                    </span>
                    </td>
                    <td className="py-4 px-4 text-center font-semibold text-neutral-900 dark:text-white">
                    {curso.creditos || '0'}
                    </td>
                    <td className="py-4 px-4 text-center text-neutral-500">{curso.horas_t}h</td>
                    <td className="py-4 px-4 text-center text-neutral-500">{curso.horas_p}h</td>
                    <td className="py-4 px-4 text-center font-medium text-primary-600">{curso.horas_l || 0}h</td>
                    <td className="py-4 px-4 text-right flex justify-end gap-1">
                      <button onClick={() => abrirModalEditar(curso)} className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="Editar"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleEliminar(curso.id)} className="p-2 text-neutral-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-neutral-900 dark:text-white">
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-bold">{isEditing ? 'Modificar Asignatura' : 'Nuevo Curso Curricular'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold mb-1">Código</label>
                  <input type="text" name="codigo" required value={form.codigo} onChange={handleInputChange} className="w-full text-sm p-2 bg-neutral-50 dark:bg-neutral-800 border rounded-lg outline-none focus:border-primary-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold mb-1">Nombre de Asignatura</label>
                  <input type="text" name="nombre" required value={form.nombre} onChange={handleInputChange} className="w-full text-sm p-2 bg-neutral-50 dark:bg-neutral-800 border rounded-lg outline-none focus:border-primary-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Departamento</label>
                  <input type="text" name="especialidad" placeholder="Ej: Ciencias Básicas" value={form.especialidad} onChange={handleInputChange} className="w-full text-sm p-2 bg-neutral-50 dark:bg-neutral-800 border rounded-lg outline-none focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Semestre (Opcional)</label>
                  <input type="text" name="semestre" placeholder="Ej: 2026-1" value={form.semestre} onChange={handleInputChange} className="w-full text-sm p-2 bg-neutral-50 dark:bg-neutral-800 border rounded-lg outline-none focus:border-primary-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Ciclo Universitario</label>
                  <select name="ciclo" value={form.ciclo} onChange={handleInputChange} className="w-full text-sm p-2 bg-neutral-50 dark:bg-neutral-800 border rounded-lg outline-none">
                    {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>Ciclo {i+1}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Créditos Totales</label>
                  <input type="number" name="creditos" min="0" max="10" value={form.creditos} onChange={handleInputChange} className="w-full text-sm p-2 bg-neutral-50 dark:bg-neutral-800 border rounded-lg outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-center">H. Teóricas</label>
                  <input type="number" name="horas_t" min="0" max="10" value={form.horas_t} onChange={handleInputChange} className="w-full text-sm p-2 text-center bg-neutral-50 dark:bg-neutral-800 border rounded-lg outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-center">H. Prácticas</label>
                  <input type="number" name="horas_p" min="0" max="10" value={form.horas_p} onChange={handleInputChange} className="w-full text-sm p-2 text-center bg-neutral-50 dark:bg-neutral-800 border rounded-lg outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-center text-primary-600 font-bold">H. Lab</label>
                  <input type="number" name="horas_l" min="0" max="10" value={form.horas_l} onChange={handleInputChange} className="w-full text-sm p-2 text-center bg-primary-50/50 border border-primary-300 dark:border-primary-700 rounded-lg font-bold outline-none" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-700">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md">
                  {isEditing ? 'Actualizar Curso' : 'Guardar Curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanEstudios;