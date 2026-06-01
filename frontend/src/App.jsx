import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import MisCursos from './pages/docente/MisCursos';
import MiHorario from './pages/docente/MiHorario';
import SeleccionarHorario from './pages/docente/SeleccionarHorario';
import Excepciones from './pages/docente/Excepciones';
import AdminHorarios from './pages/admin/AdminHorarios';
import AdminAsignaciones from './pages/admin/AdminAsignaciones';
import AdminDocentes from './pages/admin/AdminDocentes';
import EstadoDocentes from './pages/admin/EstadoDocentes';
import Dashboard from './pages/Dashboard';
import Horarios from './pages/Horarios';
import Reportes from './pages/Reportes';
import Configuracion from './pages/Configuracion';
import SecretariaPanel from './pages/admin/SecretariaPanel';
import AdminExcepciones from "./pages/admin/AdminExcepciones";
import MisDisponibilidades from './pages/docente/MisDisponibilidades';
import PlanificacionSecretaria from './pages/admin/PlanificacionSecretaria';

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/docente'} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<RootRedirect />} />

        <Route element={<ProtectedRoute allowedRoles={['docente']} />}>
          <Route path="docente" element={<MisCursos />} />
          <Route path="docente/cursos" element={<MisCursos />} />
          <Route path="docente/horario" element={<MiHorario />} />
          <Route path="docente/seleccionar" element={<SeleccionarHorario />} />
          <Route path="docente/excepciones" element={<Excepciones />} />
          <Route path="docente/disponibilidad" element={<MisDisponibilidades />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="admin" element={<Dashboard />} />
          <Route path="admin/horarios" element={<AdminHorarios />} />
          <Route path="admin/asignaciones" element={<AdminAsignaciones />} />
          <Route path="admin/docentes" element={<AdminDocentes />} />
          <Route path="admin/estado-docentes" element={<EstadoDocentes />} />
          <Route path="admin/dashboard" element={<Dashboard />} />
          <Route path="admin/horarios-general" element={<Horarios />} />
          <Route path="admin/configuracion" element={<Configuracion />} />
          <Route path="admin/reportes" element={<Reportes />} />
          <Route path="/admin/secretaria-turnos" element={<SecretariaPanel />} />
          <Route path="admin/excepciones" element={<AdminExcepciones />} />
          <Route path="admin/planificacion" element={<PlanificacionSecretaria />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
