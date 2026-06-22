CREATE TABLE IF NOT EXISTS horarios_no_lectivos (
  id SERIAL PRIMARY KEY,
  docente_id INT REFERENCES docentes(id) ON DELETE CASCADE,
  actividad_id VARCHAR(50) NOT NULL,
  actividad_nombre VARCHAR(100) NOT NULL,
  dia VARCHAR(20) NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  ambiente VARCHAR(150),
  semestre VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);