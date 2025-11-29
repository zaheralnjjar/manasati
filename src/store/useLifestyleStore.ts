import { create } from 'zustand';
import type { ShoppingItem, Recipe, CookingSession, ShoppingCategory } from '../types';
import { dbOperations, DB_KEYS } from '../utils/db';
import { supabase } from '../services/supabase';

interface LifestyleState {
    // Shopping
    shoppingList: ShoppingItem[];
    addShoppingItem: (name: string, category?: ShoppingCategory) => Promise<void>;
    toggleShoppingItem: (id: string) => Promise<void>;
    deleteShoppingItem: (id: string) => Promise<void>;
    clearPurchased: () => Promise<void>;

    // Recipes
    recipes: Recipe[];
    addRecipe: (recipe: Omit<Recipe, 'id'>) => Promise<void>;
    deleteRecipe: (id: string) => Promise<void>;
    addIngredientsToShopping: (recipeId: string) => Promise<void>;

    // Cooking Sessions
    cookingSessions: CookingSession[];
    startCookingSession: (recipeId: string) => Promise<void>;
    toggleIngredient: (recipeId: string, ingredient: string) => Promise<void>;

    // Initialize
    initialize: () => Promise<void>;
}

// Auto-categorize shopping items
const categorizeItem = (name: string): ShoppingCategory => {
    const lowerName = name.toLowerCase();

    // Meat keywords
    if (lowerName.includes('لحم') || lowerName.includes('دجاج') || lowerName.includes('سمك') ||
        lowerName.includes('كبد') || lowerName.includes('لحوم')) {
        return 'لحوم';
    }

    // Vegetables keywords
    if (lowerName.includes('خضار') || lowerName.includes('طماطم') || lowerName.includes('بصل') ||
        lowerName.includes('خس') || lowerName.includes('جزر') || lowerName.includes('خيار') ||
        lowerName.includes('فلفل') || lowerName.includes('بطاطس')) {
        return 'خضروات';
    }

    // Dairy keywords
    if (lowerName.includes('حليب') || lowerName.includes('لبن') || lowerName.includes('جبن') ||
        lowerName.includes('زبادي') || lowerName.includes('قشطة') || lowerName.includes('زبدة')) {
        return 'ألبان';
    }

    // Grocery keywords
    if (lowerName.includes('أرز') || lowerName.includes('معكرونة') || lowerName.includes('طحين') ||
        lowerName.includes('سكر') || lowerName.includes('ملح') || lowerName.includes('زيت') ||
        lowerName.includes('شاي') || lowerName.includes('قهوة')) {
        return 'بقالة';
    }

    return 'أخرى';
};

