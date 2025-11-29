import { useState, useEffect } from 'react';
import { Download, Clock, Calendar, Globe, Edit2, Trash2, Settings, Share2 } from 'lucide-react';
import type { PrayerTime, PrayerSettings } from '../../types';
import { storage } from '../../utils/storage';
import { getNextPrayer, getCurrentPrayer, getTimeUntil, getTimeSince, formatTime, prayerNames } from '../../utils/prayerHelpers';
import { generateICS, downloadICS } from '../../utils/icsExport';
import { fetchCurrentMonthPrayerTimes, fetchNextMonthPrayerTimes, CALCULATION_METHODS, CALCULATION_METHOD_NAMES } from '../../utils/aladhanApi';
import { useSpiritualStore } from '../../store/useSpiritualStore';
import HolidaysList, { HOLIDAYS_2025 } from './HolidaysList';
import { getToday } from '../../utils/dateHelpers';

export default function PrayerSection() {
    // Use global store instead of local state
    const { prayerTimes, setPrayerTimes } = useSpiritualStore();
    const [showAddForm, setShowAddForm] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPrayerTime, setEditingPrayerTime] = useState<PrayerTime | null>(null);
    const [activeTab, setActiveTab] = useState<'prayers' | 'holidays'>('prayers');

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

    const handleShareDay = async (pt: PrayerTime) => {
        const text = `🕌 أوقات الصلاة ليوم ${new Date(pt.date).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}:\n\n` +
            `الفجر: ${pt.fajr}\n` +
            `الشروق: ${pt.sunrise}\n` +
            `الظهر: ${pt.dhuhr}\n` +
            `العصر: ${pt.asr}\n` +
            `المغرب: ${pt.maghrib}\n` +
            `العشاء: ${pt.isha}\n\n` +
            `تمت المشاركة عبر تطبيق منصتي`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `أوقات الصلاة - ${pt.date}`,
                    text: text,
                });
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    await navigator.clipboard.writeText(text);
                    alert('تم نسخ الأوقات إلى الحافظة');
                }
            }
        } else {
            await navigator.clipboard.writeText(text);
            alert('تم نسخ الأوقات إلى الحافظة');
        }
    };

    return (
        <div className="p-0 md:p-4 max-w-4xl mx-auto space-y-2">
            <h1 className="text-xl md:text-2xl font-bold mb-2 text-center">أوقات الصلاة</h1>

            {/* Top Counters (Single Row) */}
            <div className="grid grid-cols-2 gap-2 mb-2">
                {/* Next Prayer */}
                <div className="bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-xl p-3 border border-primary-500/30 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Clock size={16} className="text-primary-500" />
                        <span className="text-xs text-primary-300">القادمة: {nextPrayer ? prayerNames[nextPrayer.prayer] : '-'}</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-0.5" dir="ltr">{timeUntilNext || '--:--'}</div>
                    <div className="text-[10px] text-slate-400">{nextPrayer ? formatTime(nextPrayer.time) : ''}</div>
                </div>

                {/* Current Prayer */}
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-3 border border-green-500/30 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Clock size={16} className="text-green-500" />
                        <span className="text-xs text-green-300">الحالية: {currentPrayer ? prayerNames[currentPrayer.prayer] : '-'}</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-0.5" dir="ltr">{timeSinceCurrent || '--:--'}</div>
                    <div className="text-[10px] text-slate-400">{currentPrayer ? formatTime(currentPrayer.time) : ''}</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-800 rounded-xl p-1 mb-2 border border-slate-700">
                <button
                    onClick={() => setActiveTab('prayers')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'prayers' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                        }`}
                >
                    أوقات الصلاة
                </button>
                <button
                    onClick={() => setActiveTab('holidays')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'holidays' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                        }`}
                >
                    العطل الرسمية
                </button>
            </div>

            {/* Content Area */}
            {activeTab === 'prayers' ? (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Calculation Method & Fetch Controls (Collapsible or Compact) */}
                    <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <Settings size={16} className="text-slate-400" />
                                <select
                                    value={calculationMethod}
                                    onChange={(e) => handleMethodChange(Number(e.target.value))}
                                    className="bg-slate-700 text-white text-xs rounded px-2 py-1.5 flex-1 focus:outline-none border border-slate-600"
                                >
                                    {Object.entries(CALCULATION_METHOD_NAMES).map(([value, name]) => (
                                        <option key={value} value={value}>{name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleFetchOnline(0)}
                                    disabled={isFetchingOnline}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded px-3 py-2 flex items-center justify-center gap-1 transition-colors"
                                >
                                    <Globe size={14} />
                                    <span>{isFetchingOnline ? '...' : 'الشهر الحالي'}</span>
                                </button>
                                <button
                                    onClick={() => handleFetchOnline(1)}
                                    disabled={isFetchingOnline}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded px-3 py-2 flex items-center justify-center gap-1 transition-colors"
                                >
                                    <Calendar size={14} />
                                    <span>{isFetchingOnline ? '...' : 'الشهر القادم'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Prayer Times Table */}
                    {prayerTimes.length > 0 ? (
                        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                            <div className="flex items-center justify-between p-2 border-b border-slate-700 bg-slate-750">
                                <h3 className="text-sm font-bold text-white">الجدول ({prayerTimes.length} يوم)</h3>
                                <div className="flex gap-2">

                                    <button
                                        onClick={() => setShowExportModal(true)}
                                        className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
                                        title="تصدير"
                                    >
                                        <Download size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Add Form (Collapsible) */}
                            {showAddForm && (
                                <div className="p-2 border-b border-slate-700 bg-slate-700/30">
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="bg-slate-700 rounded px-2 py-1 text-xs text-white border border-slate-600" />
                                        <input type="time" value={formData.fajr} onChange={e => setFormData({ ...formData, fajr: e.target.value })} className="bg-slate-700 rounded px-2 py-1 text-xs text-white border border-slate-600" placeholder="الفجر" />
                                        <input type="time" value={formData.dhuhr} onChange={e => setFormData({ ...formData, dhuhr: e.target.value })} className="bg-slate-700 rounded px-2 py-1 text-xs text-white border border-slate-600" placeholder="الظهر" />
                                        <input type="time" value={formData.asr} onChange={e => setFormData({ ...formData, asr: e.target.value })} className="bg-slate-700 rounded px-2 py-1 text-xs text-white border border-slate-600" placeholder="العصر" />
                                        <input type="time" value={formData.maghrib} onChange={e => setFormData({ ...formData, maghrib: e.target.value })} className="bg-slate-700 rounded px-2 py-1 text-xs text-white border border-slate-600" placeholder="المغرب" />
                                        <input type="time" value={formData.isha} onChange={e => setFormData({ ...formData, isha: e.target.value })} className="bg-slate-700 rounded px-2 py-1 text-xs text-white border border-slate-600" placeholder="العشاء" />
                                    </div>
                                    <button onClick={handleAddPrayerTime} className="w-full bg-primary-600 hover:bg-primary-700 text-white text-xs py-1.5 rounded transition-colors">إضافة</button>
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs md:text-sm">
                                    <thead>
                                        <tr className="bg-slate-700/50 text-slate-300">
                                            <th className="p-1 text-right font-medium">اليوم</th>
                                            <th className="p-1 text-center font-medium">فجر</th>
                                            <th className="p-1 text-center font-medium">شروق</th>
                                            <th className="p-1 text-center font-medium">ظهر</th>
                                            <th className="p-1 text-center font-medium">عصر</th>
                                            <th className="p-1 text-center font-medium">مغرب</th>
                                            <th className="p-1 text-center font-medium">عشاء</th>
                                            <th className="p-1 text-center font-medium w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {prayerTimes.map((pt) => {
                                            const holiday = HOLIDAYS_2025.find(h => h.date === pt.date);
                                            const isTodayRow = pt.date === getToday();
                                            return (
                                                <tr key={pt.date} className={`hover:bg-slate-700/30 transition-colors ${isTodayRow ? 'bg-primary-900/10' : ''}`}>
                                                    <td className="p-1 whitespace-nowrap">
                                                        <div className={`font-bold ${isTodayRow ? 'text-primary-400' : 'text-slate-200'}`}>
                                                            {new Date(pt.date).getDate()}
                                                        </div>
                                                        <div className="text-[9px] text-slate-500">
                                                            {new Date(pt.date).toLocaleDateString('ar-SA', { weekday: 'short' })}
                                                        </div>
                                                        {holiday && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-0.5" title={holiday.name}></div>}
                                                    </td>
                                                    <td className="p-1 text-center font-mono text-slate-300">{pt.fajr}</td>
                                                    <td className="p-1 text-center font-mono text-slate-500 text-[10px]">{pt.sunrise}</td>
                                                    <td className="p-1 text-center font-mono text-slate-300">{pt.dhuhr}</td>
                                                    <td className="p-1 text-center font-mono text-slate-300">{pt.asr}</td>
                                                    <td className="p-1 text-center font-mono text-slate-300">{pt.maghrib}</td>
                                                    <td className="p-1 text-center font-mono text-slate-300">{pt.isha}</td>
                                                    <td className="p-1 text-center">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button onClick={() => handleShareDay(pt)} className="text-emerald-400 p-1 hover:bg-slate-700 rounded" title="مشاركة"><Share2 size={12} /></button>
                                                            <button onClick={() => handleEditPrayerTime(pt)} className="text-blue-400 p-1 hover:bg-slate-700 rounded"><Edit2 size={12} /></button>
                                                            <button onClick={() => handleDeletePrayerTime(pt.date)} className="text-red-400 p-1 hover:bg-slate-700 rounded"><Trash2 size={12} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500 bg-slate-800 rounded-xl border border-slate-700">
                            لا توجد أوقات صلاة. يرجى الجلب من الإنترنت.
                        </div>
                    )}
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <HolidaysList />
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingPrayerTime && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 rounded-lg p-6 max-w-sm w-full border border-slate-700 shadow-xl">
                        <h3 className="text-lg font-bold mb-4 text-center">تعديل {editingPrayerTime.date}</h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div><label className="text-xs text-slate-400 block mb-1">الفجر</label><input type="time" value={editFormData.fajr} onChange={(e) => setEditFormData({ ...editFormData, fajr: e.target.value })} className="w-full bg-slate-700 rounded px-2 py-1.5 text-white border border-slate-600" /></div>
                            <div><label className="text-xs text-slate-400 block mb-1">الشروق</label><input type="time" value={editFormData.sunrise} onChange={(e) => setEditFormData({ ...editFormData, sunrise: e.target.value })} className="w-full bg-slate-700 rounded px-2 py-1.5 text-white border border-slate-600" /></div>
                            <div><label className="text-xs text-slate-400 block mb-1">الظهر</label><input type="time" value={editFormData.dhuhr} onChange={(e) => setEditFormData({ ...editFormData, dhuhr: e.target.value })} className="w-full bg-slate-700 rounded px-2 py-1.5 text-white border border-slate-600" /></div>
                            <div><label className="text-xs text-slate-400 block mb-1">العصر</label><input type="time" value={editFormData.asr} onChange={(e) => setEditFormData({ ...editFormData, asr: e.target.value })} className="w-full bg-slate-700 rounded px-2 py-1.5 text-white border border-slate-600" /></div>
                            <div><label className="text-xs text-slate-400 block mb-1">المغرب</label><input type="time" value={editFormData.maghrib} onChange={(e) => setEditFormData({ ...editFormData, maghrib: e.target.value })} className="w-full bg-slate-700 rounded px-2 py-1.5 text-white border border-slate-600" /></div>
                            <div><label className="text-xs text-slate-400 block mb-1">العشاء</label><input type="time" value={editFormData.isha} onChange={(e) => setEditFormData({ ...editFormData, isha: e.target.value })} className="w-full bg-slate-700 rounded px-2 py-1.5 text-white border border-slate-600" /></div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleSaveEdit} className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded transition-colors">حفظ</button>
                            <button onClick={() => setShowEditModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded transition-colors">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 rounded-lg p-6 max-w-sm w-full border border-slate-700 shadow-xl">
                        <h3 className="text-lg font-bold mb-4 text-center">تصدير التقويم</h3>
                        {/* Simplified Export Options for Mobile */}
                        <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto">
                            {/* Notification Settings */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={exportSettings.notifyAtAdhan}
                                        onChange={(e) => setExportSettings({ ...exportSettings, notifyAtAdhan: e.target.checked })}
                                        className="rounded border-slate-600 bg-slate-700 text-primary-600"
                                    />
                                    تنبيه عند وقت الأذان
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={exportSettings.notifyBeforeAdhan}
                                        onChange={(e) => setExportSettings({ ...exportSettings, notifyBeforeAdhan: e.target.checked })}
                                        className="rounded border-slate-600 bg-slate-700 text-primary-600"
                                    />
                                    تنبيه قبل الأذان
                                </label>
                                {exportSettings.notifyBeforeAdhan && (
                                    <div className="mr-6">
                                        <select
                                            value={exportSettings.minutesBeforeAdhan}
                                            onChange={(e) => setExportSettings({ ...exportSettings, minutesBeforeAdhan: Number(e.target.value) })}
                                            className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                                        >
                                            <option value={5}>5 دقائق</option>
                                            <option value={10}>10 دقائق</option>
                                            <option value={15}>15 دقيقة</option>
                                            <option value={20}>20 دقيقة</option>
                                            <option value={30}>30 دقيقة</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-slate-700 my-2"></div>

                            {/* Prayers Selection */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 mb-2">الصلوات للتصدير</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => (
                                        <label key={p} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={exportSettings.selectedPrayers.includes(p as any)}
                                                onChange={(e) => {
                                                    const current = exportSettings.selectedPrayers;
                                                    const updated = e.target.checked
                                                        ? [...current, p as any]
                                                        : current.filter(x => x !== p);
                                                    setExportSettings({ ...exportSettings, selectedPrayers: updated });
                                                }}
                                                className="rounded border-slate-600 bg-slate-700 text-primary-600"
                                            />
                                            {prayerNames[p as keyof typeof prayerNames]}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-slate-700 my-2"></div>

                            {/* Date Selection */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-xs font-bold text-slate-400">الأيام ({selectAllDates ? 'الكل' : selectedDates.length})</h4>
                                    <button
                                        onClick={() => {
                                            if (selectAllDates) {
                                                setSelectAllDates(false);
                                                setSelectedDates([]);
                                            } else {
                                                setSelectAllDates(true);
                                            }
                                        }}
                                        className="text-xs text-primary-400 hover:text-primary-300"
                                    >
                                        {selectAllDates ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                                    </button>
                                </div>
                                {!selectAllDates && (
                                    <div className="max-h-32 overflow-y-auto space-y-1 bg-slate-900/50 p-2 rounded border border-slate-700">
                                        {prayerTimes.map(pt => (
                                            <label key={pt.date} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:bg-slate-800/50 p-1 rounded">
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
                                                    className="rounded border-slate-600 bg-slate-700 text-primary-600"
                                                />
                                                <span className="w-20">{pt.date}</span>
                                                <span className="text-slate-500">{new Date(pt.date).toLocaleDateString('ar-SA', { weekday: 'short' })}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button onClick={handleExport} className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                                <Download size={18} />
                                تصدير ملف التقويم (ICS)
                            </button>
                        </div>
                        <button onClick={() => setShowExportModal(false)} className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded transition-colors">إغلاق</button>
                    </div>
                </div>
            )}
        </div>
    );
}
