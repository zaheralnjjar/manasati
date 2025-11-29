import type { ReactNode } from 'react';
import Header from './Header';
import BottomNav from './layout/BottomNav';


interface LayoutProps {
    children: ReactNode;
}

export default function Layout({
    children,
}: LayoutProps) {
    return (
        <div>
            <div className="min-h-screen bg-slate-900 text-white">
                <Header />

                <main className="pt-16 pb-24 px-3 md:px-4">
                    <div className="max-w-screen-xl mx-auto">
                        {children}
                    </div>
                </main>

                <BottomNav />
            </div>
        </div>
    );
}
