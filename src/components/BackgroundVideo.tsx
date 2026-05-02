import { type CSSProperties, useEffect, useRef } from 'react';
import { bloomxRadix } from '../lib/radixPalette';

const HERO_VIDEO_SOURCE = '/media/bloomx-remotion-bg.mp4';
const VIDEO_DURATION_SECONDS = 12;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (value: number) => value * value * (3 - 2 * value);

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
    };

    const updatePointerField = (event: PointerEvent) => {
      shell.style.setProperty('--pointer-x', `${Math.round((event.clientX / Math.max(1, window.innerWidth)) * 100)}%`);
      shell.style.setProperty('--pointer-y', `${Math.round((event.clientY / Math.max(1, window.innerHeight)) * 100)}%`);
    };

    const requestScrollState = () => {
      window.cancelAnimationFrame(scrollFrame);
      scrollFrame = window.requestAnimationFrame(applyScrollState);
    };

    const syncVideoToScroll = () => {
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : VIDEO_DURATION_SECONDS;
      const desiredTime = targetProgress * duration;

      if (!reduceMotion && video.readyState >= 1) {
        video.pause();
        const delta = desiredTime - video.currentTime;
        if (Math.abs(delta) > 0.025) {
          try {
            video.currentTime = video.currentTime + delta * 0.2;
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
    window.addEventListener('pointermove', updatePointerField, { passive: true });

    return () => {
      window.cancelAnimationFrame(scrollFrame);
      window.cancelAnimationFrame(mediaFrame);
      video.removeEventListener('loadedmetadata', handleMetadata);
      window.removeEventListener('scroll', requestScrollState);
      window.removeEventListener('resize', requestScrollState);
      window.removeEventListener('pointermove', updatePointerField);
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
          '--pointer-x': '70%',
          '--pointer-y': '26%',
          '--video-mint': bloomxRadix.mintStrong,
          '--video-coin': bloomxRadix.coinStrong,
          '--video-bronze': bloomxRadix.bronzeStrong,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover opacity-[0.94] brightness-[1.22] contrast-[1.16] saturate-[1.08] will-change-transform"
        style={{
          transform:
            'scale(calc(1.02 + var(--bg-ease) * 0.08)) translate3d(calc(var(--bg-scroll) * -2vw), calc(var(--bg-scroll) * -4vh), 0)',
        }}
        muted
        playsInline
        preload="auto"
      >
        <source src={HERO_VIDEO_SOURCE} type="video/mp4" />
      </video>

      <div
        className="absolute inset-0 opacity-70 will-change-transform"
        style={{
          transform: 'translate3d(calc(var(--bg-scroll) * -2vw), calc(var(--bg-scroll) * 1.5vh), 0)',
          background:
            'radial-gradient(circle at var(--pointer-x) var(--pointer-y), rgba(105,226,169,0.18), transparent 24rem), radial-gradient(circle at 78% 18%, rgba(238,195,123,0.11), transparent 30rem), radial-gradient(circle at 20% 74%, rgba(86,132,177,0.14), transparent 28rem)',
        }}
      />

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,7,0.62),rgba(5,8,7,0.25)_44%,rgba(5,8,7,0.04)_100%),linear-gradient(180deg,rgba(5,8,7,0.02),rgba(5,8,7,0.2)_78%,rgba(5,8,7,0.5))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(246,214,167,0.13),transparent_34rem)]" />
    </div>
  );
};

export default BackgroundVideo;
