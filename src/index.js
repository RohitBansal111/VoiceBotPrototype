/*
 * Express application bootstrap.
 *
 * Exposes REST endpoints to manage ElevenLabs Knowledge Base documents:
 * - List documents
 * - Get a document by id
 * - Create a document
 * - Update a document
 * - Delete a document
 * - Update-by-text (sends plain text content)
 *
 * Configuration via environment variables; see README.md
 */

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env first
dotenv.config();

// Import database connection
const connectDB = require('./config/database');

const kbRoutes = require('./routes/knowledgeBase.routes');
const chatRoutes = require('./routes/chat.routes');
const dataRoutes = require('./routes/data.routes');
const toolRoutes = require('./routes/tool.routes');
const webhookRoutes = require('./routes/webhook.routes');

const app = express();

// Global middlewares
app.use(cors());
app.use(express.json({ limit: '2mb', verify: (req, _res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: true, verify: (req, _res, buf) => { req.rawBody = buf; } }));
app.use(morgan('dev'));

// Health route
app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'prototype-voice-bot', timestamp: Date.now() });
});

// Knowledge base routes
app.use('/api/knowledge-base', kbRoutes);

// Chat routes
app.use('/api/chat', chatRoutes);

// Data routes
app.use('/api/data', dataRoutes);

// Tool routes
app.use('/api/tools', toolRoutes);

// Webhook routes (HMAC verified)
app.use('/api/webhooks', webhookRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', path: req.path });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;

// Connect to MongoDB before starting the server
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            // eslint-disable-next-line no-console
            console.log(`Server listening on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;


