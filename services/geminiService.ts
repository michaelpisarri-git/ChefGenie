import { GoogleGenAI, Type } from "@google/genai";
import { Recipe, RecipeRequest } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
      responseSchema: {
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
      }
    }
  });

  if (!response.text) {
    throw new Error("Failed to generate recipe text");
  }

  return JSON.parse(response.text) as Recipe;
};

export const generateRecipeImage = async (recipeTitle: string, description: string): Promise<string | null> => {
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