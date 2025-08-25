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
      tools: Joi.array().optional(),
      tool_choice: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
      parallel_tool_calls: Joi.boolean().optional(),
      stream_options: Joi.object().optional(),
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

    // Handle tool calls if present
    if (value.tools && value.tools.length > 0) {
      // For ElevenLabs tool calls, we need to handle them specially
      const toolCalls = [];
      
      for (const tool of value.tools) {
        if (tool.type === 'function' && tool.function) {
          // Handle specific tools like CallDataTool
          if (tool.function.name === 'CallDataTool') {
            toolCalls.push({
              id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: 'function',
              function: {
                name: 'CallDataTool',
                arguments: JSON.stringify({
                  messages: value.messages,
                  voice_bot_id: req.headers['voice_bot_id'],
                  timestamp: new Date().toISOString(),
                  status: 'processed'
                })
              }
            });
          } else {
            // Handle other function tools
            toolCalls.push({
              id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: 'function',
              function: {
                name: tool.function.name,
                arguments: JSON.stringify({ message: 'Tool call processed' })
              }
            });
          }
        }
      }

      // If we have tool calls and streaming is requested, return them immediately
      if (value.stream && toolCalls.length > 0) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Send tool calls as stream chunks
        const toolCallChunk = {
          id: `chatcmpl_${Math.random().toString(36).substr(2, 9)}`,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: value.model,
          choices: [{
            index: 0,
            delta: {
              role: 'assistant',
              content: null,
              tool_calls: toolCalls
            },
            finish_reason: 'tool_calls'
          }]
        };

        res.write(`data: ${JSON.stringify(toolCallChunk)}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      }

      // For non-streaming tool calls, return the response with tool calls
      if (toolCalls.length > 0) {
        const response = {
          id: `chatcmpl_${Math.random().toString(36).substr(2, 9)}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: value.model,
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: null,
              tool_calls: toolCalls
            },
            finish_reason: 'tool_calls'
          }],
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0
          }
        };

        return res.status(200).json(response);
      }
    }

    // Handle streaming response
    if (value.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      try {
        const stream = await openai.chat.completions.create({
          ...openaiRequest,
          stream: true
        });

        // Stream the response chunks
        for await (const chunk of stream) {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
        
        res.write('data: [DONE]\n\n');
        return res.end();
      } catch (streamError) {
        console.error('OpenAI Streaming Error:', streamError);
        const errorChunk = {
          error: 'Internal error occurred!'
        };
        res.write(`data: ${JSON.stringify(errorChunk)}\n\n`);
        return res.end();
      }
    }

    // Non-streaming response
    try {
      const chatCompletion = await openai.chat.completions.create(openaiRequest);
      return res.status(200).json(chatCompletion);
    } catch (openaiError) {
      console.error('OpenAI API Error:', openaiError);
      return res.status(500).json({
        error: {
          message: 'Internal error occurred!',
          type: "internal_error",
          code: null,
        },
      });
    }
  } catch (err) {
    next(err);
  }
};
