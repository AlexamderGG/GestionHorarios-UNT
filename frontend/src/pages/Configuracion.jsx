import React, { useState, useEffect } from 'react';
import { Settings, Clock, Calendar, Save, CheckCircle, RefreshCw, Lock, Key, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const DIAS_OPCIONES = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

const Configuracion = () => {
  const { user } = useAuth(); // Obtenemos el usuario actual para validar su rol
  
  // --- ESTADOS DE CONFIGURACIÓN GENERAL ---
  const [config, setConfig] = useState({
    dias_habiles: ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'],
    hora_inicio: '07:00',
    hora_fin: '22:00',
    duracion_bloque: 120,
    semestre_activo: '2026-1',
    docentes_pueden_asignar: false // 🌟 NUEVO ESTADO INICIAL
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // --- ESTADOS DE CAMBIO DE CONTRASEÑA ---
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '' });
  const [showPass, setShowPass] = useState({ current: false, new: false });
  const [passStatus, setPassStatus] = useState({ loading: false, error: null, success: false });

  useEffect(() => {
    api.get('/configuracion')
      .then((res) => {
        if (res.data?.data) {
          const data = res.data.data;
          setConfig((prev) => ({
            ...prev,
            ...data,
            //  ASEGURAMOS QUE EL BOOLEANO LLEGUE CORRECTAMENTE
            docentes_pueden_asignar: String(data.docentes_pueden_asignar).toLowerCase() === 'true', 
            dias_habiles: Array.isArray(data.dias_habiles)
              ? data.dias_habiles
              : typeof data.dias_habiles === 'string'
                ? data.dias_habiles.split(',').filter(Boolean)
                : prev.dias_habiles,
          }));
        }
      })
      .catch((err) => {
        console.error('Error cargando configuracion:', err);
        setError('No se pudo cargar la configuración');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setConfig((prev) => ({ ...prev, [name]: checked }));
    } else if (name === 'duracion_bloque') {
      setConfig((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setConfig((prev) => ({ ...prev, [name]: value }));
    }
  };

  const toggleDia = (dia) => {
    setConfig((prev) => {
      const existe = prev.dias_habiles.includes(dia);
      const nuevos = existe
        ? prev.dias_habiles.filter((d) => d !== dia)
        : [...prev.dias_habiles, dia];
      return { ...prev, dias_habiles: nuevos };
    });
  };

  const handleSubmitConfig = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const payload = {
        configuracion: {
          dias_habiles: config.dias_habiles.join(','),
          hora_inicio: config.hora_inicio,
          hora_fin: config.hora_fin,
          duracion_bloque: String(config.duracion_bloque),
          semestre_activo: config.semestre_activo,
          docentes_pueden_asignar: config.docentes_pueden_asignar // 🌟 ENVIAMOS LA BANDERA
        },
      };
      const res = await api.put('/configuracion', payload);
      if (res.data?.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        if (res.data?.data) {
          const data = res.data.data;
          setConfig((prev) => ({
            ...prev,
            ...data,
            docentes_pueden_asignar: String(data.docentes_pueden_asignar).toLowerCase() === 'true',
            dias_habiles: Array.isArray(data.dias_habiles)
              ? data.dias_habiles
              : typeof data.dias_habiles === 'string'
                ? data.dias_habiles.split(',').filter(Boolean)
                : prev.dias_habiles,
          }));
        }
      } else {
        setError(res.data?.message || 'Error al guardar');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error de conexión al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassStatus({ loading: true, error: null, success: false });
    
    try {
      await api.put('/auth/admin/password', passForm);
      setPassStatus({ loading: false, error: null, success: true });
      setPassForm({ currentPassword: '', newPassword: '' }); 
      setTimeout(() => setPassStatus(prev => ({ ...prev, success: false })), 4000);
    } catch (err) {
      setPassStatus({
        loading: false,
        error: err.response?.data?.message || 'Error al cambiar la contraseña.',
        success: false
      });
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in max-w-2xl">
        <div className="skeleton h-7 w-56 mb-6" />
        <div className="card p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i}>
              <div className="skeleton h-4 w-24 mb-2" />
              <div className="skeleton h-10 w-full" />
            </div>
          ))}
          <div className="skeleton h-10 w-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary-600" />
          Configuración del Sistema
        </h1>
        <p className="text-sm text-neutral-500 mt-1">Ajustes generales de horarios, bloques y semestre activo</p>
      </div>

      {/* TARJETA 1: CONFIGURACIÓN GENERAL */}
      <form onSubmit={handleSubmitConfig} className="card p-6 space-y-5 mb-8">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            <Calendar className="w-3.5 h-3.5 inline mr-1.5 text-neutral-400" />
            Semestre Activo
          </label>
          <input
            type="text"
            name="semestre_activo"
            value={config.semestre_activo}
            onChange={handleChange}
            className="input w-full sm:w-48"
            placeholder="2026-1"
            pattern="^\d{4}-[12]$"
            required
          />
          <p className="text-xs text-neutral-500 mt-1.5">
            Formato: AAAA-1 (impar) o AAAA-2 (par). Determina qué ciclos están activos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              <Clock className="w-3.5 h-3.5 inline mr-1.5 text-neutral-400" />
              Hora de Inicio
            </label>
            <input
              type="time"
              name="hora_inicio"
              value={config.hora_inicio}
              onChange={handleChange}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              <Clock className="w-3.5 h-3.5 inline mr-1.5 text-neutral-400" />
              Hora de Fin
            </label>
            <input
              type="time"
              name="hora_fin"
              value={config.hora_fin}
              onChange={handleChange}
              className="input w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Duración del Bloque (minutos)
          </label>
          <input
            type="number"
            name="duracion_bloque"
            value={config.duracion_bloque}
            onChange={handleChange}
            className="input w-full sm:w-48"
            min={30}
            step={30}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            <Calendar className="w-3.5 h-3.5 inline mr-1.5 text-neutral-400" />
            Días Hábiles
          </label>
          <div className="flex flex-wrap gap-2">
            {DIAS_OPCIONES.map((dia) => {
              const activo = config.dias_habiles.includes(dia);
              return (
                <button
                  key={dia}
                  type="button"
                  onClick={() => toggleDia(dia)}
                  className={`px-3 py-1.5 rounded-lg text-sm border font-medium transition-colors ${
                    activo
                      ? 'bg-primary-50 text-primary-700 border-primary-200'
                      : 'bg-neutral-50 text-neutral-400 border-neutral-200'
                  }`}
                >
                  {dia}
                </button>
              );
            })}
          </div>
        </div>

        {/* 🌟 INTERRUPTOR DE MODO TURNOS CORREGIDO Y MOVIDO DENTRO DEL FORMULARIO 🌟 */}
        <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border border-indigo-100 mt-4">
          <div>
            <h4 className="font-bold text-indigo-900">Modo de Planificación por Turnos</h4>
            <p className="text-xs text-indigo-700 mt-1 max-w-sm">
              Actívelo si los docentes se van a auto-asignar horarios (Fase de Turnos). 
              Apáguelo si están en Fase de Disponibilidad (la Secretaría asigna).
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              name="docentes_pueden_asignar"
              className="sr-only peer"
              checked={config.docentes_pueden_asignar}
              onChange={handleChange}
            />
            <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        {error && (
          <div className="text-sm text-danger-600 bg-danger-50 border border-danger-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="pt-4 border-t border-neutral-100 flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Guardando...</> : <><Save className="w-4 h-4" /> Guardar Configuración</>}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-success-600 animate-slide-down">
              <CheckCircle className="w-4 h-4" /> Guardado
            </span>
          )}
        </div>
      </form>

      {/* TARJETA 2: SEGURIDAD (Solo visible para el administrador) */}
      {user?.role === 'admin' && (
        <form onSubmit={handlePasswordSubmit} className="card p-6 space-y-5">
          <div className="mb-2 border-b border-neutral-100 pb-4">
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary-600" />
              Seguridad y Acceso
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Actualice la contraseña maestra de la secretaría / administración.
            </p>
          </div>

          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Contraseña Actual</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type={showPass.current ? 'text' : 'password'}
                  value={passForm.currentPassword}
                  onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                  className="input w-full pl-10 pr-10"
                  placeholder="Ingrese su contraseña actual"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass({ ...showPass, current: !showPass.current })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPass.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Nueva Contraseña</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type={showPass.new ? 'text' : 'password'}
                  value={passForm.newPassword}
                  onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                  className="input w-full pl-10 pr-10"
                  placeholder="Mínimo 12 caracteres"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass({ ...showPass, new: !showPass.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPass.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <ul className="text-xs text-neutral-500 mt-2 space-y-1 ml-1 list-disc list-inside">
                <li className={passForm.newPassword.length >= 12 ? 'text-success-600' : ''}>Mínimo 12 caracteres</li>
                <li className={/[A-Z]/.test(passForm.newPassword) ? 'text-success-600' : ''}>Al menos una letra mayúscula</li>
                <li className={/[a-z]/.test(passForm.newPassword) ? 'text-success-600' : ''}>Al menos una letra minúscula</li>
                <li className={/\d/.test(passForm.newPassword) ? 'text-success-600' : ''}>Al menos un número</li>
              </ul>
            </div>
          </div>

          {passStatus.error && (
            <div className="text-sm text-danger-600 bg-danger-50 border border-danger-200 rounded-lg px-4 py-2.5 flex items-center gap-2 max-w-md">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {passStatus.error}
            </div>
          )}

          <div className="pt-2 flex items-center gap-3">
            <button type="submit" disabled={passStatus.loading} className="btn-primary flex items-center gap-2">
              {passStatus.loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Actualizando...</> : <><Save className="w-4 h-4" /> Actualizar Contraseña</>}
            </button>
            {passStatus.success && (
              <span className="flex items-center gap-1.5 text-sm text-success-600 animate-slide-down">
                <CheckCircle className="w-4 h-4" /> Contraseña actualizada
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default Configuracion;