import { useState, useEffect } from 'react';
import { LayoutDashboard, KeyRound, Activity, CreditCard, Settings, Plus, Copy, LogOut, ArrowUpRight, Check, Code2, AlertTriangle, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createApiKey, listApiKeys, deleteApiKey, type ApiKey } from '../services/apiKeyService';
import { useTranslation } from 'react-i18next';

interface DashboardProps {
    onLogout: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
    const { currentUser, userProfile } = useAuth();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('overview');
    const [copied, setCopied] = useState(false);
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [loadingKeys, setLoadingKeys] = useState(false);
    const [creatingKey, setCreatingKey] = useState(false);
    const [newKeyFull, setNewKeyFull] = useState<string | null>(null);
    const [showNewKey, setShowNewKey] = useState(false);

    const navItems = [
        { id: 'overview', label: t('dashboard.nav.overview'), icon: LayoutDashboard },
        { id: 'keys', label: t('dashboard.nav.keys'), icon: KeyRound },
        { id: 'usage', label: t('dashboard.nav.usage'), icon: Activity },
        { id: 'billing', label: t('dashboard.nav.billing'), icon: CreditCard },
        { id: 'settings', label: t('dashboard.nav.settings'), icon: Settings },
    ];

    // Load API Keys when keys tab is active
    useEffect(() => {
        if (activeTab === 'keys' && currentUser) {
            loadApiKeys();
        }
    }, [activeTab, currentUser]);

    const loadApiKeys = async () => {
        if (!currentUser) return;
        setLoadingKeys(true);
        try {
            const keys = await listApiKeys(currentUser.uid);
            setApiKeys(keys);
        } catch (error) {
            console.error('Failed to load API keys:', error);
        } finally {
            setLoadingKeys(false);
        }
    };

    const handleCreateKey = async () => {
        if (!currentUser) return;
        setCreatingKey(true);
        try {
            const { fullKey, record } = await createApiKey(currentUser.uid);
            setNewKeyFull(fullKey);
            setShowNewKey(true);
            setApiKeys(prev => [record, ...prev]);
        } catch (error) {
            console.error('Failed to create API key:', error);
            alert('Failed to create API key. Please try again.');
        } finally {
            setCreatingKey(false);
        }
    };

