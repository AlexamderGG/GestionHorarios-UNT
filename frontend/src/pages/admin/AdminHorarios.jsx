import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../services/api";
import jsPDF from "jspdf";
import * as XLSX from "xlsx-js-style";
import autoTable from "jspdf-autotable";
import {
  Calendar, RefreshCw, Zap, Filter, Users, LayoutGrid, User, MapPin, Pencil, Trash2, Inbox, X, Save, BookOpen, Clock, GraduationCap, Plus, AlertCircle, Download,
} from "lucide-react";

const timeToMinutes = (t) => {
  if (!t) return 0;
  const [h, m] = String(t).slice(0, 5).split(":").map(Number);
  return h * 60 + m;
};

const DIAS_ESTANDAR = {
  lunes: "Lunes", martes: "Martes", miercoles: "Miercoles", jueves: "Jueves", viernes: "Viernes", sabado: "Sabado", domingo: "Domingo"
};

const normalizarDia = (diaStr) => {
  if (!diaStr) return "Lunes";
  const limpio = String(diaStr).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  return DIAS_ESTANDAR[limpio] || "Lunes";
};

const getColorCurso = (codigo) => {
  let hash = 0;
  for (let i = 0; i < (codigo || "").length; i++) {
    hash = codigo.charCodeAt(i) + ((hash << 5) - hash);
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
  if (!timeStr) return "";
  const [hourStr] = timeStr.split(":");
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  let displayHour = hour % 12;
  displayHour = displayHour ? displayHour : 12; 
  return `${String(displayHour).padStart(2, "0")}:00 ${ampm}`;
};

const AdminHorarios = () => {
  const [horarios, setHorarios] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [config, setConfig] = useState(null);
  const [filtroDocente, setFiltroDocente] = useState("");
  const [semestre, setSemestre] = useState("2026-1");
  const [cicloActivo, setCicloActivo] = useState("");
  
  useEffect(() => {
    if (!semestre) return;
    const isImpar = semestre.endsWith('-1');
    const ciclosValidos = isImpar ? [1, 3, 5, 7, 9] : [2, 4, 6, 8, 10];
    if (!ciclosValidos.includes(Number(cicloActivo))) {
      setCicloActivo(String(ciclosValidos[0]));
    }
  }, [semestre, cicloActivo]);

  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [limpiando, setLimpiando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [ambientesValidadosAPI, setAmbientesValidadosAPI] = useState([]);
  const [cargandoAmbientes, setCargandoAmbientes] = useState(false);

  const dias = useMemo(() => {
    if (!config?.dias_habiles) return ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
    const raw = Array.isArray(config.dias_habiles) ? config.dias_habiles : config.dias_habiles.split(',');
    return raw.map(d => normalizarDia(d));
  }, [config]);

  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [asignacionesLibres, setAsignacionesLibres] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [laboratorios, setLaboratorios] = useState([]);
  const [asigSeleccionada, setAsigSeleccionada] = useState(null);
  const [createForm, setCreateForm] = useState({ dia: "Lunes", hora_inicio: "", hora_fin: "", ambiente_id: "" });
  const [guardandoManual, setGuardandoManual] = useState(false);
  const [errorModalCreate, setErrorModalCreate] = useState(null);

  useEffect(() => {
    api.get("/configuracion").then((res) => {
      if (res.data?.data?.semestre_activo) setSemestre(res.data.data.semestre_activo);
    }).catch((err) => console.error("Error cargando configuración:", err));
  }, []);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const resConf = await api.get("/configuracion");
      const configData = resConf.data?.data || {};
      setConfig(configData);

      const semestreActual = semestre || configData.semestre_activo || "2026-1";
      if (!semestre) setSemestre(semestreActual);

      const [resHor, resDoc, resCur, resAsig, resAulas, resLabs] = await Promise.all([
        api.get("/horarios", { params: { semestre: semestreActual } }), 
        api.get("/docentes"),
        api.get("/cursos"),
        api.get("/asignaciones"),
        api.get("/horarios/aulas"),        
        api.get("/horarios/laboratorios")  
      ]);
      
      setHorarios(resHor.data?.data || []);
      setDocentes(resDoc.data?.data || []);
      setCursos(resCur.data?.data || []);
      setAsignaciones(resAsig.data?.data || []);
      setAulas(resAulas.data?.data || []);        
      setLaboratorios(resLabs.data?.data || []);  
    } catch (err) {
      console.error("Error cargando datos principales:", err);
    } finally {
      setLoading(false);
    }
  }, [semestre]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const getCiclosActivos = useMemo(() => {
    if (!semestre) return [];
    const part = semestre.split("-");
    if (part.length !== 2) return [];
    const num = parseInt(part[1], 10);
    return num === 1 ? [1, 3, 5, 7, 9] : [2, 4, 6, 8, 10];
  }, [semestre]);

  useEffect(() => {
    if (getCiclosActivos.length > 0 && !cicloActivo) setCicloActivo(String(getCiclosActivos[0]));
  }, [getCiclosActivos, cicloActivo]);

  const horasDisponibles = useMemo(() => {
    const inicio = config?.hora_inicio || "07:00";
    const fin = config?.hora_fin || "22:00";
    const [hIni] = inicio.split(":").map(Number);
    const [hFin] = fin.split(":").map(Number);
    const lista = [];
    for (let h = hIni; h <= hFin; h++) lista.push(`${String(h).padStart(2, "0")}:00`);
    return lista;
  }, [config]);

  const calcularHoraFinAutomatica = (horaInicioStr, horasRequeridas) => {
    if (!horaInicioStr || !horasRequeridas) return "";
    const [h] = horaInicioStr.split(":").map(Number);
    return `${String(h + horasRequeridas).padStart(2, "0")}:00`;
  };

  const handleCambioHoraInicioCreate = (horaIni) => {
    if (!asigSeleccionada) return;
    const horasRequeridas = Number(asigSeleccionada.horas_asignadas || 2);
    setCreateForm({ ...createForm, hora_inicio: horaIni, hora_fin: calcularHoraFinAutomatica(horaIni, horasRequeridas) });
  };

  const handleCambioHoraInicioEdit = (horaIni) => {
    if (!editando) return;
    const asig = asignaciones.find(a => a.id === editando.asignacion_id);
    const horasRequeridas = asig ? Number(asig.horas_asignadas) : 2;
    setEditForm({ ...editForm, hora_inicio: horaIni, hora_fin: calcularHoraFinAutomatica(horaIni, horasRequeridas) });
  };

  const verificarConflictoCreate = (horaIniPropuesta) => {
    if (!asigSeleccionada || !createForm.dia) return null;
    const horasRequeridas = Number(asigSeleccionada.horas_asignadas || 2);
    const horaFinPropuesta = calcularHoraFinAutomatica(horaIniPropuesta, horasRequeridas);
    if (!horaFinPropuesta) return null;

    const iniPropuestoMin = timeToMinutes(horaIniPropuesta);
    const finPropuestoMin = timeToMinutes(horaFinPropuesta);
    if (finPropuestoMin > timeToMinutes(config?.hora_fin || "22:00")) return `Excede cierre`;

    const targetDia = normalizarDia(createForm.dia);
    let overlapsCount = 0;
    
    const cursoSel = cursos.find(c => c.id === asigSeleccionada.curso_id);
    const cicloModal = cursoSel?.ciclo || asigSeleccionada.ciclo;
    const isIncomingException = (cursoSel?.codigo || '').startsWith('EL-') || asigSeleccionada.tipo === 'Laboratorio';

    for (const h of horarios) {
      if (normalizarDia(h.dia) === targetDia) {
        const hIni = timeToMinutes(h.hora_inicio);
        const hFin = timeToMinutes(h.hora_fin);
        
        if (iniPropuestoMin < hFin && finPropuestoMin > hIni) {
          if (String(h.docente?.id || h.docente_id) === String(asigSeleccionada.docente_id)) {
            return "Docente ocupado";
          }
          const cicloH = h.curso?.ciclo || h.ciclo;
          if (cicloModal && String(cicloModal) !== "0" && String(cicloH) === String(cicloModal)) {
            const isExistingException = (h.curso?.codigo || '').startsWith('EL-') || h.tipo === 'Laboratorio' || h.tipo_asignacion === 'Laboratorio';
            
            if (!isIncomingException || !isExistingException) {
               return `Cruce regular Ciclo ${cicloModal}`;
            }
            overlapsCount++;
          }
        }
      }
    }
    if (overlapsCount >= 2) return `Ciclo ${cicloModal} lleno (Max 2)`;
    return null;
  };

  const verificarConflictoEdit = (horaIniPropuesta) => {
    if (!editando || !editForm.dia) return null;
    const asig = asignaciones.find(a => a.id === editando.asignacion_id);
    const horasRequeridas = asig ? Number(asig.horas_asignadas) : 2;
    const horaFinPropuesta = calcularHoraFinAutomatica(horaIniPropuesta, horasRequeridas);
    if (!horaFinPropuesta) return null;

    const iniPropuestoMin = timeToMinutes(horaIniPropuesta);
    const finPropuestoMin = timeToMinutes(horaFinPropuesta);
    if (finPropuestoMin > timeToMinutes(config?.hora_fin || "22:00")) return `Excede cierre`;

    const targetDia = normalizarDia(editForm.dia);
    let overlapsCount = 0;

    const cursoSel = cursos.find(c => c.id === asig?.curso_id) || editando.curso;
    const cicloModal = cursoSel?.ciclo || editando.ciclo;
    const isIncomingException = (cursoSel?.codigo || '').startsWith('EL-') || asig?.tipo === 'Laboratorio' || editando.tipo === 'Laboratorio';

    for (const h of horarios) {
      if (Number(h.id) !== Number(editando.id) && normalizarDia(h.dia) === targetDia) {
        const hIni = timeToMinutes(h.hora_inicio);
        const hFin = timeToMinutes(h.hora_fin);
        
        if (iniPropuestoMin < hFin && finPropuestoMin > hIni) {
          if (String(h.docente?.id || h.docente_id) === String(editando.docente?.id || editando.docente_id)) {
            return "Docente ocupado";
          }
          const cicloH = h.curso?.ciclo || h.ciclo;
          if (cicloModal && String(cicloModal) !== "0" && String(cicloH) === String(cicloModal)) {
            const isExistingException = (h.curso?.codigo || '').startsWith('EL-') || h.tipo === 'Laboratorio' || h.tipo_asignacion === 'Laboratorio';
            
            if (!isIncomingException || !isExistingException) {
               return `Cruce regular Ciclo ${cicloModal}`;
            }
            overlapsCount++;
          }
        }
      }
    }
    if (overlapsCount >= 2) return `Ciclo ${cicloModal} lleno (Max 2)`;
    return null;
  };

  const refrescarDisponibilidadAmbientesAPI = useCallback(async (dia, hIni, hFin, tipoAsig, idHorario) => {
    if (!dia || !hIni || !hFin || !tipoAsig) return;
    setCargandoAmbientes(true);
    try {
      const res = await api.get("/horarios/ambientes-disponibilidad", {
        params: { dia: String(dia).trim(), hora_inicio: hIni, hora_fin: hFin, tipo: tipoAsig, semestre, excludeId: idHorario ? Number(idHorario) : -1 }
      });
      setAmbientesValidadosAPI(res.data?.data || []);
    } catch (err) { console.error("Error ambientes:", err); } finally { setCargandoAmbientes(false); }
  }, [semestre]);

  useEffect(() => {
    if (editando && editForm.dia && editForm.hora_inicio && editForm.hora_fin) {
      const asig = asignaciones.find(a => a.id === editando.asignacion_id);
      refrescarDisponibilidadAmbientesAPI(editForm.dia, editForm.hora_inicio, editForm.hora_fin, asig?.tipo || 'Teoria', editando.id);
    }
  }, [editForm.dia, editForm.hora_inicio, editForm.hora_fin, editando, asignaciones, refrescarDisponibilidadAmbientesAPI]);

  useEffect(() => {
    if (asigSeleccionada && createForm.dia && createForm.hora_inicio && createForm.hora_fin) {
      refrescarDisponibilidadAmbientesAPI(createForm.dia, createForm.hora_inicio, createForm.hora_fin, asigSeleccionada.tipo, null);
    }
  }, [createForm.dia, createForm.hora_inicio, createForm.hora_fin, asigSeleccionada, refrescarDisponibilidadAmbientesAPI]);

  const handleGenerar = async () => {
    if (!confirm("¿Generar los horarios de forma automática?")) return;
    setGenerando(true); setMensaje(null);
    try {
      const res = await api.post("/horarios/generar", { semestre, forzar: true });
      if (res.data?.success) { setMensaje({ tipo: "exito", texto: `${res.data.data?.generados || 0} horarios generados` }); cargarDatos(); }
    } catch (err) { setMensaje({ tipo: "error", texto: "Error al generar" }); } finally { setGenerando(false); }
  };

  const handleLimpiar = async () => {
    if (!confirm(`¿Eliminar TODOS los horarios programados del semestre ${semestre}?`)) return;
    setLimpiando(true); setMensaje(null);
    try {
      const res = await api.post("/horarios/limpiar", { semestre });
      if (res.data?.success) { setMensaje({ tipo: "exito", texto: `${res.data.data?.eliminados || 0} horarios eliminados` }); cargarDatos(); }
    } catch (err) { setMensaje({ tipo: "error", texto: "Error al limpiar" }); } finally { setLimpiando(false); }
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar este horario?")) return;
    try { await api.delete(`/horarios/${id}`); cargarDatos(); } catch (err) { alert("Error al eliminar"); }
  };

  const abrirEdicion = (h) => {
    setEditando(h);
    setEditForm({
      dia: normalizarDia(h.dia), 
      hora_inicio: h.hora_inicio?.slice(0, 5),
      hora_fin: h.hora_fin?.slice(0, 5),
      aula_id: h.aula?.id || h.aula_id || "",
      laboratorio_id: h.laboratorio?.id || h.laboratorio_id || "",
    });
  };

  const handleGuardarEdicion = async () => {
    try {
      const asig = asignaciones.find(a => a.id === editando.asignacion_id);
      const isAula = asig?.tipo === "Teoria" || asig?.tipo === "Practica";
      const payload = {
        dia: editForm.dia, hora_inicio: editForm.hora_inicio, hora_fin: editForm.hora_fin,
        aula_id: isAula && editForm.aula_id ? Number(editForm.aula_id) : null,
        laboratorio_id: !isAula && editForm.laboratorio_id ? Number(editForm.laboratorio_id) : null
      };
      await api.put(`/horarios/${editando.id}`, payload);
      setEditando(null); cargarDatos();
    } catch (err) { alert(err.response?.data?.message || "Error al guardar"); }
  };


  // =========================================================================
  // AUXILIARES DE RENDERIZACIÓN PARA PDF Y EXCEL (ALGORITMO GEOMÉTRICO)
  // =========================================================================

  const generarLeyendaCursos = (horariosCiclo) => {
    const cursosUnicosMap = new Map();
    let contadorN = 1;
    
    horariosCiclo.forEach(h => {
      const asig = asignaciones.find(a => a.id === h.asignacion_id);
      if (!asig || !h.curso?.codigo) return;
      const cursoFull = cursos.find(c => c.id === asig.curso_id) || h.curso;
      const compositeKey = `${cursoFull.codigo}-${asig.docente_id}`;

      if (!cursosUnicosMap.has(compositeKey)) {
        cursosUnicosMap.set(compositeKey, {
          num: contadorN++, codigo: cursoFull.codigo, docente_id: asig.docente_id,
          profesor: `${h.docente?.nombres || ''} ${h.docente?.apellidos || ''}`.trim(),
          asignatura: cursoFull.nombre, departamento: cursoFull.especialidad || 'Ing. de Sistemas',
          T: 0, P: 0, L: 0, G: 0, THoras: 0, asignacionesProcesadas: new Set()
        });
      }

      const info = cursosUnicosMap.get(compositeKey);
      if (!info.asignacionesProcesadas.has(asig.id)) {
        info.asignacionesProcesadas.add(asig.id);
        const horas = Number(asig.horas_asignadas) || 0;
        info.THoras += horas;
        if (asig.tipo === 'Teoria' || asig.tipo === 'Teoría') info.T += horas;
        else if (asig.tipo === 'Practica' || asig.tipo === 'Práctica') info.P += horas;
        else if (asig.tipo === 'Laboratorio') { info.L = horas; info.G += 1; }
      }
    });

    return Array.from(cursosUnicosMap.values()).map(c => ({
      ...c, T: c.T > 0 ? c.T : '-', P: c.P > 0 ? c.P : '-', L: c.L > 0 ? c.L : '-', G: c.G > 0 ? c.G : '-'
    }));
  };

  const construirMatrizHorario = (horariosCiclo) => {
    const mat = Array(bloques.length).fill(null).map(() => Array(dias.length * 2).fill(null));
    const events = [];

    // 1. Convertir todas las clases a eventos con duración por bloques
    horariosCiclo.forEach(h => {
      const asig = asignaciones.find(a => a.id === h.asignacion_id);
      const roomCode = h.aula?.codigo || h.laboratorio?.codigo || '';
      const diaNorm = normalizarDia(h.dia);
      const groupKey = `${h.curso?.codigo || ''}-${asig?.docente_id || h.docente_id || ''}-${roomCode}-${diaNorm}`;
      
      const startMin = timeToMinutes(h.hora_inicio);
      const endMin = timeToMinutes(h.hora_fin);
      
      let startIdx = -1, endIdx = -1;
      bloques.forEach((b, idx) => {
        if (startMin < timeToMinutes(b.fin) && endMin > timeToMinutes(b.inicio)) {
          if (startIdx === -1) startIdx = idx;
          endIdx = idx;
        }
      });
      
      if (startIdx !== -1) {
        events.push({ h, asig, groupKey, startIdx, endIdx, span: endIdx - startIdx + 1, dia: diaNorm });
      }
    });

    // 2. Unir clases contiguas (ej. Teoría y Práctica continuas del mismo docente/aula)
    events.sort((a, b) => {
      if (a.dia !== b.dia) return a.dia.localeCompare(b.dia);
      if (a.groupKey !== b.groupKey) return a.groupKey.localeCompare(b.groupKey);
      return a.startIdx - b.startIdx;
    });

    const mergedEvents = [];
    let curr = null;
    events.forEach(ev => {
      if (!curr) curr = { ...ev };
      else {
        if (curr.groupKey === ev.groupKey && curr.endIdx >= ev.startIdx - 1) {
          curr.endIdx = Math.max(curr.endIdx, ev.endIdx);
          curr.span = curr.endIdx - curr.startIdx + 1;
        } else {
          mergedEvents.push(curr);
          curr = { ...ev };
        }
      }
    });
    if (curr) mergedEvents.push(curr);

    // 3. Colocar los bloques grandes primero para optimizar el espacio
    mergedEvents.sort((a, b) => a.startIdx !== b.startIdx ? a.startIdx - b.startIdx : b.span - a.span);

    mergedEvents.forEach(ev => {
      const diaIdx = dias.findIndex(d => d.toLowerCase() === ev.dia.toLowerCase());
      if (diaIdx === -1) return;
      
      const baseCol = diaIdx * 2;
      let canPlaceLeft = true;
      for (let r = ev.startIdx; r <= ev.endIdx; r++) { if (mat[r][baseCol] !== null) { canPlaceLeft = false; break; } }
      
      if (canPlaceLeft) {
        for (let r = ev.startIdx; r <= ev.endIdx; r++) {
          mat[r][baseCol] = { h: r === ev.startIdx ? ev.h : null, isStart: r === ev.startIdx, ev, skipped: r > ev.startIdx };
        }
      } else {
        let canPlaceRight = true;
        for (let r = ev.startIdx; r <= ev.endIdx; r++) { if (mat[r][baseCol+1] !== null) { canPlaceRight = false; break; } }
        if (canPlaceRight) {
          for (let r = ev.startIdx; r <= ev.endIdx; r++) {
            mat[r][baseCol+1] = { h: r === ev.startIdx ? ev.h : null, isStart: r === ev.startIdx, ev, skipped: r > ev.startIdx };
          }
        }
      }
    });

    // 4. Calcular expansiones (RowSpan y ColSpan) y rellenar vacíos para evitar colapsos
    for (let c = 0; c < dias.length; c++) {
      const baseCol = c * 2;
      for (let r = 0; r < bloques.length; r++) {
        const cellL = mat[r][baseCol];
        if (cellL && cellL.isStart) {
          let canExpand = true;
          for (let i = r; i <= cellL.ev.endIdx; i++) { if (mat[i][baseCol+1] !== null) { canExpand = false; break; } }
          cellL.rs = cellL.ev.span;
          if (canExpand) {
            cellL.cs = 2;
            for (let i = r; i <= cellL.ev.endIdx; i++) mat[i][baseCol+1] = { skipped: true };
          } else { cellL.cs = 1; }
        } else if (!mat[r][baseCol]) mat[r][baseCol] = { h: null, rs: 1, cs: 1, skipped: false };

        const cellR = mat[r][baseCol+1];
        if (cellR && cellR.isStart) { cellR.rs = cellR.ev.span; cellR.cs = 1; } 
        else if (!mat[r][baseCol+1]) mat[r][baseCol+1] = { h: null, rs: 1, cs: 1, skipped: false };
      }
    }
    return mat;
  };

  // =========================================================================
  // MÉTODOS DE EXPORTACIÓN REFACTORIZADOS Y SEGUROS
  // =========================================================================

  const exportarPDFCiclo = () => {
    try {
      if (!cicloActivo || !horariosPorCiclo[cicloActivo]) return;
      const doc = new jsPDF("landscape");
      const horariosCiclo = horariosPorCiclo[cicloActivo];

      const PALETA_COLORES = [
        [242, 215, 213], [212, 230, 241], [213, 245, 227], [252, 243, 207],
        [235, 222, 240], [246, 221, 204], [209, 242, 235], [245, 203, 167],
        [225, 245, 196], [255, 235, 235], [215, 219, 221], [250, 215, 160],
      ];

      doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.text("UNIVERSIDAD NACIONAL DE TRUJILLO", 14, 13);
      doc.setFontSize(9); doc.text("FACULTAD DE INGENIERÍA", 14, 18); doc.text("TRUJILLO", 14, 23);
      doc.setFont("helvetica", "normal"); doc.text("ESCUELA:", 14, 30); doc.setFont("helvetica", "bold"); doc.text("INGENIERÍA DE SISTEMAS", 32, 30);
      doc.setFont("helvetica", "normal"); doc.text("CICLO:", 14, 36); doc.setFont("helvetica", "bold"); doc.text(String(cicloActivo), 28, 36);
      
      const year = semestre.split('-')[0] || ''; const semNum = semestre.split('-')[1] === '1' ? 'I' : 'II';
      doc.setFont("helvetica", "normal"); doc.text("AÑO ACADÉMICO:", 14, 42); doc.setFont("helvetica", "bold"); doc.text(year, 44, 42);
      doc.setFont("helvetica", "normal"); doc.text("SEMESTRE:", 60, 42); doc.setFont("helvetica", "bold"); doc.text(semNum, 82, 42);

      const listaCursos = generarLeyendaCursos(horariosCiclo);

      autoTable(doc, {
        startY: 9, margin: { left: 95 }, tableWidth: 'auto', head: [['N°', 'PROFESOR', 'ASIGNATURA', 'T', 'P', 'L', 'G', 'T. HORAS', 'DEPARTAMENTO']],
        body: listaCursos.map(c => [c.num, c.profesor, c.asignatura, c.T, c.P, c.L, c.G, c.THoras, c.departamento]),
        theme: 'grid', styles: { fontSize: 6.5, cellPadding: 1, halign: 'center', textColor: [40, 40, 40] },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 6 }, 1: { halign: 'left', cellWidth: 40 }, 2: { halign: 'left', cellWidth: 45 }, 8: { halign: 'left', cellWidth: 25 } },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', halign: 'center' },
        didParseCell: (data) => { 
          if (data.section === 'body' && listaCursos[data.row.index]) {
            data.cell.styles.fillColor = PALETA_COLORES[(listaCursos[data.row.index].num - 1) % PALETA_COLORES.length]; 
          }
        }
      });

      const mat = construirMatrizHorario(horariosCiclo);
      const colsWidthDef = { 0: { cellWidth: 20 } };
      const colWidth = (280 - 14 - 20) / (dias.length * 2);
      for(let i=1; i<=dias.length*2; i++) colsWidthDef[i] = { cellWidth: colWidth };

      const bodyRows = bloques.map((blq, r) => {
        const row = [{ content: blq.label, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } }];
        for (let c = 0; c < dias.length * 2; c++) {
          const cell = mat[r][c];
          if (!cell || cell.skipped) continue;
          
          let str = ""; let cInfo = null;
          if (cell.h) {
            const asig = asignaciones.find(x => x.id === cell.h.asignacion_id);
            const cursoFull = cursos.find(cu => cu.id === asig?.curso_id) || cell.h.curso;
            cInfo = listaCursos.find(x => x.codigo === cursoFull?.codigo && String(x.docente_id) === String(asig?.docente_id));
            str = `${cInfo?.num || ''} ${cell.h.aula?.codigo || cell.h.laboratorio?.codigo || ''}`.trim();
          }
          row.push({ content: str, rowSpan: cell.rs, colSpan: cell.cs, cInfo });
        }
        return row;
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 4,
        head: [[{ content: 'HORA' }, ...dias.map(d => ({ content: d.toUpperCase(), colSpan: 2 }))] ],
        body: bodyRows,
        theme: 'grid', styles: { fontSize: 8, cellPadding: 1, halign: 'center', valign: 'middle', lineColor: [150, 150, 150], lineWidth: 0.1 },
        headStyles: { fillColor: [44, 62, 80], textColor: 255 }, columnStyles: colsWidthDef,
        didParseCell: (d) => {
          if (d.section === 'body' && d.column.index > 0 && d.cell.raw?.cInfo) {
            d.cell.styles.fillColor = PALETA_COLORES[(d.cell.raw.cInfo.num - 1) % PALETA_COLORES.length];
            d.cell.styles.fontStyle = 'bold';
          }
        }
      });

      doc.save(`Horario_Oficial_Ciclo_${cicloActivo}_${semestre}.pdf`);
    } catch (err) { alert("Ocurrió un error al generar el PDF del Ciclo."); console.error(err); }
  };

  const exportarExcelCiclo = () => {
    try {
      if (!cicloActivo || !horariosPorCiclo[cicloActivo]) return;
      const horariosCiclo = horariosPorCiclo[cicloActivo];
      const PALETA_HEX = ["F2D7D5", "D4E6F1", "D5F5E3", "FCF3CF", "EBE2F0", "F6DDC4", "D1F2EB", "F5CBC5", "E1F5C4", "FFEBEB", "D7DBDD", "FAD7A0"];
      const borderThin = { top: { style: "thin", color: { rgb: "999999" } }, bottom: { style: "thin", color: { rgb: "999999" } }, left: { style: "thin", color: { rgb: "999999" } }, right: { style: "thin", color: { rgb: "999999" } } };

      const listaCursos = generarLeyendaCursos(horariosCiclo);
      const wb = XLSX.utils.book_new(); const ws = {}; const merges = [];

      const writeCell = (r, c, val, style = {}) => {
        const safeVal = val == null ? "" : val;
        ws[XLSX.utils.encode_cell({ r, c })] = {
          t: typeof safeVal === "number" ? "n" : "s", v: safeVal,
          s: { font: { name: "Arial", sz: 9, ...style.font }, alignment: { horizontal: "center", vertical: "center", wrapText: true, ...style.alignment }, fill: style.fill ? { patternType: "solid", ...style.fill } : undefined, border: style.border }
        };
      };

      const topTexts = ["UNIVERSIDAD NACIONAL DE TRUJILLO", "FACULTAD DE INGENIERÍA", "TRUJILLO", "ESCUELA: INGENIERÍA DE SISTEMAS", `CICLO: ${cicloActivo}`, `AÑO ACADÉMICO: ${semestre.split('-')[0] || ''}`, `SEMESTRE: ${semestre.split('-')[1] === '1' ? 'I' : 'II'}`];
      const startRowMalla = Math.max(topTexts.length, listaCursos.length + 1) + 2;

      for (let i = 0; i < startRowMalla - 2; i++) {
        if (i < topTexts.length && topTexts[i]) writeCell(i, 0, topTexts[i], { font: { bold: true, sz: i < 3 ? (i === 0 ? 11 : 9.5) : 9, color: { rgb: i < 3 ? "000000" : "444444" } }, alignment: { horizontal: "left" } });
        
        if (i === 0) {
          ["N°", "PROFESOR", "ASIGNATURA", "T", "P", "L", "G", "T. HORAS", "DEPARTAMENTO"].forEach((hName, cOff) => {
            writeCell(0, 3 + cOff, hName, { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "2980B9" } }, border: borderThin });
          });
        } else if (i - 1 < listaCursos.length) {
          const c = listaCursos[i - 1]; const hex = PALETA_HEX[(c.num - 1) % PALETA_HEX.length];
          const st = { fill: { fgColor: { rgb: hex } }, border: borderThin, alignment: { vertical: "center" } };

          writeCell(i, 3, c.num, { ...st, font: { bold: true } }); writeCell(i, 4, c.profesor, { ...st, alignment: { horizontal: "left" } }); writeCell(i, 5, c.asignatura, { ...st, alignment: { horizontal: "left" } });
          writeCell(i, 6, c.T, st); writeCell(i, 7, c.P, st); writeCell(i, 8, c.L, st); writeCell(i, 9, c.G, st); writeCell(i, 10, c.THoras, st);
          writeCell(i, 11, c.departamento, { ...st, alignment: { horizontal: "left" } });
        }
      }

      writeCell(startRowMalla - 2, 0, "MALLA HORARIA OFICIAL", { font: { bold: true, sz: 10 }, alignment: { horizontal: "left" } });
      writeCell(startRowMalla - 1, 0, "HORA", { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "2C3E50" } }, border: borderThin });
      dias.forEach((d, i) => {
        writeCell(startRowMalla - 1, 1 + i * 2, d.toUpperCase(), { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "2C3E50" } }, border: borderThin });
        merges.push({ s: { r: startRowMalla - 1, c: 1 + i * 2 }, e: { r: startRowMalla - 1, c: 2 + i * 2 } });
      });

      const mat = construirMatrizHorario(horariosCiclo);

      bloques.forEach((blq, r) => {
        writeCell(startRowMalla + r, 0, blq.label, { font: { bold: true, sz: 8.5 }, fill: { fgColor: { rgb: "F5F5F5" } }, border: borderThin });

        for (let c = 0; c < dias.length * 2; c++) {
          const cell = mat[r][c];
          if (!cell || cell.skipped) continue;

          const colIdx = 1 + c;
          let str = ""; let bg = "FFFFFF";

          if (cell.h) {
            const asig = asignaciones.find(a => a.id === cell.h.asignacion_id);
            const cursoFull = cursos.find(cu => cu.id === asig?.curso_id) || cell.h.curso;
            const ci = listaCursos.find(x => x.codigo === cursoFull?.codigo && String(x.docente_id) === String(asig?.docente_id));
            str = `${ci?.num || ''} ${cell.h.aula?.codigo || cell.h.laboratorio?.codigo || ''}`.trim();
            bg = ci ? PALETA_HEX[(ci.num - 1) % PALETA_HEX.length] : "FFFFFF";
          }

          writeCell(startRowMalla + r, colIdx, str, { font: { bold: true, sz: 8.5 }, fill: { fgColor: { rgb: bg } }, border: borderThin });

          if (cell.rs > 1 || cell.cs > 1) {
            merges.push({ s: { r: startRowMalla + r, c: colIdx }, e: { r: startRowMalla + r + cell.rs - 1, c: colIdx + cell.cs - 1 } });
            for (let i = 0; i < cell.rs; i++) {
              for (let j = 0; j < cell.cs; j++) {
                if (i === 0 && j === 0) continue;
                writeCell(startRowMalla + r + i, colIdx + j, "", { fill: { fgColor: { rgb: bg } }, border: borderThin });
              }
            }
          }
        }
      });

      ws['!merges'] = merges; ws['!cols'] = [{ wch: 16 }];
      for(let i=0; i<dias.length*2; i++) ws['!cols'].push({ wch: 8 });
      ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: startRowMalla + bloques.length, c: Math.max(dias.length * 2, 11) } });
      
      XLSX.utils.book_append_sheet(wb, ws, `Horario Ciclo ${cicloActivo}`);
      XLSX.writeFile(wb, `Horario_Oficial_Ciclo_${cicloActivo}_${semestre}.xlsx`);
    } catch (err) { alert("Ocurrió un error al generar el Excel del Ciclo."); console.error(err); }
  };

  const exportarTodosPDF = () => {
    try {
      if (!getCiclosActivos || getCiclosActivos.length === 0) return;
      const ciclosValidos = getCiclosActivos.filter(c => horariosPorCiclo[c] && horariosPorCiclo[c].length > 0);
      if (ciclosValidos.length === 0) { alert("No hay horarios programados para exportar."); return; }

      const doc = new jsPDF("landscape");
      const PALETA_COLORES = [
        [242, 215, 213], [212, 230, 241], [213, 245, 227], [252, 243, 207],
        [235, 222, 240], [246, 221, 204], [209, 242, 235], [245, 203, 167],
        [225, 245, 196], [255, 235, 235], [215, 219, 221], [250, 215, 160],
      ];

      ciclosValidos.forEach((ciclo, index) => {
        if (index > 0) doc.addPage();
        const horariosCiclo = horariosPorCiclo[ciclo] || [];

        doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.text("UNIVERSIDAD NACIONAL DE TRUJILLO", 14, 13);
        doc.setFontSize(9); doc.text("FACULTAD DE INGENIERÍA", 14, 18); doc.text("TRUJILLO", 14, 23);
        doc.setFont("helvetica", "normal"); doc.text("ESCUELA:", 14, 30); doc.setFont("helvetica", "bold"); doc.text("INGENIERÍA DE SISTEMAS", 32, 30);
        doc.setFont("helvetica", "normal"); doc.text("CICLO:", 14, 36); doc.setFont("helvetica", "bold"); doc.text(String(ciclo), 28, 36);
        
        const year = semestre.split('-')[0] || ''; const semNum = semestre.split('-')[1] === '1' ? 'I' : 'II';
        doc.setFont("helvetica", "normal"); doc.text("AÑO ACADÉMICO:", 14, 42); doc.setFont("helvetica", "bold"); doc.text(year, 44, 42);
        doc.setFont("helvetica", "normal"); doc.text("SEMESTRE:", 60, 42); doc.setFont("helvetica", "bold"); doc.text(semNum, 82, 42);

        const listaCursos = generarLeyendaCursos(horariosCiclo);

        autoTable(doc, {
          startY: 9, margin: { left: 95 }, tableWidth: 'auto', head: [['N°', 'PROFESOR', 'ASIGNATURA', 'T', 'P', 'L', 'G', 'T. HORAS', 'DEPARTAMENTO']],
          body: listaCursos.map(c => [c.num, c.profesor, c.asignatura, c.T, c.P, c.L, c.G, c.THoras, c.departamento]),
          theme: 'grid', styles: { fontSize: 6.5, cellPadding: 1, halign: 'center', textColor: [40, 40, 40] },
          columnStyles: { 0: { fontStyle: 'bold', cellWidth: 6 }, 1: { halign: 'left', cellWidth: 40 }, 2: { halign: 'left', cellWidth: 45 }, 8: { halign: 'left', cellWidth: 25 } },
          headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', halign: 'center' },
          didParseCell: (data) => { 
            if (data.section === 'body' && listaCursos[data.row.index]) {
              data.cell.styles.fillColor = PALETA_COLORES[(listaCursos[data.row.index].num - 1) % PALETA_COLORES.length]; 
            }
          }
        });

        const mat = construirMatrizHorario(horariosCiclo);
        const colsWidthDef = { 0: { cellWidth: 20 } };
        const colWidth = (280 - 14 - 20) / (dias.length * 2);
        for(let i=1; i<=dias.length*2; i++) colsWidthDef[i] = { cellWidth: colWidth };

        const bodyRows = bloques.map((blq, r) => {
          const row = [{ content: blq.label, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } }];
          for (let c = 0; c < dias.length * 2; c++) {
            const cell = mat[r][c];
            if (!cell || cell.skipped) continue;
            
            let str = ""; let cInfo = null;
            if (cell.h) {
              const asig = asignaciones.find(x => x.id === cell.h.asignacion_id);
              const cursoFull = cursos.find(cu => cu.id === asig?.curso_id) || cell.h.curso;
              cInfo = listaCursos.find(x => x.codigo === cursoFull?.codigo && String(x.docente_id) === String(asig?.docente_id));
              str = `${cInfo?.num || ''} ${cell.h.aula?.codigo || cell.h.laboratorio?.codigo || ''}`.trim();
            }
            row.push({ content: str, rowSpan: cell.rs, colSpan: cell.cs, cInfo });
          }
          return row;
        });

        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 4,
          head: [[{ content: 'HORA' }, ...dias.map(d => ({ content: d.toUpperCase(), colSpan: 2 }))] ],
          body: bodyRows,
          theme: 'grid', styles: { fontSize: 8, cellPadding: 1, halign: 'center', valign: 'middle', lineColor: [150, 150, 150], lineWidth: 0.1 },
          headStyles: { fillColor: [44, 62, 80], textColor: 255 }, columnStyles: colsWidthDef,
          didParseCell: (d) => {
            if (d.section === 'body' && d.column.index > 0 && d.cell.raw?.cInfo) {
              d.cell.styles.fillColor = PALETA_COLORES[(d.cell.raw.cInfo.num - 1) % PALETA_COLORES.length];
              d.cell.styles.fontStyle = 'bold';
            }
          }
        });
      });

      doc.save(`Horarios_Oficiales_Todos_${semestre}.pdf`);
    } catch (err) { alert("Ocurrió un error al generar el PDF de Todos los Ciclos."); console.error(err); }
  };

  const exportarTodosExcel = () => {
    try {
      if (!getCiclosActivos || getCiclosActivos.length === 0) return;
      const ciclosValidos = getCiclosActivos.filter(c => horariosPorCiclo[c] && horariosPorCiclo[c].length > 0);
      if (ciclosValidos.length === 0) { alert("No hay horarios programados para exportar."); return; }

      const wb = XLSX.utils.book_new();
      const PALETA_HEX = ["F2D7D5", "D4E6F1", "D5F5E3", "FCF3CF", "EBE2F0", "F6DDC4", "D1F2EB", "F5CBC5", "E1F5C4", "FFEBEB", "D7DBDD", "FAD7A0"];
      const borderThin = { top: { style: "thin", color: { rgb: "999999" } }, bottom: { style: "thin", color: { rgb: "999999" } }, left: { style: "thin", color: { rgb: "999999" } }, right: { style: "thin", color: { rgb: "999999" } } };

      ciclosValidos.forEach((ciclo) => {
        const horariosCiclo = horariosPorCiclo[ciclo] || [];
        const listaCursos = generarLeyendaCursos(horariosCiclo);
        
        const ws = {}; const merges = [];

        const writeCell = (r, c, val, style = {}) => {
          const safeVal = val == null ? "" : val;
          ws[XLSX.utils.encode_cell({ r, c })] = {
            t: typeof safeVal === "number" ? "n" : "s", v: safeVal,
            s: { font: { name: "Arial", sz: 9, ...style.font }, alignment: { horizontal: "center", vertical: "center", wrapText: true, ...style.alignment }, fill: style.fill ? { patternType: "solid", ...style.fill } : undefined, border: style.border }
          };
        };

        const topTexts = ["UNIVERSIDAD NACIONAL DE TRUJILLO", "FACULTAD DE INGENIERÍA", "TRUJILLO", "ESCUELA: INGENIERÍA DE SISTEMAS", `CICLO: ${ciclo}`, `AÑO ACADÉMICO: ${semestre.split('-')[0] || ''}`, `SEMESTRE: ${semestre.split('-')[1] === '1' ? 'I' : 'II'}`];
        const startRowMalla = Math.max(topTexts.length, listaCursos.length + 1) + 2;

        for (let i = 0; i < startRowMalla - 2; i++) {
          if (i < topTexts.length && topTexts[i]) writeCell(i, 0, topTexts[i], { font: { bold: true, sz: i < 3 ? (i === 0 ? 11 : 9.5) : 9, color: { rgb: i < 3 ? "000000" : "444444" } }, alignment: { horizontal: "left" } });
          
          if (i === 0) {
            ["N°", "PROFESOR", "ASIGNATURA", "T", "P", "L", "G", "T. HORAS", "DEPARTAMENTO"].forEach((hName, cOff) => {
              writeCell(0, 3 + cOff, hName, { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "2980B9" } }, border: borderThin });
            });
          } else if (i - 1 < listaCursos.length) {
            const c = listaCursos[i - 1]; const hex = PALETA_HEX[(c.num - 1) % PALETA_HEX.length];
            const st = { fill: { fgColor: { rgb: hex } }, border: borderThin, alignment: { vertical: "center" } };

            writeCell(i, 3, c.num, { ...st, font: { bold: true } }); writeCell(i, 4, c.profesor, { ...st, alignment: { horizontal: "left" } }); writeCell(i, 5, c.asignatura, { ...st, alignment: { horizontal: "left" } });
            writeCell(i, 6, c.T, st); writeCell(i, 7, c.P, st); writeCell(i, 8, c.L, st); writeCell(i, 9, c.G, st); writeCell(i, 10, c.THoras, st);
            writeCell(i, 11, c.departamento, { ...st, alignment: { horizontal: "left" } });
          }
        }

        writeCell(startRowMalla - 2, 0, "MALLA HORARIA OFICIAL", { font: { bold: true, sz: 10 }, alignment: { horizontal: "left" } });
        writeCell(startRowMalla - 1, 0, "HORA", { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "2C3E50" } }, border: borderThin });
        dias.forEach((d, i) => {
          writeCell(startRowMalla - 1, 1 + i * 2, d.toUpperCase(), { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "2C3E50" } }, border: borderThin });
          merges.push({ s: { r: startRowMalla - 1, c: 1 + i * 2 }, e: { r: startRowMalla - 1, c: 2 + i * 2 } });
        });

        const mat = construirMatrizHorario(horariosCiclo);

        bloques.forEach((blq, r) => {
          writeCell(startRowMalla + r, 0, blq.label, { font: { bold: true, sz: 8.5 }, fill: { fgColor: { rgb: "F5F5F5" } }, border: borderThin });

          for (let c = 0; c < dias.length * 2; c++) {
            const cell = mat[r][c];
            if (!cell || cell.skipped) continue;

            const colIdx = 1 + c;
            let str = ""; let bg = "FFFFFF";

            if (cell.h) {
              const asig = asignaciones.find(a => a.id === cell.h.asignacion_id);
              const cursoFull = cursos.find(cu => cu.id === asig?.curso_id) || cell.h.curso;
              const ci = listaCursos.find(x => x.codigo === cursoFull?.codigo && String(x.docente_id) === String(asig?.docente_id));
              str = `${ci?.num || ''} ${cell.h.aula?.codigo || cell.h.laboratorio?.codigo || ''}`.trim();
              bg = ci ? PALETA_HEX[(ci.num - 1) % PALETA_HEX.length] : "FFFFFF";
            }

            writeCell(startRowMalla + r, colIdx, str, { font: { bold: true, sz: 8.5 }, fill: { fgColor: { rgb: bg } }, border: borderThin });

            if (cell.rs > 1 || cell.cs > 1) {
              merges.push({ s: { r: startRowMalla + r, c: colIdx }, e: { r: startRowMalla + r + cell.rs - 1, c: colIdx + cell.cs - 1 } });
              for (let i = 0; i < cell.rs; i++) {
                for (let j = 0; j < cell.cs; j++) {
                  if (i === 0 && j === 0) continue;
                  writeCell(startRowMalla + r + i, colIdx + j, "", { fill: { fgColor: { rgb: bg } }, border: borderThin });
                }
              }
            }
          }
        });

        ws['!merges'] = merges; ws['!cols'] = [{ wch: 16 }];
        for(let i=0; i<dias.length*2; i++) ws['!cols'].push({ wch: 8 });
        ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: startRowMalla + bloques.length, c: Math.max(dias.length * 2, 11) } });
        
        XLSX.utils.book_append_sheet(wb, ws, `Ciclo ${ciclo}`);
      });

      XLSX.writeFile(wb, `Horarios_Oficiales_Todos_${semestre}.xlsx`);
    } catch (err) { alert("Ocurrió un error al generar el Excel de Todos los Ciclos."); console.error(err); }
  };

  const abrirModalCrearManual = async () => {
    setErrorModalCreate(null); setAsigSeleccionada(null); setCreateForm({ dia: "Lunes", hora_inicio: "", hora_fin: "", ambiente_id: "" }); setAmbientesValidadosAPI([]);
    const idsConHorario = horarios.map(h => h.asignacion_id);
    let pendientes = asignaciones.filter(a => a.semestre_asignacion === semestre && !idsConHorario.includes(a.id));
    if (filtroDocente) pendientes = pendientes.filter(a => String(a.docente_id) === String(filtroDocente));
    
    pendientes.sort((a, b) => {
      const docA = docentes.find(d => d.id === a.docente_id) || {}; const docB = docentes.find(d => d.id === b.docente_id) || {};
      return (Number(docB.antiguedad_anios || 0) - Number(docA.antiguedad_anios || 0));
    });
    setAsignacionesLibres(pendientes); setModalCreateOpen(true);
  };

  const handleGuardarHorarioManual = async () => {
    if (!asigSeleccionada || !createForm.dia || !createForm.hora_inicio || !createForm.hora_fin || !createForm.ambiente_id) {
      setErrorModalCreate("Todos los campos del formulario son requeridos."); return;
    }
    setGuardandoManual(true); setErrorModalCreate(null);
    try {
      const isAula = asigSeleccionada.tipo === "Teoria" || asigSeleccionada.tipo === "Practica";
      const payload = {
        asignacion_id: asigSeleccionada.id, dia: createForm.dia, hora_inicio: createForm.hora_inicio, hora_fin: createForm.hora_fin,
        aula_id: isAula ? Number(createForm.ambiente_id) : null,
        laboratorio_id: !isAula ? Number(createForm.ambiente_id) : null,
      };
      await api.post("/horarios", payload);
      setModalCreateOpen(false); cargarDatos();
    } catch (err) { setErrorModalCreate(err.response?.data?.message || "Error al guardar."); } finally { setGuardandoManual(false); }
  };

  const generarBloquesMalla = () => {
    if (!config) return [];
    const [hIni, mIni] = (config.hora_inicio || "07:00").split(":").map(Number);
    const [hFin] = (config.hora_fin || "22:00").split(":").map(Number);
    const bloquesLista = [];
    for (let i = hIni * 60 + mIni; i + 60 <= hFin * 60; i += 60) {
      const h1 = String(Math.floor(i / 60)).padStart(2, "0"); const m1 = String(i % 60).padStart(2, "0");
      const h2 = String(Math.floor((i + 60) / 60)).padStart(2, "0"); const m2 = String((i + 60) % 60).padStart(2, "0");
      bloquesLista.push({ inicio: `${h1}:${m1}`, fin: `${h2}:${m2}`, label: `${h1}:${m1} - ${h2}:${m2}` });
    }
    return bloquesLista;
  };

  const bloques = generarBloquesMalla();

  const horariosPorCiclo = useMemo(() => {
    const map = {};
    if (!horarios) return map;
    for (const h of horarios) {
      if (filtroDocente && String(h.docente?.id || h.docente_id) !== String(filtroDocente)) continue; 
      const cicloCurso = h.curso?.ciclo || h.ciclo || h.curso_ciclo;
      if (!cicloCurso) continue;
      if (!map[cicloCurso]) map[cicloCurso] = [];
      map[cicloCurso].push(h);
    }
    return map;
  }, [horarios, filtroDocente]);

  const getHorariosEnBloque = (diaStr, bloquesInicio, bloqueFin, horariosDelCiclo) => {
    const blockIniMin = timeToMinutes(bloquesInicio); 
    const blockFinMin = timeToMinutes(bloqueFin);
    return horariosDelCiclo.filter((h) => {
      if (String(h.dia).trim().toLowerCase() !== String(diaStr).trim().toLowerCase()) return false;
      const hIniMin = timeToMinutes(h.hora_inicio);
      const hFinMin = timeToMinutes(h.hora_fin);
      return hIniMin < blockFinMin && hFinMin > blockIniMin;
    });
  };

  const getNombreDocente = (id) => { const d = docentes.find((doc) => doc.id === id); return d ? `${d.nombres} ${d.apellidos}` : `Docente ${id}`; };
  const getNombreCurso = (id) => { const c = cursos.find((cur) => cur.id === id); return c ? `${c.codigo} — ${c.nombre}` : `Curso ${id}`; };

  if (loading) return <div className="p-12 text-center text-neutral-500">Cargando malla de horarios...</div>;

  return (
    <div className="animate-fade-in transition-colors duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2 transition-colors">
            <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" /> Gestión de Horarios
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 transition-colors">
            Semestre: <span className="font-semibold text-primary-700 dark:text-primary-400">{semestre}</span>
            {getCiclosActivos.length > 0 && <span className="ml-2 text-xs text-neutral-400 dark:text-neutral-500">(Ciclos: {getCiclosActivos.join(", ")})</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportarTodosPDF} className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 rounded-md font-medium transition-colors" title="Descargar malla de todos los ciclos en un solo PDF">
            <Download className="w-3.5 h-3.5 text-red-600 dark:text-red-400" /> Todo PDF
          </button>
          <button onClick={exportarTodosExcel} className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 rounded-md font-medium transition-colors" title="Descargar malla de todos los ciclos en un solo Excel">
            <Download className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> Todo Excel
          </button>
        </div>
        {mensaje && (
          <div className={`px-4 py-2.5 rounded-lg text-sm font-medium ${mensaje.tipo === "exito" ? "bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400" : "bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400"}`}>
            {mensaje.texto} <button onClick={() => setMensaje(null)} className="ml-2">&times;</button>
          </div>
        )}
      </div>

      <div className="card dark:bg-neutral-800 dark:border-neutral-700 p-4 mb-6 transition-colors">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 transition-colors">Semestre</label>
            <input type="text" value={semestre} onChange={(e) => setSemestre(e.target.value)} className="input w-28 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 transition-colors"><Users className="w-3.5 h-3.5 inline mr-1 text-neutral-400" /> Docente</label>
            <select value={filtroDocente} onChange={(e) => setFiltroDocente(e.target.value)} className="input w-56 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white transition-colors">
              <option value="">Todos</option>
              {docentes.map((d) => <option key={d.id} value={d.id}>{d.nombres} {d.apellidos}</option>)}
            </select>
          </div>
          <button onClick={handleGenerar} disabled={generando} className="btn-primary flex items-center gap-2 dark:bg-primary-700 dark:hover:bg-primary-600 border-none transition-colors">
            {generando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Generar Horarios
          </button>
          <button onClick={abrirModalCrearManual} className="btn-primary flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 border-none text-white transition-colors">
            <Plus className="w-4 h-4" /> Programar Manual
          </button>
          <button onClick={handleLimpiar} disabled={limpiando} className="btn-secondary flex items-center gap-2 bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 transition-colors">
            {limpiando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Limpiar Todo
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 w-fit flex-wrap transition-colors">
        {getCiclosActivos.map((c) => (
          <button key={c} onClick={() => setCicloActivo(String(c))} className={`flex items-center gap-2 px-4 py-1.5 text-sm rounded-md transition-all ${cicloActivo === String(c) ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 font-medium shadow-sm" : "text-neutral-500 dark:text-neutral-400"}`}>
            <GraduationCap className="w-4 h-4" /> Ciclo {c}
          </button>
        ))}
      </div>

      {cicloActivo && (
        <div className="card overflow-hidden mb-6 dark:bg-neutral-800 dark:border-neutral-700 transition-colors">
          <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700 flex justify-between transition-colors">
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-white flex gap-2"><LayoutGrid className="w-4 h-4 text-primary-600 dark:text-primary-400" /> Horario Ciclo {cicloActivo}</h2>
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">{(horariosPorCiclo[cicloActivo] || []).length} clases</span>
              <div className="flex items-center gap-2">
                <button onClick={exportarPDFCiclo} className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 rounded-md font-medium transition-colors">
                  <Download className="w-3.5 h-3.5 text-red-600 dark:text-red-400" /> Descargar PDF
                </button>
                <button onClick={exportarExcelCiclo} className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 rounded-md font-medium transition-colors">
                  <Download className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> Descargar Excel
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-fixed min-w-[900px]">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800 transition-colors">
                  <th className="border-b border-r border-neutral-200 dark:border-neutral-700 p-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase w-[100px] sticky left-0 bg-inherit z-10">Bloque</th>
                  {dias.map(dia => <th key={dia} className="border-b border-r border-neutral-200 dark:border-neutral-700 p-2 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{dia}</th>)}
                </tr>
              </thead>
              <tbody>
                {bloques.map((bloque, idx) => (
                  <tr key={bloque.label} className={`${idx % 2 === 0 ? "bg-white dark:bg-neutral-800" : "bg-neutral-50/30 dark:bg-neutral-800/50"} transition-colors h-[90px]`}>
                    <td className="border-b border-r border-neutral-200 dark:border-neutral-700 p-2 text-neutral-600 dark:text-neutral-300 text-xs font-medium w-[100px] sticky left-0 bg-inherit z-10">{bloque.label}</td>
                    {dias.map((dia) => {
                      const hs = getHorariosEnBloque(dia, bloque.inicio, bloque.fin, horariosPorCiclo[cicloActivo] || []);
                      return (
                        <td key={`${dia}-${bloque.label}`} className="border-b border-r border-neutral-200 dark:border-neutral-700 p-1 align-top h-full relative">
                          {hs.length > 0 && (
                            <div className={`grid h-full w-full gap-1 ${hs.length === 1 ? 'grid-cols-1' : hs.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                              {hs.map((h) => {
                                const color = getColorCurso(h.curso?.codigo);
                                const asigRef = asignaciones.find(a => a.id === h.asignacion_id);
                                const grupoTxt = asigRef && asigRef.grupo !== 'Único' ? `[G.${asigRef.grupo}] ` : '';
                                const tipoAbrv = asigRef ? asigRef.tipo.substring(0,3) + '. ' : '';

                                return (
                                  <div 
                                    key={h.id} 
                                    onClick={() => abrirEdicion(h)}
                                    className="flex flex-col rounded-lg p-1.5 border-l-[3px] hover:shadow-md transition-all group dark:opacity-90 relative overflow-hidden cursor-pointer min-w-0" 
                                    style={{ backgroundColor: color.bg, borderLeftColor: color.border }}
                                  >
                                    <p className="text-[11px] font-semibold truncate" style={{ color: color.text }} title={`${grupoTxt}${h.curso?.codigo}`}>
                                      {grupoTxt}{h.curso?.codigo}
                                    </p>
                                    <p className="text-[9px] leading-tight truncate" style={{ color: color.sub }}>{tipoAbrv}{h.curso?.nombre}</p>
                                    
                                    <div className="flex gap-1 mt-1">
                                      <Clock className="w-2.5 h-2.5 flex-shrink-0" style={{ color: color.sub }}/>
                                      <span className="text-[9px] font-medium" style={{ color: color.sub }}>{formatAMPM(h.hora_inicio)} - {formatAMPM(h.hora_fin)}</span>
                                    </div>
                                    
                                    <div className="flex gap-1 mt-0.5">
                                      <User className="w-2.5 h-2.5 flex-shrink-0" style={{ color: color.sub }}/>
                                      <span className="text-[9px] truncate leading-tight" style={{ color: color.sub }}>
                                        {h.docente?.nombres} {h.docente?.apellidos}
                                      </span>
                                    </div>
                                    
                                    <div className="flex gap-1 mt-0.5">
                                      <MapPin className="w-2.5 h-2.5 flex-shrink-0" style={{ color: color.sub }}/>
                                      <span className="text-[9px] font-medium" style={{ color: color.sub }}>{h.aula?.codigo || h.laboratorio?.codigo}</span>
                                    </div>
                                    
                                    <div className="flex flex-col gap-1 mt-2 pt-1 border-t border-black/5 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-1 right-1 bg-white/80 dark:bg-black/50 p-1 rounded backdrop-blur-sm">
                                      <button onClick={(e) => { e.stopPropagation(); abrirEdicion(h); }} className="text-primary-600 dark:text-primary-400 hover:text-primary-800 text-xs flex items-center gap-0.5 font-medium transition-colors"><Pencil className="w-3 h-3" /></button>
                                      <button onClick={(e) => { e.stopPropagation(); handleEliminar(h.id); }} className="text-danger-500 dark:text-danger-400 hover:text-danger-700 text-xs flex items-center gap-0.5 font-medium transition-colors"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
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

      {editando && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 animate-fade-in transition-colors duration-300" onClick={() => setEditando(null)}>
          <div className="card bg-white dark:bg-neutral-800 dark:border-neutral-700 p-6 w-full max-w-md shadow-modal animate-scale-in transition-colors" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2 transition-colors">
                <Pencil className="w-5 h-5 text-primary-600 dark:text-primary-400" /> Editar Horario
              </h2>
              <button onClick={() => setEditando(null)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <p className="text-sm font-bold text-neutral-800 dark:text-white">{editando.curso?.nombre}</p>
                <p className="text-xs text-neutral-500 mt-1">Docente: {editando.docente?.nombres} {editando.docente?.apellidos}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 transition-colors">Día</label>
                <select value={editForm.dia} onChange={(e) => setEditForm({ ...editForm, dia: e.target.value })} className="input w-full dark:bg-neutral-900 dark:border-neutral-700 dark:text-white transition-colors">
                  {dias.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 transition-colors">Hora inicio</label>
                  <select value={editForm.hora_inicio} onChange={(e) => handleCambioHoraInicioEdit(e.target.value)} className="input w-full font-medium dark:bg-neutral-900 dark:border-neutral-700 dark:text-white transition-colors">
                    <option value="" disabled>Seleccione...</option>
                    {horasDisponibles.map((h) => {
                      const conflicto = verificarConflictoEdit(h);
                      return <option key={h} value={h} disabled={!!conflicto}>{formatAMPM(h)} {conflicto ? ` - (${conflicto})` : ''}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5 transition-colors">Hora fin (Auto)</label>
                  <input type="text" value={editForm.hora_fin ? formatAMPM(editForm.hora_fin) : "Automático"} className="input w-full font-semibold bg-neutral-100 dark:bg-neutral-900/50 dark:border-neutral-700 text-neutral-500 cursor-not-allowed transition-colors" disabled />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 transition-colors">
                  {(() => {
                    const asig = asignaciones.find(a => a.id === editando.asignacion_id);
                    return asig?.tipo === "Teoria" || asig?.tipo === "Practica" ? "Seleccionar Aula" : "Seleccionar Laboratorio";
                  })()}
                  {cargandoAmbientes && <span className="text-3xs text-primary-600 dark:text-primary-400 animate-pulse ml-2">(Sincronizando...)</span>}
                </label>
                
                <select 
                  value={(() => {
                    const asig = asignaciones.find(a => a.id === editando.asignacion_id);
                    return asig?.tipo === "Teoria" || asig?.tipo === "Practica" ? (editForm.aula_id ? String(editForm.aula_id) : "") : (editForm.laboratorio_id ? String(editForm.laboratorio_id) : "");
                  })()}
                  onChange={(e) => {
                    const asig = asignaciones.find(a => a.id === editando.asignacion_id);
                    if (asig?.tipo === "Teoria" || asig?.tipo === "Practica") setEditForm({ ...editForm, aula_id: e.target.value, laboratorio_id: null });
                    else setEditForm({ ...editForm, laboratorio_id: e.target.value, aula_id: null });
                  }} 
                  className="input w-full font-medium bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:text-white transition-colors" disabled={cargandoAmbientes}
                >
                  <option value="">Seleccione el ambiente físico...</option>
                  {ambientesValidadosAPI.map(amb => (
                    <option key={amb.id} value={String(amb.id)} disabled={amb.esta_ocupado}>{amb.codigo} — Cap: {amb.capacidad} {amb.esta_ocupado ? "❌ (OCUPADO)" : "✅"}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-transparent dark:border-neutral-700 mt-2 transition-colors">
                <button onClick={() => setEditando(null)} className="btn-ghost dark:text-neutral-300 dark:hover:bg-neutral-700 transition-colors">Cancelar</button>
                <button onClick={handleGuardarEdicion} disabled={cargandoAmbientes || !editForm.hora_inicio} className="btn-primary flex items-center gap-2 dark:bg-primary-700 dark:hover:bg-primary-600 transition-colors border-none">
                  <Save className="w-4 h-4" /> Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalCreateOpen && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 animate-fade-in transition-colors duration-300" onClick={() => setModalCreateOpen(false)}>
          <div className="card bg-white dark:bg-neutral-800 dark:border-neutral-700 p-6 w-full max-w-md shadow-modal animate-scale-in max-h-[90vh] overflow-y-auto transition-colors" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Programar Manual</h2>
              <button onClick={() => setModalCreateOpen(false)} className="p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Asignación Pendiente</label>
                <select className="input w-full dark:bg-neutral-900 dark:border-neutral-700 dark:text-white" onChange={(e) => {
                  const sel = asignacionesLibres.find(a => a.id === Number(e.target.value));
                  setAsigSeleccionada(sel); setCreateForm({ dia: "Lunes", hora_inicio: "", hora_fin: "", ambiente_id: "" });
                }} defaultValue="">
                  <option value="" disabled>Seleccione...</option>
                  {asignacionesLibres.map((a) => (
                    <option key={a.id} value={a.id}>{getNombreDocente(a.docente_id)} — {getNombreCurso(a.curso_id)} ({a.tipo} {a.grupo !== 'Único' ? `G.${a.grupo}` : ''}) [{a.horas_asignadas}h]</option>
                  ))}
                </select>
              </div>
              {asigSeleccionada && (
                <>
                  <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Día</label><select value={createForm.dia} onChange={(e) => setCreateForm({ ...createForm, dia: e.target.value })} className="input w-full dark:bg-neutral-900 dark:text-white">{dias.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium dark:text-neutral-300 mb-1.5">Hora Inicio</label>
                      <select value={createForm.hora_inicio} onChange={(e) => handleCambioHoraInicioCreate(e.target.value)} className="input w-full dark:bg-neutral-900 dark:text-white">
                        <option value="">Seleccione...</option>
                        {horasDisponibles.map(h => {
                          const conf = verificarConflictoCreate(h);
                          return <option key={h} value={h} disabled={!!conf}>{formatAMPM(h)} {conf ? ` - (${conf})` : ''}</option>
                        })}
                      </select>
                    </div>
                    <div><label className="block text-sm font-medium dark:text-neutral-400 mb-1.5">Hora Fin (Auto)</label><input type="text" value={createForm.hora_fin ? formatAMPM(createForm.hora_fin) : "Automático"} className="input w-full bg-neutral-100 dark:bg-neutral-900/50 text-neutral-500 cursor-not-allowed" disabled /></div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium dark:text-neutral-300 mb-1.5">{asigSeleccionada.tipo === "Teoria" || asigSeleccionada.tipo === "Practica" ? "Aula" : "Laboratorio"}</label>
                    <select value={createForm.ambiente_id} onChange={(e) => setCreateForm({ ...createForm, ambiente_id: e.target.value })} className="input w-full dark:bg-neutral-900 dark:text-white" disabled={cargandoAmbientes}>
                      <option value="">Seleccione ambiente...</option>
                      {ambientesValidadosAPI.map(amb => <option key={amb.id} value={amb.id} disabled={amb.esta_ocupado}>{amb.codigo} {amb.esta_ocupado ? "❌" : "✅"}</option>)}
                    </select>
                  </div>
                  {errorModalCreate && <p className="text-danger-500 text-xs mt-2">{errorModalCreate}</p>}
                </>
              )}
              <div className="flex justify-end gap-2 pt-3"><button onClick={() => setModalCreateOpen(false)} className="btn-ghost dark:text-neutral-300">Cancelar</button><button onClick={handleGuardarHorarioManual} disabled={guardandoManual || !asigSeleccionada || !createForm.hora_inicio || cargandoAmbientes} className="btn-primary bg-blue-600 hover:bg-blue-700 text-white border-none"><Save className="w-4 h-4 inline mr-2"/> Guardar</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHorarios;