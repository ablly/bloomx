// Testimonials - Apple-inspired minimal testimonials
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Testimonials = () => {
    const { t } = useTranslation();
    
    const testimonials = [
        {
            name: 'Alex Chen',
            role: 'CTO, NexusAI',
            quote: t('testimonials.quote1'),
            avatar: 'AC',
        },
        {
            name: 'Sarah Kim',
            role: 'Lead Engineer, Synthwave Labs',
            quote: t('testimonials.quote2'),
            avatar: 'SK',
        },
        {
            name: 'Marcus Wright',
            role: 'Founder, DataForge',
            quote: t('testimonials.quote3'),
            avatar: 'MW',
        },
    ];

    return (
        <section id="testimonials" className="relative py-32 px-6">
            <div className="max-w-7xl mx-auto">

                {/* Section header */}
                <div className="max-w-3xl mb-20 text-center mx-auto">
                    <h2 className="text-5xl md:text-6xl font-semibold text-white mb-6 tracking-tight">
                        {t('testimonials.title')}
                    </h2>
                </div>

                {/* Testimonials grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {testimonials.map((t, index) => (
                        <div 
                            key={t.name} 
                            className="p-10 rounded-3xl glass-apple hover:bg-white/5 transition-all duration-600 hover-lift cursor-default animate-fade-in"
                            style={{animationDelay: `${index * 0.1}s`}}
                        >
                            {/* Stars */}
                            <div className="flex gap-1 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} className="text-white/30 fill-white/30" />
                                ))}
                            </div>

                            {/* Quote */}
                            <p className="text-base text-white/70 leading-relaxed mb-8">
                                "{t.quote}"
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-3 pt-6 border-t border-white/5">
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-sm font-medium text-white/60">
                                    {t.avatar}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white">{t.name}</div>
                                    <div className="text-xs text-white/40">{t.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
};

export default Testimonials;
