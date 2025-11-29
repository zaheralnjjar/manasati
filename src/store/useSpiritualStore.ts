import { create } from 'zustand';
import type { PrayerTime, ReadingGoal, AdhkarCounter, PrayerNotificationSettings } from '../types';
import { dbOperations, DB_KEYS } from '../utils/db';

interface SpiritualState {
    // Prayer Times
    prayerTimes: PrayerTime[];
    setPrayerTimes: (data: PrayerTime[]) => Promise<void>;

    // Reading Goals
    readingGoals: ReadingGoal[];
    addReadingGoal: (goal: Omit<ReadingGoal, 'id'>) => Promise<void>;
    updateReadingProgress: (id: string, currentPage: number) => Promise<void>;
    deleteReadingGoal: (id: string) => Promise<void>;

    // Adhkar
    adhkarCounters: AdhkarCounter[];
    addAdhkar: (adhkar: Omit<AdhkarCounter, 'id'>) => Promise<void>;
    incrementAdhkar: (id: string) => Promise<void>;
    resetAdhkar: (id: string) => Promise<void>;
    deleteAdhkar: (id: string) => Promise<void>;

    // Notifications
    notificationSettings: PrayerNotificationSettings;
    updateNotificationSettings: (settings: Partial<PrayerNotificationSettings>) => Promise<void>;

    // Initialize
    initialize: () => Promise<void>;
}

const defaultNotificationSettings: PrayerNotificationSettings = {
    enabled: true,
    preAdhan: true,
    duringAdhan: true,
    minutesBefore: 15,
};

export const useSpiritualStore = create<SpiritualState>((set, get) => ({
    prayerTimes: [],
    readingGoals: [],
    adhkarCounters: [],
    notificationSettings: defaultNotificationSettings,

    setPrayerTimes: async (data) => {
        set({ prayerTimes: data });
        await dbOperations.saveData(DB_KEYS.PRAYER_TIMES, data);
    },

    addReadingGoal: async (goalData) => {
        const goal: ReadingGoal = {
            ...goalData,
            id: Date.now().toString() + Math.random().toString(36).substring(2),
        };
        const updated = [...get().readingGoals, goal];
        set({ readingGoals: updated });
        await dbOperations.saveData(DB_KEYS.READING_GOALS, updated);
    },

    updateReadingProgress: async (id, currentPage) => {
        const updated = get().readingGoals.map(goal => {
            if (goal.id === id) {
                const completed = currentPage >= goal.totalPages;
                return { ...goal, currentPage, completed };
            }
            return goal;
        });
        set({ readingGoals: updated });
        await dbOperations.saveData(DB_KEYS.READING_GOALS, updated);
    },

    deleteReadingGoal: async (id) => {
        const updated = get().readingGoals.filter(goal => goal.id !== id);
        set({ readingGoals: updated });
        await dbOperations.saveData(DB_KEYS.READING_GOALS, updated);
    },

    addAdhkar: async (adhkarData) => {
        const adhkar: AdhkarCounter = {
            ...adhkarData,
            id: Date.now().toString() + Math.random().toString(36).substring(2),
        };
        const updated = [...get().adhkarCounters, adhkar];
        set({ adhkarCounters: updated });
        await dbOperations.saveData(DB_KEYS.ADHKAR, updated);
    },

    incrementAdhkar: async (id) => {
        const updated = get().adhkarCounters.map(adhkar => {
            if (adhkar.id === id) {
                return { ...adhkar, count: Math.min(adhkar.count + 1, adhkar.target) };
            }
            return adhkar;
        });
        set({ adhkarCounters: updated });
        await dbOperations.saveData(DB_KEYS.ADHKAR, updated);
    },

    resetAdhkar: async (id) => {
        const updated = get().adhkarCounters.map(adhkar => {
            if (adhkar.id === id) {
                return { ...adhkar, count: 0 };
            }
            return adhkar;
        });
        set({ adhkarCounters: updated });
        await dbOperations.saveData(DB_KEYS.ADHKAR, updated);
    },

    deleteAdhkar: async (id) => {
        const updated = get().adhkarCounters.filter(adhkar => adhkar.id !== id);
        set({ adhkarCounters: updated });
        await dbOperations.saveData(DB_KEYS.ADHKAR, updated);
    },

    updateNotificationSettings: async (settings) => {
        const updated = { ...get().notificationSettings, ...settings };
        set({ notificationSettings: updated });
        await dbOperations.saveData('notification-settings', updated);
    },

    initialize: async () => {
        try {
            const [prayerTimes, readingGoals, adhkar, notifSettings] = await Promise.all([
                dbOperations.getData<PrayerTime[]>(DB_KEYS.PRAYER_TIMES, []),
                dbOperations.getData<ReadingGoal[]>(DB_KEYS.READING_GOALS, []),
                dbOperations.getData<AdhkarCounter[]>(DB_KEYS.ADHKAR, []),
                dbOperations.getData('notification-settings', defaultNotificationSettings),
            ]);

            set({
                prayerTimes: prayerTimes || [],
                readingGoals,
                adhkarCounters: adhkar,
                notificationSettings: notifSettings,
            });
        } catch (error) {
            console.error('Failed to initialize spiritual store:', error);
        }
    },
}));
