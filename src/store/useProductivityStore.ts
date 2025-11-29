import { create } from 'zustand';
import type { Task, Appointment, YouTubeVideo, Habit } from '../types';
import { supabase } from '../services/supabase';
import { getToday, isPast } from '../utils/dateHelpers';

interface ProductivityState {
    // Tasks
    tasks: Task[];
    addTask: (task: Omit<Task, 'id'>) => Promise<void>;
    updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
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
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const dbTask = {
                user_id: user.id,
                title: taskData.title,
                completed: taskData.completed || false,
                date: taskData.date,
                time: taskData.time,
                section: taskData.section,
                priority: taskData.priority,
                status: taskData.status,
                description: taskData.description,
                recurrence: taskData.recurrence,
                subtasks: taskData.subtasks || [],
                from_voice: taskData.fromVoice,
                rolled_over: taskData.rolledOver,
                reminder_time: taskData.reminderTime,
                text: taskData.text,
                due_date: taskData.dueDate,
                last_completed_date: taskData.lastCompletedDate
            };

            const { data, error } = await supabase
                .from('tasks')
                .insert(dbTask)
                .select()
                .single();

            if (error) throw error;
            if (data) {
                const newTask: Task = {
                    ...taskData,
                    id: data.id,
                    fromVoice: data.from_voice,
                    rolledOver: data.rolled_over,
                    reminderTime: data.reminder_time,
                    lastCompletedDate: data.last_completed_date,
                    dueDate: data.due_date
                };
                set({ tasks: [...get().tasks, newTask] });
            }
        } catch (error) {
            console.error('Error adding task:', error);
        }
    },

    updateTask: async (id, updates) => {
        try {
            const dbUpdates: any = {};
            if (updates.title !== undefined) dbUpdates.title = updates.title;
            if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
            if (updates.date !== undefined) dbUpdates.date = updates.date;
            if (updates.time !== undefined) dbUpdates.time = updates.time;
            if (updates.section !== undefined) dbUpdates.section = updates.section;
            if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
            if (updates.status !== undefined) dbUpdates.status = updates.status;
            if (updates.description !== undefined) dbUpdates.description = updates.description;
            if (updates.recurrence !== undefined) dbUpdates.recurrence = updates.recurrence;
            if (updates.subtasks !== undefined) dbUpdates.subtasks = updates.subtasks;
            if (updates.fromVoice !== undefined) dbUpdates.from_voice = updates.fromVoice;
            if (updates.rolledOver !== undefined) dbUpdates.rolled_over = updates.rolledOver;
            if (updates.reminderTime !== undefined) dbUpdates.reminder_time = updates.reminderTime;
            if (updates.text !== undefined) dbUpdates.text = updates.text;
            if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
            if (updates.lastCompletedDate !== undefined) dbUpdates.last_completed_date = updates.lastCompletedDate;

            const { error } = await supabase
                .from('tasks')
                .update(dbUpdates)
                .eq('id', id);

            if (error) throw error;

            set({
                tasks: get().tasks.map(t =>
                    t.id === id ? { ...t, ...updates } : t
                )
            });
        } catch (error) {
            console.error('Error updating task:', error);
        }
    },

    toggleTask: async (id) => {
        try {
            const task = get().tasks.find(t => t.id === id);
            if (!task) return;

            const newCompleted = !task.completed;
            const { error } = await supabase
                .from('tasks')
                .update({ completed: newCompleted })
                .eq('id', id);

            if (error) throw error;

            set({
                tasks: get().tasks.map(t =>
                    t.id === id ? { ...t, completed: newCompleted } : t
                )
            });
        } catch (error) {
            console.error('Error toggling task:', error);
        }
    },

    deleteTask: async (id) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set({ tasks: get().tasks.filter(t => t.id !== id) });
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    },

    rolloverTasks: async () => {
        const today = getToday();
        const tasksToUpdate = get().tasks.filter(task =>
            !task.completed && isPast(task.date) && task.date !== today
        );

        for (const task of tasksToUpdate) {
            try {
                const { error } = await supabase
                    .from('tasks')
                    .update({ date: today, rolled_over: true })
                    .eq('id', task.id);

                if (!error) {
                    set(state => ({
                        tasks: state.tasks.map(t =>
                            t.id === task.id ? { ...t, date: today, rolledOver: true } : t
                        )
                    }));
                }
            } catch (error) {
                console.error('Error rolling over task:', error);
            }
        }
    },

    addAppointment: async (appointmentData) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const dbAppointment = {
                user_id: user.id,
                title: appointmentData.title,
                date: appointmentData.date,
                time: appointmentData.time,
                location: appointmentData.location,
                notes: appointmentData.notes,
                google_maps_link: appointmentData.googleMapsLink
            };

            const { data, error } = await supabase
                .from('appointments')
                .insert(dbAppointment)
                .select()
                .single();

            if (error) throw error;
            if (data) {
                const newAppointment: Appointment = {
                    ...appointmentData,
                    id: data.id,
                    googleMapsLink: data.google_maps_link
                };
                set({ appointments: [...get().appointments, newAppointment] });
            }
        } catch (error) {
            console.error('Error adding appointment:', error);
        }
    },

    deleteAppointment: async (id) => {
        try {
            const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set({ appointments: get().appointments.filter(a => a.id !== id) });
        } catch (error) {
            console.error('Error deleting appointment:', error);
        }
    },

    addYouTubeVideo: async (url) => {
        // Keeping YouTube videos local for now as requested schema didn't include them, 
        // or I can add a table. The user didn't explicitly ask for YouTube videos in DB.
        // I'll keep them local or add a table if I want to be thorough.
        // For now, I'll leave the implementation as is (using local storage via dbOperations? No, I removed it).
        // I should probably add a table for videos too or just use local storage for this part.
        // Given the prompt "all appointments, prayer times, and goals", I'll stick to those.
        // But removing dbOperations breaks this. I'll use localStorage directly for videos.

        const videoId = extractYouTubeId(url);
        if (!videoId) return;

        const video: YouTubeVideo = {
            id: Date.now().toString(),
            url,
            videoId,
            addedDate: new Date().toISOString(),
        };

        const updated = [...get().youtubeVideos, video];
        set({ youtubeVideos: updated });
        localStorage.setItem('youtube_videos', JSON.stringify(updated));
    },

    deleteYouTubeVideo: async (id) => {
        const updated = get().youtubeVideos.filter(video => video.id !== id);
        set({ youtubeVideos: updated });
        localStorage.setItem('youtube_videos', JSON.stringify(updated));
    },

    addHabit: async (name) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('habits')
                .insert({ user_id: user.id, name, tracking: {} })
                .select()
                .single();

            if (error) throw error;
            if (data) {
                set({ habits: [...get().habits, data] });
            }
        } catch (error) {
            console.error('Error adding habit:', error);
        }
    },

    toggleHabitDay: async (id, date) => {
        try {
            const habit = get().habits.find(h => h.id === id);
            if (!habit) return;

            const newTracking = {
                ...habit.tracking,
                [date]: !habit.tracking[date]
            };

            const { error } = await supabase
                .from('habits')
                .update({ tracking: newTracking })
                .eq('id', id);

            if (error) throw error;

            set({
                habits: get().habits.map(h =>
                    h.id === id ? { ...h, tracking: newTracking } : h
                )
            });
        } catch (error) {
            console.error('Error toggling habit:', error);
        }
    },

    deleteHabit: async (id) => {
        try {
            const { error } = await supabase
                .from('habits')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set({ habits: get().habits.filter(h => h.id !== id) });
        } catch (error) {
            console.error('Error deleting habit:', error);
        }
    },

    initialize: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                console.log('No Supabase session found');
                return;
            }

            const [tasksRes, apptsRes, habitsRes] = await Promise.all([
                supabase.from('tasks').select('*'),
                supabase.from('appointments').select('*'),
                supabase.from('habits').select('*')
            ]);

            if (tasksRes.error) console.error('Tasks error:', tasksRes.error);
            if (apptsRes.error) console.error('Appointments error:', apptsRes.error);

            const tasks = (tasksRes.data || []).map(t => ({
                ...t,
                fromVoice: t.from_voice,
                rolledOver: t.rolled_over,
                reminderTime: t.reminder_time,
                lastCompletedDate: t.last_completed_date,
                dueDate: t.due_date
            }));

            const appointments = (apptsRes.data || []).map(a => ({
                ...a,
                googleMapsLink: a.google_maps_link
            }));

            const habits = habitsRes.data || [];

            // Load YouTube videos from local storage
            const videos = JSON.parse(localStorage.getItem('youtube_videos') || '[]');

            set({ tasks, appointments, habits, youtubeVideos: videos });

            // Auto rollover
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
