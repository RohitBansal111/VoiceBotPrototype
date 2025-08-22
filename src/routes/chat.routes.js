const express = require('express');
const controller = require('../controllers/chat.controller');

const router = express.Router();

// Ask a question to the car-only chat model
router.post('/', controller.ask);

// OpenAI-compatible Create Chat Completions endpoint
router.post('/v1/chat/completions', controller.createChatCompletions);

// ElevenLabs expected endpoint - matches OpenAI API format
router.post('/chat/completions', controller.createChatCompletions);

module.exports = router;