    const handleDeleteKey = async (keyId: string) => {
        if (!currentUser) return;
        if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
            return;
        }
        try {
            await deleteApiKey(currentUser.uid, keyId);
            setApiKeys(prev => prev.filter(k => k.id !== keyId));
        } catch (error) {
            console.error('Failed to delete API key:', error);
            alert('Failed to delete API key. Please try again.');
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatDate = (date: Date | null) => {
        if (!date) return 'Never';
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        }).format(date);
    };

    const formatRelativeTime = (date: Date | null) => {
        if (!date) return 'Never';
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return `${days} day${days > 1 ? 's' : ''} ago`;
    };

    return (
        <div className="relative min-h-screen bg-black font-sans text-white flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 bg-black/50 p-6 flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-12 cursor-pointer" onClick={onLogout}>
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black">
                            <span className="font-bold text-lg leading-none mt-0.5 ml-0.5 text-black">B</span>
                        </div>
                        <span className="font-semibold text-xl tracking-tighter">BloomX</span>
                    </div>

                    <nav className="space-y-2">
                        {navItems.map(item => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === item.id
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                                        }`}
                                >
                                    <Icon size={18} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <button
                    onClick={onLogout}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-white/50 hover:text-white transition-colors duration-200 cursor-pointer"
                >
                    <LogOut size={18} />
                    {t('dashboard.nav.signOut')}
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-10 overflow-y-auto w-full max-w-6xl">
                <header className="flex justify-between items-center mb-10 w-full">
                    <h1 className="text-3xl font-medium tracking-tight">
                        {navItems.find(i => i.id === activeTab)?.label}
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <div className="text-xs text-white/50 uppercase tracking-widest">{t('dashboard.header.credits')}</div>
                            <div className="text-lg font-mono font-medium">
                                ${userProfile?.credits_balance?.toFixed(2) || '0.00'}
                            </div>
                        </div>
                        <button
                            onClick={() => setActiveTab('billing')}
                            className="bg-white text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-white/90 transition-colors duration-200 cursor-pointer"
                        >
                            {t('dashboard.header.addFunds')}
                        </button>
                    </div>
                </header>

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="liquid-glass rounded-2xl p-6">
                                <div className="text-white/50 text-xs uppercase tracking-widest mb-2">Total Requests (30d)</div>
                                <div className="text-4xl font-sans font-medium mb-1">4.2M</div>
                                <div className="text-green-400 text-sm flex items-center gap-1">
                                    <ArrowUpRight size={14} /> 12% from last month
                                </div>
                            </div>
                            <div className="liquid-glass rounded-2xl p-6">
                                <div className="text-white/50 text-xs uppercase tracking-widest mb-2">Avg Latency</div>
                                <div className="text-4xl font-sans font-medium mb-1">245ms</div>
                                <div className="text-white/50 text-sm">P99 across all regions</div>
                            </div>
                            <div className="liquid-glass rounded-2xl p-6">
                                <div className="text-white/50 text-xs uppercase tracking-widest mb-2">Error Rate</div>
                                <div className="text-4xl font-sans font-medium mb-1">0.02%</div>
                                <div className="text-green-400 text-sm">Optimal Health</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 liquid-glass rounded-2xl p-6 min-h-[300px] flex items-center justify-center border border-white/5">
                                <p className="text-white/30 text-sm">[ Usage Graph Metrics Visualization ]</p>
                            </div>

                            <div className="liquid-glass rounded-2xl p-6 border border-white/5 flex flex-col">
                                <div className="flex items-center gap-2 mb-4 text-white/80">
                                    <Code2 size={18} />
                                    <h3 className="font-medium">Quick Integration</h3>
                                </div>
                                <p className="text-xs text-white/50 mb-4 leading-relaxed">
                                    BloomX is fully compatible with OpenAI SDKs. Just change the base URL and pass your BloomX key.
                                </p>
                                <div className="bg-black/60 rounded-xl p-4 overflow-x-auto text-[11px] font-mono text-white/80 border border-white/10 flex-1">
                                    <pre>
                                        <span className="text-purple-400">import</span> OpenAI <span className="text-purple-400">from</span> <span className="text-green-300">'openai'</span>;<br /><br />
                                        <span className="text-purple-400">const</span> client = <span className="text-purple-400">new</span> OpenAI(&#123;<br />
                                        &nbsp;&nbsp;apiKey: <span className="text-green-300">'bx_live_...'</span>,<br />
                                        &nbsp;&nbsp;baseURL: <span className="text-green-300">'https://api.bloomx.io/v1'</span>,<br />
                                        &#125;);<br /><br />
                                        <span className="text-white/40">// Auto-routes to lowest latency provider</span><br />
                                        <span className="text-purple-400">const</span> response = <span className="text-purple-400">await</span> client.chat.completions.create(&#123;<br />
                                        &nbsp;&nbsp;model: <span className="text-green-300">'gpt-4o'</span>,<br />
                                        &nbsp;&nbsp;messages: [&#123; role: <span className="text-green-300">'user'</span>, content: <span className="text-green-300">'Hello!'</span> &#125;]<br />
                                        &#125;);
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* API KEYS TAB */}
                {activeTab === 'keys' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-white/60">Manage your secret API keys to authenticate requests to BloomX.</p>
                            <button 
                                onClick={handleCreateKey}
                                disabled={creatingKey}
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <Plus size={16} /> {creatingKey ? 'Creating...' : 'Create new secret key'}
                            </button>
                        </div>

                        {/* New Key Modal */}
                        {showNewKey && newKeyFull && (
                            <div className="liquid-glass-strong rounded-2xl p-6 border-2 border-green-500/30 bg-green-500/5 mb-6 animate-in fade-in zoom-in duration-300">
                                <div className="flex items-start gap-3 mb-4">
                                    <Check size={20} className="text-green-400 mt-0.5" />
                                    <div className="flex-1">
                                        <h3 className="text-lg font-medium text-white mb-1">API Key Created Successfully</h3>
                                        <p className="text-sm text-white/60">
                                            Please save this key somewhere safe. For security reasons, you won't be able to view it again.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setShowNewKey(false)}
                                        className="text-white/50 hover:text-white transition-colors duration-200 cursor-pointer"
                                        aria-label="Close"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="bg-black/40 rounded-xl p-4 flex items-center justify-between gap-3 border border-white/10">
                                    <code className="text-sm font-mono text-white flex-1 break-all">{newKeyFull}</code>
                                    <button 
                                        onClick={() => handleCopy(newKeyFull)}
                                        className="text-white/60 hover:text-white transition-colors duration-200 shrink-0 cursor-pointer"
                                        aria-label="Copy API key"
                                    >
                                        {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {loadingKeys ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : apiKeys.length === 0 ? (
                            <div className="liquid-glass rounded-2xl border border-white/10 p-12 text-center">
                                <KeyRound size={48} className="mx-auto mb-4 text-white/20" />
                                <h3 className="text-lg font-medium text-white mb-2">No API Keys Yet</h3>
                                <p className="text-white/50 text-sm mb-6">Create your first API key to start using BloomX.</p>
                                <button 
                                    onClick={handleCreateKey}
                                    disabled={creatingKey}
                                    className="bg-white hover:bg-white/90 text-black px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    Create API Key
                                </button>
                            </div>
                        ) : (
                            <div className="liquid-glass rounded-2xl overflow-hidden border border-white/10">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10 text-xs tracking-wider text-white/50 uppercase bg-white/5">
                                            <th className="px-6 py-4 font-medium">Name</th>
                                            <th className="px-6 py-4 font-medium">Secret Key</th>
                                            <th className="px-6 py-4 font-medium">Created</th>
                                            <th className="px-6 py-4 font-medium">Last Used</th>
                                            <th className="px-6 py-4 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-sm">
                                        {apiKeys.map((key) => (
                                            <tr key={key.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-4 font-medium">
                                                    {key.is_active ? (
                                                        <span className="text-white">Production Key</span>
                                                    ) : (
                                                        <span className="text-white/40">Inactive Key</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-mono text-white/80 flex items-center gap-3">
                                                    {key.key_prefix}
                                                    <button 
                                                        onClick={() => handleCopy(key.key_prefix)}
                                                        className="text-white/40 hover:text-white transition-colors duration-200 cursor-pointer"
                                                        aria-label="Copy key prefix"
                                                    >
                                                        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-white/60">{formatDate(key.createdAt)}</td>
                                                <td className="px-6 py-4 text-white/60">{formatRelativeTime(key.last_used)}</td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleDeleteKey(key.id)}
                                                        className="text-red-400/60 hover:text-red-400 transition-colors duration-200 cursor-pointer"
                                                        title="Delete key"
                                                        aria-label="Delete API key"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-500 mt-8">
                            <AlertTriangle size={20} className="shrink-0" />
                            <div>
                                <h4 className="font-medium text-sm mb-1">Never share your keys</h4>
                                <p className="text-amber-500/70 text-xs leading-relaxed">
                                    Your secret keys carry the same privileges as your account. Do not commit them to GitHub, public repositories, or client-side code.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* BILLING TAB */}
                {activeTab === 'billing' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* Current Balance Card */}
                            <div className="liquid-glass rounded-2xl p-8 border border-white/10 flex flex-col">
                                <h3 className="text-white/60 font-medium mb-6">Current Invoice Balance</h3>
                                <div className="text-6xl font-sans tracking-tighter mb-2">
                                    ${userProfile?.credits_balance?.toFixed(2) || '0.00'}
                                </div>
                                <p className="text-white/40 text-sm mb-10">
                                    Equivalent to {((userProfile?.credits_balance || 0) * 100).toLocaleString()} Platform Credits
                                </p>

                                <div className="mt-auto space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                        <div>
                                            <h4 className="text-sm font-medium text-white mb-1">Auto-recharge</h4>
                                            <p className="text-xs text-white/50">When balance falls below $50.00</p>
                                        </div>
                                        <button 
                                            className="w-10 h-5 bg-green-500 rounded-full relative cursor-pointer transition-colors duration-200 hover:bg-green-600"
                                            role="switch"
                                            aria-checked="true"
                                            aria-label="Toggle auto-recharge"
                                        >
                                            <div className="absolute right-1 top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200"></div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Add Funds Form */}
                            <div className="liquid-glass rounded-2xl p-8 border border-white/10 flex flex-col">
                                <h3 className="text-white/90 font-medium mb-6 flex items-center gap-2">
                                    <CreditCard size={18} /> Top up Credits
                                </h3>

                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    {['$50', '$200', '$500'].map(amount => (
                                        <button key={amount} className="border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30 rounded-xl py-3 text-sm font-mono text-white/80 transition-all duration-200 cursor-pointer">
                                            {amount}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex flex-col space-y-2 mb-8">
                                    <label className="text-xs font-medium text-white/50 uppercase tracking-widest">Or enter custom amount ($)</label>
                                    <input
                                        type="number"
                                        placeholder="Enter amount (min $10)"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors font-mono"
                                    />
                                </div>

                                <div className="flex items-center gap-3 text-white/40 text-xs mb-6">
                                    <Check size={14} className="text-green-400" />
                                    Payments are securely processed by Stripe
                                </div>

                                <button className="w-full bg-white hover:bg-white/90 active:scale-[0.98] transition-all duration-200 rounded-xl py-3 text-black font-semibold mt-auto cursor-pointer">
                                    Proceed to Checkout
                                </button>
                            </div>

                        </div>

                        {/* Transaction History Placeholder */}
                        <div className="mt-10">
                            <h3 className="text-white/60 font-medium mb-4">Payment History</h3>
                            <div className="liquid-glass rounded-2xl border border-white/10 p-6 text-center text-white/30 text-sm">
                                No recent transactions found.
                            </div>
                        </div>
                    </div>
                )}

                {/* USAGE TAB */}
                {activeTab === 'usage' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="liquid-glass rounded-2xl p-6 border border-white/10 relative overflow-hidden">
                                {/* Glow behind chart */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] pointer-events-none"></div>

                                <h3 className="text-white/60 font-medium mb-4 text-sm uppercase tracking-widest relative z-10">Usage by Model</h3>
                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-white">gpt-4o</span>
                                        <span className="text-white/60 font-mono">$842.10</span>
                                    </div>
                                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[70%]"></div>
                                    </div>

                                    <div className="flex justify-between items-center text-sm mt-4">
                                        <span className="text-white">claude-3-opus-20240229</span>
                                        <span className="text-white/60 font-mono">$312.40</span>
                                    </div>
                                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-500 w-[20%]"></div>
                                    </div>

                                    <div className="flex justify-between items-center text-sm mt-4">
                                        <span className="text-white">gemini-1.5-pro</span>
                                        <span className="text-white/60 font-mono">$64.00</span>
                                    </div>
                                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-400 w-[5%]"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="liquid-glass rounded-2xl p-6 border border-white/10">
                                <h3 className="text-white/60 font-medium mb-4 text-sm uppercase tracking-widest">Top Upstreams (Routing)</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm pb-3 border-b border-white/5 hover:bg-white/5 transition-colors p-2 -mx-2 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow"></span>
                                            <span className="text-white">Direct OpenAI (Tier 5)</span>
                                        </div>
                                        <span className="text-white/60">54%</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm pb-3 border-b border-white/5 hover:bg-white/5 transition-colors p-2 -mx-2 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow object-contain"></span>
                                            <span className="text-white">Verified Node #X8B2</span>
                                        </div>
                                        <span className="text-white/60">22%</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm pb-3 border-b border-white/5 hover:bg-white/5 transition-colors p-2 -mx-2 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow"></span>
                                            <span className="text-white">Verified Node #A49F</span>
                                        </div>
                                        <span className="text-white/60">19%</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm hover:bg-white/5 transition-colors p-2 -mx-2 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-slow"></span>
                                            <span className="text-white">Fallback Proxy Pool</span>
                                        </div>
                                        <span className="text-white/60">5%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="liquid-glass rounded-2xl overflow-hidden border border-white/10 mt-6">
                            <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex justify-between items-center">
                                <h3 className="text-sm font-medium text-white/80 uppercase tracking-widest">Recent Logs</h3>
                                <button className="text-xs text-white/50 hover:text-white transition-colors bg-white/5 px-3 py-1 rounded border border-white/10">Export CSV</button>
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 text-xs tracking-wider text-white/50 uppercase">
                                        <th className="px-6 py-3 font-medium">Timestamp</th>
                                        <th className="px-6 py-3 font-medium">Model</th>
                                        <th className="px-6 py-3 font-medium">Tokens (In/Out)</th>
                                        <th className="px-6 py-3 font-medium">Latency</th>
                                        <th className="px-6 py-3 font-medium">Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm bg-black/20">
                                    <tr className="hover:bg-white/5 transition-colors cursor-default">
                                        <td className="px-6 py-3 text-white/60 font-mono text-xs">2026-03-27 15:24:01</td>
                                        <td className="px-6 py-3 text-white">gpt-4o</td>
                                        <td className="px-6 py-3 text-white/60">241 / 893</td>
                                        <td className="px-6 py-3 text-white/60">842ms</td>
                                        <td className="px-6 py-3 font-mono text-white/80">$0.014</td>
                                    </tr>
                                    <tr className="hover:bg-white/5 transition-colors cursor-default">
                                        <td className="px-6 py-3 text-white/60 font-mono text-xs">2026-03-27 15:23:45</td>
                                        <td className="px-6 py-3 text-white">claude-3-opus-20240229</td>
                                        <td className="px-6 py-3 text-white/60">45 / 102</td>
                                        <td className="px-6 py-3 text-white/60">1.2s</td>
                                        <td className="px-6 py-3 font-mono text-white/80">$0.008</td>
                                    </tr>
                                    <tr className="hover:bg-white/5 transition-colors cursor-default">
                                        <td className="px-6 py-3 text-white/60 font-mono text-xs">2026-03-27 15:21:12</td>
                                        <td className="px-6 py-3 text-white">gemini-1.5-pro</td>
                                        <td className="px-6 py-3 text-white/60">3,492 / 12</td>
                                        <td className="px-6 py-3 text-white/60">410ms</td>
                                        <td className="px-6 py-3 font-mono text-white/80">$0.011</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* SETTINGS TAB */}
                {activeTab === 'settings' && (
                    <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl">

                        <div className="liquid-glass rounded-2xl border border-white/10 overflow-hidden">
                            <div className="p-6 border-b border-white/10">
                                <h3 className="text-lg font-medium text-white mb-1">Organization Details</h3>
                                <p className="text-sm text-white/50">Manage your company workspace settings.</p>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex flex-col space-y-2 group">
                                    <label className="text-xs font-medium text-white/50 uppercase tracking-widest group-focus-within:text-white transition-colors">Email</label>
                                    <input
                                        value={currentUser?.email || 'Not provided'}
                                        disabled
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white/60 cursor-not-allowed"
                                    />
                                </div>
                                <div className="flex flex-col space-y-2 group">
                                    <label className="text-xs font-medium text-white/50 uppercase tracking-widest group-focus-within:text-white transition-colors">User ID</label>
                                    <input
                                        value={currentUser?.uid || ''}
                                        disabled
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white/60 font-mono text-xs cursor-not-allowed"
                                    />
                                </div>
                                <div className="flex flex-col space-y-2 group">
                                    <label className="text-xs font-medium text-white/50 uppercase tracking-widest group-focus-within:text-white transition-colors">Account Type</label>
                                    <input
                                        value={userProfile?.role?.toUpperCase() || 'BUYER'}
                                        disabled
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white/60 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="liquid-glass rounded-2xl border border-white/10 overflow-hidden">
                            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-medium text-white mb-1">Team Members</h3>
                                    <p className="text-sm text-white/50">Invite colleagues to access API keys and billing.</p>
                                </div>
                                <button className="bg-white hover:bg-white/90 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 shadow-[0_0_15px_rgba(255,255,255,0.2)] cursor-pointer">
                                    Invite User
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="flex justify-between items-center py-3 border-b border-white/5 hover:bg-white/5 -mx-6 px-6 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center text-sm font-semibold border border-white/10">
                                            {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div className="text-sm">
                                            <p className="text-white font-medium">
                                                {currentUser?.email || 'Anonymous User'} <span className="text-white/30 ml-1">(You)</span>
                                            </p>
                                            <p className="text-white/50 text-xs">{currentUser?.email || 'No email'}</p>
                                        </div>
                                    </div>
                                    <span className="text-white/40 text-xs uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/5">
                                        {userProfile?.role || 'buyer'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="border border-red-500/20 bg-red-500/5 rounded-2xl overflow-hidden mt-12 relative">
                            {/* Warning glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] pointer-events-none"></div>

                            <div className="p-6 border-b border-red-500/10 relative z-10">
                                <h3 className="text-lg font-medium text-red-500 mb-1">Danger Zone</h3>
                                <p className="text-sm text-red-400/60">Irreversible actions for your workspace.</p>
                            </div>
                            <div className="p-6 flex justify-between items-center relative z-10">
                                <div>
                                    <h4 className="text-sm font-medium text-white mb-1">Delete Workspace</h4>
                                    <p className="text-xs text-white/50 max-w-sm">Permanently delete your workspace, all API keys, and flush your remaining credits. This cannot be undone.</p>
                                </div>
                                <button className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded-lg text-sm transition-all duration-200 border border-red-500/20 font-medium cursor-pointer">
                                    Delete Workspace
                                </button>
                            </div>
                        </div>

                    </div>
                )}

            </main>
        </div>
    );
};

export default Dashboard;
