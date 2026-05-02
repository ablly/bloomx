import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

type ParticleSpec = {
  x: number;
  y: number;
  size: number;
  delay: number;
  depth: number;
  color: string;
};

type RibbonSpec = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
  delay: number;
  color: string;
};

const particles: ParticleSpec[] = Array.from({ length: 90 }, (_, index) => {
  const column = index % 15;
  const row = Math.floor(index / 15);
  const jitterX = ((index * 37) % 91) - 45;
  const jitterY = ((index * 53) % 79) - 39;

  return {
    x: 180 + column * 118 + jitterX,
    y: 110 + row * 132 + jitterY,
    size: 2 + ((index * 11) % 28) / 10,
    delay: (index * 17) % 180,
    depth: 0.34 + ((index * 13) % 70) / 100,
    color: index % 7 === 0 ? 'rgba(238,195,123,0.76)' : index % 5 === 0 ? 'rgba(106,154,201,0.56)' : 'rgba(105,226,169,0.62)',
  };
});

const ribbons: RibbonSpec[] = [
  { x: 1050, y: -170, width: 760, height: 1060, rotate: -16, delay: 0, color: 'rgba(105,226,169,0.18)' },
  { x: 1340, y: 60, width: 520, height: 760, rotate: 18, delay: 42, color: 'rgba(238,195,123,0.14)' },
  { x: 690, y: 250, width: 620, height: 680, rotate: 34, delay: 82, color: 'rgba(88,136,178,0.13)' },
];

const SignalParticle = ({ spec }: { spec: ParticleSpec }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const cycle = (frame + spec.delay) % durationInFrames;
  const pulse = interpolate(cycle, [0, 70, 160, durationInFrames], [0.24, 0.82, 0.48, 0.24], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const driftX = Math.sin((frame + spec.delay) / 58) * 16 * spec.depth;
  const driftY = Math.cos((frame + spec.delay) / 71) * 12 * spec.depth;

  return (
    <div
      style={{
        position: 'absolute',
        left: spec.x,
        top: spec.y,
        width: spec.size,
        height: spec.size,
        borderRadius: '50%',
        opacity: pulse,
        background: spec.color,
        boxShadow: `0 0 ${8 + spec.size * 4}px ${spec.color}`,
        transform: `translate3d(${driftX}px, ${driftY}px, 0)`,
      }}
    />
  );
};

const SignalRibbon = ({ spec }: { spec: RibbonSpec }) => {
  const frame = useCurrentFrame();
  const breathe = Math.sin((frame + spec.delay) / 86);
  const drift = Math.cos((frame + spec.delay) / 118);

  return (
    <div
      style={{
        position: 'absolute',
        left: spec.x,
        top: spec.y,
        width: spec.width,
        height: spec.height,
        borderRadius: '999px',
        opacity: 0.46 + breathe * 0.08,
        border: `1px solid ${spec.color}`,
        background: `linear-gradient(100deg, transparent 0%, ${spec.color} 44%, transparent 68%)`,
        filter: 'blur(0.2px)',
        transform: `translate3d(${drift * 30}px, ${breathe * 16}px, 0) rotate(${spec.rotate + breathe * 2}deg) scale(${1 + breathe * 0.025})`,
      }}
    />
  );
};

const gridLines = Array.from({ length: 18 }, (_, index) => index);

export const TokenBackground = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = frame / durationInFrames;
  const lensScale = 1.02 + progress * 0.08;
  const sweep = interpolate(frame % 210, [0, 78, 210], [-360, 340, 1260], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#050807', overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 70% 20%, rgba(105,226,169,0.16), transparent 30%), radial-gradient(circle at 30% 76%, rgba(87,130,177,0.18), transparent 34%), linear-gradient(112deg, #050807 0%, #0b1513 50%, #080b09 100%)',
        }}
      />

      <AbsoluteFill
        style={{
          opacity: 0.22,
          transform: `scale(${lensScale}) translate3d(${-22 * progress}px, ${14 * progress}px, 0)`,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '112px 112px',
          maskImage: 'radial-gradient(circle at 62% 45%, black 0%, black 46%, transparent 74%)',
        }}
      />

      {gridLines.map((line) => (
        <div
          key={line}
          style={{
            position: 'absolute',
            left: 520 + line * 82,
            top: -180,
            width: 1,
            height: 1440,
            opacity: 0.05 + (line % 3) * 0.016,
            background: 'linear-gradient(180deg, transparent, rgba(160,248,207,0.66), transparent)',
            transform: `rotate(${12 + line * 1.2}deg) translate3d(${Math.sin((frame + line * 14) / 74) * 18}px, 0, 0)`,
          }}
        />
      ))}

      {ribbons.map((spec) => (
        <SignalRibbon key={`${spec.x}-${spec.y}`} spec={spec} />
      ))}

      <div
        style={{
          position: 'absolute',
          left: sweep,
          top: 120,
          width: 420,
          height: 920,
          opacity: 0.17,
          filter: 'blur(22px)',
          transform: 'rotate(-22deg)',
          background: 'linear-gradient(90deg, transparent, rgba(240,224,184,0.8), rgba(120,236,183,0.34), transparent)',
        }}
      />

      {particles.map((spec) => (
        <SignalParticle key={`${spec.x}-${spec.y}-${spec.delay}`} spec={spec} />
      ))}

      <div
        style={{
          position: 'absolute',
          left: 1010,
          top: 84,
          width: 840,
          height: 840,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.1)',
          opacity: 0.58,
          transform: `scale(${1 + Math.sin(frame / 92) * 0.035}) rotate(${frame * 0.018}deg)`,
        }}
      />

      <AbsoluteFill
        style={{
          background:
            'linear-gradient(90deg, rgba(5,8,7,0.82) 0%, rgba(5,8,7,0.42) 43%, rgba(5,8,7,0.1) 100%), linear-gradient(180deg, rgba(5,8,7,0.02) 0%, rgba(5,8,7,0.62) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};
