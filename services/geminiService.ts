import { GoogleGenAI } from "@google/genai";
// import { Recipe, RecipeRequest } from "../types"; // (Keep your existing imports)

// 1. We use 'import.meta.env' because this is a Vite app
// 2. We use 'VITE_GEMINI_API_KEY' to match what we set in Netlify
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Safety check: Log a warning if the key is missing (helps debugging)
if (!apiKey) {
  console.error("API Key is missing! Check your .env file or Netlify settings.");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

// Shared Schema for Recipe Generation
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
          amount: { type: Type.STRING, description: "Quantity and unit, e.g. '2 cups' or '200g'" },
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

export const generateRecipe = async (request: RecipeRequest): Promise<Recipe> => {
  const prompt = `
    Create a unique, complete meal recipe for ${request.mealType}.
    Context: The user has the following ingredients available (try to use them but you can add others): "${request.availableIngredients}".
    Dietary restrictions: "${request.dietaryRestrictions || 'None'}".
    Scale the recipe exactly for ${request.servings} serving(s).
    
    The recipe should be creative but practical.
    Return the response in JSON format.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: RECIPE_SCHEMA
    }
  });

  if (!response.text) {
    throw new Error("Failed to generate recipe text");
  }

  return JSON.parse(response.text) as Recipe;
};

export const generateRecipeImage = async (recipeTitle: string, description: string): Promise<string | null> => {
  // Check if we are in a build environment without a key (prevent crash)
  if (!process.env.API_KEY) return null;

  try {
    const prompt = `A professional, appetizing food photography shot of ${recipeTitle}. ${description}. High resolution, culinary magazine style, beautiful lighting, photorealistic.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: {
          // No responseMimeType for image models in generateContent as per guidelines
      }
    });

    // Iterate through parts to find the image
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

export const askChefAboutRecipe = async (recipe: Recipe, question: string): Promise<string> => {
  const prompt = `
    You are a helpful, knowledgeable chef assistant.
    
    Current Recipe Context:
    Title: ${recipe.title}
    Ingredients: ${recipe.ingredients.map(i => `${i.amount} ${i.name}`).join(', ')}
    Instructions: ${recipe.instructions.join(' ')}
    
    User Question: "${question}"
    
    Answer the user's question directly and helpfully. If they ask for substitutions, explain why. Keep the answer concise (under 3 sentences if possible).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text || "I'm having trouble thinking of an answer right now.";
};

export const tweakRecipe = async (currentRecipe: Recipe, feedback: string): Promise<Recipe> => {
  const prompt = `
    The user wants to modify the following recipe.
    
    Original Recipe JSON:
    ${JSON.stringify(currentRecipe)}
    
    User Feedback/Requested Changes:
    "${feedback}"
    
    Task:
    1. Modify the recipe to accommodate the user's request (e.g., remove ingredients, change serving size, make it spicy, swap items).
    2. Ensure the title and description are updated if the changes are significant.
    3. Ensure quantities and instructions are logically consistent with the changes.
    4. Return the FULL updated recipe as JSON.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: RECIPE_SCHEMA
    }
  });

  if (!response.text) {
    throw new Error("Failed to update recipe");
  }

  return JSON.parse(response.text) as Recipe;
};
