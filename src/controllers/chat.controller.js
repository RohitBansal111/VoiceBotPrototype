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


