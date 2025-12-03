import React, { useEffect, useState } from 'react';
import { SavedRecipe } from '../types';
import { ChefHat, Clock, Search, Star, ArrowRight } from 'lucide-react';

interface SavedRecipesProps {
  onSelectRecipe: (recipe: SavedRecipe) => void;
  onBack: () => void;
}

export const SavedRecipes: React.FC<SavedRecipesProps> = ({ onSelectRecipe, onBack }) => {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('chefGenie_cookbook');
    if (saved) {
      try {
        setRecipes(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse cookbook", e);
      }
    }
  }, []);

  const filteredRecipes = recipes.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.mealType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-chef-800 flex items-center gap-3">
            <ChefHat className="w-8 h-8 text-chef-500" />
            My Cookbook
          </h2>
          <p className="text-chef-600">Your collection of generated culinary delights.</p>
        </div>
        
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-white border border-chef-200 rounded-lg text-chef-600 hover:bg-chef-50 transition-colors font-medium text-sm self-start md:self-auto"
        >
          Create New Recipe
        </button>
      </div>

      {recipes.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-chef-100 text-center space-y-4">
          <div className="w-16 h-16 bg-chef-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-8 h-8 text-chef-300" />
          </div>
          <h3 className="text-xl font-serif font-bold text-chef-800">Your cookbook is empty</h3>
          <p className="text-chef-500 max-w-md mx-auto">
            You haven't saved any recipes yet. Generate a recipe and click the "Save" button to build your collection.
          </p>
          <button 
            onClick={onBack}
            className="mt-4 px-6 py-3 bg-chef-800 text-white rounded-xl font-bold hover:bg-chef-700 transition-colors inline-flex items-center gap-2"
          >
            Start Cooking <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-chef-400" />
            <input 
              type="text" 
              placeholder="Search your recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-chef-200 focus:border-chef-400 focus:ring-0 bg-white shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <div 
                key={recipe.id}
                onClick={() => onSelectRecipe(recipe)}
                className="bg-white rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-chef-100 cursor-pointer group flex flex-col h-full"
              >
                <div className="h-48 bg-chef-100 relative overflow-hidden">
                  {recipe.imageUrl ? (
                    <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-chef-300">
                      <ChefHat className="w-12 h-12 opacity-50" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-md text-[10px] font-bold uppercase tracking-wider text-chef-800">
                      {recipe.mealType}
                    </span>
                  </div>
                  {recipe.rating ? (
                     <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full flex items-center gap-1">
                       <Star className="w-3 h-3 text-yellow-500 fill-current" />
                       <span className="text-xs font-bold text-chef-800">{recipe.rating}</span>
                     </div>
                  ) : null}
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-serif font-bold text-xl text-chef-800 mb-2 line-clamp-1 group-hover:text-chef-600 transition-colors">
                    {recipe.title}
                  </h3>
                  <p className="text-sm text-chef-500 line-clamp-2 mb-4 flex-1">
                    {recipe.description}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-chef-50 text-xs text-chef-400 font-medium uppercase tracking-wide">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {recipe.prepTimeMinutes + recipe.cookTimeMinutes}m
                    </span>
                    <span className="text-chef-300">
                      {new Date(recipe.savedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};