CREATE TABLE carga_no_lectiva (
    id SERIAL PRIMARY KEY,
    docente_id INTEGER REFERENCES docentes(id) ON DELETE CASCADE,
    semestre VARCHAR(10) NOT NULL,
    preparacion_clases INTEGER DEFAULT 0,
    tutoria_consejeria INTEGER DEFAULT 0,
    investigacion INTEGER DEFAULT 0,
    gestion_admin INTEGER DEFAULT 0,
    capacitacion INTEGER DEFAULT 0,
    otras_actividades INTEGER DEFAULT 0,
    total_horas INTEGER GENERATED ALWAYS AS (
        preparacion_clases + tutoria_consejeria + investigacion + 
        gestion_admin + capacitacion + otras_actividades
    ) STORED,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(docente_id, semestre)
);

ALTER TABLE carga_no_lectiva
ADD COLUMN preparacion_clases_detalle TEXT DEFAULT '',
ADD COLUMN tutoria_consejeria_detalle TEXT DEFAULT '',
ADD COLUMN investigacion_detalle TEXT DEFAULT '',
ADD COLUMN gestion_admin_detalle TEXT DEFAULT '',
ADD COLUMN capacitacion_detalle TEXT DEFAULT '',
ADD COLUMN otras_actividades_detalle TEXT DEFAULT '';


ALTER TABLE carga_no_lectiva
ADD COLUMN asesoria_tesis INTEGER DEFAULT 0,
ADD COLUMN asesoria_tesis_detalle TEXT DEFAULT '',
ADD COLUMN responsabilidad_social INTEGER DEFAULT 0,
ADD COLUMN responsabilidad_social_detalle TEXT DEFAULT '',
ADD COLUMN produccion_intelectual INTEGER DEFAULT 0,
ADD COLUMN produccion_intelectual_detalle TEXT DEFAULT '';

--  Actualizamos la columna del total generado para que incluya los nuevos campos
ALTER TABLE carga_no_lectiva DROP COLUMN total_horas;

ALTER TABLE carga_no_lectiva ADD COLUMN total_horas INTEGER GENERATED ALWAYS AS (
    preparacion_clases + tutoria_consejeria + asesoria_tesis + 
    investigacion + responsabilidad_social + gestion_admin + 
    produccion_intelectual + capacitacion + otras_actividades
) STORED;