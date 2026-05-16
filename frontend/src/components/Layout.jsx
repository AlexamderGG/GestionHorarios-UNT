import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="bg-neutral-100 border-t border-neutral-200 py-4 text-center text-sm text-neutral-500">
        <p>Scheduling UNT &copy; {new Date().getFullYear()} - Escuela de Ingeniería de Sistemas</p>
      </footer>
    </div>
  );
};

export default Layout;
