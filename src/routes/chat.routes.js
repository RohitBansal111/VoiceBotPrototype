const express = require('express');
const controller = require('../controllers/chat.controller');

const router = express.Router();

// Ask a question to the car-only chat model
router.post('/', controller.ask);

module.exports = router;


