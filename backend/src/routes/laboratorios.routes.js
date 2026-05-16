const express = require('express');
const router = express.Router();
const LaboratorioController = require('../controllers/laboratorio.controller');

/**
 * @route   GET /api/laboratorios
 * @desc    Listar todos los laboratorios activos
 * @module  Modulo 1 - Gestion de datos maestros
 */
router.get('/', LaboratorioController.getAll);

/**
 * @route   GET /api/laboratorios/:id
 * @desc    Obtener un laboratorio por ID
 * @module  Modulo 1
 */
router.get('/:id', LaboratorioController.getById);

/**
 * @route   POST /api/laboratorios
 * @desc    Crear un nuevo laboratorio
 * @module  Modulo 1
 * @body    { codigo, nombre, capacidad, ubicacion, especialidad }
 */
router.post('/', LaboratorioController.create);

/**
 * @route   PUT /api/laboratorios/:id
 * @desc    Actualizar un laboratorio
 * @module  Modulo 1
 */
router.put('/:id', LaboratorioController.update);

/**
 * @route   DELETE /api/laboratorios/:id
 * @desc    Eliminar (soft-delete) un laboratorio
 * @module  Modulo 1
 */
router.delete('/:id', LaboratorioController.delete);

module.exports = router;
