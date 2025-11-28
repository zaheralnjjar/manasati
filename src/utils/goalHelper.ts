import { storage } from './storage';
import type { DevelopmentGoal, Task } from '../types';

export const addGoalToSystem = (
    title: string,
    options: Partial<Omit<DevelopmentGoal, 'id' | 'title' | 'createdAt' | 'status'>> = {}
) => {
    const goals = storage.get<DevelopmentGoal[]>('developmentGoals') || [];

    const newGoal: DevelopmentGoal = {
        id: crypto.randomUUID(),
        title: title,
        type: options.type || 'book',
        frequency: options.frequency || 'once',
        status: 'active',
        createdAt: new Date().toISOString(),
        ...options
    };

    const updatedGoals = [...goals, newGoal];
    storage.set('developmentGoals', updatedGoals);

    // Sync to Tasks if it's a "once" goal or "daily" habit (mimicking DevelopmentSection logic)
    if (newGoal.frequency === 'once' || newGoal.frequency === 'daily') {
        const tasks = storage.get<Task[]>('tasks') || [];
        const newTask: Task = {
            id: crypto.randomUUID(),
            title: `${newGoal.type === 'book' ? 'قراءة' : newGoal.type === 'video' ? 'مشاهدة' : 'إنجاز'}: ${title}`,
            completed: false,
            date: new Date().toISOString(),
            priority: 'medium',
            section: 'self-dev',
            recurrence: { type: 'none' }
        };
        storage.set('tasks', [...tasks, newTask]);
        window.dispatchEvent(new Event('tasks-updated'));
    }

    // Dispatch event for goals update if needed (though DevelopmentSection uses local state on mount, it might need a reload or custom event listener if we want it to update live)
    // DevelopmentSection doesn't seem to listen to events, it only loads on mount. 
    // But we can dispatch 'storage' event or custom event if we update DevelopmentSection to listen.
    // For now, just saving to storage is enough for persistence.

    return newGoal;
};
