/// <reference types="vite/client" />
import { GoogleGenerativeAI } from "@google/generative-ai";
// We point to src/types because your types file is inside the src folder
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
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    description: { type: "STRING" },
    mealType: { type: "STRING" },
    servings: { type: "NUMBER" },
    prepTimeMinutes: { type: "NUMBER" },
    cookTimeMinutes: { type: "NUMBER" },
    caloriesPerServing: { type: "NUMBER" },
    difficulty: { type: "STRING" },
    ingredients: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          amount: { type: "STRING" },
          notes: { type: "STRING", nullable: true }
        },
        required: ['name', 'amount']
      }
    },
    instructions: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    chefTips: {
      type: "ARRAY",
      items: { type: "STRING" }
    }
  },
  required: ['title', 'description', 'ingredients', 'instructions', 'servings', 'prepTimeMinutes', 'cookTimeMinutes']
};

// 4. GENERATE RECIPE FUNCTION
export const generateRecipe = async (request: RecipeRequest): Promise<Recipe> => {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
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
  console.log("Image generation temporarily disabled.");
  return null;
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
    model: "gemini-1.5-flash",
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
