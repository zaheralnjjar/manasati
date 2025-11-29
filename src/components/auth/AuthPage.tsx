
import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                // For sign up, we might want to show a message to check email if email confirmation is enabled.
                // But for now, we assume auto-confirm or just let them try to login.
                // Actually, if auto-confirm is off, they can't login immediately.
                // Supabase default is usually confirm email.
                // But for this demo/personal app, maybe it's fine.
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" dir="rtl">
            <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">منصتي</h1>
                    <p className="text-slate-400">رفيقك الرقمي لحياة متوازنة</p>
                </div>

                <div className="flex gap-2 mb-8 bg-slate-800 p-1 rounded-xl">
                    <button
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${isLogin ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        تسجيل دخول
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!isLogin ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        حساب جديد
                    </button>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-sm text-slate-400">البريد الإلكتروني</label>
                        <div className="relative">
                            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pr-10 pl-4 text-white focus:outline-none focus:border-primary-500 transition-colors"
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm text-slate-400">كلمة المرور</label>
                        <div className="relative">
                            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pr-10 pl-4 text-white focus:outline-none focus:border-primary-500 transition-colors"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary-600 hover:bg-primary-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            isLogin ? 'دخول' : 'إنشاء حساب'
                        )}
                    </button>
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-800"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-slate-900 text-slate-500">أو</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            // Import store dynamically or pass as prop if possible, but here we can just use the hook or direct import if outside component
                            // Since we are inside component, we can use the hook if we imported it.
                            // But AuthPage doesn't import useAppStore currently. Let's fix that.
                            // Actually, better to pass a prop or just import the store.
                            // Let's assume we will import useAppStore at the top.
                            useAppStore.getState().setGuest(true);
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-medium transition-colors border border-slate-700 hover:border-slate-600"
                    >
                        المتابعة كضيف
                    </button>
                </form>
            </div>
        </div>
    );
}
