import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import ThemeToggle from "./ThemeToggle";
import AsistenteVoz from "./AsistenteVoz";
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
  ListOrdered,
  HelpCircle,
  FileClock,
  ClipboardList,
  Book,
  Building,
} from "lucide-react";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      sidebarCollapsed ? "68px" : "240px",
    );
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
    } catch {}
  }, [sidebarCollapsed]);

  const [config, setConfig] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get("/configuracion");
        setConfig({
          ...res.data.data,
          docentes_pueden_asignar:
            String(res.data.data.docentes_pueden_asignar).toLowerCase() ===
            "true",
        });
      } catch (error) {
        console.error("Error cargando config en sidebar:", error);
      }
    };
    fetchConfig();
  }, []);

  const docenteLinks = [
    { to: "/docente/cursos", label: "Mis Cursos", icon: BookOpen },
    { to: "/docente/horario", label: "Mi Horario", icon: Calendar },
    {
      to: "/docente/horario-no-lectivo",
      label: "Horario No Lectivo",
      icon: ClipboardList,
    },
    { to: "/docente/disponibilidad", label: "Disponibilidad", icon: Clock },
    config?.docentes_pueden_asignar
      ? { to: "/docente/seleccionar", label: "Seleccionar", icon: PlayCircle }
      : null,
    { to: "/docente/excepciones", label: "Excepciones/ Permuta", icon: Lock },
    {
      to: "/docente/carga-horaria",
      label: "Declaración Académica",
      icon: FileClock,
    },
  ].filter(Boolean);

  const adminLinks = [
    { to: "/admin/horarios", label: "Horarios", icon: Calendar },
    { to: "/admin/asignaciones", label: "Asignaciones", icon: Link2 },
    {
      to: "/admin/planificacion",
      label: "Planificación Intel.",
      icon: BookOpen,
    },
    { to: "/admin/plan-estudios", label: "Plan de Estudios", icon: Book },
    { to: "/admin/docentes", label: "Docentes", icon: Users },
    { to: "/admin/ambientes", label: "Ambientes", icon: Building },
    { to: "/admin/estado-docentes", label: "Estado Doc.", icon: BarChart3 },
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/configuracion", label: "Configuración", icon: Settings },
    { to: "/admin/reportes", label: "Reportes", icon: FileText },
    {
      to: "/admin/secretaria-turnos",
      label: "Gestión de Turnos",
      icon: ListOrdered,
    },
    {
      to: "/admin/excepciones",
      label: "Excepciones/ Permuta",
      icon: HelpCircle,
    },
  ];

  const links =
    user?.role === "admin"
      ? adminLinks
      : user?.role === "docente"
        ? docenteLinks
        : [];
  const isActive = (to) => location.pathname === to;

  return (
    <>
      {/* Desktop Sidebar */}
      {/*  MODO OSCURO: bg-white -> dark:bg-neutral-900, border-neutral-200 -> dark:border-neutral-800 */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transition-[width,background-color] duration-300 ease-in-out ${
          sidebarCollapsed ? "w-[68px]" : "w-60"
        }`}
      >
        {/* Logo */}
        {/*  MODO OSCURO: border-neutral-100 -> dark:border-neutral-800 */}
        <div className="flex items-center h-16 px-4 border-b border-neutral-100 dark:border-neutral-800 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                {/*  MODO OSCURO: text-neutral-900 -> dark:text-white */}
                <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate transition-colors">
                  Scheduling
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate transition-colors">
                  UNT
                </p>
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
                //  MODO OSCURO: Se ajustaron los colores del hover y del botón activo
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 group ${
                  active
                    ? "bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    active
                      ? "text-primary-600 dark:text-primary-400"
                      : "text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300"
                  }`}
                />
                {!sidebarCollapsed && (
                  <span className="truncate">{link.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User + Collapse */}
        {/*  MODO OSCURO: border-neutral-100 -> dark:border-neutral-800 */}
        <div className="border-t border-neutral-100 dark:border-neutral-800 p-3 space-y-2 transition-colors">
          {!sidebarCollapsed && user && (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="min-w-0">
                {/*  MODO OSCURO: text-neutral-900 -> dark:text-white */}
                <p className="text-sm font-medium text-neutral-900 dark:text-white truncate transition-colors">
                  {user.role === "admin" ? "Administrador" : user.nombre}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize transition-colors">
                  {user.role}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            {/*  AQUÍ SE AGREGÓ EL BOTÓN DEL MODO OSCURO (ESCRITORIO) */}
            <ThemeToggle />

            {user && (
              <button
                onClick={logout}
                title="Cerrar sesión"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-500 dark:text-neutral-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-500/10 transition-colors duration-150 ${
                  sidebarCollapsed ? "flex-1 justify-center" : "flex-1"
                }`}
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                {!sidebarCollapsed && <span>Cerrar sesión</span>}
              </button>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-150"
              title={sidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
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
      {/*  MODO OSCURO: bg-white/95 -> dark:bg-neutral-900/95 */}
      <nav className="lg:hidden sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-800 transition-colors duration-300">
        <div className="flex items-center justify-between h-14 px-4">
          <Link
            to={user ? (user.role === "admin" ? "/admin" : "/docente") : "/"}
            className="flex items-center gap-2.5"
          >
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            {/*  MODO OSCURO: text-neutral-900 -> dark:text-white */}
            <span className="font-semibold text-neutral-900 dark:text-white text-sm transition-colors">
              Scheduling UNT
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {user && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:block transition-colors">
                {user.role === "admin" ? "Admin" : user.nombre}
              </span>
            )}

            {/*  AQUÍ SE AGREGÓ EL BOTÓN DEL MODO OSCURO (MÓVIL) */}
            <ThemeToggle />

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileOpen && (
          //  MODO OSCURO: bg-white -> dark:bg-neutral-900
          <div className="border-t border-neutral-100 dark:border-neutral-800 py-2 px-3 animate-slide-down bg-white dark:bg-neutral-900 transition-colors duration-300">
            {links.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    active
                      ? "bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 font-medium"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${active ? "text-primary-600 dark:text-primary-400" : "text-neutral-400 dark:text-neutral-500"}`}
                  />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            {user && (
              <button
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-500/10 mt-1 transition-colors"
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
        //  MODO OSCURO: bg-white/95 -> dark:bg-neutral-900/95
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border-t border-neutral-200 dark:border-neutral-800 transition-colors duration-300">
          <div className="flex items-center justify-around h-16 px-2">
            {links.slice(0, 5).map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    active
                      ? "text-primary-600 dark:text-primary-400"
                      : "text-neutral-500 dark:text-neutral-400"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${active ? "text-primary-600 dark:text-primary-400" : "text-neutral-400 dark:text-neutral-500"}`}
                  />
                  <span className="font-medium">{link.label}</span>
                  {active && (
                    <div className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-600 dark:bg-primary-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
      <AsistenteVoz />
    </>
  );
};

export default Navbar;
