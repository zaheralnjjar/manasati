import { Home, BookOpen, CheckSquare, ShoppingCart, DollarSign, Settings } from 'lucide-react';
import { useAppStore, type PageType } from '../../store/useAppStore';

const navItems = [
    { id: 'dashboard' as PageType, icon: Home, label: 'الرئيسية' },
    { id: 'worship' as PageType, icon: BookOpen, label: 'عبادتي' },
    { id: 'tasks' as PageType, icon: CheckSquare, label: 'إنتاجية' },
    { id: 'shopping' as PageType, icon: ShoppingCart, label: 'تسوق' },
    { id: 'masari' as PageType, icon: DollarSign, label: 'مالية' },
    { id: 'settings' as PageType, icon: Settings, label: 'إعدادات' },
];

export default function BottomNav() {
    const { currentPage, setCurrentPage } = useAppStore();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-sm border-t border-slate-700 z-50">
            <div className="max-w-screen-xl mx-auto px-2">
                <div className="grid grid-cols-6 gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPage === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => setCurrentPage(item.id)}
                                className={`
                  flex flex-col items-center justify-center py-2 px-1 transition-all duration-200
                  ${isActive
                                        ? 'text-primary-500'
                                        : 'text-slate-400 hover:text-slate-200'
                                    }
                `}
                            >
                                <Icon
                                    size={20}
                                    className={`mb-1 ${isActive ? 'scale-110' : ''}`}
                                />
                                <span className="text-xs font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
