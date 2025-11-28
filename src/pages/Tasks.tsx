import { useState, useEffect } from 'react';
import {
    Plus, Trash2, Check, Calendar, Clock,
    Layout, List, BarChart2, X,
    Share2, Edit2, Download, PieChart, GraduationCap
} from 'lucide-react';
import type { Task, TaskPriority, TaskSection, TaskStatus } from '../types';
import { storage } from '../utils/storage';
import { addTaskToSystem } from '../utils/taskHelper';
import DevelopmentSection from '../components/tasks/DevelopmentSection';
import TimelineSection from '../components/tasks/TimelineSection';
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
    const [viewMode, setViewMode] = useState<'today' | 'week' | 'all' | 'stats' | 'development' | 'timeline'>('today');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

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

    // Load tasks
    const loadTasks = () => {
        setTimeout(() => {
            const savedTasks = storage.get<Task[]>('tasks') || [];
            setTasks(savedTasks);
        }, 50);
    };

    useEffect(() => {
        loadTasks();
        window.addEventListener('tasks-updated', loadTasks);
        return () => window.removeEventListener('tasks-updated', loadTasks);
    }, []);

    useEffect(() => {
        if (tasks.length > 0) {
            storage.set('tasks', tasks);
        }
    }, [tasks]);

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

    const filteredTasks = tasks.filter(t => {
        if (viewMode === 'today') {
            const today = new Date().toISOString().split('T')[0];
            if (t.recurrence?.type === 'daily') return true;
            const isCompletedToday = t.completed && t.lastCompletedDate === today;
            return !t.completed || isCompletedToday;
        }
        return true;
    });

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
        setShowAddModal(true);
    };

    return (
        <div className="py-6 max-w-4xl mx-auto px-4">
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

            {/* View Tabs */}
            <div className="flex overflow-x-auto pb-2 mb-6 gap-2 no-scrollbar">
                {[
                    { id: 'today', label: 'اليوم', icon: Calendar },
                    { id: 'timeline', label: 'الجدول', icon: Clock },
                    { id: 'week', label: 'الأسبوع', icon: Layout },
                    { id: 'all', label: 'الكل', icon: List },
                    { id: 'development', label: 'تطوير ذاتي', icon: GraduationCap },
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
            {viewMode !== 'development' && viewMode !== 'stats' && (
                <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full bg-slate-800 hover:bg-slate-700 border-2 border-dashed border-slate-700 text-slate-400 hover:text-white rounded-xl p-4 mb-8 flex items-center justify-center gap-2 transition-all group"
                >
                    <div className="bg-slate-700 group-hover:bg-primary-500 text-white p-1 rounded-full transition-colors">
                        <Plus size={20} />
                    </div>
                    <span className="font-medium">إضافة مهمة، فكرة، أو موعد جديد</span>
                </button>
            )}

            {/* Content */}

            {viewMode === 'development' ? (
                <DevelopmentSection />
            ) : viewMode === 'stats' ? (
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
                <TimelineSection
                    tasks={tasks}
                    onToggleStatus={toggleTaskStatus}
                    onAddTaskWithTime={handleAddTaskWithTime}
                />
            ) : (
                // ... list view ...
                <div className="space-y-3">
                    {filteredTasks.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            لا توجد مهام في هذه القائمة
                        </div>
                    ) : (
                        filteredTasks.map(task => (
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
                                                    {task.recurrence?.times && task.recurrence.times.length > 0 && (
                                                        <span className="mr-1 text-[10px] text-slate-400">
                                                            [{task.recurrence.times.filter(t => t).join(', ')}]
                                                        </span>
                                                    )}
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
                        ))
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-800">
                            <h3 className="text-xl font-bold">{editingTask ? 'تعديل المهمة' : 'إضافة جديدة'}</h3>
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
                                                // Reset times if frequency changes, or adjust array length
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
                    </div>
                </div>
            )}
        </div>
    );
}
