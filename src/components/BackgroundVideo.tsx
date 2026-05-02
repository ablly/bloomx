import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { storyScrollRange } from './HeroScrollNarrative';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const scenes = [
  '/media/hero-story/01-domain.svg',
  '/media/hero-story/02-marketplace.svg',
  '/media/hero-story/03-branches.svg',
  '/media/hero-story/04-key.svg',
  '/media/hero-story/05-request.svg',
  '/media/hero-story/06-complete.svg',
];

const fallback = '/media/bloomx-generated-hero.png';

const smoothstep = (value: number) => {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
};

const BackgroundVideo = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const range = Math.max(window.innerHeight * storyScrollRange, 1);
      setProgress(clamp01(window.scrollY / range));
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

  const filmVars = useMemo(
    () =>
      ({
        '--film-progress': progress,
      }) as CSSProperties,
    [progress],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#f6f2ea]" style={filmVars} aria-hidden="true">
      {scenes.map((src, sceneIndex) => {
        const scenePosition = progress * (scenes.length - 1);
        const distance = Math.abs(scenePosition - sceneIndex);
        const opacity = smoothstep(1 - distance);
        const depth = sceneIndex - scenePosition;
        const scale = 1.035 + progress * 0.045 + sceneIndex * 0.004;
        const x = depth * -2.4;
        const y = (sceneIndex % 2 === 0 ? -1 : 1) * progress * 1.2;
        const blur = Math.min(9, distance * 4.5);

        return (
          <img
            key={src}
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              opacity,
              transform: `translate3d(${x}vw, ${y}vh, 0) scale(${scale})`,
              filter: `blur(${blur}px) saturate(${0.96 + opacity * 0.08}) contrast(${0.98 + opacity * 0.04})`,
              transition: 'opacity 90ms linear',
              willChange: 'opacity, transform, filter',
            }}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = fallback;
            }}
          />
        );
      })}

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(246,242,234,0.9),rgba(246,242,234,0.54)_31%,rgba(246,242,234,0.07)_74%),linear-gradient(180deg,rgba(246,242,234,0.02),rgba(246,242,234,0.16)_58%,rgba(246,242,234,0.46))]" />
      <div className="absolute inset-0 opacity-[0.1] [background-image:radial-gradient(rgba(41,44,38,0.42)_1px,transparent_1px)] [background-size:3px_3px]" />
    </div>
  );
};

export default BackgroundVideo;
