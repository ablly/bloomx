import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Check,
  Copy,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { createApiKey, deleteApiKey, listApiKeys, type ApiKey } from '../services/apiKeyService';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const { currentUser, userProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const zh = i18n.language?.startsWith('zh');
  const [activeTab, setActiveTab] = useState('overview');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKeyFull, setNewKeyFull] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const navItems = [
    { id: 'overview', label: t('dashboard.nav.overview'), icon: LayoutDashboard },
    { id: 'keys', label: t('dashboard.nav.keys'), icon: KeyRound },
    { id: 'purchases', label: t('dashboard.nav.purchases'), icon: ShoppingBag },
    { id: 'usage', label: t('dashboard.nav.usage'), icon: Activity },
    { id: 'billing', label: t('dashboard.nav.billing'), icon: CreditCard },
    { id: 'settings', label: t('dashboard.nav.settings'), icon: Settings },
  ];

  useEffect(() => {
    if (activeTab !== 'keys' || !currentUser) return;
    setLoadingKeys(true);
    listApiKeys(currentUser.uid)
      .then(setApiKeys)
      .catch((error) => console.error('Failed to load API keys:', error))
      .finally(() => setLoadingKeys(false));
  }, [activeTab, currentUser]);

  const handleCreateKey = async () => {
    if (!currentUser) return;
    setCreatingKey(true);
    try {
      const { fullKey, record } = await createApiKey(currentUser.uid);
      setNewKeyFull(fullKey);
      setApiKeys((prev) => [record, ...prev]);
    } catch (error) {
      console.error('Failed to create API key:', error);
      window.alert(zh ? '创建 API 密钥失败，请稍后重试。' : 'Failed to create API key. Please try again.');
    } finally {
      setCreatingKey(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!currentUser) return;
    const ok = window.confirm(zh ? '确认删除这个 API 密钥？此操作不可撤销。' : 'Delete this API key? This cannot be undone.');
    if (!ok) return;
    await deleteApiKey(currentUser.uid, keyId);
    setApiKeys((prev) => prev.filter((key) => key.id !== keyId));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return t('dashboard.keys.never');
    return new Intl.DateTimeFormat(zh ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  };

  const overviewStats = [
    { label: t('dashboard.overview.totalRequests'), value: '0', note: zh ? '等待真实调用写入 Firebase' : 'Waiting for Firebase call records' },
    { label: t('dashboard.overview.avgLatency'), value: '--', note: t('dashboard.overview.p99') },
    { label: t('dashboard.overview.errorRate'), value: '0%', note: t('dashboard.overview.optimalHealth') },
  ];

  return (
    <div className="relative flex min-h-screen bg-[#070b0d] font-sans text-white">
      <aside className="flex w-64 flex-col justify-between border-r border-white/10 bg-[#070b0d]/78 p-6 backdrop-blur-xl">
        <div>
          <Link to="/" className="mb-12 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-bold text-[#070b0d]">B</div>
            <span className="text-xl font-semibold tracking-tight">BloomX</span>
          </Link>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition ${activeTab === item.id ? 'bg-white/12 text-white' : 'text-white/58 hover:bg-white/6 hover:text-white'}`}>
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
        <button onClick={onLogout} className="flex items-center gap-3 px-4 py-2 text-sm text-white/58 transition hover:text-white">
          <LogOut size={18} />
          {t('dashboard.nav.signOut')}
        </button>
      </aside>

      <main className="w-full max-w-6xl flex-1 overflow-y-auto p-10">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{navItems.find((item) => item.id === activeTab)?.label}</h1>
            <p className="mt-2 text-sm text-white/55">
              {zh ? '面向模型 API 订阅、调用和结算的个人中心。' : 'Account center for model API subscriptions, calls, and billing.'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <div className="text-xs uppercase tracking-widest text-white/50">{t('dashboard.header.credits')}</div>
              <div className="font-mono text-lg font-medium">{userProfile?.credits?.toFixed(2) || '0.00'}</div>
            </div>
            <button onClick={() => setActiveTab('billing')} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#070b0d] transition hover:bg-white/90">
              {t('dashboard.header.addFunds')}
            </button>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {overviewStats.map((stat) => (
                <div key={stat.label} className="liquid-glass rounded-2xl border border-white/10 p-6">
                  <div className="mb-2 text-xs uppercase tracking-widest text-white/50">{stat.label}</div>
                  <div className="mb-1 text-4xl font-medium">{stat.value}</div>
                  <div className="text-sm text-emerald-300">{stat.note}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="liquid-glass rounded-2xl border border-white/10 p-6 lg:col-span-2">
                <h3 className="mb-3 text-lg font-semibold">{zh ? '业务闭环' : 'Business loop'}</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    zh ? '商家测试 API 后上架' : 'Merchant tests and lists API',
                    zh ? '用户订阅并消耗积分' : 'User subscribes and spends credits',
                    zh ? '成功调用计入商家收入' : 'Successful calls become merchant revenue',
                  ].map((item) => (
                    <div key={item} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/72">{item}</div>
                  ))}
                </div>
              </div>
              <div className="liquid-glass rounded-2xl border border-white/10 p-6">
                <h3 className="mb-3 font-medium">{t('dashboard.overview.quickIntegration')}</h3>
                <p className="mb-4 text-sm text-white/58">{t('dashboard.overview.integrationDesc')}</p>
                <pre className="overflow-x-auto rounded-xl border border-white/10 bg-[#050808]/70 p-4 font-mono text-[11px] text-white/82">{`import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'bx_live_...',
  baseURL: 'https://api.bloomx.io/v1'
});

await client.chat.completions.create({
  model: 'merchant-model-id',
  messages: [{ role: 'user', content: 'Hello' }]
});`}</pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'keys' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-white/62">{t('dashboard.keys.description')}</p>
              <button onClick={handleCreateKey} disabled={creatingKey} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm hover:bg-white/20 disabled:opacity-50">
                <Plus size={16} />
                {creatingKey ? t('dashboard.keys.creating') : t('dashboard.keys.createNew')}
              </button>
            </div>
            {newKeyFull && (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/8 p-6">
                <div className="mb-4 flex items-start gap-3">
                  <Check size={20} className="mt-0.5 text-emerald-300" />
                  <div>
                    <h3 className="text-lg font-medium">{t('dashboard.keys.successTitle')}</h3>
                    <p className="text-sm text-white/62">{t('dashboard.keys.successDesc')}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#050808]/60 p-4">
                  <code className="break-all font-mono text-sm">{newKeyFull}</code>
                  <button onClick={() => handleCopy(newKeyFull)} aria-label="Copy API key">{copied ? <Check size={18} className="text-emerald-300" /> : <Copy size={18} />}</button>
                </div>
              </div>
            )}
            {loadingKeys ? (
              <div className="py-12 text-center text-white/50">{t('common.loading')}</div>
            ) : apiKeys.length === 0 ? (
              <div className="liquid-glass rounded-2xl border border-white/10 p-12 text-center">
                <KeyRound size={42} className="mx-auto mb-4 text-white/25" />
                <h3 className="mb-2 text-lg font-medium">{t('dashboard.keys.noKeys')}</h3>
                <p className="mb-6 text-sm text-white/50">{t('dashboard.keys.noKeysDesc')}</p>
                <button onClick={handleCreateKey} disabled={creatingKey} className="rounded-lg bg-white px-6 py-2 text-sm font-medium text-[#070b0d] disabled:opacity-50">{t('dashboard.keys.createFirst')}</button>
              </div>
            ) : (
              <div className="liquid-glass overflow-hidden rounded-2xl border border-white/10">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-xs uppercase text-white/50">
                      <th className="px-6 py-4">{t('dashboard.keys.tableHeaders.name')}</th>
                      <th className="px-6 py-4">{t('dashboard.keys.tableHeaders.key')}</th>
                      <th className="px-6 py-4">{t('dashboard.keys.tableHeaders.created')}</th>
                      <th className="px-6 py-4">{t('dashboard.keys.tableHeaders.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {apiKeys.map((key) => (
                      <tr key={key.id} className="hover:bg-white/5">
                        <td className="px-6 py-4">{key.is_active ? t('dashboard.keys.productionKey') : t('dashboard.keys.inactiveKey')}</td>
                        <td className="px-6 py-4 font-mono text-white/82">{key.key_prefix}</td>
                        <td className="px-6 py-4 text-white/62">{formatDate(key.createdAt)}</td>
                        <td className="px-6 py-4">
                          <button onClick={() => handleDeleteKey(key.id)} className="text-red-300 hover:text-red-200" aria-label={t('common.delete')}><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex gap-3 rounded-xl border border-amber-400/20 bg-amber-500/8 p-4 text-sm text-amber-100/85">
              <AlertTriangle size={18} />
              <div><strong>{t('dashboard.keys.warning')}</strong><p className="mt-1 text-amber-100/65">{t('dashboard.keys.warningDesc')}</p></div>
            </div>
          </div>
        )}

        {activeTab === 'purchases' && (
          <div className="liquid-glass rounded-2xl border border-white/10 p-10 text-center">
            <ShoppingBag size={42} className="mx-auto mb-4 text-white/30" />
            <h3 className="mb-2 text-xl font-medium">{t('dashboard.nav.purchases')}</h3>
            <p className="mb-6 text-white/50">{zh ? '订阅数据会从 Firebase subscriptions 集合读取。' : 'Subscription data is read from the Firebase subscriptions collection.'}</p>
            <Link to="/my-purchases" className="inline-block rounded-xl bg-white px-6 py-3 font-semibold text-[#070b0d]">{zh ? '查看完整列表' : 'View full list'}</Link>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="liquid-glass rounded-2xl border border-white/10 p-6">
              <h3 className="mb-4 font-medium text-white/72">{zh ? '按模型统计' : 'Usage by model'}</h3>
              <p className="text-sm text-white/48">{zh ? '真实调用后会展示 apiCallRecords 中的模型、延迟、成本与状态。' : 'Real calls will show model, latency, cost, and status from apiCallRecords.'}</p>
            </div>
            <div className="liquid-glass rounded-2xl border border-white/10 p-6">
              <h3 className="mb-4 font-medium text-white/72">{zh ? '商家健康度' : 'Merchant health'}</h3>
              <p className="text-sm text-white/48">{zh ? '失败调用会退款，并进入售后审核记录。' : 'Failed calls refund credits and remain available for support review.'}</p>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="liquid-glass rounded-2xl border border-white/10 p-8">
              <h3 className="mb-2 font-medium text-white/90">{t('dashboard.billing.currentBalance')}</h3>
              <div className="my-6 font-mono text-5xl">{userProfile?.credits?.toFixed(2) || '0.00'}</div>
              <p className="text-sm text-white/50">{t('dashboard.billing.securePayment')}</p>
            </div>
            <div className="liquid-glass rounded-2xl border border-white/10 p-8">
              <h3 className="mb-6 font-medium text-white/90">{t('dashboard.billing.topUp')}</h3>
              <div className="mb-6 grid grid-cols-3 gap-3">
                {['$10', '$50', '$100'].map((amount) => <button key={amount} className="rounded-xl border border-white/10 bg-white/5 py-3 font-mono text-sm">{amount}</button>)}
              </div>
              <input type="number" placeholder={t('dashboard.billing.customAmountPlaceholder')} className="w-full rounded-xl px-4 py-3 text-white placeholder:text-white/35" />
              <button className="mt-6 w-full rounded-xl bg-white py-3 font-semibold text-[#070b0d]">{t('dashboard.billing.checkout')}</button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-3xl space-y-6">
            <div className="liquid-glass overflow-hidden rounded-2xl border border-white/10">
              <div className="border-b border-white/10 p-6">
                <h3 className="text-lg font-medium">{t('dashboard.settings.organizationDetails')}</h3>
                <p className="text-sm text-white/50">{t('dashboard.settings.organizationDesc')}</p>
              </div>
              <div className="space-y-4 p-6">
                <label className="block text-xs uppercase text-white/50">{t('dashboard.settings.email')}<input value={currentUser?.email || ''} disabled className="mt-2 w-full rounded-xl px-4 py-2.5 text-white/70" /></label>
                <label className="block text-xs uppercase text-white/50">{t('dashboard.settings.userId')}<input value={currentUser?.uid || ''} disabled className="mt-2 w-full rounded-xl px-4 py-2.5 font-mono text-xs text-white/70" /></label>
                <label className="block text-xs uppercase text-white/50">{t('dashboard.settings.accountType')}<input value={userProfile?.role?.toUpperCase() || 'BUYER'} disabled className="mt-2 w-full rounded-xl px-4 py-2.5 text-white/70" /></label>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
