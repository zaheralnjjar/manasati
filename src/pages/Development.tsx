import { useState, useEffect } from 'react';
import { BookOpen, Video, GraduationCap, Repeat, Plus, Trash2, ExternalLink, CheckCircle, Circle } from 'lucide-react';
import { useDevelopmentStore } from '../store/useDevelopmentStore';
import type { DevelopmentGoal, Task } from '../types';

export default function Development() {
    const { goals, addGoal, toggleStatus, deleteGoal, initialize } = useDevelopmentStore();
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [type, setType] = useState<DevelopmentGoal['type']>('book');
    const [link, setLink] = useState('');
    const [frequency, setFrequency] = useState<DevelopmentGoal['frequency']>('once');

    useEffect(() => {
        initialize();
    }, []);

    const handleAddGoal = () => {
        if (!title.trim()) {
            alert('الرجاء إدخال عنوان الهدف');
            return;
        }

        addGoal({
            title: title.trim(),
            type,
            link: link.trim(),
            frequency
        });

        alert('تم حفظ الهدف بنجاح!');

        // Reset form
        setTitle('');
        setLink('');
        setShowForm(false);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'book': return <BookOpen size={20} className="text-blue-400" />;
            case 'video': return <Video size={20} className="text-red-400" />;
            case 'course': return <GraduationCap size={20} className="text-yellow-400" />;
            case 'habit': return <Repeat size={20} className="text-green-400" />;
            default: return <BookOpen size={20} />;
        }
    };

    return (
        <div className="p-0 max-w-4xl mx-auto pb-24">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <GraduationCap className="text-primary-500" />
                    <span>التطوير الذاتي</span>
                </h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Plus size={20} />
                    <span>هدف جديد</span>
                </button>
            </div>

            {showForm && (
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-8 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-white">إضافة هدف جديد</h3>
                        <button
                            onClick={handleAddGoal}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-1.5 rounded-lg font-bold text-sm"
                        >
                            حفظ
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">عنوان الهدف</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="مثال: قراءة كتاب العادات الذرية"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">النوع</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as any)}
                                className="w-full bg-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="book">كتاب</option>
                                <option value="video">فيديو</option>
                                <option value="course">دورة تدريبية</option>
                                <option value="habit">عادة جديدة</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">الرابط (اختياري)</label>
                            <input
                                type="text"
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                className="w-full bg-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="https://youtube.com/..."
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">التكرار</label>
                            <select
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value as any)}
                                className="w-full bg-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="once">مرة واحدة</option>
                                <option value="daily">يومياً</option>
                                <option value="weekly">أسبوعياً</option>
                                <option value="monthly">شهرياً</option>
                            </select>
                        </div>
                    </div>

                </div>
            )}

            <div className="space-y-4">
                {goals.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        لا توجد أهداف حالياً. ابدأ بإضافة هدف جديد لتطوير ذاتك!
                    </div>
                ) : (
                    goals.map(goal => (
                        <div key={goal.id} className={`bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center justify-between group ${goal.status === 'completed' ? 'opacity-60' : ''}`}>
                            <div className="flex items-center gap-4">
                                <button onClick={() => toggleStatus(goal.id)} className="text-slate-400 hover:text-green-400 transition-colors">
                                    {goal.status === 'completed' ? <CheckCircle size={24} className="text-green-500" /> : <Circle size={24} />}
                                </button>
                                <div>
                                    <h3 className={`font-bold text-lg flex items-center gap-2 ${goal.status === 'completed' ? 'line-through text-slate-500' : 'text-white'}`}>
                                        {getTypeIcon(goal.type)}
                                        {goal.title}
                                    </h3>
                                    <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                                        <span className="bg-slate-700 px-2 py-0.5 rounded text-xs">
                                            {goal.frequency === 'once' ? 'مرة واحدة' :
                                                goal.frequency === 'daily' ? 'يومي' :
                                                    goal.frequency === 'weekly' ? 'أسبوعي' : 'شهري'}
                                        </span>
                                        {goal.link && (
                                            <a href={goal.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline">
                                                <ExternalLink size={12} />
                                                رابط
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => deleteGoal(goal.id)} className="text-slate-600 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
