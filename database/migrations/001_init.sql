-- ============================================================
-- MIGRACION 001: Esquema inicial del sistema de horarios UNT
-- ============================================================
-- Tablas: docentes, cursos, aulas, laboratorios, 
--          asignacion_docente_curso, configuracion, horarios,
--          restricciones_horarias
--
-- Nota: Se usa SERIAL para IDs autoincrementales (PostgreSQL).
--       Se asumen bloques de 2 horas (120 min), de 7am a 10pm.
-- ============================================================

-- --------------------------------------------------------------
-- 1. Tabla: docentes
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS docentes (
    id SERIAL PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    telefono VARCHAR(20),
    
    -- Categoría académica
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN (
        'Principal', 'Asociado', 'Auxiliar', 'Jefe de practica'
    )),
    
    -- Tipo de contrato/nombramiento
    tipo_nombramiento VARCHAR(50) NOT NULL CHECK (tipo_nombramiento IN (
        'Nombrado', 'Contratado'
    )),
    
    -- Especialidad (área de conocimiento)
    especialidad VARCHAR(100),
    
    -- Escuela de procedencia
    escuela VARCHAR(100) NOT NULL DEFAULT 'Ingenieria de Sistemas',
    
    -- Semestre específico de contrato (solo para docentes contratados de un solo semestre)
    semestre_contrato VARCHAR(20),
    
    -- Antigüedad en años (dentro de la misma categoría)
    antiguedad_anios INTEGER NOT NULL DEFAULT 0 CHECK (antiguedad_anios >= 0),
    
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE docentes IS 'Personal docente de diversas escuelas de la UNT';
COMMENT ON COLUMN docentes.categoria IS 'Jerarquia: Principal > Asociado > Auxiliar > Jefe de practica';
COMMENT ON COLUMN docentes.antiguedad_anios IS 'Usado para ordenar prioridad dentro de la misma categoria';
COMMENT ON COLUMN docentes.especialidad IS 'Area de conocimiento del docente (ej: Matematicas, Programacion)';
COMMENT ON COLUMN docentes.escuela IS 'Escuela de procedencia (ej: Ingenieria de Sistemas, Matematicas)';
COMMENT ON COLUMN docentes.semestre_contrato IS 'Semestre especifico de contrato (solo para contratados de un semestre). NULL = todos los semestres';

ALTER TABLE docentes 
ADD COLUMN estado_turno VARCHAR(20) DEFAULT 'Pendiente'
CHECK (estado_turno IN ('Pendiente', 'Notificado', 'Completado', 'Automatico'));

ALTER TABLE docentes ADD COLUMN reset_token_at INT DEFAULT 0;

ALTER TABLE docentes 
ADD COLUMN password VARCHAR(255);

-- --------------------------------------------------------------
-- 2. Tabla: cursos
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cursos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    creditos INTEGER NOT NULL DEFAULT 3,
    ciclo INTEGER NOT NULL CHECK (ciclo BETWEEN 1 AND 10),
    semestre VARCHAR(20) NOT NULL DEFAULT '2026-1',
    especialidad VARCHAR(100) NOT NULL DEFAULT 'Ingenieria de Sistemas',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN cursos.especialidad IS 'Especialidad del curso. Se usa para validar asignacion a docentes con la misma especialidad';

-- --------------------------------------------------------------
-- 3. Tabla: aulas
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aulas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100),
    capacidad INTEGER NOT NULL DEFAULT 40,
    ubicacion VARCHAR(100),
    tipo VARCHAR(50) DEFAULT 'Teoria', -- Teoria, Auditorio, etc.
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------
-- 4. Tabla: laboratorios
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS laboratorios (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100),
    capacidad INTEGER NOT NULL DEFAULT 25,
    ubicacion VARCHAR(100),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE laboratorios IS 'Laboratorios de uso general. Cualquier curso puede reservarlos';

