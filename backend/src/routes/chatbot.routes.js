const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbot.controller');

// Esta es la ruta que consumirá el Frontend
router.post('/preguntar', chatbotController.preguntarBot);

module.exports = router;