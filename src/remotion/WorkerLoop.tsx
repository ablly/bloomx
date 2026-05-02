import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

const sceneFiles = [
  'media/hero-story/01-domain.png',
  'media/hero-story/02-marketplace.png',
  'media/hero-story/03-branches.png',
  'media/hero-story/04-key.png',
  'media/hero-story/05-request.png',
  'media/hero-story/06-complete.png',
];

const captions = [
  { id: '01', title: '访问', detail: '输入 bloomx.io', x: 118, y: 230 },
  { id: '02', title: '市场', detail: '选择可调用模型', x: 1220, y: 240 },
  { id: '03', title: '分流', detail: '商家入驻或用户订阅', x: 160, y: 694 },
  { id: '04', title: '密钥', detail: '创建项目 API Key', x: 1210, y: 690 },
  { id: '05', title: '调用', detail: '发起模型 API 请求', x: 455, y: 160 },
  { id: '06', title: '完成', detail: '用量记录与结算入账', x: 1260, y: 170 },
];

const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

const smoothstep = (value: number) => {
  const x = Math.min(1, Math.max(0, value));
  return x * x * (3 - 2 * x);
};

export const WorkerLoop = () => {
  const frame = useCurrentFrame();
  const totalFrames = 360;
  const progress = interpolate(frame, [0, totalFrames - 1], [0, 1], clamp);
  const scenePosition = progress * (sceneFiles.length - 1);

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        backgroundColor: '#f6f2ea',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {sceneFiles.map((file, index) => {
        const distance = Math.abs(scenePosition - index);
        const opacity = smoothstep(1 - distance);
        const depth = index - scenePosition;
        const scale = 1.015 + progress * 0.025 + index * 0.0025;
        const x = depth * -34;
        const y = (index % 2 === 0 ? -1 : 1) * progress * 14;

        return (
          <Img
            key={file}
            src={staticFile(file)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity,
              transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
            }}
          />
        );
      })}

      <AbsoluteFill
        style={{
          background:
            'linear-gradient(90deg, rgba(246,242,234,0.92), rgba(246,242,234,0.68) 30%, rgba(246,242,234,0.12) 68%, rgba(246,242,234,0.02) 100%)',
        }}
      />
      <AbsoluteFill
        style={{
          background: 'linear-gradient(180deg, rgba(246,242,234,0.02), rgba(246,242,234,0.2) 58%, rgba(31,35,30,0.34))',
        }}
      />

      {captions.map((caption, index) => {
        const distance = Math.abs(scenePosition - index);
        const opacity = smoothstep(1 - distance * 1.65);
        const lift = (index - scenePosition) * 16;
        return (
          <div
            key={caption.id}
            style={{
              position: 'absolute',
              left: caption.x,
              top: caption.y,
              width: 292,
              opacity,
              transform: `translate3d(0, ${lift}px, 0)`,
              color: '#171c16',
              textShadow: '0 1px 24px rgba(246,242,234,0.94)',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 650, letterSpacing: '0.24em', color: 'rgba(41,48,39,0.64)' }}>
              {caption.id}
            </div>
            <div style={{ marginTop: 14, fontSize: 46, fontWeight: 650, letterSpacing: '-0.055em' }}>
              {caption.title}
            </div>
            <div style={{ marginTop: 12, fontSize: 20, lineHeight: 1.5, fontWeight: 500, color: 'rgba(41,48,39,0.78)' }}>
              {caption.detail}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
