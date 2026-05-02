import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { storyScrollRange } from './HeroScrollNarrative';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const scenes = [
  '/media/hero-story/01-domain.png',
  '/media/hero-story/02-marketplace.png',
  '/media/hero-story/03-branches.png',
  '/media/hero-story/04-key.png',
  '/media/hero-story/05-request.png',
  '/media/hero-story/06-complete.png',
];

const fallback = '/media/bloomx-generated-hero.png';

const smoothstep = (value: number) => {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
};

const BackgroundVideo = () => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const isHome = location.pathname === '/';

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

  const effectiveProgress = isHome ? progress : 1;
  const postHeroDarkness = isHome ? smoothstep((effectiveProgress - 0.82) / 0.18) : 1;
  const heroReadability = 1 - postHeroDarkness * 0.72;

  const filmVars = useMemo(
    () =>
      ({
        '--film-progress': effectiveProgress,
        '--post-hero-darkness': postHeroDarkness,
        '--hero-readability': heroReadability,
      }) as CSSProperties,
    [effectiveProgress, heroReadability, postHeroDarkness],
  );

  const scenePosition = effectiveProgress * (scenes.length - 1);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#f6f2ea]" style={filmVars} aria-hidden="true">
      {scenes.map((src, sceneIndex) => {
        const distance = Math.abs(scenePosition - sceneIndex);
        const opacity = smoothstep(1 - distance);
        const depth = sceneIndex - scenePosition;
        const scale = 1.015 + effectiveProgress * 0.025 + sceneIndex * 0.0025;
        const x = depth * -1.8;
        const y = (sceneIndex % 2 === 0 ? -1 : 1) * effectiveProgress * 0.85;

        return (
          <img
            key={src}
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            decoding="async"
            style={{
              opacity,
              transform: `translate3d(${x}vw, ${y}vh, 0) scale(${scale})`,
              transition: 'opacity 80ms linear',
              willChange: 'opacity, transform',
            }}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = fallback;
            }}
          />
        );
      })}

      <div
        className="absolute inset-0"
        style={{
          opacity: heroReadability,
          background:
            'linear-gradient(90deg, rgba(246,242,234,0.94), rgba(246,242,234,0.76) 30%, rgba(246,242,234,0.18) 66%, rgba(246,242,234,0.03) 100%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.18 + postHeroDarkness * 0.36,
          background:
            'linear-gradient(180deg, rgba(246,242,234,0.03), rgba(246,242,234,0.18) 54%, rgba(31,35,30,0.58) 100%)',
        }}
      />
      <div
        className="absolute inset-0 bg-[#07100d]"
        style={{
          opacity: postHeroDarkness * 0.84,
        }}
      />
      <div className="absolute inset-0 opacity-[0.055] [background-image:radial-gradient(rgba(41,44,38,0.42)_1px,transparent_1px)] [background-size:3px_3px]" />
    </div>
  );
};

export default BackgroundVideo;
