import { CheckCircle2, CreditCard, KeyRound, Route, Sparkles, UserPlus } from 'lucide-react';
import { FadeIn } from './ui';

const checks = [
  { icon: UserPlus, label: '注册账号', value: '1 min' },
  { icon: CreditCard, label: '订阅积分', value: 'Stripe' },
  { icon: KeyRound, label: '生成 Key', value: 'server only' },
];

const HeroWorkerShowcase = () => {
  return (
    <FadeIn delay={260} direction="up">
      <div className="relative mx-auto mt-12 w-full max-w-[34rem] lg:mt-0">
        <style>
          {`
            @keyframes bloomxCardFloat {
              0%, 100% { transform: translate3d(0, 0, 0); }
              50% { transform: translate3d(0, -10px, 0); }
            }
            @keyframes bloomxPulseLine {
              from { background-position: 0 0; }
              to { background-position: 220px 0; }
            }
            @media (prefers-reduced-motion: reduce) {
              .bloomx-worker-motion { animation: none !important; }
            }
          `}
        </style>

        <div className="absolute -left-8 top-10 hidden rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-xs font-semibold text-white/70 backdrop-blur-xl lg:block">
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#72f2bb] shadow-[0_0_16px_rgba(114,242,187,0.9)]" />
          automated guide
        </div>

        <div
          className="bloomx-worker-motion relative overflow-hidden rounded-[2rem] border border-white/12 bg-[#07100f]/78 p-3 shadow-[0_34px_100px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl"
          style={{ animation: 'bloomxCardFloat 9s ease-in-out infinite' }}
        >
          <div className="overflow-hidden rounded-[1.55rem] border border-white/10 bg-[#0b1716]">
            <video
              className="aspect-[16/9] w-full object-cover"
              src="/media/bloomx-worker-loop.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          </div>

          <div className="grid gap-2.5 p-3">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-white">从注册到第一次调用</div>
                <div className="mt-1 text-xs text-white/48">自动化使用文档演示 BloomX 的完整上手路径</div>
              </div>
              <Sparkles size={18} className="text-[#f3cf83]" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {checks.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                    <Icon size={16} className="text-[#72f2bb]" />
                    <div className="mt-2 text-[11px] font-semibold text-white/82">{item.label}</div>
                    <div className="mt-1 text-[10px] text-white/42">{item.value}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="absolute bottom-0 left-8 right-8 h-px opacity-70"
            style={{
              animation: 'bloomxPulseLine 2.8s linear infinite',
              backgroundImage: 'linear-gradient(90deg, transparent, rgba(114,242,187,0.9), rgba(243,207,131,0.72), transparent)',
              backgroundSize: '220px 100%',
            }}
          />
        </div>

        <div className="absolute -right-6 bottom-16 hidden w-48 rounded-2xl border border-[#72f2bb]/24 bg-[#07100f]/82 p-4 text-white shadow-[0_22px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl xl:block">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#72f2bb]">
            <CheckCircle2 size={15} />
            first call ready
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm font-semibold">
            <Route size={16} className="text-[#f3cf83]" />
            用量和账本可追踪
          </div>
        </div>
      </div>
    </FadeIn>
  );
};

export default HeroWorkerShowcase;
