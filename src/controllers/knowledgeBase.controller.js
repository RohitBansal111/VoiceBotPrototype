/*
 * Controller functions for ElevenLabs Knowledge Base endpoints.
 *
 * Delegates HTTP communication to the service layer.
 */
const Joi = require('joi');
const service = require('../services/knowledgeBase.service');

// Schemas for validation
const paginationQuerySchema = Joi.object({
    cursor: Joi.string().allow(null, ''),
    page_size: Joi.number().integer().min(1).max(100).default(30),
    search: Joi.string().allow(null, ''),
    show_only_owned_documents: Joi.boolean().default(false),
    types: Joi.array().items(Joi.string().valid('file', 'url', 'text')).single(),
    use_typesense: Joi.boolean().default(false)
});

const createSchema = Joi.object({
    // one of: url, text (file uploads require multipart, not supported in this simple scaffold)
    type: Joi.string().valid('url', 'text').required(),
    name: Joi.string().required(),
    // payload depending on type
    url: Joi.string().uri().when('type', { is: 'url', then: Joi.required() }),
    text: Joi.string().when('type', { is: 'text', then: Joi.required() }),
    // optional metadata fields if supported by API
    metadata: Joi.object().optional()
});

const updateSchema = Joi.object({
    name: Joi.string().optional(),
    url: Joi.string().uri().optional(),
    text: Joi.string().optional(),
    metadata: Joi.object().optional()
});

const updateByTextSchema = Joi.object({
    text: Joi.string().min(1).required(),
    name: Joi.string().optional(),
    metadata: Joi.object().optional()
});

exports.listDocuments = async (req, res, next) => {
    try {
        const { value, error } = paginationQuerySchema.validate(req.query);
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        const result = await service.listDocuments(value);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.getDocumentById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const doc = await service.getDocumentById(id);
        res.json(doc);
    } catch (err) {
        next(err);
    }
};

exports.createDocument = async (req, res, next) => {
    try {
        console.log(req.body,"req.body");
        const { value, error } = createSchema.validate(req.body, { abortEarly: false });
        console.log(value,"value");
        console.log(error,"error");
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        const created = await service.createDocument(value);
        res.status(201).json(created);
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.updateDocument = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { value, error } = updateSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        const updated = await service.updateDocument(id, value);
        res.json(updated);
    } catch (err) {
        next(err);
    }
};

exports.updateDocumentByText = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(req.body,"req.body");
        const { value, error } = updateByTextSchema.validate(req.body, { abortEarly: false });
        console.log(value,"value");
        console.log(error,"error");
        if (error) {
            console.error(error);
            return res.status(400).json({ error: error.message });
        }
        const updated = await service.updateDocumentByText(id, value);
        res.json(updated);
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.deleteDocument = async (req, res, next) => {
    try {
        const { id } = req.params;
        await service.deleteDocument(id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
};