-- --------------------------------------------------------------
-- 5. Tabla: excepciones_horario
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS excepciones_horario (
    id SERIAL PRIMARY KEY,
    docente_id INT REFERENCES docentes(id) ON DELETE CASCADE,
    asignacion_id INT REFERENCES asignacion_docente_curso(id) ON DELETE CASCADE,
    motivo TEXT NOT NULL, -- "Cruce con otra universidad"
    horario_solicitado_id INT REFERENCES horarios(id) ON DELETE SET NULL, -- El horario acaparado que desearía tomar
    estado VARCHAR(20) DEFAULT 'Pendiente', -- 'Pendiente', 'Aprobado', 'Rechazado'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Eliminar la columna individual anterior
ALTER TABLE excepciones_horario DROP COLUMN horario_solicitado_id;

-- Crear la nueva columna que almacena hasta 3 IDs de horarios como un arreglo
ALTER TABLE excepciones_horario ADD COLUMN horarios_solicitados_ids INT[] DEFAULT '{}';

-- --------------------------------------------------------------
-- 6. Tabla: configuracion
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS configuracion (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Valores por defecto de configuracion
INSERT INTO configuracion (clave, valor, descripcion) VALUES
('dias_habiles', 'Lunes,Martes,Miercoles,Jueves,Viernes', 'Dias de la semana habiles separados por coma'),
('hora_inicio', '07:00', 'Hora de inicio de jornada (HH:MM)'),
('hora_fin', '22:00', 'Hora de fin de jornada (HH:MM)'),
('duracion_bloque', '60', 'Duracion de cada bloque de clase en minutos (ej: 60 = 1 hora)'),
('bloques_por_dia', '12', 'Cantidad de bloques teoricos por dia (7-8, 8-9, 9-10, ..., 21-22)'),
('semestre_activo', '2026-1', 'Semestre academico activo. Formato YYYY-N. Determina ciclos impares (N impar) o pares (N par)')
ON CONFLICT (clave) DO NOTHING;

ALTER TABLE configuracion 
ADD COLUMN docentes_pueden_asignar BOOLEAN DEFAULT false;

-- --------------------------------------------------------------
-- 7. Tabla: asignacion_docente_curso
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asignacion_docente_curso (
    id SERIAL PRIMARY KEY,
    docente_id INTEGER NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,
    curso_id INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    
    -- tipo de asignacion dentro del curso
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('Teoria', 'Laboratorio')),
    
    -- Ambiente preferido (puede ser aula o laboratorio segun tipo)
    ambiente_preferido_id INTEGER,
    -- Nota: No se usa FK directa porque puede referir a aulas o laboratorios.
    --        Se valida en la aplicacion (backend).
    
    semestre_asignacion VARCHAR(20) DEFAULT '2026-1',
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(docente_id, curso_id, tipo, semestre_asignacion)
);

COMMENT ON TABLE asignacion_docente_curso IS 'Relaciona docentes con cursos que dictan (teoria o lab)';

-- --------------------------------------------------------------
-- 8. Tabla: horarios
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS horarios (
    id SERIAL PRIMARY KEY,
    
    -- Referencias
    asignacion_id INTEGER NOT NULL REFERENCES asignacion_docente_curso(id) ON DELETE CASCADE,
    
    -- Fecha/periodo academico
    semestre VARCHAR(20) NOT NULL DEFAULT '2026-1',
    
    -- Dia y hora
    dia VARCHAR(20) NOT NULL CHECK (dia IN (
        'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'
    )),
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    
    -- Ambiente asignado (puede ser aula o laboratorio)
    aula_id INTEGER REFERENCES aulas(id) ON DELETE SET NULL,
    laboratorio_id INTEGER REFERENCES laboratorios(id) ON DELETE SET NULL,
    
    -- Control de estado
    generado_automaticamente BOOLEAN NOT NULL DEFAULT TRUE,
    editado_manualmente BOOLEAN NOT NULL DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Restricciones de integridad temporal
    CONSTRAINT chk_horario_rango CHECK (hora_inicio < hora_fin)
);

COMMENT ON TABLE horarios IS 'Horarios finales asignados tras ejecutar el algoritmo o edicion manual';

-- --------------------------------------------------------------
-- 9. Tabla: restricciones_horarias (opcional, para futuro)
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS restricciones_horarias (
    id SERIAL PRIMARY KEY,
    docente_id INTEGER NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,
    dia VARCHAR(20) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    tipo_restriccion VARCHAR(50) DEFAULT 'No_disponible', -- No_disponible, Preferencia, etc.
    motivo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------
-- 10. Tabla: disponibilidad_docente
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS disponibilidad_docente (
    id SERIAL PRIMARY KEY,
    docente_id INTEGER REFERENCES docentes(id) ON DELETE CASCADE,
    semestre VARCHAR(20) NOT NULL,
    dia VARCHAR(15) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('PREFERIDO', 'RESTRINGIDO')),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------
-- Indices recomendados para rendimiento
-- --------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_docentes_categoria ON docentes(categoria);
CREATE INDEX IF NOT EXISTS idx_docentes_tipo ON docentes(tipo_nombramiento);
CREATE INDEX IF NOT EXISTS idx_docentes_activo ON docentes(activo);

CREATE INDEX IF NOT EXISTS idx_horarios_dia ON horarios(dia);
CREATE INDEX IF NOT EXISTS idx_horarios_aula ON horarios(aula_id);
CREATE INDEX IF NOT EXISTS idx_horarios_lab ON horarios(laboratorio_id);
CREATE INDEX IF NOT EXISTS idx_horarios_semestre ON horarios(semestre);
CREATE INDEX IF NOT EXISTS idx_asignacion_docente ON asignacion_docente_curso(docente_id);
CREATE INDEX IF NOT EXISTS idx_asignacion_curso ON asignacion_docente_curso(curso_id);
