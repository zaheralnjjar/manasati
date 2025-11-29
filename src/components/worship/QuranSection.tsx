import { useState } from 'react';
import { Plus, CheckCircle, Trash2, BookOpen, Calculator } from 'lucide-react';
import { addTaskToSystem } from '../../utils/taskHelper';
import { SURAH_DATA } from '../../utils/surahData';
import type { BookGoal, QuranGoal } from '../../types';

export default function QuranSection() {
    const [activeTab, setActiveTab] = useState<'quran' | 'books'>('quran');
    const [bookGoals, setBookGoals] = useState<BookGoal[]>([]);
    const [quranGoals, setQuranGoals] = useState<QuranGoal[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);

    // Form States
    const [bookForm, setBookForm] = useState({ title: '', pages: '', days: '' });
    const [quranForm, setQuranForm] = useState({
        type: 'recitation',
        scopeType: 'surah',
        scopeValue: '',
        days: '',
        totalVerses: 0,
        dailyVerses: 0,
        isDaily: true // Default to true for better engagement
    });

    // ... (existing code)

    const handleAddQuranGoal = () => {
        if (!quranForm.scopeValue || !quranForm.days) return;

        const durationDays = parseInt(quranForm.days);
        const dailyTarget = quranForm.dailyVerses;

        const newGoal: QuranGoal = {
            id: Date.now().toString() + Math.random().toString(36).substring(2),
            bookName: quranForm.scopeType === 'khatmah' ? 'ختمة كاملة' : quranForm.scopeValue,
            totalPages: quranForm.scopeType === 'khatmah' ? 604 : (quranForm.totalVerses || 0),
            currentPage: 0,
            deadlineDays: durationDays,
            pagesPerDay: dailyTarget,
            startDate: new Date().toISOString().split('T')[0],
            isQuran: true,
            mode: quranForm.type as 'tilawah' | 'hifz',
            completed: false,
            // Enhanced fields
            scopeType: quranForm.scopeType as 'juz' | 'surah' | 'verses' | 'khatmah',
            scopeValue: quranForm.scopeType === 'khatmah' ? 'ختمة كاملة' : quranForm.scopeValue,
            dailyTarget,
            durationDays
        };

        setQuranGoals([...quranGoals, newGoal]);

        // Add task for today's portion
        addTaskToSystem(`ورد قرآن: ${quranForm.scopeValue} (${dailyTarget} آية)`, {
            recurrence: quranForm.isDaily ? { type: 'daily', frequency: 1 } : { type: 'none' }
        });

        alert(`تمت إضافة الهدف وحساب الورد اليومي: ${dailyTarget} آية`);

        setQuranForm({ type: 'recitation', scopeType: 'surah', scopeValue: '', days: '', totalVerses: 0, dailyVerses: 0, isDaily: true });
        setShowAddForm(false);
    };

    const handleAddBookGoal = () => {
        if (!bookForm.title || !bookForm.pages || !bookForm.days) return;

        const totalPages = parseInt(bookForm.pages);
        const durationDays = parseInt(bookForm.days);
        const dailyTarget = Math.ceil(totalPages / durationDays);

        const newGoal: BookGoal = {
            id: Date.now().toString() + Math.random().toString(36).substring(2),
            title: bookForm.title,
            totalPages,
            currentPage: 0,
            startDate: new Date().toISOString().split('T')[0],
            durationDays,
            dailyTarget,
            isCompleted: false
        };

        setBookGoals([...bookGoals, newGoal]);

        // Add task for today's reading
        addTaskToSystem(`قراءة كتاب: ${bookForm.title} (${dailyTarget} صفحة)`, {
            recurrence: { type: 'daily', frequency: 1 }
        });

        alert(`تمت إضافة الكتاب. الورد اليومي: ${dailyTarget} صفحة`);
        setBookForm({ title: '', pages: '', days: '' });
        setShowAddForm(false);
    };

    const handleDeleteBook = (id: string) => {
        if (confirm('حذف هذا الهدف؟')) {
            setBookGoals(bookGoals.filter(g => g.id !== id));
        }
    };

    const handleDeleteQuran = (id: string) => {
        if (confirm('حذف هذا الهدف؟')) {
            setQuranGoals(quranGoals.filter(g => g.id !== id));
        }
    };

    const updateBookProgress = (goal: BookGoal, pagesRead: number) => {
        const updated = { ...goal, currentPage: Math.min(goal.currentPage + pagesRead, goal.totalPages) };
        if (updated.currentPage >= updated.totalPages) updated.isCompleted = true;
        setBookGoals(bookGoals.map(g => g.id === goal.id ? updated : g));
    };

    const handleSurahChange = (surahName: string) => {
        const surah = SURAH_DATA.find(s => s.name === surahName);
        setQuranForm({
            ...quranForm,
            scopeValue: surahName,
            totalVerses: surah ? surah.verses : 0,
            dailyVerses: surah && quranForm.days ? Math.ceil(surah.verses / parseInt(quranForm.days)) : 0
        });
    };

    return (
        <div className="p-0 md:p-4 max-w-4xl mx-auto">
            {/* Tabs */}
            <div className="flex bg-slate-800 rounded-lg p-1 mb-6">
                <button
                    onClick={() => setActiveTab('quran')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'quran' ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                >
                    القرآن الكريم
                </button>
                <button
                    onClick={() => setActiveTab('books')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'books' ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                >
                    قراءة الكتب
                </button>
            </div>

            {/* Add Button */}
            <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-lg p-4 mb-6 flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
                <Plus size={20} />
                <span>{activeTab === 'quran' ? 'إضافة ورد قرآن' : 'إضافة كتاب جديد'}</span>
            </button>

            {/* Forms */}
            {showAddForm && (
                <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700 animate-in fade-in slide-in-from-top-4">
                    {activeTab === 'books' ? (
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="اسم الكتاب"
                                value={bookForm.title}
                                onChange={e => setBookForm({ ...bookForm, title: e.target.value })}
                                className="w-full bg-slate-700 rounded-lg px-4 py-2"
                            />
                            <div className="flex gap-4">
                                <input
                                    type="number"
                                    placeholder="عدد الصفحات"
                                    value={bookForm.pages}
                                    onChange={e => setBookForm({ ...bookForm, pages: e.target.value })}
                                    className="w-full bg-slate-700 rounded-lg px-4 py-2"
                                />
                                <input
                                    type="number"
                                    placeholder="الأيام"
                                    value={bookForm.days}
                                    onChange={e => setBookForm({ ...bookForm, days: e.target.value })}
                                    className="w-full bg-slate-700 rounded-lg px-4 py-2"
                                />
                            </div>
                            <button onClick={handleAddBookGoal} className="w-full bg-primary-500 py-2 rounded-lg">حفظ</button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <select
                                    value={quranForm.type}
                                    onChange={e => setQuranForm({ ...quranForm, type: e.target.value })}
                                    className="w-full bg-slate-700 rounded-lg px-4 py-2"
                                >
                                    <option value="recitation">تلاوة</option>
                                    <option value="memorization">حفظ</option>
                                </select>
                                <select
                                    value={quranForm.scopeType}
                                    onChange={e => setQuranForm({ ...quranForm, scopeType: e.target.value })}
                                    className="w-full bg-slate-700 rounded-lg px-4 py-2"
                                >
                                    <option value="surah">سورة</option>
                                    <option value="juz">جزء</option>
                                    <option value="khatmah">ختمة كاملة</option>
                                </select>
                            </div>

                            {quranForm.scopeType === 'khatmah' ? (
                                <div className="bg-slate-700/50 p-4 rounded-lg border border-primary-500/30">
                                    <div className="flex items-center gap-3 mb-4">
                                        <BookOpen className="text-primary-500" />
                                        <div>
                                            <h4 className="font-bold text-white">ختمة القرآن الكريم</h4>
                                            <p className="text-sm text-slate-400">عدد صفحات المصحف: 604 صفحة</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">المدة (بالأيام)</label>
                                            <input
                                                type="number"
                                                placeholder="مثلاً: 30"
                                                value={quranForm.days}
                                                onChange={e => {
                                                    const days = parseInt(e.target.value);
                                                    setQuranForm({
                                                        ...quranForm,
                                                        days: e.target.value,
                                                        dailyVerses: days ? Math.ceil(604 / days) : 0, // Using dailyVerses field for pages in this context
                                                        scopeValue: 'ختمة كاملة'
                                                    });
                                                }}
                                                className="w-full bg-slate-700 rounded-lg px-4 py-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">أو الورد اليومي (صفحات)</label>
                                            <input
                                                type="number"
                                                placeholder="مثلاً: 20"
                                                value={quranForm.dailyVerses} // Reusing dailyVerses for pages
                                                onChange={e => {
                                                    const pages = parseInt(e.target.value);
                                                    setQuranForm({
                                                        ...quranForm,
                                                        dailyVerses: pages,
                                                        days: pages ? Math.ceil(604 / pages).toString() : '',
                                                        scopeValue: 'ختمة كاملة'
                                                    });
                                                }}
                                                className="w-full bg-slate-700 rounded-lg px-4 py-2"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : quranForm.scopeType === 'surah' ? (
                                <select
                                    value={quranForm.scopeValue}
                                    onChange={e => handleSurahChange(e.target.value)}
                                    className="w-full bg-slate-700 rounded-lg px-4 py-2"
                                >
                                    <option value="">اختر السورة</option>
                                    {SURAH_DATA.map(s => (
                                        <option key={s.number} value={s.name}>{s.number}. {s.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    placeholder="رقم الجزء (مثلاً: 30)"
                                    value={quranForm.scopeValue}
                                    onChange={e => setQuranForm({ ...quranForm, scopeValue: e.target.value })}
                                    className="w-full bg-slate-700 rounded-lg px-4 py-2"
                                />
                            )}

                            {quranForm.scopeType === 'surah' && quranForm.totalVerses > 0 && (
                                <div className="text-sm text-slate-400 px-2">
                                    عدد الآيات: {quranForm.totalVerses}
                                </div>
                            )}

                            <input
                                type="number"
                                placeholder="المدة (بالأيام)"
                                value={quranForm.days}
                                onChange={e => setQuranForm({ ...quranForm, days: e.target.value })}
                                className="w-full bg-slate-700 rounded-lg px-4 py-2"
                            />

                            {quranForm.dailyVerses > 0 && (
                                <div className="bg-slate-700/50 p-4 rounded-lg border border-primary-500/30 flex items-center gap-3">
                                    <Calculator className="text-primary-500" />
                                    <div>
                                        <div className="text-sm text-slate-400">الورد اليومي المقترح</div>
                                        <div className="text-xl font-bold text-white">
                                            {quranForm.dailyVerses} {quranForm.scopeType === 'khatmah' ? 'صفحة' : 'آية'} / يوم
                                        </div>
                                    </div>
                                </div>
                            )}

                            <label className="flex items-center gap-2 bg-slate-700/50 px-4 py-2 rounded-lg cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={quranForm.isDaily}
                                    onChange={(e) => setQuranForm({ ...quranForm, isDaily: e.target.checked })}
                                    className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
                                />
                                <span className="text-sm">تكرار يومي (إضافة للمهام اليومية المتكررة)</span>
                            </label>


                            <button onClick={handleAddQuranGoal} className="w-full bg-primary-500 py-2 rounded-lg">حفظ وإضافة للمهام</button>
                        </div>
                    )}
                </div>
            )}

            {/* Content List */}
            <div className="space-y-4">
                {activeTab === 'books' ? (
                    bookGoals.map(goal => (
                        <div key={goal.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg">{goal.title}</h3>
                                    <p className="text-sm text-slate-400">
                                        الورد اليومي: {goal.dailyTarget} صفحة
                                    </p>
                                </div>
                                <button onClick={() => handleDeleteBook(goal.id)} className="text-slate-500 hover:text-red-400">
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-1">
                                    <span>{goal.currentPage} / {goal.totalPages}</span>
                                    <span>{Math.round((goal.currentPage / goal.totalPages) * 100)}%</span>
                                </div>
                                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-primary-500 h-full transition-all"
                                        style={{ width: `${(goal.currentPage / goal.totalPages) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => updateBookProgress(goal, goal.dailyTarget)}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={16} className="text-green-500" />
                                    <span>أتممت ورد اليوم</span>
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    quranGoals.map(goal => (
                        <div key={goal.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary-500/10 p-2 rounded-lg">
                                        <BookOpen className="text-primary-500" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">
                                            {goal.mode === 'tilawah' ? 'تلاوة' : 'حفظ'} {goal.scopeType === 'juz' ? `الجزء ${goal.scopeValue}` : goal.scopeValue}
                                        </h3>
                                        <p className="text-sm text-slate-400">
                                            المدة: {goal.durationDays} يوم • الورد: {goal.dailyTarget} آية
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteQuran(goal.id)} className="text-slate-500 hover:text-red-400">
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            {/* Simple progress for demo */}
                            <div className="flex gap-2 mt-4">
                                <button className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 rounded-lg text-sm">
                                    تسجيل إنجاز
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
