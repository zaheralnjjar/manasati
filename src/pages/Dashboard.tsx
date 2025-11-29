import React, { useState, useEffect } from 'react';
import {
    Settings,
    MapPin,
    Wallet,
    BookOpen,
    LogOut,
    User,
    ChevronDown,
    ChevronUp,
    ArrowLeft,
    Target,
    ShoppingCart,
    CheckSquare
} from 'lucide-react';
import { useProductivityStore } from '../store/useProductivityStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { useLifestyleStore } from '../store/useLifestyleStore';
import { useMasariStore } from '../store/useMasariStore';
import { useDevelopmentStore } from '../store/useDevelopmentStore';
import { useAppStore } from '../store/useAppStore';
import RecentActivity from '../components/dashboard/RecentActivity';
import QuickLogin from '../components/auth/QuickLogin';
import DashboardTicker from '../components/DashboardTicker';
import DashboardMapWidget from '../components/dashboard/DashboardMapWidget';
import { supabase } from '../services/supabase';
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
    const { goals: developmentGoals, initialize: initDevelopment } = useDevelopmentStore();
    const { shoppingList, initialize: initLifestyle } = useLifestyleStore();
    const { savedLocations, currentLocation, updateLocation } = useMasariStore();

    // Synchronized Prayer Times
    const { nextPrayer, currentPrayer, timeRemaining, timeSince, prayers } = usePrayerSync();

    // Initialize stores on mount
    useEffect(() => {
        initProductivity();
        initFinance();
        initDevelopment();
        initLifestyle();
    }, []);

    // Auto-detect location once when Dashboard loads
    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    updateLocation({
                        id: Date.now().toString() + Math.random().toString(36).substring(2),
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        timestamp: Date.now(),
                        speed: position.coords.speed || 0,
                        heading: position.coords.heading || 0
                    });
                },
                (error) => {
                    console.error('Error getting location:', error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        }
    }, []); // Run once on mount

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

    const todayAppointments = appointments.filter(a => {
        const apptDate = new Date(a.date);
        return apptDate >= today && apptDate < tomorrow;
    });

    const activeReading = developmentGoals.find(g => g.status === 'active');
    const readingGoals = developmentGoals.filter(g => g.type === 'book' && g.status === 'active');

    // Collapsible State
    const [isTasksExpanded, setIsTasksExpanded] = useState(false);
    const [isAppointmentsExpanded, setIsAppointmentsExpanded] = useState(true);
    const [isFinanceExpanded, setIsFinanceExpanded] = useState(false);
    const [isDevExpanded, setIsDevExpanded] = useState(false);
    const [showLoginDropdown, setShowLoginDropdown] = useState(false);

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
        // Note: 'format' and 'isPast' are not defined in this snippet.
        // Assuming 'PrayerTime' type is defined elsewhere or globally available.
        const todayPrayerTime: PrayerTime = {
            date: new Date().toISOString().split('T')[0], // Keeping original date format for consistency, as 'format' is not imported.
            fajr: prayers.find(p => p.name === 'fajr')?.time || '',
            sunrise: prayers.find(p => p.name === 'sunrise')?.time || '',
            dhuhr: prayers.find(p => p.name === 'dhuhr')?.time || '',
            asr: prayers.find(p => p.name === 'asr')?.time || '',
            maghrib: prayers.find(p => p.name === 'maghrib')?.time || '',
            isha: prayers.find(p => p.name === 'isha')?.time || '',
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
            downloadICS(icsContent, `my - calendar - ${new Date().toISOString().split('T')[0]}.ics`);
            setShowExportModal(false);
        } else {
            alert('حدث خطأ أثناء إنشاء ملف التقويم');
        }
    };

    // Address State
    const [currentAddress, setCurrentAddress] = useState<string>('');

    // Fetch address when location changes
    useEffect(() => {
        const fetchAddress = async () => {
            if (!currentLocation) return;
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLocation.lat}&lon=${currentLocation.lng}&accept-language=ar`);
                const data = await response.json();
                if (data.address) {
                    const { road, pedestrian, house_number, suburb, neighbourhood, city, town, village } = data.address;

                    // Prioritize: Street Name + Number
                    const street = road || pedestrian;
                    const number = house_number;
                    const area = suburb || neighbourhood || city || town || village;

                    const parts = [];
                    if (street) parts.push(street);
                    if (number) parts.push(number);

                    // If no street, use area
                    if (!street && area) parts.push(area);

                    setCurrentAddress(parts.join(' ') || 'موقع غير معروف');
                }
            } catch (error) {
                console.error('Error fetching address:', error);
            }
        };

        fetchAddress();
    }, [currentLocation]);

    return (
        <div className="pb-24 min-h-screen bg-slate-900 text-slate-100 font-cairo">
            <DashboardTicker />

            <div className="p-0 max-w-7xl mx-auto space-y-1">
                {/* Header - Split: Right (Greeting+Date) | Left (Location+Settings) */}
                <div className="flex justify-between items-start gap-2 mb-1 md:mb-6">
                    {/* Right Side: Greeting + Date */}
                    <div className="flex-1">
                        <h1 className="text-lg md:text-3xl font-bold text-white mb-1">
                            {greeting}
                        </h1>
                        <p className="text-base md:text-xl text-slate-200 font-medium mb-2">
                            مرحبا بك يا {user?.name || 'ضيف'}
                        </p>
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
                        <div className="flex items-center gap-2">
                            <div className="text-xs md:text-sm text-slate-400 flex items-center gap-1">
                                <span className="truncate max-w-[150px] md:max-w-xs" dir="rtl">
                                    {currentAddress || (currentLocation ? `${currentLocation.lat.toFixed(2)}, ${currentLocation.lng.toFixed(2)}` : 'جاري تحديد الموقع...')}
                                </span>
                                <MapPin size={14} className="text-primary-400" />
                            </div>

                            {/* User/Guest Profile & Settings */}
                            <div className="flex items-center gap-2 mr-2 relative">
                                <button
                                    onClick={() => onNavigate('settings')}
                                    className="p-1.5 bg-slate-800 rounded-xl text-slate-400 hover:text-white border border-slate-700 hover:border-primary-500 transition-all"
                                    title="الإعدادات"
                                >
                                    <Settings size={16} />
                                </button>

                                <div
                                    className="flex items-center gap-2 bg-slate-800 rounded-xl p-1 pr-3 border border-slate-700 cursor-pointer hover:border-primary-500/50 transition-colors"
                                    onClick={() => setShowLoginDropdown(!showLoginDropdown)}
                                >
                                    <div className="text-xs text-slate-300 font-medium">
                                        {user?.email ? 'مستخدم' : 'تسجيل الدخول'}
                                    </div>
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${user?.email ? 'bg-primary-500/20 text-primary-400' : 'bg-slate-700 text-slate-400'}`}>
                                        {user?.email ? <div className="w-2 h-2 rounded-full bg-primary-500"></div> : <div className="w-2 h-2 rounded-full bg-slate-500"></div>}
                                    </div>
                                </div>

                                {/* Quick Login / User Menu Dropdown */}
                                {showLoginDropdown && (
                                    user?.email ? (
                                        <div className="absolute top-full left-0 mt-2 w-48 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="px-2 py-1.5 border-b border-slate-700/50 mb-1">
                                                <p className="text-[10px] text-slate-400">مسجل الدخول كـ</p>
                                                <p className="text-xs text-white font-medium truncate">{user.email}</p>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    await import('../services/supabase').then(m => m.supabase.auth.signOut());
                                                    setShowLoginDropdown(false);
                                                }}
                                                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <LogOut size={14} />
                                                <span>تسجيل الخروج</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <QuickLogin onClose={() => setShowLoginDropdown(false)} />
                                    )
                                )}
                            </div>
                        </div>
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

                    {/* 2. Main Grid: Recent Activity, Finance, Development */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">

                        {/* Recent Activity */}
                        <div className="md:col-span-1 h-full">
                            <RecentActivity />
                        </div>

                        {/* Finance Summary */}
                        <div className="bg-slate-800 rounded-2xl p-2 md:p-4 border border-slate-700/50 flex flex-col h-full">
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

                            <div className={`space-y-2 ${isFinanceExpanded ? '' : 'flex-1'}`}>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-slate-700/30 p-2 rounded-xl border border-slate-700/30">
                                        <p className="text-slate-400 text-[10px] mb-1">المصروفات</p>
                                        <p className="text-sm font-bold text-white font-mono">
                                            {budget.totalExpenses.toLocaleString()} <span className="text-[10px] text-green-500">$</span>
                                        </p>
                                    </div>
                                    <div className="bg-slate-700/30 p-2 rounded-xl border border-slate-700/30">
                                        <p className="text-slate-400 text-[10px] mb-1">الرصيد</p>
                                        <p className="text-sm font-bold text-white font-mono">
                                            {budget.currentBalance.toLocaleString()} <span className="text-[10px] text-green-500">$</span>
                                        </p>
                                    </div>
                                </div>
                                {isFinanceExpanded && (
                                    <button
                                        onClick={() => onNavigate('budget')}
                                        className="w-full py-1.5 text-xs text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors flex items-center justify-center gap-1 mt-2"
                                    >
                                        <span>تفاصيل الميزانية</span>
                                        <ArrowLeft size={12} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Development Summary */}
                        <div className="bg-slate-800 rounded-2xl p-2 md:p-4 border border-slate-700/50 flex flex-col h-full">
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

                            <div className={`space-y-2 ${isDevExpanded ? '' : 'flex-1'}`}>
                                {readingGoals.length > 0 ? (
                                    <div className="bg-slate-700/30 p-2 rounded-xl border border-slate-700/30">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs text-white truncate max-w-[120px]">{readingGoals[0].bookName}</span>
                                            <span className="text-[10px] text-slate-400">{readingGoals[0].currentPage || 0}/{readingGoals[0].totalPages || 0}</span>
                                        </div>
                                        <div className="w-full bg-slate-700 rounded-full h-1.5">
                                            <div
                                                className="bg-yellow-500 h-1.5 rounded-full transition-all"
                                                style={{ width: `${Math.min(100, ((readingGoals[0].currentPage || 0) / (readingGoals[0].totalPages || 1)) * 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-center text-slate-500 py-2 text-xs">لا يوجد أهداف حالية</p>
                                )}
                                {isDevExpanded && (
                                    <button
                                        onClick={() => onNavigate('development')}
                                        className="w-full py-1.5 text-xs text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-lg transition-colors flex items-center justify-center gap-1 mt-2"
                                    >
                                        <span>خطتي التطويرية</span>
                                        <ArrowLeft size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
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
