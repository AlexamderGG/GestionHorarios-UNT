import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { loginDocente, loginAdmin } = useAuth();
  const [tab, setTab] = useState('docente');
  const [email, setEmail] = useState('');
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg border border-neutral-200 p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-neutral-900">Scheduling UNT</h1>
            <p className="text-sm text-neutral-500 mt-1">Sistema de Selección de Horarios</p>
          </div>

          <div className="flex mb-6 bg-neutral-100 rounded-lg p-1">
            <button
              onClick={() => { setTab('docente'); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                tab === 'docente' ? 'bg-white text-primary-700 shadow-sm' : 'text-neutral-500'
              }`}
            >
              Docente
            </button>
            <button
              onClick={() => { setTab('admin'); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                tab === 'admin' ? 'bg-white text-primary-700 shadow-sm' : 'text-neutral-500'
              }`}
            >
              Administrativo
            </button>
          </div>

          {error && (
            <div className="mb-4 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'docente' ? (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="docente@unt.edu.pe"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Usuario</label>
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="admin"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition font-medium"
            >
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <p className="mt-4 text-xs text-center text-neutral-400">
            {tab === 'docente'
              ? 'Contraseña genérica para todos los docentes'
              : 'Credenciales de administrador'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
