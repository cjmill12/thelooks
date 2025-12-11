// netlify/functions/tryon.mjs

// Use ES Module syntax
import { GoogleGenAI } from '@google/genai';

// Handler must be exported as a named 'handler' function for Netlify
export async function handler(event) {
  
  // Initialize the client with the API key from environment variables
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY 
  }); 

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { baseImage, prompt, negativePrompt } = JSON.parse(event.body);

    if (!baseImage || !prompt) {
      return { statusCode: 400, body: 'Missing baseImage or prompt in request body.' };
    }
    
    // --- CRITICAL FIX: Use the dedicated editImage method for image manipulation ---
    
    // We pass the Base64 data directly as the 'image' parameter
    const response = await ai.models.editImage({
      model: 'imagen-3.0-generate-002', // The best model for editing/inpainting tasks
      
      // The Base64 image data without the 'data:image/jpeg;base64,' prefix
      image: baseImage, 
      
      // The instruction for the AI (apply new hairstyle)
      prompt: prompt,
      
      config: {
        // Pass negative prompt for quality control
        negativePrompt: negativePrompt, 
        aspectRatio: '1:1', // Maintain a square aspect ratio
        numberOfImages: 1
      }
    });

    // --- Response Parsing for editImage ---
    // The response structure for editImage is response.generatedImages[0].imageBytes
    const generatedImageBase64 = response.generatedImages[0].imageBytes;

    if (!generatedImageBase64) {
         console.warn("EditImage failed to return an image.");
         return {
            statusCode: 500,
            body: JSON.stringify({ error: "Generation failed: The image could not be edited by the AI model." }),
         };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        generatedImageBase64: generatedImageBase64,
      }),
    };

  } catch (error) {
    console.error('AI Processing Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: `Internal Server Error during AI processing. Please check your API key and Netlify logs. Error details: ${error.message}` }),
    };
  }
}
