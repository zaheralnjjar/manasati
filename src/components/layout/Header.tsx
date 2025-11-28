import { Moon, Sun, Mic } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function Header() {
    const { settings, toggleTheme, isVoiceActive, setVoiceActive } = useAppStore();

    return (
        <header className="fixed top-0 left-0 right-0 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700 z-50">
            <div className="max-w-screen-xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">م</span>
                        </div>
                        <h1 className="text-xl font-bold text-white">منصتي</h1>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* Voice Assistant Button */}
                        <button
                            onClick={() => setVoiceActive(!isVoiceActive)}
                            className={`
                p-2 rounded-lg transition-all duration-200
                ${isVoiceActive
                                    ? 'bg-primary-500 text-white animate-pulse'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }
              `}
                            aria-label="المساعد الصوتي"
                        >
                            <Mic size={20} />
                        </button>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                            aria-label="تبديل الوضع"
                        >
                            {settings.theme === 'dark' ? (
                                <Sun size={20} className="text-yellow-400" />
                            ) : (
                                <Moon size={20} className="text-slate-300" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
