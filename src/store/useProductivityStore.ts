import { create } from 'zustand';
import type { Task, Appointment, YouTubeVideo, Habit } from '../types';
import { dbOperations, DB_KEYS } from '../utils/db';
import { getToday, isPast } from '../utils/dateHelpers';

interface ProductivityState {
    // Tasks
    tasks: Task[];
    addTask: (task: Omit<Task, 'id'>) => Promise<void>;
    toggleTask: (id: string) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    rolloverTasks: () => Promise<void>;

    // Appointments
    appointments: Appointment[];
    addAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<void>;
    deleteAppointment: (id: string) => Promise<void>;

    // YouTube
    youtubeVideos: YouTubeVideo[];
    addYouTubeVideo: (url: string) => Promise<void>;
    deleteYouTubeVideo: (id: string) => Promise<void>;

    // Habits
    habits: Habit[];
    addHabit: (name: string) => Promise<void>;
    toggleHabitDay: (id: string, date: string) => Promise<void>;
    deleteHabit: (id: string) => Promise<void>;

    // Initialize
    initialize: () => Promise<void>;
}

export const useProductivityStore = create<ProductivityState>((set, get) => ({
    tasks: [],
    appointments: [],
    youtubeVideos: [],
    habits: [],

    addTask: async (taskData) => {
        const task: Task = {
            ...taskData,
            id: crypto.randomUUID(),
        };
        const updated = [...get().tasks, task];
        set({ tasks: updated });
        await dbOperations.saveData(DB_KEYS.TASKS, updated);
    },

    toggleTask: async (id) => {
        const updated = get().tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        set({ tasks: updated });
        await dbOperations.saveData(DB_KEYS.TASKS, updated);
    },

    deleteTask: async (id) => {
        const updated = get().tasks.filter(task => task.id !== id);
        set({ tasks: updated });
        await dbOperations.saveData(DB_KEYS.TASKS, updated);
    },

    rolloverTasks: async () => {
        const today = getToday();
        const updated = get().tasks.map(task => {
            // If task is from past and not completed, move to today
            if (!task.completed && isPast(task.date) && task.date !== today) {
                return { ...task, date: today, rolledOver: true };
            }
            return task;
        });
        set({ tasks: updated });
        await dbOperations.saveData(DB_KEYS.TASKS, updated);
    },

    addAppointment: async (appointmentData) => {
        const appointment: Appointment = {
            ...appointmentData,
            id: crypto.randomUUID(),
        };
        const updated = [...get().appointments, appointment];
        set({ appointments: updated });
        await dbOperations.saveData(DB_KEYS.APPOINTMENTS, updated);
    },

    deleteAppointment: async (id) => {
        const updated = get().appointments.filter(apt => apt.id !== id);
        set({ appointments: updated });
        await dbOperations.saveData(DB_KEYS.APPOINTMENTS, updated);
    },

    addYouTubeVideo: async (url) => {
        // Extract video ID from URL
        const videoId = extractYouTubeId(url);
        if (!videoId) return;

        const video: YouTubeVideo = {
            id: crypto.randomUUID(),
            url,
            videoId,
            addedDate: new Date().toISOString(),
        };
        const updated = [...get().youtubeVideos, video];
        set({ youtubeVideos: updated });
        await dbOperations.saveData(DB_KEYS.YOUTUBE_VIDEOS, updated);
    },

    deleteYouTubeVideo: async (id) => {
        const updated = get().youtubeVideos.filter(video => video.id !== id);
        set({ youtubeVideos: updated });
        await dbOperations.saveData(DB_KEYS.YOUTUBE_VIDEOS, updated);
    },

    addHabit: async (name) => {
        const habit: Habit = {
            id: crypto.randomUUID(),
            name,
            tracking: {},
        };
        const updated = [...get().habits, habit];
        set({ habits: updated });
        await dbOperations.saveData(DB_KEYS.HABITS, updated);
    },

    toggleHabitDay: async (id, date) => {
        const updated = get().habits.map(habit => {
            if (habit.id === id) {
                return {
                    ...habit,
                    tracking: {
                        ...habit.tracking,
                        [date]: !habit.tracking[date],
                    },
                };
            }
            return habit;
        });
        set({ habits: updated });
        await dbOperations.saveData(DB_KEYS.HABITS, updated);
    },

    deleteHabit: async (id) => {
        const updated = get().habits.filter(habit => habit.id !== id);
        set({ habits: updated });
        await dbOperations.saveData(DB_KEYS.HABITS, updated);
    },

    initialize: async () => {
        try {
            const [tasks, appointments, videos, habits] = await Promise.all([
                dbOperations.getData<Task[]>(DB_KEYS.TASKS, []),
                dbOperations.getData<Appointment[]>(DB_KEYS.APPOINTMENTS, []),
                dbOperations.getData<YouTubeVideo[]>(DB_KEYS.YOUTUBE_VIDEOS, []),
                dbOperations.getData<Habit[]>(DB_KEYS.HABITS, []),
            ]);

            set({ tasks, appointments, youtubeVideos: videos, habits });

            // Auto rollover tasks on initialization
            await get().rolloverTasks();
        } catch (error) {
            console.error('Failed to initialize productivity store:', error);
        }
    },
}));

// Helper function to extract YouTube video ID
function extractYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    return null;
}
