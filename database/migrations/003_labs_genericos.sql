-- ============================================================
-- MIGRACION 003: Laboratorios genericos + horas en cursos
-- ============================================================
-- Cambios:
--   1. Agregar horas_aula y horas_lab a la tabla cursos (ALTER TABLE).
--   2. Eliminar especialidad de laboratorios (ahora son genericos).
--   3. Agregar comentarios explicativos.
-- ============================================================

-- --------------------------------------------------------------
-- 1. Agregar horas de aula y laboratorio a cursos
-- --------------------------------------------------------------
ALTER TABLE cursos
    ADD COLUMN IF NOT EXISTS horas_aula INTEGER NOT NULL DEFAULT 0 CHECK (horas_aula >= 0),
    ADD COLUMN IF NOT EXISTS horas_lab  INTEGER NOT NULL DEFAULT 0 CHECK (horas_lab >= 0);

COMMENT ON COLUMN cursos.horas_aula IS 'Horas semanales de teoria/practica en aula (HT + HP)';
COMMENT ON COLUMN cursos.horas_lab IS 'Horas semanales de laboratorio (HL)';

-- --------------------------------------------------------------
-- 2. Eliminar especialidad de laboratorios (genericidad)
-- --------------------------------------------------------------
ALTER TABLE laboratorios DROP COLUMN IF EXISTS especialidad;

COMMENT ON TABLE laboratorios IS 'Laboratorios de uso general. Cualquier curso puede reservarlos segun sus horas_lab';

-- --------------------------------------------------------------
-- 3. Indices adicionales
-- --------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_cursos_horas ON cursos(horas_aula, horas_lab);
