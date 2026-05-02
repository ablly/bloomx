import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

type NodeSpec = {
  x: number;
  y: number;
  delay: number;
  color: string;
};

type PanelSpec = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
  delay: number;
  accent: string;
};

const nodes: NodeSpec[] = [
  { x: 1060, y: 226, delay: 0, color: '#72f2bb' },
  { x: 1250, y: 166, delay: 18, color: '#f3cf83' },
  { x: 1470, y: 292, delay: 36, color: '#8ec7ff' },
  { x: 1340, y: 480, delay: 54, color: '#72f2bb' },
  { x: 1580, y: 604, delay: 72, color: '#f3cf83' },
  { x: 1168, y: 684, delay: 90, color: '#8ec7ff' },
  { x: 1424, y: 820, delay: 108, color: '#72f2bb' },
  { x: 1710, y: 782, delay: 126, color: '#8ec7ff' },
];

const panels: PanelSpec[] = [
  { x: 1048, y: 138, width: 510, height: 280, rotate: -9, delay: 0, accent: 'rgba(114,242,187,0.72)' },
  { x: 1260, y: 432, width: 560, height: 330, rotate: 7, delay: 42, accent: 'rgba(142,199,255,0.64)' },
  { x: 862, y: 554, width: 420, height: 250, rotate: -18, delay: 84, accent: 'rgba(243,207,131,0.58)' },
];

const traceLines = [
  'M1044 238 C1160 178 1276 174 1386 266 S1570 408 1656 348',
  'M1118 668 C1220 560 1320 522 1454 592 S1624 764 1740 706',
  'M932 704 C1064 592 1180 540 1320 470 S1504 326 1660 274',
  'M1228 184 C1258 340 1268 500 1374 646 S1574 790 1702 824',
];

const microGrid = Array.from({ length: 32 }, (_, index) => index);
const particles = Array.from({ length: 150 }, (_, index) => {
  const column = index % 25;
  const row = Math.floor(index / 25);
  return {
    x: 78 + column * 74 + ((index * 29) % 42),
    y: 84 + row * 144 + ((index * 43) % 64),
    size: 2 + ((index * 17) % 34) / 10,
    delay: (index * 11) % 180,
  };
});

const HologramPanel = ({ spec }: { spec: PanelSpec }) => {
  const frame = useCurrentFrame();
  const breathe = Math.sin((frame + spec.delay) / 64);
  const scan = ((frame * 2.1 + spec.delay * 7) % (spec.height + 80)) - 40;

  return (
    <div
      style={{
        position: 'absolute',
        left: spec.x,
        top: spec.y,
        width: spec.width,
        height: spec.height,
        border: `1px solid ${spec.accent}`,
        borderRadius: 26,
        opacity: 0.74 + breathe * 0.08,
        background:
          'linear-gradient(145deg, rgba(10,25,24,0.56), rgba(12,41,43,0.28) 48%, rgba(5,8,7,0.12)), linear-gradient(90deg, rgba(255,255,255,0.07), transparent 45%)',
        boxShadow: `0 0 48px ${spec.accent}, inset 0 0 42px rgba(114,242,187,0.08)`,
        transform: `perspective(900px) rotateY(-18deg) rotateZ(${spec.rotate + breathe * 1.2}deg) translate3d(${breathe * 14}px, ${Math.cos((frame + spec.delay) / 78) * 10}px, 0)`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 22,
          opacity: 0.42,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: scan,
          height: 58,
          opacity: 0.48,
          background: `linear-gradient(180deg, transparent, ${spec.accent}, transparent)`,
          filter: 'blur(2px)',
        }}
      />
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: 34,
            right: 34 + index * 28,
            top: 46 + index * 38,
            height: 7,
            borderRadius: 999,
            opacity: 0.42 + Math.sin((frame + index * 19 + spec.delay) / 40) * 0.18,
            background: `linear-gradient(90deg, ${spec.accent}, rgba(255,255,255,0.08), transparent)`,
          }}
        />
      ))}
    </div>
  );
};

const NetworkNode = ({ spec }: { spec: NodeSpec }) => {
  const frame = useCurrentFrame();
  const pulse = interpolate((frame + spec.delay) % 96, [0, 32, 96], [0.62, 1, 0.62], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: spec.x,
        top: spec.y,
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: spec.color,
        opacity: pulse,
        boxShadow: `0 0 22px ${spec.color}, 0 0 70px ${spec.color}`,
        transform: `scale(${0.85 + pulse * 0.28})`,
      }}
    />
  );
};

const FloatingParticle = ({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) => {
  const frame = useCurrentFrame();
  const drift = Math.sin((frame + delay) / 54);
  const pulse = interpolate((frame + delay) % 120, [0, 45, 120], [0.18, 0.8, 0.18], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: '50%',
        opacity: pulse,
        background: delay % 3 === 0 ? 'rgba(243,207,131,0.9)' : delay % 5 === 0 ? 'rgba(142,199,255,0.82)' : 'rgba(114,242,187,0.86)',
        boxShadow: '0 0 18px currentColor',
        transform: `translate3d(${drift * 18}px, ${Math.cos((frame + delay) / 70) * 14}px, 0)`,
      }}
    />
  );
};

