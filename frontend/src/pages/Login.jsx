import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, User, Lock, Eye, EyeOff, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { loginDocente, loginAdmin } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Limpieza de espacios en blanco
    const userTrimmed = usuario.trim();
    if (!userTrimmed) { 
      setError('Ingrese su usuario o correo electrónico.'); 
      return; 
    }
    if (!password) { 
      setError('Ingrese su contraseña.'); 
      return; 
    }

    setLoading(true);

    try {
      // Llamada al contexto de autenticación
      let user;
      
      // Si el texto ingresado contiene un '@', asumimos que es un docente (correo)
      if (userTrimmed.includes('@')) {
        user = await loginDocente(userTrimmed, password);
      } else {
        // Si no tiene '@' (es 'admin', 'secretaria', etc.), usamos el login de administración
        user = await loginAdmin(userTrimmed, password);
      }

      // Redirección dinámica basada en los 2 roles existentes (Admin/Secretaría o Docente)
      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/docente');
      }
    } catch (err) {
      console.error("Detalle del error de login:", err);
      setError(err.response?.data?.message || 'Credenciales incorrectas o error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* Lado Izquierdo - Branding Institucional (Solo Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 relative overflow-hidden">
        {/* Patrón de fondo abstracto */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYtMmgtNHY2aDJ2Mmgydi0yem0wLThoLTJ2MmgyVjI2ek0yNCAzNGgtMnYtNGgydi0yaC00djZoMnYyaDJ2LTJ6bTAtOGgtMnYyaDJWMjZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
        
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 border border-white/20 shadow-2xl">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold mb-4 tracking-tight">Scheduling UNT</h1>
          <p className="text-primary-100 text-center text-xl mb-3 font-medium">
            Sistema de Gestión de Horarios
          </p>
          <p className="text-primary-200/80 text-center text-base max-w-md leading-relaxed">
            Universidad Nacional de Trujillo <br/> Escuela de Ingeniería de Sistemas
          </p>
          
          <div className="mt-12 grid grid-cols-3 gap-8 text-center bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div>
              <p className="text-3xl font-bold text-white">UNT</p>
              <p className="text-xs text-primary-200 uppercase tracking-wider mt-1">Universidad</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">EIS</p>
              <p className="text-xs text-primary-200 uppercase tracking-wider mt-1">Escuela</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{new Date().getFullYear()}</p>
              <p className="text-xs text-primary-200 uppercase tracking-wider mt-1">Semestre</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lado Derecho - Formulario de Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-neutral-50">
        <div className="w-full max-w-md">
          {/* Logo Mobile (Visible solo en pantallas pequeñas) */}
          <div className="lg:hidden text-center mb-10">
            <div className="w-16 h-16 bg-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-primary-700/20">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Scheduling UNT</h1>
            <p className="text-base text-neutral-500 mt-2">Sistema de Gestión de Horarios</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-neutral-200/50 border border-neutral-100 p-8 sm:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900">Iniciar Sesión</h2>
              <p className="text-sm text-neutral-500 mt-2">
                Ingrese sus credenciales institucionales para acceder al sistema.
              </p>
            </div>

            {/* Mensaje de Error */}
            {error && (
              <div className="mb-6 px-4 py-3 bg-danger-50 text-danger-700 border border-danger-200 rounded-xl text-sm flex items-center gap-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Usuario o Correo
                </label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-primary-600 transition-colors" />
                  <input
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                    placeholder="admin o correo@unt.edu.pe"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Contraseña
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-primary-600 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:bg-primary-400 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-primary-600/20 hover:shadow-lg hover:shadow-primary-600/30"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  <>
                    Ingresar al Sistema
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-neutral-100">
              <p className="text-xs text-center text-neutral-500 leading-relaxed">
                Utilice su correo institucional asignado como docente, o sus credenciales de administración.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;