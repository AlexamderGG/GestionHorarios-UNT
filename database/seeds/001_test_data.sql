-- ============================================================
-- SEEDS 001: Docentes de prueba con especialidades
-- ============================================================
-- Incluye docentes nombrados (mayoria Ing Sistemas) y contratados
-- de diversas escuelas segun especialidad requerida.
-- ============================================================
TRUNCATE TABLE docentes, cursos, aulas, laboratorios, configuracion RESTART IDENTITY CASCADE;
SET client_encoding = 'UTF8';

-- -------------------------------------------------------------
-- 1. Docentes NOMBRADOS de Ingenieria de Sistemas (mayoria)
-- -------------------------------------------------------------
INSERT INTO docentes (id, nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, antiguedad_anios, modalidad, dni) VALUES
(40, 'Cesar', 'Arellano Salazar', 'c.arellano@unt.edu.pe', '999111222', 'Principal', 'Nombrado', 'Ingenieria de Sistemas', 'Ingenieria de Sistemas', 10, 'Tiempo Completo', '85345678'),
(41, 'Marcelino', 'Torres Villanueva', 'm.torres@unt.edu.pe', '999222333', 'Principal', 'Nombrado', 'Ingenieria de Sistemas', 'Ingenieria de Sistemas', 11, 'Tiempo Completo', '86765432'),    
(43, 'Alberto', 'Mendoza de los Santos', 'a.mendoza@unt.edu.pe', '999444555', 'Principal', 'Nombrado', 'Ingenieria de Sistemas', 'Ingenieria de Sistemas', 9, 'Tiempo Completo', '87345678'),
(44, 'Luis Enrique', 'Boy Chavil', 'l.boy@unt.edu.pe', '999555666', 'Principal', 'Nombrado', 'Ingenieria de Sistemas', 'Ingenieria de Sistemas', 15, 'Tiempo Completo', '88765432'),
(45, 'Robert Jerry', 'Sanchez Ticona', 'r.sanchez@unt.edu.pe', '999666777', 'Asociado', 'Nombrado', 'Ingenieria de Sistemas', 'Ingenieria de Sistemas', 11, 'Tiempo Completo', '89345678'),
(46, 'Ricardo Dario', 'Mendoza Rivera', 'r.mendoza@unt.edu.pe', '999777888', 'Principal', 'Nombrado', 'Ingenieria de Sistemas', 'Ingenieria de Sistemas', 8, 'Tiempo Completo', '91345678'),
(47, 'Juan Carlos', 'Obando Roldan', 'j.obando@unt.edu.pe', '999888999', 'Asociado', 'Nombrado', 'Ingenieria de Sistemas', 'Ingenieria de Sistemas', 9, 'Tiempo Completo', '82765432'),
(48, 'Paula', 'Cotrina Castellanos', 'p.cotrina@unt.edu.pe', '985623156', 'Asociado', 'Nombrado', 'Ingenieria de Sistemas', 'Ingenieria de Sistemas', 9, 'Tiempo Completo', '93345678'),
(49, 'Oscar Romel', 'Alcántara Moreno', 'o.alcantara@unt.edu.pe', '963223156', 'Asociado', 'Nombrado', 'Ingenieria de Sistemas', 'Ingenieria de Sistemas', 10, 'Tiempo Completo', '94765432'),
(50, 'Juan Pedro', 'Santos Fernández', 'j.santos@unt.edu.pe', '963223446', 'Principal', 'Nombrado', 'Ingenieria de Sistemas', 'Ingenieria de Sistemas', 18, 'Tiempo Completo', '96345678'),
(51, 'Everson David', 'Agreda Gamboa', 'e.agreda@unt.edu.pe', '963223452', 'Principal', 'Nombrado', 'Ingenieria de Sistemas', 'Ingenieria de Sistemas', 9, 'Tiempo Completo', '98765232'),
(52, 'Hugo', 'Romero Ruíz', 'h.romero@unt.edu.pe', '906013452', 'Principal', 'Nombrado', 'Ingenieria de Sistemas', 'Ingenieria de Sistemas', 10, 'Tiempo Completo', '12005678'),
(53, 'Zoraida', 'Vidal Melgarejo', 'z.vidal@unt.edu.pe', '968957452', 'Principal', 'Nombrado', 'Ingenieria de Sistemas', 'Ingenieria de Sistemas', 10, 'Tiempo Completo', '12445678'),
(76, 'Camilo', 'Suarez Rebaza', 'c.suarez@unt.edu.pe', '942013452', 'Principal', 'Nombrado', 'Ingenieria de Sistemas', 'Ingenieria de Sistemas', 6, 'Tiempo Completo', '98765332'),
(54, 'José', 'Gómez Ávila', 'j.gomez@unt.edu.pe', '963013452', 'Principal', 'Nombrado', 'Ingenieria de Sistemas', 'Ingenieria de Sistemas', 10, 'Tiempo Completo', '12399678');

