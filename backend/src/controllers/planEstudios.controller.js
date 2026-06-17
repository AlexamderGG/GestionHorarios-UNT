const pool = require('../config/db');

exports.obtenerCursos = async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM cursos ORDER BY ciclo, nombre');
    res.json({ status: 'success', data: resultado.rows });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los cursos', error: error.message });
  }
};

exports.crearCurso = async (req, res) => {
  // 1. Recibimos la malla
  const { codigo, nombre, ciclo, creditos, horas_t, horas_p, horas_l, especialidad, semestre, malla } = req.body;
  try {
    const resultado = await pool.query(
      // 2. Insertamos la malla en la Base de Datos
      'INSERT INTO cursos (codigo, nombre, ciclo, creditos, horas_t, horas_p, horas_l, especialidad, semestre, malla) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [codigo, nombre, ciclo || 1, creditos || 0, horas_t || 0, horas_p || 0, horas_l || 0, especialidad || '', semestre || '', malla || '2018']
    );
    res.status(201).json({ status: 'success', data: resultado.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el curso. Verifica si el código ya existe.' });
  }
};

exports.actualizarCurso = async (req, res) => {
  const { id } = req.params;
  const { codigo, nombre, ciclo, creditos, horas_t, horas_p, horas_l, especialidad, semestre, malla } = req.body;
  try {
    const resultado = await pool.query(
      // 3. Actualizamos la malla
      'UPDATE cursos SET codigo = $1, nombre = $2, ciclo = $3, creditos = $4, horas_t = $5, horas_p = $6, horas_l = $7, especialidad = $8, semestre = $9, malla = $10 WHERE id = $11 RETURNING *',
      [codigo, nombre, ciclo || 1, creditos || 0, horas_t || 0, horas_p || 0, horas_l || 0, especialidad || '', semestre || '', malla || '2018', id]
    );
    if (resultado.rows.length === 0) return res.status(404).json({ message: 'Curso no encontrado' });
    res.json({ status: 'success', data: resultado.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el curso' });
  }
};

exports.eliminarCurso = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM cursos WHERE id = $1', [id]);
    res.json({ status: 'success', message: 'Curso eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el curso' });
  }
};