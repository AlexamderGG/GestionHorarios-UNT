-- ============================================================
-- SEED 003: Cursos reales segun documento academico de la EIS
-- ============================================================

SET client_encoding = 'UTF8';
-- ============================================================
-- Plan de estudios vigente, 10 ciclos.
-- Semestre academico: 2026-1
--
-- Tabla afectada: cursos (codigo, nombre, creditos, ciclo, semestre, activo, especialidad, horas_aula, horas_lab)
--
-- horas_aula = HT + HP (teoria + practica en aula)
-- horas_lab  = HL (practica en laboratorio)
-- ============================================================

INSERT INTO cursos (codigo, nombre, creditos, ciclo, semestre, activo, especialidad, horas_t, horas_p, horas_l) VALUES
-- I Ciclo (ciclo 1)
('EG-101', 'Desarrollo del Pensamiento Logico Matemático', 3, 1, '2026-1', TRUE, 'Matemáticas', 2, 3, 0),
('EG-102', 'Lectura Critica y Redaccion de Textos Academicos', 3, 1, '2026-1', TRUE, 'Lengua y Literatura', 2, 2, 0),
('EG-103', 'Desarrollo Personal', 3, 1, '2026-1', TRUE, 'CC. Psicologicas', 2, 2, 0),
('EG-104', 'Introduccion al Analisis Matematico', 4, 1, '2026-1', TRUE, 'Matemáticas', 2, 4, 0),
('EG-105', 'Estadistica General', 4, 1, '2026-1', TRUE, 'Estadistica', 2, 4, 0),
('EE-101', 'Introduccion a la Ingenieria de Sistemas', 2, 1, '2026-1', TRUE, 'Ingenieria de Sistemas', 1, 2, 0),
('EE-102', 'Introduccion a la Programacion', 3, 1, '2026-1', TRUE, 'Ingenieria de Sistemas', 2, 0, 4),
('EL-101', 'Tecnicas de comunicacion eficaz (E)', 1, 1, '2026-1', TRUE, 'Estudios Generales', 0, 2, 0),
('EL-102', 'Taller de Musica (E)', 1, 1, '2026-1', TRUE, 'Filosofía y Arte', 0, 2, 0),
('EL-103', 'Taller de Liderazgo y trabajo en equipo (E)', 1, 1, '2026-1', TRUE, 'Estudios Generales', 0, 2, 0),

-- II Ciclo (ciclo 2)
('EG-201', 'Etica, Convivencia Humana y Ciudadania', 3, 2, '2026-2', TRUE, 'Filosofia', 2, 2, 0),
('EG-202', 'Sociedad, Cultura y Ecologia', 3, 2, '2026-2', TRUE, 'Ciencias Sociales', 1, 4, 0),
('EG-203', 'Cultura Investigativa y Pensamiento Critico', 3, 2, '2026-2', TRUE, 'Ciencias Sociales', 2, 2, 0),
('EG-204', 'Analisis Matematico', 4, 2, '2026-2', TRUE, 'Matemáticas', 2, 4, 0),
('EG-205', 'Fisica General', 4, 2, '2026-2', TRUE, 'Fisica', 2, 6, 8),
('EE-201', 'Programacion Orientada a Objetos I', 4, 2, '2026-2', TRUE, 'Ingenieria de Sistemas', 2, 0, 12),
('EL-201', 'Taller de Manejo de TIC (E)', 1, 2, '2026-2', TRUE, 'Ingenieria de Sistemas', 0, 2, 0),
('EL-202', 'Taller de Danzas Folkloricas (E)', 1, 2, '2026-2', TRUE, 'Filosofía y Arte', 0, 2, 0),
('EL-203', 'Taller de Deporte (E)', 1, 2, '2026-2', TRUE, 'Ciencias de la Educación', 0, 2, 0),

-- III Ciclo (ciclo 3)
('EP-301', 'Administracion General', 3, 3, '2026-1', TRUE, 'Administracion', 2, 2, 0),
('EE-301', 'Sistémica', 3, 3, '2026-1', TRUE, 'Ingenieria de Sistemas', 2, 1, 6),
('EP-302', 'Estadistica Aplicada', 3, 3, '2026-1', TRUE, 'Estadistica', 1, 2, 6),
('EP-303', 'Matematica Aplicada', 3, 3, '2026-1', TRUE, 'Matemáticas', 1, 2, 2),
('EP-304', 'Fisica Electronica', 3, 3, '2026-1', TRUE, 'Fisica', 1, 2, 2),
('EE-302', 'Programacion Orientada a Objetos II', 4, 3, '2026-1', TRUE, 'Ingenieria de Sistemas', 2, 0, 12),
('EL-301', 'Ingenieria Grafica (E)', 3, 3, '2026-1', TRUE, 'Ingenieria de Sistemas', 1, 1, 6),
('EL-302', 'Psicologia Organizacional (E)', 3, 3, '2026-1', TRUE, 'CC. Psicologicas', 2, 2, 0),

