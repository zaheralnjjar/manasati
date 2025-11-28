import { useMemo } from 'react';
import { Clock, CheckCircle2, Circle, Plus } from 'lucide-react';
import type { Task } from '../../types';

interface TimelineSectionProps {
    tasks: Task[];
    onToggleStatus: (id: string) => void;
    onAddTaskWithTime: (time: string) => void;
}

export default function TimelineSection({ tasks, onToggleStatus, onAddTaskWithTime }: TimelineSectionProps) {
    const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM

    const tasksByHour = useMemo(() => {
        const grouped: Record<number, Task[]> = {};
        const today = new Date().toISOString().split('T')[0];

        tasks.forEach(task => {
            if (!task.dueDate || !task.dueDate.startsWith(today)) return;

            let hour = -1;
            if (task.time) {
                hour = parseInt(task.time.split(':')[0]);
            } else if (task.dueDate.includes('T')) {
                hour = parseInt(task.dueDate.split('T')[1].split(':')[0]);
            }

            if (hour !== -1) {
                if (!grouped[hour]) grouped[hour] = [];
                grouped[hour].push(task);
            }
        });

        return grouped;
    }, [tasks]);

    const formatHour = (hour: number) => {
        return new Date(0, 0, 0, hour).toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit' });
    };

    return (
        <div className="space-y-4 max-w-2xl mx-auto">
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Clock className="text-primary-500" />
                    جدول اليوم
                    <span className="text-sm font-normal text-slate-400">
                        ({new Date().toLocaleDateString('ar-SA', { weekday: 'long' })})
                    </span>
                </h3>

                <div className="space-y-2 relative">
                    {/* Vertical Line */}
                    <div className="absolute right-[4.5rem] top-0 bottom-0 w-px bg-slate-700/50"></div>

                    {hours.map(hour => {
                        const hourTasks = tasksByHour[hour] || [];
                        const isBusy = hourTasks.length > 0;

                        return (
                            <div key={hour} className="flex group min-h-[80px]">
                                {/* Time Column */}
                                <div className="w-16 text-xs text-slate-400 pt-2 text-left pl-2 font-mono">
                                    {formatHour(hour)}
                                </div>

                                {/* Content Column */}
                                <div className="flex-1 pr-6 pb-6 relative">
                                    {/* Hour Marker Dot */}
                                    <div className={`absolute right-[-5px] top-3 w-2.5 h-2.5 rounded-full border-2 border-slate-900 z-10 ${isBusy ? 'bg-primary-500' : 'bg-slate-600'
                                        }`}></div>

                                    {isBusy ? (
                                        <div className="space-y-2">
                                            {hourTasks.map(task => (
                                                <div
                                                    key={task.id}
                                                    className={`bg-slate-800 p-3 rounded-xl border transition-all ${task.completed
                                                        ? 'border-green-500/20 opacity-75'
                                                        : 'border-slate-700 hover:border-primary-500/50'
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <h4 className={`font-bold text-sm ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                                                                {task.title}
                                                            </h4>
                                                            {task.description && (
                                                                <p className="text-xs text-slate-400 line-clamp-1 mt-1">{task.description}</p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => onToggleStatus(task.id)}
                                                            className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${task.completed
                                                                ? 'bg-green-500/10 text-green-500'
                                                                : 'bg-slate-700 text-slate-400 hover:text-primary-500'
                                                                }`}
                                                        >
                                                            {task.completed ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => onAddTaskWithTime(`${hour.toString().padStart(2, '0')}:00`)}
                                            className="w-full h-full border-2 border-dashed border-slate-800 rounded-xl flex items-center justify-center text-slate-600 hover:text-primary-400 hover:border-primary-500/30 hover:bg-primary-500/5 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Plus size={16} />
                                            <span className="mr-2 text-xs">إضافة موعد</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
