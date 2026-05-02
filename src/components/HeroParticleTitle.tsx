import { useEffect, useRef } from 'react';

type TextParticle = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  seed: number;
};

type AudioState = {
  context: AudioContext | null;
  lastPlayed: number;
  step: number;
};

type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

interface HeroParticleTitleProps {
  lines: string[];
  ariaLabel: string;
}

const particleLimit = 1800;
const remotionEase = (value: number) => 1 - Math.pow(1 - value, 4);

function shuffleTargets<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor((Math.sin(index * 91.7) * 0.5 + 0.5) * index);
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function makeAudioState(): AudioState {
  return { context: null, lastPlayed: 0, step: 0 };
}

function triggerSoftMelody(state: AudioState, xRatio: number, force = false) {
  const now = performance.now();
  if (!force && now - state.lastPlayed < 720) return;

  const audioWindow = window as AudioWindow;
  const AudioEngine = audioWindow.AudioContext || audioWindow.webkitAudioContext;
  if (!AudioEngine) return;

  if (!state.context) {
    state.context = new AudioEngine();
  }

  const context = state.context;
  const play = () => {
    if (context.state !== 'running') return;
    state.lastPlayed = performance.now();

    const scale = [523.25, 587.33, 659.25, 783.99, 880, 987.77];
    const start = context.currentTime + 0.018;
    const offset = Math.round(xRatio * 3) + state.step;
    state.step = (state.step + 1) % scale.length;

    [0, 2, 4].forEach((jump, index) => {
      const frequency = scale[(offset + jump) % scale.length];
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();

      oscillator.type = index === 1 ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency, start + index * 0.145);
      oscillator.detune.setValueAtTime(index * 3 - 4, start);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, start);
      filter.Q.setValueAtTime(0.3, start);

      gain.gain.setValueAtTime(0.0001, start + index * 0.145);
      gain.gain.exponentialRampToValueAtTime(0.018, start + index * 0.145 + 0.045);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + index * 0.145 + 1.05);

      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start + index * 0.145);
      oscillator.stop(start + index * 0.145 + 1.12);
    });
  };

  if (context.state === 'running') {
    play();
    return;
  }

  void context.resume().then(play).catch(() => undefined);
}

