import { useState, useEffect } from 'react';
import { Plus, Trash2, ShoppingCart, Settings, Check, AlertCircle, AlertTriangle, Info } from 'lucide-react';
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
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [categories, setCategories] = useState<ShoppingCategoryExtended[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [newItemName, setNewItemName] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedAddCategory, setSelectedAddCategory] = useState<string | null>(null);
    const [priority, setPriority] = useState<'urgent' | 'medium' | 'low'>('medium');

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

    const addItem = () => {
        if (!newItemName.trim()) return;

        // Determine category: 
        // 1. Manually selected category
        // 2. Current active category (if not 'all')
        // 3. Default 'general'
        let targetCategory = 'general';

        if (selectedAddCategory) {
            targetCategory = selectedAddCategory;
        } else if (activeCategory !== 'all') {
            targetCategory = activeCategory;
        }

        const newItem: ShoppingItem = {
            id: Date.now().toString() + Math.random().toString(36).substring(2),
            name: newItemName.trim(),
            category: targetCategory,
            addedDate: new Date().toISOString(),
            purchased: false,
            priority
        };
        setItems([...items, newItem]);
        setNewItemName('');
        setPriority('medium');
        // Keep the selected category for rapid entry, or reset? 
        // Let's keep it to allow adding multiple items to same category easily.
    };

    const toggleItem = (id: string) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, purchased: !item.purchased, completed: !item.purchased } : item
        ));
    };

    const deleteItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const addCategory = () => {
        if (!newCategoryName.trim()) return;
        const newCat: ShoppingCategoryExtended = {
            id: Date.now().toString() + Math.random().toString(36).substring(2),
            name: newCategoryName.trim(),
            isDefault: false
        };
        setCategories([...categories, newCat]);
        setNewCategoryName('');
    };

    const deleteCategory = (id: string) => {
        if (confirm('حذف هذا القسم؟ سيتم نقل العناصر إلى "عام".')) {
            setCategories(categories.filter(c => c.id !== id));
            // Move items to general
            setItems(items.map(i => i.category === activeCategory ? { ...i, category: 'general' } : i));
            if (activeCategory === id) setActiveCategory('general');
        }
    };

    const activeItems = items.filter(i =>
        activeCategory === 'all' ||
        i.category === activeCategory ||
        (!i.category && activeCategory === 'general')
    );

    const getPriorityColor = (p?: string) => {
        switch (p) {
            case 'urgent': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            default: return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
        }
    };

    const getPriorityIcon = (p?: string) => {
        switch (p) {
            case 'urgent': return <AlertCircle size={14} />;
            case 'low': return <Info size={14} />;
            default: return <AlertTriangle size={14} />;
        }
    };

    return (
        <div className="p-0 max-w-4xl mx-auto pb-24">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 px-4 pt-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <ShoppingCart className="text-primary-500" size={24} />
                    <span>قائمة التسوق</span>
                </h2>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                    <Settings size={20} />
                </button>
            </div>

            {/* Category Settings */}
            {showSettings && (
                <div className="bg-slate-800 rounded-xl p-4 mb-4 border border-slate-700 mx-4 animate-in fade-in slide-in-from-top-2">
                    <h3 className="font-bold mb-3 text-sm text-slate-400">إدارة الأقسام</h3>
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="اسم القسم الجديد"
                            className="flex-1 bg-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                        <button onClick={addCategory} className="bg-green-600 text-white px-3 rounded-lg hover:bg-green-700 transition-colors">
                            <Plus size={18} />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                        {categories.map(cat => (
                            <div key={cat.id} className="flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 rounded-full text-sm">
                                <span>{cat.name}</span>
                                {!cat.isDefault && (
                                    <button onClick={() => deleteCategory(cat.id)} className="text-red-400 hover:text-red-300">
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Item Section */}
            <div className="bg-slate-800 p-4 mx-2 rounded-2xl border border-slate-700 shadow-lg mb-4 sticky top-0 z-10">
                <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addItem()}
                            placeholder={selectedAddCategory
                                ? `إضافة إلى ${categories.find(c => c.id === selectedAddCategory)?.name}...`
                                : "ماذا تريد أن تشتري؟"}
                            className="flex-1 bg-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base"
                        />
                        <button
                            onClick={addItem}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-5 rounded-xl transition-all flex items-center justify-center shadow-lg shadow-primary-600/20 active:scale-95"
                        >
                            <Plus size={26} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        {/* Categories Scroll */}
                        <div className="flex-1 overflow-x-auto scrollbar-hide flex gap-2 py-1">
                            <button
                                onClick={() => { setSelectedAddCategory(null); setActiveCategory('all'); }}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${activeCategory === 'all' && !selectedAddCategory
                                    ? 'bg-white text-slate-900 shadow-md'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                الكل
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedAddCategory(cat.id === selectedAddCategory ? null : cat.id)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${cat.id === selectedAddCategory
                                        ? 'bg-primary-500 text-white border-primary-500 shadow-md'
                                        : 'bg-slate-700/50 text-slate-300 border-transparent hover:bg-slate-700'
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>

                        {/* Priority Toggles */}
                        <div className="flex bg-slate-900/50 rounded-xl p-1 gap-1 shrink-0 border border-slate-700/50">
                            {[
                                { id: 'urgent', icon: AlertCircle, color: 'text-red-400', activeBg: 'bg-red-500 text-white shadow-sm' },
                                { id: 'medium', icon: AlertTriangle, color: 'text-yellow-400', activeBg: 'bg-yellow-500 text-white shadow-sm' },
                                { id: 'low', icon: Info, color: 'text-blue-400', activeBg: 'bg-blue-500 text-white shadow-sm' }
                            ].map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setPriority(p.id as any)}
                                    className={`p-2 rounded-lg transition-all ${priority === p.id ? p.activeBg : 'text-slate-500 hover:bg-slate-700 hover:text-slate-300'}`}
                                >
                                    <p.icon size={18} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Shopping List */}
            <div className="px-2 space-y-2">
                {activeItems.length === 0 ? (
                    <div className="text-center py-12 flex flex-col items-center justify-center opacity-50">
                        <ShoppingCart size={48} className="mb-4 text-slate-600" />
                        <p className="text-slate-400">قائمة التسوق فارغة</p>
                    </div>
                ) : (
                    activeItems.map(item => (
                        <div
                            key={item.id}
                            className={`group bg-slate-800 rounded-xl p-3 border transition-all flex items-center gap-3 ${item.purchased
                                ? 'border-transparent bg-slate-800/50'
                                : 'border-slate-700/50 hover:border-slate-600'
                                }`}
                        >
                            <button
                                onClick={() => toggleItem(item.id)}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${item.purchased
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : 'border-slate-500 hover:border-primary-500 text-transparent'
                                    }`}
                            >
                                <Check size={14} strokeWidth={3} />
                            </button>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={`text-base font-medium truncate ${item.purchased ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                        {item.name}
                                    </span>
                                    {!item.purchased && item.priority === 'urgent' && (
                                        <AlertCircle size={14} className="text-red-500 shrink-0" />
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-full">
                                        {categories.find(c => c.id === item.category)?.name || 'عام'}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => deleteItem(item.id)}
                                className="text-slate-600 hover:text-red-400 transition-colors p-2 opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
