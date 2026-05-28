import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  Calendar, 
  Trash2, 
  MapPin, 
  User, 
  Inbox, 
  Clock, 
  Pencil, 
  X, 
  RefreshCw, 
  Save    
} from 'lucide-react';

// 🛡️ Nunca falla aunque reciba valores nulos o corruptos
const timeToMinutes = (t) => {
  if (!t || typeof t !== 'string') return 0;
  const parts = t.slice(0, 5).split(':').map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  return h * 60 + m;
};

// 🛡️ Protegido contra códigos numéricos o vacíos
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

// Convierte formato de 24h a formato legible AM/PM de forma segura
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

  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({ dia: "Lunes", hora_inicio: "", hora_fin: "", aula_id: "", laboratorio_id: "" });
  const [aulas, setAulas] = useState([]);
  const [laboratorios, setLaboratorios] = useState([]);
  const [guardando, setGuardando] = useState(false);

  // DÍAS DINÁMICOS: Esto repara el problema de que no se mostraba el Sábado
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

      const dataDocente = resHorariosDocente?.data?.data;
      const dataGlobal = resHorariosGlobales?.data?.data;
      
      setHorarios(Array.isArray(dataDocente) ? dataDocente : []);
      setHorariosGlobales(Array.isArray(dataGlobal) ? dataGlobal : []); 

      try {
        const resDemo = await api.get('/demo/estado');
        const demoData = resDemo?.data?.data?.config;
        if (demoData?.demo_mode) {
          setDemoEstado(resDemo?.data?.data?.turnos || null);
        }
      } catch { /* Ignorado en silencio */ }
    } catch (err) {
      console.error('Error cargando horario:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

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

  const ambientesOcupadosEnEdicion = useMemo(() => {
    if (!editando) return [];
    const dia = editForm?.dia;
    const hora_inicio = editForm?.hora_inicio;
    const hora_fin = editForm?.hora_fin;
    
    if (!dia || !hora_inicio || !hora_fin) return [];

    const inicioPropuesto = timeToMinutes(hora_inicio);
    const finPropuesta = timeToMinutes(hora_fin);

    const ocupados = [];
    (horariosGlobales || []).forEach((h) => {
      if (h && h.id !== editando.id && h.dia === dia) {
        const hIni = timeToMinutes(h.hora_inicio);
        const hFin = timeToMinutes(h.hora_fin);

        if (hIni < finPropuesta && hFin > inicioPropuesto) {
          if (h.aula?.id) ocupados.push(Number(h.aula.id));
          if (h.laboratorio?.id) ocupados.push(Number(h.laboratorio.id));
        }
      }
    });
    return ocupados;
  }, [editForm, horariosGlobales, editando]);

  const abrirEdicion = async (h) => {
    if (!h) return;
    setEditando(h);
    setEditForm({
      dia: h.dia || "Lunes",
      hora_inicio: h.hora_inicio ? String(h.hora_inicio).slice(0, 5) : "",
      hora_fin: h.hora_fin ? String(h.hora_fin).slice(0, 5) : "",
      aula_id: h.aula?.id || "",
      laboratorio_id: h.laboratorio?.id || "",
    });

    try {
      const [resAulas, resLabs] = await Promise.all([
        api.get("/horarios/aulas"),
        api.get("/horarios/laboratorios")
      ]);
      setAulas(Array.isArray(resAulas?.data?.data) ? resAulas.data.data : []);
      setLaboratorios(Array.isArray(resLabs?.data?.data) ? resLabs.data.data : []);
    } catch (err) {
      console.error("Error cargando infraestructura:", err);
      alert("Aviso: No se pudo sincronizar la lista de ambientes.");
      setEditando(null); 
    }
  };

  const handleCambioHoraInicioEdit = (horaIni) => {
    if (!editando || !horaIni) return;
    
    // Calcula la diferencia real en minutos (Soporta horas y medias horas)
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

  // 👇 NUEVA FUNCIÓN: Verifica cruces y límite de cierre al EDITAR
  const verificarConflictoEdit = (horaIniPropuesta) => {
    if (!editando) return null;

    const hIniMinOriginal = timeToMinutes(editando.hora_inicio);
    const hFinMinOriginal = timeToMinutes(editando.hora_fin);
    const minutosRequeridos = hFinMinOriginal - hIniMinOriginal;

    const iniPropuestoMin = timeToMinutes(horaIniPropuesta);
    const finPropuestoMin = iniPropuestoMin + minutosRequeridos;

    // 1. Validar límite de hora de cierre
    const limiteFinMin = timeToMinutes(config?.hora_fin || "22:00");
    if (finPropuestoMin > limiteFinMin) {
      return `Excede el cierre (${config?.hora_fin})`;
    }

    // 2. Validar cruces con el propio docente o el ciclo
    const cicloCursoActual = editando.curso?.ciclo;

    for (const h of horariosGlobales) {
      if (h && h.id !== editando.id && h.dia === editForm?.dia) {
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
      console.error("Error detallado:", err.response?.data || err);
      alert(err.response?.data?.message || "Error al modificar el horario.");
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
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const generarBloques = () => {
    if (!config) return [];
    const inicio = config.hora_inicio || '07:00';
    const fin = config.hora_fin || '22:00';
    const duracion = 60;
    
    const hIni = parseInt(String(inicio).split(":")[0] || 7, 10);
    const mIni = parseInt(String(inicio).split(":")[1] || 0, 10);
    const hFin = parseInt(String(fin).split(":")[0] || 22, 10);
    
    const inicioMin = hIni * 60 + mIni;
    const finMin = hFin * 60;
    const bloques = [];
    
    for (let i = inicioMin; i + duracion <= finMin; i += duracion) {
      const h1 = String(Math.floor(i / 60)).padStart(2, '0');
      const m1 = String(i % 60).padStart(2, '0');
      const h2 = String(Math.floor((i + duracion) / 60)).padStart(2, '0');
      const m2 = String((i + duracion) % 60).padStart(2, '0');
      bloques.push({ inicio: `${h1}:${m1}`, fin: `${h2}:${m2}`, label: `${h1}:${m1} - ${h2}:${m2}` });
    }
    return bloques;
  };

  const bloques = generarBloques();

  const horarioEnBloque = (dia, bloqueInicio, bloqueFin) => {
    const bloqueIniMin = timeToMinutes(bloqueInicio);
    const bloqueFinMin = timeToMinutes(bloqueFin);
    return (horarios || []).find(h => {
      if (!h || h.dia !== dia) return false;
      const hIniMin = timeToMinutes(h.hora_inicio);
      const hFinMin = timeToMinutes(h.hora_fin);
      return hIniMin <= bloqueIniMin && hFinMin >= bloqueFinMin;
    });
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton h-7 w-36 mb-6" />
        <div className="card overflow-hidden">
          <div className="flex">
            <div className="w-36 p-3">
              {[...Array(5)].map((_, i) => <div key={`skel-h-${i}`} className="skeleton h-14 w-full mb-1 rounded" />)}
            </div>
            {dias.map((dia, i) => (
              <div key={`skel-d-${i}`} className="flex-1 p-1.5">
                {[...Array(5)].map((_, j) => <div key={`skel-b-${i}-${j}`} className="skeleton h-14 w-full mb-1 rounded" />)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary-600" />
            Mi Horario
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {(horarios || []).length} clase{(horarios || []).length !== 1 ? 's' : ''} asignada{(horarios || []).length !== 1 ? 's' : ''}
            {semestre && <span className="ml-2 text-neutral-400">· Semestre: {semestre}</span>}
          </p>
        </div>
        {demoEstado?.turnoActual && (
          <div className={`badge ${demoEstado.turnoActual.docente_id === user?.id ? 'badge-success' : 'badge-warning'}`}>
            {demoEstado.turnoActual.docente_id === user?.id ? 'Tu turno — Puedes seleccionar' : `Esperando turno (${demoEstado.turnoActual.nombre})`}
          </div>
        )}
      </div>

      {(horarios || []).length === 0 ? (
        <div className="card">
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-1">Sin horarios asignados</h3>
            <p className="text-sm text-neutral-500 text-center max-w-md">
              No tienes horarios asignados para el semestre <strong>{semestre}</strong>. Espera a que el administrador genere los horarios o selecciona desde &quot;Mis Cursos&quot;.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Grid */}
          <div className="hidden md:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-neutral-50">
                    <th className="border-b border-r border-neutral-200 p-3 text-left text-xs font-semibold text-neutral-500 uppercase w-36 sticky left-0 bg-neutral-50 z-10">
                      Bloque
                    </th>
                    {dias.map(dia => (
                      <th key={`th-${dia}`} className="border-b border-r border-neutral-200 p-3 text-center text-xs font-semibold text-neutral-500 uppercase min-w-[160px] last:border-r-0">
                        {dia}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(bloques || []).map((bloque, idx) => (
                    <tr key={`tr-${bloque.label}-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50/30'}>
                      <td className="border-b border-r border-neutral-200 p-3 text-neutral-600 text-sm font-medium sticky left-0 bg-inherit z-10 whitespace-nowrap">
                        {bloque.label}
                      </td>
                      {dias.map(dia => {
                        const h = !loading ? horarioEnBloque(dia, bloque.inicio, bloque.fin) : null;
                        return (
                          <td key={`td-${dia}-${bloque.label}`} className="border-b border-r border-neutral-200 p-1.5 align-top last:border-r-0">
                            {h ? (
                              (() => {
                                const color = getColorCurso(h?.curso?.codigo);
                                return (
                                  <div
                                    className="rounded-lg p-2.5 group border-l-[3px] cursor-pointer hover:shadow-sm transition-all"
                                    style={{
                                      backgroundColor: color.bg,
                                      borderLeftColor: color.border,
                                    }}
                                    onClick={() => abrirEdicion(h)}
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
                                    <div className="flex items-center gap-2 mt-2">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); eliminarHorario(h.id); }}
                                        className="flex items-center gap-1 text-danger-500 hover:text-danger-700 text-2xs opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        Eliminar
                                      </button>
                                    </div>
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
              const horariosDelDia = (horarios || []).filter(h => h && h.dia === dia);
              if (horariosDelDia.length === 0) return null;
              return (
                <div key={`mob-${dia}`} className="card overflow-hidden">
                  <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
                    <h3 className="text-sm font-semibold text-neutral-800">{dia}</h3>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    {horariosDelDia
                      .sort((a, b) => String(a?.hora_inicio || '').localeCompare(String(b?.hora_inicio || '')))
                      .map(h => (
                        <div key={`mob-h-${h?.id}`} className="p-3 flex items-start gap-3">
                          <div className="flex-shrink-0 w-14 text-center pt-0.5">
                            <p className="text-xs font-medium text-neutral-800">{h?.hora_inicio ? String(h.hora_inicio).slice(0, 5) : ""}</p>
                            <p className="text-xs text-neutral-400">{h?.hora_fin ? String(h.hora_fin).slice(0, 5) : ""}</p>
                          </div>
                          {(() => {
                            const color = getColorCurso(h?.curso?.codigo);
                            return (
                              <div
                                className="flex-1 rounded-lg p-2.5 border-l-[3px] cursor-pointer"
                                style={{
                                  backgroundColor: color.bg,
                                  borderLeftColor: color.border,
                                }}
                                onClick={() => abrirEdicion(h)}
                              >
                                <p className="text-sm font-semibold" style={{ color: color.text }}>{h?.curso?.codigo || 'S/C'}</p>
                                <p className="text-xs" style={{ color: color.sub }}>{h?.curso?.nombre || 'Sin Nombre'}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: color.sub }} />
                                  <span className="text-xs font-medium" style={{ color: color.sub }}>
                                    {h?.aula?.codigo || h?.laboratorio?.codigo || h?.ambiente_secretaria_codigo || 'Sin ambiente'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 mt-2">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); eliminarHorario(h?.id); }}
                                    className="flex items-center gap-1 text-danger-500 text-xs font-medium"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Eliminar
                                  </button>
                                </div>
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

      {/* Edit Modal */}
      {editando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in" onClick={() => setEditando(null)}>
          <div className="card p-6 w-full max-w-md shadow-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-primary-600" />
                Modificar Mi Horario
              </h2>
              <button onClick={() => setEditando(null)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Día de la semana</label>
                <select value={editForm?.dia || "Lunes"} onChange={(e) => setEditForm({ ...editForm, dia: e.target.value })} className="input w-full">
                  {dias.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Hora Inicio</label>
                  <select value={editForm?.hora_inicio || ""} onChange={(e) => handleCambioHoraInicioEdit(e.target.value)} className="input w-full font-medium">
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
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5 text-neutral-400">Hora Fin (Auto)</label>
                  <input 
                    type="text" 
                    value={editForm?.hora_fin ? formatAMPM(editForm.hora_fin) : "Automático"} 
                    className="input w-full font-semibold bg-neutral-100 text-neutral-500 cursor-not-allowed"
                    disabled 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  {editando?.tipo === "Teoria" || editando?.tipo_asignacion === "Teoria" ? "Seleccionar Aula" : "Seleccionar Laboratorio"}
                </label>
                {editando?.tipo === "Teoria" || editando?.tipo_asignacion === "Teoria" ? (
                  <select value={editForm?.aula_id || ""} onChange={(e) => setEditForm({ ...editForm, aula_id: e.target.value, laboratorio_id: null })} className="input w-full font-medium">
                    <option value="">Seleccione un aula...</option>
                    {(aulas || []).map(a => {
                      if (!a) return null;
                      const estaOcupado = ambientesOcupadosEnEdicion.includes(Number(a.id));
                      return (
                        <option key={`aula-${a.id}`} value={a.id} disabled={estaOcupado}>
                          {a.codigo} — Cap: {a.capacidad} {estaOcupado ? "❌ (OCUPADO)" : "✅ (DISPONIBLE)"}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <select value={editForm?.laboratorio_id || ""} onChange={(e) => setEditForm({ ...editForm, laboratorio_id: e.target.value, aula_id: null })} className="input w-full font-medium">
                    <option value="">Seleccione un laboratorio...</option>
                    {(laboratorios || []).map(l => {
                      if (!l) return null;
                      const estaOcupado = ambientesOcupadosEnEdicion.includes(Number(l.id));
                      return (
                        <option key={`lab-${l.id}`} value={l.id} disabled={estaOcupado}>
                          {l.codigo} — Cap: {l.capacidad} {estaOcupado ? "❌ (OCUPADO)" : "✅ (DISPONIBLE)"}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-neutral-100">
                <button onClick={() => setEditando(null)} className="btn-ghost" disabled={guardando}>Cancelar</button>
                <button onClick={handleGuardarEdicion} disabled={guardando || !editForm?.hora_inicio} className="btn-primary flex items-center gap-2">
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