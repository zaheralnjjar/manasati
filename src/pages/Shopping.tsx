import { useState, useEffect } from 'react';
import { Plus, Trash2, ShoppingCart, Settings, Check, AlertCircle, AlertTriangle, Info, Folder, ArrowRight, Calendar, Clock, Camera, X } from 'lucide-react';
import { storage } from '../utils/storage';
import type { ShoppingItem, ShoppingCategoryExtended } from '../types';

const DEFAULT_SHOPPING_CATEGORIES: ShoppingCategoryExtended[] = [
    { id: 'general', name: 'عام', isDefault: true },
    { id: 'central', name: 'السوق المركزي', isDefault: true },
    { id: 'supermarket', name: 'سوبر ماركت', isDefault: true },
    { id: 'veg', name: 'خضار وفواكه', isDefault: true },
    { id: 'meat', name: 'لحوم', isDefault: true },
    { id: 'chicken', name: 'دجاج', isDefault: true },
    { id: 'dairy', name: 'أجبان وألبان', isDefault: true },
];

export default function Shopping() {
    const [viewMode, setViewMode] = useState<'folders' | 'list'>('folders');
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [showAddFolderModal, setShowAddFolderModal] = useState(false);
    const [showAddItemModal, setShowAddItemModal] = useState(false);

    // Enhanced Item Form State
    const [newItem, setNewItem] = useState<{
        name: string;
        priority: 'urgent' | 'medium' | 'low';
        dueDate: string;
        dueTime: string;
        notes: string;
        image?: string;
    }>({
        name: '',
        priority: 'medium',
        dueDate: '',
        dueTime: '',
        notes: '',
        image: undefined
    });

    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [categories, setCategories] = useState<ShoppingCategoryExtended[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');

    const loadItems = () => {
        const savedItems = storage.get<ShoppingItem[]>('shoppingList') || [];
        setItems(savedItems);
    };

    useEffect(() => {
        loadItems();
        const savedCats = storage.get<ShoppingCategoryExtended[]>('shoppingCategories');
        if (savedCats && savedCats.length > 0) {
            setCategories(savedCats);
        } else {
            setCategories(DEFAULT_SHOPPING_CATEGORIES);
        }
        window.addEventListener('shopping-updated', loadItems);
        return () => window.removeEventListener('shopping-updated', loadItems);
    }, []);

    useEffect(() => {
        storage.set('shoppingList', items);
    }, [items]);

    useEffect(() => {
        if (categories.length > 0) {
            storage.set('shoppingCategories', categories);
        }
    }, [categories]);

    const handleAddItem = () => {
        if (!newItem.name.trim() || !selectedFolder) return;

        const item: ShoppingItem = {
            id: Date.now().toString() + Math.random().toString(36).substring(2),
            name: newItem.name.trim(),
            category: selectedFolder,
            addedDate: new Date().toISOString(),
            purchased: false,
            priority: newItem.priority,
            dueDate: newItem.dueDate,
            dueTime: newItem.dueTime,
            notes: newItem.notes,
            image: newItem.image
        };

        setItems([...items, item]);
        setNewItem({
            name: '',
            priority: 'medium',
            dueDate: '',
            dueTime: '',
            notes: '',
            image: undefined
        });
        setShowAddItemModal(false);
    };

    const toggleItem = (id: string) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, purchased: !item.purchased, completed: !item.purchased } : item
        ));
    };

    const deleteItem = (id: string) => {
        if (confirm('حذف هذا العنصر؟')) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const handleAddFolder = () => {
        if (!newCategoryName.trim()) return;
        const newCat: ShoppingCategoryExtended = {
            id: Date.now().toString() + Math.random().toString(36).substring(2),
            name: newCategoryName.trim(),
            isDefault: false,
            color: 'bg-slate-800' // Default color
        };
        setCategories([...categories, newCat]);
        setNewCategoryName('');
        setShowAddFolderModal(false);
    };

    const deleteCategory = (id: string) => {
        if (confirm('حذف هذا المجلد؟ سيتم حذف جميع العناصر بداخله.')) {
            setCategories(categories.filter(c => c.id !== id));
            setItems(items.filter(i => i.category !== id));
            if (selectedFolder === id) {
                setSelectedFolder(null);
                setViewMode('folders');
            }
        }
    };

    const activeItems = selectedFolder ? items.filter(i => i.category === selectedFolder) : [];

    return (
        <div className="p-0 max-w-4xl mx-auto pb-24 min-h-screen bg-slate-900">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-slate-800/50 backdrop-blur-md sticky top-0 z-10 border-b border-slate-700">
                <div className="flex items-center gap-3">
                    {viewMode === 'list' && (
                        <button onClick={() => { setViewMode('folders'); setSelectedFolder(null); }} className="p-2 -mr-2 text-slate-400 hover:text-white">
                            <ArrowRight size={24} />
                        </button>
                    )}
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                        {viewMode === 'folders' ? (
                            <>
                                <Folder size={24} className="text-primary-500" />
                                <span>مجلدات التسوق</span>
                            </>
                        ) : (
                            <>
                                <ShoppingCart size={24} className="text-primary-500" />
                                <span>{categories.find(c => c.id === selectedFolder)?.name}</span>
                            </>
                        )}
                    </h2>
                </div>
                <button
                    onClick={() => viewMode === 'folders' ? setShowAddFolderModal(true) : setShowAddItemModal(true)}
                    className="bg-primary-600 hover:bg-primary-500 text-white p-2 rounded-lg shadow-lg shadow-primary-600/20 transition-all"
                >
                    <Plus size={24} />
                </button>
            </div>

            {/* Content */}
            <div className="p-4">
                {viewMode === 'folders' ? (
                    // Folders Grid
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => { setSelectedFolder(cat.id); setViewMode('list'); }}
                                className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-primary-500/50 transition-all group relative flex flex-col items-center gap-3 text-center"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Folder size={32} className="text-primary-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">{cat.name}</h3>
                                    <span className="text-xs text-slate-400">
                                        {items.filter(i => i.category === cat.id).length} عنصر
                                    </span>
                                </div>
                                {!cat.isDefault && (
                                    <div
                                        onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }}
                                        className="absolute top-2 left-2 p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={16} />
                                    </div>
                                )}
                            </button>
                        ))}
                        <button
                            onClick={() => setShowAddFolderModal(true)}
                            className="bg-slate-800/50 border-2 border-dashed border-slate-700 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-primary-400 hover:border-primary-500/50 transition-all"
                        >
                            <Plus size={32} />
                            <span className="font-medium">مجلد جديد</span>
                        </button>
                    </div>
                ) : (
                    // Items List
                    <div className="space-y-3">
                        {activeItems.length === 0 ? (
                            <div className="text-center py-16 flex flex-col items-center justify-center">
                                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                    <ShoppingCart size={32} className="text-slate-600" />
                                </div>
                                <p className="text-slate-400 font-medium text-lg">المجلد فارغ</p>
                                <button onClick={() => setShowAddItemModal(true)} className="mt-4 text-primary-400 hover:underline">
                                    أضف أول عنصر
                                </button>
                            </div>
                        ) : (
                            activeItems.map(item => (
                                <div
                                    key={item.id}
                                    className={`bg-slate-800 rounded-xl p-4 border transition-all ${item.purchased
                                        ? 'border-slate-800 opacity-60'
                                        : 'border-slate-700 hover:border-slate-600'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <button
                                            onClick={() => toggleItem(item.id)}
                                            className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${item.purchased
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'border-slate-500 hover:border-primary-500'
                                                }`}
                                        >
                                            {item.purchased && <Check size={14} strokeWidth={3} />}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className={`font-medium text-lg ${item.purchased ? 'line-through text-slate-500' : 'text-white'}`}>
                                                    {item.name}
                                                </h3>
                                                {!item.purchased && item.priority === 'urgent' && (
                                                    <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                                                        هام
                                                    </span>
                                                )}
                                            </div>
                                            {(item.dueDate || item.dueTime || item.notes) && (
                                                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                                                    {item.dueDate && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            {item.dueDate}
                                                        </span>
                                                    )}
                                                    {item.dueTime && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={12} />
                                                            {item.dueTime}
                                                        </span>
                                                    )}
                                                    {item.notes && (
                                                        <span className="flex items-center gap-1 max-w-full truncate">
                                                            <Info size={12} />
                                                            {item.notes}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {item.image && (
                                                <div className="mt-2">
                                                    <img src={item.image} alt="Item" className="w-20 h-20 object-cover rounded-lg border border-slate-700" />
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={() => deleteItem(item.id)} className="text-slate-600 hover:text-red-400 p-2">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Add Folder Modal */}
            {showAddFolderModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 rounded-2xl w-full max-w-sm border border-slate-700 p-6 animate-in zoom-in-95">
                        <h3 className="text-xl font-bold mb-4 text-white">مجلد جديد</h3>
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="اسم المجلد"
                            className="w-full bg-slate-800 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setShowAddFolderModal(false)} className="flex-1 py-2 rounded-lg hover:bg-slate-800 text-slate-300">إلغاء</button>
                            <button onClick={handleAddFolder} className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-bold">إنشاء</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Item Modal */}
            {showAddItemModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-700 p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">إضافة عنصر جديد</h3>
                            <button onClick={() => setShowAddItemModal(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">اسم العنصر</label>
                                <input
                                    type="text"
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                    className="w-full bg-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                                    placeholder="ماذا تريد أن تشتري؟"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">التاريخ (اختياري)</label>
                                    <input
                                        type="date"
                                        value={newItem.dueDate}
                                        onChange={(e) => setNewItem({ ...newItem, dueDate: e.target.value })}
                                        className="w-full bg-slate-800 rounded-lg px-3 py-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">الوقت (اختياري)</label>
                                    <input
                                        type="time"
                                        value={newItem.dueTime}
                                        onChange={(e) => setNewItem({ ...newItem, dueTime: e.target.value })}
                                        className="w-full bg-slate-800 rounded-lg px-3 py-2 text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">الأهمية</label>
                                <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                                    {[
                                        { id: 'urgent', label: 'هام' },
                                        { id: 'medium', label: 'متوسط' },
                                        { id: 'low', label: 'عادي' }
                                    ].map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => setNewItem({ ...newItem, priority: p.id as any })}
                                            className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-all ${newItem.priority === p.id
                                                ? 'bg-slate-700 text-white shadow-sm'
                                                : 'text-slate-500 hover:text-slate-300'
                                                }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">ملاحظات</label>
                                <textarea
                                    value={newItem.notes}
                                    onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                                    className="w-full bg-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-white h-20 resize-none"
                                    placeholder="تفاصيل إضافية..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">صورة (اختياري)</label>
                                <label className="w-full bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors">
                                    <Camera size={24} className="text-slate-400 mb-2" />
                                    <span className="text-xs text-slate-400">اضغط لالتقاط صورة</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setNewItem({ ...newItem, image: reader.result as string });
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                </label>
                                {newItem.image && (
                                    <div className="mt-2 relative">
                                        <img src={newItem.image} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                                        <button
                                            onClick={() => setNewItem({ ...newItem, image: undefined })}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleAddItem}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-primary-600/20"
                            >
                                حفظ العنصر
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
