// Dashboard Component
import { useEffect, useState } from 'react';
import {
    MapPin, Wallet, CheckSquare, ShoppingCart, Target, ArrowLeft,
    Calendar, ArrowRight, Settings, ChevronUp, ChevronDown, Clock
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useProductivityStore } from '../store/useProductivityStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSpiritualStore } from '../store/useSpiritualStore';
import { useLifestyleStore } from '../store/useLifestyleStore';
import { useMasariStore } from '../store/useMasariStore';
import DashboardTicker from '../components/DashboardTicker';
import RecentActivity from '../components/dashboard/RecentActivity';
import DashboardMapWidget from '../components/dashboard/DashboardMapWidget';
import { usePrayerSync } from '../hooks/usePrayerSync';
import type { PrayerTime } from '../types';
import type { PageType } from '../store/useAppStore';
import { generateICS, downloadICS } from '../utils/icsExport';

interface DashboardProps {
    onNavigate: (page: PageType) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
    // Stores
    const { user, settings } = useAppStore();
    const { tasks, appointments, initialize: initProductivity } = useProductivityStore();
    const { getBudgetSummary, initialize: initFinance } = useFinanceStore();
    const { readingGoals, initialize: initSpiritual } = useSpiritualStore();
    const { shoppingList, initialize: initLifestyle } = useLifestyleStore();
    const { savedLocations, currentLocation } = useMasariStore();

    // Synchronized Prayer Times
    const { nextPrayer, currentPrayer, timeRemaining, timeSince, prayers } = usePrayerSync();

    // Initialize stores on mount
    useEffect(() => {
        initProductivity();
        initFinance();
        initSpiritual();
        initLifestyle();
    }, []);

    // Derived State
    const budget = getBudgetSummary();

