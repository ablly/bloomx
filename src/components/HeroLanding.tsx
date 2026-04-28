// HeroLanding - Apple-inspired minimal design
import { ArrowRight, Sparkles, User, LogOut, Settings, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import { FadeIn, GradientText, NumberTicker, ShimmerText } from './ui';

interface HeroLandingProps {
    onDashboardEnter?: () => void;
}

const HeroLanding = ({ onDashboardEnter }: HeroLandingProps) => {
    const { t, i18n } = useTranslation();
    const { currentUser, userProfile, logout } = useAuth();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);

    // 监听用户状态变化，自动关闭菜单
    useEffect(() => {
        if (!currentUser) {
            setShowUserMenu(false);
        }
    }, [currentUser]);

    const handleLogout = async () => {
        await logout();
        setShowUserMenu(false);
        window.location.reload();
    };

    const handleDashboard = () => {
        navigate('/dashboard');
        setShowUserMenu(false);
    };

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (!element) return;
        const top = element.getBoundingClientRect().top + window.scrollY - 88;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    };

    const roleLabel = (role?: string) => {
        const zh = i18n.language?.startsWith('zh');
        if (role === 'admin') return zh ? '管理员' : 'Admin';
        if (role === 'seller') return zh ? '商家' : 'Merchant';
        return zh ? '用户' : 'User';
    };
    
    return (
        <>
            {/* Minimal Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass-apple">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
                                <div className="w-2 h-2 bg-black rounded-full"></div>
                            </div>
                            <span className="font-semibold text-lg tracking-tight text-white">BloomX</span>
                        </div>

                        <div className="hidden md:flex items-center gap-8 text-sm">
                            <button onClick={() => scrollToSection('features')} className="text-white/70 hover:text-white transition-colors duration-300">{t('nav.features')}</button>
                            <button onClick={() => scrollToSection('models')} className="text-white/70 hover:text-white transition-colors duration-300">{t('nav.models')}</button>
                            <Link to="/marketplace" className="text-white/70 hover:text-white transition-colors duration-300">{t('nav.marketplace')}</Link>
                            <button onClick={() => scrollToSection('pricing')} className="text-white/70 hover:text-white transition-colors duration-300">{t('nav.pricing')}</button>
                        </div>

                        <div className="flex items-center gap-3">
                            <LanguageSwitcher />
                            
                            {currentUser ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 border border-white/20"
                                    >
                                        {currentUser.photoURL ? (
                                            <img src={currentUser.photoURL} alt="Avatar" className="w-6 h-6 rounded-full" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                                                <User size={14} className="text-white" />
                                            </div>
                                        )}
                                        <span className="text-sm text-white font-medium">
                                            {currentUser.displayName || currentUser.email?.split('@')[0] || 'User'}
                                        </span>
                                    </button>

                                    {showUserMenu && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                                            <div className="absolute right-0 mt-2 w-56 bg-[#0a0a0f]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                                                <div className="p-3 border-b border-white/10">
                                                    <div className="text-sm text-white font-medium truncate">{currentUser.email}</div>
                                                    <div className="text-xs text-white/50 mt-1">
                                                        {roleLabel(userProfile?.role)}
                                                    </div>
                                                    {userProfile?.credits !== undefined && (
                                                        <div className="text-xs text-violet-400 mt-1 flex items-center gap-1">
                                                            <CreditCard size={12} />
                                                            {userProfile.credits} Credits
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="py-1">
                                                    <button
                                                        onClick={handleDashboard}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors"
                                                    >
                                                        <User size={16} />
                                                        {i18n.language?.startsWith('zh') ? '个人中心' : 'Account center'}
                                                    </button>
                                                    <button
                                                        onClick={() => { navigate('/dashboard'); setShowUserMenu(false); }}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors"
                                                    >
                                                        <Settings size={16} />
                                                        {t('dashboard.nav.settings')}
                                                    </button>
                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                                    >
                                                        <LogOut size={16} />
                                                        {t('dashboard.nav.signOut')}
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={onDashboardEnter}
                                    className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-all duration-300 btn-apple"
                                >
                                    {t('hero.ctaPrimary')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section - Massive whitespace */}
            <section className="relative min-h-screen flex items-center justify-center px-6 pt-32 pb-20">
                <div className="max-w-5xl mx-auto text-center">
                    
                    {/* Small badge */}
                    <FadeIn delay={0}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-apple mb-8">
                            <Sparkles size={14} className="text-white/60" />
                            <span className="text-sm text-white/70">
                                <ShimmerText duration={3000}>
                                    {i18n.language?.startsWith('zh') ? 'BloomX 模型 API 交易市场' : 'BloomX Model API Marketplace'}
                                </ShimmerText>
                            </span>
                        </div>
                    </FadeIn>

                    {/* Massive headline with gradient */}
                    <FadeIn delay={100} direction="up">
                        <h1 className="text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight mb-6" style={{lineHeight: '1.05'}}>
                            <GradientText from="from-white" via="via-white/95" to="to-white/80">
                                {t('hero.title')}
                            </GradientText>
                        </h1>
                    </FadeIn>
                    
                    <FadeIn delay={200} direction="up">
                        <h2 className="text-6xl md:text-7xl lg:text-8xl font-light tracking-tight text-white/60 mb-12" style={{lineHeight: '1.05'}}>
                            {t('hero.titleHighlight')}
                        </h2>
                    </FadeIn>

                    {/* Subtitle with breathing room */}
                    <FadeIn delay={300}>
                        <p className="text-xl md:text-2xl text-white/50 max-w-3xl mx-auto mb-12 leading-relaxed">
                            {t('hero.subtitle')}
                        </p>
                    </FadeIn>

                    {/* CTA Buttons - minimal style */}
                    <FadeIn delay={400}>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button
                                onClick={onDashboardEnter}
                                className="group px-8 py-4 rounded-full bg-white text-black text-base font-medium hover:bg-white/90 transition-all duration-400 btn-apple flex items-center gap-2"
                            >
                                <span>{t('hero.ctaPrimary')}</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                            </button>

                            <button
                                onClick={() => scrollToSection('models')}
                                className="px-8 py-4 rounded-full glass-apple text-white text-base font-medium hover:bg-white/5 transition-all duration-400 btn-apple"
                            >
                                {t('hero.ctaSecondary')}
                            </button>
                        </div>
                    </FadeIn>

                    {/* Stats - with NumberTicker animation */}
                    <FadeIn delay={500}>
                        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-24">
                            <div className="text-center">
                                <div className="text-4xl font-semibold text-white mb-2">
                                    <NumberTicker value={247} duration={2000} />
                                </div>
                                <div className="text-sm text-white/40">{i18n.language?.startsWith('zh') ? '在售节点' : 'Listed nodes'}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-semibold text-white mb-2">
                                    <NumberTicker value={99.9} suffix="%" duration={2000} />
                                </div>
                                <div className="text-sm text-white/40">{i18n.language?.startsWith('zh') ? '测试通过率' : 'Test pass rate'}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-semibold text-white mb-2">
                                    <NumberTicker value={124} suffix="ms" duration={2000} />
                                </div>
                                <div className="text-sm text-white/40">{i18n.language?.startsWith('zh') ? '中位延迟' : 'Median latency'}</div>
                            </div>
                        </div>
                    </FadeIn>

                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float-subtle">
                    <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
                        <div className="w-1 h-2 bg-white/40 rounded-full"></div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default HeroLanding;