export default function HeroParticleTitle({ lines, ariaLabel }: HeroParticleTitleProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<TextParticle[]>([]);
  const pointerRef = useRef({ x: -9999, y: -9999, active: false });
  const audioRef = useRef<AudioState>(makeAudioState());

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrame = 0;
    let startedAt = performance.now();
    let lastDrawAt = 0;
    let isVisible = true;

    const rebuildParticles = () => {
      const rect = wrap.getBoundingClientRect();
      const width = Math.max(320, Math.floor(rect.width));
      const height = Math.max(190, Math.floor(rect.height));
      const ratio = Math.min(1.35, window.devicePixelRatio || 1);
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = width;
      sampleCanvas.height = height;
      const sample = sampleCanvas.getContext('2d', { willReadFrequently: true });
      if (!sample) return;

      const isCompact = width < 620;
      const fontSize = Math.max(isCompact ? 43 : 72, Math.min(width * (isCompact ? 0.145 : 0.105), isCompact ? 64 : 108));
      const lineHeight = fontSize * 1.06;
      const yStart = Math.max(fontSize, (height - lineHeight * lines.length) * 0.5 + fontSize * 0.76);

      sample.clearRect(0, 0, width, height);
      sample.fillStyle = '#ffffff';
      sample.textBaseline = 'alphabetic';
      sample.textAlign = 'left';
      sample.font = `700 ${fontSize}px "Outfit", "Satoshi", "SF Pro Display", system-ui, sans-serif`;
      lines.forEach((line, index) => {
        sample.fillText(line, 0, yStart + index * lineHeight);
      });

      const imageData = sample.getImageData(0, 0, width, height);
      const targets: Array<{ x: number; y: number }> = [];
      const step = isCompact ? 5 : 4;

      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const alpha = imageData.data[(y * width + x) * 4 + 3];
          if (alpha > 80) targets.push({ x, y });
        }
      }

      const picked = shuffleTargets(targets).slice(0, particleLimit);
      const previous = particlesRef.current;
      particlesRef.current = picked.map((target, index) => {
        const old = previous[index];
        return {
          x: old?.x ?? width * (0.18 + (Math.sin(index * 12.9898) * 0.5 + 0.5) * 0.74),
          y: old?.y ?? height * (0.08 + (Math.sin(index * 78.233 + 1.7) * 0.5 + 0.5) * 0.78),
          tx: target.x,
          ty: target.y,
          vx: old?.vx ?? 0,
          vy: old?.vy ?? 0,
          seed: index * 0.618,
        };
      });
    };

    const draw = (now: number) => {
      animationFrame = requestAnimationFrame(draw);
      if (!isVisible || now - lastDrawAt < 33) return;
      lastDrawAt = now;

      const elapsed = (now - startedAt) / 1000;
      const frame = elapsed * 30;
      const entrance = remotionEase(Math.min(1, frame / 52));
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const pointer = pointerRef.current;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      for (const particle of particlesRef.current) {
        const dx = particle.tx - particle.x;
        const dy = particle.ty - particle.y;
        const pointerDx = particle.x - pointer.x;
        const pointerDy = particle.y - pointer.y;
        const distance = Math.hypot(pointerDx, pointerDy);
        const radius = Math.max(74, width * 0.13);

        particle.vx += dx * 0.018;
        particle.vy += dy * 0.018;

        if (pointer.active && distance < radius) {
          const force = (1 - distance / radius) * 1.75;
          particle.vx += (pointerDx / Math.max(distance, 1)) * force;
          particle.vy += (pointerDy / Math.max(distance, 1)) * force;
        }

        particle.vx *= 0.84;
        particle.vy *= 0.84;
        particle.x += particle.vx;
        particle.y += particle.vy;

        const shimmer = 0.58 + Math.sin(elapsed * 0.85 + particle.seed) * 0.18;
        const alpha = Math.max(0, Math.min(1, entrance * shimmer));
        const size = 1.15 + Math.sin(elapsed * 0.6 + particle.seed) * 0.22;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(238,255,241,${alpha})`;
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
    };

    const resizeObserver = new ResizeObserver(rebuildParticles);
    resizeObserver.observe(wrap);
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry?.isIntersecting ?? true;
      },
      { threshold: 0.08 },
    );
    intersectionObserver.observe(wrap);
    void document.fonts?.ready.then(rebuildParticles);
    rebuildParticles();

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current.x = event.clientX - rect.left;
      pointerRef.current.y = event.clientY - rect.top;
      pointerRef.current.active = true;
      triggerSoftMelody(audioRef.current, Math.max(0, Math.min(1, pointerRef.current.x / Math.max(1, rect.width))));
    };

    const handlePointerEnter = (event: MouseEvent | PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current.x = event.clientX - rect.left;
      pointerRef.current.y = event.clientY - rect.top;
      pointerRef.current.active = true;
      triggerSoftMelody(audioRef.current, Math.max(0, Math.min(1, pointerRef.current.x / Math.max(1, rect.width))), true);
    };

    const handlePointerLeave = () => {
      pointerRef.current.active = false;
      pointerRef.current.x = -9999;
      pointerRef.current.y = -9999;
    };

    const handlePointerDown = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      triggerSoftMelody(audioRef.current, Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width))));
    };

    wrap.addEventListener('pointerenter', handlePointerEnter, { passive: true });
    wrap.addEventListener('pointerover', handlePointerEnter, { passive: true });
    wrap.addEventListener('mouseover', handlePointerEnter, { passive: true });
    canvas.addEventListener('pointerenter', handlePointerEnter, { passive: true });
    canvas.addEventListener('pointerover', handlePointerEnter, { passive: true });
    canvas.addEventListener('mouseover', handlePointerEnter, { passive: true });
    canvas.addEventListener('pointermove', handlePointerMove, { passive: true });
    canvas.addEventListener('pointerdown', handlePointerDown, { passive: true });
    canvas.addEventListener('pointerleave', handlePointerLeave, { passive: true });
    animationFrame = requestAnimationFrame((time) => {
      startedAt = time;
      draw(time);
    });

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      wrap.removeEventListener('pointerenter', handlePointerEnter);
      wrap.removeEventListener('pointerover', handlePointerEnter);
      wrap.removeEventListener('mouseover', handlePointerEnter);
      canvas.removeEventListener('pointerenter', handlePointerEnter);
      canvas.removeEventListener('pointerover', handlePointerEnter);
      canvas.removeEventListener('mouseover', handlePointerEnter);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      void audioRef.current.context?.close();
      audioRef.current.context = null;
    };
  }, [lines]);

  return (
    <div ref={wrapRef} className="hero-particle-title relative h-[210px] w-full sm:h-[250px] lg:h-[310px]">
      <h1 className="sr-only">{ariaLabel}</h1>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" aria-hidden="true" />
    </div>
  );
}
