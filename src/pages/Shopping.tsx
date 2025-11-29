import { useState, useEffect } from 'react';
import { Plus, Trash2, ShoppingCart, Settings, Check } from 'lucide-react';
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
            id: crypto.randomUUID(),
            name: newItemName.trim(),
            category: targetCategory,
            addedDate: new Date().toISOString(),
            purchased: false
        };
        setItems([...items, newItem]);
        setNewItemName('');
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
            id: crypto.randomUUID(),
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

    return (
        <div className="p-0 md:p-4 max-w-4xl mx-auto pb-24">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <ShoppingCart className="text-primary-500" />
                    <span>قائمة التسوق</span>
                </h2>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                >
                    <Settings size={20} />
                </button>
            </div>

            {/* Category Settings */}
            {showSettings && (
                <div className="bg-slate-800 rounded-xl p-4 mb-6 border border-slate-700 animate-in fade-in slide-in-from-top-4">
                    <h3 className="font-bold mb-3 text-sm text-slate-400">إدارة الأقسام</h3>
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="اسم القسم الجديد"
                            className="flex-1 bg-slate-700 rounded-lg px-3 py-2 text-sm"
                        />
                        <button onClick={addCategory} className="bg-green-600 text-white px-3 rounded-lg">
                            <Plus size={18} />
                        </button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {categories.map(cat => (
                            <div key={cat.id} className="flex justify-between items-center bg-slate-700/50 p-2 rounded-lg">
                                <span>{cat.name}</span>
                                {!cat.isDefault && (
                                    <button onClick={() => deleteCategory(cat.id)} className="text-red-400">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}



            {/* Add Item Input */}
            <div className="flex flex-col gap-3 mb-6 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addItem()}
                        placeholder={selectedAddCategory
                            ? `إضافة إلى ${categories.find(c => c.id === selectedAddCategory)?.name}...`
                            : activeCategory !== 'all'
                                ? `إضافة إلى ${categories.find(c => c.id === activeCategory)?.name}...`
                                : "ماذا تريد أن تشتري؟ (عام)"}
                        className="flex-1 bg-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                        onClick={addItem}
                        className="bg-primary-500 hover:bg-primary-600 text-white px-4 rounded-lg transition-colors"
                    >
                        <Plus size={24} />
                    </button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <span className="text-xs text-slate-400 whitespace-nowrap ml-2">إضافة إلى:</span>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedAddCategory(cat.id === selectedAddCategory ? null : cat.id)}
                            className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${cat.id === selectedAddCategory
                                ? 'bg-primary-500 text-white border-primary-500'
                                : 'border-slate-600 text-slate-400 hover:border-slate-500'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Items List */}
            <div className="space-y-2">
                {activeItems.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        لا توجد عناصر في هذا القسم
                    </div>
                ) : (
                    activeItems.map(item => (
                        <div
                            key={item.id}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${item.purchased
                                ? 'bg-slate-800/50 border-slate-800 opacity-60'
                                : 'bg-slate-800 border-slate-700'
                                }`}
                        >
                            <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleItem(item.id)}>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${item.purchased
                                    ? 'bg-green-500 border-green-500'
                                    : 'border-slate-500'
                                    }`}>
                                    {item.purchased && <Check size={14} className="text-white" />}
                                </div>
                                <span className={`text-lg ${item.purchased ? 'line-through text-slate-500' : 'text-white'}`}>
                                    {item.name}
                                </span>
                            </div>
                            <button
                                onClick={() => deleteItem(item.id)}
                                className="text-slate-500 hover:text-red-400 p-2"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
