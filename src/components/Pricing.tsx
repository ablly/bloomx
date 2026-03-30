// Pricing - Apple-inspired minimal pricing cards
import { Check, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FadeIn, ShimmerButton } from './ui';

const Pricing = () => {
    const { t } = useTranslation();
    
    const plans = [
        {
            key: 'starter',
            name: t('pricing.starter.name'),
            desc: t('pricing.starter.desc'),
            price: t('pricing.starter.price'),
            credits: t('pricing.starter.credits'),
            features: [
                t('pricing.starter.feature1'),
                t('pricing.starter.feature2'),
                t('pricing.starter.feature3'),
            ],
        },
        {
            key: 'scale',
            name: t('pricing.scale.name'),
            desc: t('pricing.scale.desc'),
            price: t('pricing.scale.price'),
            credits: t('pricing.scale.credits'),
            bonus: t('pricing.scale.bonus'),
            featured: true,
            features: [
                t('pricing.scale.feature1'),
                t('pricing.scale.feature2'),
                t('pricing.scale.feature3'),
                t('pricing.scale.feature4'),
            ],
        },
    ];

    return (
        <section id="pricing" className="relative py-32 px-6">
            <div className="max-w-7xl mx-auto">

                {/* Section header */}
                <div className="max-w-3xl mb-20 text-center mx-auto">
                    <h2 className="text-5xl md:text-6xl font-semibold text-white mb-6 tracking-tight">
                        {t('pricing.title')}
                    </h2>
                    <p className="text-xl text-white/50 leading-relaxed">
                        {t('pricing.subtitle')}
                    </p>
                </div>

                {/* Pricing cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                    {plans.map((plan, index) => (
                        <FadeIn key={plan.key} delay={index * 150} direction="up">
                            <div 
                                className={`relative p-10 rounded-3xl transition-all duration-600 hover-lift cursor-default ${
                                    plan.featured 
                                        ? 'glass-apple-strong border-2 border-white/10' 
                                        : 'glass-apple'
                                }`}
                            >
                            {plan.featured && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold">
                                    {t('pricing.mostPopular')}
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-3xl font-semibold text-white mb-2">{plan.name}</h3>
                                <p className="text-white/40 text-sm">{plan.desc}</p>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-6xl font-semibold text-white">{plan.price}</span>
                                    <span className="text-white/40">{t('pricing.perTopUp')}</span>
                                </div>
                                <p className="text-white/60 text-sm">
                                    {plan.credits}
                                    {plan.bonus && <span className="text-white ml-2">({plan.bonus})</span>}
                                </p>
                            </div>

                            <ul className="space-y-4 mb-10">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3 text-white/70">
                                        <Check size={20} className="text-white/40 flex-shrink-0 mt-0.5" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <ShimmerButton 
                                className={`w-full py-4 rounded-full font-medium transition-all duration-400 btn-apple flex items-center justify-center gap-2 ${
                                    plan.featured
                                        ? 'bg-white text-black hover:bg-white/90'
                                        : 'glass-apple text-white hover:bg-white/5'
                                }`}
                                shimmerColor={plan.featured ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)'}
                            >
                                <span>{t('pricing.getStarted')}</span>
                                {plan.featured && <ArrowRight size={18} />}
                            </ShimmerButton>
                        </div>
                        </FadeIn>
                    ))}
                </div>

            </div>
        </section>
    );
};

export default Pricing;
