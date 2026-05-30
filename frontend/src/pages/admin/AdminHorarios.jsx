import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../services/api";
import jsPDF from "jspdf";
import * as XLSX from "xlsx-js-style";
import autoTable from "jspdf-autotable";
import {
  Calendar,
  RefreshCw,
  Zap,
  Filter,
  Users,
  LayoutGrid,
  User,
  MapPin,
  Pencil,
  Trash2,
  Inbox,
  X,
  Save,
  BookOpen,
  Clock,
  GraduationCap,
  Plus,
  AlertCircle,
  Download,
} from "lucide-react";

const timeToMinutes = (t) => {
  const [h, m] = String(t).slice(0, 5).split(":").map(Number);
  return h * 60 + m;
};

const DIAS_ESTANDAR = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miercoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sabado",
  domingo: "Domingo"
};

const normalizarDia = (diaStr) => {
  if (!diaStr) return "Lunes";
  const limpio = String(diaStr)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
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
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [limpiando, setLimpiando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({});

  // 🌟 INFRAESTRUCTURA EN CALIENTE: API asíncrona idéntica a la del Docente
  const [ambientesValidadosAPI, setAmbientesValidadosAPI] = useState([]);
  const [cargandoAmbientes, setCargandoAmbientes] = useState(false);

  // Garantiza que los días de la cabecera no tengan tildes ni espacios dañinos
  const dias = useMemo(() => {
    if (!config?.dias_habiles) return ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
    const raw = Array.isArray(config.dias_habiles)
      ? config.dias_habiles
      : config.dias_habiles.split(',');
    return raw.map(d => normalizarDia(d));
  }, [config]);

  // Control de Creación Manual e Infraestructura
  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [asignacionesLibres, setAsignacionesLibres] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [laboratorios, setLaboratorios] = useState([]);
  const [asigSeleccionada, setAsigSeleccionada] = useState(null);
  const [createForm, setCreateForm] = useState({
    dia: "Lunes",
    hora_inicio: "",
    hora_fin: "",
    ambiente_id: ""
  });
  const [guardandoManual, setGuardandoManual] = useState(false);
  const [errorModalCreate, setErrorModalCreate] = useState(null);

  useEffect(() => {
    api
      .get("/configuracion")
      .then((res) => {
        if (res.data?.data?.semestre_activo) {
          setSemestre(res.data.data.semestre_activo);
        }
      })
      .catch((err) => console.error("Error cargando configuración:", err));
  }, []);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [resHor, resDoc, resConf, resCur, resAsig, resAulas, resLabs] = await Promise.all([
        api.get("/horarios", { params: { semestre, docente_id: filtroDocente || undefined } }),
        api.get("/docentes"),
        api.get("/configuracion"),
        api.get("/cursos"),
        api.get("/asignaciones"),
        api.get("/horarios/aulas"),        
        api.get("/horarios/laboratorios")  
      ]);
      setHorarios(resHor.data?.data || []);
      setDocentes(resDoc.data?.data || []);
      setConfig(resConf.data?.data || null);
      setCursos(resCur.data?.data || []);
      setAsignaciones(resAsig.data?.data || []);
      setAulas(resAulas.data?.data || []);        
      setLaboratorios(resLabs.data?.data || []);  
    } catch (err) {
      console.error("Error cargando datos principales:", err);
    } finally {
      setLoading(false);
    }
  }, [semestre, filtroDocente]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const getCiclosActivos = useMemo(() => {
    if (!semestre) return [];
    const part = semestre.split("-");
    if (part.length !== 2) return [];
    const num = parseInt(part[1], 10);
    if (num === 1) return [1, 3, 5, 7, 9];
    if (num === 2) return [2, 4, 6, 8, 10];
    return [];
  }, [semestre]);

  useEffect(() => {
    if (getCiclosActivos.length > 0 && !cicloActivo) {
      setCicloActivo(String(getCiclosActivos[0]));
    }
  }, [getCiclosActivos, cicloActivo]);

  const horasDisponibles = useMemo(() => {
    const inicio = config?.hora_inicio || "07:00";
    const fin = config?.hora_fin || "22:00";
    const [hIni] = inicio.split(":").map(Number);
    const [hFin] = fin.split(":").map(Number);
    
    const lista = [];
    for (let h = hIni; h <= hFin; h++) {
      lista.push(`${String(h).padStart(2, "0")}:00`);
    }
    return lista;
  }, [config]);

  const calcularHoraFinAutomatica = (horaInicioStr, horasRequeridas) => {
    if (!horaInicioStr || !horasRequeridas) return "";
    const [h] = horaInicioStr.split(":").map(Number);
    const hFin = h + horasRequeridas;
    return `${String(hFin).padStart(2, "0")}:00`;
  };

  const handleCambioHoraInicioCreate = (horaIni) => {
    if (!asigSeleccionada) return;
    
    const cursoInfo = cursos.find(c => c.id === asigSeleccionada.curso_id);
    const horasRequeridas = asigSeleccionada.tipo === "Teoria" 
      ? Number(cursoInfo?.horas_aula || 0) 
      : Number(cursoInfo?.horas_lab || 0);

    const horaFinCalculada = calcularHoraFinAutomatica(horaIni, horasRequeridas);

    setCreateForm({
      ...createForm,
      hora_inicio: horaIni,
      hora_fin: horaFinCalculada
    });
  };

  const handleCambioHoraInicioEdit = (horaIni) => {
    if (!editando) return;

    const cursoInfo = cursos.find(c => c.id === editando.curso?.id || c.codigo === editando.curso?.codigo);
    const tipo = editando.tipo || editando.tipo_asignacion;
    const horasRequeridas = tipo === "Teoria" 
      ? Number(cursoInfo?.horas_aula || 0) 
      : Number(cursoInfo?.horas_lab || 0);

    const horaFinCalculada = calcularHoraFinAutomatica(horaIni, horasRequeridas);

    setEditForm({
      ...editForm,
      hora_inicio: horaIni,
      hora_fin: horaFinCalculada
    });
  };

  const verificarConflictoCreate = (horaIniPropuesta) => {
    if (!asigSeleccionada) return null;

    const cursoInfo = cursos.find(c => c.id === asigSeleccionada.curso_id);
    const horasRequeridas = asigSeleccionada.tipo === "Teoria" 
      ? Number(cursoInfo?.horas_aula || 0) 
      : Number(cursoInfo?.horas_lab || 0);

    const horaFinPropuesta = calcularHoraFinAutomatica(horaIniPropuesta, horasRequeridas);
    if (!horaFinPropuesta) return null;

    const iniPropuestoMin = timeToMinutes(horaIniPropuesta);
    const finPropuestoMin = timeToMinutes(horaFinPropuesta);

    const limiteFinMin = timeToMinutes(config?.hora_fin || "22:00");
    if (finPropuestoMin > limiteFinMin) return `Excede el cierre (${config?.hora_fin})`;

    const targetDia = normalizarDia(createForm.dia);

    for (const h of horarios) {
      if (normalizarDia(h.dia) === targetDia) {
        const hIniMin = timeToMinutes(h.hora_inicio);
        const hFinMin = timeToMinutes(h.hora_fin);

        if (iniPropuestoMin < hFinMin && finPropuestoMin > hIniMin) {
          const hDocenteId = h.docente?.id || h.docente_id;
          if (String(hDocenteId) === String(asigSeleccionada.docente_id)) return "Docente ocupado";
          
          const hCiclo = h.curso?.ciclo || h.ciclo;
          const cicloActual = cursoInfo?.ciclo || asigSeleccionada.ciclo;
          if (hCiclo && cicloActual && String(hCiclo) === String(cicloActual)) return `Ciclo ${hCiclo} ocupado`;
        }
      }
    }
    return null;
  };

  const verificarConflictoEdit = (horaIniPropuesta) => {
    if (!editando) return null;

    const cursoInfo = cursos.find(c => c.id === editando.curso?.id || c.codigo === editando.curso?.codigo);
    const tipo = editando.tipo || editando.tipo_asignacion;
    const horasRequeridas = tipo === "Teoria" 
      ? Number(cursoInfo?.horas_aula || 0) 
      : Number(cursoInfo?.horas_lab || 0);

    const horaFinPropuesta = calcularHoraFinAutomatica(horaIniPropuesta, horasRequeridas);
    if (!horaFinPropuesta) return null;

    const iniPropuestoMin = timeToMinutes(horaIniPropuesta);
    const finPropuestoMin = timeToMinutes(horaFinPropuesta);

    const limiteFinMin = timeToMinutes(config?.hora_fin || "22:00");
    if (finPropuestoMin > limiteFinMin) return `Excede el cierre (${config?.hora_fin})`;

    const targetDia = normalizarDia(editForm.dia);

    for (const h of horarios) {
      if (Number(h.id) !== Number(editando.id) && normalizarDia(h.dia) === targetDia) {
        const hIniMin = timeToMinutes(h.hora_inicio);
        const hFinMin = timeToMinutes(h.hora_fin);

        if (iniPropuestoMin < hFinMin && finPropuestoMin > hIniMin) {
          const hDocenteId = h.docente?.id || h.docente_id;
          const docenteEditando = editando.docente?.id || editando.docente_id;
          if (String(hDocenteId) === String(docenteEditando)) return "Docente ocupado";
          
          const hCiclo = h.curso?.ciclo || h.ciclo;
          const cicloActual = cursoInfo?.ciclo || editando.curso?.ciclo;
          if (hCiclo && cicloActual && String(hCiclo) === String(cicloActual)) return `Ciclo ${hCiclo} ocupado`;
        }
      }
    }
    return null;
  };

  // 🌟 LLAMADA ASÍNCRONA A POSTGRESQL (Idéntica a la lógica del Docente)
  const refrescarDisponibilidadAmbientesAPI = useCallback(async (dia, hIni, hFin, tipoAsig, idHorario) => {
    if (!dia || !hIni || !hFin || !tipoAsig) return;
    setCargandoAmbientes(true);
    try {
      const idParaExcluir = idHorario ? Number(idHorario) : -1;
      const res = await api.get("/horarios/ambientes-disponibilidad", {
        params: {
          dia: String(dia).trim(),
          hora_inicio: hIni,
          hora_fin: hFin,
          tipo: tipoAsig,
          semestre: semestre,
          excludeId: idParaExcluir
        }
      });
      setAmbientesValidadosAPI(res.data?.data || []);
    } catch (err) {
      console.error("Error al sincronizar ambientes:", err);
    } finally {
      setCargandoAmbientes(false);
    }
  }, [semestre]);

  // Sincronizador dinámico del modal de edición
  useEffect(() => {
    if (editando && editForm.dia && editForm.hora_inicio && editForm.hora_fin) {
      console.log("Editando ID:", editando.id);
      refrescarDisponibilidadAmbientesAPI(
        editForm.dia,
        editForm.hora_inicio,
        editForm.hora_fin,
        editando.tipo || editando.tipo_asignacion,
        editando.id
      );
    }
  }, [editForm.dia, editForm.hora_inicio, editForm.hora_fin, editando, refrescarDisponibilidadAmbientesAPI]);

  // Sincronizador dinámico del modal de creación manual
  useEffect(() => {
    if (asigSeleccionada && createForm.dia && createForm.hora_inicio && createForm.hora_fin) {
      refrescarDisponibilidadAmbientesAPI(
        createForm.dia,
        createForm.hora_inicio,
        createForm.hora_fin,
        asigSeleccionada.tipo,
        null
      );
    }
  }, [createForm.dia, createForm.hora_inicio, createForm.hora_fin, asigSeleccionada, refrescarDisponibilidadAmbientesAPI]);

  const handleGenerar = async () => {
    if (!confirm("¿Está seguro que desea generar los horarios sin programar manualmente?")) return;
    setGenerando(true);
    setMensaje(null);
    try {
      const res = await api.post("/horarios/generar", { semestre, forzar: true });
      if (res.data?.success) {
        setMensaje({ tipo: "exito", texto: `${res.data.data?.generados || 0} horarios generados` });
        cargarDatos();
      }
    } catch (err) {
      setMensaje({ tipo: "error", texto: err.response?.data?.message || "Error al generar" });
    } finally {
      setGenerando(false);
    }
  };

  const handleLimpiar = async () => {
    if (!confirm(`¿Eliminar TODOS los horarios del semestre ${semestre}?`)) return;
    setLimpiando(true);
    setMensaje(null);
    try {
      const res = await api.post("/horarios/limpiar", { semestre });
      if (res.data?.success) {
        setMensaje({ tipo: "exito", texto: `${res.data.data?.eliminados || 0} horarios eliminados` });
        cargarDatos();
      }
    } catch (err) {
      setMensaje({ tipo: "error", texto: err.response?.data?.message || "Error al limpiar" });
    } finally {
      setLimpiando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar este horario?")) return;
    try {
      await api.delete(`/horarios/${id}`);
      cargarDatos();
    } catch (err) {
      alert(err.response?.data?.message || "Error al eliminar");
    }
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
      const payload = {
        dia: editForm.dia,
        hora_inicio: editForm.hora_inicio,
        hora_fin: editForm.hora_fin,
        aula_id: editForm.aula_id ? Number(editForm.aula_id) : null,
        laboratorio_id: editForm.laboratorio_id ? Number(editForm.laboratorio_id) : null
      };
      await api.put(`/horarios/${editando.id}`, payload);
      setEditando(null);
      cargarDatos();
    } catch (err) {
      alert(err.response?.data?.message || "Error al guardar");
    }
  };

  const exportarPDFCiclo = () => {
    if (!cicloActivo || !horariosPorCiclo[cicloActivo]) return;

    const doc = new jsPDF("landscape");
    const horariosCiclo = horariosPorCiclo[cicloActivo];

    const PALETA_COLORES = [
      [242, 215, 213], [212, 230, 241], [213, 245, 227], [252, 243, 207],
      [235, 222, 240], [246, 221, 204], [209, 242, 235], [245, 203, 167],
      [225, 245, 196], [255, 235, 235], [215, 219, 221], [250, 215, 160],
    ];

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("UNIVERSIDAD NACIONAL DE TRUJILLO", 14, 13);
    doc.setFontSize(9);
    doc.text("FACULTAD DE INGENIERÍA", 14, 18);
    doc.setFont("helvetica", "normal");
    doc.text("ESCUELA: INGENIERÍA DE SISTEMAS", 14, 23);

    const partesSemestre = semestre.split('-');
    doc.setFont("helvetica", "bold");
    doc.text(`CICLO: ${cicloActivo}`, 14, 30);
    doc.text(`AÑO ACADÉMICO: ${partesSemestre[0] || ''}`, 14, 34);
    doc.text(`SEMESTRE: ${partesSemestre[1] || ''}`, 14, 38);

    const cursosUnicosMap = new Map();
    let contadorN = 1;
    
    horariosCiclo.forEach(h => {
      const codigo = h.curso?.codigo;
      const docenteId = h.docente?.id || h.docente_id;
      if (!codigo || !docenteId) return;

      const compositeKey = `${codigo}-${docenteId}`;
      const tipoActual = h.tipo_asignacion || h.tipo || 'Teoria';
      const tipoNormalizado = tipoActual === 'Teoria' ? 'Teoría' : 'Laboratorio';

      if (!cursosUnicosMap.has(compositeKey)) {
        cursosUnicosMap.set(compositeKey, {
          num: contadorN++, 
          codigo: codigo,
          docenteId: docenteId,
          profesor: `${h.docente?.nombres || ''} ${h.docente?.apellidos || ''}`.trim(),
          asignatura: h.curso?.nombre || '',
          tiposSet: new Set([tipoNormalizado])
        });
      } else {
        cursosUnicosMap.get(compositeKey).tiposSet.add(tipoNormalizado);
      }
    });

    const listaCursos = Array.from(cursosUnicosMap.values()).map(c => ({
      ...c,
      tipo: Array.from(c.tiposSet).sort().join(' / ') 
    }));

    autoTable(doc, {
      startY: 9, 
      margin: { left: 95 }, 
      tableWidth: 188, 
      head: [['N°', 'PROFESOR', 'ASIGNATURA', 'TIPO']],
      body: listaCursos.map(c => [c.num, c.profesor, c.asignatura, c.tipo]),
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 1, halign: 'left', textColor: [40, 40, 40] },
      columnStyles: { 0: { halign: 'center', fontStyle: 'bold', cellWidth: 8 } },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', cellPadding: 1 },
      didParseCell: function(data) {
        if (data.section === 'body') {
          const cursoRow = listaCursos[data.row.index];
          if (cursoRow) {
            const colorIndex = (cursoRow.num - 1) % PALETA_COLORES.length;
            data.cell.styles.fillColor = PALETA_COLORES[colorIndex];
          }
        }
      }
    });

    const spanMatrix = Array(bloques.length).fill(null).map(() => Array(dias.length).fill(null));

    for (let c = 0; c < dias.length; c++) {
      const dia = dias[c];
      for (let r = 0; r < bloques.length; r++) {
        if (spanMatrix[r][c] !== null) continue;

        const bloque = bloques[r];
        const h = horarioEnBloque(dia, bloque.inicio, bloque.fin, horariosCiclo);

        if (h) {
          const compositeKey = `${h.curso?.codigo}-${h.docente?.id || h.docente_id}`;
          const cursoInfo = cursosUnicosMap.get(compositeKey);
          const numRef = cursoInfo ? cursoInfo.num : '';
          const contentStr = `[${numRef}] ${h.curso?.codigo || 'S/C'}\n(${h.aula?.codigo || h.laboratorio?.codigo || ''})`;

          let rowSpanCount = 1;
          while (r + rowSpanCount < bloques.length) {
            const nextBloque = bloques[r + rowSpanCount];
            const nextH = horarioEnBloque(dia, nextBloque.inicio, nextBloque.fin, horariosCiclo);
            if (nextH && nextH.id === h.id) {
              rowSpanCount++;
            } else {
              break;
            }
          }

          spanMatrix[r][c] = {
            content: contentStr,
            rowSpan: rowSpanCount,
            cursoInfo: cursoInfo,
            skipped: false
          };

          for (let k = 1; k < rowSpanCount; k++) {
            spanMatrix[r + k][c] = { skipped: true };
          }
        } else {
          spanMatrix[r][c] = { content: "", rowSpan: 1, skipped: false };
        }
      }
    }

    const tableRows = [];
    for (let r = 0; r < bloques.length; r++) {
      const filaCells = [];
      filaCells.push({ content: bloques[r].label, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } });
      
      for (let c = 0; c < dias.length; c++) {
        const celda = spanMatrix[r][c];
        if (celda.skipped) continue;
        
        filaCells.push({
          content: celda.content,
          rowSpan: celda.rowSpan,
          rawInfo: celda.cursoInfo 
        });
      }
      tableRows.push(filaCells);
    }

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 4, 
      head: [['HORA', ...dias.map(d => d.toUpperCase())]],
      body: tableRows,
      theme: 'grid',
      styles: { 
        fontSize: 7, 
        cellPadding: 1.5, 
        halign: 'center', 
        valign: 'middle',
        lineWidth: 0.1,
        lineColor: [150, 150, 150],
        textColor: [40, 40, 40]
      },
      headStyles: { 
        fillColor: [44, 62, 80], 
        textColor: 255, 
        halign: 'center',
        fontStyle: 'bold',
        cellPadding: 1.8
      },
      columnStyles: { 0: { cellWidth: 25 } },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index > 0) {
          const rawData = data.cell.raw;
          if (rawData && rawData.rawInfo) {
            const colorIndex = (rawData.rawInfo.num - 1) % PALETA_COLORES.length;
            data.cell.styles.fillColor = PALETA_COLORES[colorIndex];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    doc.save(`Horario_Oficial_Ciclo_${cicloActivo}_${semestre}.pdf`);
  };

  // 🌟 TU LÓGICA DE EXCEL ORIGINAL COMPLETAMENTE PROTEGIDA E INTACTA (0 MODIFICACIONES)
  const exportarExcelCiclo = () => {
    if (!cicloActivo || !horariosPorCiclo[cicloActivo]) return;
    const horariosCiclo = horariosPorCiclo[cicloActivo];

    const PALETA_HEX = [
      "F2D7D5", "D4E6F1", "D5F5E3", "FCF3CF", "EBE2F0", "F6DDC4",
      "D1F2EB", "F5CBC5", "E1F5C4", "FFEBEB", "D7DBDD", "FAD7A0"
    ];

    const borderThin = {
      top: { style: "thin", color: { rgb: "999999" } },
      bottom: { style: "thin", color: { rgb: "999999" } },
      left: { style: "thin", color: { rgb: "999999" } },
      right: { style: "thin", color: { rgb: "999999" } }
    };

    const cursosUnicosMap = new Map();
    let contadorN = 1;
    
    horariosCiclo.forEach(h => {
      const codigo = h.curso?.codigo;
      const docenteId = h.docente?.id || h.docente_id;
      if (!codigo || !docenteId) return;

      const compositeKey = `${codigo}-${docenteId}`;
      const tipoActual = h.tipo_asignacion || h.tipo || 'Teoria';
      const tipoNormalizado = tipoActual === 'Teoria' ? 'Teoría' : 'Laboratorio';

      if (!cursosUnicosMap.has(compositeKey)) {
        cursosUnicosMap.set(compositeKey, {
          num: contadorN++, 
          codigo: codigo,
          profesor: `${h.docente?.nombres || ''} ${h.docente?.apellidos || ''}`.trim(),
          asignatura: h.curso?.nombre || '',
          tiposSet: new Set([tipoNormalizado])
        });
      } else {
        cursosUnicosMap.get(compositeKey).tiposSet.add(tipoNormalizado);
      }
    });

    const listaCursos = Array.from(cursosUnicosMap.values()).map(c => ({
      ...c,
      tipo: Array.from(c.tiposSet).sort().join(' / ') 
    }));

    const wb = XLSX.utils.book_new();
    const ws = {};

    const writeCell = (r, c, val, style = {}) => {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      ws[cellRef] = {
        t: typeof val === "number" ? "n" : "s",
        v: val,
        s: {
          font: { name: "Arial", sz: 9, ...style.font },
          alignment: { horizontal: "center", vertical: "center", wrapText: true, ...style.alignment },
          fill: style.fill ? { patternType: "solid", ...style.fill } : undefined,
          border: style.border
        }
      };
    };

    const partesS = semestre.split('-');
    const leftTexts = [
      "UNIVERSIDAD NACIONAL DE TRUJILLO",
      "FACULTAD DE INGENIERÍA",
      "ESCUELA: INGENIERÍA DE SISTEMAS",
      "",
      `CICLO: ${cicloActivo}`,
      `AÑO ACADÉMICO: ${partesS[0] || ''}`,
      `SEMESTRE: ${partesS[1] || ''}`
    ];

    const totalUpperRows = Math.max(leftTexts.length, listaCursos.length + 1);

    for (let i = 0; i < totalUpperRows; i++) {
      if (i < leftTexts.length && leftTexts[i] !== "") {
        const isHeader = i < 3;
        writeCell(i, 0, leftTexts[i], {
          font: { bold: true, sz: isHeader ? (i === 0 ? 11 : 9.5) : 9, color: { rgb: isHeader ? "000000" : "444444" } },
          alignment: { horizontal: "left" } 
        });
      }

      if (i === 0) {
        const headersLeyenda = ["N°", "PROFESOR", "ASIGNATURA", "TIPO"];
        headersLeyenda.forEach((hName, cOffset) => {
          writeCell(0, 3 + cOffset, hName, {
            font: { bold: true, color: { rgb: "FFFFFF" }, sz: 9 },
            fill: { fgColor: { rgb: "2980B9" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: borderThin
          });
        });
      } else if (i > 0 && (i - 1) < listaCursos.length) {
        const c = listaCursos[i - 1];
        const colorHex = PALETA_HEX[(c.num - 1) % PALETA_HEX.length];
        const styleRow = { 
          fill: { fgColor: { rgb: colorHex } }, 
          border: borderThin, 
          font: { sz: 8.5 },
          alignment: { horizontal: "center", vertical: "center" } 
        };

        writeCell(i, 3, c.num, { ...styleRow, font: { bold: true } });
        writeCell(i, 4, c.profesor, styleRow);
        writeCell(i, 5, c.asignatura, styleRow);
        writeCell(i, 6, c.tipo, styleRow);
      }
    }

    let rIdx = totalUpperRows + 2; 

    writeCell(rIdx, 0, "MALLA HORARIA OFICIAL DEL CICLO", { font: { bold: true, color: { rgb: "2C3E50" }, sz: 10 }, alignment: { horizontal: "left" } });
    rIdx++;

    const headersMalla = ["HORA", ...dias.map(d => d.toUpperCase())];
    headersMalla.forEach((hName, cIdx) => {
      writeCell(rIdx, cIdx, hName, {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 9 },
        fill: { fgColor: { rgb: "2C3E50" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: borderThin
      });
    });
    rIdx++;

    const startRowMalla = rIdx; 
    const merges = [];

    bloques.forEach((bloque, bIdx) => {
      const curRowIdx = startRowMalla + bIdx;
      
      writeCell(curRowIdx, 0, bloque.label, {
        font: { bold: true, sz: 8.5 },
        fill: { fgColor: { rgb: "F5F5F5" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: borderThin
      });

      dias.forEach((dia, dIdx) => {
        const colIdx = dIdx + 1;
        const h = horarioEnBloque(dia, bloque.inicio, bloque.fin, horariosCiclo);

        if (h) {
          const compositeKey = `${h.curso?.codigo}-${h.docente?.id || h.docente_id}`;
          const cursoInfo = cursosUnicosMap.get(compositeKey);
          const numRef = cursoInfo ? cursoInfo.num : '';
          const colorHex = cursoInfo ? PALETA_HEX[(cursoInfo.num - 1) % PALETA_HEX.length] : "FFFFFF";
          const cellContent = `[${numRef}] ${h.curso?.codigo || 'S/C'}\r\n(${h.aula?.codigo || h.laboratorio?.codigo || ''})`;

          writeCell(curRowIdx, colIdx, cellContent, {
            font: { bold: true, sz: 8.5 },
            fill: { fgColor: { rgb: colorHex } },
            alignment: { horizontal: "center", vertical: "center" },
            border: borderThin
          });
        } else {
          const cellRef = XLSX.utils.encode_cell({ r: curRowIdx, c: colIdx });
          if (!ws[cellRef]) {
            writeCell(curRowIdx, colIdx, "", { border: borderThin });
          }
        }
      });
    });

    for (let dIdx = 0; dIdx < dias.length; dIdx++) {
      const dia = dias[dIdx];
      const colIdx = dIdx + 1;
      let r = 0;

      while (r < bloques.length) {
        const bloque = bloques[r];
        const h = horarioEnBloque(dia, bloque.inicio, bloque.fin, horariosCiclo);

        if (h) {
          let rowSpanCount = 1;
          while (r + rowSpanCount < bloques.length) {
            const nextBloque = bloques[r + rowSpanCount];
            const nextH = horarioEnBloque(dia, nextBloque.inicio, nextBloque.fin, horariosCiclo);
            if (nextH && nextH.id === h.id) {
              rowSpanCount++;
            } else {
              break;
            }
          }

          if (rowSpanCount > 1) {
            merges.push({
              s: { r: startRowMalla + r, c: colIdx },
              e: { r: startRowMalla + r + rowSpanCount - 1, c: colIdx }
            });

            const compositeKey = `${h.curso?.codigo}-${h.docente?.id || h.docente_id}`;
            const cursoInfo = cursosUnicosMap.get(compositeKey);
            const colorHex = cursoInfo ? PALETA_HEX[(cursoInfo.num - 1) % PALETA_HEX.length] : "FFFFFF";

            for (let k = 1; k < rowSpanCount; k++) {
              writeCell(startRowMalla + r + k, colIdx, "", {
                fill: { fgColor: { rgb: colorHex } },
                border: borderThin
              });
            }
          }
          r += rowSpanCount;
        } else {
          r++;
        }
      }
    }

    ws['!merges'] = merges;
    ws['!views'] = [{ showGridLines: true }]; 
    
    ws['!cols'] = [
      { wch: 16 }, { wch: 24 }, { wch: 24 }, { wch: 24 }, { wch: 26 }, { wch: 28 }, { wch: 24 }
    ];

    const totalRowsSoportadas = startRowMalla + bloques.length;
    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: totalRowsSoportadas, c: 6 } });

    XLSX.utils.book_append_sheet(wb, ws, `Horario Ciclo ${cicloActivo}`);
    XLSX.writeFile(wb, `Horario_Oficial_Ciclo_${cicloActivo}_${semestre}.xlsx`);
  };

  const abrirModalCrearManual = async () => {
    setErrorModalCreate(null);
    setAsigSeleccionada(null);
    setCreateForm({ dia: "Lunes", hora_inicio: "", hora_fin: "", ambiente_id: "" });
    setAmbientesValidadosAPI([]);
    
    const idsConHorario = horarios.map(h => h.asignacion_id);
    const pendientes = asignaciones.filter(
      a => a.semestre_asignacion === semestre && !idsConHorario.includes(a.id)
    );

    pendientes.sort((a, b) => {
      const docA = docentes.find(d => d.id === a.docente_id) || {};
      const docB = docentes.find(d => d.id === b.docente_id) || {};

      const antA = Number(docA.antiguedad_anios || 0);
      const antB = Number(docB.antiguedad_anios || 0);
      if (antA !== antB) return antB - antA;

      const catOrder = { 'Principal': 1, 'Jefe de practica': 2, 'Asociado': 3, 'Auxiliar': 4 };
      const catA = catOrder[docA.categoria] || 5;
      const catB = catOrder[docB.categoria] || 5;
      if (catA !== catB) return catA - catB;

      return String(docA.apellidos || '').toLowerCase().localeCompare(String(docB.apellidos || '').toLowerCase());
    });

    setAsignacionesLibres(pendientes);
    setModalCreateOpen(true);
  };

  const handleGuardarHorarioManual = async () => {
    if (!asigSeleccionada || !createForm.dia || !createForm.hora_inicio || !createForm.hora_fin || !createForm.ambiente_id) {
      setErrorModalCreate("Todos los campos del formulario son requeridos.");
      return;
    }
    setGuardandoManual(true);
    setErrorModalCreate(null);
    try {
      const payload = {
        asignacion_id: asigSeleccionada.id,
        dia: createForm.dia,
        hora_inicio: createForm.hora_inicio,
        hora_fin: createForm.hora_fin,
        aula_id: asigSeleccionada.tipo === "Teoria" ? Number(createForm.ambiente_id) : null,
        laboratorio_id: asigSeleccionada.tipo === "Laboratorio" ? Number(createForm.ambiente_id) : null,
      };

      const res = await api.post("/horarios", payload);
      if (res.data?.success) {
        setModalCreateOpen(false);
        cargarDatos();
      }
    } catch (err) {
      setErrorModalCreate(err.response?.data?.message || "Error de validación al guardar.");
    } finally {
      setGuardandoManual(false);
    }
  };

  const generarBloquesMalla = () => {
    if (!config) return [];
    const inicio = config.hora_inicio || "07:00";
    const fin = config.hora_fin || "22:00";
    const duracion = 60; 
    const [hIni, mIni] = inicio.split(":").map(Number);
    const [hFin] = fin.split(":").map(Number);
    const bloquesLista = [];
    for (let i = hIni * 60 + mIni; i + duracion <= hFin * 60; i += duracion) {
      const h1 = String(Math.floor(i / 60)).padStart(2, "0");
      const m1 = String(i % 60).padStart(2, "0");
      const h2 = String(Math.floor((i + duracion) / 60)).padStart(2, "0");
      const m2 = String((i + duracion) % 60).padStart(2, "0");
      bloquesLista.push({ inicio: `${h1}:${m1}`, fin: `${h2}:${m2}`, label: `${h1}:${m1} - ${h2}:${m2}` });
    }
    return bloquesLista;
  };

  const bloques = generarBloquesMalla();

  const horariosPorCiclo = useMemo(() => {
    const map = {};
    for (const h of horarios) {
      const cicloCurso = h.curso?.ciclo;
      if (!cicloCurso) continue;
      if (!map[cicloCurso]) map[cicloCurso] = [];
      map[cicloCurso].push(h);
    }
    return map;
  }, [horarios]);

  const horarioEnBloque = (diaStr, bloquesInicio, bloqueFin, horariosDelCiclo) => {
    const blockIniMin = timeToMinutes(bloquesInicio);
    const blockFinMin = timeToMinutes(bloqueFin);
    const targetDia = String(diaStr).trim().toLowerCase();

    return horariosDelCiclo.find((h) => {
      if (String(h.dia).trim().toLowerCase() !== targetDia) return false;
      const hIniMin = timeToMinutes(h.hora_inicio);
      const hFinMin = timeToMinutes(h.hora_fin);
      return hIniMin <= blockIniMin && hFinMin >= blockFinMin;
    });
  };

  const { cursosDelDocente } = useMemo(() => {
    if (!filtroDocente) return { cursosDelDocente: [] };
    const res = asignaciones.filter((a) => a.docente_id === Number(filtroDocente) && a.semestre_asignacion === semestre);
    return { cursosDelDocente: res };
  }, [asignaciones, filtroDocente, semestre]);

  const getNombreDocente = (id) => {
    const d = docentes.find((doc) => doc.id === id);
    return d ? `${d.nombres} ${d.apellidos}` : `Docente ${id}`;
  };

  const getNombreCurso = (id) => {
    const c = cursos.find((cur) => cur.id === id);
    return c ? `${c.codigo} — ${c.nombre}` : `Curso ${id}`;
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton h-7 w-48 mb-6" />
        <div className="card p-4 mb-6">
          <div className="flex gap-4">
            <div className="skeleton h-10 w-28" />
            <div className="skeleton h-10 w-56" />
            <div className="skeleton h-10 w-32" />
          </div>
        </div>
        <div className="card overflow-hidden">
          <div className="p-12">
            <div className="skeleton h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary-600" />
            Gestión de Horarios
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Semestre: <span className="font-semibold text-primary-700">{semestre}</span>
            {getCiclosActivos.length > 0 && (
              <span className="ml-2 text-xs text-neutral-400">(Ciclos activos: {getCiclosActivos.join(", ")})</span>
            )}
          </p>
        </div>
        {mensaje && (
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium animate-slide-down ${
              mensaje.tipo === "exito"
                ? "bg-success-50 text-success-700 border border-success-200"
                : "bg-danger-50 text-danger-700 border border-danger-200"
            }`}
          >
            {mensaje.texto}
            <button onClick={() => setMensaje(null)} className="text-neutral-400 hover:text-neutral-600">
              &times;
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Semestre</label>
            <input type="text" value={semestre} onChange={(e) => setSemestre(e.target.value)} className="input w-28" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              <Users className="w-3.5 h-3.5 inline mr-1 text-neutral-400" />
              Docente
            </label>
            <select value={filtroDocente} onChange={(e) => setFiltroDocente(e.target.value)} className="input w-56">
              <option value="">Todos</option>
              {docentes.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombres} {d.apellidos}
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleGenerar} disabled={generando} className="btn-primary flex items-center gap-2">
            {generando ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Generando...</>
            ) : (
              <><Zap className="w-4 h-4" /> Generar Horarios</>
            )}
          </button>
          
          <button onClick={abrirModalCrearManual} className="btn-primary flex items-center gap-2 bg-blue-600 hover:bg-blue-700 border-none text-white">
            <Plus className="w-4 h-4" />
            Programar Horario Manual
          </button>

          <button onClick={handleLimpiar} disabled={limpiando} className="btn-secondary flex items-center gap-2 bg-danger-50 text-danger-700 border-danger-200 hover:bg-danger-100">
            {limpiando ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Limpiando...</>
            ) : (
              <><Trash2 className="w-4 h-4" /> Limpiar Todo</>
            )}
          </button>
          <button onClick={cargarDatos} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {filtroDocente && (cursosDelDocente || []).length > 0 && (
          <div className="mt-4 p-3 bg-primary-50 rounded-lg border border-primary-200">
            <p className="text-xs font-medium text-primary-700 mb-1.5">Cursos asignados a {getNombreDocente(Number(filtroDocente))}:</p>
            <div className="flex flex-wrap gap-1.5">
              {(cursosDelDocente || []).map((a) => (
                <span key={a.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs bg-white text-primary-700 border border-primary-200 font-medium">
                  <BookOpen className="w-3 h-3" />
                  {getNombreCurso(a.curso_id)} ({a.tipo})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-neutral-100 rounded-lg p-1 w-fit flex-wrap">
        {getCiclosActivos.map((c) => (
          <button
            key={c}
            onClick={() => setCicloActivo(String(c))}
            className={`flex items-center gap-2 px-4 py-1.5 text-sm rounded-md transition-all duration-150 ${
              cicloActivo === String(c)
                ? "bg-white text-primary-700 shadow-sm font-medium"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Ciclo {c}
          </button>
        ))}
      </div>

      {/* Grid view */}
      {cicloActivo && (
        <div className="card overflow-hidden mb-6">
          <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-primary-600" />
              Horario Ciclo {cicloActivo}
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-500">
                {(horariosPorCiclo[cicloActivo] || []).length} clase(s)
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={exportarPDFCiclo} 
                  className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs bg-white border border-neutral-300 shadow-sm hover:bg-neutral-50 text-neutral-700 rounded-md font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-red-600" />
                  Descargar PDF
                </button>
                <button 
                  onClick={exportarExcelCiclo} 
                  className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs bg-white border border-neutral-300 shadow-sm hover:bg-neutral-50 text-neutral-700 rounded-md font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-green-600" />
                  Descargar Excel
                </button>
              </div>
            </div>
          </div>
          {(horariosPorCiclo[cicloActivo] || []).length === 0 ? (
            <div className="p-12 text-center text-neutral-400">
              <Inbox className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
              <p className="text-sm">No hay horarios para el ciclo {cicloActivo}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse table-fixed">
                <thead>
                  <tr className="bg-neutral-50">
                    <th className="border-b border-r border-neutral-200 p-3 text-left text-xs font-semibold text-neutral-500 uppercase w-28 sticky left-0 bg-neutral-50 z-10">
                      Bloque
                    </th>
                    {dias.map((dia) => (
                      <th
                        key={dia}
                        className="border-b border-r border-neutral-200 p-2 text-center text-xs font-semibold text-neutral-500 uppercase min-w-[120px] xl:min-w-0 last:border-r-0"
                      >
                        {dia}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bloques.map((bloque, idx) => (
                    <tr key={bloque.label} className={idx % 2 === 0 ? "bg-white" : "bg-neutral-50/30"}>
                      <td className="border-b border-r border-neutral-200 p-2 text-neutral-600 text-xs font-medium sticky left-0 bg-inherit z-10 whitespace-nowrap">
                        {bloque.label}
                      </td>
                      {dias.map((dia) => {
                        const h = horarioEnBloque(dia, bloque.inicio, bloque.fin, horariosPorCiclo[cicloActivo] || []);
                        return (
                          <td
                            key={`${dia}-${bloque.label}`}
                            className="border-b border-r border-neutral-200 p-1 align-top last:border-r-0"
                          >
                            {h ? (
                              (() => {
                                const color = getColorCurso(h.curso?.codigo);
                                return (
                                  <div
                                    className="rounded-lg p-2 border-l-[3px] cursor-pointer hover:shadow-sm transition-all group"
                                    style={{
                                      backgroundColor: color.bg,
                                      borderLeftColor: color.border,
                                    }}
                                    onClick={() => abrirEdicion(h)}
                                  >
                                    <p className="text-xs font-semibold truncate" style={{ color: color.text }}>{h.curso?.codigo}</p>
                                    <p className="text-xs truncate" style={{ color: color.sub }}>{h.curso?.nombre}</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <Clock className="w-3 h-3 flex-shrink-0" style={{ color: color.sub }} />
                                      <span className="text-2xs" style={{ color: color.sub }}>
                                        {formatAMPM(h.hora_inicio)} - {formatAMPM(h.hora_fin)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <User className="w-3 h-3 flex-shrink-0" style={{ color: color.sub }} />
                                      <span className="text-2xs truncate" style={{ color: color.sub }}>
                                        {h.docente?.nombres} {h.docente?.apellidos}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: color.sub }} />
                                      <span className="text-2xs" style={{ color: color.sub }}>
                                        {h.aula?.codigo || h.laboratorio?.codigo}
                                      </span>
                                    </div>
                                    <div className="flex gap-1 mt-1">
                                      {h.editado_manualmente && (
                                        <span className="badge-warning text-2xs">
                                          <Pencil className="w-2.5 h-2.5" />
                                          Editado
                                        </span>
                                      )}
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleEliminar(h.id); }}
                                        className="text-danger-400 hover:text-danger-600 text-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
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
          )}
        </div>
      )}

      {/* Edit Modal (🌟 CONTROL EN CALIENTE SEGURO DE POSTGRESQL) */}
      {editando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in" onClick={() => setEditando(null)}>
          <div className="card p-6 w-full max-w-md shadow-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-primary-600" />
                Editar Horario
              </h2>
              <button onClick={() => setEditando(null)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Día</label>
                <select value={editForm.dia} onChange={(e) => setEditForm({ ...editForm, dia: e.target.value })} className="input">
                  {dias.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Hora inicio</label>
                  <select 
                    value={editForm.hora_inicio} 
                    onChange={(e) => handleCambioHoraInicioEdit(e.target.value)} 
                    className="input w-full font-medium"
                  >
                    <option value="" disabled>Seleccione...</option>
                    {horasDisponibles.map((h) => {
                      const conflicto = verificarConflictoEdit(h);
                      return (
                        <option key={h} value={h} disabled={!!conflicto}>
                          {formatAMPM(h)} {conflicto ? ` - (${conflicto})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5 text-neutral-400">Hora fin (Auto)</label>
                  <input 
                    type="text" 
                    value={editForm.hora_fin ? formatAMPM(editForm.hora_fin) : "Automático"} 
                    className="input w-full font-semibold bg-neutral-100 text-neutral-500 cursor-not-allowed"
                    disabled 
                  />
                </div>
              </div>

              {/* 🔒 SELECTOR INTEGRADO CON LA API ASÍNCRONA DE INFRAESTRUCTURA */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  {editando.tipo === "Teoria" || editando.tipo_asignacion === "Teoria" ? "Seleccionar Aula" : "Seleccionar Laboratorio"}
                  {cargandoAmbientes && <span className="text-3xs text-primary-600 animate-pulse ml-2">(Sincronizando...)</span>}
                </label>
                
                <select 
                  value={editando.tipo === "Teoria" || editando.tipo_asignacion === "Teoria" ? (editForm.aula_id ? String(editForm.aula_id) : "") : (editForm.laboratorio_id ? String(editForm.laboratorio_id) : "")} 
                  onChange={(e) => {
                    if (editando.tipo === "Teoria" || editando.tipo_asignacion === "Teoria") {
                      setEditForm({ ...editForm, aula_id: e.target.value, laboratorio_id: null });
                    } else {
                      setEditForm({ ...editForm, laboratorio_id: e.target.value, aula_id: null });
                    }
                  }} 
                  className="input w-full font-medium bg-white"
                  disabled={cargandoAmbientes}
                >
                  <option value="">Seleccione el ambiente físico...</option>
                  {ambientesValidadosAPI.map(amb => (
                    <option key={amb.id} value={String(amb.id)} disabled={amb.esta_ocupado}>
                      {amb.codigo} — Cap: {amb.capacidad} {amb.esta_ocupado ? "❌ (OCUPADO)" : "✅ (DISPONIBLE)"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setEditando(null)} className="btn-ghost">Cancelar</button>
                <button onClick={handleGuardarEdicion} disabled={cargandoAmbientes} className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear */}
      {modalCreateOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in" onClick={() => setModalCreateOpen(false)}>
          <div className="card p-6 w-full max-w-md shadow-modal animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Programar Horario Manual
              </h2>
              <button onClick={() => setModalCreateOpen(false)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorModalCreate && (
              <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-danger-50 text-danger-700 border border-danger-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorModalCreate}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Docente y Curso (Ordenados por Escalafón)
                </label>
                <select
                  className="input w-full font-medium"
                  onChange={(e) => {
                    const selected = asignacionesLibres.find(a => a.id === Number(e.target.value));
                    setAsigSeleccionada(selected);
                    setCreateForm({ dia: "Lunes", hora_inicio: "", hora_fin: "", ambiente_id: "" }); 
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Seleccione un curso pendiente...</option>
                  {asignacionesLibres.map((a, index) => {
                    const docente = docentes.find(d => d.id === a.docente_id);
                    return (
                      <option key={a.id} value={a.id}>
                        #{index + 1} | {docente ? `${docente.apellidos}, ${docente.nombres}` : `Docente ${a.docente_id}`} — {getNombreCurso(a.curso_id)} ({a.tipo})
                      </option>
                    );
                  })}
                </select>
              </div>

              {asigSeleccionada && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Día de la semana</label>
                    <select value={createForm.dia} onChange={(e) => setCreateForm({ ...createForm, dia: e.target.value })} className="input w-full">
                      {dias.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Hora Inicio</label>
                      <select 
                        value={createForm.hora_inicio} 
                        onChange={(e) => handleCambioHoraInicioCreate(e.target.value)} 
                        className="input w-full font-medium"
                        disabled={!asigSeleccionada}
                      >
                        <option value="">{asigSeleccionada ? "Seleccione..." : "Elija un curso primero"}</option>
                        {horasDisponibles.map((h) => {
                          const conflicto = verificarConflictoCreate(h);
                          return (
                            <option key={h} value={h} disabled={!!conflicto}>
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
                        value={createForm.hora_fin ? formatAMPM(createForm.hora_fin) : "Automático"} 
                        className="input w-full font-semibold bg-neutral-100 text-neutral-500 cursor-not-allowed"
                        disabled 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      {asigSeleccionada.tipo === "Teoria" ? "Seleccionar Aula" : "Seleccionar Laboratorio"}
                      {cargandoAmbientes && <span className="text-3xs text-primary-600 animate-pulse ml-2">(Sincronizando...)</span>}
                    </label>
                    <select 
                      value={createForm.ambiente_id ? String(createForm.ambiente_id) : ""} 
                      onChange={(e) => setCreateForm({ ...createForm, ambiente_id: e.target.value })} 
                      className="input w-full font-medium bg-white text-neutral-800"
                      disabled={cargandoAmbientes}
                    >
                      <option value="">Seleccione el ambiente físico...</option>
                      {ambientesValidadosAPI.map(amb => (
                        <option key={amb.id} value={String(amb.id)} disabled={amb.esta_ocupado}>
                          {amb.codigo} — Cap: {amb.capacidad} {amb.esta_ocupado ? "❌ (OCUPADO)" : "✅ (DISPONIBLE)"}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="flex gap-2 justify-end pt-3 border-t border-neutral-100">
                <button onClick={() => setModalCreateOpen(false)} className="btn-ghost">Cancelar</button>
                <button
                  onClick={handleGuardarHorarioManual}
                  disabled={guardandoManual || !asigSeleccionada || !createForm.hora_inicio || cargandoAmbientes}
                  className="btn-primary bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                >
                  {guardandoManual ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Procesando...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Registrar Horario</>
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

export default AdminHorarios;