export const TokenBackground = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = frame / durationInFrames;
  const cameraX = interpolate(progress, [0, 1], [0, -86]);
  const cameraY = interpolate(progress, [0, 1], [0, 38]);
  const imageDrift = Math.sin(frame / 110);
  const sweep = interpolate(frame % 180, [0, 62, 180], [-260, 520, 1580], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#050807', overflow: 'hidden' }}>
      <Img
        src={staticFile('media/bloomx-generated-hero.png')}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.96,
          filter: 'contrast(1.08) saturate(1.12) brightness(1.06)',
          transform: `scale(${1.035 + progress * 0.035}) translate3d(${imageDrift * 14}px, ${Math.cos(frame / 135) * 8}px, 0)`,
        }}
      />

      <AbsoluteFill
        style={{
          mixBlendMode: 'screen',
          opacity: 0.42,
          background:
            'radial-gradient(circle at 78% 22%, rgba(114,242,187,0.28), transparent 30%), radial-gradient(circle at 56% 74%, rgba(142,199,255,0.24), transparent 38%), linear-gradient(112deg, #050807 0%, #0b1817 42%, #080b09 100%)',
        }}
      />

      <AbsoluteFill
        style={{
          opacity: 0.36,
          mixBlendMode: 'screen',
          transform: `scale(${1.08 + progress * 0.08}) translate3d(${cameraX}px, ${cameraY}px, 0) rotate(-3deg)`,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '96px 96px',
          maskImage: 'linear-gradient(90deg, transparent 0%, black 22%, black 100%)',
        }}
      />

      {microGrid.map((line) => (
        <div
          key={line}
          style={{
            position: 'absolute',
            left: 520 + line * 58,
            top: -260,
            width: line % 5 === 0 ? 2 : 1,
            height: 1560,
            opacity: 0.1 + (line % 4) * 0.026,
            background:
              line % 5 === 0
                ? 'linear-gradient(180deg, transparent, rgba(243,207,131,0.78), transparent)'
                : 'linear-gradient(180deg, transparent, rgba(114,242,187,0.58), transparent)',
            transform: `rotate(${13 + line * 0.9}deg) translate3d(${Math.sin((frame + line * 12) / 62) * 24}px, 0, 0)`,
          }}
        />
      ))}

      <div
        style={{
          position: 'absolute',
          left: sweep,
          top: 40,
          width: 520,
          height: 1040,
          opacity: 0.32,
          filter: 'blur(18px)',
          mixBlendMode: 'screen',
          transform: 'rotate(-21deg)',
          background: 'linear-gradient(90deg, transparent, rgba(255,245,210,0.92), rgba(114,242,187,0.46), transparent)',
        }}
      />

      <svg
        viewBox="0 0 1920 1080"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.78,
          mixBlendMode: 'screen',
          transform: `translate3d(${cameraX * 0.42}px, ${cameraY * 0.28}px, 0)`,
        }}
      >
        <defs>
          <filter id="lineGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {traceLines.map((line, index) => (
          <path
            key={line}
            d={line}
            fill="none"
            stroke={index % 2 === 0 ? 'rgba(114,242,187,0.9)' : 'rgba(142,199,255,0.78)'}
            strokeWidth={index === 1 ? 4 : 3}
            strokeLinecap="round"
            strokeDasharray="24 34"
            strokeDashoffset={-frame * (2.5 + index * 0.5)}
            filter="url(#lineGlow)"
          />
        ))}
      </svg>

      {panels.map((spec) => (
        <HologramPanel key={`${spec.x}-${spec.y}`} spec={spec} />
      ))}

      {nodes.map((spec) => (
        <NetworkNode key={`${spec.x}-${spec.y}`} spec={spec} />
      ))}

      {particles.map((particle) => (
        <FloatingParticle key={`${particle.x}-${particle.y}-${particle.delay}`} {...particle} />
      ))}

      <div
        style={{
          position: 'absolute',
          left: 945,
          top: 94,
          width: 920,
          height: 860,
          border: '1px solid rgba(255,255,255,0.16)',
          borderRadius: 58,
          opacity: 0.46,
          boxShadow: 'inset 0 0 80px rgba(114,242,187,0.1), 0 0 88px rgba(114,242,187,0.09)',
          transform: `perspective(1000px) rotateY(-24deg) rotateZ(${Math.sin(frame / 110) * 2}deg) translate3d(${Math.sin(frame / 90) * 24}px, ${Math.cos(frame / 115) * 14}px, 0)`,
        }}
      />

      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background:
            'linear-gradient(90deg, rgba(5,8,7,0.52) 0%, rgba(5,8,7,0.18) 38%, rgba(5,8,7,0.02) 100%), linear-gradient(180deg, rgba(5,8,7,0.02) 0%, rgba(5,8,7,0.2) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};
