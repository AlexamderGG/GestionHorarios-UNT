-- ============================================================
-- MIGRACION 002: Agregar ciclo a asignacion_docente_curso
-- ============================================================
-- NOTA: La tabla cursos ya tiene ciclo (INTEGER) y semestre (VARCHAR)
--       desde la migracion 001_init.sql.
--       Esta migracion solo agrega la columna ciclo a asignaciones.
-- ============================================================

-- Agregar columna ciclo a asignacion_docente_curso
ALTER TABLE asignacion_docente_curso ADD COLUMN IF NOT EXISTS ciclo INTEGER;

-- Actualizar registros existentes con el ciclo del curso correspondiente
UPDATE asignacion_docente_curso adc
SET ciclo = c.ciclo
FROM cursos c
WHERE adc.curso_id = c.id AND adc.ciclo IS NULL;

-- Indices adicionales recomendados
CREATE INDEX IF NOT EXISTS idx_cursos_ciclo ON cursos(ciclo);
CREATE INDEX IF NOT EXISTS idx_asignacion_ciclo ON asignacion_docente_curso(ciclo);
