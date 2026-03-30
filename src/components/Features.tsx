// Features - Apple-inspired minimal cards
import { Network, ShieldCheck, Zap, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FadeIn, TiltCard } from './ui';

const Features = () => {
    const { t } = useTranslation();
    
    const features = [
        {
            icon: Network,
            title: t('features.routing.title'),
            desc: t('features.routing.description'),
        },
        {
            icon: ShieldCheck,
            title: t('features.verified.title'),
            desc: t('features.verified.description'),
        },
        {
            icon: Zap,
            title: t('features.compatible.title'),
            desc: t('features.compatible.description'),
        },
        {
            icon: Activity,
            title: t('features.credits.title'),
            desc: t('features.credits.description'),
        },
    ];

    return (
        <section id="features" className="relative py-32 px-6">
            <div className="max-w-7xl mx-auto">
                
                {/* Section header with massive whitespace */}
                <div className="max-w-3xl mb-20">
                    <h2 className="text-5xl md:text-6xl font-semibold text-white mb-6 tracking-tight">
                        {t('features.title')}
                    </h2>
                    <p className="text-xl text-white/50 leading-relaxed">
                        {t('features.subtitle')}
                    </p>
                </div>

                {/* Feature grid - clean cards with tilt effect */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <FadeIn key={feature.title} delay={index * 100} direction="up">
                                <TiltCard maxTilt={5}>
                                    <div className="group p-10 rounded-3xl glass-apple hover:bg-white/5 transition-all duration-600 cursor-default">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors duration-400">
                                            <Icon size={24} className="text-white/80" />
                                        </div>
                                        <h3 className="text-2xl font-semibold text-white mb-3">
                                            {feature.title}
                                        </h3>
                                        <p className="text-base text-white/50 leading-relaxed">
                                            {feature.desc}
                                        </p>
                                    </div>
                                </TiltCard>
                            </FadeIn>
                        );
                    })}
                </div>

            </div>
        </section>
    );
};

export default Features;
