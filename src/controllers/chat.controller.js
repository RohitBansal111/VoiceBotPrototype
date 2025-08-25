const Joi = require("joi");
const { giminiCarChat } = require("../utils/helper/ginimimodel");
const Data = require("../models/Data");

// OpenAI API integration
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
});

const chatSchema = Joi.object({
  question: Joi.string().min(1).required(),
});

exports.ask = async (req, res, next) => {
  try {
    const { value, error } = chatSchema.validate(req.body, {
      abortEarly: false,
    });
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
  const newData = new Data({
    name: "Chat Interaction",
    data: JSON.stringify({
      body: req.body,
      headers: req.headers,
    }),
  });
  await newData.save();
  try {
    // Simplified validation schema matching Python FastAPI version
    const schema = Joi.object({
      messages: Joi.array()
        .items(
          Joi.object({
            role: Joi.string().required(),
            content: Joi.string().required(),
          })
        )
        .min(1)
        .required(),
      model: Joi.string().required(),
      temperature: Joi.number().min(0).max(2).optional().default(0.7),
      max_tokens: Joi.number().min(1).optional(),
      stream: Joi.boolean().optional().default(false),
      user_id: Joi.string().optional(),
    });

    const { value, error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: {
          message: error.message,
          type: "invalid_request_error",
          param: null,
          code: null,
        },
      });
    }

    // Handle user_id to user mapping (like Python version)
    const openaiRequest = { ...value };
    if (openaiRequest.user_id) {
      openaiRequest.user = openaiRequest.user_id;
      delete openaiRequest.user_id;
    }

    // Handle streaming response
    if (value.stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      try {
        const stream = await openai.chat.completions.create({
          ...openaiRequest,
          stream: true,
        });

        // Stream the response chunks
        for await (const chunk of stream) {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }

        res.write("data: [DONE]\n\n");
        return res.end();
      } catch (streamError) {
        console.error("OpenAI Streaming Error:", streamError);
        const errorChunk = {
          error: "Internal error occurred!",
        };

        const newData = new Data({
          name: "Chat Interaction Error",
          data: JSON.stringify({
            body: JSON.stringify(errorChunk),
          }),
        });
        await newData.save();
        res.write(`data: ${JSON.stringify(errorChunk)}\n\n`);
        return res.end();
      }
    }

    // Non-streaming response
    try {
      const chatCompletion = await openai.chat.completions.create(
        openaiRequest
      );
      return res.status(200).json(chatCompletion);
    } catch (openaiError) {
      console.error("OpenAI API Error:", openaiError);
      return res.status(500).json({
        error: {
          message: "Internal error occurred!",
          type: "internal_error",
          code: null,
        },
      });
    }
  } catch (err) {
    next(err);
  }
};
