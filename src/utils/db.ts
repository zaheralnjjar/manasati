import { get, set, del, keys, clear } from 'idb-keyval';

// Database keys
export const DB_KEYS = {
    PRAYER_TIMES: 'prayer-times',
    READING_GOALS: 'reading-goals',
    ADHKAR: 'adhkar',
    TASKS: 'tasks',
    APPOINTMENTS: 'appointments',
    YOUTUBE_VIDEOS: 'youtube-videos',
    HABITS: 'habits',
    SHOPPING_LIST: 'shopping-list',
    RECIPES: 'recipes',
    INCOME: 'income',
    EXPENSES: 'expenses',
    SETTINGS: 'settings',
    WHATSAPP_CONTACTS: 'whatsapp-contacts',
} as const;

// Generic database operations
export const db = {
    async get<T>(key: string): Promise<T | undefined> {
        return await get(key);
    },

    async set<T>(key: string, value: T): Promise<void> {
        await set(key, value);
    },

    async delete(key: string): Promise<void> {
        await del(key);
    },

    async getAllKeys(): Promise<string[]> {
        return await keys() as string[];
    },

    async clear(): Promise<void> {
        await clear();
    },
};

// Specific data operations
export const dbOperations = {
    // Prayer Times
    async savePrayerTimes(data: any) {
        await db.set(DB_KEYS.PRAYER_TIMES, data);
    },

    async getPrayerTimes() {
        return await db.get(DB_KEYS.PRAYER_TIMES);
    },

    // Tasks
    async saveTasks(tasks: any[]) {
        await db.set(DB_KEYS.TASKS, tasks);
    },

    async getTasks() {
        return await db.get<any[]>(DB_KEYS.TASKS) || [];
    },

    // Shopping List
    async saveShoppingList(items: any[]) {
        await db.set(DB_KEYS.SHOPPING_LIST, items);
    },

    async getShoppingList() {
        return await db.get<any[]>(DB_KEYS.SHOPPING_LIST) || [];
    },

    // Settings
    async saveSettings(settings: any) {
        await db.set(DB_KEYS.SETTINGS, settings);
    },

    async getSettings() {
        return await db.get(DB_KEYS.SETTINGS);
    },

    // Generic save for any key
    async saveData(key: string, data: any) {
        await db.set(key, data);
    },

    async getData<T>(key: string, defaultValue?: T): Promise<T> {
        const data = await db.get<T>(key);
        return data !== undefined ? data : (defaultValue as T);
    },
};