-- IV Ciclo (ciclo 4)
('EP-401', 'Economia General', 3, 4, '2026-2', TRUE, 'Economía', 2, 2, 0),
('EE-401', 'Diseno Web', 3, 4, '2026-2', TRUE, 'Ingenieria de Sistemas', 1, 1, 6),
('EP-402', 'Pensamiento de Diseño', 3, 4, '2026-2', TRUE, 'Ingenieria de Sistemas', 1, 2, 6),
('EP-403', 'Gestion de Procesos', 3, 4, '2026-2', TRUE, 'Ingenieria de Sistemas', 1, 2, 4),
('EE-402', 'Sistemas Digitales', 3, 4, '2026-2', TRUE, 'Ingenieria de Sistemas', 1, 2, 6),
('EE-403', 'Estructura de Datos Orientado a Objetos', 4, 4, '2026-2', TRUE, 'Ingenieria de Sistemas', 2, 1, 6),
('EL-401', 'Computacion Grafica y Visual (E)', 3, 4, '2026-2', TRUE, 'Ingenieria de Sistemas', 1, 1, 3),
('EL-402', 'Plataformas Tecnologicas (E)', 3, 4, '2026-2', TRUE, 'Ingenieria de Sistemas', 2, 0, 4),

-- V Ciclo (ciclo 5)
('EP-501', 'Contabilidad Gerencial', 3, 5, '2026-1', TRUE, 'Contabilidad y Finanzas', 1, 2, 2),
('EE-501', 'Tecnologias Web', 3, 5, '2026-1', TRUE, 'Ingenieria de Sistemas', 1, 1, 9),
('EP-502', 'Investigacion de Operaciones', 3, 5, '2026-1', TRUE, 'Ingeniería Industrial', 1, 2, 4),
('EE-502', 'Ingenieria de Datos I', 4, 5, '2026-1', TRUE, 'Ingenieria de Sistemas', 2, 1, 9),
('EE-503', 'Arquitectura y Organizacion de Computadoras', 3, 5, '2026-1', TRUE, 'Ingenieria de Sistemas', 1, 2, 6),
('EE-504', 'Sistemas de Informacion', 4, 5, '2026-1', TRUE, 'Ingenieria de Sistemas', 2, 2, 6),
('EL-501', 'Teleinformatica (E)', 3, 5, '2026-1', TRUE, 'Ingenieria de Sistemas', 1, 2, 4),
('EL-502', 'Transformacion Digital (E)', 3, 5, '2026-1', TRUE, 'Ingenieria de Sistemas', 2, 0, 4),

-- VI Ciclo (ciclo 6)
('EP-601', 'Finanzas Corporativas', 3, 6, '2026-2', TRUE, 'Contabilidad y Finanzas', 1, 2, 2),
('EE-601', 'Sistemas Inteligentes', 3, 6, '2026-2', TRUE, 'Ingenieria de Sistemas', 1, 2, 4),
('EP-602', 'Ingenieria Economica', 3, 6, '2026-2', TRUE, 'Ingeniería Industrial', 1, 2, 2),
('EE-602', 'Ingenieria de Datos II', 4, 6, '2026-2', TRUE, 'Ingenieria de Sistemas', 2, 1, 9),
('EE-603', 'Sistemas Operativos', 3, 6, '2026-2', TRUE, 'Ingenieria de Sistemas', 1, 2, 6),
('EE-604', 'Ingenieria de Requerimientos', 3, 6, '2026-2', TRUE, 'Ingenieria de Sistemas', 1, 2, 4),
('EL-601', 'Ingenieria Ambiental (E)', 3, 6, '2026-2', TRUE, 'Ingenieria Ambiental', 2, 2, 0),
('EL-602', 'Gestion del Talento Humano (E)', 3, 6, '2026-2', TRUE, 'Administracion', 2, 2, 0),

