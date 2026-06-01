import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900 transition-colors duration-300">
      <Navbar />
      <main
        className={`flex-1 ${user ? 'lg:ml-[var(--sidebar-width,240px)]' : ''} pb-20 lg:pb-0 transition-[margin] duration-200 ease-in-out`}
      >
        {/* Aquí está el cambio: de max-w-7xl a max-w-[1600px] */}
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>
      
      {/*  MODO OSCURO: Ajustes en fondo, bordes y texto del footer */}
      <footer
        className={`bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 py-4 text-center text-xs text-neutral-400 dark:text-neutral-500 ${
          user ? 'lg:ml-[var(--sidebar-width,240px)]' : ''
        } transition-[margin,background-color,border-color] duration-300 ease-in-out`}
      >
        <p>Scheduling UNT &copy; {new Date().getFullYear()} — Escuela de Ingeniería de Sistemas</p>
      </footer>
    </div>
  );
};

export default Layout;