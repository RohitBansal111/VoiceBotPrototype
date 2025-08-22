const Joi = require('joi');
const { giminiCarChat } = require('../utils/helper/ginimimodel');
const Data = require('../models/Data');

// OpenAI API integration
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
});

const chatSchema = Joi.object({
    question: Joi.string().min(1).required()
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
    const schema = Joi.object({
      model: Joi.string().required(),
      messages: Joi.array()
        .items(
          Joi.object({
            role: Joi.string()
              .valid("system", "user", "assistant", "tool", "function")
              .required(),
            content: Joi.alternatives()
              .try(
                Joi.string(),
                Joi.array().items(
                  Joi.object({
                    type: Joi.string().optional(),
                    text: Joi.string().optional(),
                    image_url: Joi.any().optional(),
                  })
                )
              )
              .required(),
            name: Joi.string().optional(),
            tool_call_id: Joi.string().optional(),
          })
        )
        .min(1)
        .required(),
      temperature: Joi.number().min(0).max(2).optional(),
      top_p: Joi.number().min(0).max(1).optional(),
      n: Joi.number().min(1).optional(),
      stream: Joi.boolean().optional(),
      stop: Joi.alternatives()
        .try(Joi.string(), Joi.array().items(Joi.string()))
        .optional(),
      max_tokens: Joi.number().min(1).optional(),
      max_completion_tokens: Joi.number().min(1).optional(),
      presence_penalty: Joi.number().min(-2).max(2).optional(),
      frequency_penalty: Joi.number().min(-2).max(2).optional(),
      logit_bias: Joi.object().pattern(Joi.string(), Joi.number()).optional(),
      user: Joi.string().optional(),
      logprobs: Joi.boolean().optional(),
      top_logprobs: Joi.number().min(0).max(20).optional(),
      response_format: Joi.object({
        type: Joi.string()
          .valid("text", "json_object", "json_schema")
          .optional(),
        json_schema: Joi.object().optional(),
      }).optional(),
      seed: Joi.number().optional(),
      tools: Joi.array()
        .items(
          Joi.object({
            type: Joi.string().valid("function").required(),
            function: Joi.object({
              name: Joi.string().required(),
              description: Joi.string().optional(),
              parameters: Joi.object().optional(),
            }).required(),
          })
        )
        .optional(),
      tool_choice: Joi.alternatives()
        .try(
          Joi.string().valid("none", "auto", "required"),
          Joi.object({
            type: Joi.string().valid("function").required(),
            function: Joi.object({
              name: Joi.string().required(),
            }).required(),
          })
        )
        .optional(),
      parallel_tool_calls: Joi.boolean().optional(),
      metadata: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
      safety_identifier: Joi.string().optional(),
      prompt_cache_key: Joi.string().optional(),
      service_tier: Joi.string()
        .valid("auto", "default", "flex", "priority")
        .optional(),
      store: Joi.boolean().optional(),
      verbosity: Joi.string().valid("low", "medium", "high").optional(),
      reasoning_effort: Joi.string()
        .valid("minimal", "low", "medium", "high")
        .optional(),
      modalities: Joi.array()
        .items(Joi.string().valid("text", "audio"))
        .optional(),
      audio: Joi.object({
        voice: Joi.string().optional(),
        response_format: Joi.string()
          .valid("mp3", "opus", "aac", "flac")
          .optional(),
        speed: Joi.number().min(0.25).max(4.0).optional(),
      }).optional(),
      web_search_options: Joi.object({
        search_query: Joi.string().optional(),
        search_results: Joi.array().optional(),
      }).optional(),
      prediction: Joi.object({
        type: Joi.string().valid("file").required(),
        file_id: Joi.string().required(),
        version: Joi.string().optional(),
      }).optional(),
      stream_options: Joi.object({
        max_tokens: Joi.number().optional(),
        top_p: Joi.number().optional(),
        temperature: Joi.number().optional(),
        presence_penalty: Joi.number().optional(),
        frequency_penalty: Joi.number().optional(),
        logit_bias: Joi.object().pattern(Joi.string(), Joi.number()).optional(),
        stop: Joi.alternatives()
          .try(Joi.string(), Joi.array().items(Joi.string()))
          .optional(),
        max_completion_tokens: Joi.number().optional(),
        logprobs: Joi.boolean().optional(),
        top_logprobs: Joi.number().min(0).max(20).optional(),
        response_format: Joi.object({
          type: Joi.string()
            .valid("text", "json_object", "json_schema")
            .optional(),
          json_schema: Joi.object().optional(),
        }).optional(),
        seed: Joi.number().optional(),
        tools: Joi.array()
          .items(
            Joi.object({
              type: Joi.string().valid("function").required(),
              function: Joi.object({
                name: Joi.string().required(),
                description: Joi.string().optional(),
                parameters: Joi.object().optional(),
              }).required(),
            })
          )
          .optional(),
        tool_choice: Joi.alternatives()
          .try(
            Joi.string().valid("none", "auto", "required"),
            Joi.object({
              type: Joi.string().valid("function").required(),
              function: Joi.object({
                name: Joi.string().required(),
              }).required(),
            })
          )
          .optional(),
        parallel_tool_calls: Joi.boolean().optional(),
        metadata: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
        safety_identifier: Joi.string().optional(),
        prompt_cache_key: Joi.string().optional(),
        service_tier: Joi.string()
          .valid("auto", "default", "flex", "priority")
          .optional(),
        store: Joi.boolean().optional(),
        verbosity: Joi.string().valid("low", "medium", "high").optional(),
        reasoning_effort: Joi.string()
          .valid("minimal", "low", "medium", "high")
          .optional(),
        modalities: Joi.array()
          .items(Joi.string().valid("text", "audio"))
          .optional(),
        audio: Joi.object({
          voice: Joi.string().optional(),
          response_format: Joi.string()
            .valid("mp3", "opus", "aac", "flac")
            .optional(),
          speed: Joi.number().min(0.25).max(4.0).optional(),
        }).optional(),
        web_search_options: Joi.object({
          search_query: Joi.string().optional(),
          search_results: Joi.array().optional(),
        }).optional(),
        prediction: Joi.object({
          type: Joi.string().valid("file").required(),
          file_id: Joi.string().required(),
          version: Joi.string().optional(),
        }).optional(),
      }).optional(),
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

    // Store request data for debugging
    const newData = new Data({
      name: "Chat Interaction",
      data: JSON.stringify({
        body: req.body,
        headers: req.headers,
      }),
    });
    await newData.save();

    // Basic behavior: take the latest user message and generate an answer via OpenAI
    const lastUserMessage = [...value.messages].reverse().find(m => m.role === 'user');
    const prompt = typeof lastUserMessage?.content === 'string'
        ? lastUserMessage.content
        : Array.isArray(lastUserMessage?.content)
            ? lastUserMessage.content.map(part => part.text).filter(Boolean).join('\n')
            : '';

    // Call OpenAI API instead of Gemini
    let answerText = '';
    let toolCalls = [];
    let openaiResponse;
    try {
        openaiResponse = await openai.chat.completions.create({
            model: value.model || 'gpt-3.5-turbo',
            messages: value.messages,
            temperature: value.temperature,
            top_p: value.top_p,
            n: value.n || 1,
            max_tokens: value.max_completion_tokens || value.max_tokens,
            presence_penalty: value.presence_penalty,
            frequency_penalty: value.frequency_penalty,
            logit_bias: value.logit_bias,
            user: value.user,
            logprobs: value.logprobs,
            top_logprobs: value.top_logprobs,
            response_format: value.response_format,
            seed: value.seed,
            tools: value.tools,
            tool_choice: value.tool_choice,
            parallel_tool_calls: value.parallel_tool_calls,
            metadata: value.metadata,
            safety_identifier: value.safety_identifier,
            prompt_cache_key: value.prompt_cache_key,
            service_tier: value.service_tier,
            store: value.store,
            verbosity: value.verbosity,
            reasoning_effort: value.reasoning_effort,
            modalities: value.modalities,
            audio: value.audio,
            web_search_options: value.web_search_options,
            prediction: value.prediction,
            stream: false // We'll handle streaming separately
        });

        // Extract the response content
        if (openaiResponse.choices && openaiResponse.choices.length > 0) {
            const choice = openaiResponse.choices[0];
            if (choice.message && choice.message.content) {
                answerText = choice.message.content;
            }
            // Handle tool calls if present
            if (choice.message && choice.message.tool_calls) {
                toolCalls = choice.message.tool_calls;
            }
        }
    } catch (openaiError) {
        console.error('OpenAI API Error:', openaiError);
        // Fallback to a simple response if OpenAI fails
        answerText = `I apologize, but I'm experiencing technical difficulties. Please try again later. (Error: ${openaiError.message})`;
    }

    // Handle response format
    let formattedContent = answerText;
    if (value.response_format && value.response_format.type === 'json_object') {
        try {
            // Try to parse the response as JSON, if it fails, wrap it in a JSON object
            JSON.parse(answerText);
            formattedContent = answerText;
        } catch {
            formattedContent = JSON.stringify({ response: answerText });
        }
    }

    // Handle max tokens
    const maxTokens = value.max_completion_tokens || value.max_tokens;
    if (maxTokens && formattedContent.length > maxTokens) {
        formattedContent = formattedContent.substring(0, maxTokens);
    }

    // Handle stop sequences
    if (value.stop) {
        const stopSequences = Array.isArray(value.stop) ? value.stop : [value.stop];
        for (const stopSeq of stopSequences) {
            const stopIndex = formattedContent.indexOf(stopSeq);
            if (stopIndex !== -1) {
                formattedContent = formattedContent.substring(0, stopIndex);
                break;
            }
        }
    }

    // Handle tool calls if tools are provided
    // Note: Tool calls are now handled by OpenAI directly
    // This section is kept for backward compatibility but not actively used

    // Construct OpenAI-like response
    const now = Math.floor(Date.now() / 1000);
    const completionId = `chatcmpl_${Math.random().toString(36).slice(2)}`;

    // Handle streaming response
    if (value.stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        try {
            // Use OpenAI's native streaming
            const stream = await openai.chat.completions.create({
                model: value.model || 'gpt-3.5-turbo',
                messages: value.messages,
                temperature: value.temperature,
                top_p: value.top_p,
                n: value.n || 1,
                max_tokens: value.max_completion_tokens || value.max_tokens,
                presence_penalty: value.presence_penalty,
                frequency_penalty: value.frequency_penalty,
                logit_bias: value.logit_bias,
                user: value.user,
                logprobs: value.logprobs,
                top_logprobs: value.top_logprobs,
                response_format: value.response_format,
                seed: value.seed,
                tools: value.tools,
                tool_choice: value.tool_choice,
                parallel_tool_calls: value.parallel_tool_calls,
                metadata: value.metadata,
                safety_identifier: value.safety_identifier,
                prompt_cache_key: value.prompt_cache_key,
                service_tier: value.service_tier,
                store: value.store,
                verbosity: value.verbosity,
                reasoning_effort: value.reasoning_effort,
                modalities: value.modalities,
                audio: value.audio,
                web_search_options: value.web_search_options,
                prediction: value.prediction,
                stream: true
            });

            // Forward the stream directly from OpenAI
            for await (const chunk of stream) {
                res.write(`data: ${JSON.stringify(chunk)}\n\n`);
            }
            
            res.write('data: [DONE]\n\n');
            return res.end();
        } catch (streamError) {
            console.error('OpenAI Streaming Error:', streamError);
            // Send error chunk
            const errorChunk = {
                id: completionId,
                object: 'chat.completion.chunk',
                created: now,
                model: value.model,
                choices: [{
                    index: 0,
                    delta: {
                        content: `Error: ${streamError.message}`
                    },
                    finish_reason: 'stop',
                    logprobs: null
                }]
            };
            res.write(`data: ${JSON.stringify(errorChunk)}\n\n`);
            res.write('data: [DONE]\n\n');
            return res.end();
        }
    }

    // Non-streaming response
    const n = value.n || 1;
    const choices = [];
    
    // Use OpenAI's response structure directly
    if (openaiResponse && openaiResponse.choices) {
        choices.push(...openaiResponse.choices);
    } else {
        // Fallback response if OpenAI failed
        choices.push({
            index: 0,
            message: {
                role: 'assistant',
                content: formattedContent,
                tool_calls: toolCalls.length > 0 ? toolCalls : undefined
            },
            finish_reason: toolCalls.length > 0 ? 'tool_calls' : 'stop',
            logprobs: value.logprobs ? {
                content: formattedContent.split(' ').map((_, i) => ({
                    token: formattedContent.split(' ')[i] || '',
                    logprob: -0.1,
                    top_logprobs: value.top_logprobs ? [{
                        token: formattedContent.split(' ')[i] || '',
                        logprob: -0.1
                    }] : undefined
                }))
            } : null
        });
    }

    const response = {
        id: completionId,
        object: 'chat.completion',
        created: now,
        model: value.model,
        choices: choices,
        usage: openaiResponse?.usage || {
            prompt_tokens: prompt ? prompt.length : 0,
            completion_tokens: formattedContent.length,
            total_tokens: (prompt ? prompt.length : 0) + formattedContent.length
        }
    };

    // Add optional response fields
    if (value.service_tier) {
      response.service_tier = value.service_tier;
    }

    if (value.seed) {
      response.system_fingerprint = `fp_${value.seed}`;
    }

    if (value.metadata) {
      response.metadata = value.metadata;
    }

    if (value.safety_identifier) {
      response.safety_identifier = value.safety_identifier;
    }

    if (value.prompt_cache_key) {
      response.prompt_cache_key = value.prompt_cache_key;
    }

    if (value.verbosity) {
        response.verbosity = value.verbosity;
    }

    if (value.reasoning_effort) {
        response.reasoning_effort = value.reasoning_effort;
    }

    if (value.modalities) {
        response.modalities = value.modalities;
    }

    if (value.audio) {
        response.audio = value.audio;
    }

    if (value.web_search_options) {
        response.web_search_options = value.web_search_options;
    }

    if (value.prediction) {
        response.prediction = value.prediction;
    }

    if (value.parallel_tool_calls !== undefined) {
        response.parallel_tool_calls = value.parallel_tool_calls;
    }

    if (value.store !== undefined) {
        response.store = value.store;
    }

    if (value.logit_bias) {
        response.logit_bias = value.logit_bias;
    }

    if (value.stream_options) {
        response.stream_options = value.stream_options;
    }

    return res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};
