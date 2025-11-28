import { Eye, EyeOff, Bell, BellOff } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { WidgetVisibility } from '../../types';

export default function Settings() {
    const { settings, toggleWidget, updateSettings } = useAppStore();

    const widgets: { key: keyof WidgetVisibility; label: string }[] = [
        { key: 'nextPrayer', label: 'الصلاة القادمة' },
        { key: 'nextTask', label: 'المهمة القادمة' },
        { key: 'budget', label: 'الميزانية' },
        { key: 'readingProgress', label: 'تقدم القراءة' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <h2 className="text-2xl font-bold text-white">الإعدادات</h2>

            {/* Widget Visibility */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4">عرض الويدجت</h3>
                <div className="space-y-3">
                    {widgets.map((widget) => (
                        <div
                            key={widget.key}
                            className="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
                        >
                            <span className="text-white">{widget.label}</span>
                            <button
                                onClick={() => toggleWidget(widget.key)}
                                className={`
                  p-2 rounded-lg transition-colors
                  ${settings.widgetVisibility[widget.key]
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-slate-600 text-slate-400'
                                    }
                `}
                            >
                                {settings.widgetVisibility[widget.key] ? (
                                    <Eye size={20} />
                                ) : (
                                    <EyeOff size={20} />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Notifications */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4">الإشعارات</h3>
                <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                    <span className="text-white">تفعيل الإشعارات</span>
                    <button
                        onClick={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
                        className={`
              p-2 rounded-lg transition-colors
              ${settings.notificationsEnabled
                                ? 'bg-primary-500 text-white'
                                : 'bg-slate-600 text-slate-400'
                            }
            `}
                    >
                        {settings.notificationsEnabled ? (
                            <Bell size={20} />
                        ) : (
                            <BellOff size={20} />
                        )}
                    </button>
                </div>
            </div>

            {/* App Info */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4">معلومات التطبيق</h3>
                <div className="space-y-2 text-slate-300">
                    <p><span className="text-slate-400">الاسم:</span> منصتي - Minasati</p>
                    <p><span className="text-slate-400">الإصدار:</span> 1.0.0</p>
                    <p><span className="text-slate-400">النوع:</span> Progressive Web App (PWA)</p>
                    <p><span className="text-slate-400">اللغة:</span> العربية</p>
                </div>
            </div>

            {/* About */}
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-6 text-white">
                <h3 className="text-lg font-bold mb-2">عن التطبيق</h3>
                <p className="text-sm opacity-90">
                    منصتي هو تطبيق ويب تقدمي متكامل لتنظيم حياتك الروحية والمهنية والشخصية.
                    يوفر لك أدوات لإدارة أوقات الصلاة، المهام اليومية، قائمة التسوق، والميزانية الشهرية.
                </p>
            </div>
        </div>
    );
}
