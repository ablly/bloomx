import { ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { subscribeActiveProducts } from '../services/productService';
import type { Product } from '../types/marketplace';
import type { CreditPlanId } from '../services/checkoutService';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const storyScrollRange = 7.4;

export const storySceneTargets = {
  hero: 0,
  features: 1,
  how: 2,
  models: 3,
  pricing: 4,
  testimonials: 5,
  apply: 6,
  cta: 7,
} as const;

interface HeroScrollNarrativeProps {
  onDashboardEnter?: () => void;
  onCreditCheckout?: (planId: CreditPlanId) => Promise<void> | void;
}

type SceneKind = 'hero' | 'features' | 'how' | 'models' | 'pricing' | 'voices' | 'apply' | 'cta';

interface SceneMeta {
  id: keyof typeof storySceneTargets;
  kind: SceneKind;
  eyebrow: string;
  title: string;
  subtitle: string;
}

interface SceneLine {
  label: string;
  text: string;
}

interface ModelTableRow {
  id: string;
  productId?: string;
  model: string;
  supplier: string;
  input: string;
  output: string;
  status: string;
  sales: number;
}

interface PricingAction {
  id: CreditPlanId;
  name: string;
  price: string;
  credits: string;
  detail: string;
}

const particles = Array.from({ length: 42 }, (_, index) => {
  const column = index % 7;
  const row = Math.floor(index / 7);
  return {
    id: index,
    left: 7 + column * 13 + ((row * 5) % 5),
    top: 12 + row * 13 + ((column * 3) % 7),
    size: 2 + ((index * 3) % 4),
    delay: `${(index % 14) * 0.42}s`,
    duration: `${11 + (index % 7) * 1.1}s`,
    opacity: 0.1 + (index % 5) * 0.035,
  };
});

const getStoryStart = () => {
  const section = document.getElementById('story-home');
  if (!section) return 0;
  return section.getBoundingClientRect().top + window.scrollY;
};

const getStoryProgress = () => {
  const start = getStoryStart();
  const range = Math.max(window.innerHeight * storyScrollRange, 1);
  return clamp01((window.scrollY - start) / range);
};

const HeroScrollNarrative = ({ onDashboardEnter, onCreditCheckout }: HeroScrollNarrativeProps) => {
  const { i18n, t } = useTranslation();
  const isZh = i18n.language?.startsWith('zh');
  const [progress, setProgress] = useState(0);
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [modelLoading, setModelLoading] = useState(true);
  const [checkoutPlan, setCheckoutPlan] = useState<CreditPlanId | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      setProgress(getStoryProgress());
    };

    const request = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request, { passive: true });

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = subscribeActiveProducts(
      12,
      (products) => {
        if (!mounted) return;
        setLiveProducts(products);
        setModelLoading(false);
      },
      (error) => {
        console.error('Failed to subscribe hero products:', error);
        if (mounted) {
          setModelLoading(false);
        }
      },
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const scenes = useMemo<SceneMeta[]>(
    () => [
      {
        id: 'hero',
        kind: 'hero',
        eyebrow: isZh ? '01 / 访问' : '01 / Visit',
        title: 'BloomX',
        subtitle: isZh ? '从访问网站到第一次模型调用。' : 'From domain visit to first model call.',
      },
      {
        id: 'features',
        kind: 'features',
        eyebrow: isZh ? '02 / 交易机制' : '02 / Mechanism',
        title: t('features.title'),
        subtitle: t('features.subtitle'),
      },
      {
        id: 'how',
        kind: 'how',
        eyebrow: isZh ? '03 / 闭环' : '03 / Loop',
        title: t('howItWorks.title'),
        subtitle: t('howItWorks.subtitle'),
      },
      {
        id: 'models',
        kind: 'models',
        eyebrow: isZh ? '04 / 供给' : '04 / Supply',
        title: t('models.title'),
        subtitle: t('models.subtitle'),
      },
      {
        id: 'pricing',
        kind: 'pricing',
        eyebrow: isZh ? '05 / 积分' : '05 / Credits',
        title: t('pricing.title'),
        subtitle: t('pricing.subtitle'),
      },
      {
        id: 'testimonials',
        kind: 'voices',
        eyebrow: isZh ? '06 / 供需双方' : '06 / Demand & supply',
        title: t('testimonials.title'),
        subtitle: isZh ? '三种真实角色视角，说明平台如何让供给、调用和售后闭环。' : 'Three operating perspectives for supply, usage, and support.',
      },
      {
        id: 'apply',
        kind: 'apply',
        eyebrow: isZh ? '07 / 商家入驻' : '07 / Merchant intake',
        title: `${t('seller.title')} ${t('seller.titleHighlight')}`,
        subtitle: t('seller.subtitle'),
      },
      {
        id: 'cta',
        kind: 'cta',
        eyebrow: isZh ? '08 / 上线闭环' : '08 / Launch loop',
        title: t('cta.title'),
        subtitle: t('cta.subtitle'),
      },
    ],
    [isZh, t],
  );

  const sceneLines = useMemo<Record<SceneKind, SceneLine[]>>(
    () => ({
      hero: [],
      features: [
        { label: t('features.routing.title'), text: t('features.routing.description') },
        { label: t('features.verified.title'), text: t('features.verified.description') },
        { label: t('features.compatible.title'), text: t('features.compatible.description') },
        { label: t('features.credits.title'), text: t('features.credits.description') },
      ],
      how: [
        { label: `01 ${t('howItWorks.step1.title')}`, text: t('howItWorks.step1.description') },
        { label: `02 ${t('howItWorks.step2.title')}`, text: t('howItWorks.step2.description') },
        { label: `03 ${t('howItWorks.step3.title')}`, text: t('howItWorks.step3.description') },
      ],
      models: [
        { label: 'gpt-5.5 / OpenAI', text: isZh ? '商家报价，推荐接入。' : 'Merchant pricing, recommended for intake.' },
        { label: 'claude-opus-4.6 / Anthropic', text: isZh ? '商家报价，等待验证。' : 'Merchant pricing, pending verification.' },
        { label: 'deepseek-v4 / DeepSeek', text: isZh ? '市场报价，按通过测试后的商家数据上架。' : 'Market pricing, listed after merchant testing.' },
      ],
      pricing: [
        { label: `${t('pricing.starter.name')} · ${t('pricing.starter.price')}`, text: t('pricing.starter.credits') },
        { label: `${t('pricing.creator.name')} · ${t('pricing.creator.price')}`, text: `${t('pricing.creator.credits')} · ${t('pricing.creator.bonus')}` },
        { label: `${t('pricing.pro.name')} · ${t('pricing.pro.price')}`, text: `${t('pricing.pro.credits')} · ${t('pricing.pro.bonus')}` },
      ],
      voices: [
        { label: isZh ? '商家' : 'Merchant', text: t('testimonials.quote1') },
        { label: isZh ? '用户' : 'Caller', text: t('testimonials.quote2') },
        { label: isZh ? '售后' : 'Support', text: t('testimonials.quote3') },
      ],
      apply: [
        { label: t('seller.form.entityName'), text: isZh ? '提交实体名称，便于审核供给主体。' : 'Submit the entity name for merchant review.' },
        { label: t('seller.form.email'), text: isZh ? '留下工作邮箱，接收测试和结算通知。' : 'Use a work email for testing and settlement updates.' },
        { label: t('seller.form.provider'), text: isZh ? '说明主要供应商和 OpenAI 兼容接口。' : 'Declare the main provider and OpenAI-compatible route.' },
      ],
      cta: [
        { label: isZh ? '注册与邮箱验证' : 'Registration', text: t('hero.feature1') },
        { label: isZh ? '商家 API 测试' : 'API testing', text: t('hero.feature2') },
        { label: isZh ? '订阅与结算闭环' : 'Billing loop', text: t('hero.feature3') },
      ],
    }),
    [isZh, t],
  );

  const modelRows = useMemo<ModelTableRow[]>(() => {
    const fallbackRows: ModelTableRow[] = [
      {
        id: 'fallback-gpt-55',
        model: 'gpt-5.5',
        supplier: 'OpenAI pool',
        input: '报价',
        output: '报价',
        status: isZh ? '推荐接入' : 'Recommended',
        sales: 128,
      },
      {
        id: 'fallback-claude-opus',
        model: 'claude-opus-4.6',
        supplier: 'Anthropic pool',
        input: '报价',
        output: '报价',
        status: isZh ? '待验证' : 'Pending',
        sales: 86,
      },
      {
        id: 'fallback-deepseek',
        model: 'deepseek-v4',
        supplier: 'DeepSeek pool',
        input: '市场价',
        output: '市场价',
        status: isZh ? '市场报价' : 'Market',
        sales: 73,
      },
      {
        id: 'fallback-kimi',
        model: 'kimi-k2.6',
        supplier: 'Moonshot pool',
        input: '市场价',
        output: '市场价',
        status: isZh ? '测试中' : 'Testing',
        sales: 51,
      },
      {
        id: 'fallback-qwen',
        model: 'qwen-max-2026',
        supplier: 'Alibaba pool',
        input: '报价',
        output: '报价',
        status: isZh ? '待上架' : 'Queued',
        sales: 44,
      },
    ];

    if (!liveProducts.length) return fallbackRows;

    return liveProducts
      .flatMap((product) =>
        product.models.map((model) => ({
          id: `${product.id}-${model}`,
          productId: product.id,
          model,
          supplier: product.name,
          input: `${Number(product.pricing.input_per_1k || 0).toFixed(3)}/1K`,
          output: `${Number(product.pricing.output_per_1k || 0).toFixed(3)}/1K`,
          status: product.is_verified ? (isZh ? '已验证' : 'Verified') : (isZh ? '待验证' : 'Pending'),
          sales: Number(product.total_sales || 0),
        })),
      )
      .slice(0, 18);
  }, [isZh, liveProducts]);

  const pricingActions = useMemo<PricingAction[]>(
    () => [
      {
        id: 'starter',
        name: t('pricing.starter.name'),
        price: t('pricing.starter.price'),
        credits: t('pricing.starter.credits'),
        detail: isZh ? '个人测试和小规模调用' : 'Personal tests and small runs',
      },
      {
        id: 'creator',
        name: t('pricing.creator.name'),
        price: t('pricing.creator.price'),
        credits: t('pricing.creator.credits'),
        detail: t('pricing.creator.bonus'),
      },
      {
        id: 'pro',
        name: t('pricing.pro.name'),
        price: t('pricing.pro.price'),
        credits: t('pricing.pro.credits'),
        detail: t('pricing.pro.bonus'),
      },
    ],
    [isZh, t],
  );

  const handleCheckout = async (planId: CreditPlanId) => {
    setCheckoutPlan(planId);
    setCheckoutError(null);

    try {
      await onCreditCheckout?.(planId);
      setCheckoutError(isZh ? '正在打开 Stripe 支付窗口。支付成功后积分会自动入账。' : 'Opening Stripe Checkout. Credits will be added after payment succeeds.');
      setCheckoutPlan(null);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : isZh ? 'Stripe 支付入口打开失败，请稍后重试。' : 'Failed to open Stripe Checkout. Please try again.');
      setCheckoutPlan(null);
    }
  };

  const activeSceneIndex = Math.min(scenes.length - 1, Math.round(progress * (scenes.length - 1)));
  const scenePosition = progress * (scenes.length - 1);

  const scrollToScene = (target: keyof typeof storySceneTargets) => {
    const start = getStoryStart();
    const range = window.innerHeight * storyScrollRange;
    const ratio = storySceneTargets[target] / Math.max(scenes.length - 1, 1);
    window.scrollTo({ top: start + range * ratio, behavior: 'smooth' });
  };

  const vars = useMemo(
    () =>
      ({
        '--story-progress': progress,
      }) as CSSProperties,
    [progress],
  );

  const renderModelTable = () => (
    <div className="mt-7 max-w-[54rem] sm:mt-8">
      <div className="mb-3 flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#637151]/76">
        <span>{isZh ? '实时模型列表' : 'Live model list'}</span>
        <Link to="/marketplace" className="inline-flex items-center gap-1 tracking-normal text-[#171c16] hover:text-[#637151]">
          {isZh ? '进入市场' : 'Open market'}
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="bloomx-model-table-scroll max-h-[17.5rem] overflow-y-auto border-y border-[#293027]/14 pr-1">
        <div className="min-w-[48rem]">
          <div className="grid grid-cols-[1.35fr_1.25fr_0.78fr_0.78fr_0.85fr_0.66fr] gap-4 border-b border-[#293027]/12 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[#293027]/48">
            <span>{isZh ? '模型' : 'Model'}</span>
            <span>{isZh ? '供应' : 'Supply'}</span>
            <span>{isZh ? '输入' : 'Input'}</span>
            <span>{isZh ? '输出' : 'Output'}</span>
            <span>{isZh ? '状态' : 'Status'}</span>
            <span className="text-right">{isZh ? '操作' : 'Action'}</span>
          </div>

          <div className="bloomx-model-table-drift">
            {modelRows.map((row, rowIndex) => {
              const rowContent = (
                <>
                  <span className="truncate font-semibold text-[#171c16]">{row.model}</span>
                  <span className="truncate text-[#293027]/70">{row.supplier}</span>
                  <span className="font-mono text-[#293027]/64">{row.input}</span>
                  <span className="font-mono text-[#293027]/64">{row.output}</span>
                  <span className="inline-flex items-center gap-2 text-[#293027]/72">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#637151]" />
                    {row.status}
                  </span>
                  <span className="text-right font-semibold text-[#171c16]">{isZh ? '购买' : 'Buy'}</span>
                </>
              );

              const className =
                'bloomx-model-row grid grid-cols-[1.35fr_1.25fr_0.78fr_0.78fr_0.85fr_0.66fr] gap-4 border-b border-[#293027]/10 py-4 text-sm transition hover:bg-[#f6f2ea]/34';

              return row.productId ? (
                <Link
                  key={row.id}
                  to={`/product/${row.productId}`}
                  className={className}
                  style={{ '--row-index': rowIndex } as CSSProperties}
                >
                  {rowContent}
                </Link>
              ) : (
                <Link
                  key={row.id}
                  to="/marketplace"
                  className={className}
                  style={{ '--row-index': rowIndex } as CSSProperties}
                >
                  {rowContent}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-[#293027]/48">
        {modelLoading
          ? isZh
            ? '正在同步卖家上架数据...'
            : 'Syncing merchant listings...'
          : isZh
            ? '卖家通过测试并上架后，这里会实时刷新。'
            : 'New verified merchant listings appear here in real time.'}
      </p>
    </div>
  );

  const renderPricingActions = () => (
    <div className="mt-7 max-w-[38rem] sm:mt-8">
      <div className="divide-y divide-[#293027]/12 border-y border-[#293027]/14">
        {pricingActions.map((plan, planIndex) => (
          <div key={plan.id} className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 py-4">
            <span className="font-mono text-xs font-semibold text-[#637151]/62">
              {String(planIndex + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <div className="text-base font-semibold tracking-[-0.02em] text-[#171c16] sm:text-lg">
                {plan.name} · {plan.price}
              </div>
              <div className="mt-1 text-sm leading-6 text-[#293027]/66">
                {plan.credits} · {plan.detail}
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleCheckout(plan.id)}
              disabled={checkoutPlan === plan.id}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#111610] px-5 text-sm font-semibold text-[#f6f2ea] transition hover:bg-[#283025] disabled:cursor-not-allowed disabled:opacity-58"
            >
              {checkoutPlan === plan.id ? (isZh ? '打开中' : 'Opening') : isZh ? '购买' : 'Buy'}
            </button>
          </div>
        ))}
      </div>

      {checkoutError && (
        <div className="mt-3 flex flex-col gap-3 border-l border-[#637151]/38 pl-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium leading-6 text-[#293027]/76">{checkoutError}</p>
          <Link to="/dashboard" className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-[#293027]/16 px-4 text-sm font-semibold text-[#171c16] hover:bg-[#f6f2ea]/54">
            {isZh ? '查看积分' : 'View credits'}
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <div className="absolute inset-0 z-20 overflow-hidden" style={vars}>
      <div className="pointer-events-none absolute inset-0 z-0">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="bloomx-story-particle absolute rounded-full bg-[#637151]"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
              '--particle-opacity': particle.opacity,
            } as CSSProperties}
          />
        ))}
      </div>

      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_18%_40%,rgba(246,242,234,0.44),transparent_20rem),linear-gradient(90deg,rgba(246,242,234,0.68),rgba(246,242,234,0.22)_39%,rgba(246,242,234,0)_72%)]" />

      <div className="relative z-10 h-full w-full">
        {scenes.map((scene, index) => {
          const distance = Math.abs(scenePosition - index);
          const opacity = clamp01(1 - distance * 1.38);
          const translate = (index - scenePosition) * 42;
          const isActive = distance < 0.48;
          const lines = sceneLines[scene.kind];

          return (
            <section
              key={scene.id}
              id={`story-${scene.id}`}
              data-screen-label={`${String(index + 1).padStart(2, '0')} ${scene.id}`}
              className={`absolute left-6 right-6 top-1/2 sm:left-10 sm:right-auto lg:left-16 xl:left-20 ${
                scene.kind === 'models' ? 'max-w-[54rem] sm:w-[54rem]' : 'max-w-[38rem] sm:w-[38rem]'
              }`}
              style={{
                opacity,
                pointerEvents: isActive ? 'auto' : 'none',
                transform: `translate3d(0, calc(-50% + ${translate}px), 0)`,
                transition: 'opacity 260ms linear, transform 520ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div className="story-copy">
                <div className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-[#637151]/82">
                  {scene.eyebrow}
                </div>
                <h1 className={`${scene.kind === 'hero' ? 'mt-5 text-6xl sm:text-7xl lg:text-8xl' : 'mt-4 text-4xl sm:text-5xl lg:text-6xl'} max-w-[11ch] font-semibold leading-[0.9] tracking-[-0.055em] text-[#111610]`}>
                  {scene.title}
                </h1>
                <p className="mt-4 max-w-[32rem] text-base font-medium leading-7 text-[#293027]/72 sm:text-lg sm:leading-8">
                  {scene.subtitle}
                </p>

                {scene.kind === 'hero' && (
                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={onDashboardEnter}
                      className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#111610] px-7 text-sm font-semibold text-[#f6f2ea] shadow-[0_18px_48px_rgba(35,28,18,0.16)] hover:bg-[#283025]"
                    >
                      <span>{isZh ? '进入 BloomX 控制台' : 'Open BloomX Console'}</span>
                      <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToScene('models')}
                      className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#293027]/12 bg-[#f6f2ea]/48 px-7 text-sm font-semibold text-[#171c16] backdrop-blur-xl hover:bg-[#f6f2ea]/72"
                    >
                      {isZh ? '查看模型供给' : 'View Model Supply'}
                    </button>
                  </div>
                )}

                {scene.kind === 'models' && renderModelTable()}

                {scene.kind === 'pricing' && renderPricingActions()}

                {scene.kind !== 'hero' && scene.kind !== 'models' && scene.kind !== 'pricing' && (
                  <div className="mt-8 grid max-w-[32rem] gap-4 sm:mt-10">
                    {lines.map((line, lineIndex) => (
                      <div key={`${scene.id}-${line.label}`} className="grid grid-cols-[2.5rem_1fr] gap-4">
                        <span className="pt-0.5 font-mono text-xs font-semibold text-[#637151]/62">
                          {String(lineIndex + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <h2 className="text-base font-semibold tracking-[-0.02em] text-[#171c16] sm:text-lg">
                            {line.label}
                          </h2>
                          <p className="mt-1 text-sm leading-6 text-[#293027]/68 sm:text-base sm:leading-7">
                            {line.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        })}

        <div className="pointer-events-none absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-2">
          {scenes.map((scene, index) => (
            <span
              key={scene.id}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: index === activeSceneIndex ? 30 : 6,
                background: index === activeSceneIndex ? '#637151' : 'rgba(99,113,81,0.26)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroScrollNarrative;
