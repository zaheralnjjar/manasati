import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { DevelopmentGoal } from '../types';
import { useProductivityStore } from './useProductivityStore';
import { dbOperations } from '../utils/db';

const DB_KEY_GOALS = 'development_goals';

interface DevelopmentState {
    goals: DevelopmentGoal[];
    addGoal: (goal: Omit<DevelopmentGoal, 'id' | 'createdAt' | 'status'>) => Promise<void>;
    updateGoal: (id: string, updates: Partial<Omit<DevelopmentGoal, 'id' | 'createdAt'>>) => Promise<void>;
    toggleStatus: (id: string) => Promise<void>;
    deleteGoal: (id: string) => Promise<void>;
    initialize: () => Promise<void>;
}

export const useDevelopmentStore = create<DevelopmentState>((set, get) => ({
    goals: [],

    initialize: async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // Load from local storage for guest
                const goals = await dbOperations.getData<DevelopmentGoal[]>(DB_KEY_GOALS, []);
                set({ goals });
                return;
            }

            const { data, error } = await supabase
                .from('development_goals')
                .select('*');

            if (error) throw error;

            if (data) {
                const goals: DevelopmentGoal[] = data.map(g => ({
                    id: g.id,
                    title: g.title,
                    type: g.type,
                    frequency: g.frequency,
                    status: g.status,
                    link: g.link,
                    createdAt: g.created_at
                }));
                set({ goals });
            }
        } catch (error) {
            console.error('Error initializing development goals:', error);
        }
    },

    addGoal: async (goalData) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                const newGoal: DevelopmentGoal = {
                    id: crypto.randomUUID(),
                    title: goalData.title,
                    type: goalData.type,
                    frequency: goalData.frequency,
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    link: goalData.link
                };
                const updatedGoals = [...get().goals, newGoal];
                set({ goals: updatedGoals });
                await dbOperations.saveData(DB_KEY_GOALS, updatedGoals);

                // Sync to Tasks for guest
                if (goalData.frequency === 'once' || goalData.frequency === 'daily') {
                    const taskTitle = `${goalData.type === 'book' ? 'قراءة' : goalData.type === 'video' ? 'مشاهدة' : 'إنجاز'}: ${goalData.title}`;
                    useProductivityStore.getState().addTask({
                        title: taskTitle,
                        completed: false,
                        date: new Date().toISOString(),
                        priority: 'medium',
                        section: 'self-dev',
                        recurrence: { type: 'none' }
                    });
                }
                return;
            }

            const newGoal = {
                user_id: user.id,
                title: goalData.title,
                type: goalData.type,
                frequency: goalData.frequency,
                status: 'active',
                link: goalData.link
            };

            const { data, error } = await supabase
                .from('development_goals')
                .insert(newGoal)
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const createdGoal: DevelopmentGoal = {
                    id: data.id,
                    title: data.title,
                    type: data.type,
                    frequency: data.frequency,
                    status: data.status,
                    link: data.link,
                    createdAt: data.created_at
                };

                set({ goals: [...get().goals, createdGoal] });

                // Sync to Tasks if it's a "once" goal or "daily" habit
                if (goalData.frequency === 'once' || goalData.frequency === 'daily') {
                    const taskTitle = `${goalData.type === 'book' ? 'قراءة' : goalData.type === 'video' ? 'مشاهدة' : 'إنجاز'}: ${goalData.title}`;

                    // We use the productivity store to add the task so it also goes to Supabase
                    useProductivityStore.getState().addTask({
                        title: taskTitle,
                        completed: false,
                        date: new Date().toISOString(),
                        priority: 'medium',
                        section: 'self-dev',
                        recurrence: { type: 'none' }
                    });
                }
            }
        } catch (error) {
            console.error('Error adding development goal:', error);
        }
    },

    updateGoal: async (id, updates) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const updatedGoals = get().goals.map(g =>
                g.id === id ? { ...g, ...updates } : g
            );
            set({ goals: updatedGoals });

            if (!user) {
                await dbOperations.saveData(DB_KEY_GOALS, updatedGoals);
                return;
            }

            const { error } = await supabase
                .from('development_goals')
                .update({
                    title: updates.title,
                    type: updates.type,
                    frequency: updates.frequency,
                    status: updates.status,
                    link: updates.link
                })
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating development goal:', error);
        }
    },

    toggleStatus: async (id) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const goal = get().goals.find(g => g.id === id);
            if (!goal) return;

            const newStatus: 'active' | 'completed' = goal.status === 'active' ? 'completed' : 'active';
            const updatedGoals = get().goals.map(g =>
                g.id === id ? { ...g, status: newStatus } : g
            );
            set({ goals: updatedGoals });

            if (!user) {
                await dbOperations.saveData(DB_KEY_GOALS, updatedGoals);
                return;
            }

            const { error } = await supabase
                .from('development_goals')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error toggling development goal status:', error);
        }
    },

    deleteGoal: async (id) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const updatedGoals = get().goals.filter(g => g.id !== id);
            set({ goals: updatedGoals });

            if (!user) {
                await dbOperations.saveData(DB_KEY_GOALS, updatedGoals);
                return;
            }

            const { error } = await supabase
                .from('development_goals')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting development goal:', error);
        }
    }
}));
