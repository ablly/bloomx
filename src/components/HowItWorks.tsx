// HowItWorks - Apple-inspired minimal steps
import { UserPlus, CreditCard, Rocket } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const HowItWorks = () => {
    const { t } = useTranslation();
    
    const steps = [
        {
            num: '01',
            icon: UserPlus,
            title: t('howItWorks.step1.title'),
            desc: t('howItWorks.step1.description'),
        },
        {
            num: '02',
            icon: CreditCard,
            title: t('howItWorks.step2.title'),
            desc: t('howItWorks.step2.description'),
        },
        {
            num: '03',
            icon: Rocket,
            title: t('howItWorks.step3.title'),
            desc: t('howItWorks.step3.description'),
        },
    ];

    return (
        <section id="how-it-works" className="relative py-32 px-6 bg-white/[0.02]">
            <div className="max-w-7xl mx-auto">

                {/* Section header */}
                <div className="max-w-3xl mb-20 text-center mx-auto">
                    <h2 className="text-5xl md:text-6xl font-semibold text-white mb-6 tracking-tight">
                        {t('howItWorks.title')}
                    </h2>
                    <p className="text-xl text-white/50 leading-relaxed">
                        {t('howItWorks.subtitle')}
                    </p>
                </div>

                {/* Steps grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        return (
                            <div 
                                key={step.num} 
                                className="text-center animate-fade-in"
                                style={{animationDelay: `${index * 0.15}s`}}
                            >
                                {/* Icon */}
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass-apple mb-6">
                                    <Icon size={28} className="text-white/80" />
                                </div>

                                {/* Step number */}
                                <div className="text-sm font-mono text-white/30 mb-4">{step.num}</div>

                                {/* Title */}
                                <h3 className="text-2xl font-semibold text-white mb-4">
                                    {step.title}
                                </h3>

                                {/* Description */}
                                <p className="text-base text-white/50 leading-relaxed max-w-xs mx-auto">
                                    {step.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>

            </div>
        </section>
    );
};

export default HowItWorks;
