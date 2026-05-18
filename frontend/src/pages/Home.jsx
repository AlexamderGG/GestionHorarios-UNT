import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Calendar, BarChart3, FileText, ArrowRight, Zap, Users, Shield } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4">
      <div className="max-w-3xl mx-auto text-center animate-slide-up">
        {/* Logo */}
        <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-600/20">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 mb-4 text-balance">
          Sistema de Gestión de Horarios
        </h1>
        <p className="text-lg text-neutral-500 mb-10 max-w-xl mx-auto">
          Escuela de Ingeniería de Sistemas — Universidad Nacional de Trujillo
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left">
          <FeatureCard
            icon={Zap}
            title="Automatización Inteligente"
            description="Generación automática respetando jerarquía docente y disponibilidad de ambientes."
          />
          <FeatureCard
            icon={BarChart3}
            title="Dashboard y Estadísticas"
            description="Visualización de carga horaria, ocupación de aulas y distribución teoría/laboratorio."
          />
          <FeatureCard
            icon={FileText}
            title="Reportes PDF"
            description="Generación de reportes operacionales y de gestión exportables en PDF."
          />
        </div>

        {/* CTA */}
        <Link
          to="/login"
          className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-base"
        >
          Iniciar Sesión
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="card-hover p-5">
    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center mb-3">
      <Icon className="w-5 h-5 text-primary-600" />
    </div>
    <h2 className="text-sm font-semibold text-neutral-800 mb-1">{title}</h2>
    <p className="text-sm text-neutral-500">{description}</p>
  </div>
);

export default Home;
