import { useState, type ChangeEvent, type FormEvent } from 'react';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createSellerApplication } from '../services/sellerApplicationService';
import { useTranslation } from 'react-i18next';

const SellerApplyForm = () => {
    const { currentUser } = useAuth();
    const { t } = useTranslation();
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        provider: 'openai' as 'openai' | 'anthropic' | 'google' | 'mixed',
        capacity: ''
    });
    const [errorMsg, setErrorMsg] = useState('');

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        // Validation
        if (!formData.name || !formData.email || !formData.capacity) {
            setErrorMsg('All fields are required.');
            return;
        }
        if (!formData.email.includes('@')) {
            setErrorMsg('Please enter a valid email address.');
            return;
        }
        if (!currentUser) {
            setErrorMsg('You must be logged in to submit an application.');
            return;
        }

        const capacityNum = parseInt(formData.capacity);
        if (isNaN(capacityNum) || capacityNum < 100) {
            setErrorMsg('Capacity must be at least $100.');
            return;
        }

        setStatus('loading');

        try {
            await createSellerApplication({
                uid: currentUser.uid,
                name: formData.name,
                email: formData.email,
                provider: formData.provider,
                capacity: capacityNum,
            });
            setStatus('success');
        } catch (err: any) {
            console.error('Failed to submit application:', err);
            setErrorMsg(err.message || 'Failed to submit application. Please try again.');
            setStatus('error');
        }
    };

    return (
        <section id="apply" className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center p-6 py-24">
            <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-4xl md:text-5xl font-sans tracking-tight text-white mb-4">
                    {t('seller.title')} <span className="font-serif italic text-white/80">{t('seller.titleHighlight')}</span>
                </h2>
                <p className="text-white/60 text-lg max-w-lg mx-auto">
                    {t('seller.subtitle')}
                </p>
            </div>

            <div className="liquid-glass-strong w-full max-w-md rounded-3xl p-8 relative overflow-hidden transition-all duration-500 shadow-2xl">

                {/* Success State */}
                {status === 'success' ? (
                    <div className="flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-500 py-8">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-2xl font-semibold text-white">{t('seller.form.success')}</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                            {t('seller.form.successMessage', { email: formData.email })}
                        </p>
                        <button
                            onClick={() => setStatus('idle')}
                            className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm text-white transition-colors"
                        >
                            {t('seller.form.submitAnother')}
                        </button>
                    </div>
                ) : (
                    /* Form State */
                    <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
                        <div className="flex flex-col space-y-2 group">
                            <label className="text-xs font-medium text-white/50 uppercase tracking-widest group-focus-within:text-white transition-colors">{t('seller.form.entityName')}</label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder={t('seller.form.entityNamePlaceholder')}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:bg-white/5 transition-all"
                            />
                        </div>

                        <div className="flex flex-col space-y-2 group">
                            <label className="text-xs font-medium text-white/50 uppercase tracking-widest group-focus-within:text-white transition-colors">{t('seller.form.email')}</label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder={t('seller.form.emailPlaceholder')}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:bg-white/5 transition-all"
                            />
                        </div>

                        <div className="flex flex-col space-y-2 group">
                            <label className="text-xs font-medium text-white/50 uppercase tracking-widest group-focus-within:text-white transition-colors">{t('seller.form.provider')}</label>
                            <select
                                name="provider"
                                value={formData.provider}
                                onChange={handleChange}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/50 focus:bg-white/5 transition-all appearance-none"
                            >
                                <option value="openai" className="bg-neutral-900">{t('seller.form.providerOpenAI')}</option>
                                <option value="anthropic" className="bg-neutral-900">{t('seller.form.providerAnthropic')}</option>
                                <option value="google" className="bg-neutral-900">{t('seller.form.providerGoogle')}</option>
                                <option value="mixed" className="bg-neutral-900">{t('seller.form.providerMixed')}</option>
                            </select>
                        </div>

                        <div className="flex flex-col space-y-2 group">
                            <label className="text-xs font-medium text-white/50 uppercase tracking-widest group-focus-within:text-white transition-colors">{t('seller.form.capacity')}</label>
                            <input
                                name="capacity"
                                type="number"
                                value={formData.capacity}
                                onChange={handleChange}
                                placeholder={t('seller.form.capacityPlaceholder')}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:bg-white/5 transition-all"
                            />
                        </div>

                        {errorMsg && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg animate-in fade-in duration-300">
                                <AlertCircle size={16} />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <button
                            disabled={status === 'loading'}
                            className="w-full bg-white hover:bg-white/90 active:scale-[0.98] transition-all duration-300 rounded-xl py-3.5 flex items-center justify-center gap-2 text-black font-semibold mt-4 disabled:opacity-50 disabled:pointer-events-none hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] group"
                        >
                            {status === 'loading' ? (
                                <>
                                    <Loader2 size={18} className="animate-spin text-black/50" />
                                    <span>{t('seller.form.submitting')}</span>
                                </>
                            ) : (
                                <>
                                    <span>{t('seller.form.submit')}</span>
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <p className="text-center text-[10px] text-white/40 mt-4 leading-relaxed">
                            {t('seller.form.terms')}
                        </p>
                    </form>
                )}
            </div>
        </section>
    );
};

export default SellerApplyForm;
