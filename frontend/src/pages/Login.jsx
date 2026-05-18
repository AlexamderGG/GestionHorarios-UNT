import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { loginDocente, loginAdmin } = useAuth();
  const [tab, setTab] = useState('docente');
  const [email, setEmail] = useState('');
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'docente') {
        if (!email.trim()) { setError('Ingrese su email'); setLoading(false); return; }
        if (!password) { setError('Ingrese su contraseña'); setLoading(false); return; }
        const user = await loginDocente(email.trim(), password);
        navigate(user.role === 'admin' ? '/admin' : '/docente');
      } else {
        if (!usuario.trim()) { setError('Ingrese su usuario'); setLoading(false); return; }
        if (!password) { setError('Ingrese su contraseña'); setLoading(false); return; }
        const user = await loginAdmin(usuario.trim(), password);
        navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-600/20">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Scheduling UNT</h1>
          <p className="text-sm text-neutral-500 mt-1">Sistema de Gestión de Horarios</p>
        </div>

        <div className="card p-6 sm:p-8">
          {/* Tab Switch */}
          <div className="flex mb-6 bg-neutral-100 rounded-lg p-1">
            <button
              onClick={() => { setTab('docente'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-150 ${
                tab === 'docente' ? 'bg-white text-primary-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Docente
            </button>
            <button
              onClick={() => { setTab('admin'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-150 ${
                tab === 'admin' ? 'bg-white text-primary-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Administrativo
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-danger-50 text-danger-700 border border-danger-200 rounded-lg text-sm animate-slide-down">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'docente' ? (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-10"
                    placeholder="docente@unt.edu.pe"
                    autoComplete="email"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Usuario
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className="input pl-10"
                    placeholder="admin"
                    autoComplete="username"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-xs text-center text-neutral-400">
            {tab === 'docente'
              ? 'Contraseña genérica para todos los docentes'
              : 'Credenciales de administrador'}
          </p>
        </div>
      </div>
    </div>
  );
};

const RefreshCw = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

export default Login;
