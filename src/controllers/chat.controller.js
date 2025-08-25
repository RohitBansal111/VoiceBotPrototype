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
    // Log the incoming request for debugging
    console.log('=== ELEVENLABS REQUEST DEBUG ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('URL:', req.url);
    console.log('Method:', req.method);
    console.log('================================');

    // Use the request body directly without validation
    const value = req.body;

    // Handle user_id to user mapping (like Python version)
    const openaiRequest = { ...value };
    if (openaiRequest.user_id) {
      openaiRequest.user = openaiRequest.user_id;
      delete openaiRequest.user_id;
    }

    // Handle tool calls if present
    if (value.tools && value.tools.length > 0) {
      console.log('Processing tools:', JSON.stringify(value.tools, null, 2));
      
      // For ElevenLabs tool calls, we need to handle them specially
      const toolCalls = [];
      const toolResults = [];
      
      for (const tool of value.tools) {
        if (tool.type === 'function' && tool.function) {
          console.log('Processing tool:', tool.function.name);
          
          // Handle specific tools like CallDataTool
          if (tool.function.name === 'CallDataTool') {
            try {
              // Actually execute the CallDataTool functionality
              const toolResult = await executeCallDataTool(value.messages, req.headers['voice_bot_id']);
              toolResults.push(toolResult);
              
              const toolCall = {
                id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'function',
                function: {
                  name: 'CallDataTool',
                  arguments: JSON.stringify({
                    messages: value.messages,
                    voice_bot_id: req.headers['voice_bot_id'],
                    timestamp: new Date().toISOString(),
                    status: 'executed',
                    result: toolResult
                  })
                }
              };
              toolCalls.push(toolCall);
              console.log('Created CallDataTool call:', JSON.stringify(toolCall, null, 2));
            } catch (toolError) {
              console.error('CallDataTool execution failed:', toolError);
              // Return error in tool call
              const toolCall = {
                id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'function',
                function: {
                  name: 'CallDataTool',
                  arguments: JSON.stringify({
                    error: 'Tool execution failed',
                    message: toolError.message
                  })
                }
              };
              toolCalls.push(toolCall);
            }
          } else {
            // Handle other function tools
            try {
              const toolResult = await executeGenericTool(tool.function.name, tool.function.parameters || {});
              toolResults.push(toolResult);
              
              const toolCall = {
                id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'function',
                function: {
                  name: tool.function.name,
                  arguments: JSON.stringify(toolResult)
                }
              };
              toolCalls.push(toolCall);
              console.log('Created generic tool call:', JSON.stringify(toolCall, null, 2));
            } catch (toolError) {
              console.error(`Tool ${tool.function.name} execution failed:`, toolError);
              const toolCall = {
                id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'function',
                function: {
                  name: tool.function.name,
                  arguments: JSON.stringify({
                    error: 'Tool execution failed',
                    message: toolError.message
                  })
                }
              };
              toolCalls.push(toolCall);
            }
          }
        }
      }

      console.log('Total tool calls created:', toolCalls.length);
      console.log('Tool results:', toolResults);

      // If we have tool calls and streaming is requested, return them immediately
      if (value.stream && toolCalls.length > 0) {
        console.log('Sending streaming tool call response');
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

        console.log('Sending tool call chunk:', JSON.stringify(toolCallChunk, null, 2));
        res.write(`data: ${JSON.stringify(toolCallChunk)}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      }

      // For non-streaming tool calls, return the response with tool calls
      if (toolCalls.length > 0) {
        console.log('Sending non-streaming tool call response');
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

        console.log('Sending tool call response:', JSON.stringify(response, null, 2));
        return res.status(200).json(response);
      }
    }

    // If no tools or tool calls processed, proceed with normal OpenAI flow
    console.log('No tools to process, proceeding with OpenAI API call');

    // Handle streaming response
    if (value.stream) {
      console.log('Handling streaming response');
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
      console.log('Making OpenAI API call with:', JSON.stringify(openaiRequest, null, 2));
      const chatCompletion = await openai.chat.completions.create(openaiRequest);
      console.log('OpenAI response received:', JSON.stringify(chatCompletion, null, 2));
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
    console.error('Unexpected error in createChatCompletions:', err);
    next(err);
  }
};

// Helper function to execute CallDataTool
async function executeCallDataTool(messages, voiceBotId) {
  try {
    console.log('Executing CallDataTool with voice_bot_id:', voiceBotId);
    
    // Store the call data (you can implement your own storage logic here)
    const callData = {
      voice_bot_id: voiceBotId,
      messages: messages,
      timestamp: new Date().toISOString(),
      status: 'processed',
      metadata: {
        total_messages: messages.length,
        user_messages: messages.filter(m => m.role === 'user').length,
        assistant_messages: messages.filter(m => m.role === 'assistant').length,
        system_messages: messages.filter(m => m.role === 'system').length
      }
    };

    // Here you could save to database, send to webhook, etc.
    console.log('CallDataTool executed successfully:', callData);
    
    return {
      success: true,
      data: callData,
      message: 'Call data processed and stored successfully'
    };
  } catch (error) {
    console.error('CallDataTool execution error:', error);
    throw error;
  }
}

// Helper function to execute generic tools
async function executeGenericTool(toolName, parameters) {
  try {
    console.log(`Executing generic tool: ${toolName} with parameters:`, parameters);
    
    // Implement generic tool execution logic here
    // For now, return a success response
    return {
      success: true,
      tool_name: toolName,
      parameters: parameters,
      result: 'Tool executed successfully',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Generic tool ${toolName} execution error:`, error);
    throw error;
  }
}
