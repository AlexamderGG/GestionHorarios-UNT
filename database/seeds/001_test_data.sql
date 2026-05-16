-- ============================================================
-- SEEDS 001: Datos de prueba para desarrollo local
-- ============================================================
-- Incluye docentes de distintas categorias, cursos, aulas y 
-- laboratorios. Facilita el trabajo paralelo de los modulos.
-- ============================================================

-- --------------------------------------------------------------
-- 1. Docentes de prueba (jerarquia variada)
-- --------------------------------------------------------------
INSERT INTO docentes (nombres, apellidos, email, telefono, categoria, tipo_nombramiento, antiguedad_anios) VALUES
('Carlos Alberto', 'Ramirez Vega', 'c.ramirez@unt.edu.pe', '999111222', 'Principal', 'Nombrado', 15),
('Maria Elena', 'Santos Paredes', 'm.santos@unt.edu.pe', '999222333', 'Principal', 'Nombrado', 12),
('Luis Fernando', 'Castillo Rojas', 'l.castillo@unt.edu.pe', '999333444', 'Asociado', 'Nombrado', 8),
('Ana Lucia', 'Mendoza Torres', 'a.mendoza@unt.edu.pe', '999444555', 'Asociado', 'Nombrado', 5),
('Jorge Enrique', 'Vasquez Luna', 'j.vasquez@unt.edu.pe', '999555666', 'Auxiliar', 'Nombrado', 4),
('Diana Patricia', 'Fernandez Cruz', 'd.fernandez@unt.edu.pe', '999666777', 'Auxiliar', 'Nombrado', 2),
('Roberto Carlos', 'Diaz Herrera', 'r.diaz@unt.edu.pe', '999777888', 'Jefe de practica', 'Nombrado', 3),
('Patricia Isabel', 'Garcia Leon', 'p.garcia@unt.edu.pe', '999888999', 'Jefe de practica', 'Nombrado', 1),
('Pedro Antonio', 'Lopez Reyes', 'p.lopez@unt.edu.pe', '999000111', 'Asociado', 'Contratado', 3),
('Sandra Milagros', 'Quispe Campos', 's.quispe@unt.edu.pe', '999000222', 'Auxiliar', 'Contratado', 2),
('Miguel Angel', 'Ruiz Palacios', 'm.ruiz@unt.edu.pe', '999000333', 'Principal', 'Contratado', 5),
('Carmen Rosa', 'Paredes Villar', 'c.paredes@unt.edu.pe', '999000444', 'Asociado', 'Contratado', 1);

-- --------------------------------------------------------------
-- 2. Cursos de prueba
-- --------------------------------------------------------------
INSERT INTO cursos (codigo, nombre, creditos, semestre, ciclo) VALUES
('IS101', 'Introduccion a la Programacion', 4, 1, '2024-1'),
('IS102', 'Matematica Discreta', 4, 1, '2024-1'),
('IS201', 'Estructuras de Datos', 4, 2, '2024-1'),
('IS202', 'Programacion Orientada a Objetos', 4, 2, '2024-1'),
('IS301', 'Bases de Datos I', 4, 3, '2024-1'),
('IS302', 'Redes de Computadoras', 4, 3, '2024-1'),
('IS401', 'Ingenieria de Software', 4, 4, '2024-1'),
('IS402', 'Sistemas Operativos', 4, 4, '2024-1'),
('IS501', 'Inteligencia Artificial', 4, 5, '2024-1'),
('IS502', 'Seguridad Informatica', 4, 5, '2024-1'),
('IS601', 'Desarrollo Web Avanzado', 4, 6, '2024-1'),
('IS602', 'Arquitectura de Software', 4, 6, '2024-1');

