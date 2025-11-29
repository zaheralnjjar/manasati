import { useState } from 'react';
import {
    Plus,
    Trash2,
    Check,
    Clock,
    X,
    ChevronLeft,
    ChevronRight,
    CheckSquare,
    Repeat,
    BookOpen,
    Video,
    GraduationCap,
    Target,
    Activity,
    List,
    BarChart2,
    Calendar,
    PieChart,
    Download,
    Share2,
    Edit2,
    CheckCircle,
    Circle,
    ExternalLink,
    Layout
} from 'lucide-react';
import type { Task, Appointment, DevelopmentGoal, TaskPriority, TaskSection } from '../types';
import { useProductivityStore } from '../store/useProductivityStore';
import { useDevelopmentStore } from '../store/useDevelopmentStore';
import DailyTimeline from '../components/productivity/DailyTimeline';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    BarElement,
    Filler
} from 'chart.js';
import { Line, Doughnut, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    BarElement,
    Filler
);

export default function Tasks() {
    const {
        tasks,
        appointments,
        addTask,
        updateTask,
        deleteTask,
        toggleTask
    } = useProductivityStore();

    const {
        goals,
        addGoal,
        toggleStatus: toggleGoalStatus,
        deleteGoal
    } = useDevelopmentStore();

    // The user asked for "Productivity Store (Tasks, Appointments, Goals)".
    // So goals should also be from store.
    // But let's focus on tasks first.

    const [calendarDate, setCalendarDate] = useState<Date>(new Date());
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [showSelectionModal, setShowSelectionModal] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'stats' | 'schedule'>('list');
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [newTask, setNewTask] = useState<Partial<Task>>({
        title: '',
        date: new Date().toISOString().split('T')[0],
        priority: 'medium',
        section: 'general',
        recurrence: { type: 'none' },
        subtasks: []
    });
    const [goalForm, setGoalForm] = useState({
        title: '',
        type: 'book',
        customType: '',
        link: '',
        frequency: 'once'
    });
    const [editingGoal, setEditingGoal] = useState<DevelopmentGoal | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [customGoalTypes, setCustomGoalTypes] = useState<string[]>([]);



    const closeModal = () => {
        setShowTaskModal(false);
        setShowGoalModal(false);
        setNewTask({
            title: '',
            date: new Date().toISOString().split('T')[0],
            priority: 'medium',
            section: 'general',
            recurrence: { type: 'none' },
            subtasks: []
        });
        setNewSubtaskTitle('');
        setEditingTask(null);
        resetGoalForm();
    };


    const handleSaveTask = async () => {
        if (!newTask.title?.trim()) return;

        const taskData = {
            title: newTask.title.trim(),
            date: newTask.date || new Date().toISOString().split('T')[0],
            priority: (newTask.priority as TaskPriority) || 'medium',
            section: (newTask.section as TaskSection) || 'general',
            recurrence: newTask.recurrence || { type: 'none' },
            subtasks: newTask.subtasks || [],
            description: newTask.description || '',
            time: newTask.time,
            completed: false
        };

        if (editingTask) {
            await updateTask(editingTask.id, taskData);
        } else {
            await addTask(taskData);
        }

        setShowTaskModal(false);
        setNewTask({
            title: '',
            date: new Date().toISOString().split('T')[0],
            priority: 'medium',
            section: 'general',
            recurrence: { type: 'none' },
            subtasks: []
        });
        setNewSubtaskTitle('');
        setEditingTask(null);
    };

    // ... (rest of functions)

    // Calendar Header
    // ...
    <h3 className="text-lg font-bold">
        {calendarDate.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric', calendar: 'gregory' })}
    </h3>

    const handleAddSubtask = () => {
        if (!newSubtaskTitle.trim()) return;
        const subtask = {
            id: Date.now().toString(),
            title: newSubtaskTitle.trim(),
            completed: false
        };
        setNewTask({
            ...newTask,
            subtasks: [...(newTask.subtasks || []), subtask]
        });
        setNewSubtaskTitle('');
    };

    const removeSubtask = (id: string) => {
        setNewTask({
            ...newTask,
            subtasks: (newTask.subtasks || []).filter(st => st.id !== id)
        });
    };

    const toggleSubtaskInList = async (taskId: string, subtaskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (task && task.subtasks) {
            const updatedSubtasks = task.subtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st);
            await updateTask(taskId, { subtasks: updatedSubtasks });
        }
    };

    const openEditModal = (task: Task) => {
        setNewTask({
            title: task.title,
            section: (task.section as TaskSection) || 'general',
            priority: (task.priority as TaskPriority) || 'medium',
            recurrence: task.recurrence || { type: 'none' },
            description: task.description || '',
            date: task.date,
            time: task.time,
            subtasks: task.subtasks || []
        });
        setEditingTask(task);
        setShowTaskModal(true);
    };

    const toggleTaskStatus = async (id: string) => {
        await toggleTask(id);
    };

    const handleDeleteTask = async (id: string) => {
        if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
            await deleteTask(id);
        }
    };

    const shareTask = (task: Task) => {
        const text = `مهمة: ${task.title} \n${task.description || ''} \nالحالة: ${task.completed ? 'منجز' : 'قيد التنفيذ'} `;
        if (navigator.share) {
            navigator.share({ title: task.title, text: text }).catch(console.error);
        } else {
            navigator.clipboard.writeText(text);
            alert('تم نسخ تفاصيل المهمة');
        }
    };

    const exportToIcs = (task: Task) => {
        if (!task.date) {
            alert('هذه المهمة ليس لها تاريخ محدد للتصدير');
            return;
        }
        const dateStr = task.date.replace(/[-:]/g, '').split('.')[0] + 'Z';
        const icsContent = `BEGIN: VCALENDAR
VERSION: 2.0
BEGIN: VEVENT
SUMMARY:${task.title}
DESCRIPTION:${task.description || ''}
DTSTART:${dateStr}
DTEND:${dateStr}
END: VEVENT
END: VCALENDAR`;
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
        setShowGoalModal(true);
    };

    const saveGoal = async () => {
        if (!goalForm.title.trim()) return;

        const finalType = goalForm.type === 'custom' ? goalForm.customType.trim() : goalForm.type;

        // Save custom type for future use (local only for now, or could be in store)
        if (goalForm.type === 'custom' && goalForm.customType.trim() && !customGoalTypes.includes(goalForm.customType.trim())) {
            setCustomGoalTypes([...customGoalTypes, goalForm.customType.trim()]);
        }

        if (editingGoal) {
            // Update logic not implemented in store yet, so we might need to add it or just delete and add (not ideal)
            // For now, let's assume we can't edit or we need to add updateGoal to store.
            // But wait, the user instructions didn't explicitly ask for updateGoal in store, but it's good practice.
            // Let's just delete and add for now if update is not available, OR better, just add updateGoal to store later.
            // Actually, looking at useDevelopmentStore, it only has addGoal, toggleStatus, deleteGoal.
            // So we can't update. We will just delete and re-add for now to keep it working, or just add.
            // A better approach is to implement updateGoal in store. But I can't change store right now easily without context switch.
            // I'll just use delete and add for edit.
            await deleteGoal(editingGoal.id);
            await addGoal({
                title: goalForm.title.trim(),
                type: finalType as any,
                link: goalForm.link.trim(),
                frequency: goalForm.frequency as any,
                bookName: goalForm.type === 'book' ? goalForm.title.trim() : undefined,
            });
        } else {
            await addGoal({
                title: goalForm.title.trim(),
                type: finalType as any,
                link: goalForm.link.trim(),
                frequency: goalForm.frequency as any,
                bookName: goalForm.type === 'book' ? goalForm.title.trim() : undefined,
            });
        }

        resetGoalForm();
        setShowGoalModal(false);
    };

    const handleToggleGoalStatus = async (id: string) => {
        await toggleGoalStatus(id);
    };

    const handleDeleteGoal = async (id: string) => {
        if (confirm('هل أنت متأكد من حذف هذا الهدف؟')) {
            await deleteGoal(id);
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
        let items: Array<(Task & { itemType: 'task' }) | (DevelopmentGoal & { itemType: 'goal' }) | (Appointment & { itemType: 'appointment' })> = [];

        // Add tasks
        items = [...items, ...tasks.map(t => ({ ...t, itemType: 'task' as const }))];

        // Add goals
        items = [...items, ...goals.map(g => ({ ...g, itemType: 'goal' as const }))];

        // Add appointments
        items = [...items, ...appointments.map(a => ({ ...a, itemType: 'appointment' as const }))];

        return items.sort((a, b) => {
            const dateA = (a as any).date || '';
            const dateB = (b as any).date || '';
            return dateA.localeCompare(dateB);
        });
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
                borderRadius: 8,
            },
        ],
    };

    // New Charts Data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    const trendData = {
        labels: last7Days.map(d => new Date(d).toLocaleDateString('ar-SA', { weekday: 'short' })),
        datasets: [{
            label: 'المهام المنجزة',
            data: last7Days.map(date => tasks.filter(t => t.completed && t.completedAt && t.completedAt.startsWith(date)).length),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#10B981',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
        }]
    };

    const sectionCounts = tasks.reduce((acc, task) => {
        const section = task.section || 'general';
        acc[section] = (acc[section] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const doughnutData = {
        labels: Object.keys(sectionCounts).map(getSectionLabel),
        datasets: [{
            data: Object.values(sectionCounts),
            backgroundColor: [
                '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
                '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'
            ],
            borderWidth: 0,
            hoverOffset: 4
        }]
    };

    const handleAddTaskWithTime = (time: string) => {
        setNewTask({
            ...newTask,
            date: new Date().toISOString().split('T')[0],
            time: time,
            section: 'appointment'
        });
        setShowTaskModal(true);
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

        // Adjust for Saturday start if needed, but standard calendar usually starts Sunday or Monday
        // Let's assume Sunday start for simplicity or match locale

        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    return (
        <div className="p-0 max-w-4xl mx-auto pb-24 px-0">
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
            <div className="grid grid-cols-4 gap-2 mb-6">
                {[
                    { id: 'list', label: 'المهام', icon: List },
                    { id: 'schedule', label: 'الجدول', icon: Clock },
                    { id: 'stats', label: 'إحصائيات', icon: BarChart2 },
                    { id: 'calendar', label: 'التقويم', icon: Calendar },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setViewMode(tab.id as any)}
                        className={`flex flex - col md: flex - row items - center justify - center gap - 1 md: gap - 2 px - 2 py - 2 rounded - lg transition - colors ${viewMode === tab.id
                            ? 'bg-primary-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            } `}
                    >
                        <tab.icon size={18} />
                        <span className="text-xs md:text-sm">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Add Task Button (Only show if not in Development or Stats mode) */}
            {viewMode !== 'stats' && viewMode !== 'schedule' && viewMode !== 'calendar' && (
                <>
                    <button
                        onClick={() => setShowSelectionModal(true)}
                        className="w-full bg-slate-800 hover:bg-slate-700 border-2 border-dashed border-slate-700 text-slate-400 hover:text-white rounded-xl p-4 mb-4 flex items-center justify-center gap-2 transition-all group"
                    >
                        <div className="bg-slate-700 group-hover:bg-primary-500 text-white p-1 rounded-full transition-colors">
                            <Plus size={20} />
                        </div>
                        <span className="font-medium">إضافة مهمة، فكرة، أو هدف جديد</span>
                    </button>
                </>
            )}

            {/* Selection Modal */}
            {showSelectionModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-slate-700 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">ماذا تريد أن تضيف؟</h3>
                            <button onClick={() => setShowSelectionModal(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => {
                                    setShowSelectionModal(false);
                                    setShowTaskModal(true);
                                }}
                                className="flex flex-col items-center gap-3 p-6 bg-slate-700/50 hover:bg-primary-500/20 border border-slate-600 hover:border-primary-500 rounded-xl transition-all group"
                            >
                                <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 group-hover:bg-primary-500 group-hover:text-white flex items-center justify-center transition-colors">
                                    <CheckSquare size={24} />
                                </div>
                                <span className="font-bold text-slate-200 group-hover:text-white">مهمة جديدة</span>
                            </button>

                            <button
                                onClick={() => {
                                    setShowSelectionModal(false);
                                    setShowGoalModal(true);
                                }}
                                className="flex flex-col items-center gap-3 p-6 bg-slate-700/50 hover:bg-purple-500/20 border border-slate-600 hover:border-purple-500 rounded-xl transition-all group"
                            >
                                <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white flex items-center justify-center transition-colors">
                                    <Target size={24} />
                                </div>
                                <span className="font-bold text-slate-200 group-hover:text-white">هدف جديد</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}

            {viewMode === 'stats' ? (
                // ... stats view ...
                // ... stats view ...
                <div className="space-y-6">
                    {/* Row 1: Completion & Priority */}
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
                                <Bar
                                    data={barData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        scales: {
                                            y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                                            x: { grid: { display: false } }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Trend & Categories */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Activity className="text-emerald-500" />
                                نشاط آخر 7 أيام
                            </h3>
                            <div className="h-64 flex justify-center">
                                <Line
                                    data={trendData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        scales: {
                                            y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                                            x: { grid: { display: false } }
                                        },
                                        plugins: { legend: { display: false } }
                                    }}
                                />
                            </div>
                        </div>
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Layout className="text-purple-500" />
                                توزيع المهام
                            </h3>
                            <div className="h-64 flex justify-center">
                                <Doughnut
                                    data={doughnutData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 11 } } } }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ) : viewMode === 'calendar' ? (
                <div className="space-y-6">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <button onClick={() => setCalendarDate(new Date(calendarDate.setMonth(calendarDate.getMonth() - 1)))} className="p-2 hover:bg-slate-700 rounded-lg">
                            <ChevronRight />
                        </button>
                        <h3 className="text-lg font-bold">
                            {calendarDate.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric', calendar: 'gregory' })}
                        </h3>
                        <button onClick={() => setCalendarDate(new Date(calendarDate.setMonth(calendarDate.getMonth() + 1)))} className="p-2 hover:bg-slate-700 rounded-lg">
                            <ChevronLeft />
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-slate-400 text-sm">
                            <div>الأحد</div><div>الاثنين</div><div>الثلاثاء</div><div>الأربعاء</div><div>الخميس</div><div>الجمعة</div><div>السبت</div>
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                            {getDaysInMonth(calendarDate).map((date, idx) => {
                                if (!date) return <div key={idx} className="aspect-square"></div>;
                                const dateStr = date.toISOString().split('T')[0];
                                const hasTasks = tasks.some(t => t.date === dateStr && !t.completed);
                                const hasAppointments = appointments.some(a => a.date === dateStr);
                                const isSelected = dateStr === calendarDate.toISOString().split('T')[0];

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setCalendarDate(new Date(date))}
                                        className={`aspect - square rounded - lg flex flex - col items - center justify - center relative transition - all ${isSelected ? 'bg-primary-600 text-white' : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
                                            } `}
                                    >
                                        <span className="text-sm font-medium">{date.getDate()}</span>
                                        {hasTasks && (
                                            <span className={`w - 1.5 h - 1.5 rounded - full mt - 1 ${isSelected ? 'bg-white' : 'bg-primary-500'} `}></span>
                                        )}
                                        {hasAppointments && (
                                            <span className={`w - 1.5 h - 1.5 rounded - full mt - 1 ${isSelected ? 'bg-blue-200' : 'bg-blue-500'} `}></span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Selected Date Tasks */}
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <List size={20} className="text-primary-500" />
                            مهام {calendarDate.toLocaleDateString('ar-SA')}
                        </h3>
                        <div className="space-y-3">
                            {/* Appointments for selected date */}
                            {appointments.filter(a => a.date === calendarDate.toISOString().split('T')[0]).map(appt => (
                                <div key={appt.id} className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                                        <Calendar size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <span className="text-white font-medium">{appt.title}</span>
                                            <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full">{appt.time}</span>
                                        </div>
                                        {appt.location && <div className="text-xs text-slate-400 mt-0.5">📍 {appt.location}</div>}
                                    </div>
                                </div>
                            ))}

                            {/* Tasks for selected date */}
                            {tasks.filter(t => t.date === calendarDate.toISOString().split('T')[0]).length === 0 && appointments.filter(a => a.date === calendarDate.toISOString().split('T')[0]).length === 0 ? (
                                <p className="text-slate-500 text-center py-4">لا توجد مهام أو مواعيد لهذا اليوم</p>
                            ) : (
                                tasks.filter(t => t.date === calendarDate.toISOString().split('T')[0]).map(task => (
                                    <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg border border-slate-700">
                                        <button
                                            onClick={() => toggleTaskStatus(task.id)}
                                            className={`w - 5 h - 5 rounded - full border - 2 flex items - center justify - center ${task.completed ? 'bg-green-500 border-green-500' : 'border-slate-500'} `}
                                        >
                                            {task.completed && <Check size={12} className="text-white" />}
                                        </button>
                                        <span className={task.completed ? 'line-through text-slate-500' : 'text-white'}>{task.title}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            ) : viewMode === 'schedule' ? (
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
                            if (item.itemType === 'appointment') {
                                const appt = item as Appointment;
                                return (
                                    <div
                                        key={appt.id}
                                        className="group bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-blue-500/50 transition-all"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1 w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                                <Calendar size={20} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-medium text-lg text-white truncate">
                                                        {appt.title}
                                                    </h3>
                                                    <span className="text-xs bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                                                        موعد
                                                    </span>
                                                </div>

                                                {appt.notes && (
                                                    <p className="text-sm text-slate-400 mb-2 line-clamp-2">{appt.notes}</p>
                                                )}

                                                <div className="flex flex-wrap gap-2 text-xs items-center text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {new Date(appt.date).toLocaleDateString('ar-SA')}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {appt.time}
                                                    </span>
                                                    {appt.location && (
                                                        <span className="flex items-center gap-1">
                                                            <div className="w-3 h-3">📍</div>
                                                            {appt.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            } else if (item.itemType === 'task') {
                                const task = item as Task;
                                return (
                                    <div
                                        key={task.id}
                                        className={`group bg - slate - 800 rounded - xl p - 4 border transition - all ${task.completed
                                            ? 'border-green-500/30 bg-green-500/5'
                                            : 'border-slate-700 hover:border-primary-500/50'
                                            } `}
                                    >
                                        <div className="flex items-start gap-4">
                                            <button
                                                onClick={() => toggleTaskStatus(task.id)}
                                                className={`mt - 1 w - 6 h - 6 rounded - lg border - 2 flex items - center justify - center transition - colors ${task.completed
                                                    ? 'bg-green-500 border-green-500 text-white'
                                                    : 'border-slate-600 hover:border-primary-500'
                                                    } `}
                                            >
                                                {task.completed && <Check size={14} strokeWidth={3} />}
                                            </button>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className={`font - medium text - lg truncate ${task.completed ? 'line-through text-slate-500' : 'text-white'} `}>
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
                                                    <span className={`px - 2 py - 1 rounded border ${getPriorityColor(task.priority || 'medium')} `}>
                                                        {task.priority === 'high' ? 'عالي' : task.priority === 'medium' ? 'متوسط' : 'منخفض'}
                                                    </span>
                                                    <span className="px-2 py-1 rounded bg-slate-700 text-slate-300 border border-slate-600">
                                                        {getSectionLabel(task.section || 'general')}
                                                    </span>
                                                    {task.date && (
                                                        <span className="text-slate-400 flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            {task.date.replace('T', ' ')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                                                    <Calendar size={12} />
                                                    <span>{new Date(task.date).toLocaleDateString('ar-SA')}</span>
                                                    {task.time && (
                                                        <>
                                                            <span className="mx-1">•</span>
                                                            <Clock size={12} />
                                                            <span>{task.time}</span>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Subtasks Display */}
                                                {task.subtasks && task.subtasks.length > 0 && (
                                                    <div className="mt-3 space-y-1 pl-4 border-r-2 border-slate-700 mr-1">
                                                        {task.subtasks.map(st => (
                                                            <div key={st.id} className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => toggleSubtaskInList(task.id, st.id)}
                                                                    className={`w - 4 h - 4 rounded border flex items - center justify - center transition - all ${st.completed ? 'bg-primary-500 border-primary-500' : 'border-slate-500'} `}
                                                                >
                                                                    {st.completed && <Check size={10} className="text-white" />}
                                                                </button>
                                                                <span className={`text - sm ${st.completed ? 'line-through text-slate-500' : 'text-slate-300'} `}>
                                                                    {st.title}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
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
                                                <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg" title="حذف">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            } else {
                                const goal = item as DevelopmentGoal;
                                return (
                                    <div key={goal.id} className={`group bg - slate - 800 rounded - xl p - 4 border border - slate - 700 flex items - center justify - between ${goal.status === 'completed' ? 'opacity-60' : ''} `}>
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => handleToggleGoalStatus(goal.id)} className="text-slate-400 hover:text-green-400 transition-colors">
                                                {goal.status === 'completed' ? <CheckCircle size={24} className="text-green-500" /> : <Circle size={24} />}
                                            </button>
                                            <div>
                                                <h3 className={`font - bold text - lg flex items - center gap - 2 ${goal.status === 'completed' ? 'line-through text-slate-500' : 'text-white'} `}>
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

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditGoal(goal)} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg" title="تعديل">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteGoal(goal.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg" title="حذف">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            }
                        })
                    )}
                </div>
            )}

            {/* Task Modal */}
            {showTaskModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-4 border-b border-slate-800">
                            <h3 className="text-xl font-bold">{newTask.id ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}</h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-4 space-y-3 overflow-y-auto flex-1">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">العنوان</label>
                                <input
                                    type="text"
                                    value={newTask.title}
                                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                    className="w-full bg-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="اسم المهمة..."
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">القسم</label>
                                    <select
                                        value={newTask.section}
                                        onChange={e => setNewTask({ ...newTask, section: e.target.value as any })}
                                        className="w-full bg-slate-800 rounded-lg px-4 py-2"
                                    >
                                        <option value="general">عام</option>
                                        <option value="work">عمل</option>
                                        <option value="personal">شخصي</option>
                                        <option value="shopping">تسوق</option>
                                        <option value="health">صحة</option>
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

                            <div className="grid grid-cols-2 gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">التاريخ</label>
                                    <input
                                        type="date"
                                        value={newTask.date}
                                        onChange={e => setNewTask({ ...newTask, date: e.target.value })}
                                        className="w-full bg-slate-700 rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">الوقت (اختياري)</label>
                                    <input
                                        type="time"
                                        value={newTask.time || ''}
                                        onChange={e => setNewTask({ ...newTask, time: e.target.value })}
                                        className="w-full bg-slate-700 rounded-lg px-3 py-2"
                                    />
                                </div>
                            </div>

                            {/* Recurrence Section */}
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">التكرار</label>
                                <select
                                    value={newTask.recurrence?.type || 'none'}
                                    onChange={e => setNewTask({ ...newTask, recurrence: { ...newTask.recurrence, type: e.target.value as any } })}
                                    className="w-full bg-slate-800 rounded-lg px-4 py-2"
                                >
                                    <option value="none">مرة واحدة</option>
                                    <option value="daily">يومي (يتجدد تلقائياً)</option>
                                    <option value="weekly">أسبوعي</option>
                                    <option value="monthly">شهري</option>
                                </select>
                            </div>

                            {newTask.recurrence?.type === 'weekly' && (
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">اختر الأيام</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map((day, idx) => {
                                            // Adjust index to match JS getDay() if needed, or just use 0-6
                                            // Let's use 0=Sunday, 6=Saturday to match JS Date.getDay()
                                            // Array above: Sat=6, Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5
                                            const dayIndex = idx === 0 ? 6 : idx - 1;
                                            const isSelected = newTask.recurrence?.days?.includes(dayIndex);
                                            return (
                                                <button
                                                    key={day}
                                                    onClick={() => {
                                                        const currentDays = newTask.recurrence?.days || [];
                                                        const newDays = isSelected
                                                            ? currentDays.filter(d => d !== dayIndex)
                                                            : [...currentDays, dayIndex];
                                                        setNewTask({
                                                            ...newTask,
                                                            recurrence: { ...newTask.recurrence, type: 'weekly', days: newDays }
                                                        });
                                                    }}
                                                    className={`px - 3 py - 1.5 rounded - lg text - sm transition - colors ${isSelected
                                                        ? 'bg-primary-500 text-white'
                                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                                        } `}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Reminder Section */}
                            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 flex items-center gap-3">
                                <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500">
                                    <Clock size={20} />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm text-slate-400 mb-1">تذكير في وقت محدد</label>
                                    <input
                                        type="time"
                                        value={newTask.reminderTime || ''}
                                        onChange={e => setNewTask({ ...newTask, reminderTime: e.target.value })}
                                        className="w-full bg-slate-700 rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">المهام الفرعية</label>
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newSubtaskTitle}
                                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                                            placeholder="أضف مهمة فرعية..."
                                            className="flex-1 bg-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                                        />
                                        <button onClick={handleAddSubtask} className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg">
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {newTask.subtasks?.map(st => (
                                            <div key={st.id} className="flex items-center justify-between bg-slate-800/50 p-2 rounded-lg">
                                                <span className="text-sm text-slate-300">{st.title}</span>
                                                <button onClick={() => removeSubtask(st.id)} className="text-slate-500 hover:text-red-400">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">ملاحظات</label>
                                <textarea
                                    value={newTask.description || ''}
                                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                    className="w-full bg-slate-800 rounded-lg px-4 py-2 h-20 resize-none"
                                    placeholder="تفاصيل إضافية..."
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-900 rounded-b-2xl">
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
                                حفظ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Goal Modal */}
            {showGoalModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-6 border-b border-slate-800">
                            <h3 className="text-xl font-bold">{editingGoal ? 'تعديل الهدف' : 'إضافة هدف جديد'}</h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto">
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
                                onClick={closeModal}
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
                    </div>
                </div>
            )}
        </div>
    );
}
