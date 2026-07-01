import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../services/api';
import { Building2, FlaskConical, Plus, Edit2, Trash2, Search, Save, X, RefreshCw, AlertCircle } from 'lucide-react';

const AdminAmbientes = () => {
  const [activeTab, setActiveTab] = useState('aulas'); // 'aulas' o 'laboratorios'
  const [aulas, setAulas] = useState([]);
  const [laboratorios, setLaboratorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para el formulario (Creación / Edición)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = Crear, objeto = Editar
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    capacidad: '',
    ubicacion: '',
    tipo: 'Teoria', // Solo para aulas
  });
  const [saving, setSaving] = useState(false);

  // Cargar datos desde el Backend
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [resAulas, resLabs] = await Promise.all([
        api.get('/aulas'),
        api.get('/laboratorios')
      ]);
      setAulas(resAulas.data?.data || resAulas.data || []);
      setLaboratorios(resLabs.data?.data || resLabs.data || []);
    } catch (err) {
      console.error("Error al cargar ambientes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Abrir Modal Formulario
  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm({
        codigo: item.codigo || '',
        nombre: item.nombre || '',
        capacidad: item.capacidad || '',
        ubicacion: item.ubicacion || '',
        tipo: item.tipo || 'Teoria',
      });
    } else {
      setEditingItem(null);
      setForm({
        codigo: '',
        nombre: '',
        capacidad: activeTab === 'aulas' ? '40' : '25', // Valores por defecto
        ubicacion: '',
        tipo: 'Teoria',
      });
    }
    setIsModalOpen(true);
  };

  // Cerrar Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Guardar (Insert / Update)
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const endpoint = activeTab === 'aulas' ? '/aulas' : '/laboratorios';
    
    const payload = {
      codigo: form.codigo,
      nombre: form.nombre,
      capacidad: Number(form.capacidad),
      ubicacion: form.ubicacion,
      ...(activeTab === 'aulas' && { tipo: form.tipo })
    };

    try {
      if (editingItem) {
        await api.put(`${endpoint}/${editingItem.id}`, payload);
      } else {
        await api.post(endpoint, payload);
      }
      handleCloseModal();
      cargarDatos();
    } catch (err) {
      alert(err.response?.data?.message || "Ocurrió un error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  // ELIMINAR AMBIENTE DEFINITIVAMENTE (Hard Delete)
  const handleDelete = async (item) => {
    if (!window.confirm(`¿Está seguro que desea eliminar permanentemente el ambiente ${item.codigo}? Esta acción no se puede deshacer.`)) return;
    
    const endpoint = activeTab === 'aulas' ? '/aulas' : '/laboratorios';
    
    try {
      await api.delete(`${endpoint}/${item.id}`);
      // Actualización optimista local
      if (activeTab === 'aulas') {
        setAulas(prev => prev.filter(a => a.id !== item.id));
      } else {
        setLaboratorios(prev => prev.filter(l => l.id !== item.id));
      }
    } catch (err) {
      console.error("Error al eliminar ambiente:", err);
      alert(err.response?.data?.message || "No se pudo eliminar el ambiente. Es posible que esté asignado en algún horario lectivo.");
      cargarDatos(); 
    }
  };

  // Filtrado por buscador
  const itemsFiltrados = useMemo(() => {
    const lista = activeTab === 'aulas' ? aulas : laboratorios;
    if (!searchTerm.trim()) return lista;
    const lower = searchTerm.toLowerCase();
    return lista.filter(item => 
      String(item.codigo).toLowerCase().includes(lower) || 
      String(item.nombre).toLowerCase().includes(lower) ||
      String(item.ubicacion).toLowerCase().includes(lower)
    );
  }, [activeTab, aulas, laboratorios, searchTerm]);

  return (
    <div className="animate-fade-in p-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary-600 dark:text-primary-400" /> Gestión de Ambientes Académicos
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Administra la infraestructura física de aulas y laboratorios de la facultad.
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2 py-2 px-4 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Agregar {activeTab === 'aulas' ? 'Aula' : 'Laboratorio'}
        </button>
      </div>

      {/* Tabs de Navegación */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-700 mb-6 bg-white dark:bg-neutral-800 rounded-xl p-1 shadow-sm max-w-xs">
        <button
          onClick={() => { setActiveTab('aulas'); setSearchTerm(''); }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
            activeTab === 'aulas'
              ? 'bg-primary-600 text-white shadow-md'
              : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
          }`}
        >
          <Building2 className="w-4 h-4" /> Aulas
        </button>
        <button
          onClick={() => { setActiveTab('laboratorios'); setSearchTerm(''); }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
            activeTab === 'laboratorios'
              ? 'bg-primary-600 text-white shadow-md'
              : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
          }`}
        >
          <FlaskConical className="w-4 h-4" /> Laboratorios
        </button>
      </div>

      {/* Barra de Búsqueda */}
      <div className="mb-6 relative max-w-md">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={`Buscar por código, nombre o ubicación de ${activeTab}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-xl outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
        />
      </div>

      {/* Contenedor de la Tabla */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center animate-pulse text-neutral-500 dark:text-neutral-400">
            Cargando inventario de infraestructura...
          </div>
        ) : itemsFiltrados.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 dark:text-neutral-500 flex flex-col items-center justify-center gap-2">
            <AlertCircle className="w-8 h-8 opacity-50" />
            <p className="text-sm font-medium">No se encontraron registros de {activeTab}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 font-bold text-xs uppercase tracking-wider">
                  <th className="p-4">Código</th>
                  <th className="p-4">Nombre / Alias</th>
                  <th className="p-4">Capacidad</th>
                  <th className="p-4">Ubicación / Pabellón</th>
                  {activeTab === 'aulas' && <th className="p-4">Tipo</th>}
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700 text-neutral-800 dark:text-neutral-200">
                {itemsFiltrados.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-700/20 transition-colors">
                    <td className="p-4 font-mono font-bold text-primary-600 dark:text-primary-400">{item.codigo}</td>
                    <td className="p-4 font-medium">{item.nombre || <span className="text-neutral-400 italic">Sin nombre</span>}</td>
                    <td className="p-4 font-semibold">{item.capacidad} alumnos</td>
                    <td className="p-4 text-neutral-500 dark:text-neutral-400">{item.ubicacion || 'No especificada'}</td>
                    {activeTab === 'aulas' && (
                      <td className="p-4">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${item.tipo === 'Teoria' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                          {item.tipo}
                        </span>
                      </td>
                    )}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-1.5 text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                          title="Editar ambiente"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 text-danger-400 hover:text-danger-600 dark:hover:text-danger-400 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
                          title="Eliminar permanentemente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FORMULARIO DE ALTA Y EDICIÓN */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <form 
            onSubmit={handleSave}
            className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-neutral-200 dark:border-neutral-700 animate-scale-in"
          >
            {/* Header Modal */}
            <div className="p-5 border-b border-neutral-100 dark:border-neutral-700 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/30">
              <h3 className="font-bold text-neutral-900 dark:text-white">
                {editingItem ? 'Editar' : 'Registrar'} {activeTab === 'aulas' ? 'Aula' : 'Laboratorio'}
              </h3>
              <button 
                type="button"
                onClick={handleCloseModal}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cuerpo Formulario */}
            <div className="p-5 space-y-4 text-neutral-900 dark:text-white">
              <div>
                <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase mb-1">Código Único (Obligatorio)</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: A-101, LAB-SIST-01"
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                  className="w-full text-sm p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none font-medium focus:border-primary-500 focus:ring-1 focus:ring-primary-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase mb-1">Nombre / Descripción Corta</label>
                <input
                  type="text"
                  placeholder="Ej: Aula Magna, Laboratorio de Redes"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full text-sm p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none font-medium focus:border-primary-500 focus:ring-1 focus:ring-primary-500 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase mb-1">Capacidad Alumnos</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Ej: 40"
                    value={form.capacidad}
                    onChange={(e) => setForm({ ...form, capacidad: e.target.value })}
                    className="w-full text-sm p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-lg outline-none font-medium focus:border-primary-500 focus:ring-1 focus:ring-primary-500 shadow-sm"
                  />
                </div>

                {activeTab === 'aulas' && (
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase mb-1">Tipo de Aula</label>
                    <select
                      value={form.tipo}
                      onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                      className="w-full text-sm p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-lg outline-none font-medium focus:border-primary-500 focus:ring-1 focus:ring-primary-500 shadow-sm"
                    >
                      <option value="Teoria">Teoría</option>
                      <option value="Auditorio">Auditorio</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase mb-1">Ubicación / Pabellón</label>
                <input
                  type="text"
                  placeholder="Ej: Pabellón de Sistemas - 2do Piso"
                  value={form.ubicacion}
                  onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                  className="w-full text-sm p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none font-medium focus:border-primary-500 focus:ring-1 focus:ring-primary-500 shadow-sm"
                />
              </div>
            </div>

            {/* Footer Modal Acciones */}
            <div className="p-4 border-t border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/30 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseModal}
                className="py-2 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-2"
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {editingItem ? 'Guardar Cambios' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminAmbientes;