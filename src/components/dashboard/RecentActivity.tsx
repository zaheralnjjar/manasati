import { useState, useMemo } from 'react';
import {
    Clock, CheckSquare, Wallet, MapPin, ShoppingCart, Target,
    Share2
} from 'lucide-react';
import { storage } from '../../utils/storage';
import type { Task, Transaction, SavedLocation, ShoppingItem, DevelopmentGoal } from '../../types';

export default function RecentActivity() {
    const [refresh, setRefresh] = useState(0);

    const activities = useMemo(() => {
        const allItems: any[] = [];
        // Tasks
        const storedTasks = storage.get<Task[]>('tasks') || [];
        storedTasks.forEach(t => allItems.push({ ...t, type: 'task', date: t.date }));

        // Transactions
        const storedTrans = storage.get<Transaction[]>('transactions') || [];
        storedTrans.forEach(t => allItems.push({ ...t, type: 'finance', date: t.date }));

        // Locations
        const storedLocs = storage.get<SavedLocation[]>('savedLocations') || [];
        storedLocs.forEach(l => allItems.push({ ...l, type: 'masari', date: new Date(l.savedAt).toISOString() }));

        // Shopping
        const storedShop = storage.get<ShoppingItem[]>('shoppingList') || [];
        storedShop.forEach(s => allItems.push({ ...s, type: 'shopping', date: s.addedDate }));

        // Development
        const storedDev = storage.get<DevelopmentGoal[]>('developmentGoals') || [];
        storedDev.forEach(d => allItems.push({ ...d, type: 'development', date: d.createdAt }));

        // Sort by date desc
        return allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);
    }, [refresh]);

    const handleShare = async (item: any) => {
        let text = '';
        if (item.type === 'task') text = `مهمة: ${item.title}`;
        if (item.type === 'finance') text = `معاملة: ${item.amount} - ${item.description}`;
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
            case 'finance': return 'مالية';
            case 'masari': return 'موقع';
            case 'shopping': return 'تسوق';
            case 'development': return 'تطوير';
            default: return 'نشاط';
        }
    };

    return (
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700/50 flex flex-col">
            <div className="flex justify-between items-center mb-3 flex-shrink-0">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Clock className="text-primary-400" size={18} />
                    النشاط الحديث
                </h2>
                <button onClick={() => setRefresh(r => r + 1)} className="text-slate-400 hover:text-white text-xs bg-slate-700/50 px-2 py-1 rounded transition-colors">
                    تحديث
                </button>
            </div>

            <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-1 max-h-[300px]">
                {activities.length === 0 ? (
                    <div className="text-center text-slate-500 py-6 text-sm">لا يوجد نشاط حديث</div>
                ) : (
                    activities.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-700/20 rounded-lg hover:bg-slate-700/40 transition-colors group border border-transparent hover:border-slate-700/50">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-1.5 bg-slate-800 rounded-md shrink-0 text-slate-400 group-hover:text-primary-400 transition-colors">
                                    {getIcon(item.type)}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-medium text-white text-sm truncate">
                                        {item.title || item.name || item.description || 'بدون عنوان'}
                                    </div>
                                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                                        <span className="bg-slate-800/50 px-1.5 rounded">{getLabel(item.type)}</span>
                                        <span>•</span>
                                        <span dir="ltr">{new Date(item.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleShare(item)}
                                    className="p-1.5 text-slate-400 hover:text-primary-400 hover:bg-slate-600/50 rounded-md transition-colors"
                                    title="مشاركة"
                                >
                                    <Share2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
