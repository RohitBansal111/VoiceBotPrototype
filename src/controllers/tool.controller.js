/*
 * Controller for Tool management.
 *
 * Provides a POST endpoint to store entries in MongoDB using the `Data` model.
 */
const Joi = require('joi');
const Data = require('../models/Data');

const createSchema = Joi.object({
    name: Joi.string().trim().min(1).required(),
    data: Joi.string().trim().min(1).optional()
});

exports.create = async (req, res, next) => {
    try {
        const { value, error } = createSchema.validate(req.body, { abortEarly: false });
        console.log(value,error);
        if (error) {
            return res.status(400).json({ error: error.message });
        }

        const newData = new Data({
            name: value.name,
            data: JSON.stringify(value.data)
        });

        const saved = await newData.save();
        return res.status(201).json({
            message: 'Tool data stored successfully',
            data: saved
        });
    } catch (err) {
        return next(err);
    }
};


