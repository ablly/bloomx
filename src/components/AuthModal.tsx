import { useState, useEffect } from 'react';
import { X, Mail, Globe, Ghost, Loader2, ArrowRight, Eye, EyeOff, Shield, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { sendEmailVerificationCode } from '../services/captchaService';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
    const { login, register, loginWithGoogle, loginAnonymously, resetPassword } = useAuth();
    const { t, i18n } = useTranslation();
    const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sendingCode, setSendingCode] = useState(false);
    const [codeSent, setCodeSent] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // 倒计时效果
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // 重置状态当模式改变
    useEffect(() => {
        setVerificationCode('');
        setCodeSent(false);
        setCountdown(0);
        setError('');
        setSuccess('');
    }, [mode]);

    if (!isOpen) return null;

    // 发送验证码
    const handleSendCode = async () => {
        if (!email) {
            setError(i18n.language === 'zh' ? '请先输入邮箱' : 'Please enter email first');
            return;
        }

        // 简单的邮箱格式验证
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError(i18n.language === 'zh' ? '邮箱格式不正确' : 'Invalid email format');
            return;
        }

        setSendingCode(true);
        setError('');
        
        try {
            const result = await sendEmailVerificationCode(email);
            if (result.success) {
                setCodeSent(true);
                setCountdown(60); // 60 秒倒计时
                setSuccess(i18n.language === 'zh' 
                    ? '验证码已发送到您的邮箱，请查收（有效期 10 分钟）' 
                    : 'Verification code sent to your email (valid for 10 minutes)');
                
                // 3 秒后清除成功消息
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(result.error || (i18n.language === 'zh' ? '发送失败' : 'Failed to send'));
            }
        } catch (err: any) {
            setError(err.message || (i18n.language === 'zh' ? '发送失败' : 'Failed to send'));
        } finally {
            setSendingCode(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        
        try {
            if (mode === 'reset') {
                const result = await resetPassword(email);
                if (result.success) {
                    setSuccess(i18n.language === 'zh' 
                        ? '密码重置邮件已发送，请检查您的邮箱' 
                        : 'Password reset email sent. Please check your inbox');
                    setTimeout(() => {
                        setMode('login');
                        setSuccess('');
                    }, 3000);
                } else if (result.error) {
                    setError(i18n.language === 'zh' ? result.error.messageZh : result.error.message);
                }
            } else {
                const result = mode === 'login' 
                    ? await login(email, password)
                    : await register(email, password, verificationCode);
                
                if (result.success) {
                    console.log('✅ 登录成功！', result.user);
                    setSuccess(i18n.language === 'zh' ? '登录成功！' : 'Login successful!');
                    // 延迟关闭，让用户看到成功消息，AuthContext 会自动更新 UI
                    setTimeout(() => {
                        onClose();
                        setEmail('');
                        setPassword('');
                        setVerificationCode('');
                        setSuccess('');
                    }, mode === 'register' ? 2000 : 800);
                } else if (result.error) {
                    setError(i18n.language === 'zh' ? result.error.messageZh : result.error.message);
                }
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const result = await loginWithGoogle();
            if (result.success) {
                console.log('✅ Google 登录成功！', result.user);
                setSuccess(i18n.language === 'zh' ? '登录成功！' : 'Login successful!');
                setTimeout(() => {
                    onClose();
                }, 800);
            } else if (result.error) {
                setError(i18n.language === 'zh' ? result.error.messageZh : result.error.message);
            }
        } catch (err: any) {
            setError(err.message || 'Google sign-in failed');
        } finally {
            setLoading(false);
        }
    };

    const handleAnon = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const result = await loginAnonymously();
            if (result.success) {
                console.log('✅ 匿名登录成功！', result.user);
                setSuccess(i18n.language === 'zh' ? '登录成功！' : 'Login successful!');
                setTimeout(() => {
                    onClose();
                }, 800);
            } else if (result.error) {
                setError(i18n.language === 'zh' ? result.error.messageZh : result.error.message);
            }
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
                            {mode === 'reset' ? (i18n.language === 'zh' ? '重置密码' : 'Reset Password') : 
                             mode === 'login' ? t('auth.signIn') : t('auth.signUp')}
                        </h2>
                        <p className="text-white/50 text-sm mt-2">
                            {mode === 'reset' 
                                ? (i18n.language === 'zh' ? '输入您的邮箱地址，我们将发送重置链接' : 'Enter your email to receive a reset link')
                                : mode === 'login'
                                ? 'Sign in to access your BloomX dashboard'
                                : 'Get 100 free credits when you sign up'}
                        </p>
                    </div>

                    {/* Social logins - hide in reset mode */}
                    {mode !== 'reset' && (
                        <>
                            <div className="space-y-3 mb-6">
                                <button
                                    onClick={handleGoogle}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-sm font-medium disabled:opacity-50"
                                >
                                    <Globe size={18} />
                                    {t('auth.signInWithGoogle')}
                                </button>
                                <button
                                    onClick={handleAnon}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-sm font-medium disabled:opacity-50"
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
                        </>
                    )}

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

                        {/* 验证码输入框 - 仅在注册模式显示 */}
                        {mode === 'register' && (
                            <div>
                                <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">
                                    {i18n.language === 'zh' ? '验证码' : 'Verification Code'}
                                </label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                        <input
                                            type="text"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            required
                                            maxLength={6}
                                            placeholder="123456"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 text-sm transition"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSendCode}
                                        disabled={sendingCode || countdown > 0}
                                        className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-xs font-medium disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5"
                                    >
                                        {sendingCode ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : countdown > 0 ? (
                                            <>
                                                <Clock size={14} />
                                                {countdown}s
                                            </>
                                        ) : (
                                            i18n.language === 'zh' ? '发送验证码' : 'Send Code'
                                        )}
                                    </button>
                                </div>
                                {codeSent && !success && (
                                    <p className="text-xs text-violet-400 mt-1.5">
                                        {i18n.language === 'zh' 
                                            ? '✓ 验证码已发送，请查看控制台（开发环境）' 
                                            : '✓ Code sent, check console (dev mode)'}
                                    </p>
                                )}
                            </div>
                        )}

                        {mode !== 'reset' && (
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
                        )}

                        {error && (
                            <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="text-green-400 text-xs bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                                {success}
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
