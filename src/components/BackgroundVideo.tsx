import { type CSSProperties, useEffect, useRef } from 'react';

type NetworkPoint = {
  x: number;
  y: number;
  depth: number;
  phase: number;
  group: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (value: number) => value * value * (3 - 2 * value);

const drawRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
};

const BackgroundVideo = () => {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const shell = shellRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: true });
    if (!shell || !canvas || !context) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pointer = {
      x: window.innerWidth * 0.72,
      y: window.innerHeight * 0.38,
      tx: window.innerWidth * 0.72,
      ty: window.innerHeight * 0.38,
      down: 0,
    };
    const scrollState = { current: 0, target: 0 };
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frameId = 0;
    let start = performance.now();
    let points: NetworkPoint[] = [];

    const buildPoints = () => {
      points = Array.from({ length: 72 }, (_, index) => {
        const column = index % 12;
        const row = Math.floor(index / 12);
        const offsetX = ((index * 37) % 57) - 28;
        const offsetY = ((index * 53) % 49) - 24;

        return {
          x: width * 0.06 + column * width * 0.078 + offsetX,
          y: height * 0.42 + row * height * 0.095 + offsetY,
          depth: 0.35 + ((index * 13) % 70) / 100,
          phase: (index * 0.37) % Math.PI,
          group: index % 4,
        };
      });
    };

    const resize = () => {
      dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildPoints();
    };

    const updateScroll = () => {
      const scrollRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scrollState.target = reduceMotion ? 0 : clamp01(window.scrollY / scrollRange);
      shell.style.setProperty('--bg-scroll', scrollState.target.toFixed(4));
      shell.style.setProperty('--bg-ease', smooth(scrollState.target).toFixed(4));
    };

    const updatePointer = (event: PointerEvent) => {
      pointer.tx = event.clientX;
      pointer.ty = event.clientY;
      shell.style.setProperty('--pointer-x', `${Math.round((event.clientX / Math.max(1, width)) * 100)}%`);
      shell.style.setProperty('--pointer-y', `${Math.round((event.clientY / Math.max(1, height)) * 100)}%`);
    };

    const setPointerDown = (down: number) => {
      pointer.down = down;
    };
    const handlePointerDown = () => setPointerDown(1);
    const handlePointerUp = () => setPointerDown(0);

    const drawFlowPath = (
      time: number,
      yOffset: number,
      color: string,
      glow: string,
      widthScale: number,
      offset: number,
    ) => {
      context.save();
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.shadowBlur = 22 + pointer.down * 22;
      context.shadowColor = glow;
      context.strokeStyle = color;
      context.lineWidth = widthScale;
      context.setLineDash([36, 28]);
      context.lineDashOffset = -(time * (90 + pointer.down * 70) + offset);
      context.beginPath();
      context.moveTo(-width * 0.08, height * 0.68 + yOffset);
      context.bezierCurveTo(
        width * 0.18,
        height * 0.5 + yOffset * 0.2,
        width * 0.38 + (pointer.x - width * 0.5) * 0.08,
        height * 0.8 + yOffset,
        width * 0.62,
        height * 0.52 + yOffset * 0.32,
      );
      context.bezierCurveTo(
        width * 0.78,
        height * 0.32 + (pointer.y - height * 0.5) * 0.08,
        width * 0.88,
        height * 0.58 + yOffset * 0.42,
        width * 1.08,
        height * 0.18 + yOffset,
      );
      context.stroke();
      context.restore();
    };

    const drawPanel = (time: number, x: number, y: number, w: number, h: number, tilt: number, accent: string) => {
      context.save();
      const px = (pointer.x - width * 0.5) * 0.018;
      const py = (pointer.y - height * 0.5) * 0.012;
      context.translate(x + px, y + py);
      context.rotate(tilt + Math.sin(time * 0.7) * 0.015);
      context.globalAlpha = 0.82;
      context.shadowBlur = 36;
      context.shadowColor = accent;
      drawRoundedRect(context, 0, 0, w, h, Math.min(28, w * 0.08));
      const fill = context.createLinearGradient(0, 0, w, h);
      fill.addColorStop(0, 'rgba(12, 38, 37, 0.62)');
      fill.addColorStop(0.5, 'rgba(13, 58, 58, 0.28)');
      fill.addColorStop(1, 'rgba(3, 8, 7, 0.2)');
      context.fillStyle = fill;
      context.fill();
      context.lineWidth = 1.2;
      context.strokeStyle = accent;
      context.stroke();
      context.shadowBlur = 0;

      context.globalAlpha = 0.28;
      context.strokeStyle = 'rgba(214, 255, 235, 0.55)';
      context.lineWidth = 0.8;
      for (let gx = 34; gx < w - 24; gx += 38) {
        context.beginPath();
        context.moveTo(gx, 24);
        context.lineTo(gx, h - 24);
        context.stroke();
      }
      for (let gy = 34; gy < h - 24; gy += 36) {
        context.beginPath();
        context.moveTo(24, gy);
        context.lineTo(w - 24, gy);
        context.stroke();
      }

      const scanY = ((time * 72 + w * 0.3) % (h + 70)) - 35;
      const scan = context.createLinearGradient(0, scanY - 20, 0, scanY + 48);
      scan.addColorStop(0, 'rgba(114, 242, 187, 0)');
      scan.addColorStop(0.5, accent);
      scan.addColorStop(1, 'rgba(114, 242, 187, 0)');
      context.globalAlpha = 0.48;
      context.fillStyle = scan;
      context.fillRect(0, scanY, w, 54);

      context.globalAlpha = 0.72;
      for (let i = 0; i < 6; i += 1) {
        const barWidth = (w * 0.22 + Math.sin(time * 1.4 + i) * w * 0.08) * (1 + pointer.down * 0.16);
        context.fillStyle = i % 2 ? 'rgba(243, 207, 131, 0.52)' : 'rgba(114, 242, 187, 0.68)';
        context.fillRect(36, 46 + i * 32, Math.max(42, barWidth), 5);
      }
      context.restore();
    };

    const draw = (now: number) => {
      const elapsed = reduceMotion ? 0 : (now - start) / 1000;
      if (reduceMotion) start = now;
      pointer.x += (pointer.tx - pointer.x) * 0.085;
      pointer.y += (pointer.ty - pointer.y) * 0.085;
      pointer.down += (0 - pointer.down) * 0.035;
      scrollState.current += (scrollState.target - scrollState.current) * 0.08;

      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = 'source-over';

      const scrollShift = smooth(scrollState.current);
      const pulse = 0.5 + Math.sin(elapsed * 1.2) * 0.5;
      const glow = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, Math.max(width, height) * 0.46);
      glow.addColorStop(0, `rgba(114, 242, 187, ${0.16 + pointer.down * 0.12})`);
      glow.addColorStop(0.38, 'rgba(67, 130, 175, 0.08)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      context.globalCompositeOperation = 'lighter';
      drawFlowPath(elapsed, -44 + scrollShift * 18, 'rgba(114, 242, 187, 0.82)', 'rgba(114, 242, 187, 0.9)', 2.6, 0);
      drawFlowPath(elapsed * 0.86, 0, 'rgba(243, 207, 131, 0.62)', 'rgba(243, 207, 131, 0.8)', 1.7, 80);
      drawFlowPath(elapsed * 1.15, 46 - scrollShift * 22, 'rgba(142, 199, 255, 0.58)', 'rgba(142, 199, 255, 0.76)', 1.9, 160);

      points.forEach((point, index) => {
        const driftX = Math.sin(elapsed * (0.42 + point.depth * 0.28) + point.phase) * 16 * point.depth;
        const driftY = Math.cos(elapsed * (0.36 + point.depth * 0.22) + point.phase) * 11 * point.depth;
        const x = point.x + driftX + (pointer.x - width * 0.5) * 0.018 * point.depth;
        const y = point.y + driftY + (pointer.y - height * 0.5) * 0.012 * point.depth - scrollShift * 34 * point.depth;
        const near = Math.max(0, 1 - Math.hypot(pointer.x - x, pointer.y - y) / 260);
        const alpha = 0.26 + near * 0.64 + Math.sin(elapsed * 1.8 + point.phase) * 0.12;
        const color = point.group === 0 ? '114, 242, 187' : point.group === 1 ? '243, 207, 131' : '142, 199, 255';

        if (index > 0 && index % 3 !== 0) {
          const previous = points[index - 1];
          const px = previous.x + Math.sin(elapsed * 0.4 + previous.phase) * 12 * previous.depth;
          const py = previous.y + Math.cos(elapsed * 0.36 + previous.phase) * 9 * previous.depth - scrollShift * 30 * previous.depth;
          context.strokeStyle = `rgba(${color}, ${0.08 + near * 0.16})`;
          context.lineWidth = 0.7 + near * 1.1;
          context.beginPath();
          context.moveTo(px, py);
          context.lineTo(x, y);
          context.stroke();
        }

        context.shadowBlur = 10 + near * 30;
        context.shadowColor = `rgba(${color}, 0.95)`;
        context.fillStyle = `rgba(${color}, ${alpha})`;
        context.beginPath();
        context.arc(x, y, (1.8 + point.depth * 2.6) * (1 + near * 0.8 + pointer.down * 0.22), 0, Math.PI * 2);
        context.fill();
      });

      context.shadowBlur = 0;
      drawPanel(elapsed, width * 0.62, height * 0.18 - scrollShift * 34, width * 0.28, height * 0.28, -0.08, 'rgba(114, 242, 187, 0.78)');
      drawPanel(elapsed + 0.7, width * 0.72, height * 0.49 - scrollShift * 28, width * 0.22, height * 0.22, 0.08, 'rgba(142, 199, 255, 0.66)');

      context.globalCompositeOperation = 'source-over';
      context.globalAlpha = 0.5;
      context.fillStyle = `rgba(243, 207, 131, ${0.02 + pulse * 0.03})`;
      context.fillRect(0, 0, width, height);
      context.globalAlpha = 1;

      frameId = window.requestAnimationFrame(draw);
    };

    resize();
    updateScroll();
    frameId = window.requestAnimationFrame(draw);
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('pointermove', updatePointer, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('pointermove', updatePointer);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
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
      <div
        className="absolute inset-0 bg-cover bg-center opacity-90 brightness-[1.05] contrast-[1.08] saturate-[1.12] will-change-transform"
        style={{
          backgroundImage: 'url(/media/bloomx-generated-hero.png)',
          transform:
            'scale(calc(1.02 + var(--bg-ease) * 0.055)) translate3d(calc(var(--bg-scroll) * -2.8vw), calc(var(--bg-scroll) * -2.4vh), 0)',
        }}
      />

      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div
        className="absolute inset-0 will-change-transform"
        style={{
          transform: 'translate3d(calc(var(--bg-scroll) * -1.4vw), calc(var(--bg-scroll) * 1vh), 0)',
          background:
            'radial-gradient(circle at var(--pointer-x) var(--pointer-y), rgba(114,242,187,0.18), transparent 23rem), radial-gradient(circle at 78% 18%, rgba(243,207,131,0.12), transparent 30rem), radial-gradient(circle at 20% 74%, rgba(86,132,177,0.12), transparent 28rem)',
        }}
      />

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,7,0.58),rgba(5,8,7,0.2)_44%,rgba(5,8,7,0.03)_100%),linear-gradient(180deg,rgba(5,8,7,0.02),rgba(5,8,7,0.16)_78%,rgba(5,8,7,0.45))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(246,214,167,0.12),transparent_34rem)]" />
    </div>
  );
};

export default BackgroundVideo;
