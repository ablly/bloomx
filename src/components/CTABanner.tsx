// CTABanner - Apple-inspired minimal CTA
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ShimmerButton, TypewriterText } from './ui';

interface CTABannerProps {
    onDashboardEnter?: () => void;
}

const CTABanner = ({ onDashboardEnter }: CTABannerProps) => {
    const { t } = useTranslation();
    
    return (
        <section className="relative py-32 px-6">
            <div className="max-w-4xl mx-auto text-center">
                
                {/* Headline */}
                <h2 className="text-5xl md:text-6xl font-semibold text-white mb-8 tracking-tight leading-tight">
                    <TypewriterText 
                        text={t('cta.title')}
                        speed={50}
                        showCursor={false}
                    />
                </h2>

                {/* Subtitle */}
                <p className="text-xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed">
                    {t('cta.subtitle')}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <ShimmerButton
                        onClick={onDashboardEnter}
                        className="group px-8 py-4 rounded-full bg-white text-black text-base font-medium hover:bg-white/90 transition-all duration-400 btn-apple flex items-center justify-center gap-2"
                        shimmerColor="rgba(0,0,0,0.1)"
                    >
                        <span>{t('cta.primaryButton')}</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </ShimmerButton>

                    <button
                        onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                        className="px-8 py-4 rounded-full glass-apple text-white text-base font-medium hover:bg-white/5 transition-all duration-400 btn-apple"
                    >
                        {t('cta.secondaryButton')}
                    </button>
                </div>

            </div>
        </section>
    );
};

export default CTABanner;
