import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  Calendar, 
  Trash2, 
  MapPin, 
  Inbox, 
  Clock, 
  Pencil, 
  X, 
  RefreshCw, 
  Save,
  AlertCircle
} from 'lucide-react';

const timeToMinutes = (t) => {
  if (!t || typeof t !== 'string') return 0;
  const parts = t.slice(0, 5).split(':').map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  return h * 60 + m;
};

const getColorCurso = (codigo) => {
  let hash = 0;
  const safeCodigo = String(codigo || 'SC');
  for (let i = 0; i < safeCodigo.length; i++) {
    hash = safeCodigo.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return {
    bg: `hsla(${hue}, 75%, 92%, 0.85)`,
    border: `hsla(${hue}, 70%, 35%, 1)`,
    text: `hsla(${hue}, 80%, 22%, 1)`,
    sub: `hsla(${hue}, 60%, 35%, 1)`,
  };
};

const formatAMPM = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return "Sin hora";
  const parts = timeStr.split(":");
  if (parts.length === 0) return "Sin hora";
  const hour = parseInt(parts[0], 10);
  if (isNaN(hour)) return "Sin hora";
  const ampm = hour >= 12 ? "PM" : "AM";
  let displayHour = hour % 12;
  displayHour = displayHour ? displayHour : 12; 
  return `${String(displayHour).padStart(2, "0")}:00 ${ampm}`;
};

