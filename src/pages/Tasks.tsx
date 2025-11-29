import { useState, useEffect } from 'react';
import {
    Plus, Trash2, Check, Calendar, Clock,
    Layout, List, BarChart2, X,
    Share2, Edit2, Download, PieChart, GraduationCap,
    BookOpen, Video, Repeat, CheckCircle, Circle, ExternalLink, Target
} from 'lucide-react';
import type { Task, TaskPriority, TaskSection, TaskStatus, DevelopmentGoal } from '../types';
import { storage } from '../utils/storage';
import { addTaskToSystem } from '../utils/taskHelper';
import DailyTimeline from '../components/productivity/DailyTimeline';
import { Pie, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
} from 'chart.js';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
);

export default function Tasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [goals, setGoals] = useState<DevelopmentGoal[]>([]);
    const [viewMode, setViewMode] = useState<'tasks' | 'timeline' | 'stats'>('tasks');
    const [taskFilter, setTaskFilter] = useState<'all' | 'tasks-only' | 'goals-only' | 'today' | 'week'>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showTypeSelector, setShowTypeSelector] = useState(false);
    const [addType, setAddType] = useState<'task' | 'goal'>('task');
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [editingGoal, setEditingGoal] = useState<DevelopmentGoal | null>(null);
    const [customGoalTypes, setCustomGoalTypes] = useState<string[]>([]);

    // Form State
    const [newTask, setNewTask] = useState<{
        title: string;
        section: TaskSection;
        priority: TaskPriority;
        recurrenceType: 'none' | 'daily' | 'weekly' | 'monthly';
        recurrenceFrequency: number;
        recurrenceTimes: string[];
        recurrenceDays: number[];
        notes: string;
        dueDate: string;
        dueTime: string;
    }>({
        title: '',
        section: 'general',
        priority: 'medium',
        recurrenceType: 'none',
        recurrenceFrequency: 1,
        recurrenceTimes: [],
        recurrenceDays: [],
        notes: '',
        dueDate: '',
        dueTime: ''
    });

    // Goal Form State
    const [goalForm, setGoalForm] = useState({
        title: '',
        type: 'book' as DevelopmentGoal['type'] | 'custom',
        customType: '',
        link: '',
        frequency: 'once' as DevelopmentGoal['frequency']
    });

    // Load tasks and goals
    const loadTasks = () => {
        setTimeout(() => {
            const savedTasks = storage.get<Task[]>('tasks') || [];
            setTasks(savedTasks);
        }, 50);
    };

    useEffect(() => {
        loadTasks();
        const savedGoals = storage.get<DevelopmentGoal[]>('developmentGoals') || [];
        setGoals(savedGoals);
        const savedCustomTypes = storage.get<string[]>('customGoalTypes') || [];
        setCustomGoalTypes(savedCustomTypes);
        window.addEventListener('tasks-updated', loadTasks);
        return () => window.removeEventListener('tasks-updated', loadTasks);
    }, []);

    useEffect(() => {
        if (tasks.length > 0) {
            storage.set('tasks', tasks);
        }
    }, [tasks]);

    useEffect(() => {
        storage.set('developmentGoals', goals);
    }, [goals]);

    useEffect(() => {
        storage.set('customGoalTypes', customGoalTypes);
    }, [customGoalTypes]);

    const closeModal = () => {
        setShowAddModal(false);
        setEditingTask(null);
        setNewTask({
            title: '',
            section: 'general',
            priority: 'medium',
            recurrenceType: 'none',
            recurrenceFrequency: 1,
            recurrenceTimes: [],
            recurrenceDays: [],
            notes: '',
            dueDate: '',
            dueTime: ''
        });
    };

    const handleSaveTask = () => {
        if (!newTask.title.trim()) return;

        const recurrence = {
            type: newTask.recurrenceType,
            frequency: newTask.recurrenceType !== 'none' ? newTask.recurrenceFrequency : undefined,
            times: newTask.recurrenceType === 'daily' && newTask.recurrenceFrequency > 1 ? newTask.recurrenceTimes : undefined,
            days: newTask.recurrenceType === 'weekly' ? newTask.recurrenceDays : undefined
        };

        const taskData: Partial<Task> = {
            title: newTask.title,
            section: newTask.section,
            priority: newTask.priority,
            description: newTask.notes,
            recurrence: recurrence,
            status: 'planned' as TaskStatus,
            dueDate: newTask.dueDate ? `${newTask.dueDate}${newTask.dueTime ? 'T' + newTask.dueTime : ''}` : undefined
        };

        if (editingTask) {
            const updatedTasks = tasks.map(t =>
                t.id === editingTask.id ? { ...t, ...taskData } : t
            );
            setTasks(updatedTasks);
            storage.set('tasks', updatedTasks);
        } else {
            addTaskToSystem(newTask.title, taskData);
        }

        closeModal();
    };

    const openEditModal = (task: Task) => {
        setEditingTask(task);
        setNewTask({
            title: task.title,
            section: (task.section as TaskSection) || 'general',
            priority: (task.priority as TaskPriority) || 'medium',
            recurrenceType: task.recurrence?.type || 'none',
            recurrenceFrequency: task.recurrence?.frequency || 1,
            recurrenceTimes: task.recurrence?.times || [],
            recurrenceDays: task.recurrence?.days || [],
            notes: task.description || '',
            dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
            dueTime: task.dueDate && task.dueDate.includes('T') ? task.dueDate.split('T')[1].substring(0, 5) : ''
        });
        setAddType('task');
        setShowTypeSelector(false);
        setShowAddModal(true);
    };

    const toggleTaskStatus = (id: string) => {
        const today = new Date().toISOString().split('T')[0];
        const updatedTasks = tasks.map(t => {
            if (t.id === id) {
                const isCompleting = !t.completed;
                return {
                    ...t,
                    status: (isCompleting ? 'completed' : 'planned') as TaskStatus,
                    completed: isCompleting,
                    completedAt: isCompleting ? new Date().toISOString() : undefined,
                    lastCompletedDate: isCompleting ? today : undefined
                };
            }
            return t;
        });
        setTasks(updatedTasks);
        storage.set('tasks', updatedTasks);
    };

    const deleteTask = (id: string) => {
        if (confirm('حذف هذه المهمة نهائياً؟')) {
            const updated = tasks.filter(t => t.id !== id);
            setTasks(updated);
            storage.set('tasks', updated);
        }
    };

    const shareTask = (task: Task) => {
        const text = `مهمة: ${task.title}\n${task.description || ''}\nالحالة: ${task.completed ? 'منجز' : 'قيد التنفيذ'}`;
        if (navigator.share) {
            navigator.share({ title: task.title, text: text }).catch(console.error);
        } else {
            navigator.clipboard.writeText(text);
            alert('تم نسخ تفاصيل المهمة');
        }
    };

    const exportToIcs = (task: Task) => {
        if (!task.dueDate) {
            alert('هذه المهمة ليس لها تاريخ محدد للتصدير');
            return;
        }
        const dateStr = task.dueDate.replace(/[-:]/g, '').split('.')[0] + 'Z';
        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${task.title}
DESCRIPTION:${task.description || ''}
DTSTART:${dateStr}
DTEND:${dateStr}
END:VEVENT
END:VCALENDAR`;
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `${task.title}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getPriorityColor = (p: TaskPriority) => {
        switch (p) {
            case 'high': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
        }
    };

    const getSectionLabel = (s: string) => {
        const labels: Record<string, string> = {
            general: 'عام',
            prayer: 'صلاة',
            azkar: 'أذكار',
            quran: 'قرآن',
            reading: 'قراءة',
            shopping: 'تسوق',
            'self-dev': 'تطوير',
            idea: 'فكرة',
            appointment: 'موعد'
        };
        return labels[s] || s;
    };

    // Goal Management Functions
    const resetGoalForm = () => {
        setGoalForm({
            title: '',
            type: 'book',
            customType: '',
            link: '',
            frequency: 'once'
        });
        setEditingGoal(null);
    };

    const handleEditGoal = (goal: DevelopmentGoal) => {
        const isCustomType = !['book', 'video', 'course', 'habit'].includes(goal.type);
        setGoalForm({
            title: goal.title,
            type: isCustomType ? 'custom' : goal.type as any,
            customType: isCustomType ? goal.type : '',
            link: goal.link || '',
            frequency: goal.frequency
        });
        setEditingGoal(goal);
        setAddType('goal');
        setShowAddModal(true);
        setShowTypeSelector(false);
    };

    const saveGoal = () => {
        if (!goalForm.title.trim()) return;

        const finalType = goalForm.type === 'custom' ? goalForm.customType.trim() : goalForm.type;

        // Save custom type for future use
        if (goalForm.type === 'custom' && goalForm.customType.trim() && !customGoalTypes.includes(goalForm.customType.trim())) {
            setCustomGoalTypes([...customGoalTypes, goalForm.customType.trim()]);
        }

        if (editingGoal) {
            const updatedGoals = goals.map(g => g.id === editingGoal.id ? {
                ...g,
                title: goalForm.title.trim(),
                type: finalType,
                link: goalForm.link.trim(),
                frequency: goalForm.frequency
            } : g);
            setGoals(updatedGoals);
        } else {
            const newGoal: DevelopmentGoal = {
                id: crypto.randomUUID(),
                title: goalForm.title.trim(),
                type: finalType,
                link: goalForm.link.trim(),
                frequency: goalForm.frequency,
                status: 'active',
                createdAt: new Date().toISOString()
            };
            setGoals([...goals, newGoal]);
        }

        resetGoalForm();
        setShowAddModal(false);
    };

    const toggleGoalStatus = (id: string) => {
        setGoals(goals.map(g =>
            g.id === id ? { ...g, status: g.status === 'active' ? 'completed' : 'active' } : g
        ));
    };

    const deleteGoal = (id: string) => {
        if (confirm('هل أنت متأكد من حذف هذا الهدف؟')) {
            setGoals(goals.filter(g => g.id !== id));
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'book': return <BookOpen size={20} className="text-blue-400" />;
            case 'video': return <Video size={20} className="text-red-400" />;
            case 'course': return <GraduationCap size={20} className="text-yellow-400" />;
            case 'habit': return <Repeat size={20} className="text-green-400" />;
            default: return <Target size={20} className="text-purple-400" />;
        }
    };

    // Updated filtering logic for tasks and goals
    const filteredItems = (() => {
        let items: Array<(Task & { itemType: 'task' }) | (DevelopmentGoal & { itemType: 'goal' })> = [];

        // Add tasks
        if (taskFilter !== 'goals-only') {
            items = [...items, ...tasks.map(t => ({ ...t, itemType: 'task' as const }))];
        }

        // Add goals
        if (taskFilter !== 'tasks-only') {
            items = [...items, ...goals.map(g => ({ ...g, itemType: 'goal' as const }))];
        }

        // Apply time-based filters
        if (taskFilter === 'today') {
            const today = new Date().toISOString().split('T')[0];
            items = items.filter(item => {
                if (item.itemType === 'task') {
                    const task = item as Task;
                    if (task.recurrence?.type === 'daily') return true;
                    const isCompletedToday = task.completed && task.lastCompletedDate === today;
                    return !task.completed || isCompletedToday;
                }
                return true; // Show all goals for today
            });
        } else if (taskFilter === 'week') {
            const today = new Date();
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);

            items = items.filter(item => {
                if (item.itemType === 'task') {
                    const task = item as Task;
                    if (task.dueDate) {
                        const taskDate = new Date(task.dueDate);
                        return taskDate >= weekStart && taskDate < weekEnd;
                    }
                    return false;
                }
                return true; // Show all goals for week view
            });
        }

        return items;
    })();

    const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.completed).length,
        rate: tasks.length ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0
    };

    // Chart Data
    const pieData = {
        labels: ['منجز', 'قيد التنفيذ'],
        datasets: [
            {
                data: [stats.completed, stats.total - stats.completed],
                backgroundColor: ['#10B981', '#3B82F6'],
                borderColor: ['#059669', '#2563EB'],
                borderWidth: 1,
            },
        ],
    };

    const barData = {
        labels: ['عالي', 'متوسط', 'منخفض'],
        datasets: [
            {
                label: 'المهام حسب الأولوية',
                data: [
                    tasks.filter(t => t.priority === 'high').length,
                    tasks.filter(t => t.priority === 'medium').length,
                    tasks.filter(t => t.priority === 'low').length,
                ],
                backgroundColor: ['#EF4444', '#F59E0B', '#3B82F6'],
            },
        ],
    };

    const handleAddTaskWithTime = (time: string) => {
        setNewTask({
            ...newTask,
            dueDate: new Date().toISOString().split('T')[0],
            dueTime: time,
            section: 'appointment'
        });
        setAddType('task');
        setShowTypeSelector(false);
        setShowAddModal(true);
    };

    return (
        <div className="py-6 max-w-4xl mx-auto px-0 md:px-4">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold mb-1">المهام والعادات</h2>
                    <p className="text-slate-400 text-sm">نظم يومك، عبادتك، وحياتك</p>
                </div>

                <div className="flex gap-4 bg-slate-800 p-2 rounded-xl border border-slate-700">
                    <div className="text-center px-4 border-l border-slate-700">
                        <div className="text-2xl font-bold text-white">{stats.total}</div>
                        <div className="text-xs text-slate-400">الكل</div>
                    </div>
                    <div className="text-center px-4 border-l border-slate-700">
                        <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
                        <div className="text-xs text-slate-400">منجز</div>
                    </div>
                    <div className="text-center px-4">
                        <div className="text-2xl font-bold text-primary-500">{stats.rate}%</div>
                        <div className="text-xs text-slate-400">إنجاز</div>
                    </div>
                </div>
            </div>

            {/* Main View Tabs - 4 sections only */}
            <div className="flex overflow-x-auto pb-2 mb-6 gap-2 no-scrollbar">
                {[
                    { id: 'tasks', label: 'المهام', icon: List },
                    { id: 'timeline', label: 'الجدول', icon: Clock },
                    { id: 'stats', label: 'إحصائيات', icon: BarChart2 },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setViewMode(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${viewMode === tab.id
                            ? 'bg-primary-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        <tab.icon size={18} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Add Task Button (Only show if not in Development or Stats mode) */}
            {viewMode !== 'stats' && viewMode !== 'timeline' && (
                <>
                    <button
                        onClick={() => {
                            setShowTypeSelector(true);
                            setShowAddModal(true);
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-700 border-2 border-dashed border-slate-700 text-slate-400 hover:text-white rounded-xl p-4 mb-4 flex items-center justify-center gap-2 transition-all group"
                    >
                        <div className="bg-slate-700 group-hover:bg-primary-500 text-white p-1 rounded-full transition-colors">
                            <Plus size={20} />
                        </div>
                        <span className="font-medium">إضافة مهمة، فكرة، أو هدف جديد</span>
                    </button>

                    {/* Internal Task Filters - Only in tasks view */}
                    {viewMode === 'tasks' && (
                        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                            {[
                                { id: 'all', label: 'الكل', icon: List },
                                { id: 'tasks-only', label: 'مهام', icon: Check },
                                { id: 'goals-only', label: 'أهداف', icon: Target },
                                { id: 'today', label: 'اليوم', icon: Calendar },
                                { id: 'week', label: 'الأسبوع', icon: Layout },
                            ].map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setTaskFilter(filter.id as any)}
                                    className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${taskFilter === filter.id
                                        ? 'bg-slate-700 text-white border border-slate-600'
                                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                                        }`}
                                >
                                    <filter.icon size={16} />
                                    <span>{filter.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Content */}

            {viewMode === 'stats' ? (
                // ... stats view ...
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <PieChart className="text-primary-500" />
                            نسبة الإنجاز
                        </h3>
                        <div className="h-64 flex justify-center">
                            <Pie data={pieData} />
                        </div>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <BarChart2 className="text-primary-500" />
                            الأولويات
                        </h3>
                        <div className="h-64 flex justify-center">
                            <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
                        </div>
                    </div>
                </div>
            ) : viewMode === 'timeline' ? (
                <DailyTimeline
                    onAddTaskWithTime={handleAddTaskWithTime}
                />
            ) : (
                // ... list view (Tasks & Goals) ...
                <div className="space-y-3">
                    {filteredItems.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            لا توجد عناصر في هذه القائمة
                        </div>
                    ) : (
                        filteredItems.map(item => {
                            if (item.itemType === 'task') {
                                const task = item as Task;
                                return (
                                    <div
                                        key={task.id}
                                        className={`group bg-slate-800 rounded-xl p-4 border transition-all ${task.completed
                                            ? 'border-green-500/30 bg-green-500/5'
                                            : 'border-slate-700 hover:border-primary-500/50'
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <button
                                                onClick={() => toggleTaskStatus(task.id)}
                                                className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${task.completed
                                                    ? 'bg-green-500 border-green-500 text-white'
                                                    : 'border-slate-600 hover:border-primary-500'
                                                    }`}
                                            >
                                                {task.completed && <Check size={14} strokeWidth={3} />}
                                            </button>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className={`font-medium text-lg truncate ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                                                        {task.title}
                                                    </h3>
                                                    {task.recurrence?.type !== 'none' && (
                                                        <span className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                            <Clock size={10} />
                                                            {task.recurrence?.type === 'daily' ? 'يومي' : 'دوري'}
                                                            {task.recurrence?.frequency && task.recurrence.frequency > 1 && ` (${task.recurrence.frequency} مرات)`}
                                                        </span>
                                                    )}
                                                </div>

                                                {task.description && (
                                                    <p className="text-sm text-slate-400 mb-2 line-clamp-2">{task.description}</p>
                                                )}

                                                <div className="flex flex-wrap gap-2 text-xs items-center">
                                                    <span className={`px-2 py-1 rounded border ${getPriorityColor(task.priority || 'medium')}`}>
                                                        {task.priority === 'high' ? 'عالي' : task.priority === 'medium' ? 'متوسط' : 'منخفض'}
                                                    </span>
                                                    <span className="px-2 py-1 rounded bg-slate-700 text-slate-300 border border-slate-600">
                                                        {getSectionLabel(task.section || 'general')}
                                                    </span>
                                                    {task.dueDate && (
                                                        <span className="text-slate-400 flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            {task.dueDate.replace('T', ' ')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {task.section === 'appointment' && (
                                                    <button onClick={() => exportToIcs(task)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg" title="تصدير للتقويم">
                                                        <Download size={16} />
                                                    </button>
                                                )}
                                                <button onClick={() => shareTask(task)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg" title="مشاركة">
                                                    <Share2 size={16} />
                                                </button>
                                                <button onClick={() => openEditModal(task)} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg" title="تعديل">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => deleteTask(task.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg" title="حذف">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            } else {
                                const goal = item as DevelopmentGoal;
                                return (
                                    <div key={goal.id} className={`group bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center justify-between ${goal.status === 'completed' ? 'opacity-60' : ''}`}>
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => toggleGoalStatus(goal.id)} className="text-slate-400 hover:text-green-400 transition-colors">
                                                {goal.status === 'completed' ? <CheckCircle size={24} className="text-green-500" /> : <Circle size={24} />}
                                            </button>
                                            <div>
                                                <h3 className={`font-bold text-lg flex items-center gap-2 ${goal.status === 'completed' ? 'line-through text-slate-500' : 'text-white'}`}>
                                                    {getTypeIcon(goal.type)}
                                                    {goal.title}
                                                </h3>
                                                <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                                                    <span className="bg-slate-700 px-2 py-0.5 rounded text-xs">
                                                        {goal.frequency === 'once' ? 'مرة واحدة' :
                                                            goal.frequency === 'daily' ? 'يومي' :
                                                                goal.frequency === 'weekly' ? 'أسبوعي' : 'شهري'}
                                                    </span>
                                                    {goal.link && (
                                                        <a href={goal.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline">
                                                            <ExternalLink size={12} />
                                                            رابط
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditGoal(goal)} className="text-slate-600 hover:text-blue-400 p-2">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => deleteGoal(goal.id)} className="text-slate-600 hover:text-red-400 p-2">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            }
                        })
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl animate-in zoom-in-95 duration-200">

                        {showTypeSelector ? (
                            // Type Selector View
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold">ماذا تريد أن تضيف؟</h3>
                                    <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                                        <X size={24} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => {
                                            setAddType('task');
                                            setShowTypeSelector(false);
                                        }}
                                        className="flex flex-col items-center justify-center p-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-primary-500 rounded-xl transition-all group"
                                    >
                                        <div className="bg-slate-700 group-hover:bg-primary-500 text-white p-3 rounded-full mb-3 transition-colors">
                                            <Check size={32} />
                                        </div>
                                        <span className="font-bold text-lg">مهمة جديدة</span>
                                        <span className="text-sm text-slate-400 mt-1">لإنجاز عمل محدد</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setAddType('goal');
                                            setShowTypeSelector(false);
                                        }}
                                        className="flex flex-col items-center justify-center p-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-green-500 rounded-xl transition-all group"
                                    >
                                        <div className="bg-slate-700 group-hover:bg-green-500 text-white p-3 rounded-full mb-3 transition-colors">
                                            <Target size={32} />
                                        </div>
                                        <span className="font-bold text-lg">هدف تطوير</span>
                                        <span className="text-sm text-slate-400 mt-1">لبناء عادة أو تعلم مهارة</span>
                                    </button>
                                </div>
                            </div>
                        ) : addType === 'task' ? (
                            // Task Form
                            <>
                                <div className="flex justify-between items-center p-6 border-b border-slate-800">
                                    <h3 className="text-xl font-bold">{editingTask ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}</h3>
                                    <button onClick={closeModal} className="text-slate-400 hover:text-white">
                                        <X size={24} />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">العنوان</label>
                                        <input
                                            type="text"
                                            value={newTask.title}
                                            onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                            className="w-full bg-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="اسم المهمة، الفكرة، أو الموعد..."
                                            autoFocus
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">النوع / القسم</label>
                                            <select
                                                value={newTask.section}
                                                onChange={e => setNewTask({ ...newTask, section: e.target.value as any })}
                                                className="w-full bg-slate-800 rounded-lg px-4 py-2"
                                            >
                                                <option value="general">مهمة عامة</option>
                                                <option value="idea">فكرة 💡</option>
                                                <option value="appointment">موعد 📅</option>
                                                <option value="prayer">صلاة</option>
                                                <option value="azkar">أذكار</option>
                                                <option value="quran">قرآن</option>
                                                <option value="reading">قراءة</option>
                                                <option value="shopping">تسوق</option>
                                                <option value="self-dev">تطوير ذاتي</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">الأولوية</label>
                                            <select
                                                value={newTask.priority}
                                                onChange={e => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                                                className="w-full bg-slate-800 rounded-lg px-4 py-2"
                                            >
                                                <option value="low">منخفضة</option>
                                                <option value="medium">متوسطة</option>
                                                <option value="high">عالية</option>
                                            </select>
                                        </div>
                                    </div>

                                    {newTask.section === 'appointment' && (
                                        <div className="grid grid-cols-2 gap-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-1">التاريخ</label>
                                                <input
                                                    type="date"
                                                    value={newTask.dueDate}
                                                    onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                                                    className="w-full bg-slate-700 rounded-lg px-3 py-2"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-1">الوقت</label>
                                                <input
                                                    type="time"
                                                    value={newTask.dueTime}
                                                    onChange={e => setNewTask({ ...newTask, dueTime: e.target.value })}
                                                    className="w-full bg-slate-700 rounded-lg px-3 py-2"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">التكرار</label>
                                        <select
                                            value={newTask.recurrenceType}
                                            onChange={e => setNewTask({ ...newTask, recurrenceType: e.target.value as any })}
                                            className="w-full bg-slate-800 rounded-lg px-4 py-2"
                                        >
                                            <option value="none">مرة واحدة</option>
                                            <option value="daily">يومي (يتجدد تلقائياً)</option>
                                            <option value="weekly">أسبوعي</option>
                                            <option value="monthly">شهري</option>
                                        </select>
                                    </div>

                                    {newTask.recurrenceType !== 'none' && (
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">عدد مرات التكرار</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={newTask.recurrenceFrequency}
                                                onChange={e => {
                                                    const freq = parseInt(e.target.value);
                                                    setNewTask({
                                                        ...newTask,
                                                        recurrenceFrequency: freq,
                                                        recurrenceTimes: newTask.recurrenceType === 'daily' ? Array(freq).fill('') : []
                                                    });
                                                }}
                                                className="w-full bg-slate-800 rounded-lg px-4 py-2"
                                            />
                                        </div>
                                    )}

                                    {newTask.recurrenceType === 'daily' && newTask.recurrenceFrequency > 1 && (
                                        <div className="space-y-2">
                                            <label className="block text-sm text-slate-400">الأوقات المحددة (اختياري)</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {Array.from({ length: newTask.recurrenceFrequency }).map((_, idx) => (
                                                    <div key={idx} className="flex items-center gap-2">
                                                        <span className="text-xs text-slate-500 w-4">{idx + 1}</span>
                                                        <input
                                                            type="time"
                                                            value={newTask.recurrenceTimes[idx] || ''}
                                                            onChange={e => {
                                                                const newTimes = [...newTask.recurrenceTimes];
                                                                newTimes[idx] = e.target.value;
                                                                setNewTask({ ...newTask, recurrenceTimes: newTimes });
                                                            }}
                                                            className="w-full bg-slate-700 rounded-lg px-2 py-1 text-sm"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">ملاحظات</label>
                                        <textarea
                                            value={newTask.notes}
                                            onChange={e => setNewTask({ ...newTask, notes: e.target.value })}
                                            className="w-full bg-slate-800 rounded-lg px-4 py-2 h-24 resize-none"
                                            placeholder="تفاصيل إضافية..."
                                        />
                                    </div>
                                </div>

                                <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
                                    <button
                                        onClick={closeModal}
                                        className="px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        onClick={handleSaveTask}
                                        className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-2 rounded-lg font-medium transition-colors"
                                    >
                                        {editingTask ? 'حفظ التعديلات' : 'حفظ'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            // Goal Form
                            <>
                                <div className="flex justify-between items-center p-6 border-b border-slate-800">
                                    <h3 className="text-xl font-bold">{editingGoal ? 'تعديل الهدف' : 'إضافة هدف جديد'}</h3>
                                    <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                                        <X size={24} />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">عنوان الهدف</label>
                                        <input
                                            type="text"
                                            value={goalForm.title}
                                            onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                                            className="w-full bg-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="مثال: قراءة كتاب العادات الذرية"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">النوع</label>
                                            <select
                                                value={goalForm.type}
                                                onChange={(e) => setGoalForm({ ...goalForm, type: e.target.value as any })}
                                                className="w-full bg-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            >
                                                <option value="book">كتاب</option>
                                                <option value="video">فيديو</option>
                                                <option value="course">دورة تدريبية</option>
                                                <option value="habit">عادة جديدة</option>
                                                <option value="custom">مخصص...</option>
                                                {customGoalTypes.map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">التكرار</label>
                                            <select
                                                value={goalForm.frequency}
                                                onChange={(e) => setGoalForm({ ...goalForm, frequency: e.target.value as any })}
                                                className="w-full bg-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            >
                                                <option value="once">مرة واحدة</option>
                                                <option value="daily">يومياً</option>
                                                <option value="weekly">أسبوعياً</option>
                                                <option value="monthly">شهرياً</option>
                                            </select>
                                        </div>
                                    </div>

                                    {goalForm.type === 'custom' && (
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">نوع مخصص</label>
                                            <input
                                                type="text"
                                                value={goalForm.customType}
                                                onChange={(e) => setGoalForm({ ...goalForm, customType: e.target.value })}
                                                className="w-full bg-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                placeholder="أدخل نوع الهدف..."
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">الرابط (اختياري)</label>
                                        <input
                                            type="text"
                                            value={goalForm.link}
                                            onChange={(e) => setGoalForm({ ...goalForm, link: e.target.value })}
                                            className="w-full bg-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="https://..."
                                            dir="ltr"
                                        />
                                    </div>
                                </div>
                                <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowAddModal(false)}
                                        className="px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        onClick={saveGoal}
                                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg font-medium transition-colors"
                                    >
                                        {editingGoal ? 'حفظ التعديلات' : 'حفظ الهدف'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
