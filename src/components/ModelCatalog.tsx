// ModelCatalog - Apple-inspired minimal table
import { CheckCircle2, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ModelCatalog = () => {
    const { t } = useTranslation();
    
    const models = [
        { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', input: '$0.005', output: '$0.015', status: 'Optimal' },
        { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', input: '$0.015', output: '$0.075', status: 'Optimal' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', input: '$0.003', output: '$0.010', status: 'High Traffic' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', input: '$0.010', output: '$0.030', status: 'Optimal' },
    ];

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
                                {models.map((model, index) => (
                                    <tr 
                                        key={model.id} 
                                        className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors duration-300 animate-fade-in"
                                        style={{animationDelay: `${index * 0.05}s`}}
                                    >
                                        <td className="px-8 py-5">
                                            <div className="font-mono text-sm text-white">{model.id}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="text-sm text-white/70">{model.provider}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="font-mono text-sm text-white/70">{model.input}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="font-mono text-sm text-white/70">{model.output}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="inline-flex items-center gap-2 text-sm text-white/70">
                                                {model.status === 'Optimal' ? (
                                                    <CheckCircle2 size={16} className="text-green-400" />
                                                ) : (
                                                    <TrendingUp size={16} className="text-amber-400" />
                                                )}
                                                {model.status === 'Optimal' ? t('models.statusOptimal') : t('models.statusHighTraffic')}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default ModelCatalog;
