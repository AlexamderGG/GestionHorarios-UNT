-- ============================================================
-- MIGRACION 002: Agregar ciclo a asignacion_docente_curso
-- ============================================================
-- NOTA: La tabla cursos ya tiene ciclo (INTEGER) y semestre (VARCHAR)
--       desde la migracion 001_init.sql.
--       Esta migracion solo agrega la columna ciclo a asignaciones.
-- ============================================================

-- Añadimos la columna malla. Le ponemos por defecto '2018' (o el año de tu malla actual) 
-- para que los cursos que ya tienes registrados no se queden en blanco.
ALTER TABLE cursos ADD COLUMN IF NOT EXISTS malla VARCHAR(20) DEFAULT '2018';

-- Actualizar registros existentes con el ciclo del curso correspondiente
UPDATE asignacion_docente_curso adc
SET ciclo = c.ciclo
FROM cursos c
WHERE adc.curso_id = c.id AND adc.ciclo IS NULL;

-- Indices adicionales recomendados
CREATE INDEX IF NOT EXISTS idx_cursos_ciclo ON cursos(ciclo);
CREATE INDEX IF NOT EXISTS idx_asignacion_ciclo ON asignacion_docente_curso(ciclo);
