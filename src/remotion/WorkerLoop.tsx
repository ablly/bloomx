import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';

const guideSteps = [
  { id: '01', title: '注册账号', detail: '邮箱登录后进入 BloomX 控制台', metric: 'auth ready' },
  { id: '02', title: '选择身份', detail: '用户购买积分，商家提交模型 API', metric: 'role set' },
  { id: '03', title: '浏览模型', detail: '查看 gpt-5.5、Claude、DeepSeek、Kimi 供给', metric: 'market open' },
  { id: '04', title: '订阅积分', detail: '用 Stripe 购买或订阅调用额度', metric: 'credits +100k' },
  { id: '05', title: '生成 Key', detail: '创建项目密钥，服务端保存敏感配置', metric: 'key issued' },
  { id: '06', title: '发起调用', detail: '统一入口请求模型，失败自动留痕', metric: 'api 200' },
  { id: '07', title: '查看账本', detail: '用量、退款、商家收入都可追踪', metric: 'ledger synced' },
];

const appTiles = ['账号', '市场', '积分', 'API Key', '调用日志', '账本'];

const StatusPill = ({ active, label }: { active: boolean; label: string }) => (
  <span
    style={{
      borderRadius: 999,
      border: `1px solid ${active ? 'rgba(114,242,187,0.52)' : 'rgba(255,255,255,0.1)'}`,
      background: active ? 'rgba(114,242,187,0.12)' : 'rgba(255,255,255,0.05)',
      color: active ? '#caffdf' : 'rgba(241,255,246,0.58)',
      padding: '9px 12px',
      fontSize: 15,
      fontWeight: 650,
      boxShadow: active ? '0 0 34px rgba(114,242,187,0.18)' : 'none',
    }}
  >
    {label}
  </span>
);