-- -------------------------------------------------------------
-- 2. Docentes CONTRATADOS de diversas escuelas (especialidades)
-- -------------------------------------------------------------

-- Matematicas (cursos: Desarrollo Pensamiento Logico, Analisis Matematico, Estadistica, Analisis Matematico II, Estadistica Aplicada, Matematica Aplicada)
INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios, modalidad, dni) VALUES
('Jose Luis', 'Ponte Bejarano', 'j.ponte@unt.edu.pe', '991231011', 'Asociado', 'Contratado', 'Matemáticas', 'Escuela de Matemáticas', NULL, 5, 'Tiempo Parcial', '56345678'),
('Segundo', 'Guibar Obeso', 's.guibar@unt.edu.pe', '991295611', 'Asociado', 'Contratado', 'Matemáticas', 'Escuela de Matemáticas', NULL, 5, 'Tiempo Parcial', '57765321'),
('Marcos', 'Ferrer Reyna', 'm.ferrer@unt.edu.pe', '998823888', 'Asociado', 'Contratado', 'Matemáticas', 'Escuela de Matemáticas', NULL, 5, 'Tiempo Parcial', '58345678'),
('Miguel', 'Ipanaque Zapata', 'm.ipaque@unt.edu.pe', '995588888', 'Asociado', 'Contratado', 'Estadistica', 'Escuela de Estadistica', NULL, 5, 'Tiempo Parcial', '59765421'),
('Martha', ' Cardoso', 'm.cardoso@unt.edu.pe', '998888826', 'Asociado', 'Contratado', 'Estadistica', 'Escuela de Estadistica', NULL, 5, 'Tiempo Parcial', '60765421'),
('Teresita', 'Rojas Garcia', 't.rojas@unt.edu.pe', '998888888', 'Asociado', 'Contratado', 'Estadistica', 'Escuela de Estadistica', NULL, 5, 'Tiempo Parcial', '61345678');
-- Fisica (cursos: Fisica General, Fisica Electronica)
INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios, modalidad, dni) VALUES
('Vilma', 'Mendez Gil', 'v.mendez@unt.edu.pe', '998333333', 'Asociado', 'Contratado', 'Fisica', 'Escuela de Fisica', NULL, 4, 'Tiempo Parcial', '62765432'),
('Pedro Antonio', 'Sanchez Ruiz', 'p.sanchez@unt.edu.pe', '993333333', 'Asociado', 'Contratado', 'Fisica', 'Escuela de Fisica', NULL, 4, 'Tiempo Parcial', '63345678');

-- Comunicacion (cursos: Lectura Critica, Tecnicas de Comunicacion)
INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios, modalidad, dni) VALUES
('Jorge Luis', 'Rios Gonzales', 'j.rios@unt.edu.pe', '994444444', 'Auxiliar', 'Contratado', 'Lengua y Literatura', 'Escuela de Lengua y Literatura', NULL, 3, 'Tiempo Parcial', '64345678');

-- Psicologia (cursos: Desarrollo Personal, Sicologia Organizacional)
INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios, modalidad, dni) VALUES
('Sheyla Laura', 'Escobedo Rodriguez', 's.escobedo@unt.edu.pe', '995523555', 'Auxiliar', 'Contratado', 'CC. Psicologicas', 'Escuela de CC. Psicologicas', NULL, 2, 'Tiempo Parcial', '65345678'),
('Bertha', 'Urtecho Zavaleta', 'b.urtecho@unt.edu.pe', '995555555', 'Auxiliar', 'Contratado', 'CC. Psicologicas', 'Escuela de CC. Psicologicas', NULL, 2, 'Tiempo Parcial', '66905678');

-- Filosofia/Etica (cursos: Etica, Cultura Investigativa)
INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios, modalidad, dni) VALUES
('Mariella', 'Pollio Rojas', 'm.pollio@unt.edu.pe', '996666666', 'Auxiliar', 'Contratado', 'Filosofia', 'Escuela de Filosofia', NULL, 3, 'Tiempo Parcial', '66345678');

-- Ciencias Sociales (cursos: Sociedad Cultura Ecologia)
INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios, modalidad, dni) VALUES
('Evans', 'Chiquez Chàvez', 'e.chiquez@unt.edu.pe', '965231011', 'Asociado', 'Contratado', 'Ciencias Sociales', 'Escuela de Ciencias Sociales', NULL, 5, 'Tiempo Parcial', '67345678'),
('Miguel Angel', 'Herrera Paredes', 'm.herrera@unt.edu.pe', '997777777', 'Auxiliar', 'Contratado', 'Ciencias Sociales', 'Escuela de Ciencias Sociales', NULL, 2, 'Tiempo Parcial', '68345678');

