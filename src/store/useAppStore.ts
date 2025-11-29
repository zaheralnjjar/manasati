import { create } from 'zustand';
import type { AppSettings, WidgetVisibility } from '../types';
import { dbOperations } from '../utils/db';
import { supabase } from '../services/supabase';
import type { Session } from '@supabase/supabase-js';
import { useFinanceStore } from './useFinanceStore';
import { useSpiritualStore } from './useSpiritualStore';
import { useDevelopmentStore } from './useDevelopmentStore';
import { useProductivityStore } from './useProductivityStore';
import { useMasariStore } from './useMasariStore';
import { useLifestyleStore } from './useLifestyleStore';
import { useWhatsAppStore } from './useWhatsAppStore';

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

    // User & Auth
    session: Session | null;
    setSession: (session: Session | null) => void;
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

    // Guest Access
    isGuest: boolean;
    setGuest: (isGuest: boolean) => void;

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
    isLoading: true, // Start loading
    isVoiceActive: false,
    session: null,
    isGuest: false,

    setCurrentPage: (page) => set({ currentPage: page }),
    setSession: (session) => set({
        session,
        user: session ? {
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'مستخدم',
            email: session.user.email
        } : undefined
    }),
    setGuest: (isGuest) => set({ isGuest }),

    updateSettings: async (newSettings) => {
        const updated = { ...get().settings, ...newSettings };
        set({ settings: updated });

        // Save to local storage
        await dbOperations.saveSettings(updated);

        // Sync with Supabase
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error } = await supabase
                    .from('app_settings')
                    .upsert({
                        user_id: user.id,
                        theme: updated.theme,
                        widget_visibility: updated.widgetVisibility,
                        nav_visibility: updated.navVisibility,
                        ticker_speed: updated.tickerSpeed,
                        notifications_enabled: updated.notificationsEnabled,
                        language: updated.language,
                        updated_at: new Date().toISOString()
                    });
                if (error) throw error;
            }
        } catch (error) {
            console.error('Error syncing settings:', error);
        }
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

        // Save to local storage
        await dbOperations.saveSettings(updated);

        // Sync with Supabase
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error } = await supabase
                    .from('app_settings')
                    .upsert({
                        user_id: user.id,
                        theme: updated.theme,
                        widget_visibility: updated.widgetVisibility,
                        nav_visibility: updated.navVisibility,
                        ticker_speed: updated.tickerSpeed,
                        notifications_enabled: updated.notificationsEnabled,
                        language: updated.language,
                        updated_at: new Date().toISOString()
                    });
                if (error) throw error;
            }
        } catch (error) {
            console.error('Error syncing widget toggle:', error);
        }
    },

    toggleTheme: async () => {
        const currentTheme = get().settings.theme;
        const newTheme: 'dark' | 'light' = currentTheme === 'dark' ? 'light' : 'dark';
        const updated: AppSettings = { ...get().settings, theme: newTheme };
        set({ settings: updated });

        // Save to local storage
        await dbOperations.saveSettings(updated);

        // Update DOM
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Sync with Supabase
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error } = await supabase
                    .from('app_settings')
                    .upsert({
                        user_id: user.id,
                        theme: updated.theme,
                        widget_visibility: updated.widgetVisibility,
                        nav_visibility: updated.navVisibility,
                        ticker_speed: updated.tickerSpeed,
                        notifications_enabled: updated.notificationsEnabled,
                        language: updated.language,
                        updated_at: new Date().toISOString()
                    });
                if (error) throw error;
            }
        } catch (error) {
            console.error('Error syncing theme:', error);
        }
    },

    setIsLoading: (loading) => set({ isLoading: loading }),

    setVoiceActive: (active) => set({ isVoiceActive: active }),

    initialize: async () => {
        set({ isLoading: true });
        try {
            // 1. Check Auth Session
            const { data: { session } } = await supabase.auth.getSession();
            set({
                session,
                user: session ? {
                    name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'مستخدم',
                    email: session.user.email
                } : undefined
            });

            // Listen for auth changes
            supabase.auth.onAuthStateChange((_event, session) => {
                set({
                    session,
                    user: session ? {
                        name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'مستخدم',
                        email: session.user.email
                    } : undefined
                });

                // Re-initialize stores on auth change
                Promise.all([
                    useFinanceStore.getState().initialize(),
                    useSpiritualStore.getState().initialize(),
                    useDevelopmentStore.getState().initialize(),
                    useProductivityStore.getState().initialize(),
                    useMasariStore.getState().initialize(),
                    useLifestyleStore.getState().initialize(),
                    useWhatsAppStore.getState().initialize()
                ]).catch(console.error);
            });

            // 2. Load Settings
            let settings = defaultSettings;

            // Try loading from Supabase first if user is logged in
            if (session) {
                const { data, error } = await supabase
                    .from('app_settings')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .single();

                if (data) {
                    settings = {
                        ...defaultSettings,
                        theme: data.theme,
                        widgetVisibility: data.widget_visibility,
                        navVisibility: data.nav_visibility,
                        tickerSpeed: data.ticker_speed,
                        notificationsEnabled: data.notifications_enabled,
                        language: data.language
                    };
                }
            } else {
                // Fallback to local storage
                const savedSettings = await dbOperations.getSettings();
                if (savedSettings) {
                    settings = {
                        ...defaultSettings,
                        ...(savedSettings as AppSettings),
                        widgetVisibility: { ...defaultSettings.widgetVisibility, ...((savedSettings as AppSettings).widgetVisibility || {}) },
                        navVisibility: { ...defaultSettings.navVisibility, ...((savedSettings as AppSettings).navVisibility || {}) }
                    };
                }
            }

            set({ settings });

            // Apply theme
            if (settings.theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }

            // Save to local storage to keep it in sync
            await dbOperations.saveSettings(settings);

            // 3. Initialize all other stores
            await Promise.all([
                useFinanceStore.getState().initialize(),
                useSpiritualStore.getState().initialize(),
                useDevelopmentStore.getState().initialize(),
                useProductivityStore.getState().initialize(),
                useMasariStore.getState().initialize(),
                useLifestyleStore.getState().initialize(),
                useWhatsAppStore.getState().initialize()
            ]);

        } catch (error) {
            console.error('Failed to initialize app:', error);
        } finally {
            set({ isLoading: false });
        }
    },
}));
