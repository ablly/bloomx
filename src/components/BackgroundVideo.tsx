import { type CSSProperties, useEffect, useRef } from 'react';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (value: number) => value * value * (3 - 2 * value);

const BackgroundVideo = () => {
  const shellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let pointerX = 72;
    let pointerY = 38;
    let targetX = 72;
    let targetY = 38;
    let scrollProgress = 0;

    const applyVars = () => {
      frame = 0;
      pointerX += (targetX - pointerX) * 0.12;
      pointerY += (targetY - pointerY) * 0.12;
      shell.style.setProperty('--pointer-x', `${pointerX.toFixed(2)}%`);
      shell.style.setProperty('--pointer-y', `${pointerY.toFixed(2)}%`);
      shell.style.setProperty('--bg-scroll', scrollProgress.toFixed(4));
      shell.style.setProperty('--bg-ease', smooth(scrollProgress).toFixed(4));
    };

    const requestApply = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(applyVars);
    };

    const updateScroll = () => {
      const scrollRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scrollProgress = reduceMotion ? 0 : clamp01(window.scrollY / scrollRange);
      requestApply();
    };

    const updatePointer = (event: PointerEvent) => {
      targetX = (event.clientX / Math.max(1, window.innerWidth)) * 100;
      targetY = (event.clientY / Math.max(1, window.innerHeight)) * 100;
      requestApply();
    };

    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll, { passive: true });
    window.addEventListener('pointermove', updatePointer, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
      window.removeEventListener('pointermove', updatePointer);
    };
  }, []);

  return (
    <div
      ref={shellRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#050807]"
      style={
        {
          '--bg-scroll': 0,
          '--bg-ease': 0,
          '--pointer-x': '72%',
          '--pointer-y': '38%',
        } as CSSProperties
      }
      aria-hidden="true"
    >
      <style>
        {`
          @keyframes bloomxFloatA {
            0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: .78; }
            50% { transform: translate3d(-1.8vw, 1.2vh, 0) scale(1.035); opacity: .95; }
          }
          @keyframes bloomxFloatB {
            0%, 100% { transform: translate3d(0, 0, 0) rotate(-7deg); opacity: .5; }
            50% { transform: translate3d(2vw, -1.4vh, 0) rotate(-5deg); opacity: .72; }
          }
          @keyframes bloomxRoute {
            from { background-position: 0 0, 0 0; }
            to { background-position: 360px 0, -420px 0; }
          }
          @media (prefers-reduced-motion: reduce) {
            .bloomx-bg-motion { animation: none !important; }
          }
        `}
      </style>

      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.58] brightness-[0.95] contrast-[1.06] saturate-[1.04] will-change-transform"
        style={{
          backgroundImage: 'url(/media/bloomx-generated-hero.png)',
          transform:
            'scale(calc(1.025 + var(--bg-ease) * 0.035)) translate3d(calc(var(--bg-scroll) * -1.8vw), calc(var(--bg-scroll) * -1.7vh), 0)',
        }}
      />

      <div
        className="bloomx-bg-motion absolute left-[46vw] top-[8vh] h-[44rem] w-[44rem] rounded-full border border-emerald-200/10"
        style={{
          animation: 'bloomxFloatA 14s ease-in-out infinite',
          background:
            'radial-gradient(circle at 46% 42%, rgba(114,242,187,0.18), rgba(142,199,255,0.07) 42%, transparent 68%)',
        }}
      />

      <div
        className="bloomx-bg-motion absolute left-[54vw] top-[24vh] h-[22rem] w-[38rem] rounded-[3rem] border border-white/10"
        style={{
          animation: 'bloomxFloatB 18s ease-in-out infinite',
          background:
            'linear-gradient(135deg, rgba(114,242,187,0.12), rgba(5,8,7,0.05) 52%, rgba(243,207,131,0.07))',
          boxShadow: 'inset 0 0 70px rgba(114,242,187,0.08), 0 28px 90px rgba(0,0,0,0.26)',
        }}
      />

      <div
        className="bloomx-bg-motion absolute inset-x-[-10vw] top-[52vh] h-44 opacity-55"
        style={{
          animation: 'bloomxRoute 11s linear infinite',
          backgroundImage:
            'linear-gradient(100deg, transparent 0%, rgba(114,242,187,0.58) 48%, transparent 58%), linear-gradient(96deg, transparent 0%, rgba(243,207,131,0.46) 44%, transparent 56%)',
          backgroundSize: '360px 100%, 420px 100%',
          filter: 'blur(9px)',
          transform:
            'rotate(-9deg) translate3d(calc(var(--bg-scroll) * -2vw), calc(var(--bg-scroll) * 2vh), 0)',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at var(--pointer-x) var(--pointer-y), rgba(114,242,187,0.2), transparent 22rem), radial-gradient(circle at 76% 18%, rgba(243,207,131,0.11), transparent 30rem), radial-gradient(circle at 22% 74%, rgba(86,132,177,0.12), transparent 28rem)',
        }}
      />

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,7,0.74),rgba(5,8,7,0.34)_43%,rgba(5,8,7,0.1)_100%),linear-gradient(180deg,rgba(5,8,7,0.08),rgba(5,8,7,0.22)_78%,rgba(5,8,7,0.55))]" />
    </div>
  );
};

export default BackgroundVideo;
