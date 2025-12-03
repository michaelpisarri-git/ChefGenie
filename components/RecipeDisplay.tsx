import React, { useState, useEffect } from 'react';
import { Recipe, SavedRecipe } from '../types';
import { Clock, Users, Flame, ChefHat, CheckCircle2, ArrowRight, Heart, Star, Save, Trash2, Check } from 'lucide-react';

interface RecipeDisplayProps {
  recipe: Recipe | SavedRecipe;
  imageUrl: string | null;
  onReset: () => void;
}

export const RecipeDisplay: React.FC<RecipeDisplayProps> = ({ recipe, imageUrl, onReset }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Initialize state based on whether the recipe passed in is already a saved one
  useEffect(() => {
    if ('id' in recipe) {
      // It's a saved recipe
      setIsSaved(true);
      setRating((recipe as SavedRecipe).rating || 0);
      setNotes((recipe as SavedRecipe).notes || '');
    } else {
      // Check if this exact title exists in LS to prevent duplicates effectively
      const saved = localStorage.getItem('chefGenie_cookbook');
      if (saved) {
        const parsed = JSON.parse(saved);
        const found = parsed.find((r: SavedRecipe) => r.title === recipe.title);
        if (found) {
          setIsSaved(true);
          setRating(found.rating || 0);
          setNotes(found.notes || '');
        }
      }
    }
  }, [recipe]);

  const handleSave = () => {
    try {
      const savedRecipes = JSON.parse(localStorage.getItem('chefGenie_cookbook') || '[]');
      
      const newSavedRecipe: SavedRecipe = {
        ...recipe,
        id: 'id' in recipe ? (recipe as SavedRecipe).id : crypto.randomUUID(),
        savedAt: 'savedAt' in recipe ? (recipe as SavedRecipe).savedAt : Date.now(),
        imageUrl: imageUrl, // Save the image URL/Base64
        rating,
        notes
      };

      // Remove existing version if updating
      const filtered = savedRecipes.filter((r: SavedRecipe) => r.title !== recipe.title);
      const updatedList = [newSavedRecipe, ...filtered];
      
      localStorage.setItem('chefGenie_cookbook', JSON.stringify(updatedList));
      
      setIsSaved(true);
      setShowSaveConfirm(true);
      setTimeout(() => setShowSaveConfirm(false), 3000);
    } catch (e) {
      console.error("Failed to save recipe", e);
      alert("Could not save recipe. Storage might be full (images take up a lot of space).");
    }
  };

  const updateRating = (newRating: number) => {
    setRating(newRating);
    if (isSaved) {
      // Update in storage immediately if already saved
      updateStorage(newRating, notes);
    }
  };

  const updateNotes = (newNotes: string) => {
    setNotes(newNotes);
  };

  const handleNotesBlur = () => {
    if (isSaved) {
      updateStorage(rating, notes);
    }
  };

  const updateStorage = (r: number, n: string) => {
    const savedRecipes = JSON.parse(localStorage.getItem('chefGenie_cookbook') || '[]');
    const updated = savedRecipes.map((item: SavedRecipe) => {
      if (item.title === recipe.title) {
        return { ...item, rating: r, notes: n };
      }
      return item;
    });
    localStorage.setItem('chefGenie_cookbook', JSON.stringify(updated));
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to remove this recipe from your cookbook?")) {
      const savedRecipes = JSON.parse(localStorage.getItem('chefGenie_cookbook') || '[]');
      const filtered = savedRecipes.filter((r: SavedRecipe) => r.title !== recipe.title);
      localStorage.setItem('chefGenie_cookbook', JSON.stringify(filtered));
      onReset(); // Go back
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full pb-12 animate-in fade-in zoom-in-95 duration-700">
      
      {/* Navigation / Actions */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={onReset}
          className="flex items-center text-chef-600 hover:text-chef-800 transition-colors font-medium group"
        >
          <ArrowRight className="w-4 h-4 mr-2 rotate-180 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <div className="flex gap-2">
           {isSaved && (
             <button 
               onClick={handleDelete}
               className="flex items-center gap-2 px-4 py-2 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition-colors"
             >
               <Trash2 className="w-4 h-4" />
             </button>
           )}
           <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold text-sm shadow-sm transition-all duration-300 ${
              isSaved 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-chef-800 text-white hover:bg-chef-700 hover:shadow-md'
            }`}
          >
            {isSaved ? (
              <>
                {showSaveConfirm ? <Check className="w-4 h-4" /> : <Heart className="w-4 h-4 fill-current" />}
                {showSaveConfirm ? 'Saved!' : 'Saved'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Recipe
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl shadow-chef-900/10 overflow-hidden">
        
        {/* Hero Image */}
        <div className="relative h-64 md:h-80 lg:h-96 w-full bg-chef-100 overflow-hidden group">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={recipe.title} 
              className="w-full h-full object-cover transition-transform hover:scale-105 duration-700"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-chef-400">
               <ChefHat className="w-16 h-16 mb-2 opacity-50" />
               <span className="font-serif italic text-lg">No image generated</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 md:p-8 text-white w-full">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-chef-500/90 backdrop-blur-sm rounded-full text-xs font-bold tracking-widest uppercase">
                {recipe.mealType}
              </span>
              {rating > 0 && (
                <div className="flex text-yellow-400">
                  {[...Array(rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold leading-tight mb-2 text-shadow">
              {recipe.title}
            </h1>
            <p className="text-chef-50 md:text-lg opacity-90 font-light max-w-2xl line-clamp-2">
              {recipe.description}
            </p>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-chef-100 divide-x divide-chef-100 bg-chef-50">
          <div className="p-4 flex flex-col items-center justify-center text-center">
            <Clock className="w-5 h-5 text-chef-500 mb-1" />
            <span className="text-xs text-chef-500 uppercase font-semibold">Prep</span>
            <span className="font-bold text-chef-800">{recipe.prepTimeMinutes}m</span>
          </div>
          <div className="p-4 flex flex-col items-center justify-center text-center">
            <Flame className="w-5 h-5 text-chef-500 mb-1" />
            <span className="text-xs text-chef-500 uppercase font-semibold">Cook</span>
            <span className="font-bold text-chef-800">{recipe.cookTimeMinutes}m</span>
          </div>
          <div className="p-4 flex flex-col items-center justify-center text-center">
            <Users className="w-5 h-5 text-chef-500 mb-1" />
            <span className="text-xs text-chef-500 uppercase font-semibold">Serves</span>
            <span className="font-bold text-chef-800">{recipe.servings}</span>
          </div>
          <div className="p-4 flex flex-col items-center justify-center text-center">
             <div className={`w-5 h-5 rounded-full border-2 mb-1 flex items-center justify-center text-[10px] font-bold
                ${recipe.difficulty === 'Easy' ? 'border-green-500 text-green-600' : 
                  recipe.difficulty === 'Medium' ? 'border-yellow-500 text-yellow-600' : 
                  'border-red-500 text-red-600'}`}>
               {recipe.difficulty[0]}
             </div>
            <span className="text-xs text-chef-500 uppercase font-semibold">Level</span>
            <span className="font-bold text-chef-800">{recipe.difficulty}</span>
          </div>
        </div>

        <div className="p-6 md:p-10 grid md:grid-cols-[1fr,1.5fr] gap-10">
          
          {/* Ingredients Column */}
          <div className="space-y-6">
            <h3 className="font-serif text-2xl font-bold text-chef-800 border-b-2 border-chef-100 pb-2">Ingredients</h3>
            <ul className="space-y-3">
              {recipe.ingredients.map((ing, idx) => (
                <li key={idx} className="flex items-start group">
                  <CheckCircle2 className="w-5 h-5 text-chef-300 mt-0.5 mr-3 shrink-0 group-hover:text-chef-500 transition-colors" />
                  <div className="text-chef-700">
                    <span className="font-bold text-chef-900">{ing.amount}</span> {ing.name}
                    {ing.notes && <span className="text-sm text-chef-500 italic block">{ing.notes}</span>}
                  </div>
                </li>
              ))}
            </ul>

            {recipe.caloriesPerServing && (
                <div className="mt-8 p-4 bg-chef-50 rounded-xl border border-chef-100">
                    <p className="text-sm text-chef-600 text-center">
                        <span className="font-bold block text-lg text-chef-800">{recipe.caloriesPerServing}</span>
                        Calories per serving
                    </p>
                </div>
            )}
          </div>

          {/* Instructions Column */}
          <div className="space-y-6">
             <h3 className="font-serif text-2xl font-bold text-chef-800 border-b-2 border-chef-100 pb-2">Method</h3>
             <div className="space-y-8">
                {recipe.instructions.map((step, idx) => (
                  <div key={idx} className="relative pl-8">
                    <span className="absolute left-0 top-0 font-serif text-4xl font-bold text-chef-100 -translate-y-2 select-none">
                      {idx + 1}
                    </span>
                    <p className="relative z-10 text-chef-700 leading-relaxed text-lg">
                      {step}
                    </p>
                  </div>
                ))}
             </div>

             {recipe.chefTips && recipe.chefTips.length > 0 && (
               <div className="mt-8 p-6 bg-yellow-50/50 border border-yellow-100 rounded-xl">
                 <h4 className="flex items-center font-bold text-yellow-800 mb-3">
                   <ChefHat className="w-5 h-5 mr-2" />
                   Chef's Tips
                 </h4>
                 <ul className="space-y-2">
                   {recipe.chefTips.map((tip, idx) => (
                     <li key={idx} className="text-sm text-yellow-900/80 list-disc ml-4">{tip}</li>
                   ))}
                 </ul>
               </div>
             )}
          </div>
        </div>

        {/* User Interaction Section - Visible only if saved or user wants to save */}
        {isSaved && (
          <div className="bg-chef-50 border-t border-chef-100 p-6 md:p-10">
            <h3 className="font-serif text-2xl font-bold text-chef-800 mb-6 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500 fill-current" />
              My Kitchen Journal
            </h3>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-chef-600 uppercase tracking-wider">Rate this meal</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => updateRating(star)}
                      className={`transition-transform hover:scale-110 focus:outline-none ${
                        star <= rating ? 'text-yellow-400' : 'text-chef-200 hover:text-yellow-200'
                      }`}
                    >
                      <Star className={`w-8 h-8 ${star <= rating ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-chef-400 italic">
                  {rating === 0 ? "Tap a star to rate" : `You rated this ${rating} stars`}
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-chef-600 uppercase tracking-wider">Personal Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => updateNotes(e.target.value)}
                  onBlur={handleNotesBlur}
                  placeholder="E.g. Use less salt next time, great with white wine..."
                  className="w-full min-h-[100px] p-4 rounded-xl border border-chef-200 focus:border-chef-400 focus:ring-0 bg-white text-chef-800 placeholder-chef-300 resize-none"
                />
                <div className="flex justify-between items-center text-xs text-chef-400">
                   <span>Notes save automatically</span>
                   {notes && <span className="text-green-600 flex items-center gap-1"><Check className="w-3 h-3"/> Saved</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};