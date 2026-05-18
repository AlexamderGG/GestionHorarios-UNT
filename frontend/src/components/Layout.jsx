import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main
        className={`flex-1 ${user ? 'lg:ml-[var(--sidebar-width,240px)]' : ''} pb-20 lg:pb-0 transition-[margin] duration-200 ease-in-out`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>
      <footer
        className={`bg-white border-t border-neutral-100 py-4 text-center text-xs text-neutral-400 ${
          user ? 'lg:ml-[var(--sidebar-width,240px)]' : ''
        } transition-[margin] duration-200 ease-in-out`}
      >
        <p>Scheduling UNT &copy; {new Date().getFullYear()} — Escuela de Ingeniería de Sistemas</p>
      </footer>
    </div>
  );
};

export default Layout;
