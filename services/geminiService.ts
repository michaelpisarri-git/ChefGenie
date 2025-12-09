/// <reference types="vite/client" />
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Recipe, RecipeRequest } from "../types";

// 1. SETUP API KEY
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("API Key is missing! Check your .env file or Netlify settings.");
}

// 2. INITIALIZE CLIENT
const ai = new GoogleGenAI({ apiKey: apiKey });

// 3. DEFINE SCHEMA
const RECIPE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    mealType: { type: Type.STRING },
    servings: { type: Type.INTEGER },
    prepTimeMinutes: { type: Type.INTEGER },
    cookTimeMinutes: { type: Type.INTEGER },
    caloriesPerServing: { type: Type.INTEGER },
    difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          amount: { type: Type.STRING, description: "Quantity and unit" },
          notes: { type: Type.STRING, nullable: true }
        },
        required: ['name', 'amount']
      }
    },
    instructions: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    chefTips: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
  },
  required: ['title', 'description', 'ingredients', 'instructions', 'servings', 'prepTimeMinutes', 'cookTimeMinutes']
};

// 4. GENERATE RECIPE FUNCTION
export const generateRecipe = async (request: RecipeRequest): Promise<Recipe> => {
  const prompt = `
    Create a unique, complete meal recipe for ${request.mealType}.
    Context: The user has the following ingredients available (try to use them but you can add others): "${request.availableIngredients}".
    Dietary restrictions: "${request.dietaryRestrictions || 'None'}".
    Scale the recipe exactly for ${request.servings} serving(s).
      
    The recipe should be creative but practical.
    Return the response in JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash', 
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: RECIPE_SCHEMA
      }
    });

    // FIX: Access .text as a property, not a function
    const responseText = response.text;

    if (!responseText) {
      throw new Error("Failed to generate recipe text. The model might have been blocked or returned empty.");
    }

    return JSON.parse(responseText) as Recipe;
  } catch (error) {
    console.error("Recipe Generation Error:", error);
    throw error;
  }
};

// 5. GENERATE IMAGE FUNCTION
export const generateRecipeImage = async (recipeTitle: string, description: string): Promise<string | null> => {
  if (!apiKey) return null;

  try {
    const prompt = `A professional, appetizing food photography shot of ${recipeTitle}. ${description}. High resolution, culinary magazine style, beautiful lighting, photorealistic.`;
      
    const response = await ai.models.generateContent({
      model: 'imagen-3.0-generate-001', // FIX: Use Imagen model for images
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;

  } catch (error) {
    console.error("Image generation failed:", error);
    return null; 
  }
};

// 6. CHAT FUNCTION
export const askChefAboutRecipe = async (recipe: Recipe, question: string): Promise<string> => {
  const prompt = `
    You are a helpful, knowledgeable chef assistant.
    Current Recipe Context: ${recipe.title}.
    User Question: "${question}"
    Answer concisely.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  // FIX: Access .text as a property
  return response.text || "I'm having trouble thinking of an answer right now.";
};

// 7. TWEAK RECIPE FUNCTION
export const tweakRecipe = async (currentRecipe: Recipe, feedback: string): Promise<Recipe> => {
  const prompt = `
    The user wants to modify the following recipe.
    Original Recipe JSON: ${JSON.stringify(currentRecipe)}
    User Feedback: "${feedback}"
    Return the FULL updated recipe as JSON.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: RECIPE_SCHEMA
    }
  });

  // FIX: Access .text as a property
  const responseText = response.text;

  if (!responseText) {
    throw new Error("Failed to update recipe");
  }

  return JSON.parse(responseText) as Recipe;
}
