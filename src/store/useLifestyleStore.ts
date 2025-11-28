import { create } from 'zustand';
import type { ShoppingItem, Recipe, CookingSession, ShoppingCategory } from '../types';
import { dbOperations, DB_KEYS } from '../utils/db';

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
        const item: ShoppingItem = {
            id: crypto.randomUUID(),
            name,
            category: category || categorizeItem(name),
            purchased: false,
            addedDate: new Date().toISOString(),
        };
        const updated = [...get().shoppingList, item];
        set({ shoppingList: updated });
        await dbOperations.saveData(DB_KEYS.SHOPPING_LIST, updated);
    },

    toggleShoppingItem: async (id) => {
        const updated = get().shoppingList.map(item =>
            item.id === id ? { ...item, purchased: !item.purchased } : item
        );
        set({ shoppingList: updated });
        await dbOperations.saveData(DB_KEYS.SHOPPING_LIST, updated);
    },

    deleteShoppingItem: async (id) => {
        const updated = get().shoppingList.filter(item => item.id !== id);
        set({ shoppingList: updated });
        await dbOperations.saveData(DB_KEYS.SHOPPING_LIST, updated);
    },

    clearPurchased: async () => {
        const updated = get().shoppingList.filter(item => !item.purchased);
        set({ shoppingList: updated });
        await dbOperations.saveData(DB_KEYS.SHOPPING_LIST, updated);
    },

    addRecipe: async (recipeData) => {
        const recipe: Recipe = {
            ...recipeData,
            id: crypto.randomUUID(),
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
            id: crypto.randomUUID(),
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
            id: crypto.randomUUID(),
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
            const [shopping, recipes, sessions] = await Promise.all([
                dbOperations.getData<ShoppingItem[]>(DB_KEYS.SHOPPING_LIST, []),
                dbOperations.getData<Recipe[]>(DB_KEYS.RECIPES, []),
                dbOperations.getData<CookingSession[]>('cooking-sessions', []),
            ]);

            set({ shoppingList: shopping, recipes, cookingSessions: sessions });
        } catch (error) {
            console.error('Failed to initialize lifestyle store:', error);
        }
    },
}));
