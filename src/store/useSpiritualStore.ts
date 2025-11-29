import { create } from 'zustand';
import type { PrayerTime, ReadingGoal, AdhkarCounter, PrayerNotificationSettings } from '../types';
import { supabase } from '../services/supabase';
import { fetchPrayerTimesFromAladhan } from '../utils/aladhanApi';
import { dbOperations, DB_KEYS } from '../utils/db';

interface ReadingGoalRow {
    id: string;
    user_id: string;
    book_name: string;
    total_pages: number;
    current_page: number;
    deadline_days: number;
    pages_per_day: number;
    start_date: string;
    is_quran: boolean;
    mode: 'pages' | 'time';
    completed: boolean;
    scope_type: 'surah' | 'juz' | 'all';
    scope_value: number;
    daily_target: number;
    duration_days: number;
    created_at: string;
}

interface AdhkarRow {
    id: string;
    user_id: string;
    name: string;
    count: number;
    target: number;
    type: 'morning' | 'evening' | 'post_prayer' | 'general';
    created_at: string;
}

interface PrayerSettingsRow {
    id: string;
    user_id: string;
    notify_at_adhan: boolean;
    notify_before_adhan: boolean;
    minutes_before_adhan: number;
    created_at: string;
}

interface SpiritualState {
    // Prayer Times
    prayerTimes: PrayerTime[];
    setPrayerTimes: (data: PrayerTime[]) => Promise<void>;
    checkAndFetchPrayerTimes: () => Promise<void>;

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
        // Prayer times are usually fetched from API daily, maybe we don't need to store them in DB?
        // Or maybe we store them for offline access.
        // For now, let's keep them in local storage or just memory if we fetch them daily.
        // But the user asked to "connect prayer times to DB".
        // Let's assume we just store settings in DB and fetch times from API.
        // But if I must store them:
        // The schema didn't have a prayer_times table, only settings.
        // I'll stick to local storage for the actual times for now as they are transient, 
        // or just keep them in memory.
        localStorage.setItem('prayer_times', JSON.stringify(data));
    },

    addReadingGoal: async (goalData: Omit<ReadingGoal, 'id'>) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // Local storage fallback
                const newGoal: ReadingGoal = {
                    ...goalData,
                    totalPages: Number(goalData.totalPages),
                    currentPage: Number(goalData.currentPage),
                    deadlineDays: Number(goalData.deadlineDays),
                    pagesPerDay: Number(goalData.pagesPerDay),
                    scopeValue: Number(goalData.scopeValue),
                    dailyTarget: Number(goalData.dailyTarget),
                    durationDays: Number(goalData.durationDays),
                    id: crypto.randomUUID(),
                    completed: false
                };
                const updatedGoals = [...get().readingGoals, newGoal];
                set({ readingGoals: updatedGoals });
                await dbOperations.saveData(DB_KEYS.READING_GOALS, updatedGoals);
                return;
            }

            const { data, error } = await supabase
                .from('reading_goals')
                .insert([{
                    user_id: session.user.id,
                    book_name: goalData.bookName,
                    total_pages: Number(goalData.totalPages),
                    current_page: Number(goalData.currentPage),
                    deadline_days: Number(goalData.deadlineDays),
                    pages_per_day: Number(goalData.pagesPerDay),
                    start_date: goalData.startDate,
                    is_quran: goalData.isQuran,
                    mode: goalData.mode,
                    completed: false,
                    scope_type: goalData.scopeType,
                    scope_value: Number(goalData.scopeValue),
                    daily_target: Number(goalData.dailyTarget),
                    duration_days: Number(goalData.durationDays)
                }])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const newGoal: ReadingGoal = {
                    id: data.id,
                    bookName: data.book_name,
                    totalPages: data.total_pages,
                    currentPage: data.current_page,
                    deadlineDays: data.deadline_days,
                    pagesPerDay: data.pages_per_day,
                    startDate: data.start_date,
                    isQuran: data.is_quran,
                    mode: data.mode as any, // Cast to any to avoid strict enum check if DB returns string
                    completed: data.completed,
                    scopeType: data.scope_type as any,
                    scopeValue: data.scope_value,
                    dailyTarget: data.daily_target,
                    durationDays: data.duration_days
                };
                set((state: SpiritualState) => ({
                    readingGoals: [...state.readingGoals, newGoal]
                }));
            }
        } catch (error) {
            console.error('Error adding reading goal:', error);
        }
    },

    updateReadingProgress: async (id: string, currentPage: number) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            // Optimistic update
            const updatedGoals = get().readingGoals.map(g =>
                g.id === id ? { ...g, currentPage } : g
            );
            set({ readingGoals: updatedGoals });

            if (!session) {
                await dbOperations.saveData(DB_KEYS.READING_GOALS, updatedGoals);
                return;
            }

            if (session) {
                const { error } = await supabase
                    .from('reading_goals')
                    .update({ current_page: currentPage })
                    .eq('id', id);

                if (error) throw error;
            }
        } catch (error) {
            console.error('Error updating reading progress:', error);
        }
    },

    deleteReadingGoal: async (id: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            const updatedGoals = get().readingGoals.filter(g => g.id !== id);
            set({ readingGoals: updatedGoals });

            if (!session) {
                await dbOperations.saveData(DB_KEYS.READING_GOALS, updatedGoals);
                return;
            }

            if (session) {
                const { error } = await supabase
                    .from('reading_goals')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
            }
        } catch (error) {
            console.error('Error deleting reading goal:', error);
        }
    },

    addAdhkar: async (adhkarData: Omit<AdhkarCounter, 'id'>) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                const newAdhkar: AdhkarCounter = {
                    ...adhkarData,
                    id: crypto.randomUUID()
                };
                const updatedAdhkar = [...get().adhkarCounters, newAdhkar];
                set({ adhkarCounters: updatedAdhkar });
                await dbOperations.saveData(DB_KEYS.ADHKAR, updatedAdhkar);
                return;
            }

            const { data, error } = await supabase
                .from('adhkar')
                .insert([{
                    user_id: session.user.id,
                    name: adhkarData.name,
                    count: adhkarData.count,
                    target: adhkarData.target,
                    type: adhkarData.type
                }])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const newAdhkar: AdhkarCounter = {
                    id: data.id,
                    name: data.name,
                    count: data.count,
                    target: data.target,
                    type: data.type as any
                };
                set((state: SpiritualState) => ({
                    adhkarCounters: [...state.adhkarCounters, newAdhkar]
                }));
            }
        } catch (error) {
            console.error('Error adding adhkar:', error);
        }
    },

    incrementAdhkar: async (id: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            // Optimistic update
            const updatedAdhkar = get().adhkarCounters.map(a =>
                a.id === id ? { ...a, count: a.count + 1 } : a
            );
            set({ adhkarCounters: updatedAdhkar });

            if (!session) {
                await dbOperations.saveData(DB_KEYS.ADHKAR, updatedAdhkar);
                return;
            }

            if (session) {
                const current = get().adhkarCounters.find(a => a.id === id);
                if (current) {
                    const { error } = await supabase
                        .from('adhkar')
                        .update({ count: current.count })
                        .eq('id', id);
                    if (error) throw error;
                }
            }
        } catch (error) {
            console.error('Error incrementing adhkar:', error);
        }
    },

    resetAdhkar: async (id: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            const updatedAdhkar = get().adhkarCounters.map(a =>
                a.id === id ? { ...a, count: 0 } : a
            );
            set({ adhkarCounters: updatedAdhkar });

            if (!session) {
                await dbOperations.saveData(DB_KEYS.ADHKAR, updatedAdhkar);
                return;
            }

            if (session) {
                const { error } = await supabase
                    .from('adhkar')
                    .update({ count: 0 })
                    .eq('id', id);
                if (error) throw error;
            }
        } catch (error) {
            console.error('Error resetting adhkar:', error);
        }
    },

    deleteAdhkar: async (id: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            const updatedAdhkar = get().adhkarCounters.filter(a => a.id !== id);
            set({ adhkarCounters: updatedAdhkar });

            if (!session) {
                await dbOperations.saveData(DB_KEYS.ADHKAR, updatedAdhkar);
                return;
            }

            if (session) {
                const { error } = await supabase
                    .from('adhkar')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            }
        } catch (error) {
            console.error('Error deleting adhkar:', error);
        }
    },

    updateNotificationSettings: async (settings: Partial<PrayerNotificationSettings>) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            const updated = { ...get().notificationSettings, ...settings };
            set({ notificationSettings: updated });

            if (!session) {
                // Save to local storage for guest
                // Assuming we might want to save settings locally too
                // But dbOperations doesn't have a specific key for prayer settings, maybe use generic SETTINGS?
                // Or just rely on default for now as per original code.
                // Actually, let's save it to localStorage directly or use a new key.
                // dbOperations has saveSettings but that might be for app-wide settings.
                // Let's use localStorage for simplicity as it was before for some things.
                localStorage.setItem('prayer_notification_settings', JSON.stringify(updated));
                return;
            }

            if (session) {
                const { error } = await supabase
                    .from('prayer_settings')
                    .upsert({
                        user_id: session.user.id,
                        notify_at_adhan: updated.enabled,
                        notify_before_adhan: updated.preAdhan,
                        minutes_before_adhan: updated.minutesBefore
                    });

                if (error) throw error;
            }
        } catch (error) {
            console.error('Error updating notification settings:', error);
        }
    },

    initialize: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            // Load prayer times from local storage first
            const prayerTimes = JSON.parse(localStorage.getItem('prayer_times') || '[]');

            // Load other data if session exists
            let readingGoals: ReadingGoal[] = [];
            let adhkarCounters: AdhkarCounter[] = [];
            let settings = defaultNotificationSettings;

            if (session) {
                const [goalsRes, adhkarRes, settingsRes] = await Promise.all([
                    supabase.from('reading_goals').select('*'),
                    supabase.from('adhkar').select('*'),
                    supabase.from('prayer_settings').select('*').single()
                ]);

                readingGoals = ((goalsRes.data || []) as ReadingGoalRow[]).map(g => ({
                    id: g.id,
                    bookName: g.book_name,
                    totalPages: g.total_pages,
                    currentPage: g.current_page,
                    deadlineDays: g.deadline_days,
                    pagesPerDay: g.pages_per_day,
                    startDate: g.start_date,
                    isQuran: g.is_quran,
                    mode: g.mode,
                    completed: g.completed,
                    scopeType: g.scope_type,
                    scopeValue: g.scope_value,
                    dailyTarget: g.daily_target,
                    durationDays: g.duration_days
                }));

                adhkarCounters = ((adhkarRes.data || []) as AdhkarRow[]).map(a => ({
                    id: a.id,
                    name: a.name,
                    count: a.count,
                    target: a.target,
                    type: a.type
                }));

                if (settingsRes.data) {
                    const settingsData = settingsRes.data as PrayerSettingsRow;
                    settings = {
                        enabled: settingsData.notify_at_adhan,
                        preAdhan: settingsData.notify_before_adhan,
                        duringAdhan: settingsData.notify_at_adhan,
                        minutesBefore: settingsData.minutes_before_adhan
                    };
                }
            } else {
                // Load from local storage for guest
                const [goals, adhkar] = await Promise.all([
                    dbOperations.getData<ReadingGoal[]>(DB_KEYS.READING_GOALS, []),
                    dbOperations.getData<AdhkarCounter[]>(DB_KEYS.ADHKAR, [])
                ]);
                readingGoals = goals;
                adhkarCounters = adhkar;

                const localSettings = localStorage.getItem('prayer_notification_settings');
                if (localSettings) {
                    settings = JSON.parse(localSettings);
                }
            }

            set({
                readingGoals,
                adhkarCounters,
                notificationSettings: settings,
                prayerTimes
            });

            // Check and fetch prayer times if needed (for current month)
            await get().checkAndFetchPrayerTimes();

        } catch (error) {
            console.error('Failed to initialize spiritual store:', error);
        }
    },

    checkAndFetchPrayerTimes: async () => {
        try {
            const { prayerTimes } = get();
            const currentMonthPrefix = `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;
            const hasCurrentMonth = prayerTimes.some(pt => pt.date.startsWith(currentMonthPrefix));

            if (!hasCurrentMonth) {
                console.log('Fetching prayer times for current month...');
                const calculationMethod = parseInt(localStorage.getItem('calculationMethod') || '2'); // 2 is ISNA default

                const fetched = await fetchPrayerTimesFromAladhan(
                    new Date().getFullYear(),
                    new Date().getMonth() + 1,
                    calculationMethod
                );

                if (fetched.length > 0) {
                    const existingDates = new Set(prayerTimes.map(pt => pt.date));
                    const newTimes = fetched.filter(pt => !existingDates.has(pt.date));
                    const merged = [...prayerTimes, ...newTimes].sort((a, b) => a.date.localeCompare(b.date));

                    set({ prayerTimes: merged });
                    localStorage.setItem('prayer_times', JSON.stringify(merged));
                }
            }
        } catch (error) {
            console.error('Error auto-fetching prayer times:', error);
        }
    }
}));
