import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Horarios from './pages/Horarios';
import Reportes from './pages/Reportes';
import Configuracion from './pages/Configuracion';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="horarios" element={<Horarios />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="configuracion" element={<Configuracion />} />
        {/* TODO: Agregar rutas adicionales segun modulos */}
      </Route>
    </Routes>
  );
}

export default App;
