import { ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

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

const HeroScrollNarrative = ({ onDashboardEnter }: HeroScrollNarrativeProps) => {
  const { i18n, t } = useTranslation();
  const isZh = i18n.language?.startsWith('zh');
  const [progress, setProgress] = useState(0);

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
              className="absolute left-6 right-6 top-1/2 max-w-[38rem] sm:left-10 sm:right-auto sm:w-[38rem] lg:left-16 xl:left-20"
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

                {scene.kind !== 'hero' && (
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
