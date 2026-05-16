import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="max-w-4xl mx-auto text-center py-16">
      <h1 className="text-4xl font-extrabold text-neutral-900 mb-4">
        Sistema de Gestión de Horarios
      </h1>
      <p className="text-lg text-neutral-600 mb-8">
        Escuela de Ingeniería de Sistemas - Universidad Nacional de Trujillo
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        <div className="bg-white p-6 rounded-lg shadow border border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-800 mb-2">Automatización Inteligente</h2>
          <p className="text-neutral-600">
            Generación automática de horarios respetando jerarquía docente, disponibilidad de aulas y laboratorios.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-800 mb-2">Dashboard y Reportes</h2>
          <p className="text-neutral-600">
            Visualización de estadísticas, gráficos de carga horaria y generación de reportes en PDF.
          </p>
        </div>
      </div>
      <div className="mt-10">
        <Link
          to="/dashboard"
          className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          Ir al Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Home;