export const useLifestyleStore = create<LifestyleState>((set, get) => ({
    shoppingList: [],
    recipes: [],
    cookingSessions: [],

    addShoppingItem: async (name, category) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const newItem = {
                user_id: user.id,
                name,
                category: category || categorizeItem(name),
                purchased: false,
                added_date: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('shopping_items')
                .insert(newItem)
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const item: ShoppingItem = {
                    id: data.id,
                    name: data.name,
                    category: data.category,
                    purchased: data.purchased,
                    addedDate: data.added_date
                };
                set({ shoppingList: [...get().shoppingList, item] });
            }
        } catch (error) {
            console.error('Error adding shopping item:', error);
        }
    },

    toggleShoppingItem: async (id) => {
        try {
            const item = get().shoppingList.find(i => i.id === id);
            if (!item) return;

            const { error } = await supabase
                .from('shopping_items')
                .update({ purchased: !item.purchased })
                .eq('id', id);

            if (error) throw error;

            set({
                shoppingList: get().shoppingList.map(i =>
                    i.id === id ? { ...i, purchased: !i.purchased } : i
                )
            });
        } catch (error) {
            console.error('Error toggling shopping item:', error);
        }
    },

    deleteShoppingItem: async (id) => {
        try {
            const { error } = await supabase
                .from('shopping_items')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set({ shoppingList: get().shoppingList.filter(i => i.id !== id) });
        } catch (error) {
            console.error('Error deleting shopping item:', error);
        }
    },

    clearPurchased: async () => {
        try {
            const purchasedIds = get().shoppingList
                .filter(i => i.purchased)
                .map(i => i.id);

            if (purchasedIds.length === 0) return;

            const { error } = await supabase
                .from('shopping_items')
                .delete()
                .in('id', purchasedIds);

            if (error) throw error;

            set({ shoppingList: get().shoppingList.filter(i => !i.purchased) });
        } catch (error) {
            console.error('Error clearing purchased items:', error);
        }
    },

    addRecipe: async (recipeData) => {
        const recipe: Recipe = {
            ...recipeData,
            id: Date.now().toString() + Math.random().toString(36).substring(2),
        };
        const updated = [...get().recipes, recipe];
        set({ recipes: updated });
        await dbOperations.saveData(DB_KEYS.RECIPES, updated);
    },

    deleteRecipe: async (id) => {
        const updated = get().recipes.filter(recipe => recipe.id !== id);
        set({ recipes: updated });
        await dbOperations.saveData(DB_KEYS.RECIPES, updated);
    },

    addIngredientsToShopping: async (recipeId) => {
        const recipe = get().recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        const newItems: ShoppingItem[] = recipe.ingredients.map(ingredient => ({
            id: Date.now().toString() + Math.random().toString(36).substring(2),
            name: ingredient,
            category: categorizeItem(ingredient),
            purchased: false,
            addedDate: new Date().toISOString(),
            fromRecipe: recipeId,
        }));

        const updated = [...get().shoppingList, ...newItems];
        set({ shoppingList: updated });
        await dbOperations.saveData(DB_KEYS.SHOPPING_LIST, updated);
    },

    startCookingSession: async (recipeId) => {
        const session: CookingSession = {
            id: Date.now().toString() + Math.random().toString(36).substring(2),
            recipeId,
            checkedIngredients: [],
            currentStep: 0,
            startTime: new Date().toISOString(),
        };
        const updated = [...get().cookingSessions, session];
        set({ cookingSessions: updated });
        await dbOperations.saveData('cooking-sessions', updated);
    },

    toggleIngredient: async (recipeId, ingredient) => {
        const updated = get().cookingSessions.map(session => {
            if (session.recipeId === recipeId) {
                const checked = session.checkedIngredients.includes(ingredient);
                return {
                    ...session,
                    checkedIngredients: checked
                        ? session.checkedIngredients.filter(i => i !== ingredient)
                        : [...session.checkedIngredients, ingredient],
                };
            }
            return session;
        });
        set({ cookingSessions: updated });
        await dbOperations.saveData('cooking-sessions', updated);
    },

    initialize: async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Load local data for recipes/sessions as before
            const [recipes, sessions] = await Promise.all([
                dbOperations.getData<Recipe[]>(DB_KEYS.RECIPES, []),
                dbOperations.getData<CookingSession[]>('cooking-sessions', []),
            ]);

            let shopping: ShoppingItem[] = [];

            if (user) {
                const { data, error } = await supabase
                    .from('shopping_items')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data) {
                    shopping = data.map(item => ({
                        id: item.id,
                        name: item.name,
                        category: item.category,
                        purchased: item.purchased,
                        addedDate: item.added_date,
                        fromRecipe: item.from_recipe
                    }));
                }
            } else {
                // Fallback to local if no user (guest mode?)
                // Or maybe we just don't load anything?
                // For now let's keep it empty or load from local if we want guest persistence
                // But the prompt implies syncing.
                // Let's load from local as fallback for guest
                shopping = await dbOperations.getData<ShoppingItem[]>(DB_KEYS.SHOPPING_LIST, []);
            }

            set({ shoppingList: shopping, recipes, cookingSessions: sessions });
        } catch (error) {
            console.error('Failed to initialize lifestyle store:', error);
        }
    },
}));
