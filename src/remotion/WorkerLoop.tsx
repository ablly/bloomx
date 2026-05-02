import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
const domain = 'bloomx.io';

const flow = [
  { time: '00:01', label: '输入域名', value: 'bloomx.io' },
  { time: '00:04', label: '选择路径', value: '商家入驻 / 用户订阅' },
  { time: '00:07', label: '完成订阅', value: 'Stripe credits ready' },
  { time: '00:10', label: '调用模型', value: 'gpt-5.5 via BloomX API' },
];

const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

const fade = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, start + 18, end - 18, end], [0, 1, 1, 0], clamp);

const sceneProgress = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], clamp);

const typedText = (text: string, progress: number) => text.slice(0, Math.round(text.length * progress));

export const WorkerLoop = () => {
  const frame = useCurrentFrame();
  const intro = sceneProgress(frame, 0, 96);
  const market = sceneProgress(frame, 86, 174);
  const checkout = sceneProgress(frame, 158, 258);
  const api = sceneProgress(frame, 238, 360);

  const addressTyped = typedText(domain, sceneProgress(frame, 18, 70));
  const pageScale = interpolate(frame, [80, 132, 280, 360], [0.9, 1, 1.03, 1.08], clamp);
  const pageX = interpolate(frame, [80, 160, 240, 360], [70, 20, -34, -84], clamp);
  const pageY = interpolate(frame, [80, 190, 360], [42, 0, -28], clamp);
  const cursorX = interpolate(frame, [12, 72, 120, 180, 244, 320], [326, 608, 940, 710, 1030, 1225], clamp);
  const cursorY = interpolate(frame, [12, 72, 120, 180, 244, 320], [186, 186, 526, 612, 626, 442], clamp);

  const softLightX = interpolate(frame % 360, [0, 180, 360], [-16, 30, -16]);
  const softLightY = interpolate(frame % 360, [0, 180, 360], [22, 10, 22]);

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        backgroundColor: '#f4f1ea',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(125deg, #f4f1ea 0%, #ece8df 42%, #dfe5df 70%, #f7f4ed 100%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: `${softLightX}%`,
          top: `${softLightY}%`,
          width: 980,
          height: 980,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.7), rgba(255,255,255,0) 64%)',
          filter: 'blur(2px)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.28,
          backgroundImage:
            'linear-gradient(rgba(31,35,31,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(31,35,31,0.035) 1px, transparent 1px)',
          backgroundSize: '58px 58px',
          transform: `translate3d(${interpolate(frame, [0, 360], [0, -58])}px, ${interpolate(frame, [0, 360], [0, -24])}px, 0)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 120,
          right: 120,
          top: 82,
          height: 74,
          opacity: fade(frame, 0, 120),
          transform: `translate3d(0, ${interpolate(intro, [0, 1], [28, 0], clamp)}px, 0)`,
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <div style={{ display: 'flex', gap: 9 }}>
          {['#e76f61', '#e8b64c', '#62b178'].map((color) => (
            <span key={color} style={{ width: 12, height: 12, borderRadius: 999, background: color }} />
          ))}
        </div>
        <div
          style={{
            height: 54,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.82)',
            border: '1px solid rgba(24,28,24,0.1)',
            boxShadow: '0 20px 80px rgba(42,45,39,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            color: '#1f241f',
            fontSize: 23,
            fontWeight: 560,
            letterSpacing: '-0.02em',
          }}
        >
          <span style={{ opacity: 0.44, marginRight: 12 }}>https://</span>
          {addressTyped}
          <span
            style={{
              marginLeft: 4,
              width: 2,
              height: 27,
              background: '#1f241f',
              opacity: frame % 28 < 14 ? 1 : 0,
            }}
          />
        </div>
        <div style={{ width: 68, height: 34, borderRadius: 999, background: 'rgba(31,36,31,0.08)' }} />
      </div>

      <div
        style={{
          position: 'absolute',
          left: 120,
          right: 120,
          top: 176,
          bottom: 86,
          opacity: fade(frame, 70, 360),
          transform: `translate3d(${pageX}px, ${pageY}px, 0) scale(${pageScale})`,
          transformOrigin: 'center center',
        }}
      >
        <div style={{ position: 'absolute', left: 30, top: 42, width: 620 }}>
          <div
            style={{
              color: '#212720',
              fontSize: 78,
              lineHeight: 0.92,
              letterSpacing: '-0.07em',
              fontWeight: 720,
            }}
          >
            BloomX
            <br />
            model API market
          </div>
          <div
            style={{
              marginTop: 34,
              width: 470,
              color: 'rgba(33,39,32,0.62)',
              fontSize: 24,
              lineHeight: 1.45,
              letterSpacing: '-0.02em',
            }}
          >
            从访问网站到订阅积分，再到统一入口调用模型。
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            right: 30,
            top: 30,
            width: 680,
            height: 450,
            opacity: interpolate(frame, [88, 124], [0, 1], clamp),
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 46,
              background: 'rgba(255,255,255,0.66)',
              border: '1px solid rgba(31,36,31,0.12)',
              boxShadow: '0 40px 120px rgba(43,45,39,0.16)',
              backdropFilter: 'blur(20px)',
            }}
          />
          <div style={{ position: 'absolute', left: 44, right: 44, top: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#1f241f', fontSize: 25, fontWeight: 690, letterSpacing: '-0.03em' }}>选择开始方式</div>
              <div style={{ color: 'rgba(31,36,31,0.48)', fontSize: 15 }}>account setup</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 30 }}>
              {[
                ['商家入驻', '提交模型 API、价格和结算规则', market],
                ['用户订阅', '选择套餐，创建项目调用密钥', checkout],
              ].map(([title, detail, progress], index) => {
                const p = Number(progress);
                const active = p > 0.18 && p < 0.92;
                return (
                  <div
                    key={String(title)}
                    style={{
                      height: 218,
                      borderRadius: 32,
                      padding: 28,
                      background: active ? '#1f241f' : 'rgba(255,255,255,0.72)',
                      border: `1px solid ${active ? 'rgba(31,36,31,0.8)' : 'rgba(31,36,31,0.1)'}`,
                      color: active ? '#f7f4ed' : '#1f241f',
                      transform: `translateY(${active ? -8 : 0}px)`,
                      transition: 'none',
                    }}
                  >
                    <div style={{ fontSize: 15, opacity: 0.55 }}>{index === 0 ? 'merchant' : 'user'}</div>
                    <div style={{ marginTop: 44, fontSize: 30, fontWeight: 720, letterSpacing: '-0.04em' }}>{String(title)}</div>
                    <div style={{ marginTop: 12, fontSize: 17, lineHeight: 1.4, opacity: active ? 0.72 : 0.58 }}>{String(detail)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            left: 220,
            bottom: 38,
            width: 820,
            height: 136,
            opacity: interpolate(frame, [150, 190], [0, 1], clamp),
            transform: `translateY(${interpolate(checkout, [0, 1], [30, -18], clamp)}px)`,
            borderRadius: 36,
            background: 'rgba(255,255,255,0.72)',
            border: '1px solid rgba(31,36,31,0.1)',
            boxShadow: '0 32px 100px rgba(43,45,39,0.14)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            alignItems: 'center',
            gap: 18,
            padding: 24,
          }}
        >
          {[
            ['Starter', '$29', '100k credits'],
            ['Builder', '$89', '500k credits'],
            ['Scale', '$249', 'priority route'],
          ].map(([name, price, meta], index) => {
            const active = index === 1 && checkout > 0.2;
            return (
              <div
                key={name}
                style={{
                  height: 88,
                  borderRadius: 24,
                  padding: '18px 20px',
                  background: active ? '#1f241f' : 'rgba(31,36,31,0.045)',
                  color: active ? '#f7f4ed' : '#1f241f',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 18, fontWeight: 680 }}>{name}</div>
                  <div style={{ marginTop: 6, fontSize: 13, opacity: 0.58 }}>{meta}</div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 720, letterSpacing: '-0.04em' }}>{price}</div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            position: 'absolute',
            right: 96,
            bottom: 28,
            width: 610,
            height: 250,
            opacity: interpolate(frame, [234, 274], [0, 1], clamp),
            transform: `translate3d(${interpolate(api, [0, 1], [80, -6], clamp)}px, ${interpolate(api, [0, 1], [30, 0], clamp)}px, 0)`,
            borderRadius: 34,
            background: '#1f241f',
            boxShadow: '0 42px 120px rgba(31,36,31,0.24)',
            padding: 30,
            color: '#f7f4ed',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 18, opacity: 0.6 }}>API request</div>
            <div style={{ height: 30, borderRadius: 999, padding: '6px 12px', background: 'rgba(255,255,255,0.08)', color: '#d8e4d7', fontSize: 13 }}>
              200 OK
            </div>
          </div>
          <pre
            style={{
              margin: '24px 0 0',
              fontFamily: '"SF Mono", "JetBrains Mono", Consolas, monospace',
              fontSize: 20,
              lineHeight: 1.55,
              color: '#dfe8dc',
              whiteSpace: 'pre-wrap',
            }}
          >{`curl https://api.bloomx.io/v1/chat/completions
  -H "Authorization: Bearer bx_live_..."
  -d '{"model":"gpt-5.5","messages":[...]}'`}</pre>
        </div>
      </div>

      <svg
        viewBox="0 0 1920 1080"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.54,
          pointerEvents: 'none',
        }}
      >
        <path
          d="M0 744 C 352 640, 512 788, 806 654 S 1308 274, 1920 330"
          fill="none"
          stroke="rgba(31,36,31,0.18)"
          strokeWidth="2"
          strokeDasharray="8 18"
          strokeDashoffset={-frame * 2}
        />
        <path
          d="M84 920 C 420 720, 628 850, 884 604 S 1320 420, 1788 220"
          fill="none"
          stroke="rgba(91,122,95,0.2)"
          strokeWidth="3"
          strokeDasharray="2 22"
          strokeLinecap="round"
          strokeDashoffset={-frame * 1.4}
        />
      </svg>

      <div
        style={{
          position: 'absolute',
          left: 120,
          bottom: 74,
          display: 'flex',
          gap: 18,
          opacity: 0.82,
        }}
      >
        {flow.map((step, index) => {
          const active = frame > index * 78 + 24;
          return (
            <div key={step.label} style={{ width: 254 }}>
              <div style={{ color: active ? '#1f241f' : 'rgba(31,36,31,0.32)', fontSize: 13, fontWeight: 620 }}>{step.time}</div>
              <div style={{ marginTop: 9, height: 2, borderRadius: 999, background: active ? '#1f241f' : 'rgba(31,36,31,0.14)' }} />
              <div style={{ marginTop: 13, color: active ? '#1f241f' : 'rgba(31,36,31,0.36)', fontSize: 16, fontWeight: 680 }}>{step.label}</div>
              <div style={{ marginTop: 6, color: 'rgba(31,36,31,0.48)', fontSize: 13 }}>{step.value}</div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          left: cursorX,
          top: cursorY,
          opacity: fade(frame, 8, 350),
          transform: `translate3d(0, 0, 0) scale(${interpolate(frame % 90, [0, 45, 90], [1, 0.96, 1])})`,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#1f241f',
            boxShadow: '0 12px 34px rgba(31,36,31,0.24)',
          }}
        />
      </div>

      <AbsoluteFill
        style={{
          background:
            'linear-gradient(90deg, rgba(244,241,234,0.04), rgba(244,241,234,0.2) 62%, rgba(244,241,234,0.36)), linear-gradient(180deg, rgba(244,241,234,0.0), rgba(31,36,31,0.08))',
        }}
      />
    </AbsoluteFill>
  );
};
