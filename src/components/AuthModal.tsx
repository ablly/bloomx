import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Clock, Eye, EyeOff, Ghost, Globe, Loader2, Mail, Shield, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { sendEmailVerificationCode } from '../services/captchaService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const authCopy = {
  zh: {
    resetTitle: '重置密码',
    resetSubtitle: '输入邮箱地址，我们会发送重置链接。',
    loginSubtitle: '登录后进入 BloomX 控制台，管理积分、订阅和商家 API。',
    registerSubtitle: '注册后获得 100 积分，并可通过邮箱验证码启用账号。',
    enterEmail: '请先输入邮箱',
    invalidEmail: '邮箱格式不正确',
    codeSent: '验证码已发送到你的邮箱，有效期 10 分钟。',
    codeSentInline: '验证码已发送，请检查邮箱收件箱和垃圾邮件。',
    sendFailed: '验证码发送失败，请稍后重试',
    resetSent: '密码重置邮件已发送，请检查邮箱。',
    success: '登录成功',
    registerSuccess: '注册成功',
    verificationCode: '验证码',
    sendCode: '发送验证码',
    passwordPlaceholder: '至少 6 位密码',
  },
  en: {
    resetTitle: 'Reset Password',
    resetSubtitle: 'Enter your email and we will send a reset link.',
    loginSubtitle: 'Sign in to manage BloomX credits, subscriptions, and merchant APIs.',
    registerSubtitle: 'Create an account with 100 credits and verify it by email code.',
    enterEmail: 'Please enter your email first',
    invalidEmail: 'Invalid email format',
    codeSent: 'Verification code sent to your email. It is valid for 10 minutes.',
    codeSentInline: 'Code sent. Check your inbox and spam folder.',
    sendFailed: 'Failed to send verification code. Please try again.',
    resetSent: 'Password reset email sent. Please check your inbox.',
    success: 'Login successful',
    registerSuccess: 'Account created',
    verificationCode: 'Verification code',
    sendCode: 'Send code',
    passwordPlaceholder: 'At least 6 characters',
  },
};

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const { login, register, loginWithGoogle, loginAnonymously, resetPassword } = useAuth();
  const { t, i18n } = useTranslation();
  const language = i18n.language?.startsWith('zh') ? 'zh' : 'en';
  const c = authCopy[language];
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

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    setVerificationCode('');
    setCodeSent(false);
    setCountdown(0);
    setError('');
    setSuccess('');
  }, [mode]);

  if (!isOpen) return null;

  const handleSendCode = async () => {
    if (!email) {
      setError(c.enterEmail);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(c.invalidEmail);
      return;
    }

    setSendingCode(true);
    setError('');

    try {
      const result = await sendEmailVerificationCode(email);
      if (result.success) {
        setCodeSent(true);
        setCountdown(60);
        setSuccess(c.codeSent);
        window.setTimeout(() => setSuccess(''), 3500);
      } else {
        setError(result.error || c.sendFailed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : c.sendFailed);
    } finally {
      setSendingCode(false);
    }
  };

  const finishSuccess = (message: string, delay = 900) => {
    setSuccess(message);
    window.setTimeout(() => {
      onClose();
      setEmail('');
      setPassword('');
      setVerificationCode('');
      setSuccess('');
    }, delay);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'reset') {
        const result = await resetPassword(email);
        if (result.success) {
          setSuccess(c.resetSent);
          window.setTimeout(() => setMode('login'), 2500);
        } else if (result.error) {
          setError(language === 'zh' ? result.error.messageZh : result.error.message);
        }
        return;
      }

      const result = mode === 'login' ? await login(email, password) : await register(email, password, verificationCode);
      if (result.success) {
        finishSuccess(mode === 'register' ? c.registerSuccess : c.success, mode === 'register' ? 1500 : 800);
      } else if (result.error) {
        setError(language === 'zh' ? result.error.messageZh : result.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
        finishSuccess(c.success);
      } else if (result.error) {
        setError(language === 'zh' ? result.error.messageZh : result.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
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
        finishSuccess(c.success);
      } else if (result.error) {
        setError(language === 'zh' ? result.error.messageZh : result.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anonymous sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'reset' ? c.resetTitle : mode === 'login' ? t('auth.signIn') : t('auth.signUp');
  const subtitle = mode === 'reset' ? c.resetSubtitle : mode === 'login' ? c.loginSubtitle : c.registerSubtitle;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-gradient-to-b from-[#07100f] to-[#111118] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-40 bg-emerald-400/16 rounded-full blur-3xl pointer-events-none" />
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition z-10" aria-label={t('common.close')}>
          <X size={20} />
        </button>

        <div className="relative p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="text-white/55 text-sm mt-2">{subtitle}</p>
          </div>

          {mode !== 'reset' && (
            <>
              <div className="space-y-3 mb-6">
                <button onClick={handleGoogle} disabled={loading} className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white/6 border border-white/12 text-white/85 hover:bg-white/10 transition text-sm font-medium disabled:opacity-50">
                  <Globe size={18} />
                  {t('auth.signInWithGoogle')}
                </button>
                <button onClick={handleAnon} disabled={loading} className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white/6 border border-white/12 text-white/85 hover:bg-white/10 transition text-sm font-medium disabled:opacity-50">
                  <Ghost size={18} />
                  {t('auth.signInAnonymously')}
                </button>
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/35 text-xs uppercase tracking-widest">{t('auth.or')}</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-white/60 mb-1.5 uppercase tracking-wider">{t('auth.email')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45" />
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@company.com" className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#071514]/90 border border-emerald-200/20 text-white placeholder:text-white/35 caret-emerald-200 focus:outline-none focus:border-emerald-200/60 focus:ring-2 focus:ring-emerald-200/15 text-sm transition" />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs text-white/60 mb-1.5 uppercase tracking-wider">{c.verificationCode}</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45" />
                    <input type="text" value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} required maxLength={6} placeholder="123456" className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#071514]/90 border border-emerald-200/20 text-white placeholder:text-white/35 caret-emerald-200 focus:outline-none focus:border-emerald-200/60 focus:ring-2 focus:ring-emerald-200/15 text-sm transition" />
                  </div>
                  <button type="button" onClick={handleSendCode} disabled={sendingCode || countdown > 0} className="px-4 py-3 rounded-xl bg-white/6 border border-white/12 text-white/85 hover:bg-white/10 transition text-xs font-medium disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5">
                    {sendingCode ? <Loader2 size={14} className="animate-spin" /> : countdown > 0 ? <><Clock size={14} />{countdown}s</> : c.sendCode}
                  </button>
                </div>
                {codeSent && !success && <p className="text-xs text-emerald-300 mt-1.5">{c.codeSentInline}</p>}
              </div>
            )}

            {mode !== 'reset' && (
              <div>
                <label className="block text-xs text-white/60 mb-1.5 uppercase tracking-wider">{t('auth.password')}</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} placeholder={c.passwordPlaceholder} className="w-full pl-4 pr-10 py-3 rounded-xl bg-[#071514]/90 border border-emerald-200/20 text-white placeholder:text-white/35 caret-emerald-200 focus:outline-none focus:border-emerald-200/60 focus:ring-2 focus:ring-emerald-200/15 text-sm transition" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-white transition" aria-label="toggle password visibility">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {error && <div className="text-red-300 text-xs bg-red-500/10 border border-red-500/25 rounded-lg p-3">{error}</div>}
            {success && <div className="text-emerald-300 text-xs bg-emerald-500/10 border border-emerald-500/25 rounded-lg p-3">{success}</div>}

            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>{mode === 'login' ? t('auth.signInButton') : t('auth.signUpButton')}<ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-white/45 text-sm mt-6">
            {mode === 'login' ? t('auth.dontHaveAccount') : t('auth.alreadyHaveAccount')}{' '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="text-emerald-300 hover:text-emerald-200 font-medium transition">
              {mode === 'login' ? t('auth.signUp') : t('auth.signIn')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
