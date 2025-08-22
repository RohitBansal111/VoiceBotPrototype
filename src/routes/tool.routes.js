/*
 * Routes for Tool management.
 */
const express = require('express');
const controller = require('../controllers/tool.controller');

const router = express.Router();

// Create a new tool data entry (stores into Data collection)
router.post('/', controller.create);

module.exports = router;


