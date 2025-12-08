import React, { useState, useEffect, useRef } from 'react';
import { Recipe } from '../types';
import { askChefAboutRecipe, tweakRecipe } from '../services/geminiService';
import { Mic, Send, Sparkles, X, MessageCircle, RefreshCw, Loader2, Volume2 } from 'lucide-react';

interface RecipeAssistantProps {
  recipe: Recipe;
  onUpdateRecipe: (newRecipe: Recipe) => void;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export const RecipeAssistant: React.FC<RecipeAssistantProps> = ({ recipe, onUpdateRecipe }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: "Hi! I'm your Chef Assistant. Ask me questions about this dish, or tell me if you want to change something (e.g., 'Make it spicy' or 'I don't have onions')." }
  ]);
  const [activeTab, setActiveTab] = useState<'chat' | 'tweak'>('chat');
  
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom of chat
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        setIsListening(true);
        recognitionRef.current.start();
      } else {
        alert("Voice input is not supported in this browser.");
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput('');
    setIsLoading(true);

    // Add user message to UI immediately
    setMessages(prev => [...prev, { role: 'user', text: userText }]);

    try {
      if (activeTab === 'chat') {
        const response = await askChefAboutRecipe(recipe, userText);
        setMessages(prev => [...prev, { role: 'assistant', text: response }]);
      } else {
        // Tweak Mode
        setMessages(prev => [...prev, { role: 'assistant', text: "Working on those changes for you... this might take a moment." }]);
        const newRecipe = await tweakRecipe(recipe, userText);
        onUpdateRecipe(newRecipe);
        setMessages(prev => [...prev, { role: 'assistant', text: "Done! I've updated the recipe above." }]);
        setIsOpen(false); // Close modal to show the change
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I hit a snag in the kitchen. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Button to Open */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-4 bg-chef-800 text-white rounded-full shadow-lg shadow-chef-800/30 hover:scale-105 transition-transform flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4"
        >
          <Sparkles className="w-6 h-6" />
          <span className="font-bold hidden md:block">Chef Assistant</span>
        </button>
      )}

      {/* Assistant Panel */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 md:bottom-6 md:right-6 z-50 w-full md:w-[400px] h-[500px] max-h-[80vh] bg-white md:rounded-2xl shadow-2xl flex flex-col border border-chef-200 animate-in slide-in-from-bottom-10 fade-in duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-chef-100 bg-chef-50 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="bg-chef-200 p-1.5 rounded-lg">
                 <Sparkles className="w-5 h-5 text-chef-700" />
              </div>
              <h3 className="font-serif font-bold text-chef-800">Chef Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-chef-400 hover:text-chef-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex p-1 bg-chef-50 border-b border-chef-100">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'chat' ? 'bg-white text-chef-800 shadow-sm' : 'text-chef-500 hover:text-chef-700'}`}
            >
              <MessageCircle className="w-4 h-4" /> Ask Q&A
            </button>
            <button
              onClick={() => setActiveTab('tweak')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'tweak' ? 'bg-white text-chef-800 shadow-sm' : 'text-chef-500 hover:text-chef-700'}`}
            >
              <RefreshCw className="w-4 h-4" /> Tweak Recipe
            </button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white scrollbar-thin">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-chef-600 text-white rounded-br-none' 
                      : 'bg-chef-50 text-chef-800 border border-chef-100 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                 <div className="bg-chef-50 p-3 rounded-2xl rounded-bl-none flex items-center gap-2 text-chef-500 text-xs">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {activeTab === 'chat' ? 'Thinking...' : 'Updating recipe...'}
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-chef-100 bg-white md:rounded-b-2xl">
            <div className="relative flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening..." : activeTab === 'chat' ? "How do I make this vegan?" : "Remove the cilantro..."}
                className={`flex-1 p-3 pr-10 rounded-xl border focus:ring-0 transition-all ${isListening ? 'border-red-400 bg-red-50 text-red-600 animate-pulse' : 'border-chef-200 focus:border-chef-400'}`}
                disabled={isLoading}
              />
              
              <button
                onClick={toggleListening}
                className={`absolute right-12 p-2 rounded-full transition-colors ${isListening ? 'text-red-500 hover:bg-red-100' : 'text-chef-400 hover:text-chef-600 hover:bg-chef-50'}`}
                title="Voice Input"
              >
                {isListening ? <Volume2 className="w-5 h-5 animate-bounce" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-3 bg-chef-800 text-white rounded-xl shadow-md hover:bg-chef-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[10px] text-chef-400 text-center mt-2">
              {activeTab === 'chat' ? "Ask questions about the current recipe." : "Describe changes to regenerate the recipe."}
            </p>
          </div>
        </div>
      )}
    </>
  );
};