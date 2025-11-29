import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { Mail, Lock, Loader2, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface QuickLoginProps {
    onClose: () => void;
}

export default function QuickLogin({ onClose }: QuickLoginProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const setSession = useAppStore(state => state.setSession);
    const setGuest = useAppStore(state => state.setGuest);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                if (data.session) {
                    setSession(data.session);
                    setGuest(false); // No longer a guest
                    onClose();
                }
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                if (data.session) {
                    setSession(data.session);
                    setGuest(false);
                    onClose();
                } else {
                    // Handle case where email confirmation is required
                    setError('يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب');
                }
            }
        } catch (err: any) {
            setError(err.message === 'Invalid login credentials' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="absolute top-full left-0 mt-2 w-72 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200" dir="rtl">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-sm">
                    {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
                </h3>
                <div className="flex bg-slate-900/50 rounded-lg p-0.5">
                    <button
                        onClick={() => setIsLogin(true)}
                        className={`px-3 py-1 text-xs rounded-md transition-all ${isLogin ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        دخول
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={`px-3 py-1 text-xs rounded-md transition-all ${!isLogin ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        جديد
                    </button>
                </div>
            </div>

            <form onSubmit={handleAuth} className="space-y-3">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2 rounded-lg text-xs flex items-center gap-1.5">
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="space-y-1">
                    <div className="relative">
                        <Mail className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 pr-8 pl-3 text-xs text-white focus:outline-none focus:border-primary-500 transition-colors placeholder:text-slate-600"
                            placeholder="البريد الإلكتروني"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="relative">
                        <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 pr-8 pl-3 text-xs text-white focus:outline-none focus:border-primary-500 transition-colors placeholder:text-slate-600"
                            placeholder="كلمة المرور"
                            required
                            minLength={6}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary-600 hover:bg-primary-500 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-primary-900/20 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <Loader2 className="animate-spin" size={14} />
                    ) : (
                        isLogin ? (
                            <>
                                <span>تسجيل الدخول</span>
                                <LogIn size={14} />
                            </>
                        ) : (
                            <>
                                <span>إنشاء حساب</span>
                                <UserPlus size={14} />
                            </>
                        )
                    )}
                </button>
            </form>
        </div>
    );
}
