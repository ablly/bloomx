import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Clock, Eye, EyeOff, Ghost, Globe, Loader2, Mail, Shield, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const authCopy = {
  zh: {
    resetTitle: '重置密码',
    resetSubtitle: '输入邮箱地址，我们会发送重置链接。',
    loginSubtitle: '登录后进入 BloomX 控制台，管理积分、订阅和商家 API。',
    registerSubtitle: '注册后获得 100 积分，并通过邮箱验证码启用账号。',
    enterEmail: '请先输入邮箱',
    invalidEmail: '邮箱格式不正确',
    codeSent: '验证码已发送到你的邮箱，有效期 10 分钟。',
    codeSentInline: '验证码已发送，请检查收件箱和垃圾邮件。',
    sendFailed: '验证码发送失败，请稍后重试',
    resetSent: '密码重置邮件已发送，请检查邮箱。',
    success: '登录成功',
    registerSuccess: '注册成功',
    verificationCode: '验证码',
    sendCode: '发送验证码',
    passwordPlaceholder: '至少 6 位密码',
    togglePassword: '切换密码可见性',
    genericError: '操作失败，请稍后重试',
    googleFailed: 'Google 登录失败',
    anonymousFailed: '匿名登录失败',
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
    togglePassword: 'Toggle password visibility',
    genericError: 'Operation failed. Please try again.',
    googleFailed: 'Google sign-in failed',
    anonymousFailed: 'Anonymous sign-in failed',
  },
};

const inputClassName =
  'w-full rounded-xl bg-[#071514]/92 border border-emerald-200/25 text-white placeholder:text-white/36 caret-emerald-200 focus:outline-none focus:border-emerald-200/65 focus:ring-2 focus:ring-emerald-200/15 text-sm transition shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]';

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
      const { sendEmailVerificationCode } = await import('../services/captchaService');
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
      setError(err instanceof Error ? err.message : c.genericError);
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
      setError(err instanceof Error ? err.message : c.googleFailed);
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
      setError(err instanceof Error ? err.message : c.anonymousFailed);
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'reset' ? c.resetTitle : mode === 'login' ? t('auth.signIn') : t('auth.signUp');
  const subtitle = mode === 'reset' ? c.resetSubtitle : mode === 'login' ? c.loginSubtitle : c.registerSubtitle;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      <div className="absolute inset-0 bg-[#050808]/82 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#07100f] to-[#111118] shadow-2xl">
        <div className="absolute -top-20 left-1/2 h-40 w-60 -translate-x-1/2 rounded-full bg-emerald-400/16 blur-3xl pointer-events-none" />
        <button onClick={onClose} className="absolute top-4 right-4 z-10 text-white/50 hover:text-white transition" aria-label={t('common.close')}>
          <X size={20} />
        </button>

        <div className="relative p-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="mt-2 text-sm text-white/58">{subtitle}</p>
          </div>

          {mode !== 'reset' && (
            <>
              <div className="mb-6 space-y-3">
                <button onClick={handleGoogle} disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/12 bg-white/6 px-4 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10 disabled:opacity-50">
                  <Globe size={18} />
                  {t('auth.signInWithGoogle')}
                </button>
                <button onClick={handleAnon} disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/12 bg-white/6 px-4 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10 disabled:opacity-50">
                  <Ghost size={18} />
                  {t('auth.signInAnonymously')}
                </button>
              </div>
              <div className="mb-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs uppercase tracking-widest text-white/35">{t('auth.or')}</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/62">{t('auth.email')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45" />
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@company.com" className={`${inputClassName} py-3 pl-10 pr-4`} />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/62">{c.verificationCode}</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45" />
                    <input type="text" value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} required maxLength={6} placeholder="123456" className={`${inputClassName} py-3 pl-10 pr-4`} />
                  </div>
                  <button type="button" onClick={handleSendCode} disabled={sendingCode || countdown > 0} className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-white/12 bg-white/6 px-4 py-3 text-xs font-medium text-white/85 transition hover:bg-white/10 disabled:opacity-50">
                    {sendingCode ? <Loader2 size={14} className="animate-spin" /> : countdown > 0 ? <><Clock size={14} />{countdown}s</> : c.sendCode}
                  </button>
                </div>
                {codeSent && !success && <p className="mt-1.5 text-xs text-emerald-300">{c.codeSentInline}</p>}
              </div>
            )}

            {mode !== 'reset' && (
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/62">{t('auth.password')}</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} placeholder={c.passwordPlaceholder} className={`${inputClassName} py-3 pl-4 pr-10`} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 transition hover:text-white" aria-label={c.togglePassword}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {error && <div className="rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>}
            {success && <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-300">{success}</div>}

            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#07100f] transition hover:bg-white/90 disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>{mode === 'login' ? t('auth.signInButton') : t('auth.signUpButton')}<ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/45">
            {mode === 'login' ? t('auth.dontHaveAccount') : t('auth.alreadyHaveAccount')}{' '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="font-medium text-emerald-300 transition hover:text-emerald-200">
              {mode === 'login' ? t('auth.signUp') : t('auth.signIn')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
