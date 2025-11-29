import { create } from 'zustand';
import { storage } from '../utils/storage';
import type { DevelopmentGoal, Task } from '../types';

interface DevelopmentState {
    goals: DevelopmentGoal[];
    addGoal: (goal: Omit<DevelopmentGoal, 'id' | 'createdAt' | 'status'>) => void;
    toggleStatus: (id: string) => void;
    deleteGoal: (id: string) => void;
    initialize: () => void;
}

export const useDevelopmentStore = create<DevelopmentState>((set, get) => ({
    goals: [],

    initialize: () => {
        const savedGoals = storage.get<DevelopmentGoal[]>('developmentGoals') || [];
        set({ goals: savedGoals });
    },

    addGoal: (goalData) => {
        const newGoal: DevelopmentGoal = {
            id: Date.now().toString() + Math.random().toString(36).substring(2),
            ...goalData,
            status: 'active',
            createdAt: new Date().toISOString()
        };

        const updatedGoals = [...get().goals, newGoal];
        set({ goals: updatedGoals });
        storage.set('developmentGoals', updatedGoals);

        // Sync to Tasks if it's a "once" goal or "daily" habit
        if (goalData.frequency === 'once' || goalData.frequency === 'daily') {
            const tasks = storage.get<Task[]>('tasks') || [];
            const newTask: Task = {
                id: Date.now().toString() + Math.random().toString(36).substring(2),
                title: `${goalData.type === 'book' ? 'قراءة' : goalData.type === 'video' ? 'مشاهدة' : 'إنجاز'}: ${goalData.title}`,
                completed: false,
                date: new Date().toISOString(),
                priority: 'medium',
                section: 'self-dev',
                recurrence: { type: 'none' }
            };
            storage.set('tasks', [...tasks, newTask]);
        }
    },

    toggleStatus: (id) => {
        const updatedGoals = get().goals.map(g =>
            g.id === id ? { ...g, status: g.status === 'active' ? 'completed' : 'active' } : g
        );
        set({ goals: updatedGoals as DevelopmentGoal[] });
        storage.set('developmentGoals', updatedGoals);
    },

    deleteGoal: (id) => {
        const updatedGoals = get().goals.filter(g => g.id !== id);
        set({ goals: updatedGoals });
        storage.set('developmentGoals', updatedGoals);
    }
}));
