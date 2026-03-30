import { useState } from 'react';
import { X, Mail, Globe, Ghost, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
    const { login, register, loginWithGoogle, loginAnonymously } = useAuth();
    const { t } = useTranslation();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (mode === 'login') {
                await login(email, password);
            } else {
                await register(email, password);
            }
            onClose();
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setLoading(true);
        setError('');
        try {
            await loginWithGoogle();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Google sign-in failed');
        } finally {
            setLoading(false);
        }
    };

    const handleAnon = async () => {
        setLoading(true);
        setError('');
        try {
            await loginAnonymously();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Anonymous sign-in failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4 bg-gradient-to-b from-[#0a0a0f] to-[#111118] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                {/* Glow accent */}
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-40 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

                {/* Close */}
                <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition z-10">
                    <X size={20} />
                </button>

                <div className="relative p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white">
                            {mode === 'login' ? t('auth.signIn') : t('auth.signUp')}
                        </h2>
                        <p className="text-white/50 text-sm mt-2">
                            {mode === 'login'
                                ? 'Sign in to access your BloomX dashboard'
                                : 'Get 100 free credits when you sign up'}
                        </p>
                    </div>

                    {/* Social logins */}
                    <div className="space-y-3 mb-6">
                        <button
                            onClick={handleGoogle}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-sm font-medium"
                        >
                            <Globe size={18} />
                            {t('auth.signInWithGoogle')}
                        </button>
                        <button
                            onClick={handleAnon}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-sm font-medium"
                        >
                            <Ghost size={18} />
                            {t('auth.signInAnonymously')}
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-white/30 text-xs uppercase tracking-widest">{t('auth.or')}</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Email form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">{t('auth.email')}</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="you@company.com"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 text-sm transition"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">{t('auth.password')}</label>
                            <div className="relative">
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    placeholder="•  •  •  •  •  •  •  •"
                                    className="w-full pl-4 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 text-sm transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
                                >
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-sm hover:opacity-90 transition-all duration-300 disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    {mode === 'login' ? t('auth.signInButton') : t('auth.signUpButton')}
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Toggle mode */}
                    <p className="text-center text-white/40 text-sm mt-6">
                        {mode === 'login' ? t('auth.dontHaveAccount') : t('auth.alreadyHaveAccount')}
                        <button
                            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                            className="text-violet-400 hover:text-violet-300 font-medium transition"
                        >
                            {mode === 'login' ? t('auth.signUp') : t('auth.signIn')}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
