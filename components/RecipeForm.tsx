import React, { useState } from 'react';
import { MealType, RecipeRequest } from '../types';
import { ChefHat, Loader2, Minus, Plus, Sparkles, UtensilsCrossed } from 'lucide-react';

interface RecipeFormProps {
  onSubmit: (data: RecipeRequest) => void;
  isLoading: boolean;
}

export const RecipeForm: React.FC<RecipeFormProps> = ({ onSubmit, isLoading }) => {
  const [mealType, setMealType] = useState<MealType>(MealType.DINNER);
  const [ingredients, setIngredients] = useState('');
  const [dietary, setDietary] = useState('');
  const [servings, setServings] = useState(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      mealType,
      availableIngredients: ingredients,
      servings,
      dietaryRestrictions: dietary
    });
  };

  const adjustServings = (delta: number) => {
    setServings(prev => Math.max(1, Math.min(12, prev + delta)));
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-serif font-bold text-chef-800 flex items-center justify-center gap-3">
          <ChefHat className="w-8 h-8 text-chef-500" />
          ChefGenie
        </h2>
        <p className="text-chef-600">Tell us what you have, we'll cook up the rest.</p>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl shadow-chef-200/50 border border-chef-100 space-y-6 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 opacity-50 pointer-events-none"></div>

        {/* Meal Type Selection */}
        <div className="space-y-3 relative z-10">
          <label className="text-sm font-semibold text-chef-700 uppercase tracking-wider">Meal Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.values(MealType).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMealType(type)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                  mealType === type
                    ? 'bg-chef-500 text-white border-chef-500 shadow-md transform scale-105'
                    : 'bg-white text-chef-600 border-chef-200 hover:border-chef-400 hover:bg-chef-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Ingredients Input */}
        <div className="space-y-3 relative z-10">
          <label htmlFor="ingredients" className="text-sm font-semibold text-chef-700 uppercase tracking-wider">
            Ingredients on Hand
          </label>
          <div className="relative">
            <textarea
              id="ingredients"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="e.g., chicken breast, spinach, lemon, rice..."
              className="w-full min-h-[100px] p-4 rounded-xl border-2 border-chef-100 focus:border-chef-400 focus:ring-0 text-chef-800 placeholder-chef-300 resize-none transition-colors bg-chef-50/30"
            />
            <Sparkles className="absolute top-3 right-3 w-4 h-4 text-chef-400" />
          </div>
        </div>

        {/* Dietary & Servings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div className="space-y-3">
             <label htmlFor="dietary" className="text-sm font-semibold text-chef-700 uppercase tracking-wider">
              Dietary Notes
            </label>
            <input
              id="dietary"
              type="text"
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
              placeholder="e.g., Gluten-free, Vegan"
              className="w-full p-3 rounded-xl border-2 border-chef-100 focus:border-chef-400 focus:ring-0 text-chef-800 placeholder-chef-300 bg-chef-50/30"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-chef-700 uppercase tracking-wider block">
              Servings
            </label>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => adjustServings(-1)}
                className="p-3 rounded-lg border-2 border-chef-200 hover:border-chef-500 text-chef-600 hover:text-chef-800 transition-colors"
                disabled={servings <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex-1 text-center font-serif text-2xl font-bold text-chef-800">
                {servings}
              </div>
              <button
                type="button"
                onClick={() => adjustServings(1)}
                className="p-3 rounded-lg border-2 border-chef-200 hover:border-chef-500 text-chef-600 hover:text-chef-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-chef-600 to-chef-500 text-white font-bold text-lg shadow-lg shadow-chef-500/30 hover:shadow-chef-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative z-10"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Concocting Recipe...</span>
            </>
          ) : (
            <>
              <UtensilsCrossed className="w-6 h-6" />
              <span>Create Recipe</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
