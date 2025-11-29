import { useState } from 'react';
import { ChefHat, Sparkles, ExternalLink, ShoppingCart, Loader2, ArrowRight, Clock, Activity, Flame } from 'lucide-react';
import { suggestRecipesAgent } from '../services/gemini';
import { storage } from '../utils/storage';
import type { ShoppingItem } from '../types';

interface Recipe {
    id: string;
    name: string;
    prepTime: string;
    difficulty: string;
    ingredients: string[];
    steps: string[];
    cuisine: string;
    youtubeQuery: string;
    nutrition: {
        calories: number;
        protein: string;
        carbs: string;
        fat: string;
    };
    isFavorite: boolean;
}

export default function Cooking() {
    const [ingredients, setIngredients] = useState('');
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

    const handleSuggestRecipes = async () => {
        if (!ingredients.trim()) {
            alert('الرجاء إدخال مكونات');
            return;
        }

        setIsLoading(true);
        setRecipes([]);
        setSelectedRecipe(null);

        try {
            const suggestions = await suggestRecipesAgent(ingredients);

            if (!suggestions || suggestions.length === 0) {
                alert('لم يتم العثور على وصفات. حاول تغيير المكونات.');
            } else {
                setRecipes(suggestions);
            }
        } catch (error: any) {
            console.error("Recipe fetch error:", error);
            alert('عذراً، حدث خطأ أثناء جلب الوصفات.');
        } finally {
            setIsLoading(false);
        }
    };

    const addToShoppingList = (ingredient: string) => {
        const currentList = storage.get<ShoppingItem[]>('shoppingList') || [];
        const newItem: ShoppingItem = {
            id: Date.now().toString() + Math.random().toString(36).substring(2),
            name: ingredient,
            purchased: false,
            category: 'أخرى',
            addedDate: new Date().toISOString()
        };
        storage.set('shoppingList', [...currentList, newItem]);
        alert(`تمت إضافة "${ingredient}" إلى قائمة التسوق`);
    };

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        return (
            <div className="p-0 max-w-4xl mx-auto pb-24 text-center pt-20">
                <ChefHat className="mx-auto text-slate-600 mb-4" size={64} />
                <h2 className="text-2xl font-bold text-slate-400 mb-2">خدمة الطبخ غير متوفرة</h2>
                <p className="text-slate-500">يرجى تكوين مفتاح API الخاص بـ Gemini لتفعيل هذه الميزة.</p>
            </div>
        );
    }

    return (
        <div className="p-0 max-w-4xl mx-auto pb-24">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-500/10 p-3 rounded-xl">
                    <ChefHat className="text-orange-500" size={32} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">مطبخي الذكي</h2>
                    <p className="text-slate-400 text-sm">شيف محترف يقترح عليك وصفات بمكوناتك</p>
                </div>
            </div>

            {!selectedRecipe ? (
                <div className="space-y-8">
                    {/* Input Section */}
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
                        <label className="block text-sm text-slate-400 mb-2 font-medium">
                            ما هي المكونات المتوفرة لديك؟
                        </label>
                        <textarea
                            value={ingredients}
                            onChange={(e) => setIngredients(e.target.value)}
                            className="w-full bg-slate-900/50 rounded-lg p-4 min-h-[120px] mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-slate-700"
                            placeholder="مثال: دجاج، أرز، طماطم، بصل..."
                        />
                        <button
                            onClick={handleSuggestRecipes}
                            disabled={isLoading || !ingredients.trim()}
                            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-orange-500/20"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    جاري استشارة الشيف...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={20} />
                                    اقترح وصفات
                                </>
                            )}
                        </button>
                    </div>

                    {/* Results Grid */}
                    {recipes.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4">
                            {recipes.map((recipe, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedRecipe(recipe)}
                                    className="bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-orange-500/50 rounded-xl p-5 cursor-pointer transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>

                                    <div className="flex justify-between items-start mb-3 relative z-10">
                                        <span className="text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-300 border border-slate-600">
                                            {recipe.cuisine}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-1 rounded-full border ${recipe.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                recipe.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                    'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}>
                                                {recipe.difficulty}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold mb-2 group-hover:text-orange-400 transition-colors">{recipe.name}</h3>

                                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                                        <div className="flex items-center gap-1">
                                            <Clock size={14} />
                                            <span>{recipe.prepTime}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Flame size={14} />
                                            <span>{recipe.nutrition?.calories} سعرة</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {recipe.ingredients.slice(0, 3).map((ing, i) => (
                                            <span key={i} className="text-xs bg-slate-900/50 px-2 py-1 rounded text-slate-300">
                                                {ing}
                                            </span>
                                        ))}
                                        {recipe.ingredients.length > 3 && (
                                            <span className="text-xs bg-slate-900/50 px-2 py-1 rounded text-slate-300">
                                                +{recipe.ingredients.length - 3}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                // Recipe Detail View
                <div className="animate-in fade-in slide-in-from-right-4">
                    <button
                        onClick={() => setSelectedRecipe(null)}
                        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 group"
                    >
                        <ArrowRight size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>عودة للنتائج</span>
                    </button>

                    <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 shadow-xl">
                        <div className="p-6 md:p-8">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                                        {selectedRecipe.name}
                                    </h1>
                                    <div className="flex items-center gap-4 text-sm text-slate-400 mt-2">
                                        <span className="flex items-center gap-1 bg-slate-700/50 px-3 py-1 rounded-full">
                                            <Clock size={16} className="text-orange-400" />
                                            {selectedRecipe.prepTime}
                                        </span>
                                        <span className="flex items-center gap-1 bg-slate-700/50 px-3 py-1 rounded-full">
                                            <Activity size={16} className="text-green-400" />
                                            {selectedRecipe.difficulty}
                                        </span>
                                        <span className="flex items-center gap-1 bg-slate-700/50 px-3 py-1 rounded-full">
                                            <ChefHat size={16} className="text-blue-400" />
                                            {selectedRecipe.cuisine}
                                        </span>
                                    </div>
                                </div>
                                <a
                                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedRecipe.youtubeQuery)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg hover:shadow-red-600/20"
                                >
                                    <ExternalLink size={18} />
                                    <span>شاهد الطريقة</span>
                                </a>
                            </div>

                            {/* Nutrition Cards */}
                            <div className="grid grid-cols-4 gap-2 mb-8">
                                <div className="bg-slate-700/30 p-3 rounded-xl text-center border border-slate-700">
                                    <span className="block text-xs text-slate-400 mb-1">سعرات</span>
                                    <span className="font-bold text-orange-400">{selectedRecipe.nutrition?.calories}</span>
                                </div>
                                <div className="bg-slate-700/30 p-3 rounded-xl text-center border border-slate-700">
                                    <span className="block text-xs text-slate-400 mb-1">بروتين</span>
                                    <span className="font-bold text-blue-400">{selectedRecipe.nutrition?.protein}</span>
                                </div>
                                <div className="bg-slate-700/30 p-3 rounded-xl text-center border border-slate-700">
                                    <span className="block text-xs text-slate-400 mb-1">كارب</span>
                                    <span className="font-bold text-green-400">{selectedRecipe.nutrition?.carbs}</span>
                                </div>
                                <div className="bg-slate-700/30 p-3 rounded-xl text-center border border-slate-700">
                                    <span className="block text-xs text-slate-400 mb-1">دهون</span>
                                    <span className="font-bold text-yellow-400">{selectedRecipe.nutrition?.fat}</span>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-slate-700 pb-2 text-orange-400">
                                        <ShoppingCart size={20} />
                                        المكونات
                                    </h3>
                                    <ul className="space-y-3">
                                        {selectedRecipe.ingredients.map((ing, idx) => (
                                            <li key={idx} className="flex items-center justify-between group bg-slate-700/20 p-2 rounded-lg hover:bg-slate-700/40 transition-colors">
                                                <span className="text-slate-300 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                                    {ing}
                                                </span>
                                                <button
                                                    onClick={() => addToShoppingList(ing)}
                                                    className="text-xs bg-slate-700 hover:bg-green-600 text-slate-300 hover:text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    + تسوق
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-slate-700 pb-2 text-orange-400">
                                        <ChefHat size={20} />
                                        طريقة التحضير
                                    </h3>
                                    <ol className="space-y-4">
                                        {selectedRecipe.steps.map((step, idx) => (
                                            <li key={idx} className="flex gap-4">
                                                <span className="flex-shrink-0 w-8 h-8 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-full flex items-center justify-center text-sm font-bold">
                                                    {idx + 1}
                                                </span>
                                                <p className="text-slate-300 leading-relaxed pt-1">{step}</p>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
