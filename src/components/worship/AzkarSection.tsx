import { useState, useEffect } from 'react';
import { Plus, Trash2, Repeat, BookOpen, Moon, Sun, Coffee, CheckSquare, Edit2, X } from 'lucide-react';
import { storage } from '../../utils/storage';
import { addTaskToSystem } from '../../utils/taskHelper';
import type { AzkarItem } from '../../types';

const PREDEFINED_AZKAR: Omit<AzkarItem, 'id' | 'currentCount' | 'isDaily'>[] = [
    { text: 'سبحان الله وبحمده', category: 'morning', targetCount: 100 },
    { text: 'أستغفر الله العظيم وأتوب إليه', category: 'morning', targetCount: 100 },
    { text: 'اللهم صل وسلم على نبينا محمد', category: 'evening', targetCount: 10 },
    { text: 'لا إله إلا الله وحده لا شريك له', category: 'morning', targetCount: 100 },
    { text: 'سبحان الله', category: 'mosque', targetCount: 33 },
    { text: 'الحمد لله', category: 'mosque', targetCount: 33 },
    { text: 'الله أكبر', category: 'mosque', targetCount: 33 },
];

export default function AzkarSection() {
    const [azkarList, setAzkarList] = useState<AzkarItem[]>([]);
    const [activeAzkar, setActiveAzkar] = useState<AzkarItem | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingAzkar, setEditingAzkar] = useState<AzkarItem | null>(null);

    // Form State
    const [newAzkarText, setNewAzkarText] = useState('');
    const [newAzkarCount, setNewAzkarCount] = useState(33);
    const [isDaily, setIsDaily] = useState(false);

    // Load Azkar from storage or initialize
    useEffect(() => {
        const saved = storage.get<AzkarItem[]>('azkarList');
        if (saved && saved.length > 0) {
            setAzkarList(saved);
        } else {
            // Initialize with some predefined Azkar
            const initial: AzkarItem[] = PREDEFINED_AZKAR.map(a => ({
                ...a,
                id: crypto.randomUUID(),
                currentCount: 0,
                isDaily: false // Default to false for predefined unless specified
            }));
            setAzkarList(initial);
        }
    }, []);

    // Save to storage
    useEffect(() => {
        if (azkarList.length > 0) {
            storage.set('azkarList', azkarList);
        }
    }, [azkarList]);

    const handleAddOrUpdateAzkar = () => {
        if (!newAzkarText) return;

        if (editingAzkar) {
            // Update existing
            const updatedList = azkarList.map(a =>
                a.id === editingAzkar.id
                    ? { ...a, text: newAzkarText, targetCount: newAzkarCount, isDaily: isDaily }
                    : a
            );
            setAzkarList(updatedList);
            setEditingAzkar(null);
        } else {
            // Add new
            const newItem: AzkarItem = {
                id: crypto.randomUUID(),
                text: newAzkarText,
                targetCount: newAzkarCount,
                currentCount: 0,
                category: 'custom',
                isDaily: isDaily
            };
            setAzkarList([...azkarList, newItem]);

            // If daily, add to tasks immediately
            if (isDaily) {
                addTaskToSystem(`ذكر يومي: ${newAzkarText} (${newAzkarCount} مرة)`, {
                    recurrence: { type: 'daily', frequency: 1 }
                });
                alert('تمت إضافة الذكر وإدراجه في المهام اليومية');
            }
        }

        // Reset form
        setNewAzkarText('');
        setNewAzkarCount(33);
        setIsDaily(false);
        setShowAddForm(false);
    };

    const startEditing = (azkar: AzkarItem) => {
        setEditingAzkar(azkar);
        setNewAzkarText(azkar.text);
        setNewAzkarCount(azkar.targetCount);
        setIsDaily(azkar.isDaily || false);
        setShowAddForm(true);
    };

    const cancelEditing = () => {
        setEditingAzkar(null);
        setNewAzkarText('');
        setNewAzkarCount(33);
        setIsDaily(false);
        setShowAddForm(false);
    };

    const handleDeleteAzkar = (id: string) => {
        if (confirm('هل أنت متأكد من حذف هذا الذكر؟')) {
            setAzkarList(azkarList.filter(a => a.id !== id));
            if (activeAzkar?.id === id) setActiveAzkar(null);
        }
    };

    const handleCounterClick = () => {
        if (!activeAzkar) return;

        const updated = { ...activeAzkar, currentCount: activeAzkar.currentCount + 1 };
        setActiveAzkar(updated);

        setAzkarList(azkarList.map(a => a.id === updated.id ? updated : a));

        // Haptic feedback if available (mobile)
        if (navigator.vibrate) navigator.vibrate(50);
    };

    const handleResetCounter = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!activeAzkar) return;
        const updated = { ...activeAzkar, currentCount: 0 };
        setActiveAzkar(updated);
        setAzkarList(azkarList.map(a => a.id === updated.id ? updated : a));
    };

    return (
        <div className="p-0 md:p-4 max-w-4xl mx-auto">
            {/* Active Azkar (Tasbih Mode) */}
            {activeAzkar ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] bg-slate-800 rounded-2xl p-8 mb-8 relative overflow-hidden cursor-pointer select-none shadow-2xl border border-slate-700"
                    onClick={handleCounterClick}>

                    {/* Background decoration */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border-8 border-primary-500"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-4 border-primary-300"></div>
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); setActiveAzkar(null); }}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white"
                    >
                        إغلاق
                    </button>

                    <h2 className={`text-2xl md:text-3xl font-bold text-center mb-8 leading-relaxed transition-colors duration-500 ${activeAzkar.currentCount >= activeAzkar.targetCount ? 'text-red-500' : 'text-white'
                        }`}>
                        {activeAzkar.text}
                    </h2>

                    <div className="relative mb-8">
                        <div className={`text-8xl font-bold font-mono transition-colors duration-500 ${activeAzkar.currentCount >= activeAzkar.targetCount ? 'text-red-500' : 'text-primary-500'
                            }`}>
                            {activeAzkar.currentCount}
                        </div>
                        <div className="text-sm text-slate-400 text-center mt-2">
                            الهدف: {activeAzkar.targetCount}
                        </div>
                    </div>

                    <div className="flex gap-4 z-10">
                        <button
                            onClick={handleResetCounter}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-full flex items-center gap-2 transition-colors"
                        >
                            <Repeat size={18} />
                            <span>تصفير</span>
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className={`absolute bottom-0 left-0 h-2 transition-all duration-300 ${activeAzkar.currentCount >= activeAzkar.targetCount ? 'bg-red-500' : 'bg-primary-500'
                        }`}
                        style={{ width: `${Math.min((activeAzkar.currentCount / activeAzkar.targetCount) * 100, 100)}%` }}>
                    </div>
                </div>
            ) : (
                <>
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <BookOpen className="text-primary-500" />
                            <span>الأذكار</span>
                        </h2>
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    {/* Add/Edit Form */}
                    {showAddForm && (
                        <div className="bg-slate-800 rounded-lg p-4 mb-6 border border-slate-700 animate-in fade-in slide-in-from-top-2 relative">
                            <button onClick={cancelEditing} className="absolute top-2 right-2 text-slate-400 hover:text-white">
                                <X size={16} />
                            </button>
                            <h3 className="text-sm font-bold mb-3 text-slate-400">
                                {editingAzkar ? 'تعديل الذكر' : 'إضافة ذكر جديد'}
                            </h3>
                            <input
                                type="text"
                                placeholder="نص الذكر..."
                                value={newAzkarText}
                                onChange={(e) => setNewAzkarText(e.target.value)}
                                className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <div className="flex flex-wrap gap-3 mb-3">
                                <input
                                    type="number"
                                    placeholder="العدد"
                                    value={newAzkarCount}
                                    onChange={(e) => setNewAzkarCount(parseInt(e.target.value))}
                                    className="w-24 bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                <label className="flex items-center gap-2 bg-slate-700 px-4 rounded-lg cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={isDaily}
                                        onChange={(e) => setIsDaily(e.target.checked)}
                                        className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
                                    />
                                    <span className="text-sm">يومي (إضافة للمهام)</span>
                                </label>
                            </div>
                            <button
                                onClick={handleAddOrUpdateAzkar}
                                className="w-full bg-primary-500 hover:bg-primary-600 text-white rounded-lg px-4 py-2"
                            >
                                {editingAzkar ? 'حفظ التعديلات' : 'إضافة'}
                            </button>
                        </div>
                    )}

                    {/* Azkar Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {azkarList.map((azkar) => (
                            <div
                                key={azkar.id}
                                onClick={() => setActiveAzkar(azkar)}
                                className={`bg-slate-800 hover:bg-slate-750 p-4 rounded-xl border cursor-pointer transition-all group relative ${azkar.currentCount >= azkar.targetCount
                                    ? 'border-red-500/50'
                                    : 'border-slate-700 hover:border-primary-500/50'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2 text-xs text-primary-400 mb-1">
                                        {azkar.category === 'morning' && <Sun size={14} />}
                                        {azkar.category === 'evening' && <Moon size={14} />}
                                        {azkar.category === 'custom' && <Coffee size={14} />}
                                        <span>{azkar.targetCount} مرة</span>
                                        {azkar.isDaily && (
                                            <span className="bg-slate-700 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1">
                                                <CheckSquare size={10} /> يومي
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); startEditing(azkar); }}
                                            className="text-slate-500 hover:text-blue-400 p-1"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteAzkar(azkar.id); }}
                                            className="text-slate-500 hover:text-red-400 p-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <p className={`text-lg font-medium line-clamp-2 transition-colors ${azkar.currentCount >= azkar.targetCount ? 'text-red-400' : 'text-slate-200'
                                    }`}>
                                    {azkar.text}
                                </p>
                                {azkar.currentCount > 0 && (
                                    <div className="mt-3 w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${azkar.currentCount >= azkar.targetCount ? 'bg-red-500' : 'bg-primary-500'
                                                }`}
                                            style={{ width: `${Math.min((azkar.currentCount / (azkar.targetCount || 1)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