const MiHorario = () => {
  const { user } = useAuth();
  const [horarios, setHorarios] = useState([]);
  const [horariosGlobales, setHorariosGlobales] = useState([]);
  const [config, setConfig] = useState(null);
  const [semestre, setSemestre] = useState('');
  const [demoEstado, setDemoEstado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [miPerfil, setMiPerfil] = useState(null);

  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({ dia: "Lunes", hora_inicio: "", hora_fin: "", aula_id: "", laboratorio_id: "" });
  const [guardando, setGuardando] = useState(false);
  
  const [ambientesValidadosAPI, setAmbientesValidadosAPI] = useState([]);
  const [cargandoAmbientes, setCargandoAmbientes] = useState(false);

  const dias = config?.dias_habiles 
    ? (Array.isArray(config.dias_habiles) ? config.dias_habiles : config.dias_habiles.split(','))
    : ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];

  const cargarDatos = useCallback(async () => {
    try {
      const resConfig = await api.get('/configuracion');
      const configuracionData = resConfig.data?.data || {};
      setConfig(configuracionData);
      
      const semestreActivo = configuracionData?.semestre_activo || '2026-1';
      setSemestre(semestreActivo);

      const [resHorariosDocente, resHorariosGlobales] = await Promise.all([
        api.get('/docente/mi-horario', { params: { semestre: semestreActivo } }),
        api.get('/horarios', { params: { semestre: semestreActivo } })
      ]);

      setHorarios(Array.isArray(resHorariosDocente?.data?.data) ? resHorariosDocente.data.data : []);
      setHorariosGlobales(Array.isArray(resHorariosGlobales?.data?.data) ? resHorariosGlobales.data.data : []); 

      // Obtener el perfil del docente por separado para no romper la carga si falla
      try {
        const resPerfil = await api.get('/docente/mi-perfil');
        setMiPerfil(resPerfil.data?.data);
      } catch (err) {
        console.warn("No se pudo cargar el perfil del docente (ruta no disponible)", err);
      }

      try {
        const resDemo = await api.get('/demo/estado');
        if (resDemo?.data?.data?.config?.demo_mode) {
          setDemoEstado(resDemo?.data?.data?.turnos || null);
        }
      } catch { /* Ignorado */ }
    } catch (err) {
      console.error('Error cargando horario:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // 1. Validamos estrictamente convirtiendo el valor que viene de la BD a texto minúscula
  const modoTurnosActivo = String(config?.docentes_pueden_asignar).toLowerCase() === 'true';

  // 2. Evaluamos si el modo turnos está activo Y si es el turno de este docente
  const tienePermisoEdicion = 
    modoTurnosActivo && 
    (miPerfil?.estado_turno === 'Notificado' || demoEstado?.turnoActual?.docente_id === user?.id);

  const refrescarDisponibilidadAmbientesAPI = useCallback(async (diaStr, hIni, hFin, tipoAsig, idHorario) => {
    if (!diaStr || !hIni || !hFin || !tipoAsig) return;
    setCargandoAmbientes(true);
    try {
      const idParaExcluir = idHorario ? Number(idHorario) : -1;
      const tipoLimpio = String(tipoAsig).includes("Laboratorio") ? "Laboratorio" : "Teoria";
      
      const res = await api.get("/horarios/ambientes-disponibilidad", {
        params: {
          dia: String(diaStr).trim(),
          hora_inicio: String(hIni).slice(0, 5),
          hora_fin: String(hFin).slice(0, 5),
          tipo: tipoLimpio,
          semestre: semestre || "2026-1",
          excludeId: idParaExcluir
        }
      });
      setAmbientesValidadosAPI(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error("Error consultando disponibilidad de ambientes:", err);
      setAmbientesValidadosAPI([]);
    } finally {
      setCargandoAmbientes(false);
    }
  }, [semestre]);

  useEffect(() => {
    if (editando && editForm.dia && editForm.hora_inicio && editForm.hora_fin) {
      const tipoCursoActual = editando.tipo || editando.tipo_asignacion || editando.curso?.tipo || "Teoria";
      refrescarDisponibilidadAmbientesAPI(
        editForm.dia,
        editForm.hora_inicio,
        editForm.hora_fin,
        tipoCursoActual,
        editando.id
      );
    }
  }, [editForm.dia, editForm.hora_inicio, editForm.hora_fin, editando, refrescarDisponibilidadAmbientesAPI]);

  const horasDisponibles = useMemo(() => {
    const inicio = config?.hora_inicio || "07:00";
    const fin = config?.hora_fin || "22:00";
    const hIni = parseInt(String(inicio).split(":")[0] || 7, 10);
    const hFin = parseInt(String(fin).split(":")[0] || 22, 10);
    
    const lista = [];
    for (let h = hIni; h <= hFin; h++) {
      lista.push(`${String(h).padStart(2, "0")}:00`);
    }
    return lista;
  }, [config]);

  const abrirEdicion = (h) => {
    if (!h) return;
    const hIniLimpia = h.hora_inicio ? String(h.hora_inicio).slice(0, 5) : "";
    const hFinLimpia = h.hora_fin ? String(h.hora_fin).slice(0, 5) : "";
    const tipoCursoActual = h.tipo || h.tipo_asignacion || h.curso?.tipo || "Teoria";

    setEditando(h);
    setEditForm({
      dia: h.dia ? String(h.dia).trim() : "Lunes",
      hora_inicio: hIniLimpia,
      hora_fin: hFinLimpia,
      aula_id: h.aula_id || h.aula?.id || "",
      laboratorio_id: h.laboratorio_id || h.laboratorio?.id || "",
    });

    refrescarDisponibilidadAmbientesAPI(h.dia || "Lunes", hIniLimpia, hFinLimpia, tipoCursoActual, h.id);
  };

  const handleCambioHoraInicioEdit = (horaIni) => {
    if (!editando || !horaIni) return;
    
    const hIniMin = timeToMinutes(editando.hora_inicio);
    const hFinMin = timeToMinutes(editando.hora_fin);
    const minutosRequeridos = hFinMin - hIniMin; 

    const nuevoIniMin = timeToMinutes(horaIni);
    const nuevoFinMin = nuevoIniMin + minutosRequeridos;

    const hFin = String(Math.floor(nuevoFinMin / 60)).padStart(2, "0");
    const mFin = String(nuevoFinMin % 60).padStart(2, "0");
    const hFinCalculada = `${hFin}:${mFin}`;

    setEditForm({
      ...editForm,
      hora_inicio: horaIni,
      hora_fin: hFinCalculada
    });
  };

  const verificarConflictoEdit = (horaIniPropuesta) => {
    if (!editando) return null;

    const hIniMinOriginal = timeToMinutes(editando.hora_inicio);
    const hFinMinOriginal = timeToMinutes(editando.hora_fin);
    const minutosRequeridos = hFinMinOriginal - hIniMinOriginal;

    const iniPropuestoMin = timeToMinutes(horaIniPropuesta);
    const finPropuestoMin = iniPropuestoMin + minutosRequeridos;

    const limiteFinMin = timeToMinutes(config?.hora_fin || "22:00");
    if (finPropuestoMin > limiteFinMin) {
      return `Excede el cierre (${config?.hora_fin})`;
    }

    const cicloCursoActual = editando.curso?.ciclo;
    const targetDia = String(editForm?.dia).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

    for (const h of horariosGlobales) {
      if (h && h.id !== editando.id) {
        const currentDia = String(h.dia).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
        if (currentDia === targetDia) {
          const hIniMin = timeToMinutes(h.hora_inicio);
          const hFinMin = timeToMinutes(h.hora_fin);

          if (iniPropuestoMin < hFinMin && finPropuestoMin > hIniMin) {
            const hDocenteId = h.docente?.id || h.docente_id;
            if (String(hDocenteId) === String(user?.id)) {
              return "Cruza con tu horario";
            }
            const hCiclo = h.curso?.ciclo || h.ciclo;
            if (hCiclo && cicloCursoActual && String(hCiclo) === String(cicloCursoActual)) {
              return `Ciclo ${hCiclo} ocupado`;
            }
          }
        }
      }
    }
    return null;
  };

  const handleGuardarEdicion = async () => {
    setGuardando(true);
    try {
      const payload = {
        dia: editForm?.dia || "Lunes",
        hora_inicio: editForm?.hora_inicio,
        hora_fin: editForm?.hora_fin,
        aula_id: editForm?.aula_id ? Number(editForm.aula_id) : null,
        laboratorio_id: editForm?.laboratorio_id ? Number(editForm.laboratorio_id) : null
      };
      
      await api.put(`/horarios/docente-editar/${editando.id}`, payload);
      setEditando(null); 
      await cargarDatos(); 
    } catch (err) {
      console.error("Error detallado:", err);
      alert(err?.response?.data?.message || "Error al modificar el horario.");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarHorario = async (id) => {
    if (!confirm('¿Eliminar este horario?')) return;
    try {
      await api.delete(`/docente/horario/${id}`);
      cargarDatos();
    } catch (err) {
      alert(err?.response?.data?.message || 'Error al eliminar');
    }
  };

  const bloques = useMemo(() => {
    if (!config) return [];
    const inicio = config.hora_inicio || '07:00';
    const fin = config.hora_fin || '22:00';
    const duracion = 60;
    
    const hIni = parseInt(String(inicio).split(":")[0] || 7, 10);
    const mIni = parseInt(String(inicio).split(":")[1] || 0, 10);
    const hFin = parseInt(String(fin).split(":")[0] || 22, 10);
    
    const inicioMin = hIni * 60 + mIni;
    const finMin = hFin * 60;
    const bloquesLista = [];
    
    for (let i = inicioMin; i + duracion <= finMin; i += duracion) {
      const h1 = String(Math.floor(i / 60)).padStart(2, '0');
      const m1 = String(i % 60).padStart(2, '0');
      const h2 = String(Math.floor((i + duracion) / 60)).padStart(2, '0');
      const m2 = String((i + duracion) % 60).padStart(2, '0');
      bloquesLista.push({ inicio: `${h1}:${m1}`, fin: `${h2}:${m2}`, label: `${h1}:${m1} - ${h2}:${m2}` });
    }
    return bloquesLista;
  }, [config]);

  const horarioEnBloque = (dia, bloqueInicio, bloqueFin) => {
    const bloqueIniMin = timeToMinutes(bloqueInicio);
    const bloqueFinMin = timeToMinutes(bloqueFin);
    const targetDia = String(dia).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

    return (horarios || []).find(h => {
      if (!h) return false;
      const currentDia = String(h.dia).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
      if (currentDia !== targetDia) return false;

      const hIniMin = timeToMinutes(h.hora_inicio);
      const hFinMin = timeToMinutes(h.hora_fin);
      return hIniMin <= bloqueIniMin && hFinMin >= bloqueFinMin;
    });
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton h-7 w-36 mb-6 dark:opacity-20" />
        <div className="card overflow-hidden dark:bg-neutral-800 dark:border-neutral-700">
          <div className="flex">
            <div className="w-36 p-3">
              {[...Array(5)].map((_, i) => <div key={`skel-h-${i}`} className="skeleton h-14 w-full mb-1 rounded dark:opacity-20" />)}
            </div>
            {dias.map((dia, i) => (
              <div key={`skel-d-${i}`} className="flex-1 p-1.5">
                {[...Array(5)].map((_, j) => <div key={`skel-b-${i}-${j}`} className="skeleton h-14 w-full mb-1 rounded dark:opacity-20" />)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const tipoAsignacion = editando?.tipo || editando?.tipo_asignacion || editando?.curso?.tipo || "Teoria";
  const esTeoria = String(tipoAsignacion).includes("Teoria") || String(tipoAsignacion).includes("Teoría");

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      
      {/* 🌟 AVISO DE FASE DE DISPONIBILIDAD (Solo visible si no pueden editar) 🌟 */}
      {!config?.docentes_pueden_asignar && (
        <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/50 text-indigo-800 dark:text-indigo-300 p-4 rounded-xl mb-6 flex gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h4 className="font-bold">Fase de Disponibilidad Activa</h4>
            <p className="text-sm mt-1 text-indigo-700 dark:text-indigo-400">
              El sistema se encuentra en modo recolección de preferencias. La asignación oficial de horarios está a cargo de la Secretaría. 
              <strong className="dark:text-indigo-200"> Las modificaciones directas están deshabilitadas.</strong>
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            Mi Horario
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {(horarios || []).length} clase{(horarios || []).length !== 1 ? 's' : ''} asignada{(horarios || []).length !== 1 ? 's' : ''}
            {semestre && <span className="ml-2 text-neutral-400 dark:text-neutral-500">· Semestre: {semestre}</span>}
          </p>
        </div>
        
        {config?.docentes_pueden_asignar && demoEstado?.turnoActual && (
          <div className={`badge px-3 py-1.5 ${demoEstado.turnoActual.docente_id === user?.id ? 'bg-success-100 text-success-800 dark:bg-success-900/40 dark:text-success-400' : 'bg-warning-100 text-warning-800 dark:bg-warning-900/40 dark:text-warning-400'}`}>
            {demoEstado.turnoActual.docente_id === user?.id ? 'Tu turno — Puedes seleccionar' : `Esperando turno (${demoEstado.turnoActual.nombre})`}
          </div>
        )}
      </div>

      {(horarios || []).length === 0 ? (
        <div className="card dark:bg-neutral-800 dark:border-neutral-700">
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-700/50 flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-1">Sin horarios asignados</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center max-w-md">
              No tienes horarios asignados para el semestre <strong className="dark:text-neutral-300">{semestre}</strong>.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Grid */}
          <div className="hidden md:block card overflow-hidden dark:bg-neutral-800 dark:border-neutral-700">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-900/50">
                    <th className="border-b border-r border-neutral-200 dark:border-neutral-700 p-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase w-36 sticky left-0 bg-neutral-50 dark:bg-neutral-900 z-10">
                      Bloque
                    </th>
                    {dias.map(dia => (
                      <th key={`th-${dia}`} className="border-b border-r border-neutral-200 dark:border-neutral-700 p-3 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase min-w-[160px] last:border-r-0">
                        {dia}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bloques.map((bloque, idx) => (
                    <tr key={`tr-${bloque.label}-${idx}`} className={idx % 2 === 0 ? 'bg-white dark:bg-neutral-800' : 'bg-neutral-50/30 dark:bg-neutral-800/50'}>
                      <td className="border-b border-r border-neutral-200 dark:border-neutral-700 p-3 text-neutral-600 dark:text-neutral-400 text-sm font-medium sticky left-0 bg-inherit z-10 whitespace-nowrap">
                        {bloque.label}
                      </td>
                      {dias.map(dia => {
                        const h = !loading ? horarioEnBloque(dia, bloque.inicio, bloque.fin) : null;
                        return (
                          <td key={`td-${dia}-${bloque.label}`} className="border-b border-r border-neutral-200 dark:border-neutral-700 p-1.5 align-top last:border-r-0">
                            {h ? (
                              (() => {
                                const color = getColorCurso(h?.curso?.codigo);
                                return (
                                  <div
                                    className={`rounded-lg p-2.5 group border-l-[3px] transition-all ${
                                      tienePermisoEdicion ? 'cursor-pointer hover:shadow-sm' : 'cursor-default opacity-90'
                                    }`}
                                    style={{
                                      backgroundColor: color.bg,
                                      borderLeftColor: color.border,
                                    }}
                                    onClick={() => tienePermisoEdicion && abrirEdicion(h)}
                                  >
                                    <p className="text-xs font-semibold truncate" style={{ color: color.text }}>{h?.curso?.codigo || 'S/C'}</p>
                                    <p className="text-xs truncate" style={{ color: color.sub }}>{h?.curso?.nombre || 'Sin Nombre'}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                      <Clock className="w-3 h-3 flex-shrink-0" style={{ color: color.sub }} />
                                      <span className="text-2xs" style={{ color: color.sub }}>
                                        {formatAMPM(h?.hora_inicio)} - {formatAMPM(h?.hora_fin)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: color.sub }} />
                                      <span className="text-2xs font-medium" style={{ color: color.sub }}>
                                        {h?.aula?.codigo || h?.laboratorio?.codigo || h?.ambiente_secretaria_codigo || 'Sin ambiente'}
                                      </span>
                                    </div>
                                    
                                    {/* Botón Eliminar solo visible si hay permisos */}
                                    {tienePermisoEdicion && (
                                      <div className="flex items-center gap-2 mt-2">
                                        <button
                                          onClick={(e) => { e.stopPropagation(); eliminarHorario(h.id); }}
                                          className="flex items-center gap-1 text-danger-500 hover:text-danger-700 text-2xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                          Eliminar
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()
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
            {dias.map(dia => {
              const targetDia = String(dia).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
              const horariosDelDia = (horarios || []).filter(h => {
                if (!h) return false;
                const currentDia = String(h.dia).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
                return currentDia === targetDia;
              });

              if (horariosDelDia.length === 0) return null;
              return (
                <div key={`mob-${dia}`} className="card overflow-hidden dark:bg-neutral-800 dark:border-neutral-700">
                  <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-700">
                    <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{dia}</h3>
                  </div>
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                    {horariosDelDia
                      .sort((a, b) => String(a?.hora_inicio || '').localeCompare(String(b?.hora_inicio || '')))
                      .map(h => (
                        <div key={`mob-h-${h?.id}`} className="p-3 flex items-start gap-3">
                          <div className="flex-shrink-0 w-14 text-center pt-0.5">
                            <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">{h?.hora_inicio ? String(h.hora_inicio).slice(0, 5) : ""}</p>
                            <p className="text-xs text-neutral-400 dark:text-neutral-500">{h?.hora_fin ? String(h.hora_fin).slice(0, 5) : ""}</p>
                          </div>
                          {(() => {
                            const color = getColorCurso(h?.curso?.codigo);
                            return (
                              <div
                                className={`flex-1 rounded-lg p-2.5 border-l-[3px] ${
                                  tienePermisoEdicion ? 'cursor-pointer hover:opacity-90' : 'cursor-default'
                                }`}
                                style={{
                                  backgroundColor: color.bg,
                                  borderLeftColor: color.border,
                                }}
                                onClick={() => tienePermisoEdicion && abrirEdicion(h)}
                              >
                                <p className="text-sm font-semibold" style={{ color: color.text }}>{h?.curso?.codigo || 'S/C'}</p>
                                <p className="text-xs" style={{ color: color.sub }}>{h?.curso?.nombre || 'Sin Nombre'}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: color.sub }} />
                                  <span className="text-xs font-medium" style={{ color: color.sub }}>
                                    {h?.aula?.codigo || h?.laboratorio?.codigo || h?.ambiente_secretaria_codigo || 'Sin ambiente'}
                                  </span>
                                </div>
                                
                                {tienePermisoEdicion && (
                                  <div className="flex items-center gap-3 mt-2">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); eliminarHorario(h?.id); }}
                                      className="flex items-center gap-1 text-danger-500 hover:text-danger-700 text-xs font-medium"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Eliminar
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Edit Modal (Este solo se abre si se cumplió la condición de permiso) */}
      {editando && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 animate-fade-in" onClick={() => setEditando(null)}>
          <div className="card p-6 w-full max-w-md shadow-modal animate-scale-in dark:bg-neutral-800 dark:border-neutral-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                Modificar Mi Horario
              </h2>
              <button onClick={() => setEditando(null)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Día de la semana</label>
                <select value={editForm?.dia || "Lunes"} onChange={(e) => setEditForm({ ...editForm, dia: e.target.value })} className="input w-full dark:bg-neutral-900 dark:border-neutral-700 dark:text-white">
                  {dias.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Hora Inicio</label>
                  <select value={editForm?.hora_inicio || ""} onChange={(e) => handleCambioHoraInicioEdit(e.target.value)} className="input w-full font-medium dark:bg-neutral-900 dark:border-neutral-700 dark:text-white">
                    <option value="" disabled>Seleccione...</option>
                    {horasDisponibles.map((h) => {
                      const conflicto = verificarConflictoEdit(h);
                      return (
                        <option key={`opt-${h}`} value={h} disabled={!!conflicto}>
                          {formatAMPM(h)} {conflicto ? ` - (${conflicto})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-500 mb-1.5 text-neutral-400">Hora Fin (Auto)</label>
                  <input 
                    type="text" 
                    value={editForm?.hora_fin ? formatAMPM(editForm.hora_fin) : "Automático"} 
                    className="input w-full font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 cursor-not-allowed border-transparent dark:border-neutral-700"
                    disabled 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {esTeoria ? "Seleccionar Aula" : "Seleccionar Laboratorio"}
                  {cargandoAmbientes && <span className="text-3xs text-primary-600 dark:text-primary-400 animate-pulse ml-2">(Sincronizando...)</span>}
                </label>
                
                <select 
                  value={esTeoria ? (editForm.aula_id ? String(editForm.aula_id) : "") : (editForm.laboratorio_id ? String(editForm.laboratorio_id) : "")} 
                  onChange={(e) => {
                    if (esTeoria) {
                      setEditForm({ ...editForm, aula_id: e.target.value, laboratorio_id: null });
                    } else {
                      setEditForm({ ...editForm, laboratorio_id: e.target.value, aula_id: null });
                    }
                  }} 
                  className="input w-full font-medium bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white border border-neutral-300 dark:border-neutral-700 rounded p-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={cargandoAmbientes}
                >
                  <option value="">Seleccione el ambiente físico...</option>
                  {(ambientesValidadosAPI || []).map(amb => (
                    <option key={amb.id} value={String(amb.id)} disabled={amb.esta_ocupado} className="dark:bg-neutral-900 dark:text-white">
                      {amb.codigo} — Cap: {amb.capacidad} {amb.esta_ocupado ? "❌ (OCUPADO)" : "✅ (DISPONIBLE)"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-neutral-100 dark:border-neutral-700/50">
                <button onClick={() => setEditando(null)} className="btn-ghost dark:text-neutral-300 dark:hover:bg-neutral-700" disabled={guardando || cargandoAmbientes}>Cancelar</button>
                <button onClick={handleGuardarEdicion} disabled={guardando || !editForm?.hora_inicio || cargandoAmbientes} className="btn-primary flex items-center gap-2">
                  {guardando ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Procesando...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Guardar Cambios</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiHorario;