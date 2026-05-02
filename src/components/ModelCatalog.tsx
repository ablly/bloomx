import { CheckCircle2, Clock3, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ModelStatus = 'recommended' | 'reviewing' | 'market';

const ModelCatalog = () => {
    const { i18n, t } = useTranslation();
    const isZh = i18n.language?.startsWith('zh');
    
    const models = [
        { id: 'gpt-5.5', provider: 'OpenAI', pricing: 'merchant', status: 'recommended' as ModelStatus },
        { id: 'claude-opus-4.6', provider: 'Anthropic', pricing: 'merchant', status: 'reviewing' as ModelStatus },
        { id: 'claude-opus-4.7', provider: 'Anthropic', pricing: 'merchant', status: 'reviewing' as ModelStatus },
        { id: 'deepseek-v4', provider: 'DeepSeek', pricing: 'market', status: 'market' as ModelStatus },
        { id: 'kimi-k2.6', provider: 'Moonshot AI', pricing: 'market', status: 'market' as ModelStatus },
    ];

    const pricingLabel = (pricing: string) => {
        if (pricing === 'merchant') return isZh ? '商家报价' : 'Merchant quote';
        return isZh ? '市场报价' : 'Market quote';
    };

    const statusMeta = (status: ModelStatus) => {
        if (status === 'recommended') {
            return {
                label: isZh ? '推荐接入' : 'Recommended',
                icon: <CheckCircle2 size={16} className="text-emerald-300" />,
            };
        }
        if (status === 'reviewing') {
            return {
                label: isZh ? '待验证' : 'Pending review',
                icon: <Clock3 size={16} className="text-sky-300" />,
            };
        }
        return {
            label: isZh ? '市场报价' : 'Market pricing',
            icon: <TrendingUp size={16} className="text-amber-300" />,
        };
    };

    return (
        <section id="models" className="relative py-32 px-6">
            <div className="max-w-7xl mx-auto">

                {/* Section header */}
                <div className="max-w-3xl mb-20">
                    <h2 className="text-5xl md:text-6xl font-semibold text-white mb-6 tracking-tight">
                        {t('models.title')}
                    </h2>
                    <p className="text-xl text-white/50 leading-relaxed">
                        {t('models.subtitle')}
                    </p>
                </div>

                {/* Table */}
                <div className="glass-apple rounded-3xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="text-left px-8 py-5 text-sm font-medium text-white/40">{t('models.tableHeaders.model')}</th>
                                    <th className="text-left px-8 py-5 text-sm font-medium text-white/40">{t('models.tableHeaders.provider')}</th>
                                    <th className="text-left px-8 py-5 text-sm font-medium text-white/40">{t('models.tableHeaders.input')}</th>
                                    <th className="text-left px-8 py-5 text-sm font-medium text-white/40">{t('models.tableHeaders.output')}</th>
                                    <th className="text-left px-8 py-5 text-sm font-medium text-white/40">{t('models.tableHeaders.status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {models.map((model, index) => {
                                    const status = statusMeta(model.status);
                                    const price = pricingLabel(model.pricing);

                                    return (
                                        <tr
                                            key={model.id}
                                            className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors duration-300 animate-fade-in"
                                            style={{ animationDelay: `${index * 0.05}s` }}
                                        >
                                            <td className="px-8 py-5">
                                                <div className="font-mono text-sm text-white">{model.id}</div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="text-sm text-white/70">{model.provider}</div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="font-mono text-sm text-white/70">{price}</div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="font-mono text-sm text-white/70">{price}</div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="inline-flex items-center gap-2 text-sm text-white/70">
                                                    {status.icon}
                                                    {status.label}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default ModelCatalog;
