import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../services/api';
import { Users, Clock, CheckCircle, XCircle, BookOpen, Save, X, RefreshCw, AlertCircle, Calendar, Trash2 } from 'lucide-react';

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

const sumarHoras = (horaIni, horasSumar) => {
  if (!horaIni) return "";
  const [h, m] = String(horaIni).split(":").map(Number);
  const totalMinutos = (h * 60) + m + Math.round(horasSumar * 60);
  const newH = Math.floor(totalMinutos / 60);
  const newM = totalMinutos % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
};

const PlanificacionSecretaria = () => {
  const [config, setConfig] = useState(null);
  const [analisis, setAnalisis] = useState([]);
  const [horariosGlobales, setHorariosGlobales] = useState([]); 
  const [semestre, setSemestre] = useState('');
  const [docenteSelect, setDocenteSelect] = useState(null);
  const [loading, setLoading] = useState(true);

  // ESTADOS DEL ESPACIO DE TRABAJO
  const [borradores, setBorradores] = useState([]);
  const [cursoActivo, setCursoActivo] = useState(null);
  const [ambientesCache, setAmbientesCache] = useState({});
  const [cargandoAmbientesMap, setCargandoAmbientesMap] = useState({});
  const [hoveredCell, setHoveredCell] = useState(null);
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

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  useEffect(() => {
    setBorradores([]);
    setCursoActivo(null);
    setAmbientesCache({});
    setHoveredCell(null);
  }, [docenteSelect]);

  const asignacionesProcesadas = useMemo(() => {
    if (!docenteSelect || !docenteSelect.asignaciones) return [];
    
    let raw = [...docenteSelect.asignaciones];
    
    raw.sort((a, b) => {
      if (a.curso_codigo !== b.curso_codigo) {
        return String(a.curso_codigo).localeCompare(String(b.curso_codigo));
      }
      const order = { 'Teoria': 1, 'Teoría': 1, 'Practica': 2, 'Práctica': 2, 'Laboratorio': 3 };
      const typeA = order[a.tipo] || 4;
      const typeB = order[b.tipo] || 4;
      if (typeA !== typeB) return typeA - typeB;
      return String(a.grupo || '').localeCompare(String(b.grupo || ''));
    });

    return raw;
  }, [docenteSelect]);

  const cursosPendientes = useMemo(() => {
    return asignacionesProcesadas.filter(asig => 
      !asig.programado && !borradores.some(b => b.asignacion_id === asig.id)
    );
  }, [asignacionesProcesadas, borradores]);

  // UNIFICADA: ELIMINAR RESTRICCIÓN Y PREFERENCIA DESDE LA GRILLA
  const handleEliminarDisponibilidad = async (id, tipoDisponibilidad) => {
    if (!window.confirm(`¿Seguro que desea eliminar este bloque ${tipoDisponibilidad} del docente?`)) return;
    try {
      await api.delete(`/disponibilidades/${id}`);
      setDocenteSelect(prev => ({
        ...prev,
        disponibilidades: prev.disponibilidades.filter(d => d.id !== id)
      }));
    } catch (error) {
      console.error("Error al eliminar disponibilidad:", error);
      alert("Hubo un error al intentar eliminar el bloque.");
    }
  };

  const handleEliminarHorarioBD = async (id) => {
    if (!window.confirm("¿Seguro que desea eliminar este horario ya programado en la base de datos? Esta acción es irreversible.")) return;
    try {
      await api.delete(`/horarios/${id}`);
      cargarDatos(); 
    } catch (error) {
      console.error("Error al eliminar el horario:", error);
      alert("Hubo un error al intentar eliminar el horario.");
    }
  };

  const checkHoraStatus = (diaCandidate, horaCandidate, cursoTarget) => {
    const curso = cursoTarget || cursoActivo;
    if (!diaCandidate || !docenteSelect || !curso) return { invalida: true, motivo: '' };
    
    const horaFinCandidate = sumarHoras(horaCandidate, Number(curso.horas_asignadas || 0));
    const horaCierre = config?.hora_fin || "22:00";

    if (timeToMins(horaFinCandidate) > timeToMins(horaCierre)) {
      return { invalida: true, motivo: `Excede cierre (${formatAMPM(horaCierre)})` };
    }

    const restricciones = docenteSelect.disponibilidades.filter(d => d.tipo === 'RESTRINGIDO' && d.dia === diaCandidate);
    for (let r of restricciones) {
      if (checkOverlap(horaCandidate, horaFinCandidate, r.hora_inicio, r.hora_fin)) {
        return { invalida: true, motivo: 'Restricción Docente' };
      }
    }

    const horariosProgramados = docenteSelect.horarios.filter(h => h.dia === diaCandidate);
    for (let h of horariosProgramados) {
      if (checkOverlap(horaCandidate, horaFinCandidate, h.hora_inicio, h.hora_fin)) {
        return { invalida: true, motivo: 'Docente ocupado' };
      }
    }

    const otrosBorradores = borradores.filter(b => b.dia === diaCandidate && b.asignacion_id !== curso.id);
    for (let b of otrosBorradores) {
      if (checkOverlap(horaCandidate, horaFinCandidate, b.hora_inicio, b.hora_fin)) {
        return { invalida: true, motivo: 'Cruce en borrador' };
      }
    }

    const cicloModal = curso.curso_ciclo || curso.ciclo || curso.asignacion?.ciclo;
    if (cicloModal && String(cicloModal) !== "0") {
      const horariosMismoCiclo = horariosGlobales.filter(h => {
          const hCiclo = h.ciclo || h.asignacion?.ciclo || h.asignacion?.curso?.ciclo || h.curso?.ciclo;
          return h.dia === diaCandidate && String(hCiclo) === String(cicloModal);
      });
      const borradoresMismoCiclo = borradores.filter(b => b.dia === diaCandidate && b.asignacion_id !== curso.id && String(b.ciclo) === String(cicloModal));
      
      const isIncomingException = (curso.curso_codigo || '').startsWith('EL-') || curso.tipo === 'Laboratorio';
      let overlapsCount = 0;

      for (let h of horariosMismoCiclo) {
        if (checkOverlap(horaCandidate, horaFinCandidate, h.hora_inicio, h.hora_fin)) {
          const hCodigo = h.asignacion?.curso?.codigo || h.curso?.codigo || '';
          const hTipo = h.asignacion?.tipo || h.tipo || '';
          const isExistingException = hCodigo.startsWith('EL-') || hTipo === 'Laboratorio';
          if (!isIncomingException || !isExistingException) {
            return { invalida: true, motivo: `Cruce Ciclo ${cicloModal}` };
          }
          overlapsCount++;
        }
      }

      for (let b of borradoresMismoCiclo) {
        if (checkOverlap(horaCandidate, horaFinCandidate, b.hora_inicio, b.hora_fin)) {
          const isExistingException = (b.curso_codigo || '').startsWith('EL-') || b.tipo === 'Laboratorio';
          if (!isIncomingException || !isExistingException) {
            return { invalida: true, motivo: `Cruce Ciclo ${cicloModal}` };
          }
          overlapsCount++;
        }
      }

      if (overlapsCount >= 2) {
         return { invalida: true, motivo: `Límite Ciclo ${cicloModal}` };
      }
    }
    return { invalida: false, motivo: '' };
  };

  const isCellInBlock = (diaCell, horaCell, targetDia, targetInicio, horas) => {
    if (diaCell !== targetDia || !targetInicio) return false;
    const start = timeToMins(targetInicio);
    const end = start + Math.round(horas * 60);
    const current = timeToMins(horaCell);
    return current >= start && current < end;
  };

  const getCellOccupation = (dia, hora) => {
    const cellMins = timeToMins(hora);

    // 1. EVALUAR HORARIOS YA REGISTRADOS EN BASE DE DATOS
    const hBD = docenteSelect?.horarios?.find(h => h.dia === dia && cellMins >= timeToMins(h.hora_inicio) && cellMins < timeToMins(h.hora_fin));
    if (hBD) {
      const asigVinculada = docenteSelect?.asignaciones?.find(a => a.id === hBD.asignacion_id);
      const nombreCurso = asigVinculada?.curso_nombre || asigVinculada?.curso?.nombre || 'Clase BD';
      const tipoAsig = asigVinculada?.tipo || hBD.asignacion?.tipo || '';
      const codigoCurso = asigVinculada?.curso_codigo || asigVinculada?.curso?.codigo || '';
      let tituloFinal = codigoCurso ? `[${codigoCurso}] ${nombreCurso}` : nombreCurso;

      return { tipo: 'bd', id: hBD.id, titulo: tituloFinal, tipoCurso: tipoAsig, detalle: `${hBD.hora_inicio.slice(0,5)} - ${hBD.hora_fin.slice(0,5)}` };
    }

    // 2. EVALUAR BORRADORES
    const hBorrador = borradores.find(b => b.dia === dia && cellMins >= timeToMins(b.hora_inicio) && cellMins < timeToMins(b.hora_fin));
    if (hBorrador) return { tipo: 'borrador', id: hBorrador.asignacion_id, titulo: hBorrador.curso_nombre, tipoCurso: hBorrador.tipo };

    // 3. EVALUAR RESTRICCIONES
    const hRestr = docenteSelect?.disponibilidades?.find(d => d.tipo === 'RESTRINGIDO' && d.dia === dia && cellMins >= timeToMins(d.hora_inicio) && cellMins < timeToMins(d.hora_fin));
    if (hRestr) return { tipo: 'restr', id: hRestr.id, titulo: 'Restringido' };

    // 4. EVALUAR PREFERENCIAS
    const hPref = docenteSelect?.disponibilidades?.find(d => d.tipo === 'PREFERIDO' && d.dia === dia && cellMins >= timeToMins(d.hora_inicio) && cellMins < timeToMins(d.hora_fin));
    if (hPref) return { tipo: 'pref', id: hPref.id, titulo: 'Preferido' };

    return null;
  };

  const handleCellClick = async (dia, hora) => {
    if (!cursoActivo) return;
    const status = checkHoraStatus(dia, hora, cursoActivo);
    if (status.invalida) return;

    const horaFin = sumarHoras(hora, cursoActivo.horas_asignadas);
    const nuevoBorrador = {
      asignacion_id: cursoActivo.id,
      curso_codigo: cursoActivo.curso_codigo,
      curso_nombre: cursoActivo.curso_nombre,
      grupo: cursoActivo.grupo,
      ciclo: cursoActivo.curso_ciclo || cursoActivo.ciclo,
      tipo: cursoActivo.tipo,
      horas_asignadas: cursoActivo.horas_asignadas,
      dia,
      hora_inicio: hora,
      hora_fin: horaFin,
      ambiente_id: ''
    };

    setBorradores(prev => [...prev, nuevoBorrador]);
    const cursoIdJustAdded = cursoActivo.id;
    const tipoCursoJustAdded = cursoActivo.tipo;
    setCursoActivo(null);
    setHoveredCell(null);

    const isAula = tipoCursoJustAdded.includes('Teor') || tipoCursoJustAdded.includes('Prac');
    setCargandoAmbientesMap(prev => ({ ...prev, [cursoIdJustAdded]: true }));
    try {
      const res = await api.get('/horarios/ambientes-disponibilidad', {
        params: { dia, hora_inicio: hora, hora_fin: horaFin, tipo: isAula ? 'Teoria' : 'Laboratorio', semestre }
      });
      setAmbientesCache(prev => ({ ...prev, [cursoIdJustAdded]: res.data?.data || [] }));
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoAmbientesMap(prev => ({ ...prev, [cursoIdJustAdded]: false }));
    }
  };

  const handleRemoveBorrador = (asigId) => {
    setBorradores(prev => prev.filter(b => b.asignacion_id !== asigId));
    setAmbientesCache(prev => {
      const copy = { ...prev };
      delete copy[asigId];
      return copy;
    });
  };

  const handleAmbienteChange = (asigId, ambienteId) => {
    setBorradores(prev => prev.map(b => b.asignacion_id === asigId ? { ...b, ambiente_id: ambienteId } : b));
  };

  const handleGuardarPlanificacionCompleta = async () => {
    setGuardando(true);
    try {
      for (let b of borradores) {
        const isAula = b.tipo.includes("Teor") || b.tipo.includes("Prac");
        await api.post('/horarios', {
          asignacion_id: b.asignacion_id,
          dia: b.dia,
          hora_inicio: b.hora_inicio,
          hora_fin: b.hora_fin,
          aula_id: isAula ? Number(b.ambiente_id) : null,
          laboratorio_id: !isAula ? Number(b.ambiente_id) : null,
        });
      }
      alert("¡Planificación guardada exitosamente! Todos los horarios seleccionados han sido procesados.");
      setBorradores([]);
      cargarDatos();
    } catch (err) {
      alert(err.response?.data?.message || "Error al registrar la planificación");
    } finally {
      setGuardando(false);
    }
  };

  const diasHabiles = config?.dias_habiles 
    ? (Array.isArray(config.dias_habiles) ? config.dias_habiles : String(config.dias_habiles).split(','))
    : ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];

  const horasBase = useMemo(() => {
    const inicio = config?.hora_inicio || "07:00";
    const fin = config?.hora_fin || "22:00";
    const [hIni] = inicio.split(":").map(Number);
    const [hFin] = fin.split(":").map(Number);
    const lista = [];
    for (let h = hIni; h < hFin; h++) lista.push(`${String(h).padStart(2, "0")}:00`);
    return lista;
  }, [config]);

  const planificacionValida = useMemo(() => {
    return borradores.length > 0 && borradores.every(b => b.ambiente_id !== '');
  }, [borradores]);

  if (loading) return <div className="p-10 text-center animate-pulse text-neutral-500 dark:text-neutral-400">Cargando sala de análisis...</div>;

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-100px)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary-600 dark:text-primary-400" /> Planificación Interactiva por Escalafón
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Semestre Activo: <span className="font-semibold text-primary-700 dark:text-primary-400">{semestre}</span></p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* PANEL IZQUIERDO: LISTADO POR ESCALAFÓN */}
        <div className="lg:col-span-3 bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 flex flex-col h-full overflow-hidden">
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

        {/* PANEL DERECHO: ÁREA DE TRABAJO DINÁMICA INTEGRADA */}
        <div className="lg:col-span-9 bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 flex flex-col h-full overflow-hidden">
          {docenteSelect ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Resumen Superior Estático Minimalista */}
              <div className="p-4 border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/20 flex flex-col lg:flex-row justify-between lg:items-center gap-4 flex-shrink-0">
                <div>
                  <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white">{docenteSelect.apellidos}, {docenteSelect.nombres}</h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Antigüedad: {docenteSelect.antiguedad_anios} años</p>
                </div>
                <div className="flex flex-row gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-success-600 dark:text-success-400">
                    <div className="w-3 h-3 rounded bg-success-100 dark:bg-success-900/30 border border-success-300 dark:border-success-700"></div> Preferencia
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-danger-600 dark:text-danger-400">
                    <div className="w-3 h-3 rounded bg-danger-100 dark:bg-danger-900/30 border border-danger-300 dark:border-danger-700"></div> Restricción
                  </div>
                </div>
              </div>

              {/* Contenedor Principal Ajustable */}
              <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 overflow-hidden">
                
                {/* AREA CENTRAL: LA CUADRÍCULA INTERACTIVA CON MOUSE */}
                <div className="xl:col-span-8 p-4 overflow-auto flex flex-col h-full border-r border-neutral-100 dark:border-neutral-700 bg-neutral-50/30 dark:bg-neutral-900/10">
                  <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 shadow-inner flex-1 overflow-y-auto">
                    <div className="min-w-[620px]">
                      {/* Cabecera Días */}
                      <div 
                        className="grid sticky top-0 z-20 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 shadow-sm"
                        style={{ gridTemplateColumns: `65px repeat(${diasHabiles.length}, minmax(100px, 1fr))` }}
                      >
                        <div className="p-2 text-xs font-bold text-center text-neutral-500 border-r border-neutral-200 dark:border-neutral-700">Hora</div>
                        {diasHabiles.map(d => <div key={d} className="p-2 text-xs font-bold text-center text-neutral-700 dark:text-neutral-300 border-r border-neutral-200 dark:border-neutral-700 last:border-0">{d}</div>)}
                      </div>

                      {/* Cuerpo de Bloques */}
                      {horasBase.map(hora => (
                        <div 
                          key={hora} 
                          className="grid border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                          style={{ gridTemplateColumns: `65px repeat(${diasHabiles.length}, minmax(100px, 1fr))` }}
                        >
                          <div className="p-2 text-xs font-mono font-medium text-center text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/40 border-r border-neutral-100 dark:border-neutral-800 flex items-center justify-center">{hora}</div>
                          {diasHabiles.map(dia => {
                            const occupied = getCellOccupation(dia, hora);
                            const status = cursoActivo ? checkHoraStatus(dia, hora, cursoActivo) : { invalida: false };
                            
                            const isHoveredStartValid = hoveredCell && !checkHoraStatus(hoveredCell.dia, hoveredCell.hora, cursoActivo).invalida;
                            const isPrevisualizado = cursoActivo && isHoveredStartValid && isCellInBlock(dia, hora, hoveredCell.dia, hoveredCell.hora, cursoActivo.horas_asignadas);

                            // Control de estado de la celda
                            const isBD = occupied?.tipo === 'bd';
                            const isBorrador = occupied?.tipo === 'borrador';
                            const isRestr = occupied?.tipo === 'restr';
                            const isPref = occupied?.tipo === 'pref';

                            // Control de visibilidad del botón borrar (Ocultar si hay curso agarrado)
                            const showDeleteHover = !cursoActivo && (isBD || isBorrador || isRestr || isPref);

                            // Control de clic: 
                            // 1. Si NO tengo curso, solo puedo hacer clic si es borrable.
                            // 2. Si tengo curso, puedo asignarlo en espacios vacíos O en Preferidos.
                            const isClickableToAssign = cursoActivo && !status.invalida && (!occupied || isPref);
                            const isClickableToDelete = showDeleteHover;
                            const isClickable = isClickableToAssign || isClickableToDelete;

                            return (
                              <button
                                key={`${dia}-${hora}`}
                                type="button"
                                disabled={!isClickable}
                                onClick={() => {
                                  if (cursoActivo && isClickableToAssign) {
                                    handleCellClick(dia, hora);
                                  } else if (isClickableToDelete) {
                                    if (isBorrador) handleRemoveBorrador(occupied.id);
                                    else if (isBD) handleEliminarHorarioBD(occupied.id);
                                    else if (isRestr || isPref) handleEliminarDisponibilidad(occupied.id, isRestr ? 'Restringido' : 'Preferido');
                                  }
                                }}
                                onMouseEnter={() => cursoActivo && setHoveredCell({ dia, hora })}
                                onMouseLeave={() => setHoveredCell(null)}
                                className={`h-12 border-r border-neutral-100 dark:border-neutral-800 last:border-0 transition-all outline-none flex items-center justify-center p-1 relative text-center overflow-hidden text-[10px] ${
                                  // ESTADOS CON OPCIÓN A ELIMINAR (Solo visibles cuando cursoActivo es NULL)
                                  showDeleteHover && isBD ? 'bg-neutral-100 dark:bg-neutral-800/80 border-dashed hover:bg-danger-500 hover:text-white cursor-pointer group' :
                                  !showDeleteHover && isBD ? 'bg-neutral-100 dark:bg-neutral-800/80 cursor-not-allowed border-dashed' :

                                  showDeleteHover && isBorrador ? 'bg-primary-500 text-white font-bold shadow-md hover:bg-danger-500 hover:scale-[1.02] cursor-pointer group' :
                                  !showDeleteHover && isBorrador ? 'bg-primary-500 text-white font-bold shadow-md cursor-not-allowed' :

                                  showDeleteHover && isRestr ? 'bg-danger-50 dark:bg-danger-900/20 text-danger-600 font-semibold hover:bg-danger-500 hover:text-white cursor-pointer group' :
                                  !showDeleteHover && isRestr ? 'bg-danger-50 dark:bg-danger-900/20 text-danger-600 font-semibold cursor-not-allowed' :

                                  // PREVISUALIZACION PARA ASIGNAR (Soltar aquí, sobreescribe el color Pref si aplica)
                                  isPrevisualizado ? 'bg-primary-400/80 text-white animate-pulse shadow-inner cursor-pointer' :

                                  // PREFERENCIAS
                                  showDeleteHover && isPref ? 'bg-success-50 dark:bg-success-900/10 text-success-600 font-bold hover:bg-danger-500 hover:text-white cursor-pointer group' :
                                  !showDeleteHover && isPref ? 'bg-success-50 dark:bg-success-900/10 text-success-600 font-bold' :

                                  // CURSO ACTIVO PERO CASILLA INVÁLIDA (Choque con algo no permitido)
                                  cursoActivo && status.invalida ? 'bg-neutral-100 dark:bg-neutral-800/40 cursor-not-allowed opacity-40' :
                                  
                                  // CURSO ACTIVO Y CASILLA VÁLIDA (Espacio blanco libre)
                                  cursoActivo ? 'bg-white dark:bg-neutral-900 hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer text-primary-600 font-medium' :
                                  
                                  // ESTADO NORMAL VACÍO
                                  'bg-white dark:bg-neutral-900 cursor-default'
                                }`}
                                title={
                                  showDeleteHover && isBD ? 'Clic para eliminar de la BD' :
                                  showDeleteHover && isBorrador ? 'Clic para quitar borrador' : 
                                  showDeleteHover && isRestr ? 'Clic para quitar restricción' : 
                                  showDeleteHover && isPref ? 'Clic para quitar preferencia' : 
                                  occupied?.titulo || (status.invalida ? status.motivo : `Asignar aquí`)
                                }
                              >
                                {isPrevisualizado ? (
                                  <span className="font-bold">Soltar aquí</span>
                                ) : isBD ? (
                                  <div className="flex flex-col items-center justify-center w-full h-full">
                                    <div className={`flex flex-col items-center justify-center w-full px-1 ${showDeleteHover ? 'group-hover:hidden' : ''}`}>
                                      <span className="truncate w-full block font-bold text-neutral-700 dark:text-neutral-300 opacity-90">{occupied.titulo}</span>
                                      {occupied.tipoCurso && <span className="text-[8px] bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 px-1.5 rounded uppercase mt-0.5 font-bold">{occupied.tipoCurso}</span>}
                                    </div>
                                    {showDeleteHover && (
                                      <div className="hidden group-hover:flex flex-col items-center justify-center text-white">
                                        <Trash2 className="w-4 h-4 mb-0.5" />
                                        <span className="font-bold text-[9px]">Eliminar BD</span>
                                      </div>
                                    )}
                                  </div>
                                ) : isBorrador ? (
                                  <div className="flex flex-col items-center justify-center w-full h-full">
                                    <div className={`flex flex-col items-center justify-center w-full ${showDeleteHover ? 'group-hover:hidden' : ''}`}>
                                      <span className="truncate w-full block">{occupied.titulo}</span>
                                      <span className="text-[8px] bg-white/20 px-1 rounded uppercase mt-0.5">{occupied.tipoCurso}</span>
                                    </div>
                                    {showDeleteHover && (
                                      <div className="hidden group-hover:flex flex-col items-center justify-center text-white">
                                        <Trash2 className="w-4 h-4 mb-0.5" />
                                        <span className="font-bold text-[9px]">Quitar</span>
                                      </div>
                                    )}
                                  </div>
                                ) : isRestr ? (
                                  <div className="flex flex-col items-center justify-center w-full h-full">
                                    <div className={`flex flex-col items-center justify-center w-full ${showDeleteHover ? 'group-hover:hidden' : ''}`}>
                                      <span>Restringido</span>
                                    </div>
                                    {showDeleteHover && (
                                      <div className="hidden group-hover:flex flex-col items-center justify-center text-white">
                                        <Trash2 className="w-4 h-4 mb-0.5" />
                                        <span className="font-bold text-[9px]">Quitar</span>
                                      </div>
                                    )}
                                  </div>
                                ) : isPref ? (
                                  <div className="flex flex-col items-center justify-center w-full h-full">
                                    <div className={`flex flex-col items-center justify-center w-full ${showDeleteHover ? 'group-hover:hidden' : ''}`}>
                                      <span>Preferido</span>
                                    </div>
                                    {showDeleteHover && (
                                      <div className="hidden group-hover:flex flex-col items-center justify-center text-white">
                                        <Trash2 className="w-4 h-4 mb-0.5" />
                                        <span className="font-bold text-[9px]">Quitar</span>
                                      </div>
                                    )}
                                  </div>
                                ) : cursoActivo && !status.invalida ? (
                                  <span className="opacity-0 hover:opacity-100 font-bold text-primary-600">Ubicar</span>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AREA LATERAL DERECHA: SELECCIÓN DE TOKENS Y CONFIGURACIÓN DE CLASES EN BORRADOR */}
                <div className="xl:col-span-4 p-4 overflow-y-auto flex flex-col h-full bg-white dark:bg-neutral-800">
                  
                  {/* Bloque 1: Tokens Disponibles */}
                  <div className="mb-5 flex-shrink-0">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2.5 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> 1. Cursos por Programar (Clic para Activar)
                    </h3>
                    {cursosPendientes.length === 0 ? (
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 italic p-3 bg-neutral-50 dark:bg-neutral-900/30 rounded-lg text-center border border-dashed dark:border-neutral-700">No quedan cursos pendientes en este lote.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                        {cursosPendientes.map(asig => {
                          const esActivo = cursoActivo?.id === asig.id;
                          return (
                            <button
                              key={asig.id}
                              onClick={() => setCursoActivo(esActivo ? null : asig)}
                              className={`w-full text-left p-2.5 rounded-xl border transition-all flex flex-col gap-1 ${
                                esActivo 
                                  ? 'bg-primary-600 text-white border-primary-700 shadow-md scale-[1.01] ring-2 ring-primary-400' 
                                  : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 hover:border-primary-400 dark:hover:border-primary-500 text-neutral-800 dark:text-neutral-200'
                              }`}
                            >
                              <div className="flex justify-between items-start w-full">
                                <span className="font-bold text-xs truncate max-w-[75%]">[{asig.curso_codigo}] {asig.curso_nombre}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${esActivo ? 'bg-white/20 text-white' : 'bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'}`}>{asig.tipo}</span>
                              </div>
                              <div className="flex justify-between items-center w-full text-[10px] opacity-80">
                                <span>Grupo: {asig.grupo || 'Único'} | Ciclo: {asig.curso_ciclo || asig.ciclo}</span>
                                <span className="font-bold">{asig.horas_asignadas} hrs fijas</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Instrucción Visual Dinámica */}
                  {cursoActivo && (
                    <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50 text-primary-800 dark:text-primary-300 rounded-xl text-xs font-semibold animate-pulse flex items-center gap-2 shadow-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>[CURSO ACTIVO]: Haz clic en un recuadro libre (o verde) de la cuadrícula para situar las <strong>{cursoActivo.horas_asignadas} hrs</strong> consecutivas.</span>
                    </div>
                  )}

                  {/* Bloque 2: Lista de Asignaciones en Borrador y Selección de Aulas */}
                  <div className="flex-1 flex flex-col min-h-0 border-t border-neutral-100 dark:border-neutral-700 pt-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> 2. Bloques Ubicados (Asignar Ambientes)
                    </h3>
                    
                    {borradores.length === 0 ? (
                      <div className="flex-1 flex flex-col justify-center items-center text-center p-4 text-neutral-400 dark:text-neutral-500 border border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/30">
                        <Clock className="w-8 h-8 opacity-40 mb-2" />
                        <p className="text-xs font-medium">Usa el mouse para posicionar los cursos del docente en el panel de la izquierda.</p>
                        <p className="text-[10px] mt-2 italic text-neutral-400 opacity-80">(Haz clic en la cuadrícula para remover un horario asignado o borrar clases ya guardadas en BD)</p>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                        {borradores.map(b => {
                          const listaAmbientes = ambientesCache[b.asignacion_id] || [];
                          const cargandoAmbientes = cargandoAmbientesMap[b.asignacion_id];
                          const isAula = b.tipo.includes('Teor') || b.tipo.includes('Prac');

                          return (
                            <div key={b.asignacion_id} className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/40 relative flex flex-col gap-2 shadow-sm">
                              <button 
                                onClick={() => handleRemoveBorrador(b.asignacion_id)}
                                className="absolute top-2 right-2 text-neutral-400 hover:text-danger-500 transition-colors p-1 rounded-lg hover:bg-white dark:hover:bg-neutral-800 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
                                title="Remover del borrador"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                              
                              <div>
                                <h4 className="font-bold text-xs text-neutral-900 dark:text-white truncate pr-6">[{b.curso_codigo}] {b.curso_nombre}</h4>
                                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
                                  <span className="font-bold text-primary-600 dark:text-primary-400">{b.dia}:</span> {formatAMPM(b.hora_inicio)} - {formatAMPM(b.hora_fin)} ({b.tipo})
                                </p>
                              </div>

                              <div className="mt-1">
                                <label className="block text-[9px] font-bold text-neutral-500 dark:text-neutral-400 uppercase mb-1">
                                  {isAula ? 'Seleccionar Aula Libre' : 'Seleccionar Laboratorio Libre'}
                                </label>
                                <select
                                  value={b.ambiente_id}
                                  disabled={cargandoAmbientes}
                                  onChange={(e) => handleAmbienteChange(b.asignacion_id, e.target.value)}
                                  className="w-full text-xs p-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-lg outline-none font-medium focus:border-primary-500 focus:ring-1 focus:ring-primary-500 shadow-sm"
                                >
                                  <option value="">{cargandoAmbientes ? 'Buscando disponibles...' : 'Seleccione un ambiente...'}</option>
                                  {listaAmbientes.map(a => (
                                    <option key={a.id} value={a.id} disabled={a.esta_ocupado}>
                                      {a.codigo} (Cap: {a.capacidad}) {a.esta_ocupado ? '❌ Ocupado' : '✅ Libre'}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Panel de Envíos Masivos Estáticos */}
                  {borradores.length > 0 && (
                    <div className="pt-3 mt-3 border-t border-neutral-100 dark:border-neutral-700 flex-shrink-0 flex flex-col gap-2">
                      <button
                        onClick={handleGuardarPlanificacionCompleta}
                        disabled={guardando || !planificacionValida}
                        className="btn-primary w-full py-2.5 text-xs font-bold flex justify-center items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700 border-none text-white"
                      >
                        {guardando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar Planificación Completa ({borradores.length})
                      </button>
                      {!planificacionValida && (
                        <p className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold text-center leading-tight">
                          ⚠️ Asigne un ambiente libre a cada bloque en borrador para activar el botón maestro.
                        </p>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 p-6 text-center">
              <Users className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium text-neutral-600 dark:text-neutral-400">Seleccione un Docente</p>
              <p className="text-sm mt-1 max-w-sm">Haga clic en un docente a la izquierda de la lista para gestionar y programar sus asignaciones en un único bloque visual.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanificacionSecretaria;