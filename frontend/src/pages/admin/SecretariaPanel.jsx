import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, Clock, AlertCircle, Send, RotateCcw, RefreshCw, Search, Lock} from 'lucide-react';
import api from '../../services/api'; 

const SecretariaPanel = () => {
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [reiniciando, setReiniciando] = useState(false);
  const [enviandoMasivo, setEnviandoMasivo] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [completando, setCompletando] = useState(false);

  // Cargar la lista ordenada de docentes
  const fetchDocentes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/secretaria/docentes-escalafon'); 
      if (response.data && response.data.success) {
        setDocentes(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar escalafón:', err);
      setError('No se pudo cargar la lista de docentes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocentes();
  }, []);

  const handleHabilitarTurno = async (docenteId, nombreCompleto) => {
    if (!window.confirm(`¿Está seguro de habilitar el turno y enviar las credenciales a ${nombreCompleto}?`)) {
      return;
    }

    try {
      setActionLoading(docenteId);
      const response = await api.post(`/secretaria/habilitar-turno/${docenteId}`);
      
      if (response.data && response.data.success) {
        // Actualizamos el estado localmente para no recargar toda la página
        setDocentes(docentes.map(d => 
          d.id === docenteId ? { ...d, estado_turno: 'Notificado' } : d
        ));
      }
    } catch (err) {
      console.error('Error al habilitar turno:', err);
      alert('Hubo un error al intentar enviar las credenciales y habilitar el turno.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCambioEstadoManual = async (docenteId, nuevoEstado) => {
    // NUEVA REGLA DE SEGURIDAD ANTI-ERRORES
    const docenteActual = docentes.find(d => d.id === docenteId);
    
    // Validamos que no pueda pasar a Notificado NI a Completado si no tiene credenciales
    if ((nuevoEstado === 'Notificado' || nuevoEstado === 'Completado') && !docenteActual?.tiene_credenciales) {
      alert(
        "⚠️ ACCIÓN DENEGADA\n\n" +
        "Este docente no tiene credenciales (contraseña) activas.\n" +
        `No puedes cambiar su estado a "${nuevoEstado}" porque no tendría cómo ingresar al sistema.\n\n` +
        "Por favor, utiliza el botón azul 'Habilitar Turno' o 'Notificar a Todos' para generarle un acceso primero."
      );
      return; // Detenemos la ejecución aquí mismo
    }

    if (!window.confirm(`¿Está seguro de cambiar manualmente el estado a "${nuevoEstado}"?`)) return;

    try {
      const response = await api.put(`/secretaria/docentes/${docenteId}/estado`, {
        estado_turno: nuevoEstado
      });

      if (response.data.success) {
        setDocentes(docentes.map(d => 
          d.id === docenteId ? { ...d, estado_turno: nuevoEstado } : d
        ));
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Hubo un error al actualizar el estado manualmente.');
    }
  };

  const docentesFiltrados = (docentes || []).filter(docente => {
    if (!busqueda) return true; // Si no hay búsqueda, mostramos todos
    
    const termino = busqueda.toLowerCase().trim();
    const nombreCompleto = `${docente.nombres || ''} ${docente.apellidos || ''}`.toLowerCase();
    const email = (docente.email || '').toLowerCase();
    
    return nombreCompleto.includes(termino) || email.includes(termino);
  });

  const handleNotificarTodos = async () => {
    // Agregamos un texto de confirmación inteligente
    const confirmar = window.confirm(
      '¿Está seguro de enviar credenciales a TODOS los docentes a la vez?\n\n' +
      '⚠️ NOTA IMPORTANTE: Si está iniciando la programación de un NUEVO SEMESTRE, asegúrese de haber presionado primero el botón "Reiniciar Turnos" para limpiar el sistema antes de enviar los correos.'
    );

    if (!confirmar) {
      return; // Si la secretaria se da cuenta que olvidó reiniciar, cancela aquí
    }
    
    setEnviandoMasivo(true);
    try {
      const res = await api.post('/secretaria/notificar-todos'); // Ajusta la ruta a la tuya (ej. /secretaria/notificar-todos)
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al enviar correos masivos');
    } finally {
      setEnviandoMasivo(false);
    }
  };

  const handleReiniciarTurnosGlobal = async () => {
    const confirmar = confirm(
      "¿Está completamente seguro de reiniciar todos los turnos? \n\nEsto restaurará el estado de todos los docentes a 'Pendiente' y detendrá cualquier selección activa en este momento sin borrar los horarios ya guardados."
    );
    
    if (!confirmar) return;

    setReiniciando(true);
    try {
      // CONECTADO: Apunta directamente al nuevo endpoint ordenado en el módulo de horarios
      const res = await api.post("/horarios/reset-turnos"); 
      
      if (res.data?.success) {
        alert(res.data.message || "Turnos reiniciados correctamente.");
        // Llamada correcta a fetchDocentes()
        fetchDocentes(); 
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error al solicitar el reinicio de turnos.");
    } finally {
      setReiniciando(false);
    }
  };

  const handleCompletarTodos = async () => {
    const confirmar = confirm(
      "¿Está seguro de marcar a TODOS los docentes como 'Completado'? \n\nEsto funcionará como un candado global: bloqueará la edición para todos. Úselo si desea cerrar la programación masiva y habilitar excepciones manualmente a un solo docente."
    );
    
    if (!confirmar) return;

    setCompletando(true);
    try {
      // Ajusta la ruta si en tu backend la llamaste distinto
      const res = await api.put("/secretaria/completar-todos"); 
      
      if (res.data?.success) {
        alert(res.data.message);
        fetchDocentes(); // Recargamos la tabla para ver todos en verde
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error al bloquear los turnos.");
    } finally {
      setCompletando(false);
    }
  };

  // Encontrar el ID del PRIMER docente que está en estado "Pendiente"
  const idSiguienteEnTurno = docentes.find(d => d.estado_turno === 'Pendiente')?.id;

  if (loading && docentes.length === 0) return <div className="p-6 text-center text-neutral-500 dark:text-neutral-400">Cargando escalafón docente...</div>;
  if (error) return <div className="p-6 text-center text-red-500 dark:text-red-400">{error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      
      {/* CABECERA REDISEÑADA: Título arriba, Herramientas abajo */}
      <div className="mb-6 space-y-5">
        
        {/* 1. Área de Título (Arriba) */}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Gestión de Turnos (Escalafón)</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Control de flujo y asignación de prioridades horarias para los docentes.
          </p>
        </div>

        {/* 2. Barra de Herramientas (Buscador a la Izquierda / Botones a la Derecha) */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          
          {/* Izquierda: Buscador */}
          <div className="relative w-full lg:w-80 flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar docente o correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="input w-full pl-9 py-2 text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition-all shadow-sm"
            />
          </div>

          {/* Derecha: Grupo de Acciones Rápidas */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
            
            {/* Botón Actualizar (Solo ícono) */}
            <button 
              onClick={fetchDocentes} 
              disabled={loading}
              className="p-2 border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg transition-colors bg-white dark:bg-neutral-800 flex-shrink-0 shadow-sm"
              title="Actualizar escalafón"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Botón Notificar */}
            <button 
              onClick={handleNotificarTodos} 
              disabled={enviandoMasivo}
              className="btn-primary flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap shadow-sm flex-grow sm:flex-grow-0"
            >
              {enviandoMasivo ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Enviando...</>
              ) : (
                <><Mail className="w-4 h-4" /> Notificar a Todos</>
              )}
            </button>

            {/* Botón Completar (Candado) */}
            <button
              onClick={handleCompletarTodos}
              disabled={completando}
              className="flex items-center justify-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/40 px-3 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap shadow-sm flex-grow sm:flex-grow-0"
              title="Bloquear edición para todos los docentes"
            >
              {completando ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Bloqueando...</>
              ) : (
                <><Lock className="w-4 h-4" /> Completar Todos</>
              )}
            </button>
            
            {/* Botón Reiniciar (Peligro) */}
            <button
              onClick={handleReiniciarTurnosGlobal}
              disabled={reiniciando}
              className="flex items-center justify-center gap-1.5 bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-400 border border-danger-200 dark:border-danger-800/50 hover:bg-danger-100 dark:hover:bg-danger-900/40 px-3 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap shadow-sm flex-grow sm:flex-grow-0"
            >
              {reiniciando ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Reiniciando...</>
              ) : (
                <><RotateCcw className="w-4 h-4" /> Reiniciar Turnos</>
              )}
            </button>

          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-neutral-600 dark:text-neutral-300">
            <thead className="text-xs text-neutral-700 dark:text-neutral-400 uppercase bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-4 py-3">Docente</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3 text-center">Años Antigüedad</th>
                <th className="px-4 py-3 text-center">Estado de Turno</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {docentesFiltrados.map((docente, index) => {
                const esSuTurno = docente.id === idSiguienteEnTurno;
                const nombreCompleto = `${docente.apellidos}, ${docente.nombres}`;

                return (
                  <tr key={docente.id} className="border-b border-neutral-100 dark:border-neutral-700/50 hover:bg-neutral-50/50 dark:hover:bg-neutral-700/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-200">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-neutral-800 dark:text-neutral-200">{nombreCompleto}</div>
                      <div className="text-xs text-neutral-400 dark:text-neutral-500">{docente.email}</div>
                      {/* 🌟 INDICADOR VISUAL DE CREDENCIALES */}
                      <div className="mt-1">
                        {docente.tiene_credenciales ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50">
                            <CheckCircle className="w-3 h-3" /> Con Acceso
                          </span>
                        ) : (
                          <span 
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50 cursor-help" 
                            title="Debe usar 'Habilitar Turno' o 'Notificar a Todos' para generarle contraseña"
                          >
                            <AlertCircle className="w-3 h-3" /> Sin Credenciales
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                      {docente.categoria}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-neutral-800 dark:text-neutral-200">
                      {docente.antiguedad_anios}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select
                        value={docente.estado_turno}
                        onChange={(e) => handleCambioEstadoManual(docente.id, e.target.value)}
                        className={`text-xs font-bold rounded-full px-3 py-1 border outline-none cursor-pointer text-center ${
                          docente.estado_turno === 'Completado' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800/50' :
                          docente.estado_turno === 'Notificado' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50' :
                          'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-600'
                        }`}
                      >
                        <option value="Pendiente" className="bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">Pendiente</option>
                        <option value="Notificado" className="bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">Notificado / Eligiendo</option>
                        <option value="Completado" className="bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">Completado</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {docente.estado_turno === 'Pendiente' ? (
                        <button
                          onClick={() => handleHabilitarTurno(docente.id, nombreCompleto)}
                          disabled={!esSuTurno || actionLoading === docente.id}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            esSuTurno 
                              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                              : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                          }`}
                          title={!esSuTurno ? "Debe esperar a que los docentes anteriores finalicen su selección" : ""}
                        >
                          {actionLoading === docente.id ? (
                            <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Procesando...</>
                          ) : (
                            <>
                              <Send size={14} />
                              Habilitar Turno
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-neutral-400 dark:text-neutral-500 italic font-medium">No requiere acción</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              
              {docentes.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-neutral-400 dark:text-neutral-500 font-medium">
                    No se encontraron docentes en el escalafón para este semestre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SecretariaPanel;