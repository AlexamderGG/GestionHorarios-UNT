const express = require("express");
const router = express.Router();
// 👇 CORREGIDO: Ruta limpia sin repetición
const ExcepcionController = require("../controllers/excepcion.controller");
const { authenticate } = require("../middleware/auth");

// Rutas mapeadas a la raíz porque el prefijo '/excepciones' ya lo maneja el index.js
router.post("/", authenticate, ExcepcionController.crear);
router.get("/", authenticate, ExcepcionController.listarMisExcepciones);

module.exports = router;