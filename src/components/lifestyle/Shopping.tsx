import { useState } from 'react';
import { Plus, Trash2, Check, X, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLifestyleStore } from '../../store/useLifestyleStore';


const categoryColors: Record<string, string> = {
    'لحوم': 'bg-red-500/20 text-red-400',
    'خضروات': 'bg-green-500/20 text-green-400',
    'بقالة': 'bg-yellow-500/20 text-yellow-400',
    'ألبان': 'bg-blue-500/20 text-blue-400',
    'أخرى': 'bg-slate-500/20 text-slate-400',
};

export default function Shopping() {
    const { shoppingList, addShoppingItem, toggleShoppingItem, deleteShoppingItem, clearPurchased } = useLifestyleStore();
    const [showAddForm, setShowAddForm] = useState(false);
    const [newItemName, setNewItemName] = useState('');

    const purchasedCount = shoppingList.filter(item => item.purchased).length;
    const pendingItems = shoppingList.filter(item => !item.purchased);
    const purchasedItems = shoppingList.filter(item => item.purchased);

    const handleAddItem = async () => {
        if (!newItemName.trim()) return;

        await addShoppingItem(newItemName);
        setNewItemName('');
        setShowAddForm(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">قائمة التسوق</h2>
                    <p className="text-slate-400">التصنيف التلقائي مفعّل</p>
                </div>
                <div className="text-left">
                    <p className="text-sm text-slate-400">تم الشراء</p>
                    <p className="text-2xl font-bold text-primary-500">
                        {purchasedCount}/{shoppingList.length}
                    </p>
                </div>
            </div>

            {/* Add Item Button */}
            {!showAddForm && (
                <button
                    onClick={() => setShowAddForm(true)}
                    className="w-full py-3 bg-primary-500 hover:bg-primary-600 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    <span>إضافة عنصر جديد</span>
                </button>
            )}

            {/* Add Item Form */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-slate-800 rounded-xl p-4 border border-slate-700"
                    >
                        <input
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                            placeholder="اكتب اسم العنصر..."
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddItem}
                                className="flex-1 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors"
                            >
                                <Check size={18} />
                                <span>إضافة</span>
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddForm(false);
                                    setNewItemName('');
                                }}
                                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors"
                            >
                                <X size={18} />
                                <span>إلغاء</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Clear Purchased Button */}
            {purchasedItems.length > 0 && (
                <button
                    onClick={clearPurchased}
                    className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors"
                >
                    مسح العناصر المشتراة ({purchasedItems.length})
                </button>
            )}

            {/* Pending Items */}
            {pendingItems.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-white mb-3">قيد الشراء</h3>
                    {pendingItems.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-slate-800 rounded-lg p-4 border border-slate-700"
                        >
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => toggleShoppingItem(item.id)}
                                    className="w-6 h-6 rounded-md border-2 border-slate-600 hover:border-primary-500 transition-all"
                                />

                                <div className="flex-1">
                                    <p className="text-white">{item.name}</p>
                                    <span className={`inline-block mt-1 text-xs px-2 py-1 rounded ${categoryColors[item.category as string] || categoryColors['أخرى']}`}>
                                        {item.category}
                                    </span>
                                </div>

                                <button
                                    onClick={() => deleteShoppingItem(item.id)}
                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Purchased Items */}
            {purchasedItems.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-slate-400 mb-3">تم الشراء</h3>
                    {purchasedItems.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 opacity-60"
                        >
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => toggleShoppingItem(item.id)}
                                    className="w-6 h-6 rounded-md bg-primary-500 border-2 border-primary-500 flex items-center justify-center"
                                >
                                    <Check size={16} className="text-white" />
                                </button>

                                <div className="flex-1">
                                    <p className="text-slate-400 line-through">{item.name}</p>
                                </div>

                                <button
                                    onClick={() => deleteShoppingItem(item.id)}
                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {shoppingList.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
                    <p>قائمة التسوق فارغة</p>
                </div>
            )}
        </div>
    );
}
