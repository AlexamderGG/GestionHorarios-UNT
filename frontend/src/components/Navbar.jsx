import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Inicio' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/horarios', label: 'Horarios' },
    { path: '/reportes', label: 'Reportes' },
    { path: '/configuracion', label: 'Configuración' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-primary-700 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight">Scheduling UNT</span>
          </div>
          <div className="flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary-900 text-white'
                    : 'text-primary-100 hover:bg-primary-600 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
