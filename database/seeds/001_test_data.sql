-- ============================================================
-- SEEDS 001: Docentes de prueba con especialidades
-- ============================================================
-- Incluye docentes nombrados (mayoria Ing Sistemas) y contratados
-- de diversas escuelas segun especialidad requerida.
-- ============================================================

-- -------------------------------------------------------------
-- 1. Docentes NOMBRADOS de Ingenieria de Sistemas (mayoria)
-- -------------------------------------------------------------
INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, antiguedad_anios) VALUES
('Carlos Alberto', 'Ramirez Vega', 'c.ramirez@unt.edu.pe', '999111222', 'Principal', 'Nombrado', 'Ingenieria de Sistemas', 'Ingenieria de Sistemas', 15),
('Maria Elena', 'Santos Paredes', 'm.santos@unt.edu.pe', '999222333', 'Principal', 'Nombrado', 'Ingenieria de Sistemas', 'Ingenieria de Sistemas', 12),
('Luis Fernando', 'Castillo Rojas', 'l.castillo@unt.edu.pe', '999333444', 'Asociado', 'Nombrado', 'Ingenieria de Sistemas', 'Ingenieria de Sistemas', 8),
('Ana Lucia', 'Mendoza Torres', 'a.mendoza@unt.edu.pe', '999444555', 'Asociado', 'Nombrado', 'Ingenieria de Sistemas', 'Ingenieria de Sistemas', 5),
('Jorge Enrique', 'Vasquez Luna', 'j.vasquez@unt.edu.pe', '999555666', 'Auxiliar', 'Nombrado', 'Ingenieria de Sistemas', 'Ingenieria de Sistemas', 4),
('Diana Patricia', 'Fernandez Cruz', 'd.fernandez@unt.edu.pe', '999666777', 'Auxiliar', 'Nombrado', 'Ingenieria de Sistemas', 'Ingenieria de Sistemas', 2),
('Roberto Carlos', 'Diaz Herrera', 'r.diaz@unt.edu.pe', '999777888', 'Jefe de practica', 'Nombrado', 'Ingenieria de Sistemas', 'Ingenieria de Sistemas', 3),
('Patricia Isabel', 'Garcia Leon', 'p.garcia@unt.edu.pe', '999888999', 'Jefe de practica', 'Nombrado', 'Ingenieria de Sistemas', 'Ingenieria de Sistemas', 1);

-- -------------------------------------------------------------
-- 2. Docentes CONTRATADOS de diversas escuelas (especialidades)
-- -------------------------------------------------------------

-- Matematicas (cursos: Desarrollo Pensamiento Logico, Analisis Matematico, Estadistica, Analisis Matematico II, Estadistica Aplicada, Matematica Aplicada)
INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios) VALUES
('Juan Manuel', 'Perez Lopez', 'j.perez@unt.edu.pe', '991111111', 'Asociado', 'Contratado', 'Matematicas', 'Escuela de Matematicas', NULL, 5),
('Maria Rosa', 'Quispe Huaman', 'm.quispe@unt.edu.pe', '992222222', 'Auxiliar', 'Contratado', 'Matematicas', 'Escuela de Matematicas', NULL, 2);

-- Fisica (cursos: Fisica General, Fisica Electronica)
INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios) VALUES
('Pedro Antonio', 'Sanchez Ruiz', 'p.sanchez@unt.edu.pe', '993333333', 'Asociado', 'Contratado', 'Fisica', 'Escuela de Fisica', NULL, 4);

-- Comunicacion (cursos: Lectura Critica, Tecnicas de Comunicacion)
INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios) VALUES
('Carmen Lucia', 'Torres Medina', 'c.torres@unt.edu.pe', '994444444', 'Auxiliar', 'Contratado', 'Comunicacion', 'Escuela de Comunicacion', NULL, 3);

-- Psicologia (cursos: Desarrollo Personal, Sicologia Organizacional)
INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios) VALUES
('Jose Luis', 'Mendoza Flores', 'j.mendoza@unt.edu.pe', '995555555', 'Auxiliar', 'Contratado', 'Psicologia', 'Escuela de Psicologia', NULL, 2);

-- Filosofia/Etica (cursos: Etica, Cultura Investigativa)
INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios) VALUES
('Rosa Maria', 'Vargas Castro', 'r.vargas@unt.edu.pe', '996666666', 'Auxiliar', 'Contratado', 'Filosofia', 'Escuela de Filosofia', NULL, 3);

