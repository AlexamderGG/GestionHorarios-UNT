-- ============================================================
-- MIGRACION 003: Laboratorios genericos + horas en cursos
-- ============================================================
-- Cambios:
--   1. Agregar horas_aula y horas_lab a la tabla cursos (ALTER TABLE).
--   2. Eliminar especialidad de laboratorios (ahora son genericos).
--   3. Agregar comentarios explicativos.
-- ============================================================

-- Agregamos las nuevas columnas con mayor granularidad
ALTER TABLE cursos 
ADD COLUMN horas_t INTEGER DEFAULT 0,
ADD COLUMN horas_p INTEGER DEFAULT 0,
ADD COLUMN horas_l INTEGER DEFAULT 0;

COMMENT ON COLUMN cursos.horas_t IS 'Horas de teoria';
COMMENT ON COLUMN cursos.horas_p IS 'Horas de practica';
COMMENT ON COLUMN cursos.horas_l IS 'Horas de laboratorio';

COMMENT ON TABLE laboratorios IS 'Laboratorios de uso general. Cualquier curso puede reservarlos segun sus horas_lab';


