import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';

const steps = [
  { label: 'Capture API', value: 'merchant endpoint' },
  { label: 'Run tests', value: 'latency + fallback' },
  { label: 'Price route', value: 'credits ledger' },
  { label: 'Release', value: 'review queue' },
];

const providers = ['OpenAI', 'Anthropic', 'DeepSeek', 'Kimi', 'Stripe', 'Windmill'];

export const WorkerLoop = () => {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame % 120, [0, 120], [-240, 1220], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#06100f', overflow: 'hidden', fontFamily: 'Inter, Arial, sans-serif' }}>
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 84% 18%, rgba(122,244,190,0.22), transparent 30%), radial-gradient(circle at 20% 72%, rgba(246,208,127,0.15), transparent 34%), linear-gradient(135deg, #06100f, #0c1716 58%, #050807)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 40,
          borderRadius: 34,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(6, 18, 17, 0.72)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 36px 120px rgba(0,0,0,0.35)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 76,
          top: 78,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          color: 'rgba(242,255,248,0.92)',
          fontSize: 26,
          fontWeight: 700,
        }}
      >
        <span style={{ width: 12, height: 12, borderRadius: 999, background: '#72f2bb', boxShadow: '0 0 24px #72f2bb' }} />
        BloomX worker
      </div>

      <div
        style={{
          position: 'absolute',
          left: 76,
          top: 142,
          width: 520,
          height: 424,
          borderRadius: 28,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
          padding: 26,
        }}
      >
        <div style={{ color: 'rgba(255,255,255,0.48)', fontSize: 18, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          New supply request
        </div>
        <div style={{ marginTop: 18, color: '#f1fff6', fontSize: 40, fontWeight: 760, lineHeight: 1.05 }}>
          Verify paid model API
        </div>
        <div style={{ marginTop: 20, color: 'rgba(241,255,246,0.62)', fontSize: 20, lineHeight: 1.45 }}>
          Test keys, map pricing, open a review task, then publish only after the ledger route is valid.
        </div>

        <div style={{ display: 'grid', gap: 12, marginTop: 28 }}>
          {steps.map((step, index) => {
            const active = (frame / 44 + index * 0.22) % steps.length;
            const glow = Math.max(0.12, 1 - Math.abs(active - index) * 0.72);
            return (
              <div
                key={step.label}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '34px 1fr',
                  gap: 14,
                  alignItems: 'center',
                  minHeight: 54,
                  borderRadius: 16,
                  border: `1px solid rgba(114,242,187,${0.1 + glow * 0.34})`,
                  background: `rgba(114,242,187,${0.035 + glow * 0.06})`,
                  color: '#f1fff6',
                  padding: '10px 14px',
                }}
              >
                <span style={{ color: '#f3cf83', fontFamily: 'monospace', fontSize: 14 }}>{`0${index + 1}`}</span>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 680 }}>{step.label}</div>
                  <div style={{ marginTop: 4, color: 'rgba(241,255,246,0.52)', fontSize: 14 }}>{step.value}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 82,
          top: 128,
          width: 496,
          height: 452,
          borderRadius: 34,
          border: '1px solid rgba(114,242,187,0.22)',
          background: 'rgba(8, 24, 22, 0.55)',
          transform: `perspective(900px) rotateY(-9deg) translate3d(${Math.sin(frame / 55) * 12}px, ${Math.cos(frame / 70) * 8}px, 0)`,
          boxShadow: '0 0 90px rgba(114,242,187,0.12)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: sweep,
            top: 0,
            width: 180,
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,245,210,0.34), rgba(114,242,187,0.18), transparent)',
            filter: 'blur(12px)',
          }}
        />
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {providers.map((provider, index) => (
              <span
                key={provider}
                style={{
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(241,255,246,0.78)',
                  padding: '9px 13px',
                  fontSize: 15,
                  transform: `translateY(${Math.sin(frame / 38 + index) * 4}px)`,
                }}
              >
                {provider}
              </span>
            ))}
          </div>

          <svg viewBox="0 0 420 260" style={{ width: '100%', marginTop: 44, overflow: 'visible' }}>
            {[0, 1, 2].map((line) => (
              <path
                key={line}
                d={`M20 ${80 + line * 46} C150 ${20 + line * 54}, 250 ${190 - line * 34}, 400 ${88 + line * 38}`}
                fill="none"
                stroke={line === 1 ? 'rgba(243,207,131,0.72)' : 'rgba(114,242,187,0.72)'}
                strokeWidth={line === 1 ? 4 : 3}
                strokeLinecap="round"
                strokeDasharray="18 22"
                strokeDashoffset={-(frame * (1.8 + line * 0.5))}
              />
            ))}
            {[42, 130, 222, 314, 388].map((x, index) => (
              <circle
                key={x}
                cx={x}
                cy={index % 2 ? 148 : 92}
                r={7 + Math.sin(frame / 22 + index) * 2}
                fill={index % 2 ? '#f3cf83' : '#72f2bb'}
              />
            ))}
          </svg>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 120,
          background: 'linear-gradient(180deg, transparent, rgba(5,8,7,0.78))',
        }}
      />
    </AbsoluteFill>
  );
};
