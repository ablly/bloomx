import { useEffect } from 'react';

const chapterFallback = ['入口', '发现', '决策', '交易'];

const routeChapterLabels: Record<string, string[]> = {
  '/': ['01 愿景', '02 供给', '03 订阅', '04 接入'],
  '/marketplace': ['01 搜索', '02 筛选', '03 模型', '04 调用'],
  '/pricing': ['01 方案', '02 用量', '03 结算', '04 开始'],
};

export default function ExperienceLayer() {
  useEffect(() => {
    const documentElement = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    if (!root) return;

    body.classList.add('taste-enhanced');

    const progress = document.createElement('div');
    progress.className = 'taste-progress';
    progress.setAttribute('aria-hidden', 'true');

    const rail = document.createElement('div');
    rail.className = 'taste-narrative';
    rail.setAttribute('aria-hidden', 'true');

    body.append(progress, rail);

    const state: {
      sections: HTMLElement[];
      revealObserver: IntersectionObserver | null;
      prepareTimer: number;
    } = {
      sections: [],
      revealObserver: null,
      prepareTimer: 0,
    };

    const cleanLabel = (text: string | null, fallback: string) => {
      const label = String(text || '').replace(/\s+/g, ' ').trim();
      if (!label) return fallback;
      return label.length > 12 ? `${label.slice(0, 12)}...` : label;
    };

    const getRouteLabels = () => routeChapterLabels[window.location.pathname] || chapterFallback;

    const applyRouteStoryTone = () => {
      const route = window.location.pathname;
      body.dataset.storyRoute = route === '/' ? 'home' : route.replace(/^\//, '') || 'home';
    };

    const updateScrollStory = () => {
      const max = Math.max(1, documentElement.scrollHeight - window.innerHeight);
      const ratio = Math.min(1, Math.max(0, window.scrollY / max));
      documentElement.style.setProperty('--taste-progress', ratio.toFixed(4));

      let active = 0;
      state.sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.46) active = index;
      });

      rail.querySelectorAll<HTMLElement>('.taste-chapter').forEach((item, index) => {
        item.classList.toggle('is-active', index === active);
      });
    };

    const prepareExperience = () => {
      state.revealObserver?.disconnect();
      applyRouteStoryTone();

      const candidates = Array.from(
        root.querySelectorAll<HTMLElement>(
          "main > *, section, article, form, [class*='card' i], [class*='product' i], [class*='market' i], [class*='model' i]",
        ),
      )
        .filter((node) => !node.closest('#story-home'))
        .filter((node) => node.offsetHeight > 48)
        .slice(0, 24);

      candidates.forEach((node) => node.classList.add('taste-reveal'));

      const headings = Array.from(root.querySelectorAll<HTMLElement>('h1, h2, [data-screen-label]'))
        .filter((node) => node.textContent && node.offsetHeight > 0)
        .slice(0, 4);

      state.sections = headings.length ? headings : candidates.filter((_, index) => index % 3 === 0).slice(0, 4);
      if (!state.sections.length) state.sections = [root];

      rail.replaceChildren(
        ...state.sections.map((node, index) => {
          const item = document.createElement('div');
          item.className = 'taste-chapter';
          const routeLabels = getRouteLabels();
          const label = node.getAttribute('data-screen-label') || node.textContent;
          item.textContent = routeLabels[index] || cleanLabel(label, chapterFallback[index] || `章节 ${index + 1}`);
          return item;
        }),
      );

      if ('IntersectionObserver' in window) {
        state.revealObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) entry.target.classList.add('is-visible');
            });
          },
          { threshold: 0.14, rootMargin: '0px 0px -8% 0px' },
        );
        candidates.forEach((node) => state.revealObserver?.observe(node));
      } else {
        candidates.forEach((node) => node.classList.add('is-visible'));
      }

      updateScrollStory();
    };

    const mutationObserver = new MutationObserver(() => {
      window.clearTimeout(state.prepareTimer);
      state.prepareTimer = window.setTimeout(prepareExperience, 160);
    });

    const updatePointerField = (event: PointerEvent) => {
      documentElement.style.setProperty('--taste-pointer-x', `${Math.round((event.clientX / window.innerWidth) * 100)}%`);
      documentElement.style.setProperty('--taste-pointer-y', `${Math.round((event.clientY / window.innerHeight) * 100)}%`);
    };

    mutationObserver.observe(root, { childList: true, subtree: true });
    prepareExperience();

    const routeTimer = window.setInterval(() => {
      if (body.dataset.storyPath !== window.location.pathname) {
        body.dataset.storyPath = window.location.pathname;
        prepareExperience();
      }
    }, 300);

    window.addEventListener('scroll', updateScrollStory, { passive: true });
    window.addEventListener('resize', prepareExperience, { passive: true });
    window.addEventListener('pointermove', updatePointerField, { passive: true });

    return () => {
      body.classList.remove('taste-enhanced');
      progress.remove();
      rail.remove();
      state.revealObserver?.disconnect();
      mutationObserver.disconnect();
      window.clearTimeout(state.prepareTimer);
      window.clearInterval(routeTimer);
      window.removeEventListener('scroll', updateScrollStory);
      window.removeEventListener('resize', prepareExperience);
      window.removeEventListener('pointermove', updatePointerField);
    };
  }, []);

  return null;
}