export const WorkerLoop = () => {
  const frame = useCurrentFrame();
  const activeIndex = Math.floor((frame / 38) % guideSteps.length);
  const local = (frame % 38) / 38;
  const activeStep = guideSteps[activeIndex];
  const nextStep = guideSteps[(activeIndex + 1) % guideSteps.length];
  const sweep = interpolate(frame % 135, [0, 135], [-260, 1180], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const cardLift = interpolate(local, [0, 0.24, 1], [18, 0, -4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const cardOpacity = interpolate(local, [0, 0.18, 0.86, 1], [0, 1, 1, 0.78], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#050807', overflow: 'hidden', fontFamily: 'Inter, Arial, sans-serif' }}>
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 82% 18%, rgba(114,242,187,0.26), transparent 30%), radial-gradient(circle at 16% 78%, rgba(243,207,131,0.16), transparent 36%), linear-gradient(135deg, #050807, #0a1816 56%, #050807)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 34,
          borderRadius: 36,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(6, 18, 17, 0.74)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 34px 110px rgba(0,0,0,0.38)',
          overflow: 'hidden',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: sweep,
          top: 34,
          width: 210,
          height: 652,
          background: 'linear-gradient(90deg, transparent, rgba(255,245,210,0.32), rgba(114,242,187,0.18), transparent)',
          filter: 'blur(14px)',
        }}
      />

      <div style={{ position: 'absolute', left: 70, top: 66, right: 70, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'rgba(242,255,248,0.94)', fontSize: 25, fontWeight: 760 }}>
          <span style={{ width: 12, height: 12, borderRadius: 999, background: '#72f2bb', boxShadow: '0 0 24px #72f2bb' }} />
          BloomX 自动化使用文档
        </div>
        <div style={{ color: 'rgba(241,255,246,0.48)', fontSize: 15, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          from signup to first call
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 70,
          top: 124,
          width: 500,
          height: 512,
          borderRadius: 30,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.025))',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {appTiles.map((tile, index) => (
            <StatusPill key={tile} active={index === activeIndex % appTiles.length} label={tile} />
          ))}
        </div>

        <div
          style={{
            marginTop: 26,
            borderRadius: 24,
            border: '1px solid rgba(114,242,187,0.2)',
            background: 'rgba(6, 18, 17, 0.78)',
            padding: 24,
            opacity: cardOpacity,
            transform: `translateY(${cardLift}px)`,
            boxShadow: '0 0 70px rgba(114,242,187,0.08)',
          }}
        >
          <div style={{ color: '#f3cf83', fontFamily: 'monospace', fontSize: 17 }}>{activeStep.id}</div>
          <div style={{ marginTop: 12, color: '#f1fff6', fontSize: 42, fontWeight: 780, letterSpacing: '-0.02em' }}>
            {activeStep.title}
          </div>
          <div style={{ marginTop: 16, color: 'rgba(241,255,246,0.62)', fontSize: 20, lineHeight: 1.45 }}>
            {activeStep.detail}
          </div>
          <div
            style={{
              marginTop: 24,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              borderRadius: 999,
              background: 'rgba(114,242,187,0.1)',
              border: '1px solid rgba(114,242,187,0.28)',
              color: '#caffdf',
              padding: '10px 14px',
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: 999, background: '#72f2bb', boxShadow: '0 0 18px #72f2bb' }} />
            {activeStep.metric}
          </div>
        </div>

        <div style={{ marginTop: 22, display: 'grid', gap: 10 }}>
          {guideSteps.slice(0, 4).map((step, index) => {
            const active = step.id === activeStep.id;
            return (
              <div
                key={step.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '38px 1fr 88px',
                  alignItems: 'center',
                  minHeight: 42,
                  borderRadius: 14,
                  background: active ? 'rgba(114,242,187,0.12)' : 'rgba(255,255,255,0.035)',
                  border: `1px solid ${active ? 'rgba(114,242,187,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  padding: '8px 12px',
                  color: active ? '#f1fff6' : 'rgba(241,255,246,0.52)',
                }}
              >
                <span style={{ color: '#f3cf83', fontFamily: 'monospace', fontSize: 13 }}>{step.id}</span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{step.title}</span>
                <span style={{ textAlign: 'right', fontSize: 12 }}>{index < activeIndex ? 'done' : active ? 'live' : 'next'}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 72,
          top: 128,
          width: 548,
          height: 508,
          borderRadius: 34,
          border: '1px solid rgba(114,242,187,0.22)',
          background: 'rgba(5, 13, 12, 0.58)',
          boxShadow: '0 0 100px rgba(114,242,187,0.12)',
          overflow: 'hidden',
          transform: `perspective(920px) rotateY(-8deg) translate3d(${Math.sin(frame / 58) * 10}px, ${Math.cos(frame / 78) * 7}px, 0)`,
        }}
      >
        <div style={{ padding: 26 }}>
          <div style={{ color: 'rgba(241,255,246,0.48)', fontSize: 14, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            automated route
          </div>
          <div style={{ marginTop: 12, color: '#f1fff6', fontSize: 30, fontWeight: 780 }}>
            下一步：{nextStep.title}
          </div>

          <svg viewBox="0 0 470 300" style={{ width: '100%', marginTop: 38, overflow: 'visible' }}>
            {[0, 1, 2].map((line) => (
              <path
                key={line}
                d={`M22 ${96 + line * 50} C130 ${22 + line * 58}, 286 ${230 - line * 36}, 446 ${96 + line * 42}`}
                fill="none"
                stroke={line === 1 ? 'rgba(243,207,131,0.74)' : 'rgba(114,242,187,0.76)'}
                strokeWidth={line === 1 ? 5 : 3.4}
                strokeLinecap="round"
                strokeDasharray="18 22"
                strokeDashoffset={-(frame * (1.9 + line * 0.48))}
              />
            ))}
            {guideSteps.map((step, index) => {
              const active = index === activeIndex;
              const x = 42 + index * 64;
              const y = index % 2 ? 172 : 112;
              return (
                <g key={step.id}>
                  <circle
                    cx={x}
                    cy={y}
                    r={active ? 13 + Math.sin(frame / 8) * 2 : 8}
                    fill={active ? '#72f2bb' : index < activeIndex ? '#f3cf83' : 'rgba(241,255,246,0.34)'}
                  />
                  <text x={x - 12} y={y + 38} fill="rgba(241,255,246,0.58)" fontSize="16" fontFamily="monospace">
                    {step.id}
                  </text>
                </g>
              );
            })}
          </svg>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 30 }}>
            {[
              ['入口', '注册 / 登录'],
              ['权限', '用户 / 商家'],
              ['支付', 'Stripe credits'],
              ['调用', '统一 API 网关'],
            ].map(([label, value], index) => (
              <div
                key={label}
                style={{
                  borderRadius: 18,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: index === activeIndex % 4 ? 'rgba(114,242,187,0.1)' : 'rgba(255,255,255,0.045)',
                  padding: 15,
                }}
              >
                <div style={{ color: 'rgba(241,255,246,0.42)', fontSize: 13 }}>{label}</div>
                <div style={{ marginTop: 6, color: '#f1fff6', fontSize: 16, fontWeight: 720 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