-- VII Ciclo (ciclo 7)
('EP-701', 'Cadena de Suministro', 3, 7, '2026-1', TRUE, 'Ingeniería Industrial', 2, 2, 0),
('EE-701', 'Gestion de Servicios de TIC', 3, 7, '2026-1', TRUE, 'Ingenieria de Sistemas', 1, 2, 4),
('EI-701', 'Metodologia de la Investigacion Cientifica', 3, 7, '2026-1', TRUE, 'Ingenieria de Sistemas', 2, 2, 0),
('EE-702', 'Planeamiento Estrategico de la Informacion', 3, 7, '2026-1', TRUE, 'Ingenieria de Sistemas', 1, 2, 8),
('EE-703', 'Redes y Comunicaciones I', 3, 7, '2026-1', TRUE, 'Ingenieria de Sistemas', 1, 1, 9),
('EE-704', 'Ingenieria del Software I', 4, 7, '2026-1', TRUE, 'Ingenieria de Sistemas', 2, 1, 9),
('EL-701', 'Administracion de Base de Datos (E)', 3, 7, '2026-1', TRUE, 'Ingenieria de Sistemas', 1, 1, 6),
('EL-702', 'Negocios Electronicos (E)', 3, 7, '2026-1', TRUE, 'Ingenieria de Sistemas', 2, 0, 4),

-- VIII Ciclo (ciclo 8)
('EP-801', 'Marketing y Medios Sociales', 3, 8, '2026-2', TRUE, 'Ingenieria de Sistemas', 1, 2, 4),
('EE-801', 'Seguridad de la Informacion', 3, 8, '2026-2', TRUE, 'Ingenieria de Sistemas', 1, 2, 6),
('EE-802', 'Internet de las Cosas', 3, 8, '2026-2', TRUE, 'Ingenieria de Sistemas', 1, 1, 6),
('EE-803', 'Inteligencia de Negocios', 3, 8, '2026-2', TRUE, 'Ingenieria de Sistemas', 1, 2, 6),
('EE-804', 'Redes y Comunicaciones II', 3, 8, '2026-2', TRUE, 'Ingenieria de Sistemas', 1, 1, 6),
('EE-805', 'Ingenieria del Software II', 4, 8, '2026-2', TRUE, 'Ingenieria de Sistemas', 2, 1, 6),
('EL-801', 'Deontologia y Derecho Informatico (E)', 3, 8, '2026-2', TRUE, 'Derecho', 2, 2, 0),
('EL-802', 'Arquitectura basada en Microservicios (E)', 3, 8, '2026-2', TRUE, 'Ingenieria de Sistemas', 2, 0, 2),

-- IX Ciclo (ciclo 9)
('EE-901', 'Gestion de Proyectos de TIC', 1, 9, '2026-1', TRUE, 'Ingenieria de Sistemas', 1, 2, 6),
('EE-902', 'Auditoria Informatica', 3, 9, '2026-1', TRUE, 'Ingenieria de Sistemas', 1, 2, 4),
('EI-901', 'Tesis I', 4, 9, '2026-1', TRUE, 'Ingenieria de Sistemas', 4, 4, 4),
('EE-903', 'Analitica de Negocios', 3, 9, '2026-1', TRUE, 'Ingenieria de Sistemas', 1, 2, 2),
('EE-904', 'Computacion en la Nube', 3, 9, '2026-1', TRUE, 'Ingenieria de Sistemas', 1, 1, 9),
('EE-905', 'Ingenieria Web', 3, 9, '2026-1', TRUE, 'Ingenieria de Sistemas', 1, 1, 9),
('EL-901', 'Emprendimiento Tecnológico (E)', 3, 9, '2026-1', TRUE, 'Ingenieria de Sistemas', 2, 0, 4),
('EL-902', 'Hackeo Etico (E)', 3, 9, '2026-1', TRUE, 'Ingenieria de Sistemas', 2, 0, 4),

-- X Ciclo (ciclo 10)
('EE-X01', 'Sistemas de Informacion Empresarial', 4, 10, '2026-2', TRUE, 'Ingenieria de Sistemas', 2, 1, 6),
('EE-X02', 'Gobierno de TIC', 3, 10, '2026-2', TRUE, 'Ingenieria de Sistemas', 1, 2, 4),
('EI-X01', 'Tesis II', 4, 10, '2026-2', TRUE, 'Ingenieria de Sistemas', 2, 2, 4),
('EE-X03', 'Arquitectura Empresarial', 3, 10, '2026-2', TRUE, 'Ingenieria de Sistemas', 1, 2, 6),
('EP-X01', 'Responsabilidad Social Corporativa', 3, 10, '2026-2', TRUE, 'Ingeniería Industrial', 2, 2, 0),
('EE-X04', 'Aplicaciones Moviles', 3, 10, '2026-2', TRUE, 'Ingenieria de Sistemas', 1, 1, 6),
('EE-X05', 'Practicas Pre Profesionales', 4, 10, '2026-2', TRUE, 'Ingenieria de Sistemas', 2, 1, 6);
