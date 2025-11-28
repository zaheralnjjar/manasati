import { create } from 'zustand';
import type { AppSettings, WidgetVisibility } from '../types';
import { dbOperations } from '../utils/db';

export type PageType =
    | 'dashboard'
    | 'tasks'
    | 'shopping'
    | 'budget'
    | 'worship'
    | 'development'
    | 'prayer'
    | 'masari'
    | 'settings';

interface AppState {
    // Navigation
    currentPage: PageType;
    setCurrentPage: (page: PageType) => void;

    // User
    user?: {
        name: string;
        email?: string;
    };

    // Settings
    settings: AppSettings;
    updateSettings: (settings: Partial<AppSettings>) => void;
    toggleWidget: (widget: keyof WidgetVisibility) => void;
    toggleTheme: () => void;

    // Loading states
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;

    // Voice Assistant
    isVoiceActive: boolean;
    setVoiceActive: (active: boolean) => void;

    // Initialize
    initialize: () => Promise<void>;
}

const defaultSettings: AppSettings = {
    theme: 'dark',
    widgetVisibility: {
        nextPrayer: true,
        nextTask: true,
        budget: true,
        readingProgress: true,
    },
    navVisibility: {
        dashboard: true,
        worship: true,
        tasks: true,
        masari: true,
        shopping: true,
        budget: true,
        development: true,
    },
    tickerSpeed: 30,
    notificationsEnabled: true,
    language: 'ar',
};

export const useAppStore = create<AppState>((set, get) => ({
    currentPage: 'dashboard',
    settings: defaultSettings,
    isLoading: false,
    isVoiceActive: false,

    setCurrentPage: (page) => set({ currentPage: page }),

    updateSettings: async (newSettings) => {
        const updated = { ...get().settings, ...newSettings };
        set({ settings: updated });
        await dbOperations.saveSettings(updated);
    },

    toggleWidget: async (widget) => {
        const current = get().settings.widgetVisibility;
        const updated = {
            ...get().settings,
            widgetVisibility: {
                ...current,
                [widget]: !current[widget],
            },
        };
        set({ settings: updated });
        await dbOperations.saveSettings(updated);
    },

    toggleTheme: async () => {
        const currentTheme = get().settings.theme;
        const newTheme: 'dark' | 'light' = currentTheme === 'dark' ? 'light' : 'dark';
        const updated: AppSettings = { ...get().settings, theme: newTheme };
        set({ settings: updated });
        await dbOperations.saveSettings(updated);

        // Update DOM
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    },

    setIsLoading: (loading) => set({ isLoading: loading }),

    setVoiceActive: (active) => set({ isVoiceActive: active }),

    initialize: async () => {
        set({ isLoading: true });
        try {
            const savedSettings = await dbOperations.getSettings();
            if (savedSettings) {
                const settings = savedSettings as AppSettings;
                // Merge saved settings with defaults to ensure all keys exist
                const mergedSettings = {
                    ...defaultSettings,
                    ...settings,
                    widgetVisibility: { ...defaultSettings.widgetVisibility, ...(settings.widgetVisibility || {}) },
                    navVisibility: { ...defaultSettings.navVisibility, ...(settings.navVisibility || {}) }
                };
                set({ settings: mergedSettings });

                // Apply theme
                if (settings.theme === 'dark') {
                    document.documentElement.classList.add('dark');
                }
            } else {
                await dbOperations.saveSettings(defaultSettings);
            }
        } catch (error) {
            console.error('Failed to initialize app:', error);
        } finally {
            set({ isLoading: false });
        }
    },
}));
