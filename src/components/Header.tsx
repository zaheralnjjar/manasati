import { Moon, Sun } from 'lucide-react';

interface HeaderProps {
    darkMode: boolean;
    onToggleDarkMode: () => void;
}

export default function Header({ darkMode, onToggleDarkMode }: HeaderProps) {
    return (
        <header className="fixed top-0 left-0 right-0 bg-slate-800 border-b border-slate-700 z-50">
            <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-xl">م</span>
                    </div>
                    <h1 className="text-xl font-bold text-white">منصتي</h1>
                </div>

                <button
                    onClick={onToggleDarkMode}
                    className="p-2 rounded-lg hover:bg-slate-700 transition-colors text-slate-300 hover:text-white"
                    aria-label="تبديل الوضع"
                >
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>
        </header>
    );
}
