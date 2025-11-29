import type { ReactNode } from 'react';
import Header from './Header';
import BottomNav from './layout/BottomNav';


interface LayoutProps {
    children: ReactNode;
    darkMode?: boolean;
    onToggleDarkMode?: () => void;
}

export default function Layout({
    children,
    darkMode,
    onToggleDarkMode
}: LayoutProps) {
    return (
        <div>
            <div className="min-h-screen bg-slate-900 text-white">
                <Header />

                <main className="pt-16 pb-24 px-0">
                    <div className="max-w-screen-xl mx-auto">
                        {children}
                    </div>
                </main>

                <BottomNav />
            </div>
        </div>
    );
}
