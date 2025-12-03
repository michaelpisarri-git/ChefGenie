import React, { useState } from 'react';
import { RecipeForm } from './components/RecipeForm';
import { RecipeDisplay } from './components/RecipeDisplay';
import { SavedRecipes } from './components/SavedRecipes';
import { Recipe, RecipeRequest, SavedRecipe } from './types';
import { generateRecipe, generateRecipeImage } from './services/geminiService';
import { BookOpen, PlusCircle } from 'lucide-react';

const App: React.FC = () => {
  const [activeRecipe, setActiveRecipe] = useState<Recipe | SavedRecipe | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'create' | 'cookbook'>('create');

  const handleCreateRecipe = async (request: RecipeRequest) => {
    setLoading(true);
    setError(null);
    setActiveRecipe(null);
    setImageUrl(null);

    try {
      // 1. Generate the recipe text
      const generatedRecipe = await generateRecipe(request);
      setActiveRecipe(generatedRecipe);

      // 2. Start image fetch
      generateRecipeImage(generatedRecipe.title, generatedRecipe.description)
        .then(url => setImageUrl(url))
        .catch(err => console.error("Image generation background error", err));

    } catch (err) {
      console.error(err);
      setError("We couldn't generate a recipe at this moment. Please check your connection and API key.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setActiveRecipe(null);
    setImageUrl(null);
    setError(null);
    setView('create');
  };

  const handleSelectSavedRecipe = (recipe: SavedRecipe) => {
    setActiveRecipe(recipe);
    // If the saved recipe has an image URL stored, use it
    setImageUrl(recipe.imageUrl || null);
    setView('create'); // Reuse the 'create' view container which holds RecipeDisplay
  };

  return (
    <div className="min-h-screen bg-chef-50 text-chef-900 font-sans selection:bg-chef-200 pb-12">
      
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" 
           style={{ 
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%235c453d' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
           }} 
      />

      {/* Header / Nav */}
      <header className="relative z-20 w-full px-4 py-4 md:py-6 flex justify-between items-center max-w-6xl mx-auto">
        <div 
          onClick={() => { setView('create'); setActiveRecipe(null); }}
          className="font-serif font-bold text-xl md:text-2xl text-chef-800 cursor-pointer flex items-center gap-2"
        >
          ChefGenie
        </div>
        
        <nav className="flex items-center gap-2 bg-white/50 backdrop-blur-md p-1 rounded-full border border-chef-200">
           <button 
             onClick={() => { setView('create'); setActiveRecipe(null); }}
             className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${view === 'create' && !activeRecipe ? 'bg-chef-800 text-white shadow-md' : 'text-chef-600 hover:bg-chef-100'}`}
           >
             <span className="flex items-center gap-2"><PlusCircle className="w-4 h-4" /> <span className="hidden sm:inline">New Recipe</span></span>
           </button>
           <button 
             onClick={() => { setView('cookbook'); setActiveRecipe(null); }}
             className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${view === 'cookbook' ? 'bg-chef-800 text-white shadow-md' : 'text-chef-600 hover:bg-chef-100'}`}
           >
             <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> <span className="hidden sm:inline">My Cookbook</span></span>
           </button>
        </nav>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-8 flex flex-col items-center min-h-[60vh] justify-center">
        
        {error && (
          <div className="w-full max-w-lg mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-center animate-in fade-in slide-in-from-top-4">
            <span className="mr-2">⚠️</span> {error}
          </div>
        )}

        {/* View Routing */}
        
        {view === 'cookbook' && (
          <SavedRecipes onSelectRecipe={handleSelectSavedRecipe} onBack={() => setView('create')} />
        )}

        {view === 'create' && !activeRecipe && (
          <RecipeForm onSubmit={handleCreateRecipe} isLoading={loading} />
        )}

        {/* Note: RecipeDisplay is shown when activeRecipe is present, regardless of 'view' technically, 
            but usually we are in 'create' view container when showing a recipe detail */}
        {activeRecipe && (
          <RecipeDisplay 
            recipe={activeRecipe} 
            imageUrl={imageUrl} 
            onReset={handleReset} 
          />
        )}

      </main>

      <footer className="w-full py-6 text-center text-chef-400 text-xs md:text-sm">
        <p>ChefGenie • AI Powered Culinary Assistant</p>
      </footer>
    </div>
  );
};

export default App;