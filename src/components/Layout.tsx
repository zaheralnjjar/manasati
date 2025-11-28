import type { ReactNode } from 'react';
import Header from './Header';
import BottomNav from './layout/BottomNav';


interface LayoutProps {
    children: ReactNode;
    darkMode: boolean;
    onToggleDarkMode: () => void;
}

export default function Layout({
    children,
    darkMode,
    onToggleDarkMode
}: LayoutProps) {
    return (
        <div className={darkMode ? 'dark' : ''}>
            <div className="min-h-screen bg-slate-900 text-white">
                <Header darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />

                <main className="pt-16 pb-20 px-4">
                    <div className="max-w-screen-xl mx-auto">
                        {children}
                    </div>
                </main>

                <BottomNav />
            </div>
        </div>
    );
}