    // Get today's tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTasks = tasks.filter(t => {
        if (!t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        return dueDate >= today && dueDate < tomorrow && !t.completed;
    });

    const activeReading = readingGoals.find(g => !g.completed);


    // Collapsible State
    const [isTasksExpanded, setIsTasksExpanded] = useState(false);
    const [isFinanceExpanded, setIsFinanceExpanded] = useState(false);
    const [isDevExpanded, setIsDevExpanded] = useState(false);

    // Greeting based on time
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء النور';

    // Export Modal State
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportSettings, setExportSettings] = useState({
        includePrayers: true,
        includeTasks: true,
        includeAppointments: true
    });

    const handleShareCalendar = () => {
        setShowExportModal(true);
    };

    const handleExportConfirm = () => {
        if (!prayers || prayers.length === 0) {
            alert('جاري تحميل أوقات الصلاة، يرجى المحاولة بعد قليل');
            return;
        }

        // Convert PrayerTimeResult[] to PrayerTime object for ICS generation
        const todayPrayerTime: PrayerTime = {
            date: new Date().toISOString().split('T')[0],
            fajr: prayers.find(p => p.name === 'Fajr')?.time || '',
            sunrise: prayers.find(p => p.name === 'Sunrise')?.time || '',
            dhuhr: prayers.find(p => p.name === 'Dhuhr')?.time || '',
            asr: prayers.find(p => p.name === 'Asr')?.time || '',
            maghrib: prayers.find(p => p.name === 'Maghrib')?.time || '',
            isha: prayers.find(p => p.name === 'Isha')?.time || '',
        };

        const icsContent = generateICS(
            exportSettings.includePrayers ? [todayPrayerTime] : [],
            settings.prayerSettings || {
                selectedPrayers: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
                notifyAtAdhan: true,
                notifyBeforeAdhan: true,
                minutesBeforeAdhan: 15
            },
            exportSettings.includeTasks ? tasks : [],
            exportSettings.includeAppointments ? appointments : []
        );

        if (icsContent) {
            downloadICS(icsContent, `my-calendar-${new Date().toISOString().split('T')[0]}.ics`);
            setShowExportModal(false);
        } else {
            alert('حدث خطأ أثناء إنشاء ملف التقويم');
        }
    };

    return (
        <div className="pb-24 min-h-screen bg-slate-900 text-slate-100 font-cairo">
            <DashboardTicker />

            <div className="p-[2px] md:p-6 max-w-7xl mx-auto space-y-1 md:space-y-6">
                {/* Header - Split: Right (Greeting+Date) | Left (Location+Settings) */}
                <div className="flex justify-between items-start gap-2 mb-1 md:mb-6 px-1">
                    {/* Right Side: Greeting + Date */}
                    <div className="flex-1">
                        <h1 className="text-lg md:text-3xl font-bold text-white mb-0">
                            {greeting}, {user?.name || 'مرحباً بك'} 👋
                        </h1>
                        <p className="text-slate-400 text-[10px] md:text-base flex items-center gap-2">
                            <span>{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', calendar: 'gregory' })}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                            <span>
                                {(() => {
                                    try {
                                        return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
                                    } catch (e) {
                                        return new Date().toLocaleDateString('ar-SA');
                                    }
                                })()}
                            </span>
                        </p>
                    </div>

                    {/* Left Side: Location + Settings Icon */}
                    <div className="flex flex-col items-end gap-1">
                        <div className="text-xs md:text-sm text-slate-400 flex items-center gap-1">
                            <span>{currentLocation ? `${currentLocation.lat.toFixed(2)}, ${currentLocation.lng.toFixed(2)}` : 'موقعي'}</span>
                            <MapPin size={14} className="text-primary-400" />
                        </div>
                        <button
                            onClick={() => onNavigate('settings')}
                            className="p-1.5 bg-slate-800 rounded-xl text-slate-400 hover:text-white border border-slate-700 hover:border-primary-500 transition-all"
                        >
                            <Settings size={16} />
                        </button>
                    </div>
                </div>

                {/* Single Column Layout - All Sections Stacked Vertically */}
                <div className="space-y-2 md:space-y-6">

                    {/* 1. Prayer Times Widget */}
                    {settings.widgetVisibility?.nextPrayer && (
                        <section className="bg-slate-800 rounded-2xl border border-slate-700 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
                            <div className="relative z-10">
                                {/* Header Section (Counters) - Balanced 3 Sections */}
                                <div className="grid grid-cols-3 items-center p-2 md:p-4 border-b border-slate-700/50 divide-x divide-x-reverse divide-slate-700/50">
                                    {/* Section 1: Title & Date */}
                                    <div className="text-center px-1">
                                        <h2 className="text-sm md:text-xl font-bold text-white mb-0">مواقيت الصلاة</h2>
                                        <p className="text-slate-400 text-[10px] md:text-xs truncate">
                                            {new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'short' })}
                                        </p>
                                    </div>

                                    {/* Section 2: Current Prayer Counter */}
                                    <div className="text-center px-1">
                                        {currentPrayer ? (
                                            <>
                                                <p className="text-[10px] md:text-xs text-emerald-400 mb-0 font-medium truncate">مضى على {currentPrayer.arabicName}</p>
                                                <p className="text-sm md:text-base font-bold text-white leading-none" dir="auto">+{timeSince}</p>
                                            </>
                                        ) : (
                                            <span className="text-slate-500 text-xs">-</span>
                                        )}
                                    </div>

                                    {/* Section 3: Next Prayer Counter */}
                                    <div className="text-center px-1">
                                        {nextPrayer ? (
                                            <>
                                                <p className="text-[10px] md:text-xs text-primary-400 mb-0 font-medium truncate">متبقي لـ {nextPrayer.arabicName}</p>
                                                <p className="text-sm md:text-base font-bold text-white leading-none" dir="auto">-{timeRemaining}</p>
                                            </>
                                        ) : (
                                            <span className="text-slate-500 text-xs">-</span>
                                        )}
                                    </div>
                                </div>

                                {/* Prayer Times Row (Table-like) */}
                                <div className="flex flex-row divide-x divide-x-reverse divide-slate-700/50 bg-slate-800/50">
                                    {Array.isArray(prayers) && prayers.map((prayer) => {
                                        const isNext = nextPrayer?.name === prayer.name;
                                        const isCurrent = currentPrayer?.name === prayer.name;
                                        return (
                                            <div key={prayer.name} className={`relative p-2 text-center flex-1 transition-all ${isNext ? 'bg-primary-900/20 text-primary-100' : isCurrent ? 'bg-slate-700/50 text-white' : 'text-slate-400'}`}>
                                                <div className={`text-[10px] md:text-sm font-medium mb-0.5 ${isNext ? 'text-primary-300' : ''}`}>{prayer.arabicName}</div>
                                                <div className="text-[10px] md:text-base font-mono font-medium" dir="ltr">{prayer.time}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 2. Recent Activity Feed (Collapsible) */}
                    <RecentActivity />

                    {/* 3. Collapsible Sections: Tasks, Finance, Development */}
                    {/* Tasks Summary */}
                    <div className="bg-slate-800/50 rounded-xl p-2 md:p-6 border border-slate-700/50">
                        <div
                            className="flex justify-between items-center mb-2 cursor-pointer"
                            onClick={() => setIsTasksExpanded(!isTasksExpanded)}
                        >
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
                                    <CheckSquare size={16} />
                                </div>
                                <h2 className="text-sm md:text-lg font-bold text-white">مهام اليوم</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">{todayTasks.length} مهام</span>
                                {isTasksExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                            </div>
                        </div>

                        {isTasksExpanded && (
                            <div className="space-y-2">
                                {todayTasks.length > 0 ? (
                                    todayTasks.slice(0, 3).map(task => (
                                        <div key={task.id} className="flex items-center gap-2 p-2 bg-slate-700/30 rounded-lg border border-slate-700/30">
                                            <div className={`w-1 h-8 rounded-full ${task.completed ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                            <div className="flex-1">
                                                <p className={`text-xs md:text-sm font-medium ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                                                    {task.title}
                                                </p>
                                                {task.time && (
                                                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {task.time}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-slate-500 py-2 text-xs">لا يوجد مهام لليوم</p>
                                )}
                                <button
                                    onClick={() => onNavigate('tasks')}
                                    className="w-full py-1.5 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors flex items-center justify-center gap-1"
                                >
                                    <span>عرض كل المهام</span>
                                    <ArrowLeft size={12} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Finance Summary */}
                    <div className="bg-slate-800/50 rounded-xl p-2 md:p-6 border border-slate-700/50">
                        <div
                            className="flex justify-between items-center mb-2 cursor-pointer"
                            onClick={() => setIsFinanceExpanded(!isFinanceExpanded)}
                        >
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-green-500/10 rounded-lg text-green-400">
                                    <Wallet size={16} />
                                </div>
                                <h2 className="text-sm md:text-lg font-bold text-white">المالية</h2>
                            </div>
                            {isFinanceExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                        </div>

                        {isFinanceExpanded && (
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-slate-700/30 p-2 rounded-xl border border-slate-700/30">
                                    <p className="text-slate-400 text-[10px] mb-1">المصروفات (هذا الشهر)</p>
                                    <p className="text-sm md:text-xl font-bold text-white font-mono">
                                        {budget.totalExpenses.toLocaleString()} <span className="text-[10px] text-green-500">$</span>
                                    </p>
                                </div>
                                <div className="bg-slate-700/30 p-2 rounded-xl border border-slate-700/30">
                                    <p className="text-slate-400 text-[10px] mb-1">الرصيد الحالي</p>
                                    <p className="text-sm md:text-xl font-bold text-white font-mono">
                                        {budget.currentBalance.toLocaleString()} <span className="text-[10px] text-green-500">$</span>
                                    </p>
                                </div>
                                <button
                                    onClick={() => onNavigate('budget')}
                                    className="col-span-2 py-1.5 text-xs text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors flex items-center justify-center gap-1"
                                >
                                    <span>تفاصيل الميزانية</span>
                                    <ArrowLeft size={12} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Development Summary */}
                    <div className="bg-slate-800/50 rounded-xl p-2 md:p-6 border border-slate-700/50">
                        <div
                            className="flex justify-between items-center mb-2 cursor-pointer"
                            onClick={() => setIsDevExpanded(!isDevExpanded)}
                        >
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-yellow-500/10 rounded-lg text-yellow-400">
                                    <Target size={16} />
                                </div>
                                <h2 className="text-sm md:text-lg font-bold text-white">تطوير الذات</h2>
                            </div>
                            {isDevExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                        </div>

                        {isDevExpanded && (
                            <div className="space-y-2">
                                {readingGoals.length > 0 ? (
                                    <div className="bg-slate-700/30 p-2 rounded-xl border border-slate-700/30">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs text-white">{readingGoals[0].bookName}</span>
                                            <span className="text-[10px] text-slate-400">{readingGoals[0].currentPage}/{readingGoals[0].totalPages}</span>
                                        </div>
                                        <div className="w-full bg-slate-700 rounded-full h-1.5">
                                            <div
                                                className="bg-yellow-500 h-1.5 rounded-full transition-all"
                                                style={{ width: `${Math.min(100, (readingGoals[0].currentPage / readingGoals[0].totalPages) * 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-center text-slate-500 py-2 text-xs">لا يوجد أهداف حالية</p>
                                )}
                                <button
                                    onClick={() => onNavigate('development')}
                                    className="w-full py-1.5 text-xs text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-lg transition-colors flex items-center justify-center gap-1"
                                >
                                    <span>خطتي التطويرية</span>
                                    <ArrowLeft size={12} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 4. Quick Actions Grid (2x2) */}
                    <div className="grid grid-cols-2 gap-2 md:gap-4">
                        {/* Masari Card */}
                        <button
                            onClick={() => onNavigate('masari')}
                            className="bg-slate-800 p-2 md:p-4 rounded-xl border border-slate-700 hover:border-slate-600 transition-all text-right group hover:bg-slate-750 flex flex-col justify-between min-h-[100px] md:min-h-[140px]"
                        >
                            <div className="w-full">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-1.5 md:p-3 rounded-lg bg-slate-900 text-slate-300 group-hover:text-primary-400 transition-colors">
                                        <MapPin size={16} className="md:w-6 md:h-6" />
                                    </div>
                                    <ArrowLeft className="text-slate-600 group-hover:text-slate-400 transition-colors" size={16} />
                                </div>
                                <h3 className="text-sm md:text-lg font-bold text-white mb-0.5">مساري</h3>
                                <div className="space-y-0.5 mt-1">
                                    {savedLocations.slice(-2).reverse().map(loc => (
                                        <div key={loc.id} className="text-[9px] text-slate-400 truncate flex items-center gap-1">
                                            <div className="w-1 h-1 rounded-full bg-purple-500"></div>
                                            {loc.name}
                                        </div>
                                    ))}
                                    {savedLocations.length === 0 && <span className="text-[9px] text-slate-500">لا توجد مواقع محفوظة</span>}
                                </div>
                            </div>
                        </button>

                        {/* Finance Card */}
                        <button
                            onClick={() => onNavigate('budget')}
                            className="bg-slate-800 p-2 md:p-4 rounded-xl border border-slate-700 hover:border-slate-600 transition-all text-right group hover:bg-slate-750 flex flex-col justify-between min-h-[100px] md:min-h-[140px]"
                        >
                            <div className="w-full">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-1.5 md:p-3 rounded-lg bg-slate-900 text-slate-300 group-hover:text-primary-400 transition-colors">
                                        <Wallet size={16} className="md:w-6 md:h-6" />
                                    </div>
                                    <ArrowLeft className="text-slate-600 group-hover:text-slate-400 transition-colors" size={16} />
                                </div>
                                <h3 className="text-sm md:text-lg font-bold text-white mb-0.5">المالية</h3>
                                <div className="space-y-0.5 mt-1">
                                    {(() => {
                                        const { incomes, expenses } = useFinanceStore.getState();
                                        const allTrans = [
                                            ...incomes.map(i => ({ ...i, type: 'income' })),
                                            ...expenses.map(e => ({ ...e, type: 'expense' }))
                                        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 2);

                                        if (allTrans.length === 0) return <span className="text-[9px] text-slate-500">لا توجد معاملات</span>;

                                        return allTrans.map(t => (
                                            <div key={t.id} className="text-[9px] text-slate-400 truncate flex items-center gap-1">
                                                <div className={`w-1 h-1 rounded-full ${t.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                {t.description || (t.type === 'income' ? 'دخل' : 'مصروف')} (${t.amount})
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </button>

                        {/* Tasks Card */}
                        <button
                            onClick={() => onNavigate('tasks')}
                            className="bg-slate-800 p-2 md:p-4 rounded-xl border border-slate-700 hover:border-slate-600 transition-all text-right group hover:bg-slate-750 flex flex-col justify-between min-h-[100px] md:min-h-[140px]"
                        >
                            <div className="w-full">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-1.5 md:p-3 rounded-lg bg-slate-900 text-slate-300 group-hover:text-primary-400 transition-colors">
                                        <CheckSquare size={16} className="md:w-6 md:h-6" />
                                    </div>
                                    <ArrowLeft className="text-slate-600 group-hover:text-slate-400 transition-colors" size={16} />
                                </div>
                                <h3 className="text-sm md:text-lg font-bold text-white mb-0.5">مهامي</h3>
                                <div className="space-y-0.5 mt-1">
                                    {tasks.filter(t => !t.completed).slice(0, 2).map(task => (
                                        <div key={task.id} className="text-[9px] text-slate-400 truncate flex items-center gap-1">
                                            <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                                            {task.title}
                                        </div>
                                    ))}
                                    {tasks.filter(t => !t.completed).length === 0 && <span className="text-[9px] text-slate-500">لا توجد مهام نشطة</span>}
                                </div>
                            </div>
                        </button>

                        {/* Shopping Card */}
                        <button
                            onClick={() => onNavigate('shopping')}
                            className="bg-slate-800 p-2 md:p-4 rounded-xl border border-slate-700 hover:border-slate-600 transition-all text-right group hover:bg-slate-750 flex flex-col justify-between min-h-[100px] md:min-h-[140px]"
                        >
                            <div className="w-full">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-1.5 md:p-3 rounded-lg bg-slate-900 text-slate-300 group-hover:text-primary-400 transition-colors">
                                        <ShoppingCart size={16} className="md:w-6 md:h-6" />
                                    </div>
                                    <ArrowLeft className="text-slate-600 group-hover:text-slate-400 transition-colors" size={16} />
                                </div>
                                <h3 className="text-sm md:text-lg font-bold text-white mb-0.5">التسوق</h3>
                                <div className="space-y-0.5 mt-1">
                                    {shoppingList.filter(i => !i.purchased).slice(-2).reverse().map(item => (
                                        <div key={item.id} className="text-[9px] text-slate-400 truncate flex items-center gap-1">
                                            <div className="w-1 h-1 rounded-full bg-orange-500"></div>
                                            {item.name}
                                        </div>
                                    ))}
                                    {shoppingList.filter(i => !i.purchased).length === 0 && <span className="text-[9px] text-slate-500">القائمة فارغة</span>}
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* 5. Map Widget (Full Width, Large) */}
                    <div className="w-full min-h-[400px] lg:min-h-[500px]">
                        <DashboardMapWidget />
                    </div>

                </div>
                {/* Export Modal */}
                {showExportModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-slate-700 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                            <h3 className="text-lg font-bold text-white mb-4 text-center">تصدير التقويم</h3>

                            <div className="space-y-3 mb-6">
                                <label className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl cursor-pointer hover:bg-slate-700/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={exportSettings.includePrayers}
                                        onChange={(e) => setExportSettings({ ...exportSettings, includePrayers: e.target.checked })}
                                        className="w-5 h-5 rounded border-slate-600 text-primary-500 focus:ring-primary-500 bg-slate-700"
                                    />
                                    <span className="text-slate-200">أوقات الصلاة</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl cursor-pointer hover:bg-slate-700/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={exportSettings.includeTasks}
                                        onChange={(e) => setExportSettings({ ...exportSettings, includeTasks: e.target.checked })}
                                        className="w-5 h-5 rounded border-slate-600 text-blue-500 focus:ring-blue-500 bg-slate-700"
                                    />
                                    <span className="text-slate-200">المهام</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl cursor-pointer hover:bg-slate-700/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={exportSettings.includeAppointments}
                                        onChange={(e) => setExportSettings({ ...exportSettings, includeAppointments: e.target.checked })}
                                        className="w-5 h-5 rounded border-slate-600 text-purple-500 focus:ring-purple-500 bg-slate-700"
                                    />
                                    <span className="text-slate-200">المواعيد</span>
                                </label>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleExportConfirm}
                                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2.5 rounded-xl font-bold transition-colors"
                                >
                                    تصدير
                                </button>
                                <button
                                    onClick={() => setShowExportModal(false)}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 py-2.5 rounded-xl font-bold transition-colors"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