-- Ciencias Sociales (cursos: Sociedad Cultura Ecologia)
INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios) VALUES
('Miguel Angel', 'Herrera Paredes', 'm.herrera@unt.edu.pe', '997777777', 'Auxiliar', 'Contratado', 'Ciencias Sociales', 'Escuela de Ciencias Sociales', NULL, 2);

-- Administracion (cursos: Administracion General, Economia General, Contabilidad Gerencial, Finanzas Corporativas)
INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios) VALUES
('Laura Beatriz', 'Cruz Palacios', 'l.cruz@unt.edu.pe', '998888888', 'Asociado', 'Contratado', 'Administracion', 'Escuela de Administracion', NULL, 6),
('Eduardo Joel', 'Romero Vasquez', 'e.romero@unt.edu.pe', '998888888', 'Asociado', 'Contratado', 'Administracion', 'Escuela de Administracion', NULL, 6),
('Adrian', 'Benites Barboza', 'a.benites@unt.edu.pe', '998888888', 'Asociado', 'Contratado', 'Administracion', 'Escuela de Administracion', NULL, 5);

-- Musica (curso: Taller de Musica - electivo de un solo semestre)
INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios) VALUES
('Fernando Jose', 'Rojas Vega', 'f.rojas@unt.edu.pe', '999000001', 'Auxiliar', 'Contratado', 'Musica', 'Escuela de Artes', '2026-1', 1);

-- Danza Folklorica (curso: Taller de Danzas Folkloricas - electivo de un solo semestre)
INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios) VALUES
('Isabel Cristina', 'Luna Castillo', 'i.luna@unt.edu.pe', '999000002', 'Auxiliar', 'Contratado', 'Danza Folklorica', 'Escuela de Artes', '2026-1', 1);

-- Educacion Fisica (curso: Taller de Deporte - electivo de un solo semestre)
INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios) VALUES
('Raul Enrique', 'Paredes Quispe', 'r.paredes@unt.edu.pe', '999000003', 'Auxiliar', 'Contratado', 'Educacion Fisica', 'Escuela de Educacion Fisica', '2026-1', 1);

-- Derecho (curso: Deontologia y Derecho Informatico)
INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios) VALUES
('Diana Carolina', 'Flores Ruiz', 'd.flores@unt.edu.pe', '999000004', 'Asociado', 'Contratado', 'Derecho', 'Escuela de Derecho', NULL, 4);

-- Ingenieria Ambiental (curso: Ingenieria Ambiental)
INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios) VALUES
('Andres Felipe', 'Gomez Torres', 'a.gomez@unt.edu.pe', '999000005', 'Auxiliar', 'Contratado', 'Ingenieria Ambiental', 'Escuela de Ingenieria Ambiental', NULL, 2);

-- -------------------------------------------------------------
-- 3. Aulas de prueba
-- -------------------------------------------------------------
INSERT INTO aulas (codigo, nombre, capacidad, ubicacion, tipo) VALUES
('A101', 'Aula 101 - Pabellon Central', 50, 'Pabellon Central - Planta Baja', 'Teoria'),
('A102', 'Aula 102 - Pabellon Central', 50, 'Pabellon Central - Planta Baja', 'Teoria'),
('A201', 'Aula 201 - Pabellon Central', 45, 'Pabellon Central - Segundo Piso', 'Teoria'),
('A202', 'Aula 202 - Pabellon Central', 45, 'Pabellon Central - Segundo Piso', 'Teoria'),
('AUD01', 'Auditorio Principal', 120, 'Pabellon Principal - Tercer Piso', 'Auditorio'),
('A301', 'Aula 301 - Pabellon Norte', 40, 'Pabellon Norte - Tercer Piso', 'Teoria');

-- -------------------------------------------------------------
-- 4. Laboratorios de prueba (uso general, sin especialidad)
-- -------------------------------------------------------------
INSERT INTO laboratorios (codigo, nombre, capacidad, ubicacion) VALUES
('LAB01', 'Laboratorio 01', 25, 'Pabellon Central - Sotano'),
('LAB02', 'Laboratorio 02', 25, 'Pabellon Central - Sotano'),
('LAB03', 'Laboratorio 03', 20, 'Pabellon Norte - Planta Baja'),
('LAB04', 'Laboratorio 04', 20, 'Pabellon Norte - Planta Baja'),
('LAB05', 'Laboratorio 05', 20, 'Pabellon Norte - Segundo Piso');

-- -------------------------------------------------------------
-- Fin del seed de prueba
-- Los cursos reales estan en database/seeds/003_cursos_documento.sql
-- Las asignaciones deben crearse manualmente desde la interfaz.
-- -------------------------------------------------------------
