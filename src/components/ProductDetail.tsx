import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Check, CreditCard, ExternalLink, KeyRound, Loader2, Shield, Star, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getProductById } from '../services/productService';
import { getSellerById } from '../services/sellerService';
import { createPurchase, hasProductAccess } from '../services/purchaseService';
import { useAuth } from '../contexts/AuthContext';
import type { Product, Seller } from '../types/marketplace';
import { FadeIn } from './ui';

const copy = {
  zh: {
    back: '返回市场',
    verified: '已通过测试',
    by: '商家',
    reviews: '评价',
    sales: '销量',
    subscribe: '订阅模型',
    signIn: '登录后订阅',
    owned: '你已拥有访问权',
    ownedDesc: '可以在我的订阅中查看端点，并在个人工作台生成平台 Key。',
    setupPrice: '订阅押金',
    permanentAccess: '订阅后可访问',
    billByUsage: '按调用消耗积分',
    refund: '失败调用自动退款',
    models: '支持模型',
    pricing: '调用价格',
    input: '输入 Token',
    output: '输出 Token',
    endpoint: 'API 端点',
    endpointDesc: '请使用 BloomX 平台 Key 调用，不要直接暴露商家密钥。',
    confirmTitle: '确认订阅',
    product: '模型',
    price: '本次扣除',
    balance: '当前积分',
    cancel: '取消',
    confirm: '确认订阅',
    processing: '处理中...',
    insufficient: '积分不足，请先到个人工作台充值。',
    success: '订阅成功，已写入你的订阅列表。',
    failed: '订阅失败，请稍后重试。',
    loginRequired: '请先登录后再订阅。',
  },
  en: {
    back: 'Back to marketplace',
    verified: 'Test passed',
    by: 'Merchant',
    reviews: 'reviews',
    sales: 'sales',
    subscribe: 'Subscribe model',
    signIn: 'Sign in to subscribe',
    owned: 'You already have access',
    ownedDesc: 'Review the endpoint in My Subscriptions and generate a platform key in your workspace.',
    setupPrice: 'Subscription deposit',
    permanentAccess: 'Access after subscribing',
    billByUsage: 'Spend credits by call',
    refund: 'Failed calls refund automatically',
    models: 'Supported models',
    pricing: 'Call pricing',
    input: 'Input tokens',
    output: 'Output tokens',
    endpoint: 'API endpoint',
    endpointDesc: 'Call with your BloomX platform key. Never expose merchant secrets directly.',
    confirmTitle: 'Confirm subscription',
    product: 'Model',
    price: 'Credit deduction',
    balance: 'Current credits',
    cancel: 'Cancel',
    confirm: 'Confirm subscription',
    processing: 'Processing...',
    insufficient: 'Insufficient credits. Top up in your workspace first.',
    success: 'Subscription successful. It has been added to your list.',
    failed: 'Subscription failed. Please try again later.',
    loginRequired: 'Please sign in before subscribing.',
  },
} as const;

const subscriptionPrice = 10;

const ProductDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { i18n } = useTranslation();
  const zh = i18n.language?.startsWith('zh');
  const c = zh ? copy.zh : copy.en;

  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      void loadProductData();
    }
  }, [productId, currentUser]);

  const loadProductData = async () => {
    if (!productId) return;

    try {
      setLoading(true);
      const productData = await getProductById(productId);

      if (!productData) {
        navigate('/marketplace');
        return;
      }

      setProduct(productData);
      const sellerData = await getSellerById(productData.seller_id);
      setSeller(sellerData);

      if (currentUser) {
        const access = await hasProductAccess(currentUser.uid, productId);
        setHasAccess(access);
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!currentUser || !product) {
      setNotice(c.loginRequired);
      return;
    }

    if ((userProfile?.credits || 0) < subscriptionPrice) {
      setNotice(c.insufficient);
      return;
    }

    setPurchasing(true);
    setNotice(null);
    try {
      await createPurchase(currentUser.uid, {
        product_id: product.id,
        seller_id: product.seller_id,
        product_name: product.name,
        product_url: product.base_url,
        priceCredits: subscriptionPrice,
      });

      setHasAccess(true);
      setShowPurchaseModal(false);
      setNotice(c.success);
    } catch (error) {
      console.error('Purchase failed:', error);
      setNotice(c.failed);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070b0d] px-6 text-white">
        <div className="rounded-xl border border-white/10 bg-white/[0.045] px-5 py-4 text-sm text-white/62">
          {zh ? '正在加载商品...' : 'Loading product...'}
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-[#070b0d] px-4 py-8 text-white sm:px-6 lg:px-10">
      {notice && (
        <div className="fixed right-5 top-5 z-50 max-w-sm rounded-xl border border-white/12 bg-[#111819]/95 px-4 py-3 text-sm shadow-2xl backdrop-blur">
          <div className="flex items-start gap-3">
            {notice === c.success ? <Check size={18} className="mt-0.5 text-[#9be2c8]" /> : <AlertTriangle size={18} className="mt-0.5 text-[#f2b36d]" />}
            <span className="text-white/86">{notice}</span>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        <FadeIn direction="left" delay={0.1}>
          <Link to="/marketplace" className="mb-8 inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-white/68 transition hover:border-[#d76f37]/50 hover:text-white">
            <ArrowLeft size={18} />
            {c.back}
          </Link>
        </FadeIn>

        <FadeIn direction="up" delay={0.2}>
          <section className="mb-6 grid gap-6 rounded-xl border border-white/10 bg-[#0b1213]/88 p-6 lg:grid-cols-[1fr_340px] lg:p-8">
            <div>
              <div className="mb-4 flex flex-wrap items-start gap-3">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">{product.name}</h1>
                {product.is_verified && (
                  <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-[#2f6f5e]/16 px-3 text-sm text-[#9be2c8]">
                    <Shield size={14} />
                    {c.verified}
                  </span>
                )}
              </div>

              {seller && (
                <p className="mb-5 text-sm text-white/54">
                  {c.by} <span className="font-medium text-white/82">{seller.name}</span>
                </p>
              )}

              <p className="max-w-3xl text-base leading-7 text-white/66">{product.description}</p>

              <div className="mt-7 flex flex-wrap gap-4">
                <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/76">
                  <Star size={16} className="fill-[#f2b36d] text-[#f2b36d]" />
                  {product.rating.toFixed(1)} ({product.review_count} {c.reviews})
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/76">
                  <TrendingUp size={16} className="text-[#9be2c8]" />
                  {product.total_sales} {c.sales}
                </span>
              </div>
            </div>

            <aside className="rounded-xl border border-white/10 bg-[#050808]/72 p-5">
              <div className="text-center">
                <div className="text-xs uppercase tracking-widest text-white/40">{c.setupPrice}</div>
                <div className="mt-3 font-mono text-5xl">{subscriptionPrice}</div>
                <div className="mt-1 text-sm text-white/48">BloomX credits</div>
              </div>

              {hasAccess ? (
                <div className="mt-6 rounded-xl border border-[#2f6f5e]/40 bg-[#2f6f5e]/12 p-4 text-center">
                  <Check size={24} className="mx-auto mb-2 text-[#9be2c8]" />
                  <p className="font-medium text-[#9be2c8]">{c.owned}</p>
                  <p className="mt-2 text-xs leading-5 text-white/55">{c.ownedDesc}</p>
                </div>
              ) : (
                <button
                  onClick={() => (currentUser ? setShowPurchaseModal(true) : navigate('/dashboard'))}
                  className="mt-6 min-h-12 w-full rounded-lg bg-white font-semibold text-[#070b0d] transition hover:bg-white/88"
                >
                  {currentUser ? c.subscribe : c.signIn}
                </button>
              )}

              <div className="mt-5 space-y-3 text-sm text-white/58">
                {[c.permanentAccess, c.billByUsage, c.refund].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <Check size={15} className="text-[#9be2c8]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </aside>
          </section>
        </FadeIn>

        <div className="grid gap-6 lg:grid-cols-2">
          <FadeIn direction="up" delay={0.3}>
            <section className="rounded-xl border border-white/10 bg-[#0b1213]/88 p-6">
              <h2 className="mb-4 text-xl font-semibold">{c.models}</h2>
              <div className="flex flex-wrap gap-2">
                {product.models.map((model) => (
                  <span key={model} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/74">{model}</span>
                ))}
              </div>
            </section>
          </FadeIn>

          <FadeIn direction="up" delay={0.35}>
            <section className="rounded-xl border border-white/10 bg-[#0b1213]/88 p-6">
              <h2 className="mb-4 text-xl font-semibold">{c.pricing}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-sm text-white/48">{c.input}</div>
                  <div className="mt-2 font-mono text-2xl">{product.pricing.input_per_1k.toFixed(3)}<span className="ml-1 text-sm text-white/45">/ 1K</span></div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-sm text-white/48">{c.output}</div>
                  <div className="mt-2 font-mono text-2xl">{product.pricing.output_per_1k.toFixed(3)}<span className="ml-1 text-sm text-white/45">/ 1K</span></div>
                </div>
              </div>
            </section>
          </FadeIn>
        </div>

        {hasAccess && (
          <FadeIn direction="up" delay={0.4}>
            <section className="mt-6 rounded-xl border border-white/10 bg-[#0b1213]/88 p-6">
              <div className="mb-4 flex items-center gap-2">
                <KeyRound size={20} className="text-[#f2b36d]" />
                <h2 className="text-xl font-semibold">{c.endpoint}</h2>
              </div>
              <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-[#050808] p-4 sm:flex-row sm:items-center sm:justify-between">
                <code className="break-all font-mono text-sm text-white/80">{product.base_url}</code>
                <a href={product.base_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-white/70 hover:text-white">
                  <ExternalLink size={16} />
                  Open
                </a>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/50">{c.endpointDesc}</p>
            </section>
          </FadeIn>
        )}
      </div>

      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 backdrop-blur-sm">
          <FadeIn direction="up" delay={0}>
            <div className="w-full max-w-md rounded-xl border border-white/16 bg-[#101718] p-6 shadow-2xl">
              <h2 className="text-2xl font-semibold">{c.confirmTitle}</h2>

              <div className="my-6 space-y-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-white/52">{c.product}</span>
                  <span className="text-right font-medium">{product.name}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-white/52">{c.price}</span>
                  <span className="font-mono">{subscriptionPrice} credits</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3 text-sm">
                  <span className="text-white/52">{c.balance}</span>
                  <span className="font-mono">{(userProfile?.credits || 0).toFixed(2)} credits</span>
                </div>
              </div>

              {notice && notice !== c.success && (
                <div className="mb-4 flex gap-2 rounded-lg border border-[#f2b36d]/24 bg-[#f2b36d]/10 p-3 text-sm text-[#f6d4aa]">
                  <CreditCard size={17} className="mt-0.5 shrink-0" />
                  <span>{notice}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setShowPurchaseModal(false)} disabled={purchasing} className="min-h-11 flex-1 rounded-lg border border-white/10 px-4 text-sm text-white/72 hover:text-white disabled:opacity-50">
                  {c.cancel}
                </button>
                <button onClick={() => void handlePurchase()} disabled={purchasing} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-[#070b0d] hover:bg-white/88 disabled:opacity-50">
                  {purchasing ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      {c.processing}
                    </>
                  ) : (
                    c.confirm
                  )}
                </button>
              </div>
            </div>
          </FadeIn>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
