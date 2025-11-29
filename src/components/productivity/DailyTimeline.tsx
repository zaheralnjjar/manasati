import { useState, useMemo } from 'react';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, CheckCircle2, Circle, Clock, MapPin, Plus, Layout, Download } from 'lucide-react';
import { useProductivityStore } from '../../store/useProductivityStore';
import { getToday } from '../../utils/dateHelpers';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DailyTimelineProps {
    onAddTaskWithTime?: (time: string) => void;
}

type ViewMode = 'day' | 'week';

export default function DailyTimeline({ onAddTaskWithTime }: DailyTimelineProps) {
    const [selectedDate, setSelectedDate] = useState(getToday());
    const [viewMode, setViewMode] = useState<ViewMode>('day');
    const { tasks, appointments, habits, toggleTask, toggleHabitDay } = useProductivityStore();

    // Generate hours 00:00 to 23:00
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Filter and group items by hour
    const timelineItems = useMemo(() => {
        const itemsByHour: Record<number, any[]> = {};

        // Initialize hours
        hours.forEach(h => itemsByHour[h] = []);

        // 1. Appointments
        appointments
            .filter(apt => apt.date === selectedDate)
            .forEach(apt => {
                const hour = parseInt(apt.time.split(':')[0]);
                if (!isNaN(hour)) {
                    itemsByHour[hour].push({ ...apt, type: 'appointment' });
                }
            });

        // 2. Tasks (only those with time)
        tasks
            .filter(t => t.date === selectedDate && t.time)
            .forEach(task => {
                const hour = parseInt(task.time!.split(':')[0]);
                if (!isNaN(hour)) {
                    itemsByHour[hour].push({ ...task, type: 'task' });
                }
            });

        return itemsByHour;
    }, [selectedDate, tasks, appointments]);

    // Tasks without specific time (All Day)
    const allDayTasks = tasks.filter(t => t.date === selectedDate && !t.time);

    // Habits for the day
    const dayHabits = habits;

    const changeDate = (days: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('ar-SA-u-ca-gregory', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    };

    // Hijri (Islamic) calendar formatting
    const formatHijriDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('ar-SA-u-ca-islamic', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    };

    const handleExportPDF = async () => {
        const input = document.getElementById('daily-schedule-print');
        if (!input) return;

        try {
            const canvas = await html2canvas(input, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#1e293b' // Slate-800
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`schedule-${selectedDate}.pdf`);
        } catch (error) {
            console.error('PDF Export failed:', error);
            alert('فشل تصدير PDF');
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden">
            {/* Header / Date Navigation */}
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode(viewMode === 'day' ? 'week' : 'day')}
                        className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white flex items-center gap-2"
                        title={viewMode === 'day' ? 'عرض أسبوعي' : 'عرض يومي'}
                    >
                        <Layout size={20} />
                        <span className="text-xs hidden md:inline">{viewMode === 'day' ? 'أسبوعي' : 'يومي'}</span>
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
                        title="تصدير PDF"
                    >
                        <Download size={20} />
                    </button>
                </div>

                <div className="flex flex-col items-center">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <CalendarIcon size={18} className="text-primary-500" />
                        {formatDate(selectedDate)}
                    </h2>
                    <h3 className="text-sm text-slate-300 mt-1">
                        {formatHijriDate(selectedDate)}
                    </h3>
                    {selectedDate === getToday() && (
                        <span className="text-xs text-primary-400 font-medium bg-primary-500/10 px-2 py-0.5 rounded-full">اليوم</span>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={() => changeDate(-1)} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white">
                        <ChevronRight size={20} />
                    </button>
                    <button onClick={() => changeDate(1)} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white">
                        <ChevronLeft size={20} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {viewMode === 'day' ? (
                    <>
                        {/* All Day Section (Habits & Untimed Tasks) */}
                        {(dayHabits.length > 0 || allDayTasks.length > 0) && (
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">طوال اليوم</h3>

                                {/* Habits */}
                                {dayHabits.length > 0 && (
                                    <div className="mb-4">
                                        <div className="text-xs text-slate-500 mb-2">العادات</div>
                                        <div className="flex flex-wrap gap-2">
                                            {dayHabits.map(habit => (
                                                <button
                                                    key={habit.id}
                                                    onClick={() => toggleHabitDay(habit.id, selectedDate)}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${habit.tracking[selectedDate]
                                                        ? 'bg-green-500/20 border-green-500/50 text-green-400'
                                                        : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500'
                                                        }`}
                                                >
                                                    {habit.tracking[selectedDate] ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                                                    <span className="text-sm">{habit.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Untimed Tasks */}
                                {allDayTasks.length > 0 && (
                                    <div>
                                        <div className="text-xs text-slate-500 mb-2">مهام عامة</div>
                                        <div className="space-y-2">
                                            {allDayTasks.map(task => (
                                                <div key={task.id} className="flex items-center gap-3 bg-slate-700/30 p-2 rounded-lg border border-slate-700/30">
                                                    <button
                                                        onClick={() => toggleTask(task.id)}
                                                        className={`flex-shrink-0 ${task.completed ? 'text-green-500' : 'text-slate-400'}`}
                                                    >
                                                        {task.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                                    </button>
                                                    <span className={`text-sm ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                                                        {task.title}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Timeline */}
                        <div className="relative space-y-4 pl-4 border-r-2 border-slate-700/50 mr-4">
                            {hours.map(hour => {
                                const items = timelineItems[hour];
                                const isCurrentHour = new Date().getHours() === hour && selectedDate === getToday();

                                // Skip empty hours in the middle of the night (1 AM - 4 AM) to save space, unless they have items
                                if (items.length === 0 && hour > 0 && hour < 5) return null;

                                return (
                                    <div key={hour} className="relative group">
                                        {/* Time Label */}
                                        <div className={`absolute -right-[4.5rem] top-0 w-12 text-left text-xs font-mono ${isCurrentHour ? 'text-primary-400 font-bold' : 'text-slate-500'}`}>
                                            {hour.toString().padStart(2, '0')}:00
                                        </div>

                                        {/* Timeline Dot */}
                                        <div className={`absolute -right-[11px] top-1.5 w-5 h-5 rounded-full border-4 border-slate-900 ${isCurrentHour ? 'bg-primary-500' : 'bg-slate-700'} z-10`} />

                                        {/* Hour Content */}
                                        <div className={`min-h-[3rem] ${items.length > 0 ? 'pb-4' : 'pb-0'}`}>
                                            {items.length > 0 ? (
                                                <div className="space-y-2">
                                                    {items.map((item, idx) => (
                                                        <div
                                                            key={`${item.type}-${item.id}`}
                                                            className={`p-3 rounded-xl border flex gap-3 ${item.type === 'appointment'
                                                                ? 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20'
                                                                : item.completed
                                                                    ? 'bg-slate-800/50 border-slate-700 opacity-60'
                                                                    : 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/50'
                                                                }`}
                                                        >
                                                            {/* Icon */}
                                                            <div className="mt-0.5">
                                                                {item.type === 'appointment' ? (
                                                                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                                                                        <Clock size={16} />
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => toggleTask(item.id)}
                                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${item.completed ? 'bg-green-500/20 text-green-400' : 'bg-slate-600/30 text-slate-400 hover:text-white'
                                                                            }`}
                                                                    >
                                                                        {item.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* Content */}
                                                            <div className="flex-1">
                                                                <div className="flex justify-between items-start">
                                                                    <span className={`font-medium ${item.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                                                                        {item.title}
                                                                    </span>
                                                                    <span className="text-xs font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                                                                        {item.time}
                                                                    </span>
                                                                </div>

                                                                {item.type === 'appointment' && item.location && (
                                                                    <div className="flex items-center gap-1 text-xs text-blue-300/70 mt-1">
                                                                        <MapPin size={12} />
                                                                        {item.location}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                // Empty slot - Add Button
                                                <button
                                                    onClick={() => onAddTaskWithTime?.(`${hour.toString().padStart(2, '0')}:00`)}
                                                    className="w-full h-12 border-2 border-dashed border-slate-800/50 rounded-xl flex items-center justify-center text-slate-600 hover:text-primary-400 hover:border-primary-500/30 hover:bg-primary-500/5 transition-all opacity-0 group-hover:opacity-100 ml-2"
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
                    </>
                ) : (
                    // Week View Placeholder (Basic Implementation)
                    <div className="grid grid-cols-1 gap-4">
                        {Array.from({ length: 7 }).map((_, i) => {
                            const date = new Date(selectedDate);
                            date.setDate(date.getDate() + i);
                            const dateStr = date.toISOString().split('T')[0];
                            const dayTasks = tasks.filter(t => t.date === dateStr);

                            return (
                                <div key={i} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                    <h3 className="font-bold text-white mb-2 flex justify-between">
                                        <span>{formatDate(dateStr)}</span>
                                        <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">{dayTasks.length} مهام</span>
                                    </h3>
                                    <div className="space-y-2">
                                        {dayTasks.length > 0 ? dayTasks.map(t => (
                                            <div key={t.id} className="text-sm text-slate-300 flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${t.completed ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                                                <span className={t.completed ? 'line-through opacity-50' : ''}>{t.title}</span>
                                            </div>
                                        )) : (
                                            <div className="text-xs text-slate-500">لا توجد مهام</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            {/* Hidden Print View */}
            <div className="absolute top-[-9999px] left-[-9999px] w-[800px]" id="daily-schedule-print">
                <div className="bg-slate-800 p-8 text-white min-h-[1000px]" dir="rtl">
                    <div className="text-center mb-8 border-b border-slate-700 pb-4">
                        <h1 className="text-3xl font-bold text-primary-500 mb-2">جدول يومي</h1>
                        <h2 className="text-xl text-white">{formatDate(selectedDate)}</h2>
                        <p className="text-slate-400">{formatHijriDate(selectedDate)}</p>
                    </div>

                    {/* Habits & All Day */}
                    {(dayHabits.length > 0 || allDayTasks.length > 0) && (
                        <div className="mb-8 bg-slate-700/30 p-4 rounded-xl border border-slate-600">
                            <h3 className="font-bold text-slate-300 mb-4 border-b border-slate-600 pb-2">طوال اليوم</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm text-slate-400 mb-2">العادات</h4>
                                    <ul className="list-disc list-inside text-slate-200">
                                        {dayHabits.map(h => (
                                            <li key={h.id} className={h.tracking[selectedDate] ? 'text-green-400' : ''}>
                                                {h.name} {h.tracking[selectedDate] ? '(تم)' : ''}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-sm text-slate-400 mb-2">مهام عامة</h4>
                                    <ul className="list-disc list-inside text-slate-200">
                                        {allDayTasks.map(t => (
                                            <li key={t.id} className={t.completed ? 'text-green-400 line-through' : ''}>
                                                {t.title}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="space-y-0 relative border-r-2 border-slate-600 mr-4 pr-6">
                        {hours.map(hour => {
                            const items = timelineItems[hour];
                            if (items.length === 0 && (hour < 5 || hour > 23)) return null;

                            return (
                                <div key={hour} className="relative py-2 min-h-[60px] flex gap-4">
                                    <div className="w-16 text-left text-slate-400 font-mono pt-1 shrink-0 absolute -right-20">
                                        {hour.toString().padStart(2, '0')}:00
                                    </div>
                                    <div className="absolute -right-[7px] top-4 w-3 h-3 rounded-full bg-slate-600 border border-slate-800 z-10" />

                                    <div className="flex-1 space-y-2">
                                        {items.map((item, idx) => (
                                            <div key={idx} className={`p-3 rounded-lg border ${item.type === 'appointment' ? 'bg-blue-900/20 border-blue-800' : 'bg-slate-700/50 border-slate-600'
                                                }`}>
                                                <div className="font-bold text-white">{item.title}</div>
                                                {item.type === 'appointment' && item.location && (
                                                    <div className="text-sm text-slate-400">{item.location}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
