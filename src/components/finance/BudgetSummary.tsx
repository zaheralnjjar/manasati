import { useState } from 'react';
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFinanceStore } from '../../store/useFinanceStore';
import type { ExpenseCategory } from '../../types';

const expenseCategories: ExpenseCategory[] = [
    'فواتير', 'طعام', 'نقل', 'ترفيه', 'صحة', 'تعليم', 'أخرى'
];

export default function BudgetSummary() {
    const { expenses, addExpense, deleteExpense, getBudgetSummary } = useFinanceStore();
    const [showAddForm, setShowAddForm] = useState(false);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<ExpenseCategory>('أخرى');

    const summary = getBudgetSummary();

    const handleAddExpense = async () => {
        if (!amount || !description) return;

        await addExpense({
            amount: parseFloat(amount),
            category,
            description,
            date: new Date().toISOString(),
        });

        setAmount('');
        setDescription('');
        setCategory('أخرى');
        setShowAddForm(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <h2 className="text-2xl font-bold text-white">الميزانية الشهرية</h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
                {/* Total Income */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={20} className="text-white" />
                        <p className="text-sm text-white/90">الدخل</p>
                    </div>
                    <p className="text-2xl font-bold text-white">${summary.totalIncome.toFixed(0)}</p>
                </div>

                {/* Total Expenses */}
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingDown size={20} className="text-white" />
                        <p className="text-sm text-white/90">المصروفات</p>
                    </div>
                    <p className="text-2xl font-bold text-white">${summary.totalExpenses.toFixed(0)}</p>
                </div>

                {/* Current Balance */}
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={20} className="text-white" />
                        <p className="text-sm text-white/90">الرصيد الحالي</p>
                    </div>
                    <p className="text-2xl font-bold text-white">${summary.currentBalance.toFixed(0)}</p>
                </div>

                {/* Safe Daily Spend */}
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={20} className="text-white" />
                        <p className="text-sm text-white/90">الإنفاق اليومي الآمن</p>
                    </div>
                    <p className="text-2xl font-bold text-white">${summary.safeDailySpend.toFixed(0)}</p>
                    <p className="text-xs text-white/80 mt-1">لـ {summary.daysRemainingInMonth} يوم متبقي</p>
                </div>
            </div>

            {/* Add Expense Button */}
            {!showAddForm && (
                <button
                    onClick={() => setShowAddForm(true)}
                    className="w-full py-3 bg-primary-500 hover:bg-primary-600 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    <span>إضافة مصروف</span>
                </button>
            )}

            {/* Add Expense Form */}
            {showAddForm && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-3"
                >
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="المبلغ"
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />

                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="الوصف"
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />

                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        {expenseCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>

                    <div className="flex gap-2">
                        <button
                            onClick={handleAddExpense}
                            className="flex-1 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg text-white font-medium transition-colors"
                        >
                            إضافة
                        </button>
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
                        >
                            إلغاء
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Recent Expenses */}
            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">المصروفات الأخيرة</h3>
                {expenses.slice(-5).reverse().map((expense) => (
                    <div
                        key={expense.id}
                        className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex items-center justify-between"
                    >
                        <div className="flex-1">
                            <p className="text-white font-medium">{expense.description}</p>
                            <p className="text-sm text-slate-400">{expense.category}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <p className="text-lg font-bold text-red-400">-${expense.amount}</p>
                            <button
                                onClick={() => deleteExpense(expense.id)}
                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
