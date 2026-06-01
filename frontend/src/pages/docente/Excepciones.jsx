import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { AlertCircle, CheckCircle, Clock, Send, HelpCircle, Inbox, FileText, Layers } from 'lucide-react';

const Excepciones = () => {
  const { user } = useAuth();
  const [misCursosPendientes, setMisCursosPendientes] = useState([]);
  const [horariosAcaparados, setHorariosAcaparados] = useState([]);
  const [misExcepciones, setMisExcepciones] = useState([]);
  const [semestre, setSemestre] = useState('2026-1');
  
  // Formulario
  const [asignacionId, setAsignacionId] = useState('');
  const [motivo, setMotivo] = useState('');
  
  // Hasta 3 opciones de prioridad solicitadas
  const [opcion1, setOpcion1] = useState('');
  const [opcion2, setOpcion2] = useState('');
  const [opcion3, setOpcion3] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cargarDatos = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const resConfig = await api.get('/configuracion');
      const semestreActivo = resConfig.data?.data?.semestre_activo || '2026-1';
      setSemestre(semestreActivo);

      const [resMisCursos, resHorarios, resMisExcepciones] = await Promise.all([
        api.get('/docente/mis-cursos', { params: { semestre: semestreActivo } }),
        api.get('/horarios', { params: { semestre: semestreActivo } }),
        api.get('/excepciones')
      ]);

      const misCursosData = resMisCursos.data?.data || [];
      const listaHorarios = resHorarios.data?.data || [];
      const listaExcepciones = resMisExcepciones.data?.data || [];
      
      setHorariosAcaparados(listaHorarios);
      setMisExcepciones(listaExcepciones);

      // Identificar cursos que no tienen horario asignado en la malla y tampoco excepciones previas
      const idsConHorario = listaHorarios.map(h => Number(h.asignacion_id));
      const idsConExcepcion = listaExcepciones.map(ex => Number(ex.asignacion_id));
      
      const pendientes = misCursosData.filter(c => {
        const idAsignacion = Number(c.asignacion_id || c.id);
        return !idsConHorario.includes(idAsignacion) && !idsConExcepcion.includes(idAsignacion);
      });
      
      setMisCursosPendientes(pendientes);
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al sincronizar tus asignaciones académicas.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // Encontrar el curso seleccionado actualmente en el combobox
  const cursoSeleccionado = useMemo(() => {
    return misCursosPendientes.find(c => Number(c.asignacion_id || c.id) === Number(asignacionId));
  }, [asignacionId, misCursosPendientes]);

  // Mapeo exacto de las horas requeridas
  const horasRequeridas = useMemo(() => {
    if (!cursoSeleccionado) return null;
    const esTeoria = cursoSeleccionado.tipo === 'Teoria' || cursoSeleccionado.tipo === 'Teoría';
    
    const h = esTeoria
      ? (cursoSeleccionado.curso_horas_aula || cursoSeleccionado.horas_aula)
      : (cursoSeleccionado.curso_horas_lab || cursoSeleccionado.horas_lab || cursoSeleccionado.horas);
                
    return h ? Number(h) : 2; 
  }, [cursoSeleccionado]);

  // Resetear prioridades al cambiar de curso
  useEffect(() => {
    setOpcion1('');
    setOpcion2('');
    setOpcion3('');
  }, [asignacionId]);

  // 🌟 FILTRADO TRIPLE ESTRICTO: Mismo Ciclo + Mismas Horas + Mismo Tipo de Ambiente
  const horariosOpcionesFiltradas = useMemo(() => {
    if (!horasRequeridas || !cursoSeleccionado) return [];

    const cicloRequerido = Number(cursoSeleccionado.ciclo || cursoSeleccionado.curso_ciclo || 0);
    const esTeoriaPendiente = cursoSeleccionado.tipo === 'Teoria' || cursoSeleccionado.tipo === 'Teoría';
    const ambienteRequerido = esTeoriaPendiente ? 'AULA' : 'LABORATORIO';

    return horariosAcaparados.filter(h => {
      // 1. Excluir si el horario pertenece al mismo profesor logueado
      if (Number(h.docente?.id || h.docente_id) === Number(user?.id)) return false;

      // 2. 🔒 CANDADO NUEVO: Exclusión por ciclo académico
      const cicloHorarioOcupado = Number(h.curso?.ciclo || h.ciclo || 0);
      if (cicloHorarioOcupado !== cicloRequerido) return false;

      // 3. Calcular duración real del bloque (Hora Fin - Hora Inicio)
      const horaIn = parseInt(h.hora_inicio?.split(':')[0] || 0);
      const horaFn = parseInt(h.hora_fin?.split(':')[0] || 0);
      const duracionBloqueHoras = horaFn - horaIn;
      if (duracionBloqueHoras !== horasRequeridas) return false;

      // 4. Detectar rigurosamente la naturaleza del ambiente físico asignado
      const tieneAula = !!(h.aula_id || h.aula);
      const tieneLab = !!(h.laboratorio_id || h.laboratorio);
      
      let ambienteOcupado = 'AULA'; 
      if (tieneLab) {
        ambienteOcupado = 'LABORATORIO';
      } else if (!tieneAula) {
        const t = h.tipo_asignacion || h.tipo || '';
        if (t === 'Laboratorio' || t === 'Practica') ambienteOcupado = 'LABORATORIO';
      }

      return ambienteOcupado === ambienteRequerido;
    });
  }, [horariosAcaparados, horasRequeridas, cursoSeleccionado, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!asignacionId || !motivo.trim()) {
      setError('Por favor, selecciona el curso afectado y detalla el motivo.');
      return;
    }

    setEnviando(true);
    try {
      const idsSolicitados = [opcion1, opcion2, opcion3]
        .filter(op => op !== '')
        .map(op => Number(op));

      const payload = {
        asignacion_id: Number(asignacionId),
        motivo: motivo.trim(),
        horarios_solicitados_ids: idsSolicitados
      };

      await api.post('/excepciones', payload);
      setSuccess('Tu solicitud de excepción con validación de ciclo, ambiente y horas fue enviada correctamente.');
      
      setAsignacionId('');
      setMotivo('');
      await cargarDatos();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar el envío.');
    } finally {
      setEnviando(false);
    }
  };

  const getBadgeEstado = (estado) => {
    switch (estado) {
      case 'Aprobado': return 'badge bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-400 border-success-200 dark:border-success-800/50';
      case 'Rechazado': return 'badge bg-danger-50 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400 border-danger-200 dark:border-danger-800/50';
      default: return 'badge bg-warning-50 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400 border-warning-200 dark:border-warning-800/50';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-5xl animate-pulse">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-1/4 mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded" />
          <div className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-5xl p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-amber-600 dark:text-amber-500" />
          Excepciones de Horario
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Las permutas propuestas se filtran automáticamente garantizando coincidencia estricta de <strong className="dark:text-neutral-300">Ciclo</strong>, <strong className="dark:text-neutral-300">Horas Académicas</strong> y <strong className="dark:text-neutral-300">Ambiente (Aula / Lab)</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="card p-5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm h-fit">
          <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-primary-500 dark:text-primary-400" /> Nueva Solicitud
          </h2>

          {error && <div className="mb-4 px-3 py-2 bg-danger-50 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400 border border-danger-200 dark:border-danger-800/50 rounded-lg text-xs">{error}</div>}
          {success && <div className="mb-4 px-3 py-2 bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-400 border border-success-200 dark:border-success-800/50 rounded-lg text-xs">{success}</div>}

          {misCursosPendientes.length === 0 ? (
            <div className="text-center py-6 text-neutral-400 dark:text-neutral-500 text-xs">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success-400 dark:text-success-500" />
              Todos tus cursos ya cuentan con un horario asignado o una solicitud registrada.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Curso sin Horario</label>
                <select value={asignacionId} onChange={(e) => setAsignacionId(e.target.value)} className="input text-xs w-full border border-neutral-300 dark:border-neutral-700 rounded p-2 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white">
                  <option value="">Selecciona la asignatura...</option>
                  {misCursosPendientes.map(c => {
                    const esTeoria = c.tipo === 'Teoria' || c.tipo === 'Teoría';
                    const hC = esTeoria ? (c.curso_horas_aula || c.horas_aula || 2) : (c.curso_horas_lab || c.horas_lab || 2);
                    return (
                      <option key={c.asignacion_id || c.id} value={c.asignacion_id || c.id}>
                        Ciclo {c.ciclo || c.curso_ciclo} | {c.curso_codigo || c.codigo} — {c.curso_nombre || c.nombre} ({c.tipo}) — {hC}h
                      </option>
                    );
                  })}
                </select>
                {horasRequeridas && (
                  <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg text-2xs text-amber-800 dark:text-amber-400 flex items-center gap-1.5 font-medium">
                    <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                    Requisito: Ciclo {cursoSeleccionado.ciclo || cursoSeleccionado.curso_ciclo} · {horasRequeridas}h en {cursoSeleccionado.tipo === 'Teoria' || cursoSeleccionado.tipo === 'Teoría' ? 'AULA' : 'LABORATORIO'}
                  </div>
                )}
              </div>

              {asignacionId && (
                <div className="space-y-3 bg-neutral-50 dark:bg-neutral-900/50 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <label className="block font-bold text-neutral-800 dark:text-neutral-200 text-xs uppercase tracking-wide">Propuestas de Permuta (Mismo Ciclo, Tamaño y Ambiente)</label>
                  
                  <div>
                    <span className="text-2xs font-medium text-neutral-500 dark:text-neutral-400 block mb-1">Opción Prioridad 1</span>
                    <select value={opcion1} onChange={(e) => setOpcion1(e.target.value)} className="input text-3xs w-full border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 p-1.5 text-neutral-800 dark:text-white">
                      <option value="">Dejar Opción 1 a criterio de Secretaría</option>
                      {horariosOpcionesFiltradas.map(h => {
                        const hIn = parseInt(h.hora_inicio?.slice(0,2));
                        const hFn = parseInt(h.hora_fin?.slice(0,2));
                        const amb = h.aula?.codigo || h.laboratorio?.codigo || 'Asignado';
                        return (
                          <option key={h.id} value={h.id}>
                            {h.dia} {h.hora_inicio?.slice(0,5)} ({h.docente?.apellidos || 'Docente'}) [{amb}] — ({hFn - hIn}h)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <span className="text-2xs font-medium text-neutral-500 dark:text-neutral-400 block mb-1">Opción Prioridad 2 (Opcional)</span>
                    <select value={opcion2} disabled={!opcion1} onChange={(e) => setOpcion2(e.target.value)} className="input text-3xs w-full border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 p-1.5 text-neutral-800 dark:text-white disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed">
                      <option value="">Ninguno</option>
                      {horariosOpcionesFiltradas.filter(h => h.id !== Number(opcion1)).map(h => {
                        const hIn = parseInt(h.hora_inicio?.slice(0,2));
                        const hFn = parseInt(h.hora_fin?.slice(0,2));
                        const amb = h.aula?.codigo || h.laboratorio?.codigo || 'Asignado';
                        return (
                          <option key={h.id} value={h.id}>
                            {h.dia} {h.hora_inicio?.slice(0,5)} ({h.docente?.apellidos}) [{amb}] — ({hFn - hIn}h)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <span className="text-2xs font-medium text-neutral-500 dark:text-neutral-400 block mb-1">Opción Prioridad 3 (Opcional)</span>
                    <select value={opcion3} disabled={!opcion2} onChange={(e) => setOpcion3(e.target.value)} className="input text-3xs w-full border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 p-1.5 text-neutral-800 dark:text-white disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed">
                      <option value="">Ninguno</option>
                      {horariosOpcionesFiltradas.filter(h => h.id !== Number(opcion1) && h.id !== Number(opcion2)).map(h => {
                        const hIn = parseInt(h.hora_inicio?.slice(0,2));
                        const hFn = parseInt(h.hora_fin?.slice(0,2));
                        const amb = h.aula?.codigo || h.laboratorio?.codigo || 'Asignado';
                        return (
                          <option key={h.id} value={h.id}>
                            {h.dia} {h.hora_inicio?.slice(0,5)} ({h.docente?.apellidos}) [{amb}] — ({hFn - hIn}h)
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Justificación del Conflicto</label>
                <textarea
                  rows="3"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Detalla tu cruce horario externo..."
                  className="input text-xs w-full resize-none border border-neutral-300 dark:border-neutral-700 rounded p-2 text-neutral-800 dark:text-white bg-white dark:bg-neutral-900"
                />
              </div>

              <button type="submit" disabled={enviando || !asignacionId} className="btn-primary w-full flex items-center justify-center gap-1.5 py-2 text-xs bg-amber-600 hover:bg-amber-700 border-none text-white rounded font-medium disabled:bg-neutral-300 dark:disabled:bg-neutral-700 transition-colors">
                <Send className="w-3.5 h-3.5" />
                {enviando ? "Procesando..." : "Enviar Solicitud"}
              </button>
            </form>
          )}
        </div>

        {/* Historial */}
        <div className="lg:col-span-2 card p-5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm">
          <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-500" /> Historial de Excepciones
          </h2>

          {misExcepciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-400 dark:text-neutral-500 border border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl">
              <Inbox className="w-10 h-10 mb-2 text-neutral-300 dark:text-neutral-600" />
              <p className="text-sm">No has registrado excepciones para el semestre {semestre}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-900/50 text-neutral-500 dark:text-neutral-400 font-semibold border-b border-neutral-200 dark:border-neutral-700">
                    <th className="p-3">Asignatura</th>
                    <th className="p-3">Justificación</th>
                    <th className="p-3">Bloques Propuestos</th>
                    <th className="p-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                  {misExcepciones.map((ex) => (
                    <tr key={ex.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-700/30 transition-colors">
                      <td className="p-3 font-medium text-neutral-800 dark:text-neutral-200">
                        Ciclo {ex.ciclo || ex.curso_ciclo} | {ex.curso_codigo} <br />
                        <span className="text-neutral-400 dark:text-neutral-500 font-normal">{ex.curso_nombre} ({ex.tipo})</span>
                      </td>
                      <td className="p-3 text-neutral-600 dark:text-neutral-400 italic max-w-xs truncate" title={ex.motivo}>
                        &quot;{ex.motivo}&quot;
                      </td>
                      <td className="p-3 text-neutral-600 dark:text-neutral-300">
                        {ex.horarios_solicitados && ex.horarios_solicitados.length > 0 ? (
                          <div className="space-y-1">
                            {ex.horarios_solicitados.map((hor, idx) => (
                              <div key={hor.id} className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 px-1.5 py-1 rounded text-3xs font-medium text-neutral-700 dark:text-neutral-300">
                                <span className="font-bold text-amber-700 dark:text-amber-500">Opc {idx + 1}:</span> {hor.dia} {hor.hora_inicio?.slice(0,5)} ({hor.docente_apellidos})
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-neutral-400 dark:text-neutral-500 italic text-2xs">Evaluación libre de Jefatura</span>
                        )}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <span className={`${getBadgeEstado(ex.estado)} text-2xs px-2.5 py-0.5 border rounded-full font-semibold`}>
                          {ex.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Excepciones;