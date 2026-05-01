import { type CSSProperties, useEffect, useRef } from 'react';
import PbrDepthField from './PbrDepthField';

const HERO_VIDEO_SRC = '/media/bloomx-hero-bg.mp4';
const VIDEO_DURATION_SECONDS = 12;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (value: number) => value * value * (3 - 2 * value);

const storyStages = [
  { key: 'mint', label: '铸造能力货币', detail: '模型价值进入平台' },
  { key: 'route', label: '路由流动性', detail: '供需开始匹配' },
  { key: 'market', label: '能力穿越市场', detail: '价格与调用形成路径' },
  { key: 'settle', label: '完成收益结算', detail: '收入回到商家' },
];

const BackgroundVideo = () => {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const shell = shellRef.current;
    const video = videoRef.current;
    if (!shell || !video) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let scrollFrame = 0;
    let mediaFrame = 0;
    let targetProgress = 0;

    const applyScrollState = () => {
      const scrollRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = reduceMotion ? 0 : clamp01(window.scrollY / scrollRange);
      const eased = smooth(progress);
      targetProgress = progress;

      shell.style.setProperty('--bg-scroll', progress.toFixed(4));
      shell.style.setProperty('--bg-ease', eased.toFixed(4));
      shell.style.setProperty('--story-panel-opacity', clamp01((progress - 0.08) * 4).toFixed(4));

      storyStages.forEach((_, index) => {
        const center = storyStages.length === 1 ? 0 : index / (storyStages.length - 1);
        const intensity = clamp01(1 - Math.abs(progress - center) * 4.1);
        shell.style.setProperty(`--story-${index}-opacity`, (0.28 + intensity * 0.72).toFixed(4));
        shell.style.setProperty(`--story-${index}-x`, `${(-16 + intensity * 16).toFixed(2)}px`);
        shell.style.setProperty(`--story-${index}-scale`, (0.975 + intensity * 0.025).toFixed(4));
        shell.style.setProperty(`--story-${index}-border`, (0.1 + intensity * 0.3).toFixed(4));
      });
    };

    const requestScrollState = () => {
      window.cancelAnimationFrame(scrollFrame);
      scrollFrame = window.requestAnimationFrame(applyScrollState);
    };

    const syncVideoToScroll = () => {
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : VIDEO_DURATION_SECONDS;
      const desiredTime = targetProgress * duration;

      if (video.readyState >= 1) {
        video.pause();
        const delta = desiredTime - video.currentTime;
        if (Math.abs(delta) > 0.025) {
          try {
            video.currentTime = video.currentTime + delta * 0.24;
          } catch {
            video.currentTime = desiredTime;
          }
        }
      }

      mediaFrame = window.requestAnimationFrame(syncVideoToScroll);
    };

    const handleMetadata = () => {
      video.pause();
      video.currentTime = 0;
      applyScrollState();
    };

    video.addEventListener('loadedmetadata', handleMetadata);
    applyScrollState();
    syncVideoToScroll();
    window.addEventListener('scroll', requestScrollState, { passive: true });
    window.addEventListener('resize', requestScrollState, { passive: true });

    return () => {
      window.cancelAnimationFrame(scrollFrame);
      window.cancelAnimationFrame(mediaFrame);
      video.removeEventListener('loadedmetadata', handleMetadata);
      window.removeEventListener('scroll', requestScrollState);
      window.removeEventListener('resize', requestScrollState);
    };
  }, []);

  return (
    <div
      ref={shellRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#07100f]"
      style={
        {
          '--bg-scroll': 0,
          '--bg-ease': 0,
          '--story-panel-opacity': 0,
          '--story-0-opacity': 1,
          '--story-0-x': '0px',
          '--story-0-scale': 1,
          '--story-0-border': 0.4,
          '--story-1-opacity': 0.28,
          '--story-1-x': '-16px',
          '--story-1-scale': 0.975,
          '--story-1-border': 0.1,
          '--story-2-opacity': 0.28,
          '--story-2-x': '-16px',
          '--story-2-scale': 0.975,
          '--story-2-border': 0.1,
          '--story-3-opacity': 0.28,
          '--story-3-x': '-16px',
          '--story-3-scale': 0.975,
          '--story-3-border': 0.1,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover opacity-[0.58] brightness-[1.18] contrast-[1.1] saturate-[0.9] will-change-transform"
        style={{
          transform:
            'scale(calc(1.04 + var(--bg-ease) * 0.12)) translate3d(0, calc(var(--bg-scroll) * -4vh), 0)',
        }}
        muted
        playsInline
        preload="auto"
      >
        <source src={HERO_VIDEO_SRC} type="video/mp4" />
      </video>

      <PbrDepthField />

      <div
        className="absolute inset-0 opacity-90 will-change-transform"
        style={{
          transform: 'translate3d(calc(var(--bg-scroll) * -3vw), calc(var(--bg-scroll) * 2vh), 0)',
          background:
            'radial-gradient(circle at 76% 24%, rgba(240,188,97,0.24), transparent 25rem), radial-gradient(circle at 16% 68%, rgba(105,226,169,0.18), transparent 29rem)',
        }}
      />

      <div
        className="absolute left-[58vw] top-[7vh] h-[46rem] w-[46rem] rounded-full border border-white/[0.16] opacity-70 will-change-transform"
        style={{
          transform:
            'translate3d(calc(var(--bg-scroll) * -8vw), calc(var(--bg-scroll) * 9vh), 0) rotate(calc(var(--bg-scroll) * 20deg))',
        }}
      />

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,7,0.72),rgba(5,8,7,0.3)_42%,rgba(5,8,7,0.02)),linear-gradient(180deg,rgba(5,8,7,0),rgba(5,8,7,0.34)_76%,rgba(5,8,7,0.66))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(246,214,167,0.16),transparent_35rem)]" />

      <div
        className="absolute bottom-[12vh] left-6 hidden w-64 flex-col gap-3 md:flex"
        style={{
          opacity: 'var(--story-panel-opacity)',
          transform: 'translate3d(calc((1 - var(--story-panel-opacity)) * -10px), 0, 0)',
        }}
      >
        {storyStages.map((stage, index) => (
          <div
            key={stage.key}
            className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-white/42 backdrop-blur-xl transition"
            style={{
              opacity: `var(--story-${index}-opacity)`,
              transform: `translate3d(var(--story-${index}-x), 0, 0) scale(var(--story-${index}-scale))`,
              borderColor: `rgba(240, 188, 97, var(--story-${index}-border))`,
            }}
          >
            <div className="text-[10px] uppercase tracking-[0.28em] text-[#f0c88f]/60">0{index + 1}</div>
            <div className="mt-1 text-sm font-semibold text-white/78">{stage.label}</div>
            <div className="mt-1 text-xs text-white/42">{stage.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BackgroundVideo;
