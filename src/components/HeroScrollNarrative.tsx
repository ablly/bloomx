import {
  Activity,
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  Network,
  Rocket,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserPlus,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ChangeEvent, type CSSProperties, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { createSellerApplication } from '../services/sellerApplicationService';
import { createStripeCheckout, type CreditPlanId } from '../services/checkoutService';

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
}

type ModelStatus = 'recommended' | 'reviewing' | 'market';
type SceneKind = 'hero' | 'features' | 'how' | 'models' | 'pricing' | 'voices' | 'apply' | 'cta';

interface SceneMeta {
  id: keyof typeof storySceneTargets;
  kind: SceneKind;
  eyebrow: string;
  title: string;
  subtitle: string;
}

const particles = Array.from({ length: 54 }, (_, index) => {
  const column = index % 9;
  const row = Math.floor(index / 9);
  return {
    id: index,
    left: 8 + column * 10 + ((row * 7) % 6),
    top: 10 + row * 12 + ((column * 5) % 8),
    size: 2 + ((index * 3) % 5),
    delay: `${(index % 14) * 0.42}s`,
    duration: `${10 + (index % 8) * 1.2}s`,
    opacity: 0.16 + (index % 5) * 0.05,
  };
});

const modelRows: Array<{ id: string; provider: string; pricing: 'merchant' | 'market'; status: ModelStatus }> = [
  { id: 'gpt-5.5', provider: 'OpenAI', pricing: 'merchant', status: 'recommended' },
  { id: 'claude-opus-4.6', provider: 'Anthropic', pricing: 'merchant', status: 'reviewing' },
  { id: 'claude-opus-4.7', provider: 'Anthropic', pricing: 'merchant', status: 'reviewing' },
  { id: 'deepseek-v4', provider: 'DeepSeek', pricing: 'market', status: 'market' },
  { id: 'kimi-k2.6', provider: 'Moonshot AI', pricing: 'market', status: 'market' },
];

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

