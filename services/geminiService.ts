/// <reference types="vite/client" />
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Recipe, RecipeRequest } from "../src/types";

// 1. SETUP API KEY
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("API Key is missing! Check your .env file.");
}

// 2. INITIALIZE CLIENT
const genAI = new GoogleGenerativeAI(apiKey);

// 3. DEFINE SCHEMA
const schema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    description: { type: SchemaType.STRING },
    mealType: { type: SchemaType.STRING },
    servings: { type: SchemaType.NUMBER },
    prepTimeMinutes: { type: SchemaType.NUMBER },
    cookTimeMinutes: { type: SchemaType.NUMBER },
    caloriesPerServing: { type: SchemaType.NUMBER },
    difficulty: { type: SchemaType.STRING },
    ingredients: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          amount: { type: SchemaType.STRING },
          notes: { type: SchemaType.STRING, nullable: true }
        },
        required: ['name', 'amount']
      }
    },
    instructions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    },
    chefTips: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    }
  },
  required: ['title', 'description', 'ingredients', 'instructions', 'servings', 'prepTimeMinutes', 'cookTimeMinutes']
};

// 4. GENERATE RECIPE FUNCTION
export const generateRecipe = async (request: RecipeRequest): Promise<Recipe> => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    }
  });

  const prompt = `
    Create a unique, complete meal recipe for ${request.mealType}.
    Context: The user has the following ingredients available: "${request.availableIngredients}".
    Dietary restrictions: "${request.dietaryRestrictions || 'None'}".
    Scale the recipe exactly for ${request.servings} serving(s).
    
    The recipe should be creative but practical.
    The difficulty field must be exactly one of: "Easy", "Medium", or "Hard".
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText) as Recipe;
  } catch (error) {
    console.error("Recipe Generation Error:", error);
    throw error;
  }
};

// 5. GENERATE IMAGE FUNCTION
export const generateRecipeImage = async (recipeTitle: string, description: string): Promise<string | null> => {
  try {
    // Use the specific experimental model for images
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp-image-generation",
      generationConfig: {
        // @ts-ignore
        // FIX: You must allow BOTH Text and Image, or the model crashes!
        responseModalities: ["TEXT", "IMAGE"] 
      }
    });
    
    const prompt = `
      Generate a professional, appetizing food photography shot of ${recipeTitle}. 
      Visual description: ${description}. 
      Style: High resolution, culinary magazine style, overhead shot, photorealistic.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    console.log("Model generated text instead of an image.");
    return null;

  } catch (error) {
    console.error("Image generation failed:", error);
    return null; 
  }
};

// 6. CHAT FUNCTION
export const askChefAboutRecipe = async (recipe: Recipe, question: string): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const prompt = `
    You are a helpful, knowledgeable chef assistant.
    Current Recipe Context: ${recipe.title}.
    User Question: "${question}"
    Answer concisely.
  `;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Chat Error:", error);
    return "I'm having trouble thinking right now.";
  }
};

// 7. TWEAK RECIPE FUNCTION
export const tweakRecipe = async (currentRecipe: Recipe, feedback: string): Promise<Recipe> => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    }
  });

  const prompt = `
    The user wants to modify the following recipe.
    Original Recipe JSON: ${JSON.stringify(currentRecipe)}
    User Feedback: "${feedback}"
    Return the FULL updated recipe as JSON.
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText) as Recipe;
  } catch (error) {
    console.error("Tweak Error:", error);
    throw new Error("Failed to update recipe");
  }
}
