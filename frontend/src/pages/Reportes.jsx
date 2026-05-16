import React, { useState } from 'react';

const Reportes = () => {
  const [docenteSeleccionado, setDocenteSeleccionado] = useState('');

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Reportes</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-800 mb-2">Reporte Operacional</h2>
          <p className="text-sm text-neutral-600 mb-4">
            Detalle de horarios por aula/laboratorio, día y hora.
          </p>
          <button className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition">
            Descargar PDF
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-800 mb-2">Reporte de Gestión</h2>
          <p className="text-sm text-neutral-600 mb-4">
            Resumen de asignación por docente (categoría, antigüedad, carga horaria).
          </p>
          <button className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition">
            Descargar PDF
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-800 mb-4">Reporte por Docente</h2>
        <div className="flex flex-wrap gap-4 items-end mb-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Seleccionar Docente</label>
            <select 
              className="border border-neutral-300 rounded px-3 py-2 text-sm w-64"
              value={docenteSeleccionado}
              onChange={(e) => setDocenteSeleccionado(e.target.value)}
            >
              <option value="">-- Seleccione --</option>
              {/* TODO: Modulo 4 - Popular desde API */}
            </select>
          </div>
          <button className="px-4 py-2 bg-neutral-200 text-neutral-800 rounded hover:bg-neutral-300 transition">
            Ver Horario
          </button>
          <button className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition">
            Exportar PDF
          </button>
        </div>
        
        <div className="border border-neutral-200 rounded p-4 min-h-[200px] flex items-center justify-center text-neutral-400">
          {/* TODO: Modulo 4 - Mostrar tabla de horario individual */}
          <p>Seleccione un docente para visualizar su horario.</p>
        </div>
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
        <strong>Nota para el desarrollador (Módulo 4):</strong> Aquí se debe implementar la generación de PDFs 
        usando jsPDF y html2canvas. El backend puede devolver JSON con los datos o HTML ya formateado.
      </div>
    </div>
  );
};

export default Reportes;
