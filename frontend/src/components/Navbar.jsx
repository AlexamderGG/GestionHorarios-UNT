import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  BookOpen,
  Clock,
  Lock,
  LogOut,
  Menu,
  X,
  GraduationCap,
  PanelLeftClose,
  PanelLeft,
  PlayCircle,
  User,
  Link2,
  BarChart3,
} from 'lucide-react';

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      sidebarCollapsed ? '68px' : '240px'
    );
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
    } catch {}
  }, [sidebarCollapsed]);

  const docenteLinks = [
    { to: '/docente/cursos', label: 'Mis Cursos', icon: BookOpen },
    { to: '/docente/horario', label: 'Mi Horario', icon: Calendar },
    { to: '/docente/seleccionar', label: 'Seleccionar', icon: Clock },
    { to: '/docente/restricciones', label: 'Restricciones', icon: Lock },
  ];

  const adminLinks = [
    { to: '/admin/horarios', label: 'Horarios', icon: Calendar },
    { to: '/admin/asignaciones', label: 'Asignaciones', icon: Link2 },
    { to: '/admin/docentes', label: 'Docentes', icon: Users },
    { to: '/admin/estado-docentes', label: 'Estado Doc.', icon: BarChart3 },
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/configuracion', label: 'Configuración', icon: Settings },
    { to: '/admin/reportes', label: 'Reportes', icon: FileText },
    { to: '/admin/demo', label: 'Demo', icon: PlayCircle },
  ];

  const links = user?.role === 'admin' ? adminLinks : user?.role === 'docente' ? docenteLinks : [];
  const isActive = (to) => location.pathname === to;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 bg-white border-r border-neutral-200 transition-[width] duration-200 ease-in-out ${
          sidebarCollapsed ? 'w-[68px]' : 'w-60'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-neutral-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-900 truncate">Scheduling</p>
                <p className="text-xs text-neutral-500 truncate">UNT</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                title={sidebarCollapsed ? link.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 group ${
                  active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    active ? 'text-primary-600' : 'text-neutral-400 group-hover:text-neutral-600'
                  }`}
                />
                {!sidebarCollapsed && <span className="truncate">{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User + Collapse */}
        <div className="border-t border-neutral-100 p-3 space-y-2">
          {!sidebarCollapsed && user && (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-primary-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {user.role === 'admin' ? 'Administrador' : user.nombre}
                </p>
                <p className="text-xs text-neutral-500 capitalize">{user.role}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            {user && (
              <button
                onClick={logout}
                title="Cerrar sesión"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-500 hover:text-danger-600 hover:bg-danger-50 transition-colors duration-150 ${
                  sidebarCollapsed ? 'flex-1 justify-center' : 'flex-1'
                }`}
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                {!sidebarCollapsed && <span>Cerrar sesión</span>}
              </button>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors duration-150"
              title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <nav className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-neutral-200">
        <div className="flex items-center justify-between h-14 px-4">
          <Link
            to={user ? (user.role === 'admin' ? '/admin' : '/docente') : '/'}
            className="flex items-center gap-2.5"
          >
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-neutral-900 text-sm">Scheduling UNT</span>
          </Link>

          <div className="flex items-center gap-2">
            {user && (
              <span className="text-xs text-neutral-500 hidden sm:block">
                {user.role === 'admin' ? 'Admin' : user.nombre}
              </span>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
              aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileOpen && (
          <div className="border-t border-neutral-100 py-2 px-3 animate-slide-down bg-white">
            {links.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                    active
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-neutral-400'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            {user && (
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-danger-600 hover:bg-danger-50 mt-1 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Cerrar Sesión</span>
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Mobile Bottom Navigation (max 5 items) */}
      {user && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-neutral-200">
          <div className="flex items-center justify-around h-16 px-2">
            {links.slice(0, 5).map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    active ? 'text-primary-600' : 'text-neutral-500'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-neutral-400'}`} />
                  <span className="font-medium">{link.label}</span>
                  {active && (
                    <div className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