-- --------------------------------------------------------------
-- 3. Aulas de prueba
-- --------------------------------------------------------------
INSERT INTO aulas (codigo, nombre, capacidad, ubicacion, tipo) VALUES
('A101', 'Aula 101 - Pabellon Central', 50, 'Pabellon Central - Planta Baja', 'Teoria'),
('A102', 'Aula 102 - Pabellon Central', 50, 'Pabellon Central - Planta Baja', 'Teoria'),
('A201', 'Aula 201 - Pabellon Central', 45, 'Pabellon Central - Segundo Piso', 'Teoria'),
('A202', 'Aula 202 - Pabellon Central', 45, 'Pabellon Central - Segundo Piso', 'Teoria'),
('AUD01', 'Auditorio Principal', 120, 'Pabellon Principal - Tercer Piso', 'Auditorio'),
('A301', 'Aula 301 - Pabellon Norte', 40, 'Pabellon Norte - Tercer Piso', 'Teoria');

-- --------------------------------------------------------------
-- 4. Laboratorios de prueba
-- --------------------------------------------------------------
INSERT INTO laboratorios (codigo, nombre, capacidad, ubicacion, especialidad) VALUES
('LAB01', 'Laboratorio de Programacion I', 25, 'Pabellon Central - Sotano', 'Programacion'),
('LAB02', 'Laboratorio de Programacion II', 25, 'Pabellon Central - Sotano', 'Programacion'),
('LAB03', 'Laboratorio de Redes', 20, 'Pabellon Norte - Planta Baja', 'Redes'),
('LAB04', 'Laboratorio de Bases de Datos', 20, 'Pabellon Norte - Planta Baja', 'Bases de Datos'),
('LAB05', 'Laboratorio de IA / Data Science', 20, 'Pabellon Norte - Segundo Piso', 'Inteligencia Artificial');

-- --------------------------------------------------------------
-- 5. Asignaciones docente-curso (mix de Teoria y Laboratorio)
-- --------------------------------------------------------------
-- Nota: En un sistema real estas asignaciones vienen de planificacion academica.
INSERT INTO asignacion_docente_curso (docente_id, curso_id, tipo, ambiente_preferido_id, semestre_asignacion) VALUES
-- Carlos Ramirez (Principal, Nombrado, 15 anios)
(1, 1, 'Teoria', 1, '2024-1'),
(1, 5, 'Teoria', 1, '2024-1'),
-- Maria Santos (Principal, Nombrado, 12 anios)
(2, 2, 'Teoria', 2, '2024-1'),
(2, 6, 'Teoria', 2, '2024-1'),
-- Luis Castillo (Asociado, Nombrado, 8 anios)
(3, 3, 'Teoria', 3, '2024-1'),
(3, 7, 'Teoria', 3, '2024-1'),
-- Ana Mendoza (Asociado, Nombrado, 5 anios)
(4, 4, 'Teoria', 4, '2024-1'),
(4, 8, 'Teoria', 4, '2024-1'),
-- Jorge Vasquez (Auxiliar, Nombrado, 4 anios)
(5, 1, 'Laboratorio', 1, '2024-1'),
(5, 9, 'Teoria', 5, '2024-1'),
-- Diana Fernandez (Auxiliar, Nombrado, 2 anios)
(6, 2, 'Laboratorio', 2, '2024-1'),
(6, 10, 'Teoria', 1, '2024-1'),
-- Roberto Diaz (Jefe de practica, Nombrado, 3 anios)
(7, 3, 'Laboratorio', 1, '2024-1'),
(7, 11, 'Teoria', 2, '2024-1'),
-- Patricia Garcia (Jefe de practica, Nombrado, 1 anio)
(8, 4, 'Laboratorio', 2, '2024-1'),
(8, 12, 'Teoria', 3, '2024-1'),
-- Pedro Lopez (Asociado, Contratado, 3 anios)
(9, 5, 'Laboratorio', 4, '2024-1'),
(9, 6, 'Laboratorio', 3, '2024-1'),
-- Sandra Quispe (Auxiliar, Contratado, 2 anios)
(10, 7, 'Laboratorio', 5, '2024-1'),
(10, 8, 'Laboratorio', 1, '2024-1'),
-- Miguel Ruiz (Principal, Contratado, 5 anios)
(11, 9, 'Laboratorio', 5, '2024-1'),
(11, 10, 'Teoria', 2, '2024-1'),
-- Carmen Paredes (Asociado, Contratado, 1 anio)
(12, 11, 'Laboratorio', 1, '2024-1'),
(12, 12, 'Laboratorio', 2, '2024-1');
