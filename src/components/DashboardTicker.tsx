import { useState, useEffect } from 'react';
import { Quote, CheckSquare, Wallet, Moon, Calendar, MapPin, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { useProductivityStore } from '../store/useProductivityStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { useMasariStore } from '../store/useMasariStore';
import { usePrayerSync } from '../hooks/usePrayerSync';
import { storage } from '../utils/storage';

const AZKAR_SAMPLES = [
    "سبحان الله وبحمده",
    "أستغفر الله العظيم وأتوب إليه",
    "لا حول ولا قوة إلا بالله",
    "اللهم صل وسلم على نبينا محمد",
    "الحمد لله رب العالمين",
    "لا إله إلا الله وحده لا شريك له",
    "سبحان الله العظيم وبحمده",
    "حسبي الله ونعم الوكيل"
];

export default function DashboardTicker() {
    const { settings } = useAppStore();
    const { tasks, appointments } = useProductivityStore();
    const { getBudgetSummary } = useFinanceStore();
    const { savedLocations } = useMasariStore();

    // Synchronized Prayer Times
    const { nextPrayer, timeRemaining } = usePrayerSync();

    const [items, setItems] = useState<any[]>([]);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const [dollarRate, setDollarRate] = useState<{ compra: number; venta: number; fecha: string } | null>(null);

    // Fetch Dollar Rate
    useEffect(() => {
        const fetchDollar = async () => {
            try {
                const response = await fetch('https://dolarapi.com/v1/dolares/oficial');
                const data = await response.json();
                setDollarRate({
                    compra: data.compra,
                    venta: data.venta,
                    fecha: data.fechaActualizacion
                });
            } catch (error) {
                console.error('Error fetching dollar rate:', error);
            }
        };

        fetchDollar();
        const interval = setInterval(fetchDollar, 30 * 60 * 1000); // Update every 30 minutes

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const newItems: any[] = [];

        // 0. Dollar Rate (Argentina)
        if (dollarRate) {
            newItems.push({
                icon: Wallet,
                text: `🇦🇷 الدولار الرسمي: شراء ${dollarRate.compra} - بيع ${dollarRate.venta}`,
                color: "text-green-400",
                type: 'dollar',
                data: dollarRate
            });
        }

        // 1. Next Prayer (Synchronized)
        if (nextPrayer) {
            newItems.push({
                icon: Moon,
                text: `الصلاة القادمة: ${nextPrayer.arabicName} (${nextPrayer.time}) - متبقي ${timeRemaining}`,
                color: "text-indigo-400",
                type: 'prayer',
                data: { ...nextPrayer, remaining: timeRemaining }
            });
        }

        // 2. Today's Tasks
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayTasks = tasks.filter(t => {
            if (!t.dueDate) return false;
            const dueDate = new Date(t.dueDate);
            return dueDate >= today && dueDate < tomorrow && !t.completed;
        });

        if (todayTasks.length > 0) {
            newItems.push({
                icon: CheckSquare,
                text: `مهام اليوم: ${todayTasks.length} مهمة`,
                color: 'text-blue-400',
                type: 'tasks',
                data: { count: todayTasks.length, tasks: todayTasks.slice(0, 5) }
            });
        }

        // 3. Next Appointment
        const upcomingAppointments = appointments
            .filter(a => new Date(a.date) > new Date())
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (upcomingAppointments.length > 0) {
            const next = upcomingAppointments[0];
            newItems.push({
                icon: Calendar,
                text: `موعد قادم: ${next.title}`,
                color: 'text-orange-400',
                type: 'appointment',
                data: next
            });
        }

        // 4. Budget Balance
        const budget = getBudgetSummary();
        newItems.push({
            icon: Wallet,
            text: `الرصيد: $${budget.currentBalance.toFixed(0)}`,
            color: budget.currentBalance >= 0 ? 'text-green-400' : 'text-red-400',
            type: 'budget',
            data: {
                balance: budget.currentBalance,
                income: budget.totalIncome,
                expense: budget.totalExpenses
            }
        });

        // 5. Shopping List (Urgent/Medium)
        const shoppingList = storage.get<any[]>('shoppingList') || [];
        const urgentShopping = shoppingList.filter(i => !i.purchased && i.priority === 'urgent');

        if (urgentShopping.length > 0) {
            newItems.push({
                icon: ShoppingCart,
                text: `تسوق عاجل: ${urgentShopping.length} عناصر (${urgentShopping[0].name}...)`,
                color: 'text-red-400',
                type: 'shopping',
                data: { count: urgentShopping.length, items: urgentShopping }
            });
        } else {
            const activeShopping = shoppingList.filter(i => !i.purchased);
            if (activeShopping.length > 0) {
                newItems.push({
                    icon: ShoppingCart,
                    text: `قائمة التسوق: ${activeShopping.length} عناصر`,
                    color: 'text-orange-400',
                    type: 'shopping',
                    data: { count: activeShopping.length, items: activeShopping.slice(0, 3) }
                });
            }
        }

        // 6. Saved Locations (Masari)
        if (savedLocations.length > 0) {
            const lastLocation = savedLocations[savedLocations.length - 1];
            newItems.push({
                icon: MapPin,
                text: `آخر موقع محفوظ: ${lastLocation.name}`,
                color: 'text-purple-400',
                type: 'location',
                data: lastLocation
            });
        }

        // 6. Random Athkar
        const randomZikr = AZKAR_SAMPLES[Math.floor(Math.random() * AZKAR_SAMPLES.length)];

        newItems.push({
            icon: Quote,
            text: randomZikr,
            color: 'text-emerald-400',
            type: 'zikr',
            data: { text: randomZikr }
        });

        // Interleave with more azkar
        const interleavedItems: typeof newItems = [];
        newItems.forEach((item, index) => {
            interleavedItems.push(item);

            // Add a zikr between items (but not after the last item)
            if (index < newItems.length - 1) {
                const zikr = AZKAR_SAMPLES[Math.floor(Math.random() * AZKAR_SAMPLES.length)];

                interleavedItems.push({
                    icon: Quote,
                    text: zikr,
                    color: 'text-emerald-400/50',
                    type: 'zikr',
                    data: { text: zikr }
                });
            }
        });

        setItems(interleavedItems);
    }, [tasks, appointments, nextPrayer, timeRemaining, savedLocations, dollarRate]); // Re-run when synchronized data changes

    // Auto-close details after 3 seconds
    useEffect(() => {
        if (selectedItem) {
            const timer = setTimeout(() => {
                setSelectedItem(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [selectedItem]);

    if (items.length === 0) return null;

    return (
        <>
            <div
                className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 py-3 mb-6 overflow-hidden relative h-12 shadow-lg group"
            >
                <div
                    className="flex gap-12 items-center absolute h-full w-max group-hover:[animation-play-state:paused]"
                    style={{
                        animation: `marquee ${settings.tickerSpeed || 40}s linear infinite`,
                        direction: 'ltr' // Force LTR for physical scrolling
                    }}
                >
                    <style>{`
                        @keyframes marquee {
                            0% { transform: translateX(0); }
                            100% { transform: translateX(-50%); }
                        }
                    `}</style>
                    {[...items, ...items, ...items].map((item, idx) => {
                        const Icon = item.icon;
                        if (!Icon) return null;
                        return (
                            <button
                                key={idx}
                                onClick={() => setSelectedItem(item)}
                                className={`flex items-center gap-3 font-bold text-sm ${item.color} hover:scale-110 transition-transform cursor-pointer`}
                            >
                                <Icon size={18} />
                                <span>{item.text}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Modal / Popup */}
            <AnimatePresence>
                {selectedItem && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-sm px-4"
                    >
                        <div className="bg-slate-800/95 backdrop-blur-md rounded-2xl p-6 border border-slate-700 shadow-2xl">
                            <div className={`flex items-center gap-3 mb-3 ${selectedItem.color}`}>
                                <selectedItem.icon size={24} />
                                <h3 className="text-lg font-bold text-white">تفاصيل</h3>
                            </div>

                            <div className="space-y-2 text-slate-300 text-sm">
                                {selectedItem.type === 'prayer' && (
                                    <div>
                                        <p className="text-white">
                                            الصلاة القادمة: <span className="font-bold text-indigo-400">{selectedItem.data.arabicName}</span>
                                        </p>
                                        <p>الوقت: {selectedItem.data.time}</p>
                                        <p>المتبقي: {selectedItem.data.remaining}</p>
                                    </div>
                                )}

                                {selectedItem.type === 'tasks' && (
                                    <div>
                                        <p className="mb-2">مهام اليوم: <span className="font-bold text-white">{selectedItem.data.count}</span></p>
                                        {selectedItem.data.tasks.length > 0 && (
                                            <ul className="list-disc list-inside space-y-1 text-xs">
                                                {selectedItem.data.tasks.map((t: any) => (
                                                    <li key={t.id} className="truncate">{t.title}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}

                                {selectedItem.type === 'budget' && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-slate-700/50 p-2 rounded">
                                            <span className="text-[10px] text-slate-400 block">الرصيد</span>
                                            <span className={`font-bold ${selectedItem.data.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                ${selectedItem.data.balance.toFixed(0)}
                                            </span>
                                        </div>
                                        <div className="bg-slate-700/50 p-2 rounded">
                                            <span className="text-[10px] text-slate-400 block">الدخل</span>
                                            <span className="text-green-400 font-bold">{selectedItem.data.income.toFixed(0)}</span>
                                        </div>
                                    </div>
                                )}

                                {selectedItem.type === 'location' && (
                                    <div>
                                        <p className="text-white mb-1">📍 {selectedItem.data.name}</p>
                                        <p className="text-xs text-slate-500">
                                            {new Date(selectedItem.data.savedAt).toLocaleTimeString('ar-SA')}
                                        </p>
                                    </div>
                                )}

                                {(selectedItem.type === 'zikr' || selectedItem.type === 'appointment') && (
                                    <p className="text-center font-medium leading-relaxed">
                                        {selectedItem.type === 'zikr'
                                            ? selectedItem.data.text
                                            : `📅 ${selectedItem.data.title}`
                                        }
                                    </p>
                                )}

                                {selectedItem.type === 'shopping' && (
                                    <div>
                                        <p className="mb-2">عناصر التسوق: <span className="font-bold text-white">{selectedItem.data.count}</span></p>
                                        <ul className="list-disc list-inside space-y-1 text-xs">
                                            {selectedItem.data.items.map((i: any) => (
                                                <li key={i.id} className="truncate flex justify-between">
                                                    <span>{i.name}</span>
                                                    {i.priority === 'urgent' && <span className="text-red-400 text-[10px]">(عاجل)</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {selectedItem.type === 'dollar' && (
                                    <div className="flex justify-around text-center">
                                        <div>
                                            <span className="text-xs text-slate-400 block">شراء</span>
                                            <span className="font-bold text-green-400">${selectedItem.data.compra}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-400 block">بيع</span>
                                            <span className="font-bold text-green-400">${selectedItem.data.venta}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Progress bar for auto-close */}
                            <motion.div
                                initial={{ width: "100%" }}
                                animate={{ width: "0%" }}
                                transition={{ duration: 3, ease: "linear" }}
                                className="h-1 bg-primary-500/50 mt-4 rounded-full"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
