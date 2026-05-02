import { type CSSProperties, useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, CreditCard, LogOut, Settings, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { bloomxRadix } from '../lib/radixPalette';
import LanguageSwitcher from './LanguageSwitcher';
import HeroScrollNarrative from './HeroScrollNarrative';
import { FadeIn } from './ui';

interface HeroLandingProps {
  onDashboardEnter?: () => void;
}

const HeroLanding = ({ onDashboardEnter }: HeroLandingProps) => {
  const { i18n } = useTranslation();
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const isZh = i18n.language?.startsWith('zh');

  const copy = isZh
    ? {
        navFeatures: '交易机制',
        navModels: '模型供给',
        navMarket: '市场',
        navPricing: '定价',
        roleAdmin: '管理员',
        roleSeller: '商家',
        roleUser: '用户',
        account: '账户中心',
        settings: '设置',
        signOut: '退出',
        eyebrow: '模型 API 能力交易市场',
        headline: 'BloomX',
        subtitle: '从访问网站到第一次模型调用。',
        primary: '进入 BloomX 控制台',
        secondary: '查看模型供给',
        rail: '滚动推进分镜',
      }
    : {
        navFeatures: 'Mechanism',
        navModels: 'Supply',
        navMarket: 'Market',
        navPricing: 'Pricing',
        roleAdmin: 'Admin',
        roleSeller: 'Merchant',
        roleUser: 'User',
        account: 'Account center',
        settings: 'Settings',
        signOut: 'Sign out',
        eyebrow: 'Model API capacity exchange',
        headline: 'BloomX',
        subtitle: 'From domain visit to first model call.',
        primary: 'Open BloomX Console',
        secondary: 'View Model Supply',
        rail: 'Scroll to move the story',
      };

  const heroVars = {
    '--hero-canvas': bloomxRadix.canvas,
    '--hero-surface': bloomxRadix.surface,
    '--hero-line': bloomxRadix.surfaceLine,
    '--hero-text': bloomxRadix.text,
    '--hero-muted': bloomxRadix.textMuted,
    '--hero-mint': bloomxRadix.mintStrong,
    '--hero-mint-soft': bloomxRadix.mintSoft,
    '--hero-coin': bloomxRadix.coinStrong,
    '--hero-bronze': bloomxRadix.bronzeStrong,
  } as CSSProperties;

  useEffect(() => {
    if (!currentUser) setShowUserMenu(false);
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
    if (role === 'admin') return copy.roleAdmin;
    if (role === 'seller') return copy.roleSeller;
    return copy.roleUser;
  };

  return (
    <>
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[#293027]/12 bg-[#f6f2ea]/78 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <button
              className="flex items-center gap-2 text-left"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="BloomX home"
            >
              <span className="relative grid h-8 w-8 place-items-center rounded-full border border-[#293027]/12 bg-white/50" style={heroVars}>
                <span className="h-2.5 w-2.5 rounded-full bg-[#8d9f78]" />
              </span>
              <span className="text-lg font-semibold tracking-tight text-[#171c16]">BloomX</span>
            </button>

            <div className="hidden items-center gap-7 text-sm md:flex">
              <button onClick={() => scrollToSection('features')} className="text-[#293027]/72 hover:text-[#171c16]">
                {copy.navFeatures}
              </button>
              <button onClick={() => scrollToSection('models')} className="text-[#293027]/72 hover:text-[#171c16]">
                {copy.navModels}
              </button>
              <Link to="/marketplace" className="text-[#293027]/72 hover:text-[#171c16]">
                {copy.navMarket}
              </Link>
              <button onClick={() => scrollToSection('pricing')} className="text-[#293027]/72 hover:text-[#171c16]">
                {copy.navPricing}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <LanguageSwitcher />

              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex min-h-11 items-center gap-2 rounded-full border border-[#293027]/14 bg-[#f6f2ea]/72 px-3.5 text-[#171c16] shadow-[0_10px_35px_rgba(32,37,31,0.08)] hover:bg-[#f6f2ea]/90"
                  >
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="Avatar" className="h-6 w-6 rounded-full" />
                    ) : (
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-[#8d9f78]/18 text-[#637151]">
                        <User size={14} />
                      </span>
                    )}
                    <span className="hidden max-w-[9rem] truncate text-sm font-medium sm:block">
                      {currentUser.displayName || currentUser.email?.split('@')[0] || copy.roleUser}
                    </span>
                  </button>

                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-[#293027]/10 bg-[#f6f2ea]/95 shadow-[0_24px_70px_rgba(32,37,31,0.18)] backdrop-blur-xl">
                        <div className="border-b border-[#293027]/10 p-4">
                          <div className="truncate text-sm font-medium text-[#20251f]">{currentUser.email}</div>
                          <div className="mt-1 text-xs text-[#293027]/64">{roleLabel(userProfile?.role)}</div>
                          {userProfile?.credits !== undefined && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-[#637151]">
                              <CreditCard size={13} />
                              {userProfile.credits} Credits
                            </div>
                          )}
                        </div>
                        <div className="py-1.5">
                          <button onClick={handleDashboard} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#293027]/82 hover:bg-white/44">
                            <User size={16} />
                            {copy.account}
                          </button>
                          <button
                            onClick={() => {
                              navigate('/dashboard');
                              setShowUserMenu(false);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#293027]/82 hover:bg-white/44"
                          >
                            <Settings size={16} />
                            {copy.settings}
                          </button>
                          <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-700 hover:bg-red-500/10">
                            <LogOut size={16} />
                            {copy.signOut}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  onClick={onDashboardEnter}
                  className="min-h-11 rounded-full bg-[#171c16] px-4 text-sm font-semibold text-[#f6f2ea] shadow-[0_14px_40px_rgba(32,37,31,0.16)] hover:bg-[#293027] active:scale-[0.98]"
                >
                  {copy.primary}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <section
        data-screen-label="01 Hero"
        className="relative isolate min-h-[620dvh] px-5 pt-16 sm:px-6 lg:px-10"
        style={heroVars}
      >
        <div className="sticky top-0 grid min-h-[100dvh] items-center overflow-hidden py-20">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(246,242,234,0.82),rgba(246,242,234,0.42)_38%,rgba(246,242,234,0.05)_100%)]" />
          <HeroScrollNarrative />

          <div className="mx-auto grid w-full max-w-7xl items-center self-start pt-[16dvh]">
            <div className="max-w-3xl">
              <FadeIn delay={80} direction="up">
                <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-[#293027]/14 bg-[#f6f2ea]/72 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#293027]/72 shadow-[0_16px_44px_rgba(32,37,31,0.08)] backdrop-blur-xl">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8d9f78]" />
                  {copy.eyebrow}
                </div>
              </FadeIn>

              <FadeIn delay={150} direction="up">
                <h1 className="max-w-[12ch] text-6xl font-semibold leading-[0.9] tracking-[-0.075em] text-[#111610] [text-shadow:0_2px_36px_rgba(246,242,234,0.92)] sm:text-7xl lg:text-8xl">
                  {copy.headline}
                </h1>
              </FadeIn>

              <FadeIn delay={240} direction="up">
                <p className="mt-7 max-w-md text-base font-medium leading-8 text-[#293027]/80 [text-shadow:0_1px_24px_rgba(246,242,234,0.94)] sm:text-lg">
                  {copy.subtitle}
                </p>
              </FadeIn>

              <FadeIn delay={330} direction="up">
                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={onDashboardEnter}
                    className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#171c16] px-7 text-sm font-semibold text-[#f6f2ea] shadow-[0_18px_48px_rgba(32,37,31,0.18)] hover:bg-[#293027] active:scale-[0.98]"
                  >
                    <span>{copy.primary}</span>
                    <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                  <button
                    onClick={() => scrollToSection('models')}
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#293027]/16 bg-[#f6f2ea]/76 px-7 text-sm font-semibold text-[#1f241e] shadow-[0_16px_44px_rgba(32,37,31,0.08)] backdrop-blur-xl hover:bg-[#f6f2ea]/94 active:scale-[0.98]"
                  >
                    {copy.secondary}
                  </button>
                </div>
              </FadeIn>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-7 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full bg-[#f6f2ea]/58 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#293027]/60 backdrop-blur-xl sm:flex">
            <ArrowDown size={15} />
            {copy.rail}
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroLanding;
