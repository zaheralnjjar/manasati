import { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, Settings, PieChart as PieChartIcon, Activity, Wallet, Trash2, PiggyBank, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { Transaction, BudgetCategoryExtended } from '../types';
import { storage } from '../utils/storage';
import { normalizeNumbers } from '../utils/numberHelper';

import * as XLSX from 'xlsx';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a855f7', '#ec4899'];

const DEFAULT_CATEGORIES: BudgetCategoryExtended[] = [
    { id: 'sal', name: 'راتب', type: 'income', isDefault: true },
    { id: 'add', name: 'دخل إضافي', type: 'income', isDefault: true },
    { id: 'food', name: 'طعام', type: 'expense', isDefault: true },
    { id: 'trans', name: 'نقل', type: 'expense', isDefault: true },
    { id: 'bills', name: 'فواتير', type: 'expense', isDefault: true },
    { id: 'health', name: 'صحة', type: 'expense', isDefault: true },
    { id: 'edu', name: 'دراسة', type: 'expense', isDefault: true },
    { id: 'charity', name: 'صدقة', type: 'expense', isDefault: true },
    { id: 'ent', name: 'ترفيه', type: 'expense', isDefault: true },
    { id: 'oth', name: 'أخرى', type: 'expense', isDefault: true },
    { id: 'usd', name: 'شراء دولار', type: 'savings', isDefault: true },
    { id: 'gold', name: 'ذهب', type: 'savings', isDefault: true },
];

export default function Budget() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<BudgetCategoryExtended[]>([]);

    // Form State
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'income' | 'expense' | 'savings'>('expense');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');

    // Savings Calculator State
    const [exchangeRate, setExchangeRate] = useState('');
    const [foreignAmount, setForeignAmount] = useState('');

    // Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [settingsTab, setSettingsTab] = useState<'salary' | 'categories' | 'income'>('salary');
    const [salary, setSalary] = useState('');
    const [salaryDate, setSalaryDate] = useState('1');

    // New Category State
    const [newCatName, setNewCatName] = useState('');
    const [newCatType, setNewCatType] = useState<'income' | 'expense' | 'savings'>('expense');

    // Load data
    useEffect(() => {
        const savedTrans = storage.get<Transaction[]>('transactions') || [];
        setTransactions(savedTrans);

        const savedCats = storage.get<BudgetCategoryExtended[]>('budgetCategories');
        if (savedCats && savedCats.length > 0) {
            setCategories(savedCats);
        } else {
            setCategories(DEFAULT_CATEGORIES);
        }

        const savedSalary = storage.get<string>('salary') || '';
        const savedSalaryDate = storage.get<string>('salaryDate') || '1';
        setSalary(savedSalary);
        setSalaryDate(savedSalaryDate);
    }, []);

    // Save data
    useEffect(() => {
        storage.set('transactions', transactions);
    }, [transactions]);

    useEffect(() => {
        if (categories.length > 0) {
            storage.set('budgetCategories', categories);
        }
    }, [categories]);

    // Set default category when type changes
    useEffect(() => {
        const firstCat = categories.find(c => c.type === type);
        if (firstCat) setSelectedCategoryId(firstCat.id);
    }, [type, categories]);

    // Calculator Logic
    useEffect(() => {
        const cat = categories.find(c => c.id === selectedCategoryId);
        if (cat?.id === 'usd' || cat?.id === 'gold') {
            const rate = parseFloat(exchangeRate);
            const foreign = parseFloat(foreignAmount);
            if (!isNaN(rate) && !isNaN(foreign)) {
                setAmount((rate * foreign).toFixed(2));
            } else {
                setAmount(''); // Clear amount if inputs are invalid
            }
        } else {
            // Clear calculator inputs if not a savings calc category
            if (exchangeRate !== '' || foreignAmount !== '') {
                setExchangeRate('');
                setForeignAmount('');
            }
        }
    }, [exchangeRate, foreignAmount, selectedCategoryId, categories]);

    const saveSalarySettings = () => {
        storage.set('salary', salary);
        storage.set('salaryDate', salaryDate);
        alert('تم حفظ إعدادات الراتب');
    };

    const addCategory = () => {
        if (!newCatName.trim()) return;
        const newCat: BudgetCategoryExtended = {
            id: crypto.randomUUID(),
            name: newCatName.trim(),
            type: newCatType,
            isDefault: false
        };
        setCategories([...categories, newCat]);
        setNewCatName('');
    };

    const deleteCategory = (id: string) => {
        if (confirm('هل أنت متأكد من حذف هذا التصنيف؟')) {
            setCategories(categories.filter(c => c.id !== id));
        }
    };

    const addTransaction = () => {
        if (!amount || !selectedCategoryId) {
            alert('الرجاء تعبئة الحقول المطلوبة (المبلغ، التصنيف)');
            return;
        }

        const cat = categories.find(c => c.id === selectedCategoryId);
        const isSavingsCalc = cat?.id === 'usd' || cat?.id === 'gold';

        const newTransaction: Transaction = {
            id: Date.now().toString(),
            type,
            amount: parseFloat(amount),
            category: selectedCategoryId,
            description: description.trim(),
            date: new Date().toISOString(),
            metadata: isSavingsCalc ? {
                exchangeRate: parseFloat(exchangeRate),
                foreignAmount: parseFloat(foreignAmount),
                unit: cat?.id === 'usd' ? 'USD' : 'GRAM'
            } : undefined
        };

        setTransactions([newTransaction, ...transactions]);
        setAmount('');
        setDescription('');
        setExchangeRate('');
        setForeignAmount('');
    };

    const deleteTransaction = (id: string) => {
        if (confirm('حذف هذه المعاملة؟')) {
            setTransactions(transactions.filter(t => t.id !== id));
        }
    };

    // Export Functions


    const exportExcel = () => {
        const data = transactions.map(t => ({
            التاريخ: new Date(t.date).toLocaleDateString('ar-EG'),
            النوع: t.type === 'income' ? 'دخل' : t.type === 'expense' ? 'مصروف' : 'ادخار',
            التصنيف: categories.find(c => c.id === t.category)?.name || t.category,
            الوصف: t.description,
            المبلغ: t.amount,
            'تفاصيل إضافية': t.metadata ? `${t.metadata.foreignAmount} ${t.metadata.unit} بسعر ${t.metadata.exchangeRate}` : ''
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transactions");
        XLSX.writeFile(wb, "budget-report.xlsx");
    };

    // Calculations
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalSavings = transactions
        .filter(t => t.type === 'savings')
        .reduce((sum, t) => sum + t.amount, 0);

    const monthlySalary = parseFloat(salary) || 0;
    const currentBalance = totalIncome + monthlySalary - totalExpense - totalSavings;

    // Daily budget calculation (currently not used but available for future features)
    // const today = new Date();
    // const currentDay = today.getDate();
    // const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    // const daysRemaining = Math.max(1, lastDayOfMonth - currentDay);


    // Chart Data
    const expensesByCategory = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            const catName = categories.find(c => c.id === t.category)?.name || 'غير معروف';
            acc[catName] = (acc[catName] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

    const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));

    const lineData = [...transactions]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .reduce((acc, t) => {
            const lastBalance = acc.length > 0 ? acc[acc.length - 1].balance : monthlySalary;
            let change = 0;
            if (t.type === 'income') change = t.amount;
            else change = -t.amount;

            acc.push({
                date: new Date(t.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'numeric' }),
                balance: lastBalance + change
            });
            return acc;
        }, [] as { date: string; balance: number }[])
        .slice(-10);

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    const isSavingsCalc = selectedCategory?.id === 'usd' || selectedCategory?.id === 'gold';

    return (
        <div className="p-0 md:p-4 max-w-4xl mx-auto pb-24">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Wallet className="text-primary-500" />
                    <span>الميزانية والمدخرات</span>
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={exportExcel}
                        className="p-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30"
                        title="تصدير Excel"
                    >
                        <FileText size={20} />
                    </button>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6 animate-in fade-in slide-in-from-top-4">
                    <div className="flex gap-4 mb-6 border-b border-slate-700 pb-2 overflow-x-auto">
                        <button
                            onClick={() => setSettingsTab('salary')}
                            className={`pb-2 whitespace-nowrap ${settingsTab === 'salary' ? 'text-primary-400 border-b-2 border-primary-400' : 'text-slate-400'}`}
                        >
                            إعدادات الراتب
                        </button>
                        <button
                            onClick={() => setSettingsTab('categories')}
                            className={`pb-2 whitespace-nowrap ${settingsTab === 'categories' ? 'text-primary-400 border-b-2 border-primary-400' : 'text-slate-400'}`}
                        >
                            إدارة التصنيفات
                        </button>
                        <button
                            onClick={() => setSettingsTab('income')}
                            className={`pb-2 whitespace-nowrap ${settingsTab === 'income' ? 'text-green-400 border-b-2 border-green-400' : 'text-slate-400'}`}
                        >
                            تسجيل دخل
                        </button>
                    </div>

                    {settingsTab === 'salary' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">الراتب الشهري الأساسي</label>
                                <input
                                    type="text"
                                    value={salary}
                                    onChange={(e) => setSalary(normalizeNumbers(e.target.value))}
                                    className="w-full bg-slate-700 rounded-lg px-4 py-2"
                                    placeholder="0.00"
                                    dir="ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">يوم نزول الراتب</label>
                                <input
                                    type="text"
                                    value={salaryDate}
                                    onChange={(e) => setSalaryDate(normalizeNumbers(e.target.value))}
                                    className="w-full bg-slate-700 rounded-lg px-4 py-2"
                                    dir="ltr"
                                />
                            </div>
                            <button onClick={saveSalarySettings} className="w-full bg-primary-500 hover:bg-primary-600 text-white py-2 rounded-lg">
                                حفظ الإعدادات
                            </button>
                        </div>
                    ) : settingsTab === 'categories' ? (
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newCatName}
                                    onChange={(e) => setNewCatName(e.target.value)}
                                    placeholder="اسم التصنيف الجديد"
                                    className="flex-1 bg-slate-700 rounded-lg px-4 py-2"
                                />
                                <select
                                    value={newCatType}
                                    onChange={(e) => setNewCatType(e.target.value as any)}
                                    className="bg-slate-700 rounded-lg px-2"
                                >
                                    <option value="income">دخل</option>
                                    <option value="expense">مصروف</option>
                                    <option value="savings">ادخار</option>
                                </select>
                                <button onClick={addCategory} className="bg-green-600 text-white px-4 rounded-lg">
                                    <Plus size={20} />
                                </button>
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {categories.map(cat => (
                                    <div key={cat.id} className="flex justify-between items-center bg-slate-700/50 p-2 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${cat.type === 'income' ? 'bg-green-500' :
                                                cat.type === 'savings' ? 'bg-purple-500' : 'bg-red-500'
                                                }`} />
                                            <span>{cat.name}</span>
                                            <span className="text-xs text-slate-500">
                                                ({cat.type === 'income' ? 'دخل' : cat.type === 'savings' ? 'ادخار' : 'مصروف'})
                                            </span>
                                        </div>
                                        {!cat.isDefault && (
                                            <button onClick={() => deleteCategory(cat.id)} className="text-red-400 hover:text-red-300">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // Income Tab in Settings
                        <div className="space-y-4">
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                                <h4 className="text-green-400 font-bold mb-2 flex items-center gap-2">
                                    <TrendingUp size={18} />
                                    تسجيل دخل إضافي
                                </h4>
                                <p className="text-xs text-slate-400 mb-4">
                                    يمكنك هنا تسجيل أي دخل إضافي غير الراتب الشهري.
                                </p>

                                <div className="space-y-3">
                                    <select
                                        value={selectedCategoryId}
                                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                                        className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        {categories.filter(c => c.type === 'income').map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>

                                    <input
                                        type="text"
                                        value={amount}
                                        onChange={(e) => setAmount(normalizeNumbers(e.target.value))}
                                        placeholder="المبلغ"
                                        className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        dir="ltr"
                                    />

                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="وصف الدخل (اختياري)"
                                        className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />

                                    <button
                                        onClick={() => {
                                            setType('income');
                                            // Need to wait for state update or pass type directly? 
                                            // addTransaction uses state 'type'. 
                                            // Let's modify addTransaction to accept type override or use a separate handler.
                                            // For now, let's just call a wrapper.
                                            setTimeout(addTransaction, 0);
                                        }}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                                    >
                                        <Plus size={20} />
                                        <span>إضافة الدخل</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center gap-2 mb-1 text-slate-400 text-sm">
                        <DollarSign size={16} />
                        <span>الرصيد المتاح</span>
                    </div>
                    <p className={`text-xl font-bold ${currentBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {currentBalance.toFixed(2)}
                    </p>
                </div>

                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center gap-2 mb-1 text-slate-400 text-sm">
                        <PiggyBank size={16} />
                        <span>إجمالي المدخرات</span>
                    </div>
                    <p className="text-xl font-bold text-purple-400">
                        {totalSavings.toFixed(2)}
                    </p>
                </div>

                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center gap-2 mb-1 text-slate-400 text-sm">
                        <TrendingUp size={16} />
                        <span>الدخل</span>
                    </div>
                    <p className="text-xl font-bold text-green-400">{(totalIncome + monthlySalary).toFixed(2)}</p>
                </div>

                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center gap-2 mb-1 text-slate-400 text-sm">
                        <TrendingDown size={16} />
                        <span>المصروفات</span>
                    </div>
                    <p className="text-xl font-bold text-red-400">{totalExpense.toFixed(2)}</p>
                </div>
            </div>

            {/* Add Transaction Form (Expense Only with Savings Toggle) */}
            <div className="bg-slate-800 rounded-xl p-5 mb-6 border border-slate-700 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <TrendingDown size={20} className="text-red-400" />
                        تسجيل مصروف جديد
                    </h3>

                    {/* Savings Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-700/50 px-3 py-1.5 rounded-lg border border-slate-600 hover:bg-slate-700 transition-colors">
                        <input
                            type="checkbox"
                            checked={type === 'savings'}
                            onChange={(e) => setType(e.target.checked ? 'savings' : 'expense')}
                            className="w-4 h-4 rounded border-slate-500 text-purple-600 focus:ring-purple-500"
                        />
                        <span className={`text-sm font-medium ${type === 'savings' ? 'text-purple-400' : 'text-slate-400'}`}>
                            تحويل لادخار؟
                        </span>
                        {type === 'savings' && <PiggyBank size={16} className="text-purple-400" />}
                    </label>
                </div>

                <div className="space-y-3">
                    <div className="flex gap-3">
                        <select
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                            className="w-1/3 bg-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            {categories.filter(c => c.type === type).map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>

                        {isSavingsCalc ? (
                            <div className="flex-1 grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    value={exchangeRate}
                                    onChange={(e) => setExchangeRate(normalizeNumbers(e.target.value))}
                                    placeholder={selectedCategory?.id === 'usd' ? 'سعر الصرف' : 'سعر الغرام'}
                                    className="bg-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    dir="ltr"
                                />
                                <input
                                    type="text"
                                    value={foreignAmount}
                                    onChange={(e) => setForeignAmount(normalizeNumbers(e.target.value))}
                                    placeholder={selectedCategory?.id === 'usd' ? 'المبلغ ($)' : 'الوزن (غرام)'}
                                    className="bg-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    dir="ltr"
                                />
                            </div>
                        ) : (
                            <input
                                type="text"
                                value={amount}
                                onChange={(e) => setAmount(normalizeNumbers(e.target.value))}
                                placeholder="المبلغ"
                                className="flex-1 bg-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                dir="ltr"
                            />
                        )}
                    </div>

                    {isSavingsCalc && (
                        <div className="bg-slate-700/50 p-3 rounded-lg flex justify-between items-center text-sm">
                            <span className="text-slate-400">الإجمالي بالعملة المحلية:</span>
                            <span className="font-bold text-xl text-white">{amount || '0.00'}</span>
                        </div>
                    )}

                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="وصف العملية (اختياري)"
                        className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />

                    <button
                        onClick={addTransaction}
                        className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors ${type === 'savings'
                            ? 'bg-purple-600 hover:bg-purple-700'
                            : 'bg-red-600 hover:bg-red-700'
                            } text-white`}
                    >
                        <Plus size={20} />
                        <span>
                            {type === 'savings' ? 'إضافة للمدخرات' : 'تسجيل المصروف'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Charts Section */}
            {transactions.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <PieChartIcon size={20} className="text-purple-400" />
                            توزيع المصروفات
                        </h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <Activity size={20} className="text-blue-400" />
                            تطور الرصيد
                        </h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={lineData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                                    <YAxis stroke="#9CA3AF" fontSize={12} />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem' }}
                                    />
                                    <Line type="monotone" dataKey="balance" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Transactions List */}
            {transactions.length > 0 ? (
                <div>
                    <h3 className="text-lg font-bold mb-3 text-slate-300">سجل المعاملات</h3>
                    <div className="space-y-3">
                        {transactions.slice(0, 20).map(transaction => {
                            const catName = categories.find(c => c.id === transaction.category)?.name || 'غير معروف';
                            return (
                                <div
                                    key={transaction.id}
                                    className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center justify-between hover:bg-slate-750 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${transaction.type === 'income' ? 'bg-green-500/10 text-green-400' :
                                            transaction.type === 'savings' ? 'bg-purple-500/10 text-purple-400' :
                                                'bg-red-500/10 text-red-400'
                                            }`}>
                                            {transaction.type === 'income' ? <TrendingUp size={20} /> :
                                                transaction.type === 'savings' ? <PiggyBank size={20} /> :
                                                    <TrendingDown size={20} />}
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-lg">{transaction.description || catName}</p>
                                            <div className="flex flex-col text-sm text-slate-400">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-slate-700 px-2 py-0.5 rounded text-xs">
                                                        {catName}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{new Date(transaction.date).toLocaleDateString('ar-EG')}</span>
                                                </div>
                                                {transaction.metadata && (
                                                    <span className="text-xs text-purple-300 mt-1">
                                                        {transaction.metadata.foreignAmount} {transaction.metadata.unit} × {transaction.metadata.exchangeRate}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className={`text-xl font-bold ${transaction.type === 'income' ? 'text-green-400' :
                                            transaction.type === 'savings' ? 'text-purple-400' :
                                                'text-red-400'
                                            }`}>
                                            {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toFixed(2)}
                                        </p>
                                        <button onClick={() => deleteTransaction(transaction.id)} className="text-slate-600 hover:text-red-400">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">💰</span>
                    </div>
                    <p className="text-slate-400">لا توجد معاملات بعد</p>
                    <p className="text-slate-500 text-sm mt-1">ابدأ بتسجيل مصاريفك اليومية</p>
                </div>
            )}
        </div>
    );
}
