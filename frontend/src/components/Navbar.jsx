import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const docenteLinks = [
    { to: '/docente/cursos', label: 'Mis Cursos' },
    { to: '/docente/horario', label: 'Mi Horario' },
    { to: '/docente/seleccionar', label: 'Seleccionar' },
    { to: '/docente/restricciones', label: 'Restricciones' },
  ];

  const adminLinks = [
    { to: '/admin/horarios', label: 'Horarios' },
    { to: '/admin/docentes', label: 'Docentes' },
    { to: '/admin/demo', label: 'Demo' },
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/configuracion', label: 'Configuración' },
    { to: '/admin/reportes', label: 'Reportes' },
  ];

  const links = user?.role === 'admin' ? adminLinks : user?.role === 'docente' ? docenteLinks : [];

  const isActive = (to) => location.pathname === to;

  return (
    <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link to={user ? (user.role === 'admin' ? '/admin' : '/docente') : '/'} className="font-bold text-primary-700 text-lg">
            Scheduling UNT
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 text-sm rounded-md transition ${
                  isActive(link.to)
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="text-xs text-neutral-500">
                  {user.role === 'admin' ? 'Admin' : user.nombre}
                </span>
                <button
                  onClick={logout}
                  className="text-sm text-neutral-500 hover:text-red-600 transition"
                >
                  Salir
                </button>
              </>
            ) : (
              <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Iniciar Sesión
              </Link>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-neutral-600"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-3 border-t border-neutral-100 mt-1 pt-2">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 text-sm rounded-md ${
                  isActive(link.to) ? 'bg-primary-50 text-primary-700' : 'text-neutral-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="block w-full text-left px-3 py-2 text-sm text-red-600 mt-1"
              >
                Cerrar Sesión
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
