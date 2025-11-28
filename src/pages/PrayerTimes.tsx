import { useState, useEffect } from 'react';
import { Plus, Download, Clock, Calendar, Globe, Edit2, Trash2, Settings } from 'lucide-react';
import type { PrayerTime, PrayerSettings } from '../types';
import { storage } from '../utils/storage';
import { getNextPrayer, getCurrentPrayer, getTimeUntil, getTimeSince, formatTime, prayerNames } from '../utils/prayerHelpers';
import { generateICS, downloadICS } from '../utils/icsExport';
import { fetchCurrentMonthPrayerTimes, fetchNextMonthPrayerTimes, CALCULATION_METHODS, CALCULATION_METHOD_NAMES } from '../utils/aladhanApi';

export default function PrayerTimes() {
    const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPrayerTime, setEditingPrayerTime] = useState<PrayerTime | null>(null);

    const [isFetchingOnline, setIsFetchingOnline] = useState(false);
    const [calculationMethod, setCalculationMethod] = useState<number>(
        storage.get<number>('calculationMethod') || CALCULATION_METHODS.ISNA
    );

    // Form state for adding new prayer time
    const [formData, setFormData] = useState({
        date: '',
        fajr: '',
        sunrise: '',
        dhuhr: '',
        asr: '',
        maghrib: '',
        isha: '',
    });

    // Edit form state
    const [editFormData, setEditFormData] = useState({
        date: '',
        fajr: '',
        sunrise: '',
        dhuhr: '',
        asr: '',
        maghrib: '',
        isha: '',
    });

    // Export settings
    const [exportSettings, setExportSettings] = useState<PrayerSettings>({
        notifyAtAdhan: true,
        notifyBeforeAdhan: true,
        minutesBeforeAdhan: 15,
        selectedPrayers: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
    });

    // Export selection
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [selectAllDates, setSelectAllDates] = useState(true);

    // Load prayer times from localStorage
    useEffect(() => {
        const saved = storage.get<PrayerTime[]>('prayerTimes') || [];
        setPrayerTimes(saved);
    }, []);

    // Save prayer times to localStorage
    useEffect(() => {
        if (prayerTimes.length > 0) {
            storage.set('prayerTimes', prayerTimes);
        }
    }, [prayerTimes]);

    // Save calculation method to localStorage
    useEffect(() => {
        storage.set('calculationMethod', calculationMethod);
    }, [calculationMethod]);



    const nextPrayer = getNextPrayer(prayerTimes);
    const currentPrayer = getCurrentPrayer(prayerTimes);
    const timeUntilNext = nextPrayer ? getTimeUntil(nextPrayer.time) : null;
    const timeSinceCurrent = currentPrayer ? getTimeSince(currentPrayer.time) : null;

    const handleFetchOnline = async (monthOffset: number = 0) => {
        setIsFetchingOnline(true);
        try {
            let fetched: PrayerTime[];

            if (monthOffset === 0) {
                fetched = await fetchCurrentMonthPrayerTimes(calculationMethod);
            } else {
                fetched = await fetchNextMonthPrayerTimes(calculationMethod);
            }

            if (fetched.length > 0) {
                // Replace all existing prayer times with new ones
                setPrayerTimes(fetched.sort((a, b) => a.date.localeCompare(b.date)));
                alert(`تم جلب ${fetched.length} يوم من الإنترنت بنجاح!`);
            } else {
                alert('لم يتم العثور على أوقات صلاة.');
            }
        } catch (error) {
            console.error('Fetch online error:', error);
            const errorMessage = error instanceof Error ? error.message : 'حدث خطأ في جلب الأوقات من الإنترنت';
            alert(errorMessage);
        } finally {
            setIsFetchingOnline(false);
        }
    };

    const handleAddPrayerTime = () => {
        if (!formData.date || !formData.fajr || !formData.dhuhr || !formData.asr || !formData.maghrib || !formData.isha) {
            alert('الرجاء ملء جميع الحقول المطلوبة');
            return;
        }

        const newPrayerTime: PrayerTime = {
            date: formData.date,
            fajr: formData.fajr,
            sunrise: formData.sunrise || '06:00',
            dhuhr: formData.dhuhr,
            asr: formData.asr,
            maghrib: formData.maghrib,
            isha: formData.isha,
        };

        setPrayerTimes([...prayerTimes, newPrayerTime].sort((a, b) => a.date.localeCompare(b.date)));
        setFormData({ date: '', fajr: '', sunrise: '', dhuhr: '', asr: '', maghrib: '', isha: '' });
        setShowAddForm(false);
    };

    const handleEditPrayerTime = (prayerTime: PrayerTime) => {
        setEditingPrayerTime(prayerTime);
        setEditFormData(prayerTime);
        setShowEditModal(true);
    };

    const handleSaveEdit = () => {
        if (!editFormData.fajr || !editFormData.dhuhr || !editFormData.asr || !editFormData.maghrib || !editFormData.isha) {
            alert('الرجاء ملء جميع الحقول المطلوبة');
            return;
        }

        const updatedTimes = prayerTimes.map(pt =>
            pt.date === editingPrayerTime?.date ? editFormData : pt
        );

        setPrayerTimes(updatedTimes);
        setShowEditModal(false);
        setEditingPrayerTime(null);
    };

    const handleDeletePrayerTime = (date: string) => {
        if (confirm(`هل أنت متأكد من حذف أوقات الصلاة ليوم ${date}؟`)) {
            setPrayerTimes(prayerTimes.filter(pt => pt.date !== date));
        }
    };

    const handleMethodChange = async (newMethod: number) => {
        if (confirm('سيتم إعادة جلب جميع الأوقات بالطريقة الجديدة. هل تريد المتابعة؟')) {
            setCalculationMethod(newMethod);
            // Auto-fetch with new method
            setIsFetchingOnline(true);
            try {
                const fetched = await fetchCurrentMonthPrayerTimes(newMethod);
                if (fetched.length > 0) {
                    setPrayerTimes(fetched.sort((a, b) => a.date.localeCompare(b.date)));
                    alert(`تم تحديث الأوقات بطريقة: ${CALCULATION_METHOD_NAMES[newMethod]}`);
                }
            } catch (error) {
                console.error('Fetch error:', error);
                alert('حدث خطأ في جلب الأوقات');
            } finally {
                setIsFetchingOnline(false);
            }
        }
    };

    const handleExport = () => {
        if (prayerTimes.length === 0) {
            alert('لا توجد أوقات صلاة للتصدير');
            return;
        }

        // Filter prayer times based on selection
        const timesToExport = selectAllDates
            ? prayerTimes
            : prayerTimes.filter(pt => selectedDates.includes(pt.date));

        if (timesToExport.length === 0) {
            alert('الرجاء اختيار أيام للتصدير');
            return;
        }

        const icsContent = generateICS(timesToExport, exportSettings);
        if (icsContent) {
            downloadICS(icsContent);
            setShowExportModal(false);
            setSelectedDates([]);
            setSelectAllDates(true);
        } else {
            alert('حدث خطأ أثناء إنشاء ملف التصدير');
        }
    };

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-center">أوقات الصلاة</h1>

            {/* Calculation Method Selector */}
            <div className="bg-slate-800 rounded-lg p-4 mb-6 border border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                    <Settings size={20} className="text-primary-500" />
                    <h3 className="font-bold">طريقة الحساب</h3>
                </div>
                <select
                    value={calculationMethod}
                    onChange={(e) => handleMethodChange(Number(e.target.value))}
                    className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    {Object.entries(CALCULATION_METHOD_NAMES).map(([value, name]) => (
                        <option key={value} value={value}>
                            {name}
                        </option>
                    ))}
                </select>
                <p className="text-slate-400 text-sm mt-2">
                    الطريقة الحالية: {CALCULATION_METHOD_NAMES[calculationMethod]}
                </p>
            </div>

            {/* Fetch from Internet Section */}
            <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
                <h3 className="text-lg font-bold mb-4">جلب من الإنترنت</h3>
                <p className="text-slate-400 text-sm mb-4">
                    جلب أوقات الصلاة لمدينة Buenos Aires، الأرجنتين
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                        onClick={() => handleFetchOnline(0)}
                        disabled={isFetchingOnline}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Globe size={20} />
                        <span>{isFetchingOnline ? 'جاري الجلب...' : 'جلب الشهر الحالي'}</span>
                    </button>

                    <button
                        onClick={() => handleFetchOnline(1)}
                        disabled={isFetchingOnline}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Calendar size={20} />
                        <span>{isFetchingOnline ? 'جاري الجلب...' : 'جلب الشهر القادم'}</span>
                    </button>
                </div>

                <p className="text-slate-400 text-sm mt-3 text-center">
                    💡 سيتم جلب شهر كامل من أوقات الصلاة تلقائياً
                </p>
            </div>

            {/* Next Prayer Countdown */}
            {nextPrayer && timeUntilNext && (
                <div className="bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-lg p-6 mb-6 border border-primary-500/30">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Clock size={24} className="text-primary-500" />
                            <h3 className="text-lg font-bold">الصلاة القادمة</h3>
                        </div>
                        <span className="text-primary-500 font-bold">{prayerNames[nextPrayer.prayer]}</span>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-bold mb-2">{timeUntilNext}</div>
                        <div className="text-slate-400">الوقت: {formatTime(nextPrayer.time)}</div>
                    </div>
                </div>
            )}

            {/* Current Prayer Counter */}
            {currentPrayer && timeSinceCurrent && (
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg p-6 mb-6 border border-green-500/30">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Clock size={24} className="text-green-500" />
                            <h3 className="text-lg font-bold">الصلاة الحالية</h3>
                        </div>
                        <span className="text-green-500 font-bold">{prayerNames[currentPrayer.prayer]}</span>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-bold mb-2">{timeSinceCurrent}</div>
                        <div className="text-slate-400">منذ: {formatTime(currentPrayer.time)}</div>
                    </div>
                </div>
            )}

            {/* Add Manual Entry Button */}
            <div className="mb-6">
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    <span>إضافة يوم يدوياً</span>
                </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
                    <h3 className="text-lg font-bold mb-4">إضافة أوقات صلاة جديدة</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm mb-2">التاريخ</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-2">الفجر</label>
                            <input
                                type="time"
                                value={formData.fajr}
                                onChange={(e) => setFormData({ ...formData, fajr: e.target.value })}
                                className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-2">الشروق</label>
                            <input
                                type="time"
                                value={formData.sunrise}
                                onChange={(e) => setFormData({ ...formData, sunrise: e.target.value })}
                                className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-2">الظهر</label>
                            <input
                                type="time"
                                value={formData.dhuhr}
                                onChange={(e) => setFormData({ ...formData, dhuhr: e.target.value })}
                                className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-2">العصر</label>
                            <input
                                type="time"
                                value={formData.asr}
                                onChange={(e) => setFormData({ ...formData, asr: e.target.value })}
                                className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-2">المغرب</label>
                            <input
                                type="time"
                                value={formData.maghrib}
                                onChange={(e) => setFormData({ ...formData, maghrib: e.target.value })}
                                className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-2">العشاء</label>
                            <input
                                type="time"
                                value={formData.isha}
                                onChange={(e) => setFormData({ ...formData, isha: e.target.value })}
                                className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={handleAddPrayerTime}
                            className="flex-1 bg-primary-500 hover:bg-primary-600 text-white rounded-lg px-4 py-2 transition-colors"
                        >
                            إضافة
                        </button>
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-4 py-2 transition-colors"
                        >
                            إلغاء
                        </button>
                    </div>
                </div>
            )}

            {/* Prayer Times Table */}
            {prayerTimes.length > 0 && (
                <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold">جدول أوقات الصلاة ({prayerTimes.length} يوم)</h3>
                        <button
                            onClick={() => setShowExportModal(true)}
                            className="bg-primary-500 hover:bg-primary-600 text-white rounded-lg px-4 py-2 flex items-center gap-2 transition-colors"
                        >
                            <Download size={18} />
                            <span>تصدير ICS</span>
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="text-right p-2">التاريخ</th>
                                    <th className="text-right p-2">الفجر</th>
                                    <th className="text-right p-2">الشروق</th>
                                    <th className="text-right p-2">الظهر</th>
                                    <th className="text-right p-2">العصر</th>
                                    <th className="text-right p-2">المغرب</th>
                                    <th className="text-right p-2">العشاء</th>
                                    <th className="text-center p-2">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prayerTimes.map((pt) => (
                                    <tr key={pt.date} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                        <td className="p-2">{pt.date}</td>
                                        <td className="p-2">{pt.fajr}</td>
                                        <td className="p-2">{pt.sunrise}</td>
                                        <td className="p-2">{pt.dhuhr}</td>
                                        <td className="p-2">{pt.asr}</td>
                                        <td className="p-2">{pt.maghrib}</td>
                                        <td className="p-2">{pt.isha}</td>
                                        <td className="p-2">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEditPrayerTime(pt)}
                                                    className="text-blue-400 hover:text-blue-300 p-1"
                                                    title="تعديل"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePrayerTime(pt.date)}
                                                    className="text-red-400 hover:text-red-300 p-1"
                                                    title="حذف"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingPrayerTime && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4">تعديل أوقات الصلاة - {editingPrayerTime.date}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm mb-2">الفجر</label>
                                <input
                                    type="time"
                                    value={editFormData.fajr}
                                    onChange={(e) => setEditFormData({ ...editFormData, fajr: e.target.value })}
                                    className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-2">الشروق</label>
                                <input
                                    type="time"
                                    value={editFormData.sunrise}
                                    onChange={(e) => setEditFormData({ ...editFormData, sunrise: e.target.value })}
                                    className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-2">الظهر</label>
                                <input
                                    type="time"
                                    value={editFormData.dhuhr}
                                    onChange={(e) => setEditFormData({ ...editFormData, dhuhr: e.target.value })}
                                    className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-2">العصر</label>
                                <input
                                    type="time"
                                    value={editFormData.asr}
                                    onChange={(e) => setEditFormData({ ...editFormData, asr: e.target.value })}
                                    className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-2">المغرب</label>
                                <input
                                    type="time"
                                    value={editFormData.maghrib}
                                    onChange={(e) => setEditFormData({ ...editFormData, maghrib: e.target.value })}
                                    className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-2">العشاء</label>
                                <input
                                    type="time"
                                    value={editFormData.isha}
                                    onChange={(e) => setEditFormData({ ...editFormData, isha: e.target.value })}
                                    className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleSaveEdit}
                                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white rounded-lg px-4 py-2 transition-colors"
                            >
                                حفظ التعديلات
                            </button>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingPrayerTime(null);
                                }}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-4 py-2 transition-colors"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4">إعدادات التصدير</h3>

                        {/* Date Selection */}
                        <div className="mb-6">
                            <h4 className="font-bold mb-3">اختيار الأيام</h4>
                            <label className="flex items-center gap-2 mb-3">
                                <input
                                    type="checkbox"
                                    checked={selectAllDates}
                                    onChange={(e) => {
                                        setSelectAllDates(e.target.checked);
                                        if (e.target.checked) {
                                            setSelectedDates([]);
                                        }
                                    }}
                                    className="w-4 h-4"
                                />
                                <span>تحديد الكل ({prayerTimes.length} يوم)</span>
                            </label>

                            {!selectAllDates && (
                                <div className="bg-slate-700 rounded-lg p-4 max-h-60 overflow-y-auto">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {prayerTimes.map((pt) => (
                                            <label key={pt.date} className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDates.includes(pt.date)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedDates([...selectedDates, pt.date]);
                                                        } else {
                                                            setSelectedDates(selectedDates.filter(d => d !== pt.date));
                                                        }
                                                    }}
                                                    className="w-3 h-3"
                                                />
                                                <span>{pt.date}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Prayer Selection */}
                        <div className="mb-6">
                            <h4 className="font-bold mb-3">اختيار الصلوات</h4>
                            <div className="space-y-2">
                                {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).map((prayer) => (
                                    <label key={prayer} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={exportSettings.selectedPrayers.includes(prayer)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setExportSettings({
                                                        ...exportSettings,
                                                        selectedPrayers: [...exportSettings.selectedPrayers, prayer]
                                                    });
                                                } else {
                                                    setExportSettings({
                                                        ...exportSettings,
                                                        selectedPrayers: exportSettings.selectedPrayers.filter(p => p !== prayer)
                                                    });
                                                }
                                            }}
                                            className="w-4 h-4"
                                        />
                                        <span>{prayerNames[prayer]}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Notification Settings */}
                        <div className="mb-6">
                            <h4 className="font-bold mb-3">إعدادات التنبيهات</h4>
                            <div className="space-y-3">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={exportSettings.notifyAtAdhan}
                                        onChange={(e) => setExportSettings({ ...exportSettings, notifyAtAdhan: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                    <span>تنبيه عند الأذان</span>
                                </label>

                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={exportSettings.notifyBeforeAdhan}
                                        onChange={(e) => setExportSettings({ ...exportSettings, notifyBeforeAdhan: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                    <span>تنبيه قبل الأذان</span>
                                </label>

                                {exportSettings.notifyBeforeAdhan && (
                                    <div className="mr-6">
                                        <label className="block text-sm mb-2">دقائق قبل الأذان</label>
                                        <input
                                            type="number"
                                            value={exportSettings.minutesBeforeAdhan}
                                            onChange={(e) => setExportSettings({ ...exportSettings, minutesBeforeAdhan: parseInt(e.target.value) || 15 })}
                                            className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            min="1"
                                            max="60"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-slate-700 rounded-lg p-4 mb-4">
                            <p className="text-sm text-slate-300">
                                سيتم تصدير: <strong>{selectAllDates ? prayerTimes.length : selectedDates.length}</strong> يوم
                                {' × '}
                                <strong>{exportSettings.selectedPrayers.length}</strong> صلاة
                                {' = '}
                                <strong>
                                    {(selectAllDates ? prayerTimes.length : selectedDates.length) * exportSettings.selectedPrayers.length}
                                </strong> حدث
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleExport}
                                disabled={exportSettings.selectedPrayers.length === 0 || (!selectAllDates && selectedDates.length === 0)}
                                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white rounded-lg px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                تصدير ICS
                            </button>
                            <button
                                onClick={() => {
                                    setShowExportModal(false);
                                    setSelectedDates([]);
                                    setSelectAllDates(true);
                                }}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-4 py-2 transition-colors"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
