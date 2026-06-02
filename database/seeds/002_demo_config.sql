-- ============================================================
-- SEED 002: Configuración para modo demo y selección
-- ============================================================
SET client_encoding = 'UTF8';

INSERT INTO configuracion (clave, valor, descripcion) VALUES
  ('demo_mode', 'false', 'Activa el modo demo para control de turnos'),
  ('demo_turno_actual', '1', 'Turno actual en modo demo'),
  ('demo_step_minutes', '15', 'Minutos por turno de simulación'),
  ('seleccion_abierta', 'true', 'Permite a docentes seleccionar horarios')
ON CONFLICT (clave) DO NOTHING;
