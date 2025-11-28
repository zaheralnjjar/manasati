import { storage } from './storage';
import type { ShoppingItem } from '../types';

export const addShoppingItemToSystem = (name: string) => {
    const items = storage.get<ShoppingItem[]>('shoppingList') || [];

    const newItem: ShoppingItem = {
        id: crypto.randomUUID(),
        name: name,
        category: 'general',
        addedDate: new Date().toISOString(),
        purchased: false
    };

    const updatedItems = [...items, newItem];
    storage.set('shoppingList', updatedItems);
    window.dispatchEvent(new Event('shopping-updated'));

    return newItem;
};

export const removeShoppingItemFromSystem = (id: string) => {
    const items = storage.get<ShoppingItem[]>('shoppingList') || [];
    const updatedItems = items.filter(i => i.id !== id);
    storage.set('shoppingList', updatedItems);
    window.dispatchEvent(new Event('shopping-updated'));
};

export const getShoppingListFromSystem = (): ShoppingItem[] => {
    return storage.get<ShoppingItem[]>('shoppingList') || [];
};
