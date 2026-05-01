import { ArrowRight, CreditCard, LogOut, Settings, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import { FadeIn } from './ui';
import HeroParticleTitle from './HeroParticleTitle';

interface HeroLandingProps {
  onDashboardEnter?: () => void;
}

const HeroLanding = ({ onDashboardEnter }: HeroLandingProps) => {
  const { t, i18n } = useTranslation();
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const isZh = i18n.language?.startsWith('zh');
  const heroLine = isZh ? '让模型能力变成可交易的货币价值' : 'Turn model capacity into traded value';

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
    if (role === 'admin') return isZh ? '管理员' : 'Admin';
    if (role === 'seller') return isZh ? '商家' : 'Merchant';
    return isZh ? '用户' : 'User';
  };

  return (
    <>
      <nav className="fixed left-0 right-0 top-0 z-50 glass-apple">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex cursor-pointer items-center gap-2" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white">
                <div className="h-2 w-2 rounded-full bg-black" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-white">BloomX</span>
            </div>

            <div className="hidden items-center gap-8 text-sm md:flex">
              <button onClick={() => scrollToSection('features')} className="text-white/70 transition-colors duration-300 hover:text-white">{t('nav.features')}</button>
              <button onClick={() => scrollToSection('models')} className="text-white/70 transition-colors duration-300 hover:text-white">{t('nav.models')}</button>
              <Link to="/marketplace" className="text-white/70 transition-colors duration-300 hover:text-white">{t('nav.marketplace')}</Link>
              <button onClick={() => scrollToSection('pricing')} className="text-white/70 transition-colors duration-300 hover:text-white">{t('nav.pricing')}</button>
            </div>

            <div className="flex items-center gap-3">
              <LanguageSwitcher />

              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 transition-all duration-300 hover:bg-white/20"
                  >
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="Avatar" className="h-6 w-6 rounded-full" />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#69e2a9] to-[#d76f37]">
                        <User size={14} className="text-white" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-white">
                      {currentUser.displayName || currentUser.email?.split('@')[0] || 'User'}
                    </span>
                  </button>

                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0f]/95 shadow-2xl backdrop-blur-xl">
                        <div className="border-b border-white/10 p-3">
                          <div className="truncate text-sm font-medium text-white">{currentUser.email}</div>
                          <div className="mt-1 text-xs text-white/50">{roleLabel(userProfile?.role)}</div>
                          {userProfile?.credits !== undefined && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-[#9be2c8]">
                              <CreditCard size={12} />
                              {userProfile.credits} Credits
                            </div>
                          )}
                        </div>
                        <div className="py-1">
                          <button onClick={handleDashboard} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/5">
                            <User size={16} />
                            {isZh ? '账户中心' : 'Account center'}
                          </button>
                          <button onClick={() => { navigate('/dashboard'); setShowUserMenu(false); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/5">
                            <Settings size={16} />
                            {t('dashboard.nav.settings')}
                          </button>
                          <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10">
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
                  className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-all duration-300 hover:bg-white/90"
                >
                  {t('hero.ctaPrimary')}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <section className="relative isolate min-h-[100dvh] overflow-hidden px-5 pb-16 pt-28 sm:px-6 lg:px-10">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,8,7,0.72),rgba(5,8,7,0.28)_48%,rgba(5,8,7,0.02)_100%)]" />

        <div className="mx-auto grid min-h-[calc(100dvh-9rem)] max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.8fr)]">
          <div className="max-w-4xl">
            <FadeIn delay={80} direction="up">
              <HeroParticleTitle lines={[heroLine]} ariaLabel={heroLine} />
            </FadeIn>

            <FadeIn delay={180} direction="up">
              <button
                onClick={onDashboardEnter}
                className="group mt-10 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#eefcf1] px-7 text-sm font-semibold text-[#07100f] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition hover:bg-white active:scale-[0.98]"
              >
                <span>{t('hero.ctaPrimary')}</span>
                <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </FadeIn>
          </div>

          <div className="relative hidden min-h-[520px] lg:block" aria-hidden="true">
            <div className="absolute bottom-24 right-8 h-72 w-72 rounded-full border border-[#f0c88f]/20 bg-[#f0c88f]/[0.035] backdrop-blur-sm" />
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroLanding;
