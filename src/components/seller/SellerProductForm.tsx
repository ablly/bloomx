import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Cloud,
  Loader2,
  Save,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getSellerProducts, updateProductStatus, deleteProduct } from '../../services/productService';
import { getSellerByUid } from '../../services/sellerService';
import {
  fetchSellerApiModels,
  submitSellerApiProduct,
  testSellerApiModels,
  type NormalizedModel,
  type ProviderAuthType,
  type ProviderType,
  type SmokeTestResult,
} from '../../services/sellerApiOnboardingService';

const providerOptions: Array<{ value: ProviderType; label: string; defaultBaseUrl: string; note: string }> = [
  { value: 'openai', label: 'OpenAI', defaultBaseUrl: 'https://api.openai.com/v1', note: '官方 OpenAI Models + Chat Completions' },
  { value: 'openai_compatible', label: 'OpenAI 兼容', defaultBaseUrl: '', note: '兼容 /v1/models 与 /v1/chat/completions 的网关' },
  { value: 'anthropic', label: 'Anthropic Claude', defaultBaseUrl: 'https://api.anthropic.com/v1', note: 'Models + Messages API' },
  { value: 'google_gemini', label: 'Google Gemini', defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta', note: 'Models + generateContent' },
  { value: 'azure_openai', label: 'Azure OpenAI', defaultBaseUrl: '', note: 'Azure resource endpoint + api-version' },
  { value: 'mistral', label: 'Mistral', defaultBaseUrl: 'https://api.mistral.ai/v1', note: 'Models + chat completions' },
  { value: 'cohere', label: 'Cohere', defaultBaseUrl: 'https://api.cohere.com/v2', note: 'Models + Chat API' },
  { value: 'groq', label: 'Groq', defaultBaseUrl: 'https://api.groq.com/openai/v1', note: 'OpenAI-compatible endpoint' },
  { value: 'together', label: 'Together AI', defaultBaseUrl: 'https://api.together.xyz/v1', note: 'Models + OpenAI-compatible inference' },
  { value: 'openrouter', label: 'OpenRouter', defaultBaseUrl: 'https://openrouter.ai/api/v1', note: 'Models + OpenAI-compatible inference' },
  { value: 'ollama_gateway', label: 'Ollama Gateway', defaultBaseUrl: '', note: '必须是公网 HTTPS 网关，不能填 localhost' },
  { value: 'custom_http', label: 'Custom HTTP', defaultBaseUrl: '', note: '企业自定义 OpenAI-like HTTP Provider' },
  { value: 'aws_bedrock', label: 'AWS Bedrock', defaultBaseUrl: '', note: '需要后续专用 SigV4/IAM 连接器' },
];

const SellerProductForm = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { productId } = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(Boolean(productId));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modelSearch, setModelSearch] = useState('');
  const [fetchedModels, setFetchedModels] = useState<NormalizedModel[]>([]);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<SmokeTestResult[]>([]);
  const [lastTestLogId, setLastTestLogId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    provider_type: 'openai_compatible' as ProviderType,
    base_url: '',
    auth_type: 'bearer' as ProviderAuthType,
    auth_header_name: 'x-api-key',
    auth_value: '',
    pricing: {
      input_per_1k: 0,
      output_per_1k: 0,
    },
  });

  const selectedProvider = providerOptions.find((item) => item.value === formData.provider_type) ?? providerOptions[1];
  const canRunProviderActions = !productId && formData.auth_value.trim().length >= 6 && formData.base_url.trim().length > 0;
  const filteredModels = useMemo(() => {
    const term = modelSearch.trim().toLowerCase();
    if (!term) return fetchedModels;
    return fetchedModels.filter((model) => `${model.id} ${model.name} ${model.owner || ''}`.toLowerCase().includes(term));
  }, [fetchedModels, modelSearch]);

  useEffect(() => {
    if (productId && currentUser) {
      void loadProduct();
    }
  }, [productId, currentUser]);

  const loadProduct = async () => {
    if (!currentUser || !productId) return;
    setInitialLoading(true);
    try {
      const seller = await getSellerByUid(currentUser.uid);
      if (!seller) return;
      const products = await getSellerProducts(seller.id);
      const product = products.find((item) => item.id === productId);
      if (product) {
        setFormData((prev) => ({
          ...prev,
          name: product.name,
          description: product.description,
          provider_type: (product.provider_type as ProviderType) || 'openai_compatible',
          base_url: product.base_url,
          auth_type: product.auth_type,
          auth_value: '',
          pricing: product.pricing,
        }));
        setFetchedModels(product.models.map((model) => ({ id: model, name: model, source: ((product.provider_type as ProviderType) || 'custom_http') })));
        setSelectedModelIds(product.models);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '读取商品失败');
    } finally {
      setInitialLoading(false);
    }
  };

  const providerInput = () => ({
    providerType: formData.provider_type,
    baseUrl: formData.base_url,
    authType: formData.auth_type,
    authValue: formData.auth_value,
    authHeaderName: formData.auth_type === 'api_key' ? formData.auth_header_name : undefined,
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setError(null);
    setSuccess(null);
    if (name === 'provider_type') {
      const nextProvider = providerOptions.find((item) => item.value === value);
      setFormData((prev) => ({
        ...prev,
        provider_type: value as ProviderType,
        base_url: nextProvider?.defaultBaseUrl ?? prev.base_url,
      }));
      setFetchedModels([]);
      setSelectedModelIds([]);
      setTestResults([]);
      return;
    }
    if (name.startsWith('pricing.')) {
      const key = name.split('.')[1] as 'input_per_1k' | 'output_per_1k';
      setFormData((prev) => ({
        ...prev,
        pricing: { ...prev.pricing, [key]: Number(value) || 0 },
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleModel = (modelId: string) => {
    setSelectedModelIds((prev) =>
      prev.includes(modelId) ? prev.filter((item) => item !== modelId) : [...prev, modelId],
    );
  };

  const handleFetchModels = async () => {
    if (!canRunProviderActions) {
      setError('请先填写 API 地址和认证信息。');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await fetchSellerApiModels(providerInput());
      setFetchedModels(result.models);
      setSelectedModelIds([]);
      setTestResults([]);
      setLastTestLogId(result.testLogId);
      setSuccess(`已从真实 Provider 获取 ${result.models.length} 个模型。`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '获取模型失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRunTests = async () => {
    if (selectedModelIds.length === 0) {
      setError('请至少选择一个模型。');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await testSellerApiModels({
        ...providerInput(),
        modelIds: selectedModelIds,
      });
      setTestResults(result.results);
      setLastTestLogId(result.testLogId);
      if (!result.success) {
        setError('至少一个模型测试失败，请查看测试结果并修复 API 配置。');
        return;
      }
      setSuccess('所选模型已通过服务端连通性测试，可以提交管理员审核。');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '模型测试失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser) return;
    if (productId) {
      setError('已创建商品暂不支持在前端直接改密钥；请重新提交一个新版本，旧版本可下架。');
      return;
    }
    if (selectedModelIds.length === 0) {
      setError('请先获取模型并选择要上架的模型。');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await submitSellerApiProduct({
        ...providerInput(),
        name: formData.name,
        description: formData.description,
        modelIds: selectedModelIds,
        pricing: formData.pricing,
      });
      setTestResults(result.smokeResults);
      setLastTestLogId(result.testLogId);
      if (!result.success) {
        setError('商品已保存为测试失败状态，系统会记录测试报告。请修复后重新提交。');
        return;
      }
      setSuccess('商品已通过服务端测试并提交管理员审核。');
      setTimeout(() => navigate('/seller/dashboard'), 900);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '提交商品失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !productId) return;
    if (!confirm('确定删除这个商品吗？已上架商品建议先下架再处理。')) return;

    setLoading(true);
    try {
      const seller = await getSellerByUid(currentUser.uid);
      if (seller) {
        await deleteProduct(seller.id, productId);
        navigate('/seller/dashboard');
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '删除商品失败');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!currentUser || !productId) return;
    setLoading(true);
    try {
      const seller = await getSellerByUid(currentUser.uid);
      if (seller) {
        await updateProductStatus(seller.id, productId, 'inactive');
        navigate('/seller/dashboard');
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '下架商品失败');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#070b0d] text-white">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-white/62">
          正在读取商品配置...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#070b0d] px-4 py-6 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate('/seller/dashboard')}
          className="mb-6 inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-white/62 transition hover:text-white"
        >
          <ArrowLeft size={17} />
          返回商家工作台
        </button>

        <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(380px,0.58fr)]">
          <section className="rounded-xl border border-white/10 bg-[#0b1213]/92">
            <div className="border-b border-white/10 p-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#78c6a3]/30 bg-[#78c6a3]/10 px-3 py-1 text-xs font-semibold text-[#9be2c8]">
                <Cloud size={14} />
                服务端 Provider 测试
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight">{productId ? '查看 API 商品' : '提交 API 商品审核'}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/52">
                API 密钥只提交给服务端，平台会先获取真实模型列表并逐模型测试；全部通过后才进入管理员审核，不会直接上架。
              </p>
            </div>

            <div className="grid gap-5 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="商品名称">
                  <input name="name" value={formData.name} onChange={handleChange} required className="field-input" placeholder="例如 Claude 兼容高并发网关" />
                </FormField>
                <FormField label="Provider 类型">
                  <select name="provider_type" value={formData.provider_type} onChange={handleChange} disabled={Boolean(productId)} className="field-input">
                    {providerOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField label="产品描述">
                <textarea name="description" value={formData.description} onChange={handleChange} required rows={5} className="field-input resize-none" placeholder="写清楚模型能力、适用场景、SLA、限制和退款边界。" />
              </FormField>

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-white/54">
                当前 Provider：<span className="font-semibold text-white">{selectedProvider.label}</span>。{selectedProvider.note}
              </div>

              <FormField label="API Base URL">
                <input name="base_url" value={formData.base_url} onChange={handleChange} required disabled={Boolean(productId)} className="field-input font-mono" placeholder="https://provider.example.com/v1" />
              </FormField>

              <div className="grid gap-4 md:grid-cols-[0.7fr_1fr]">
                <FormField label="认证方式">
                  <select name="auth_type" value={formData.auth_type} onChange={handleChange} disabled={Boolean(productId)} className="field-input">
                    <option value="bearer">Bearer Token</option>
                    <option value="api_key">API Key Header</option>
                    <option value="basic">Basic Auth</option>
                  </select>
                </FormField>
                {formData.auth_type === 'api_key' && (
                  <FormField label="Header 名称">
                    <input name="auth_header_name" value={formData.auth_header_name} onChange={handleChange} disabled={Boolean(productId)} className="field-input font-mono" placeholder="x-api-key" />
                  </FormField>
                )}
              </div>

              <FormField label="API 密钥">
                <input name="auth_value" type="password" value={formData.auth_value} onChange={handleChange} required={!productId} disabled={Boolean(productId)} className="field-input font-mono" placeholder={productId ? '已创建商品不在前端显示密钥' : '只会提交给服务端加密保存'} />
              </FormField>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="输入价格 / 1K tokens">
                  <input name="pricing.input_per_1k" type="number" min="0" step="0.0001" value={formData.pricing.input_per_1k} onChange={handleChange} required className="field-input font-mono" />
                </FormField>
                <FormField label="输出价格 / 1K tokens">
                  <input name="pricing.output_per_1k" type="number" min="0" step="0.0001" value={formData.pricing.output_per_1k} onChange={handleChange} required className="field-input font-mono" />
                </FormField>
              </div>
            </div>
          </section>

          <aside className="grid h-fit gap-5">
            <section className="rounded-xl border border-white/10 bg-[#0b1213]/92 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">模型抓取与测试</h2>
                  <p className="mt-1 text-sm text-white/45">只显示真实 Provider 返回的模型。</p>
                </div>
                <button type="button" onClick={handleFetchModels} disabled={loading || !canRunProviderActions || Boolean(productId)} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-[#070b0d] transition hover:bg-white/88 disabled:cursor-not-allowed disabled:bg-white/40">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  获取模型
                </button>
              </div>

              <label className="mt-4 block">
                <span className="sr-only">搜索模型</span>
                <input value={modelSearch} onChange={(event) => setModelSearch(event.target.value)} className="field-input" placeholder="搜索模型 ID 或所属..." />
              </label>

              <div className="mt-4 max-h-[360px] overflow-auto rounded-lg border border-white/10">
                {filteredModels.length === 0 ? (
                  <div className="grid place-items-center px-4 py-12 text-center text-sm text-white/42">
                    还没有真实模型结果。请先填写 Provider 信息并获取模型。
                  </div>
                ) : (
                  <div className="divide-y divide-white/8">
                    {filteredModels.map((model) => (
                      <label key={model.id} className="grid cursor-pointer grid-cols-[24px_1fr] gap-3 px-4 py-3 text-sm hover:bg-white/[0.035]">
                        <input type="checkbox" checked={selectedModelIds.includes(model.id)} onChange={() => toggleModel(model.id)} className="mt-1 h-4 w-4 accent-[#78c6a3]" />
                        <span>
                          <span className="block break-all font-mono text-white/82">{model.id}</span>
                          <span className="mt-1 block text-xs text-white/38">{model.owner || model.source}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <button type="button" onClick={handleRunTests} disabled={loading || selectedModelIds.length === 0 || Boolean(productId)} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#78c6a3]/25 bg-[#78c6a3]/10 px-4 text-sm font-semibold text-[#9be2c8] transition hover:bg-[#78c6a3]/14 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.035] disabled:text-white/36">
                {loading ? <Loader2 size={17} className="animate-spin" /> : <ShieldCheck size={17} />}
                运行服务端测试
              </button>
            </section>

            <section className="rounded-xl border border-white/10 bg-[#0b1213]/92 p-5">
              <h2 className="text-lg font-semibold">测试结果</h2>
              <div className="mt-4 grid gap-2">
                {testResults.length === 0 ? (
                  <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm text-white/44">暂无测试结果。</div>
                ) : (
                  testResults.map((result) => (
                    <div key={result.modelId} className={`rounded-lg border p-3 text-sm ${result.ok ? 'border-[#78c6a3]/25 bg-[#78c6a3]/10 text-[#9be2c8]' : 'border-[#e07d6b]/25 bg-[#e07d6b]/10 text-[#f0a091]'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="break-all font-mono">{result.modelId}</span>
                        {result.ok ? <CheckCircle2 size={17} /> : <XCircle size={17} />}
                      </div>
                      <div className="mt-2 text-xs opacity-75">latency: {result.latencyMs}ms {result.statusCode ? `/ HTTP ${result.statusCode}` : ''}</div>
                      {result.error && <div className="mt-2 text-xs">{result.error}</div>}
                    </div>
                  ))
                )}
              </div>
              {lastTestLogId && <div className="mt-3 break-all font-mono text-xs text-white/36">testLogId: {lastTestLogId}</div>}
            </section>

            {(error || success) && (
              <div className={`rounded-xl border p-4 text-sm leading-6 ${error ? 'border-[#e07d6b]/25 bg-[#e07d6b]/10 text-[#f0a091]' : 'border-[#78c6a3]/25 bg-[#78c6a3]/10 text-[#9be2c8]'}`}>
                {error ? <AlertTriangle size={17} className="mb-2" /> : <CheckCircle2 size={17} className="mb-2" />}
                {error || success}
              </div>
            )}

            <div className="grid gap-3">
              <button type="submit" disabled={loading || Boolean(productId)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-[#070b0d] transition hover:bg-white/88 disabled:cursor-not-allowed disabled:bg-white/40">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                提交管理员审核
              </button>
              {productId && (
                <div className="grid gap-2 sm:grid-cols-2">
                  <button type="button" onClick={handleArchive} disabled={loading} className="min-h-11 rounded-lg border border-white/10 px-4 text-sm text-white/70 hover:text-white">下架商品</button>
                  <button type="button" onClick={handleDelete} disabled={loading} className="min-h-11 rounded-lg border border-[#e07d6b]/25 px-4 text-sm text-[#f0a091] hover:bg-[#e07d6b]/10">删除</button>
                </div>
              )}
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
};

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-white/68">{label}</span>
      {children}
    </label>
  );
}

export default SellerProductForm;