const HeroScrollNarrative = ({ onDashboardEnter }: HeroScrollNarrativeProps) => {
  const { i18n, t } = useTranslation();
  const { currentUser, loading: authLoading } = useAuth();
  const isZh = i18n.language?.startsWith('zh');
  const [progress, setProgress] = useState(0);
  const [checkoutPlan, setCheckoutPlan] = useState<CreditPlanId | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<CreditPlanId>('creator');
  const [sellerStatus, setSellerStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [sellerError, setSellerError] = useState('');
  const [sellerForm, setSellerForm] = useState({
    name: '',
    email: '',
    provider: 'openai' as 'openai' | 'anthropic' | 'google' | 'mixed',
    capacity: '',
  });

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
        subtitle: isZh
          ? '把原先分散的评价内容收敛成三种真实角色视角。'
          : 'Three operating perspectives, not disconnected quotes.',
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

  const featureItems = useMemo(
    () => [
      {
        icon: Network,
        title: t('features.routing.title'),
        desc: t('features.routing.description'),
      },
      {
        icon: ShieldCheck,
        title: t('features.verified.title'),
        desc: t('features.verified.description'),
      },
      {
        icon: Zap,
        title: t('features.compatible.title'),
        desc: t('features.compatible.description'),
      },
      {
        icon: Activity,
        title: t('features.credits.title'),
        desc: t('features.credits.description'),
      },
    ],
    [t],
  );

  const steps = useMemo(
    () => [
      {
        num: '01',
        icon: UserPlus,
        title: t('howItWorks.step1.title'),
        desc: t('howItWorks.step1.description'),
      },
      {
        num: '02',
        icon: CreditCard,
        title: t('howItWorks.step2.title'),
        desc: t('howItWorks.step2.description'),
      },
      {
        num: '03',
        icon: Rocket,
        title: t('howItWorks.step3.title'),
        desc: t('howItWorks.step3.description'),
      },
    ],
    [t],
  );

  const plans = useMemo(
    () => [
      {
        key: 'starter' as CreditPlanId,
        name: t('pricing.starter.name'),
        desc: t('pricing.starter.desc'),
        price: t('pricing.starter.price'),
        credits: t('pricing.starter.credits'),
        features: [t('pricing.starter.feature1'), t('pricing.starter.feature2'), t('pricing.starter.feature3')],
      },
      {
        key: 'creator' as CreditPlanId,
        name: t('pricing.creator.name'),
        desc: t('pricing.creator.desc'),
        price: t('pricing.creator.price'),
        credits: t('pricing.creator.credits'),
        bonus: t('pricing.creator.bonus'),
        featured: true,
        features: [t('pricing.creator.feature1'), t('pricing.creator.feature2'), t('pricing.creator.feature3'), t('pricing.creator.feature4')],
      },
      {
        key: 'pro' as CreditPlanId,
        name: t('pricing.pro.name'),
        desc: t('pricing.pro.desc'),
        price: t('pricing.pro.price'),
        credits: t('pricing.pro.credits'),
        bonus: t('pricing.pro.bonus'),
        features: [t('pricing.pro.feature1'), t('pricing.pro.feature2'), t('pricing.pro.feature3'), t('pricing.pro.feature4')],
      },
    ],
    [t],
  );

  const voices = useMemo(
    () => [
      {
        label: isZh ? '供给侧' : 'Supply side',
        quote: t('testimonials.quote1'),
      },
      {
        label: isZh ? '调用侧' : 'Caller side',
        quote: t('testimonials.quote2'),
      },
      {
        label: isZh ? '售后侧' : 'After-sales',
        quote: t('testimonials.quote3'),
      },
    ],
    [isZh, t],
  );

  const activeSceneIndex = Math.min(scenes.length - 1, Math.round(progress * (scenes.length - 1)));
  const scenePosition = progress * (scenes.length - 1);
  const activePlanMeta = plans.find((plan) => plan.key === activePlan) || plans[1];

  const handleCheckout = async (planId: CreditPlanId) => {
    setCheckoutError(null);
    setActivePlan(planId);

    if (authLoading) return;

    if (!currentUser) {
      setCheckoutError(t('pricing.checkout.signInRequired'));
      return;
    }

    setCheckoutPlan(planId);
    try {
      const checkout = await createStripeCheckout(planId);
      window.location.assign(checkout.checkoutUrl);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : t('pricing.checkout.genericError'));
      setCheckoutPlan(null);
    }
  };

  const handleSellerChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setSellerForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSellerSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSellerError('');

    if (!sellerForm.name || !sellerForm.email || !sellerForm.capacity) {
      setSellerError(isZh ? '请完整填写申请信息。' : 'Please complete all fields.');
      return;
    }

    if (!sellerForm.email.includes('@')) {
      setSellerError(isZh ? '请输入有效的工作邮箱。' : 'Please enter a valid work email.');
      return;
    }

    if (!currentUser) {
      setSellerError(isZh ? '请先登录后再提交商家申请。' : 'Please sign in before submitting.');
      return;
    }

    const capacityNum = Number.parseInt(sellerForm.capacity, 10);
    if (Number.isNaN(capacityNum) || capacityNum < 100) {
      setSellerError(isZh ? '预计月容量至少为 $100。' : 'Capacity must be at least $100.');
      return;
    }

    setSellerStatus('loading');
    try {
      await createSellerApplication({
        uid: currentUser.uid,
        name: sellerForm.name,
        email: sellerForm.email,
        provider: sellerForm.provider,
        capacity: capacityNum,
      });
      setSellerStatus('success');
    } catch (error) {
      setSellerStatus('error');
      setSellerError(error instanceof Error ? error.message : isZh ? '提交失败，请稍后重试。' : 'Submission failed. Please try again.');
    }
  };

  const statusMeta = (status: ModelStatus) => {
    if (status === 'recommended') {
      return {
        label: isZh ? '推荐接入' : 'Recommended',
        icon: <CheckCircle2 size={15} className="text-[#a7f3d0]" />,
      };
    }
    if (status === 'reviewing') {
      return {
        label: isZh ? '待验证' : 'Pending review',
        icon: <Clock3 size={15} className="text-[#9fd4ff]" />,
      };
    }
    return {
      label: isZh ? '市场报价' : 'Market pricing',
      icon: <TrendingUp size={15} className="text-[#f2d28a]" />,
    };
  };

  const pricingLabel = (pricing: 'merchant' | 'market') => {
    if (pricing === 'merchant') return isZh ? '商家报价' : 'Merchant quote';
    return isZh ? '市场报价' : 'Market quote';
  };

  const scrollToScene = (target: keyof typeof storySceneTargets) => {
    const start = getStoryStart();
    const range = window.innerHeight * storyScrollRange;
    const ratio = storySceneTargets[target] / Math.max(scenes.length - 1, 1);
    window.scrollTo({ top: start + range * ratio, behavior: 'smooth' });
  };

  const renderHeroVisual = () => (
    <div className="relative min-h-[14rem] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#07130f]/75 p-4 shadow-[0_32px_90px_rgba(3,10,9,0.42)] backdrop-blur-2xl sm:rounded-[2rem] sm:p-5 md:min-h-[21rem]">
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-4 py-2.5 text-sm text-white/60 sm:py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#a7f3d0]" />
        <span>bloomx.io</span>
        <span className="ml-auto text-white/40">verified route</span>
      </div>
      <div className="mt-4 grid gap-3 sm:mt-8 sm:gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 sm:p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-white/40">request</div>
          <div className="mt-3 font-mono text-sm leading-7 text-white/70">
            POST /v1/chat/completions
            <br />
            model: gpt-5.5
            <br />
            merchant: verified
          </div>
        </div>
        <div className="ml-auto w-full rounded-2xl border border-[#a7f3d0]/20 bg-[#a7f3d0]/10 p-4 sm:w-[78%] sm:p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-[#a7f3d0]/70">settlement ready</div>
          <div className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">200 OK</div>
        </div>
      </div>
    </div>
  );

  const renderFeatureVisual = () => (
    <div className="grid gap-2 sm:gap-3">
      {featureItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={item.title}
            className={`rounded-[1.1rem] border border-white/10 p-4 backdrop-blur-xl sm:rounded-[1.35rem] sm:p-5 ${index === 1 ? 'bg-white/[0.09]' : 'bg-white/[0.045]'}`}
          >
            <div className="flex items-start gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/[0.065] text-[#d9f7eb] sm:h-11 sm:w-11">
                <Icon size={20} />
              </span>
              <div>
                <h3 className="text-base font-semibold tracking-[-0.02em] text-white sm:text-lg">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-white/60 sm:mt-2">{item.desc}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderHowVisual = () => (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 backdrop-blur-2xl sm:rounded-[2rem] sm:p-6">
      <div className="absolute left-12 top-12 h-[calc(100%-6rem)] w-px bg-gradient-to-b from-[#a7f3d0] via-white/20 to-transparent" />
      <div className="space-y-7">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.num} className="relative grid grid-cols-[3.25rem_1fr] gap-5">
              <span className="z-10 grid h-[3.25rem] w-[3.25rem] place-items-center rounded-2xl border border-white/10 bg-[#09221d] text-[#d9f7eb]">
                <Icon size={21} />
              </span>
              <div>
                <div className="font-mono text-xs text-white/40">{step.num}</div>
                <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderModelsVisual = () => (
    <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#07130f]/75 backdrop-blur-2xl sm:rounded-[1.75rem]">
      <div className="grid grid-cols-[1.15fr_0.8fr_0.95fr] border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/40 sm:px-5 sm:py-4 sm:tracking-[0.14em]">
        <span>{t('models.tableHeaders.model')}</span>
        <span>{t('models.tableHeaders.input')}</span>
        <span>{t('models.tableHeaders.status')}</span>
      </div>
      {modelRows.map((model) => {
        const meta = statusMeta(model.status);
        return (
          <div key={model.id} className="grid grid-cols-[1.15fr_0.8fr_0.95fr] items-center border-b border-white/[0.07] px-4 py-3 last:border-0 sm:px-5 sm:py-4">
            <div>
              <div className="font-mono text-xs font-semibold text-white sm:text-sm">{model.id}</div>
              <div className="mt-1 text-xs text-white/40">{model.provider}</div>
            </div>
            <div className="text-xs text-white/60 sm:text-sm">{pricingLabel(model.pricing)}</div>
            <div className="flex items-center gap-2 text-xs text-white/70 sm:text-sm">
              {meta.icon}
              <span>{meta.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderPricingVisual = () => (
    <div className="grid gap-3 lg:grid-cols-[0.62fr_1fr] lg:gap-4">
      <div className="grid gap-2">
        {plans.map((plan) => (
          <button
            key={plan.key}
            type="button"
            onClick={() => setActivePlan(plan.key)}
            className={`min-h-16 rounded-2xl border px-4 text-left ${
              activePlan === plan.key ? 'border-[#a7f3d0]/40 bg-[#a7f3d0]/10 text-white' : 'border-white/10 bg-white/[0.045] text-white/60'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">{plan.name}</span>
              <span className="font-mono text-sm">{plan.price}</span>
            </div>
            <div className="mt-1 text-xs">{plan.desc}</div>
          </button>
        ))}
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-[#07130f]/80 p-4 backdrop-blur-2xl sm:rounded-[1.75rem] sm:p-6">
        {activePlanMeta.featured && (
          <div className="mb-4 inline-flex rounded-full bg-[#d9f7eb] px-3 py-1 text-xs font-semibold text-[#07130f]">
            {t('pricing.mostPopular')}
          </div>
        )}
        <h3 className="text-2xl font-semibold tracking-[-0.03em] text-white">{activePlanMeta.name}</h3>
        <div className="mt-5 flex items-end gap-2">
          <span className="text-5xl font-semibold tracking-[-0.06em] text-white sm:text-6xl">{activePlanMeta.price}</span>
          <span className="pb-2 text-sm text-white/40">{t('pricing.perTopUp')}</span>
        </div>
        <p className="mt-3 text-sm text-white/60">
          {activePlanMeta.credits}
          {activePlanMeta.bonus && <span className="ml-2 text-[#d9f7eb]">({activePlanMeta.bonus})</span>}
        </p>
        <ul className="mt-6 space-y-3">
          {activePlanMeta.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm text-white/70">
              <Check size={17} className="mt-0.5 shrink-0 text-[#a7f3d0]" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={checkoutPlan !== null || authLoading}
          onClick={() => void handleCheckout(activePlanMeta.key)}
          className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#d9f7eb] px-5 text-sm font-semibold text-[#07130f] hover:bg-white disabled:cursor-wait disabled:opacity-60"
        >
          {checkoutPlan === activePlanMeta.key ? t('pricing.checkout.processing') : t('pricing.getStarted')}
          <ArrowRight size={17} />
        </button>
        {checkoutError && (
          <div className="mt-4 rounded-2xl border border-[#f0a091]/25 bg-[#e07d6b]/10 px-4 py-3 text-sm text-[#f0a091]">
            {checkoutError}
          </div>
        )}
      </div>
    </div>
  );

  const renderVoicesVisual = () => (
    <div className="grid gap-4">
      {voices.map((voice, index) => (
        <div key={voice.label} className={`rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-4 backdrop-blur-xl sm:rounded-[1.5rem] sm:p-5 ${index === 1 ? 'sm:ml-8' : ''}`}>
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#a7f3d0]/70">{voice.label}</div>
          <p className="text-base leading-7 text-white/75">"{voice.quote}"</p>
        </div>
      ))}
    </div>
  );

  const renderApplyVisual = () => {
    if (sellerStatus === 'success') {
      return (
        <div className="rounded-[1.75rem] border border-[#a7f3d0]/25 bg-[#a7f3d0]/10 p-7 text-center backdrop-blur-2xl">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#a7f3d0]/20 text-[#a7f3d0]">
            <CheckCircle2 size={28} />
          </div>
          <h3 className="mt-5 text-2xl font-semibold text-white">{t('seller.form.success')}</h3>
          <p className="mt-3 text-sm leading-6 text-white/70">{t('seller.form.successMessage', { email: sellerForm.email })}</p>
          <button
            type="button"
            onClick={() => setSellerStatus('idle')}
            className="mt-6 min-h-11 rounded-2xl border border-white/10 bg-white/[0.06] px-5 text-sm font-semibold text-white"
          >
            {t('seller.form.submitAnother')}
          </button>
        </div>
      );
    }

    return (
      <form onSubmit={handleSellerSubmit} className="rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-4 backdrop-blur-2xl sm:rounded-[1.75rem] sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
            {t('seller.form.entityName')}
            <input
              name="name"
              value={sellerForm.name}
              onChange={handleSellerChange}
              placeholder={t('seller.form.entityNamePlaceholder')}
              className="min-h-12 rounded-2xl border border-white/10 bg-[#061312]/80 px-4 text-sm normal-case tracking-normal text-white outline-none placeholder:text-white/30 focus:border-[#a7f3d0]/40"
            />
          </label>
          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
            {t('seller.form.email')}
            <input
              name="email"
              type="email"
              value={sellerForm.email}
              onChange={handleSellerChange}
              placeholder={t('seller.form.emailPlaceholder')}
              className="min-h-12 rounded-2xl border border-white/10 bg-[#061312]/80 px-4 text-sm normal-case tracking-normal text-white outline-none placeholder:text-white/30 focus:border-[#a7f3d0]/40"
            />
          </label>
          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
            {t('seller.form.provider')}
            <select
              name="provider"
              value={sellerForm.provider}
              onChange={handleSellerChange}
              className="min-h-12 rounded-2xl border border-white/10 bg-[#061312]/80 px-4 text-sm normal-case tracking-normal text-white outline-none focus:border-[#a7f3d0]/40"
            >
              <option value="openai">{t('seller.form.providerOpenAI')}</option>
              <option value="anthropic">{t('seller.form.providerAnthropic')}</option>
              <option value="google">{t('seller.form.providerGoogle')}</option>
              <option value="mixed">{t('seller.form.providerMixed')}</option>
            </select>
          </label>
          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
            {t('seller.form.capacity')}
            <input
              name="capacity"
              type="number"
              value={sellerForm.capacity}
              onChange={handleSellerChange}
              placeholder={t('seller.form.capacityPlaceholder')}
              className="min-h-12 rounded-2xl border border-white/10 bg-[#061312]/80 px-4 text-sm normal-case tracking-normal text-white outline-none placeholder:text-white/30 focus:border-[#a7f3d0]/40"
            />
          </label>
        </div>

        {sellerError && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#f0a091]/20 bg-[#e07d6b]/10 px-4 py-3 text-sm text-[#f0a091]">
            <AlertCircle size={16} />
            <span>{sellerError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={sellerStatus === 'loading'}
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#d9f7eb] px-5 text-sm font-semibold text-[#07130f] hover:bg-white disabled:cursor-wait disabled:opacity-60"
        >
          {sellerStatus === 'loading' ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              {t('seller.form.submitting')}
            </>
          ) : (
            <>
              {t('seller.form.submit')}
              <ArrowRight size={17} />
            </>
          )}
        </button>
        <p className="mt-4 text-center text-xs leading-5 text-white/40">{t('seller.form.terms')}</p>
      </form>
    );
  };

  const renderCtaVisual = () => (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#d9f7eb] p-5 text-[#07130f] shadow-[0_32px_90px_rgba(10,40,31,0.28)] sm:rounded-[2rem] sm:p-7">
      <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-white/40 blur-3xl" />
      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#07130f]/10 bg-white/30 px-3 py-1 text-xs font-semibold">
          <Sparkles size={14} />
          {isZh ? '可交易能力闭环' : 'Tradable capacity loop'}
        </div>
        <div className="mt-7 grid gap-3">
          {[t('hero.feature1'), t('hero.feature2'), t('hero.feature3')].map((item, index) => (
            <div key={item} className="grid grid-cols-[2.5rem_1fr] items-center gap-4 rounded-2xl bg-[#07130f]/8 p-4">
              <span className="font-mono text-sm text-[#07130f]/40">{String(index + 1).padStart(2, '0')}</span>
              <span className="text-lg font-semibold tracking-[-0.02em]">{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onDashboardEnter}
            className="min-h-12 rounded-2xl bg-[#07130f] px-5 text-sm font-semibold text-[#f4fff8]"
          >
            {t('cta.primaryButton')}
          </button>
          <button
            type="button"
            onClick={() => scrollToScene('pricing')}
            className="min-h-12 rounded-2xl border border-[#07130f]/10 bg-white/30 px-5 text-sm font-semibold text-[#07130f]"
          >
            {t('cta.secondaryButton')}
          </button>
        </div>
      </div>
    </div>
  );

  const renderSceneVisual = (kind: SceneKind) => {
    if (kind === 'hero') return renderHeroVisual();
    if (kind === 'features') return renderFeatureVisual();
    if (kind === 'how') return renderHowVisual();
    if (kind === 'models') return renderModelsVisual();
    if (kind === 'pricing') return renderPricingVisual();
    if (kind === 'voices') return renderVoicesVisual();
    if (kind === 'apply') return renderApplyVisual();
    return renderCtaVisual();
  };

  const vars = useMemo(
    () =>
      ({
        '--story-progress': progress,
      }) as CSSProperties,
    [progress],
  );

  return (
    <div className="absolute inset-0 z-20 overflow-hidden" style={vars}>
      <div className="pointer-events-none absolute inset-0 z-0">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="bloomx-story-particle absolute rounded-full bg-[#d9f7eb]"
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

      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_72%_38%,rgba(133,204,181,0.18),transparent_28rem),linear-gradient(90deg,rgba(6,10,9,0.18),rgba(6,10,9,0.72)_58%,rgba(6,10,9,0.88))]" />

      <div className="relative z-10 mx-auto grid h-full w-full max-w-7xl items-center px-5 py-24 sm:px-6 lg:px-8">
        {scenes.map((scene, index) => {
          const distance = Math.abs(scenePosition - index);
          const opacity = clamp01(1 - distance * 1.38);
          const translate = (index - scenePosition) * 42;
          const isActive = distance < 0.48;

          return (
            <section
              key={scene.id}
              id={`story-${scene.id}`}
              data-screen-label={`${String(index + 1).padStart(2, '0')} ${scene.id}`}
              className="absolute inset-x-5 top-1/2 grid -translate-y-1/2 grid-cols-1 items-center gap-6 sm:inset-x-6 lg:inset-x-8 lg:grid-cols-[minmax(0,0.86fr)_minmax(26rem,0.78fr)] lg:gap-12"
              style={{
                opacity,
                pointerEvents: isActive ? 'auto' : 'none',
                transform: `translate3d(0, calc(-50% + ${translate}px), 0)`,
                transition: 'opacity 260ms linear, transform 520ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div className="min-w-0 max-w-3xl">
                <div className="font-mono text-xs font-semibold uppercase tracking-[0.26em] text-[#d9f7eb]/80">
                  {scene.eyebrow}
                </div>
                <h1 className={`${scene.kind === 'hero' ? 'mt-6 text-6xl sm:text-8xl lg:text-[8.5rem]' : 'mt-5 text-4xl sm:text-6xl lg:text-7xl'} max-w-[12ch] font-semibold leading-[0.88] tracking-[-0.075em] text-[#f4fff8]`}>
                  {scene.title}
                </h1>
                <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-[#f4fff8]/80 sm:mt-7 sm:text-xl sm:leading-8">
                  {scene.subtitle}
                </p>

                {scene.kind === 'hero' && (
                  <div className="mt-6 flex flex-col gap-3 sm:mt-9 sm:flex-row">
                    <button
                      type="button"
                      onClick={onDashboardEnter}
                      className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#d9f7eb] px-7 text-sm font-semibold text-[#07130f] shadow-[0_18px_48px_rgba(7,19,15,0.22)] hover:bg-white"
                    >
                      <span>{isZh ? '进入 BloomX 控制台' : 'Open BloomX Console'}</span>
                      <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToScene('models')}
                      className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] px-7 text-sm font-semibold text-[#f4fff8] backdrop-blur-xl hover:bg-white/[0.09]"
                    >
                      {isZh ? '查看模型供给' : 'View Model Supply'}
                    </button>
                  </div>
                )}

                {scene.kind === 'features' && (
                  <div className="mt-8 grid max-w-xl gap-3">
                    {featureItems.slice(0, 3).map((item) => (
                  <div key={item.title} className="grid grid-cols-[1rem_1fr] gap-3 text-sm leading-6 text-[#dce8df]/70">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#a7f3d0]" />
                        <span>
                          <strong className="font-semibold text-[#f4fff8]">{item.title}</strong>
                          <span className="text-[#dce8df]/50"> / {item.desc}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {scene.kind === 'how' && (
                  <div className="mt-8 flex flex-wrap gap-2">
                    {steps.map((step) => (
                      <button
                        key={step.num}
                        type="button"
                        className="min-h-10 rounded-full border border-white/10 bg-white/[0.055] px-4 text-sm font-semibold text-[#f4fff8]"
                      >
                        {step.num} {step.title}
                      </button>
                    ))}
                  </div>
                )}

                {scene.kind === 'models' && (
                  <p className="mt-8 max-w-xl text-sm leading-7 text-[#dce8df]/60">
                    {isZh
                      ? '页面展示的是可接入方向；真实可售模型仍以商家测试通过后的市场数据为准。'
                      : 'The list is directional. Sellable models still depend on merchant listings that pass API tests.'}
                  </p>
                )}

                {scene.kind === 'pricing' && (
                  <p className="mt-8 max-w-xl text-sm leading-7 text-[#dce8df]/60">
                    {isZh
                      ? '积分先入账，再按商家模型价格消耗；失败调用进入退款与售后记录。'
                      : 'Credits are purchased first, spent per merchant model, and refunded when failed calls are recorded.'}
                  </p>
                )}
              </div>

              <div className="min-w-0 w-full">{renderSceneVisual(scene.kind)}</div>
            </section>
          );
        })}

        <div className="pointer-events-none absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-[#061312]/60 px-3 py-2 backdrop-blur-2xl">
          {scenes.map((scene, index) => (
            <span
              key={scene.id}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: index === activeSceneIndex ? 30 : 6,
                background: index === activeSceneIndex ? '#d9f7eb' : 'rgba(244,255,248,0.26)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroScrollNarrative;
