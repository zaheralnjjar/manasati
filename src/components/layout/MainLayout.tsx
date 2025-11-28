import type { ReactNode } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';

interface MainLayoutProps {
    children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="min-h-screen bg-slate-900 text-slate-100">
            <Header />

            <main className="pt-16 pb-20 px-4 max-w-screen-xl mx-auto">
                <div className="py-4">
                    {children}
                </div>
            </main>

            <BottomNav />
        </div>
    );
}