-- Administracion (cursos: Administracion General, Economia General, Contabilidad Gerencial, Finanzas Corporativas)
INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios, modalidad, dni) VALUES
('Ana', 'Cuadra Midzuaray', 'a.cuadra@unt.edu.pe', '998888888', 'Asociado', 'Contratado', 'Contabilidad y Finanzas', 'Contabilidad y Finanzas', NULL, 6, 'Tiempo Parcial', '69345678'),
('Juan', 'Carrascal Cabanillas', 'j.carrascal@unt.edu.pe', '998888268', 'Asociado', 'Contratado', 'Administracion', 'Escuela de Administracion', NULL, 5, 'Tiempo Parcial', '70345678');

-- Musica (curso: Taller de Musica - electivo de un solo semestre)
INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios, modalidad, dni) VALUES
('Fernando Jose', 'Rojas Vega', 'f.rojas@unt.edu.pe', '999000001', 'Auxiliar', 'Contratado', 'Estudios Generales', 'Escuela de Estudios Generales', '2026-1', 1, 'Tiempo Parcial', '71345678');

-- Danza Folklorica (curso: Taller de Danzas Folkloricas - electivo de un solo semestre)
INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios, modalidad, dni) VALUES
('Isabel Cristina', 'Luna Castillo', 'i.luna@unt.edu.pe', '999000002', 'Auxiliar', 'Contratado', 'Filosofía y Arte', 'Escuela de Artes', '2026-1', 1, 'Tiempo Parcial', '33345678');

-- Educacion Fisica (curso: Taller de Deporte - electivo de un solo semestre)
INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios, modalidad, dni) VALUES
('Raul Enrique', 'Paredes Quispe', 'r.paredes@unt.edu.pe', '999000003', 'Auxiliar', 'Contratado', 'Ciencias de la Educación', 'Escuela de Ciencias de la Educación', '2026-1', 1, 'Tiempo Parcial', '32345678');

-- Derecho (curso: Deontologia y Derecho Informatico)
INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios, modalidad, dni) VALUES
('Diana Carolina', 'Flores Ruiz', 'd.flores@unt.edu.pe', '999000004', 'Asociado', 'Contratado', 'Derecho', 'Escuela de Derecho', NULL, 4, 'Tiempo Parcial', '12340678');

-- Ingenieria Ambiental (curso: Ingenieria Ambiental)
INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios, modalidad, dni) VALUES
('Andres Felipe', 'Gomez Torres', 'a.gomez@unt.edu.pe', '999000005', 'Auxiliar', 'Contratado', 'Ingenieria Ambiental', 'Escuela de Ingenieria Ambiental', NULL, 2, 'Tiempo Parcial', '12345670');

-- Ingenieria Industrial (curso: Cadena de Suministros)
INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, especialidad, escuela, semestre_contrato, antiguedad_anios, modalidad, dni) VALUES
('Joe', ' Gonzalez Vasquez', 'j.gonzales@unt.edu.pe', '995608905', 'Auxiliar', 'Contratado', 'Ingeniería Industrial', 'Escuela de Ingeniería Industrial', NULL, 3, 'Tiempo Parcial', '10345678');

-- -------------------------------------------------------------
-- 3. Aulas de prueba
-- -------------------------------------------------------------
INSERT INTO aulas (codigo, nombre, capacidad, ubicacion, tipo) VALUES
('A201', 'Aula 201 - Postgrado', 50, 'Postgrado - Segundo Piso', 'Teoria'),
('A202', 'Aula 202 - Postgrado', 50, 'Postgrado - Segundo Piso', 'Teoria'),
('A301', 'Aula 301 - Postgrado', 45, 'Postgrado - Tercer Piso', 'Teoria'),
('A303', 'Aula 303 - Postgrado', 45, 'Postgrado - Tercer Piso', 'Teoria'),
('A306', 'Aula 306 - Postgrado', 50, 'Postgrado - Tercer Piso', 'Teoria'),
('A307', 'Aula 307 - Postgrado', 40, 'Postgrado - Tercer Piso', 'Teoria');

-- -------------------------------------------------------------
-- 4. Laboratorios de prueba
-- -------------------------------------------------------------
INSERT INTO laboratorios (codigo, nombre, capacidad, ubicacion) VALUES
('LAB01', 'Laboratorio 01', 25, 'Registro Técnico - Segundo Piso'),
('LAB02', 'Laboratorio 02', 25, 'Registro Técnico - Segundo Piso'),
('LAB03', 'Laboratorio 03', 20, 'Registro Técnico - Segundo Piso'),
('LAB04', 'Laboratorio 04', 20, 'Registro Técnico - Segundo Piso');

-- -------------------------------------------------------------
-- 5. habilitar_edicion_Docente
-- -------------------------------------------------------------
INSERT INTO configuracion (clave, valor) VALUES ('docentes_pueden_asignar', 'false');