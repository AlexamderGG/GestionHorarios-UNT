import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../services/api';
import { Users, Clock, CheckCircle, XCircle, BookOpen, Save, X, RefreshCw, AlertCircle, Calendar } from 'lucide-react';

const formatAMPM = (timeStr) => {
  if (!timeStr) return "";
  const [hour, min] = String(timeStr).split(":");
  let h = parseInt(hour, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${min} ${ampm}`;
};

const timeToMins = (t) => {
  if (!t) return 0;
  const [h, m] = String(t).split(':').map(Number);
  return h * 60 + (m || 0);
};

const checkOverlap = (start1, end1, start2, end2) => {
  if (!start1 || !end1 || !start2 || !end2) return false;
  const s1 = timeToMins(start1); const e1 = timeToMins(end1);
  const s2 = timeToMins(start2); const e2 = timeToMins(end2);
  return s1 < e2 && e1 > s2; 
};

const PlanificacionSecretaria = () => {
  const [config, setConfig] = useState(null);
  const [analisis, setAnalisis] = useState([]);
  const [horariosGlobales, setHorariosGlobales] = useState([]); 
  const [semestre, setSemestre] = useState('');
  const [docenteSelect, setDocenteSelect] = useState(null);
  const [loading, setLoading] = useState(true);

  const [asigModal, setAsigModal] = useState(null);
  const [form, setForm] = useState({ dia: 'Lunes', hora_inicio: '', hora_fin: '', ambiente_id: '' });
  const [ambientesDisponibles, setAmbientesDisponibles] = useState([]);
  const [cargandoAmbientes, setCargandoAmbientes] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
      const resConf = await api.get('/configuracion');
      const configData = resConf.data?.data || {};
      setConfig(configData);
      
      const semestreActivo = configData.semestre_activo || "2026-1";
      setSemestre(semestreActivo);

      const [resAnalisis, resHorarios] = await Promise.all([
        api.get('/disponibilidades/analisis', { params: { semestre: semestreActivo } }),
        api.get('/horarios', { params: { semestre: semestreActivo } })
      ]);
      
      setAnalisis(resAnalisis.data?.data || []);
      setHorariosGlobales(resHorarios.data?.data || []);
      
      setDocenteSelect(prev => {
        if (!prev) return null;
        return resAnalisis.data?.data.find(d => d.id === prev.id) || null;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []); 

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    if (asigModal && form.dia && form.hora_inicio && form.hora_fin) {
      const fetchAmbientes = async () => {
        setCargandoAmbientes(true);
        try {
          const res = await api.get('/horarios/ambientes-disponibilidad', {
            params: { dia: form.dia, hora_inicio: form.hora_inicio, hora_fin: form.hora_fin, tipo: asigModal.tipo, semestre }
          });
          setAmbientesDisponibles(res.data?.data || []);
        } catch (error) {
          console.error("Error cargando ambientes", error);
        } finally {
          setCargandoAmbientes(false);
        }
      };
      fetchAmbientes();
    } else {
      setAmbientesDisponibles([]);
    }
  }, [form.dia, form.hora_inicio, form.hora_fin, asigModal, semestre]);

  const handleAbrirModal = (asig) => {
    setAsigModal(asig);
    setForm({ dia: diasHabiles[0] || 'Lunes', hora_inicio: '', hora_fin: '', ambiente_id: '' });
  };

  const calcularHoraFin = (horaIni) => {
    if (!horaIni || !asigModal) return "";
    const horasReq = asigModal.tipo === 'Teoria' ? asigModal.horas_aula : asigModal.horas_lab;
    const [h, m] = String(horaIni).split(":").map(Number);
    return `${String(h + horasReq).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`;
  };

  const checkHoraStatus = (horaCandidate) => {
    if (!form.dia || !docenteSelect || !asigModal) return { invalida: true, motivo: '' };
    const horaFinCandidate = calcularHoraFin(horaCandidate);

    // a) Límite de cierre desde la Configuración Dinámica
    const horaCierre = config?.hora_fin || "22:00";
    if (timeToMins(horaFinCandidate) > timeToMins(horaCierre)) {
      return { invalida: true, motivo: `(Excede cierre ${formatAMPM(horaCierre)})` };
    }

    // b) NO choque con un bloque RESTRINGIDO del docente
    const restricciones = docenteSelect.disponibilidades.filter(d => d.tipo === 'RESTRINGIDO' && d.dia === form.dia);
    for (let r of restricciones) {
      if (checkOverlap(horaCandidate, horaFinCandidate, r.hora_inicio, r.hora_fin)) {
        return { invalida: true, motivo: '(Restricción del docente)' };
      }
    }

    // c) NO choque con un horario YA ASIGNADO a este docente
    const horariosProgramados = docenteSelect.horarios.filter(h => h.dia === form.dia);
    for (let h of horariosProgramados) {
      if (checkOverlap(horaCandidate, horaFinCandidate, h.hora_inicio, h.hora_fin)) {
        return { invalida: true, motivo: '(Docente ya tiene clase)' };
      }
    }

    // d) NO choque con otra clase del MISMO CICLO
    if (asigModal.curso_ciclo && String(asigModal.curso_ciclo) !== "0") {
      const horariosMismoCiclo = horariosGlobales.filter(h => {
        const cicloHorario = h.curso?.ciclo || h.ciclo || h.curso_ciclo;
        return h.dia === form.dia && String(cicloHorario) === String(asigModal.curso_ciclo);
      });
      
      for (let h of horariosMismoCiclo) {
        if (checkOverlap(horaCandidate, horaFinCandidate, h.hora_inicio, h.hora_fin)) {
          return { invalida: true, motivo: `(Cruce en ciclo ${asigModal.curso_ciclo})` };
        }
      }
    }

    return { invalida: false, motivo: '' };
  };

  // Leer los días hábiles de la configuración dinámica
  const diasHabiles = config?.dias_habiles 
    ? (Array.isArray(config.dias_habiles) ? config.dias_habiles : String(config.dias_habiles).split(','))
    : ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];

  const handleGuardarHorario = async () => {
    setGuardando(true);
    try {
      await api.post('/horarios', {
        asignacion_id: asigModal.id,
        dia: form.dia,
        hora_inicio: form.hora_inicio,
        hora_fin: form.hora_fin,
        aula_id: asigModal.tipo === "Teoria" ? Number(form.ambiente_id) : null,
        laboratorio_id: asigModal.tipo === "Laboratorio" ? Number(form.ambiente_id) : null,
      });
      setAsigModal(null);
      cargarDatos();
    } catch (err) {
      alert(err.response?.data?.message || "Error al asignar horario");
    } finally {
      setGuardando(false);
    }
  };

  // Generar horas del combobox de forma dinámica según la Configuración
  const horasBase = useMemo(() => {
    const inicio = config?.hora_inicio || "07:00";
    const fin = config?.hora_fin || "22:00";
    const [hIni] = inicio.split(":").map(Number);
    const [hFin] = fin.split(":").map(Number);
    
    const lista = [];
    for (let h = hIni; h < hFin; h++) {
      lista.push(`${String(h).padStart(2, "0")}:00`);
    }
    return lista;
  }, [config]);

  if (loading) return <div className="p-10 text-center animate-pulse text-neutral-500 dark:text-neutral-400">Cargando sala de análisis...</div>;

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-100px)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary-600 dark:text-primary-400" /> Planificación por Escalafón
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Semestre Activo: <span className="font-semibold text-primary-700 dark:text-primary-400">{semestre}</span></p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* PANEL IZQUIERDO: LISTADO POR ESCALAFÓN */}
        <div className="lg:col-span-4 bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
            <h2 className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-600 dark:text-primary-400" /> Escalafón Docente
            </h2>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {analisis.map((doc, idx) => (
              <button
                key={doc.id}
                onClick={() => setDocenteSelect(doc)}
                className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${
                  docenteSelect?.id === doc.id 
                    ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800/50' 
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-700/50 border border-transparent'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">{doc.apellidos}, {doc.nombres}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{doc.categoria} ({doc.antiguedad_anios} años)</p>
                </div>
                {doc.progreso.completado ? (
                  <CheckCircle className="w-5 h-5 text-success-500 dark:text-success-400 flex-shrink-0" />
                ) : (
                  <span className="text-xs font-semibold bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400 px-2 py-1 rounded-md flex-shrink-0">
                    {doc.progreso.listos}/{doc.progreso.total}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* PANEL DERECHO: SALA DE ANÁLISIS */}
        <div className="lg:col-span-8 bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 flex flex-col h-full overflow-hidden">
          {docenteSelect ? (
            <div className="overflow-y-auto flex-1 p-6">
              <div className="border-b border-neutral-100 dark:border-neutral-700 pb-4 mb-6">
                <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white">{docenteSelect.apellidos}, {docenteSelect.nombres}</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Categoría: {docenteSelect.categoria} | Antigüedad: {docenteSelect.antiguedad_anios} años</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-success-50/50 dark:bg-success-900/10 border border-success-100 dark:border-success-900/30 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-success-800 dark:text-success-400 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Horarios Preferidos
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {docenteSelect.disponibilidades.filter(d => d.tipo === 'PREFERIDO').map(d => (
                      <div key={d.id} className="text-xs font-medium text-success-700 dark:text-success-300 bg-white dark:bg-success-900/20 border border-success-200 dark:border-success-800/50 py-1.5 px-3 rounded-lg shadow-sm">
                        <span className="font-bold">{d.dia}:</span> {formatAMPM(d.hora_inicio)} - {formatAMPM(d.hora_fin)}
                      </div>
                    ))}
                    {docenteSelect.disponibilidades.filter(d => d.tipo === 'PREFERIDO').length === 0 && (
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 italic">No registró preferencias.</p>
                    )}
                  </div>
                </div>

                <div className="bg-danger-50/50 dark:bg-danger-900/10 border border-danger-100 dark:border-danger-900/30 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-danger-800 dark:text-danger-400 mb-3 flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> Restricciones (No asignar)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {docenteSelect.disponibilidades.filter(d => d.tipo === 'RESTRINGIDO').map(d => (
                      <div key={d.id} className="text-xs font-medium text-danger-700 dark:text-danger-300 bg-white dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 py-1.5 px-3 rounded-lg shadow-sm">
                        <span className="font-bold">{d.dia}:</span> {formatAMPM(d.hora_inicio)} - {formatAMPM(d.hora_fin)}
                      </div>
                    ))}
                    {docenteSelect.disponibilidades.filter(d => d.tipo === 'RESTRINGIDO').length === 0 && (
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 italic">No registró restricciones.</p>
                    )}
                  </div>
                </div>

                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-4 md:col-span-2">
                  <h3 className="text-sm font-bold text-indigo-800 dark:text-indigo-400 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Clases ya programadas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {docenteSelect.horarios.map(h => (
                      <div key={h.id} className="text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-white dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 py-1.5 px-3 rounded-lg shadow-sm">
                        <span className="font-bold">{h.dia}:</span> {formatAMPM(h.hora_inicio)} - {formatAMPM(h.hora_fin)}
                      </div>
                    ))}
                    {docenteSelect.horarios.length === 0 && (
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 italic">No tiene clases programadas aún.</p>
                    )}
                  </div>
                </div>
              </div>

              <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" /> Cursos a Asignar
              </h3>
              
              <div className="space-y-3">
                {docenteSelect.asignaciones.map(asig => (
                  <div key={asig.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${asig.programado ? 'bg-neutral-50 dark:bg-neutral-900/30 border-neutral-200 dark:border-neutral-700/50 opacity-70' : 'bg-white dark:bg-neutral-800 border-primary-200 dark:border-primary-800/50 shadow-sm'}`}>
                    <div>
                      <p className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">[{asig.curso_codigo}] {asig.curso_nombre}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        Ciclo: <span className="font-medium text-neutral-700 dark:text-neutral-300">{asig.curso_ciclo}</span> | 
                        Tipo: <span className="font-medium text-neutral-700 dark:text-neutral-300">{asig.tipo}</span> | 
                        Requiere: <span className="font-medium text-neutral-700 dark:text-neutral-300">{asig.tipo === 'Teoria' ? asig.horas_aula : asig.horas_lab} hrs seguidas</span>
                      </p>
                    </div>
                    {asig.programado ? (
                      <span className="bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 px-3 py-1.5 rounded-full text-xs font-bold flex items-center justify-center gap-1 self-start sm:self-auto">
                        <CheckCircle className="w-3.5 h-3.5" /> Programado
                      </span>
                    ) : (
                      <button onClick={() => handleAbrirModal(asig)} className="btn-primary py-1.5 px-4 text-xs self-start sm:self-auto">
                        Programar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 p-6 text-center">
              <Users className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium text-neutral-600 dark:text-neutral-400">Seleccione un Docente</p>
              <p className="text-sm mt-1 max-w-sm">Haga clic en un docente a la izquierda para ver su disponibilidad.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PROGRAMAR */}
      {asigModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl w-full max-w-md animate-scale-in overflow-hidden border border-neutral-200 dark:border-neutral-700">
            <div className="p-5 border-b border-neutral-100 dark:border-neutral-700 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">Programar: {asigModal.curso_codigo}</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{asigModal.curso_nombre} ({asigModal.tipo}) - Ciclo {asigModal.curso_ciclo}</p>
              </div>
              <button onClick={() => setAsigModal(null)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">Día</label>
                <select 
                  value={form.dia} 
                  onChange={(e) => setForm({...form, dia: e.target.value, hora_inicio: '', hora_fin: '', ambiente_id: ''})} 
                  className="input w-full dark:bg-neutral-900 dark:border-neutral-700 dark:text-white"
                >
                  {diasHabiles.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">Horario de la Clase</label>
                <select 
                  value={form.hora_inicio} 
                  onChange={(e) => {
                    const newIni = e.target.value;
                    setForm({...form, hora_inicio: newIni, hora_fin: calcularHoraFin(newIni), ambiente_id: ''});
                  }} 
                  className="input w-full dark:bg-neutral-900 dark:border-neutral-700 dark:text-white"
                >
                  <option value="">Seleccione un horario...</option>
                  {horasBase.map(h => {
                    const status = checkHoraStatus(h);
                    const hFinVisual = asigModal ? calcularHoraFin(h) : "";
                    return (
                      <option 
                        key={h} 
                        value={h} 
                        disabled={status.invalida}
                        className={status.invalida ? 'text-danger-500 dark:text-danger-400' : 'text-neutral-900 dark:text-neutral-200'}
                      >
                        {formatAMPM(h)} - {formatAMPM(hFinVisual)} {status.invalida ? `❌ ${status.motivo}` : ''}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {asigModal.tipo === 'Teoria' ? 'Aula Libre' : 'Lab Libre'}
                  {cargandoAmbientes && <span className="text-primary-600 dark:text-primary-400 text-[10px] ml-2 animate-pulse">(Buscando...)</span>}
                </label>
                <select 
                  value={form.ambiente_id} 
                  onChange={(e) => setForm({...form, ambiente_id: e.target.value})} 
                  className="input w-full dark:bg-neutral-900 dark:border-neutral-700 dark:text-white" 
                  disabled={!form.hora_inicio || cargandoAmbientes}
                >
                  <option value="">Seleccione un ambiente libre...</option>
                  {ambientesDisponibles.map(a => (
                    <option key={a.id} value={a.id} disabled={a.esta_ocupado}>
                      {a.codigo} (Cap: {a.capacidad}) {a.esta_ocupado ? '❌ Ocupado' : '✅ Libre'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 flex justify-end gap-2">
              <button onClick={() => setAsigModal(null)} className="btn-ghost dark:text-neutral-300 dark:hover:bg-neutral-800 text-sm py-2">Cancelar</button>
              <button onClick={handleGuardarHorario} disabled={guardando || !form.ambiente_id} className="btn-primary text-sm py-2 flex items-center gap-2">
                {guardando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanificacionSecretaria;