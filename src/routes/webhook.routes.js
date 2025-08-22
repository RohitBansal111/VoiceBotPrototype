const express = require('express');
const router = express.Router();

const { receiveElevenLabsWebhook, preCallElavenLabsWebhook, postCallElavenLabsWebhook, toolCallElavenLabsWebhook } = require('../controllers/webhook.controller');

// ElevenLabs webhook endpoint
router.post('/elevenlabs-pre', preCallElavenLabsWebhook);

router.post('/elevenlabs-post', postCallElavenLabsWebhook);

router.get('/elevenlabs-post', postCallElavenLabsWebhook);

router.post('/elevenlabs-tool', toolCallElavenLabsWebhook);


module.exports = router;


