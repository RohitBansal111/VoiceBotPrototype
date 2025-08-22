const { GoogleGenerativeAI } = require('@google/generative-ai');

const giminiCarChat = async (userquery) => {
    const apiKey = process.env.GOOGLE_API_KEY;
    const modelName = process.env.GIMNI_MODAL_NAME;

    if (!apiKey) {
      console.error("Error: GOOGLE_API_KEY is not set in environment variables.");
      throw new Error("GOOGLE_API_KEY is not set in environment variables.");
    }
    if (!modelName) {
      console.error("Error: GIMNI_MODAL_NAME is not set in environment variables.");
      throw new Error("GIMNI_MODAL_NAME is not set in environment variables.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const fullPrompt = `You are a helpful AI assistant that specializes exclusively in answering questions about cars. Only provide information relevant to automobiles, including makes, models, mechanics, history, and general automotive knowledge. If a question is not about cars, politely state that you can only answer car-related queries.\n\nUser query: ${userquery}?`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return text;
  };

module.exports = { giminiCarChat };