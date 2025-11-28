import { storage } from './storage';
import type { Task } from '../types';

export const addTaskToSystem = (
    title: string,
    options: Partial<Omit<Task, 'id' | 'completed'>> = {}
) => {
    const tasks = storage.get<Task[]>('tasks') || [];

    const newTask: Task = {
        id: crypto.randomUUID(),
        title: title,
        completed: false,
        date: new Date().toISOString().split('T')[0], // Default to today
        recurrence: { type: 'none' },
        ...options
    };

    console.log('Adding new task:', newTask);
    const updatedTasks = [...tasks, newTask];
    storage.set('tasks', updatedTasks);
    console.log('Tasks saved to storage:', updatedTasks);

    // Dispatch a custom event so components can listen for updates
    window.dispatchEvent(new Event('tasks-updated'));

    return newTask;
};

export const deleteTaskFromSystem = (id: string) => {
    const tasks = storage.get<Task[]>('tasks') || [];
    const updatedTasks = tasks.filter(t => t.id !== id);
    storage.set('tasks', updatedTasks);
    window.dispatchEvent(new Event('tasks-updated'));
};
