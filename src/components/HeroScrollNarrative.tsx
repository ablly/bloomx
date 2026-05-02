import { type CSSProperties, useEffect, useMemo, useState } from 'react';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const storyScrollRange = 5.2;

const chapters = [
  { id: '01', title: '访问', detail: '输入 bloomx.io', pos: 'left-[7vw] top-[24vh]' },
  { id: '02', title: '市场', detail: '选择可调用模型', pos: 'right-[9vw] top-[24vh]' },
  { id: '03', title: '分流', detail: '商家入驻或用户订阅', pos: 'left-[12vw] bottom-[25vh]' },
  { id: '04', title: '密钥', detail: '创建项目 API Key', pos: 'right-[12vw] bottom-[28vh]' },
  { id: '05', title: '调用', detail: '发起模型 API 请求', pos: 'left-[28vw] top-[18vh]' },
  { id: '06', title: '完成', detail: '用量记录与结算入账', pos: 'right-[8vw] top-[20vh]' },
];

const getStoryProgress = () => {
  const range = Math.max(window.innerHeight * storyScrollRange, 1);
  return clamp01(window.scrollY / range);
};

const HeroScrollNarrative = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      setProgress(getStoryProgress());
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

  const active = Math.min(chapters.length - 1, Math.round(progress * (chapters.length - 1)));
  const vars = useMemo(
    () =>
      ({
        '--story-progress': progress,
      }) as CSSProperties,
    [progress],
  );

  return (
    <div className="pointer-events-none absolute inset-0 hidden sm:block" style={vars} aria-hidden="true">
      {chapters.map((chapter, index) => {
        const scenePosition = progress * (chapters.length - 1);
        const distance = Math.abs(scenePosition - index);
        const opacity = clamp01(1 - distance * 1.65);
        const lift = (index - scenePosition) * 16;

        return (
          <div
            key={chapter.id}
            className={`absolute ${chapter.pos} w-[16rem]`}
            style={{
              opacity,
              transform: `translate3d(0, ${lift}px, 0)`,
              transition: 'opacity 120ms linear',
              textShadow: '0 1px 22px rgba(246,242,234,0.92)',
            }}
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#293027]/62">{chapter.id}</div>
            <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#171c16]">{chapter.title}</div>
            <div className="mt-3 text-sm font-medium leading-6 text-[#293027]/72">{chapter.detail}</div>
          </div>
        );
      })}

      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#293027]/10 bg-[#f6f2ea]/72 px-3 py-2 shadow-[0_18px_55px_rgba(32,37,31,0.1)] backdrop-blur-xl">
        {chapters.map((chapter, index) => (
          <span
            key={chapter.id}
            className="h-1.5 rounded-full transition-all duration-200"
            style={{
              width: index === active ? 28 : 6,
              background: index === active ? '#20251f' : 'rgba(41,48,39,0.24)',
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroScrollNarrative;
