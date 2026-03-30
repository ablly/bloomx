// HeroLanding - Apple-inspired minimal design
import { ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { FadeIn, GradientText, NumberTicker, ShimmerText } from './ui';

interface HeroLandingProps {
    onDashboardEnter?: () => void;
}

const HeroLanding = ({ onDashboardEnter }: HeroLandingProps) => {
    const { t } = useTranslation();
    
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
                            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-white/70 hover:text-white transition-colors duration-300">{t('nav.features')}</button>
                            <button onClick={() => document.getElementById('models')?.scrollIntoView({ behavior: 'smooth' })} className="text-white/70 hover:text-white transition-colors duration-300">Models</button>
                            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-white/70 hover:text-white transition-colors duration-300">{t('nav.pricing')}</button>
                        </div>

                        <div className="flex items-center gap-3">
                            <LanguageSwitcher />
                            <button
                                onClick={onDashboardEnter}
                                className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-all duration-300 btn-apple"
                            >
                                {t('hero.ctaPrimary')}
                            </button>
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
                                    Introducing BloomX Infrastructure
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
                                onClick={() => document.getElementById('models')?.scrollIntoView({ behavior: 'smooth' })}
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
                                <div className="text-sm text-white/40">Active Nodes</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-semibold text-white mb-2">
                                    <NumberTicker value={99.9} suffix="%" duration={2000} />
                                </div>
                                <div className="text-sm text-white/40">Uptime</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-semibold text-white mb-2">
                                    <NumberTicker value={124} suffix="ms" duration={2000} />
                                </div>
                                <div className="text-sm text-white/40">Response Time</div>
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
