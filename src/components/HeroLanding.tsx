import { type CSSProperties, useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, CreditCard, LogOut, Settings, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { bloomxRadix } from '../lib/radixPalette';
import LanguageSwitcher from './LanguageSwitcher';
import HeroParticleTitle from './HeroParticleTitle';
import { FadeIn } from './ui';

interface HeroLandingProps {
  onDashboardEnter?: () => void;
}

const heroStages = {
  zh: [
    ['01', '提交供给', '商家提交模型 API、价格和结算规则。'],
    ['02', '平台测试', '连通性、兼容性和失败处理先过审。'],
    ['03', '用户调用', '用户用积分订阅并通过统一入口请求。'],
    ['04', '收益回流', '成功调用计入收入，失败调用留下退款记录。'],
  ],
  en: [
    ['01', 'Supply', 'Merchants submit model APIs, pricing, and settlement rules.'],
    ['02', 'Verification', 'Connectivity, compatibility, and failure handling are tested first.'],
    ['03', 'Calls', 'Users subscribe with credits and call through one endpoint.'],
    ['04', 'Settlement', 'Successful calls become revenue; failed calls leave refund records.'],
  ],
};

const HeroLanding = ({ onDashboardEnter }: HeroLandingProps) => {
  const { i18n } = useTranslation();
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const isZh = i18n.language?.startsWith('zh');
  const stages = isZh ? heroStages.zh : heroStages.en;

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
          'BloomX 把商家的模型接口变成可审核的供给，把用户的积分调用变成清晰的交易记录。滚动页面，就像沿着一枚能力货币穿过市场。',
        primary: '进入 BloomX 控制台',
        secondary: '查看模型供给',
        rail: '向下滚动探索交易路径',
        capsuleTitle: '交易路径',
        capsuleNote: '滚动会控制视频、3D 货币和场景透明度。',
        settlement: '结算闭环',
        settlementCopy: '测试通过才上架，成功才入账，失败必须可追溯。',
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
          'BloomX turns merchant endpoints into verified supply and user credits into inspectable call records. Scroll as if you are guiding one capacity token through the market.',
        primary: 'Open BloomX Console',
        secondary: 'View Model Supply',
        rail: 'Scroll to explore the trading route',
        capsuleTitle: 'Exchange route',
        capsuleNote: 'Scroll controls video, 3D currency, and scene opacity.',
        settlement: 'Settlement loop',
        settlementCopy: 'Only tested APIs list, only successful calls settle, and every failure is traceable.',
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
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,8,7,0.88),rgba(5,8,7,0.5)_45%,rgba(5,8,7,0.08)_100%)]" />

          <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,0.94fr)_minmax(390px,0.7fr)]">
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
                <p className="mt-7 max-w-2xl text-base leading-8 text-white/68 sm:text-lg">
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
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/14 bg-white/[0.055] px-7 text-sm font-semibold text-white/82 hover:bg-white/[0.1] active:scale-[0.98]"
                  >
                    {copy.secondary}
                  </button>
                </div>
              </FadeIn>
            </div>

            <FadeIn delay={260} direction="up">
              <aside className="relative hidden min-h-[580px] lg:block">
                <div className="absolute right-0 top-10 w-[26rem] rounded-[2rem] border border-white/12 bg-[#07100f]/54 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_30px_90px_rgba(0,0,0,0.34)] backdrop-blur-2xl">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-[var(--hero-bronze)]">{copy.capsuleTitle}</div>
                      <p className="mt-2 max-w-xs text-sm leading-6 text-white/52">{copy.capsuleNote}</p>
                    </div>
                    <span className="rounded-full border border-[var(--hero-mint)]/22 bg-[var(--hero-mint-soft)] px-3 py-1 text-xs font-semibold text-[var(--hero-mint)]">
                      live
                    </span>
                  </div>

                  <div className="space-y-3">
                    {stages.map(([num, title, detail], index) => (
                      <div
                        key={num}
                        className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3"
                        style={{ transform: `translateX(${index % 2 ? 18 : 0}px)` }}
                      >
                        <div className="font-mono text-xs text-[var(--hero-coin)]">{num}</div>
                        <div>
                          <div className="text-sm font-semibold text-white">{title}</div>
                          <div className="mt-1 text-xs leading-5 text-white/48">{detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 border-t border-white/10 pt-5">
                    <div className="text-sm font-semibold text-white">{copy.settlement}</div>
                    <p className="mt-2 text-xs leading-5 text-white/48">{copy.settlementCopy}</p>
                  </div>
                </div>
              </aside>
            </FadeIn>
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
