import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { BookOpen, Plus, Trash2, Edit2, Layers, ShieldAlert, CheckCircle2, Search, X } from 'lucide-react';

const PlanEstudios = () => {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [notificacion, setNotificacion] = useState({ tipo: '', mensaje: '' });

  // Estado del Formulario
  const [form, setForm] = useState({
    codigo: '', 
    nombre: '', 
    ciclo: '1', 
    creditos: '4', 
    horas_t: '2', 
    horas_p: '2', 
    horas_l: '0',
    especialidad: '', 
    semestre: '', 
    malla: '2018'
  });

  // Estado de los Filtros
  const [filtros, setFiltros] = useState({
    asignatura: '',
    malla: '',
    departamento: '',
    ciclo: ''
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

  const handleInputChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleFiltroChange = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });
  const limpiarFiltros = () => setFiltros({ asignatura: '', malla: '', departamento: '', ciclo: '' });

  // 🚀 1. EXTRAER LISTAS ÚNICAS PARA LOS DATALISTS Y FILTROS
  const mallasDisponibles = useMemo(() => [...new Set(cursos.map(c => c.malla || '2018'))].sort(), [cursos]);
  const departamentosDisponibles = useMemo(() => [...new Set(cursos.map(c => c.especialidad).filter(Boolean))].sort(), [cursos]);
  const semestresDisponibles = useMemo(() => [...new Set(cursos.map(c => c.semestre).filter(Boolean))].sort(), [cursos]);

  // 🚀 2. LÓGICA DE FILTRADO EN TIEMPO REAL
  const cursosFiltrados = useMemo(() => {
    return cursos.filter(curso => {
      const matchAsignatura = curso.nombre.toLowerCase().includes(filtros.asignatura.toLowerCase()) || 
                              curso.codigo.toLowerCase().includes(filtros.asignatura.toLowerCase());
      
      const mallaActual = (curso.malla || '2018').toString();
      const matchMalla = filtros.malla === '' || mallaActual === filtros.malla;
      
      const departamentoActual = curso.especialidad || '';
      const matchDepartamento = filtros.departamento === '' || departamentoActual === filtros.departamento;
      
      const matchCiclo = filtros.ciclo === '' || curso.ciclo.toString() === filtros.ciclo;

      return matchAsignatura && matchMalla && matchDepartamento && matchCiclo;
    });
  }, [cursos, filtros]);

  const hayFiltrosActivos = filtros.asignatura || filtros.malla || filtros.departamento || filtros.ciclo;

  const abrirModalCrear = () => {
    setIsEditing(false);
    setSelectedId(null);
    setForm({ codigo: '', nombre: '', ciclo: '1', creditos: '4', horas_t: '2', horas_p: '2', horas_l: '0', especialidad: '', semestre: '', malla: '2018' });
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
      semestre: curso.semestre || '',
      malla: curso.malla || '2018'
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
        semestre: form.semestre,
        malla: form.malla 
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
    <div className="p-6 md:p-8 lg:p-10 w-full mx-auto space-y-6 flex flex-col h-full">
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

      {/* 🚀 BARRA DE FILTROS (Combobox cerrados) */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-neutral-400" />
          </div>
          <input 
            type="text" name="asignatura" value={filtros.asignatura} onChange={handleFiltroChange} 
            placeholder="Buscar por código o nombre de asignatura..." 
            className="w-full text-sm pl-10 p-2.5 bg-neutral-50 dark:bg-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:border-primary-500 transition-colors"
          />
        </div>

        <div className="w-full md:w-32">
          <select name="malla" value={filtros.malla} onChange={handleFiltroChange} className="w-full text-sm p-2.5 bg-neutral-50 dark:bg-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:border-primary-500 transition-colors">
            <option value="">Todas las Mallas</option>
            {mallasDisponibles.map(m => <option key={m} value={m}>Malla {m}</option>)}
          </select>
        </div>

        <div className="w-full md:w-48">
          <select name="departamento" value={filtros.departamento} onChange={handleFiltroChange} className="w-full text-sm p-2.5 bg-neutral-50 dark:bg-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:border-primary-500 transition-colors">
            <option value="">Todos los Departamentos</option>
            {departamentosDisponibles.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="w-full md:w-40 flex gap-2">
          <select name="ciclo" value={filtros.ciclo} onChange={handleFiltroChange} className="w-full text-sm p-2.5 bg-neutral-50 dark:bg-neutral-800 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:border-primary-500 transition-colors">
            <option value="">Todos los ciclos</option>
            {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>Ciclo {i+1}</option>)}
          </select>

          {hayFiltrosActivos && (
            <button onClick={limpiarFiltros} className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-xl transition-colors border border-red-100 dark:border-red-900/30" title="Limpiar filtros">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm flex-1">
        {loading ? (
          <div className="p-12 text-center text-neutral-500">Cargando malla curricular...</div>
        ) : cursosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 flex flex-col items-center justify-center">
            <Search className="w-8 h-8 text-neutral-300 mb-3" />
            <p>No se encontraron cursos que coincidan con los filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-500 uppercase">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Asignatura</th>
                  <th className="py-3 px-4">Departamento</th>
                  <th className="py-3 px-4 text-center">Malla</th>
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
                {cursosFiltrados.map((curso) => (
                  <tr key={curso.id || curso.codigo} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                    <td className="py-4 px-4 font-mono text-xs text-primary-600 font-bold">{curso.codigo}</td>
                    <td className="py-4 px-4 font-medium dark:text-white whitespace-nowrap">{curso.nombre}</td>
                    <td className="py-4 px-4 text-neutral-600 dark:text-neutral-400">{curso.especialidad || '-'}</td>
                    
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                        curso.malla === '2018' || !curso.malla
                          ? 'bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>
                        Malla {curso.malla || '2018'}
                      </span>
                    </td>

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

      {/* Modal CRUD */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-neutral-900 dark:text-white">
            
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2 bg-neutral-50/50 dark:bg-neutral-800/20">
              <Layers className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-bold">{isEditing ? 'Modificar Asignatura' : 'Nuevo Curso Curricular'}</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* 🚀 LISTAS DE SUGERENCIAS INVISIBLES (DATALISTS) */}
              <datalist id="mallas-list">
                {mallasDisponibles.map(m => <option key={m} value={m} />)}
              </datalist>
              <datalist id="departamentos-list">
                {departamentosDisponibles.map(d => <option key={d} value={d} />)}
              </datalist>
              <datalist id="semestres-list">
                {semestresDisponibles.map(s => <option key={s} value={s} />)}
              </datalist>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold mb-1">Código</label>
                  <input type="text" name="codigo" required value={form.codigo} onChange={handleInputChange} className="w-full text-sm p-2 bg-neutral-50 dark:bg-neutral-800 border rounded-lg outline-none focus:border-primary-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold mb-1">Nombre de Asignatura</label>
                  <input type="text" name="nombre" required value={form.nombre} onChange={handleInputChange} className="w-full text-sm p-2 bg-neutral-50 dark:bg-neutral-800 border rounded-lg outline-none focus:border-primary-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 🚀 INPUTS CON DATALIST (Desplegable + Escritura) */}
                <div>
                  <label className="block text-xs font-semibold mb-1">Malla Curricular</label>
                  <input 
                    list="mallas-list" name="malla" value={form.malla} onChange={handleInputChange} required placeholder="Ej: 2018, 2026"
                    className="w-full text-sm p-2 bg-neutral-50 dark:bg-neutral-800 border rounded-lg outline-none focus:border-primary-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Departamento</label>
                  <input 
                    list="departamentos-list" name="especialidad" value={form.especialidad} onChange={handleInputChange} placeholder="Elegir o escribir..."
                    className="w-full text-sm p-2 bg-neutral-50 dark:bg-neutral-800 border rounded-lg outline-none focus:border-primary-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Semestre de Origen</label>
                  <input 
                    list="semestres-list" name="semestre" value={form.semestre} onChange={handleInputChange} placeholder="Ej: 2026-1"
                    className="w-full text-sm p-2 bg-neutral-50 dark:bg-neutral-800 border rounded-lg outline-none focus:border-primary-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-semibold mb-1">Ciclo Universitario</label>
                  <select name="ciclo" value={form.ciclo} onChange={handleInputChange} className="w-full text-sm p-2 bg-neutral-50 dark:bg-neutral-800 border rounded-lg outline-none">
                    {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>Ciclo {i+1}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-center">Teoría (h)</label>
                  <input type="number" name="horas_t" min="0" max="10" value={form.horas_t} onChange={handleInputChange} className="w-full text-sm p-2 text-center bg-neutral-50 dark:bg-neutral-800 border rounded-lg outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-center">Práctica (h)</label>
                  <input type="number" name="horas_p" min="0" max="10" value={form.horas_p} onChange={handleInputChange} className="w-full text-sm p-2 text-center bg-neutral-50 dark:bg-neutral-800 border rounded-lg outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-center text-primary-600 dark:text-primary-400 font-bold">Lab (h)</label>
                  <input type="number" name="horas_l" min="0" max="10" value={form.horas_l} onChange={handleInputChange} className="w-full text-sm p-2 text-center bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg font-bold outline-none" />
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