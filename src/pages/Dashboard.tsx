import { useEffect } from 'react';
import {
    MapPin, Wallet, CheckSquare, ShoppingCart, Target, ArrowLeft,
    Calendar, ArrowRight, Settings
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
    const { savedLocations } = useMasariStore();

    // Synchronized Prayer Times
    const { nextPrayer, currentPrayer, timeRemaining, prayers } = usePrayerSync();

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


    // Greeting based on time
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء النور';

    const handleShareCalendar = () => {
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
            [todayPrayerTime],
            settings.prayerSettings || {
                selectedPrayers: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
                notifyAtAdhan: true,
                notifyBeforeAdhan: true,
                minutesBeforeAdhan: 15
            },
            tasks,
            appointments
        );

        if (icsContent) {
            downloadICS(icsContent, `my-calendar-${new Date().toISOString().split('T')[0]}.ics`);
        } else {
            alert('حدث خطأ أثناء إنشاء ملف التقويم');
        }
    };

    return (
        <div className="pb-24 min-h-screen bg-slate-900 text-slate-100 font-cairo">
            <DashboardTicker />

            <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                            {greeting}, {user?.name || 'مرحباً بك'} 👋
                        </h1>
                        <p className="text-slate-400 text-sm md:text-base">
                            {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={handleShareCalendar}
                            className="flex-1 md:flex-none p-3 bg-slate-800 rounded-xl text-slate-400 hover:text-white border border-slate-700 hover:border-primary-500 transition-all flex justify-center"
                            title="مشاركة التقويم"
                        >
                            <Calendar size={20} />
                        </button>
                        <button
                            onClick={() => onNavigate('settings')}
                            className="flex-1 md:flex-none p-3 bg-slate-800 rounded-xl text-slate-400 hover:text-white border border-slate-700 hover:border-primary-500 transition-all flex justify-center"
                        >
                            <Settings size={20} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Main Column (2/3) */}
                    <div className="lg:col-span-2 space-y-4 md:space-y-6">

                        {/* Prayer Times Widget */}
                        {settings.widgetVisibility?.nextPrayer && (
                            <section className="bg-slate-800 rounded-3xl p-4 md:p-6 border border-slate-700 relative overflow-hidden">
                                <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
                                <div className="relative z-10">
                                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 mb-6 md:mb-8">
                                        <div className="text-center md:text-right w-full md:w-auto">
                                            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">مواقيت الصلاة</h2>
                                            <p className="text-slate-400 text-xs md:text-sm">
                                                {new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}
                                            </p>
                                        </div>
                                        <div className="flex gap-4 w-full md:w-auto justify-center">
                                            {nextPrayer && (
                                                <div className="bg-primary-900/30 border border-primary-500/30 rounded-2xl p-3 text-center min-w-[120px] w-full md:w-auto">
                                                    <p className="text-xs text-primary-300 mb-1">متبقي لـ {nextPrayer.arabicName}</p>
                                                    <p className="text-xl font-mono font-bold text-white" dir="ltr">-{timeRemaining}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
                                        {Array.isArray(prayers) && prayers.map((prayer) => {
                                            const isNext = nextPrayer?.name === prayer.name;
                                            const isCurrent = currentPrayer?.name === prayer.name;
                                            return (
                                                <div key={prayer.name} className={`relative rounded-xl p-2 md:p-3 text-center transition-all ${isNext ? 'bg-primary-600 text-white shadow-lg scale-105 z-10' : isCurrent ? 'bg-slate-700 border border-slate-600 text-white' : 'bg-slate-800/50 text-slate-400'}`}>
                                                    <div className="text-xs md:text-sm font-medium mb-1">{prayer.arabicName}</div>
                                                    <div className="text-sm md:text-lg font-mono" dir="ltr">{prayer.time}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Recent Activity Feed */}
                        <RecentActivity />

                    </div>

                    {/* Sidebar Column (1/3) */}
                    <div className="space-y-4 md:space-y-6">
                        {/* Tasks Summary */}
                        <section className="bg-slate-800 rounded-3xl p-4 md:p-6 border border-slate-700">
                            <div className="flex justify-between items-center mb-4 md:mb-6">
                                <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                                    <CheckSquare className="text-blue-400" size={20} />
                                    مهامي
                                </h2>
                                <button onClick={() => onNavigate('tasks')} className="text-slate-400 hover:text-white">
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                            <div className="space-y-3">
                                {todayTasks.slice(0, 3).map(task => (
                                    <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                                        <span className="text-sm text-white truncate flex-1">{task.title}</span>
                                    </div>
                                ))}
                                {todayTasks.length === 0 && <div className="text-slate-500 text-center py-4">لا توجد مهام اليوم</div>}
                            </div>
                        </section>

                        {/* Finance Summary */}
                        <section className="bg-slate-800 rounded-3xl p-4 md:p-6 border border-slate-700">
                            <div className="flex justify-between items-center mb-4 md:mb-6">
                                <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                                    <Wallet className="text-green-400" size={20} />
                                    المالية
                                </h2>
                                <button onClick={() => onNavigate('budget')} className="text-slate-400 hover:text-white">
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                            <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                                <div className="text-sm text-slate-400 mb-1">الرصيد الحالي</div>
                                <div className={`text-2xl md:text-3xl font-bold ${budget.currentBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    ${budget.currentBalance.toFixed(0)}
                                </div>
                            </div>
                        </section>

                        {/* Development Summary */}
                        <section className="bg-slate-800 rounded-3xl p-4 md:p-6 border border-slate-700">
                            <div className="flex justify-between items-center mb-4 md:mb-6">
                                <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                                    <Target className="text-yellow-400" size={20} />
                                    تطوير
                                </h2>
                                <button onClick={() => onNavigate('development')} className="text-slate-400 hover:text-white">
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                            <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                                <div className="text-sm text-slate-400 mb-1">القراءة الحالية</div>
                                <div className="font-bold text-white">{activeReading?.bookName || 'لا يوجد'}</div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Quick Actions & Map Grid (Full Width Bottom Section) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    {/* Quick Actions (Right in RTL) */}
                    {/* Quick Actions (Right in RTL) */}
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                        {/* Masari Card */}
                        <button
                            onClick={() => onNavigate('masari')}
                            className="bg-slate-800 p-3 md:p-4 rounded-2xl border border-slate-700 hover:border-slate-600 transition-all text-right group hover:bg-slate-750 flex flex-col justify-between min-h-[160px]"
                        >
                            <div className="w-full">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-2 md:p-3 rounded-xl bg-slate-900 text-slate-300 group-hover:text-primary-400 transition-colors">
                                        <MapPin size={20} className="md:w-6 md:h-6" />
                                    </div>
                                    <ArrowLeft className="text-slate-600 group-hover:text-slate-400 transition-colors" size={18} />
                                </div>
                                <h3 className="text-base md:text-lg font-bold text-white mb-1">مساري</h3>
                                <div className="space-y-1 mt-2">
                                    {savedLocations.slice(-2).reverse().map(loc => (
                                        <div key={loc.id} className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                                            <div className="w-1 h-1 rounded-full bg-purple-500"></div>
                                            {loc.name}
                                        </div>
                                    ))}
                                    {savedLocations.length === 0 && <span className="text-[10px] text-slate-500">لا توجد مواقع محفوظة</span>}
                                </div>
                            </div>
                        </button>

                        {/* Finance Card */}
                        <button
                            onClick={() => onNavigate('budget')}
                            className="bg-slate-800 p-3 md:p-4 rounded-2xl border border-slate-700 hover:border-slate-600 transition-all text-right group hover:bg-slate-750 flex flex-col justify-between min-h-[160px]"
                        >
                            <div className="w-full">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-2 md:p-3 rounded-xl bg-slate-900 text-slate-300 group-hover:text-primary-400 transition-colors">
                                        <Wallet size={20} className="md:w-6 md:h-6" />
                                    </div>
                                    <ArrowLeft className="text-slate-600 group-hover:text-slate-400 transition-colors" size={18} />
                                </div>
                                <h3 className="text-base md:text-lg font-bold text-white mb-1">المالية</h3>
                                <div className="space-y-1 mt-2">
                                    {/* Combine incomes and expenses, sort by date, take last 2 */}
                                    {(() => {
                                        const { incomes, expenses } = useFinanceStore.getState();
                                        const allTrans = [
                                            ...incomes.map(i => ({ ...i, type: 'income' })),
                                            ...expenses.map(e => ({ ...e, type: 'expense' }))
                                        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 2);

                                        if (allTrans.length === 0) return <span className="text-[10px] text-slate-500">لا توجد معاملات</span>;

                                        return allTrans.map(t => (
                                            <div key={t.id} className="text-[10px] text-slate-400 truncate flex items-center gap-1">
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
                            className="bg-slate-800 p-3 md:p-4 rounded-2xl border border-slate-700 hover:border-slate-600 transition-all text-right group hover:bg-slate-750 flex flex-col justify-between min-h-[160px]"
                        >
                            <div className="w-full">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-2 md:p-3 rounded-xl bg-slate-900 text-slate-300 group-hover:text-primary-400 transition-colors">
                                        <CheckSquare size={20} className="md:w-6 md:h-6" />
                                    </div>
                                    <ArrowLeft className="text-slate-600 group-hover:text-slate-400 transition-colors" size={18} />
                                </div>
                                <h3 className="text-base md:text-lg font-bold text-white mb-1">مهامي</h3>
                                <div className="space-y-1 mt-2">
                                    {tasks.filter(t => !t.completed).slice(0, 2).map(task => (
                                        <div key={task.id} className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                                            <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                                            {task.title}
                                        </div>
                                    ))}
                                    {tasks.filter(t => !t.completed).length === 0 && <span className="text-[10px] text-slate-500">لا توجد مهام نشطة</span>}
                                </div>
                            </div>
                        </button>

                        {/* Shopping Card */}
                        <button
                            onClick={() => onNavigate('shopping')}
                            className="bg-slate-800 p-3 md:p-4 rounded-2xl border border-slate-700 hover:border-slate-600 transition-all text-right group hover:bg-slate-750 flex flex-col justify-between min-h-[160px]"
                        >
                            <div className="w-full">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-2 md:p-3 rounded-xl bg-slate-900 text-slate-300 group-hover:text-primary-400 transition-colors">
                                        <ShoppingCart size={20} className="md:w-6 md:h-6" />
                                    </div>
                                    <ArrowLeft className="text-slate-600 group-hover:text-slate-400 transition-colors" size={18} />
                                </div>
                                <h3 className="text-base md:text-lg font-bold text-white mb-1">التسوق</h3>
                                <div className="space-y-1 mt-2">
                                    {shoppingList.filter(i => !i.purchased).slice(-2).reverse().map(item => (
                                        <div key={item.id} className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                                            <div className="w-1 h-1 rounded-full bg-orange-500"></div>
                                            {item.name}
                                        </div>
                                    ))}
                                    {shoppingList.filter(i => !i.purchased).length === 0 && <span className="text-[10px] text-slate-500">القائمة فارغة</span>}
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Map Widget (Left in RTL) */}
                    <div className="h-full min-h-[300px] md:min-h-[400px]">
                        <DashboardMapWidget />
                    </div>
                </div>
            </div>
        </div>
    );
}
