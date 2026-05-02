import { type CSSProperties, useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, CreditCard, LogOut, Settings, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { bloomxRadix } from '../lib/radixPalette';
import LanguageSwitcher from './LanguageSwitcher';
import HeroParticleTitle from './HeroParticleTitle';
import HeroWorkerShowcase from './HeroWorkerShowcase';
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
        headline: '能力成为资产',
        subtitle:
          'BloomX 把商家的模型接口变成可审核的供给，把用户的积分调用变成清晰的交易记录。测试、计价、结算和失败追踪都在同一条可信链路里完成。',
        primary: '进入 BloomX 控制台',
        secondary: '查看模型供给',
        rail: '向下滚动查看市场机制',
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
        headline: 'Capacity becomes signal',
        subtitle:
          'BloomX turns merchant endpoints into verified supply and user credits into inspectable call records. Testing, pricing, settlement, and failure tracking live on one trusted route.',
        primary: 'Open BloomX Console',
        secondary: 'View Model Supply',
        rail: 'Scroll to view the market mechanism',
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
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#050807]/58 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <button
              className="flex items-center gap-2 text-left"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="BloomX home"
            >
              <span className="relative grid h-8 w-8 place-items-center rounded-full border border-[var(--hero-coin)]/40 bg-[#f0bc61]/14" style={heroVars}>
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--hero-coin)]" />
              </span>
              <span className="text-lg font-semibold tracking-tight text-white">BloomX</span>
            </button>

            <div className="hidden items-center gap-7 text-sm md:flex">
              <button onClick={() => scrollToSection('features')} className="text-white/68 hover:text-white">
                {copy.navFeatures}
              </button>
              <button onClick={() => scrollToSection('models')} className="text-white/68 hover:text-white">
                {copy.navModels}
              </button>
              <Link to="/marketplace" className="text-white/68 hover:text-white">
                {copy.navMarket}
              </Link>
              <button onClick={() => scrollToSection('pricing')} className="text-white/68 hover:text-white">
                {copy.navPricing}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <LanguageSwitcher />

              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex min-h-11 items-center gap-2 rounded-full border border-white/14 bg-white/[0.07] px-3.5 text-white shadow-none hover:bg-white/[0.12]"
                  >
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="Avatar" className="h-6 w-6 rounded-full" />
                    ) : (
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--hero-mint-soft)] text-[var(--hero-mint)]" style={heroVars}>
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
                      <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-white/10 bg-[#07100f]/95 shadow-[0_24px_70px_rgba(0,0,0,0.42)] backdrop-blur-xl">
                        <div className="border-b border-white/10 p-4">
                          <div className="truncate text-sm font-medium text-white">{currentUser.email}</div>
                          <div className="mt-1 text-xs text-white/50">{roleLabel(userProfile?.role)}</div>
                          {userProfile?.credits !== undefined && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--hero-mint)]" style={heroVars}>
                              <CreditCard size={13} />
                              {userProfile.credits} Credits
                            </div>
                          )}
                        </div>
                        <div className="py-1.5">
                          <button onClick={handleDashboard} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white/82 hover:bg-white/6">
                            <User size={16} />
                            {copy.account}
                          </button>
                          <button onClick={() => { navigate('/dashboard'); setShowUserMenu(false); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white/82 hover:bg-white/6">
                            <Settings size={16} />
                            {copy.settings}
                          </button>
                          <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-300 hover:bg-red-500/10">
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
                  className="min-h-11 rounded-full bg-[#f1fff6] px-4 text-sm font-semibold text-[#07100f] shadow-[inset_0_1px_0_rgba(255,255,255,0.76)] hover:bg-white active:scale-[0.98]"
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
        className="relative isolate min-h-[138dvh] px-5 pt-16 sm:px-6 lg:px-10"
        style={heroVars}
      >
        <div className="sticky top-0 grid min-h-[100dvh] items-center overflow-hidden py-20">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,8,7,0.68),rgba(5,8,7,0.28)_45%,rgba(5,8,7,0.03)_100%)]" />

          <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(390px,0.68fr)]">
            <div className="max-w-4xl">
              <FadeIn delay={80} direction="up">
                <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-[var(--hero-coin)]/28 bg-[#f0bc61]/8 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--hero-coin)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--hero-mint)]" />
                  {copy.eyebrow}
                </div>
              </FadeIn>

              <FadeIn delay={150} direction="up">
                <HeroParticleTitle lines={[copy.headline]} ariaLabel={copy.headline} />
              </FadeIn>

              <FadeIn delay={240} direction="up">
                <p className="mt-7 max-w-2xl text-base leading-8 text-white/86 [text-shadow:0_2px_18px_rgba(0,0,0,0.55)] sm:text-lg">
                  {copy.subtitle}
                </p>
              </FadeIn>

              <FadeIn delay={330} direction="up">
                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={onDashboardEnter}
                    className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f1fff6] px-7 text-sm font-semibold text-[#07100f] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] hover:bg-white active:scale-[0.98]"
                  >
                    <span>{copy.primary}</span>
                    <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                  <button
                    onClick={() => scrollToSection('models')}
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/28 bg-white/[0.13] px-7 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-white/[0.18] active:scale-[0.98]"
                  >
                    {copy.secondary}
                  </button>
                </div>
              </FadeIn>
            </div>

            <HeroWorkerShowcase />
          </div>

          <div className="pointer-events-none absolute bottom-7 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-xs uppercase tracking-[0.16em] text-white/42 sm:flex">
            <ArrowDown size={15} />
            {copy.rail}
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroLanding;
