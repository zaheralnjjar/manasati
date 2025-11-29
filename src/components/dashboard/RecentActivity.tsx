import { useState, useMemo } from 'react';
import {
    Clock, CheckSquare, Wallet, MapPin, ShoppingCart, Target,
    Share2, Calendar
} from 'lucide-react';
import { useProductivityStore } from '../../store/useProductivityStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useMasariStore } from '../../store/useMasariStore';
import { useLifestyleStore } from '../../store/useLifestyleStore';
import { useDevelopmentStore } from '../../store/useDevelopmentStore';

export default function RecentActivity() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [refresh, setRefresh] = useState(0);

    // Use stores
    const { tasks, appointments } = useProductivityStore();
    const { expenses, incomes } = useFinanceStore();
    const { savedLocations } = useMasariStore();
    const { shoppingList } = useLifestyleStore();
    const { goals } = useDevelopmentStore();

    const activities = useMemo(() => {
        const allItems: any[] = [];

        // Tasks
        tasks.forEach(t => allItems.push({ ...t, type: 'task', date: t.createdAt || t.date }));

        // Appointments
        appointments.forEach(a => allItems.push({ ...a, type: 'appointment', date: a.date + 'T' + a.time }));

        // Transactions
        [...expenses, ...incomes].forEach(t => allItems.push({ ...t, type: 'finance', date: t.date }));

        // Locations
        savedLocations.forEach(l => allItems.push({ ...l, type: 'masari', date: new Date(l.savedAt).toISOString() }));

        // Shopping
        shoppingList.forEach(s => allItems.push({ ...s, type: 'shopping', date: s.addedDate }));

        // Development
        goals.forEach(d => allItems.push({ ...d, type: 'development', date: d.createdAt }));

        // Sort by date desc
        return allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);
    }, [tasks, appointments, expenses, incomes, savedLocations, shoppingList, goals, refresh]);

    const handleShare = async (item: any) => {
        let text = '';
        if (item.type === 'task') text = `مهمة: ${item.title}`;
        if (item.type === 'appointment') text = `موعد: ${item.title} - ${item.time}`;
        if (item.type === 'finance') text = `معاملة: $${item.amount} - ${item.description}`;
        if (item.type === 'masari') text = `موقع: ${item.name} https://maps.google.com/?q=${item.lat},${item.lng}`;
        if (item.type === 'shopping') text = `تسوق: ${item.name}`;
        if (item.type === 'development') text = `هدف: ${item.title}`;

        if (navigator.share) {
            try { await navigator.share({ title: 'مشاركة', text }); } catch (e) { }
        } else {
            navigator.clipboard.writeText(text);
            alert('تم النسخ للحافظة');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'task': return <CheckSquare size={16} className="text-blue-400" />;
            case 'appointment': return <Calendar size={16} className="text-purple-400" />;
            case 'finance': return <Wallet size={16} className="text-green-400" />;
            case 'masari': return <MapPin size={16} className="text-purple-400" />;
            case 'shopping': return <ShoppingCart size={16} className="text-orange-400" />;
            case 'development': return <Target size={16} className="text-yellow-400" />;
            default: return <Clock size={16} />;
        }
    };

    const getLabel = (type: string) => {
        switch (type) {
            case 'task': return 'مهمة';
            case 'appointment': return 'موعد';
            case 'finance': return 'مالية';
            case 'masari': return 'موقع';
            case 'shopping': return 'تسوق';
            case 'development': return 'تطوير';
            default: return 'نشاط';
        }
    };

    return (
        <div className="bg-slate-800 rounded-2xl p-2 md:p-4 border border-slate-700/50 flex flex-col transition-all duration-300 h-full">
            <div
                className="flex justify-between items-center cursor-pointer mb-2"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <h2 className="text-sm md:text-lg font-bold text-white flex items-center gap-2">
                        <Clock className="text-primary-400" size={16} />
                        النشاط الحديث
                    </h2>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); setRefresh(r => r + 1); }}
                    className="text-slate-400 hover:text-white text-[10px] bg-slate-700/50 px-2 py-1 rounded transition-colors"
                >
                    تحديث
                </button>
            </div>

            <div className={`space-y-1 overflow-y-auto custom-scrollbar flex-1 pr-1 ${isExpanded ? 'max-h-[500px]' : 'max-h-[150px]'} transition-all duration-300`}>
                {activities.length === 0 ? (
                    <div className="text-center text-slate-500 py-4 text-xs">لا يوجد نشاط حديث</div>
                ) : (
                    activities.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-1.5 bg-slate-700/20 rounded-lg hover:bg-slate-700/40 transition-colors group border border-transparent hover:border-slate-700/50">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <div className="p-1 bg-slate-800 rounded-md shrink-0 text-slate-400 group-hover:text-primary-400 transition-colors">
                                    {getIcon(item.type)}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-medium text-white text-xs truncate">
                                        {item.title || item.name || item.description || 'بدون عنوان'}
                                    </div>
                                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                        <span className="bg-slate-800/50 px-1 rounded">{getLabel(item.type)}</span>
                                        <span>•</span>
                                        <span dir="ltr">
                                            {(() => {
                                                try {
                                                    const date = new Date(item.date);
                                                    return isNaN(date.getTime()) ? 'تاريخ غير صالح' : date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
                                                } catch (e) {
                                                    return 'تاريخ غير صالح';
                                                }
                                            })()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleShare(item)}
                                    className="p-1 text-slate-400 hover:text-primary-400 hover:bg-slate-600/50 rounded-md transition-colors"
                                    title="مشاركة"
                                >
                                    <Share2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Show expand button if not expanded */}
            {!isExpanded && activities.length > 3 && (
                <button
                    onClick={() => setIsExpanded(true)}
                    className="w-full mt-2 py-1 text-[10px] text-slate-400 hover:text-white bg-slate-700/30 hover:bg-slate-700/50 rounded transition-colors"
                >
                    عرض المزيد
                </button>
            )}
            {isExpanded && (
                <button
                    onClick={() => setIsExpanded(false)}
                    className="w-full mt-2 py-1 text-[10px] text-slate-400 hover:text-white bg-slate-700/30 hover:bg-slate-700/50 rounded transition-colors"
                >
                    عرض أقل
                </button>
            )}
        </div>
    );
}
