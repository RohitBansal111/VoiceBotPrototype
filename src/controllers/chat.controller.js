const Joi = require('joi');
const { giminiCarChat } = require('../utils/helper/ginimimodel');

const chatSchema = Joi.object({
    question: Joi.string().min(1).required()
});

exports.ask = async (req, res, next) => {
    try {
        const { value, error } = chatSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({ error: error.message });
        }

        const answer = await giminiCarChat(value.question);
        res.json({ question: value.question, answer });
    } catch (err) {
        next(err);
    }
};

// OpenAI-compatible: Create Chat Completions
// Mirrors POST /v1/chat/completions request/response
exports.createChatCompletions = async (req, res, next) => {
    try {
        const schema = Joi.object({
            model: Joi.string(),
            messages: Joi.array().items(
                Joi.object({
                    role: Joi.string().valid('system', 'user', 'assistant', 'tool', 'function').required(),
                    content: Joi.alternatives().try(
                        Joi.string(),
                        Joi.array().items(
                            Joi.object({
                                type: Joi.string().optional(),
                                text: Joi.string().optional(),
                                image_url: Joi.any().optional()
                            })
                        )
                    ).required(),
                    name: Joi.string().optional(),
                    tool_call_id: Joi.string().optional()
                })
            ).min(1).required(),
            temperature: Joi.number().min(0).max(2).optional(),
            top_p: Joi.number().min(0).max(1).optional(),
            n: Joi.number().min(1).optional(),
            stream: Joi.boolean().optional(),
            stop: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
            max_tokens: Joi.number().min(1).optional(),
            presence_penalty: Joi.number().min(-2).max(2).optional(),
            frequency_penalty: Joi.number().min(-2).max(2).optional(),
            logit_bias: Joi.object().pattern(Joi.string(), Joi.number()).optional(),
            user: Joi.string().optional()
        });

        const { value, error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Basic behavior: take the latest user message and generate an answer via giminiCarChat
        const lastUserMessage = [...value.messages].reverse().find(m => m.role === 'user');
        const prompt = typeof lastUserMessage?.content === 'string'
            ? lastUserMessage.content
            : Array.isArray(lastUserMessage?.content)
                ? lastUserMessage.content.map(part => part.text).filter(Boolean).join('\n')
                : '';

        const answerText = prompt ? await giminiCarChat(prompt) : '';

        // Construct OpenAI-like response
        const now = Math.floor(Date.now() / 1000);
        const completionId = `chatcmpl_${Math.random().toString(36).slice(2)}`;

        const response = {
            id: completionId,
            object: 'chat.completion',
            created: now,
            model: value.model,
            choices: [
                {
                    index: 0,
                    message: {
                        role: 'assistant',
                        content: answerText
                    },
                    finish_reason: 'stop',
                }
            ],
            usage: {
                prompt_tokens: prompt ? prompt.length : 0,
                completion_tokens: answerText.length,
                total_tokens: (prompt ? prompt.length : 0) + answerText.length
            }
        };

        return res.status(200).json(response);
    } catch (err) {
        next(err);
    }
};


