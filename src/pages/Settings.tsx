import { useState } from 'react';
import {
    Settings as SettingsIcon, Layout, Database, Download, Upload,
    Smartphone, ZoomIn
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { dbOperations, DB_KEYS } from '../utils/db';
import ContactsManager from '../components/whatsapp/ContactsManager';

export default function Settings() {
    const { settings, updateSettings, toggleWidget } = useAppStore();
    const [importStatus, setImportStatus] = useState<string>('');

    const handleExportData = async () => {
        try {
            const data: Record<string, any> = {};
            for (const key of Object.values(DB_KEYS)) {
                data[key] = await dbOperations.getData(key);
            }

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `minasati-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            alert('فشل تصدير البيانات');
        }
    };

    const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            for (const [key, value] of Object.entries(data)) {
                if (Object.values(DB_KEYS).includes(key as any)) {
                    await dbOperations.saveData(key, value);
                }
            }

            setImportStatus('تم استعادة البيانات بنجاح! يرجى إعادة تحميل التطبيق.');
            setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
            console.error('Import failed:', error);
            setImportStatus('فشل استيراد الملف. تأكد من صحة الملف.');
        }
    };

    const toggleNavVisibility = (key: keyof typeof settings.navVisibility) => {
        const current = settings.navVisibility;
        updateSettings({
            navVisibility: {
                ...current,
                [key]: !current[key]
            }
        });
    };

    return (
        <div className="p-4 max-w-4xl mx-auto pb-24 space-y-6">
            {/* Header */}
            <div className="bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-700">
                <h2 className="text-3xl font-bold flex items-center gap-3 text-white">
                    <SettingsIcon className="animate-spin-slow text-slate-400" size={32} />
                    <span>الإعدادات</span>
                </h2>
                <p className="text-slate-400 mt-2 text-sm">تخصيص تجربتك بالكامل</p>
            </div>

            {/* WhatsApp Contacts Section - NEW */}
            <ContactsManager />

            {/* Dashboard Widgets */}
            <section className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 pb-3 border-b border-slate-700">
                    <div className="p-2 bg-slate-900 rounded-lg">
                        <Layout size={24} className="text-blue-400" />
                    </div>
                    <span>أدوات لوحة التحكم</span>
                </h3>
                <div className="grid grid-cols-1 gap-3">
                    {[
                        { key: 'nextPrayer', label: 'الصلاة القادمة', icon: '🕌', color: 'text-emerald-400' },
                        { key: 'nextTask', label: 'المهام القادمة', icon: '✅', color: 'text-blue-400' },
                        { key: 'budget', label: 'الوضع المالي', icon: '💰', color: 'text-yellow-400' },
                        { key: 'readingProgress', label: 'القراءة الحالية', icon: '📖', color: 'text-purple-400' },
                    ].map(({ key, label, icon }) => (
                        <div
                            key={key}
                            className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl hover:bg-slate-900 transition-colors border border-slate-700/50"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{icon}</span>
                                <span className="text-slate-200 font-medium">{label}</span>
                            </div>
                            <button
                                onClick={() => toggleWidget(key as any)}
                                className={`w-14 h-7 rounded-full transition-all duration-300 relative ${settings.widgetVisibility[key as keyof typeof settings.widgetVisibility]
                                    ? 'bg-emerald-600'
                                    : 'bg-slate-700'
                                    }`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform duration-300 ${settings.widgetVisibility[key as keyof typeof settings.widgetVisibility]
                                    ? 'translate-x-8'
                                    : 'translate-x-1'
                                    } shadow-md`} />
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Bottom Navigation */}
            <section className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 pb-3 border-b border-slate-700">
                    <div className="p-2 bg-slate-900 rounded-lg">
                        <Smartphone size={24} className="text-purple-400" />
                    </div>
                    <span>القائمة السفلية</span>
                </h3>
                <div className="grid grid-cols-1 gap-3">
                    {[
                        { key: 'dashboard' as const, label: 'الرئيسية', icon: '🏠' },
                        { key: 'worship' as const, label: 'عبادتي', icon: '🕌' },
                        { key: 'tasks' as const, label: 'مهامي', icon: '✅' },
                        { key: 'masari' as const, label: 'مساري', icon: '🗺️' },
                        { key: 'shopping' as const, label: 'تسوق', icon: '🛒' },
                        { key: 'budget' as const, label: 'مالية', icon: '💰' },
                        { key: 'development' as const, label: 'تطوير', icon: '📚' },
                    ].map(({ key, label, icon }) => (
                        <div
                            key={key}
                            className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl hover:bg-slate-900 transition-colors border border-slate-700/50"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{icon}</span>
                                <span className="text-slate-200 font-medium">{label}</span>
                            </div>
                            <button
                                onClick={() => toggleNavVisibility(key)}
                                className={`w-14 h-7 rounded-full transition-all duration-300 relative ${settings.navVisibility[key]
                                    ? 'bg-emerald-600'
                                    : 'bg-slate-700'
                                    }`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform duration-300 ${settings.navVisibility[key] ? 'translate-x-8' : 'translate-x-1'
                                    } shadow-md`} />
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Ticker Speed */}
            <section className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 pb-3 border-b border-slate-700">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                        <ZoomIn size={24} className="text-orange-400" />
                    </div>
                    <span>سرعة الشريط المتحرك</span>
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <span className="text-slate-400 text-sm min-w-[60px]">بطيء</span>
                        <input
                            type="range"
                            min="10"
                            max="100"
                            value={settings.tickerSpeed}
                            onChange={(e) => updateSettings({ tickerSpeed: parseInt(e.target.value) })}
                            className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <span className="text-slate-400 text-sm min-w-[60px] text-right">سريع</span>
                    </div>
                    <div className="text-center">
                        <span className="inline-block px-4 py-2 bg-slate-700/50 rounded-lg text-primary-400 font-bold">
                            {settings.tickerSpeed}
                        </span>
                    </div>
                </div>
            </section>

            {/* Backup & Restore */}
            <section className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 pb-3 border-b border-slate-700">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                        <Database size={24} className="text-red-400" />
                    </div>
                    <span>النسخ الاحتياطي</span>
                </h3>
                <div className="space-y-4">
                    <button
                        onClick={handleExportData}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl"
                    >
                        <Download size={20} />
                        <span className="font-semibold">تصدير البيانات</span>
                    </button>

                    <label className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg hover:shadow-xl">
                        <Upload size={20} />
                        <span className="font-semibold">استيراد البيانات</span>
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImportData}
                            className="hidden"
                        />
                    </label>

                    {importStatus && (
                        <div className={`p-4 rounded-xl text-center font-medium ${importStatus.includes('نجاح')
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : 'bg-red-500/20 text-red-400 border border-red-500/50'
                            }`}>
                            {importStatus}
                        </div>
                    )}
                </div>
            </section>

            {/* Custom CSS for slider */}
            <style>{`
                .slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.5);
                }
                .slider::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.5);
                }
                @keyframes spin-slow {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
                .animate-spin-slow {
                    animation: spin-slow 20s linear infinite;
                }
            `}</style>
        </div>
    );
}
