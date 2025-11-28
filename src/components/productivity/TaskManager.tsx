import { useState } from 'react';
import { Plus, Trash2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProductivityStore } from '../../store/useProductivityStore';
import { getToday, formatArabicDate, isToday } from '../../utils/dateHelpers';


export default function TaskManager() {
    const { tasks, addTask, toggleTask, deleteTask } = useProductivityStore();
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    const todayTasks = tasks.filter(task => isToday(task.date));
    const completedCount = todayTasks.filter(t => t.completed).length;

    const handleAddTask = async () => {
        if (!newTaskTitle.trim()) return;

        await addTask({
            title: newTaskTitle,
            completed: false,
            date: getToday(),
            recurrence: { type: 'none' },
        });

        setNewTaskTitle('');
        setShowAddForm(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">المهام اليومية</h2>
                    <p className="text-slate-400">{formatArabicDate(new Date())}</p>
                </div>
                <div className="text-left">
                    <p className="text-sm text-slate-400">المنجزة</p>
                    <p className="text-2xl font-bold text-primary-500">
                        {completedCount}/{todayTasks.length}
                    </p>
                </div>
            </div>

            {/* Add Task Button */}
            {!showAddForm && (
                <button
                    onClick={() => setShowAddForm(true)}
                    className="w-full py-3 bg-primary-500 hover:bg-primary-600 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    <span>إضافة مهمة جديدة</span>
                </button>
            )}

            {/* Add Task Form */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-slate-800 rounded-xl p-4 border border-slate-700"
                    >
                        <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                            placeholder="اكتب المهمة..."
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddTask}
                                className="flex-1 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors"
                            >
                                <Check size={18} />
                                <span>إضافة</span>
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddForm(false);
                                    setNewTaskTitle('');
                                }}
                                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors"
                            >
                                <X size={18} />
                                <span>إلغاء</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tasks List */}
            <div className="space-y-2">
                {todayTasks.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <p>لا توجد مهام اليوم</p>
                    </div>
                ) : (
                    todayTasks.map((task) => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`
                bg-slate-800 rounded-lg p-4 border border-slate-700
                ${task.completed ? 'opacity-60' : ''}
              `}
                        >
                            <div className="flex items-center gap-3">
                                {/* Checkbox */}
                                <button
                                    onClick={() => toggleTask(task.id)}
                                    className={`
                    w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all
                    ${task.completed
                                            ? 'bg-primary-500 border-primary-500'
                                            : 'border-slate-600 hover:border-primary-500'
                                        }
                  `}
                                >
                                    {task.completed && <Check size={16} className="text-white" />}
                                </button>

                                {/* Task Title */}
                                <div className="flex-1">
                                    <p className={`
                    ${task.completed ? 'line-through text-slate-400' : 'text-white'}
                  `}>
                                        {task.title}
                                    </p>
                                    {task.time && (
                                        <p className="text-sm text-slate-400 mt-1">⏰ {task.time}</p>
                                    )}
                                    {task.rolledOver && (
                                        <span className="inline-block mt-1 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                                            منقولة من الأمس
                                        </span>
                                    )}
                                </div>

                                {/* Delete Button */}
                                <button
                                    onClick={() => deleteTask(task.id)}
                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
