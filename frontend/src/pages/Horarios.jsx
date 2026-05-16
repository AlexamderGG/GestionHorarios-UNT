import React, { useState } from 'react';

const Horarios = () => {
  const [filtroDocente, setFiltroDocente] = useState('');
  const [filtroAula, setFiltroAula] = useState('');

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Gestión de Horarios</h1>
      
      <div className="bg-white p-4 rounded-lg shadow border border-neutral-200 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Docente</label>
            <select 
              className="border border-neutral-300 rounded px-3 py-2 text-sm w-48"
              value={filtroDocente}
              onChange={(e) => setFiltroDocente(e.target.value)}
            >
              <option value="">Todos</option>
              {/* TODO: Modulo 3 - Popular desde API */}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Aula / Laboratorio</label>
            <select 
              className="border border-neutral-300 rounded px-3 py-2 text-sm w-48"
              value={filtroAula}
              onChange={(e) => setFiltroAula(e.target.value)}
            >
              <option value="">Todos</option>
              {/* TODO: Modulo 3 - Popular desde API */}
            </select>
          </div>
          <button className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition">
            Generar Horarios
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-800">Vista de Horario (Grid)</h2>
        </div>
        <div className="p-8 text-center text-neutral-400">
          {/* TODO: Modulo 3 - Implementar tabla grid de horarios (dias x horas) */}
          <p>La tabla grid de horarios se implementará aquí.</p>
          <p className="text-sm mt-2">Columnas: Lunes a Viernes | Filas: Bloques horarios (7am - 10pm)</p>
        </div>
      </div>
    </div>
  );
};

export default Horarios;
