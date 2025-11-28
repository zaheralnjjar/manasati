export const storage = {
    get: <T>(key: string): T | null => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`Error getting ${key} from storage:`, error);
            return null;
        }
    },

    set: <T>(key: string, value: T): void => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error setting ${key} in storage:`, error);
        }
    },

    remove: (key: string): void => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing ${key} from storage:`, error);
        }
    },

    clear: (): void => {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
    },

    // New method to retrieve all stored keys
    keys: (): string[] => {
        try {
            return Object.keys(localStorage);
        } catch (error) {
            console.error('Error getting keys from localStorage', error);
            return [];
        }
    },

    getAll: (): Record<string, any> => {
        try {
            const all: Record<string, any> = {};
            Object.keys(localStorage).forEach(key => {
                all[key] = storage.get(key);
            });
            return all;
        } catch (error) {
            console.error('Error getting all from localStorage', error);
            return {};
        }
    }
};
