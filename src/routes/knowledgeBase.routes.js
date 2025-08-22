/*
 * Routes for ElevenLabs Knowledge Base document management.
 */
const express = require('express');
const controller = require('../controllers/knowledgeBase.controller');

const router = express.Router();

// List documents
router.get('/', controller.listDocuments);

// Get single document
router.get('/:id', controller.getDocumentById);

// Create document (file, url, or text). We'll support JSON body specifying type and payload.
router.post('/', controller.createDocument);

// Update document metadata/content by id
router.put('/:id', controller.updateDocument);

// Update or create document content directly from raw text
router.put('/:id/text', controller.updateDocumentByText);

// Delete document
router.delete('/:id', controller.deleteDocument);

module.exports = router;


