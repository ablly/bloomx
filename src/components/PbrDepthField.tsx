import { useEffect, useRef } from 'react';

type ThreeModule = Record<string, any>;

type PbrAsset = {
  group: any;
  coin: any;
  accentCoin: any;
  rim: any;
  baseX: number;
  baseY: number;
  baseZ: number;
  scale: number;
  phase: number;
  speed: number;
};

const assetSpecs = [
  { x: 2.35, y: 1.16, z: -0.9, scale: 1.42, phase: 0.2, speed: 0.46 },
  { x: 4.1, y: -0.38, z: -1.7, scale: 0.86, phase: 1.8, speed: 0.38 },
  { x: 1.15, y: -1.5, z: -1.2, scale: 0.74, phase: 2.7, speed: 0.42 },
  { x: -0.75, y: 0.9, z: -2.1, scale: 0.64, phase: 3.6, speed: 0.34 },
  { x: 5.2, y: 1.46, z: -2.6, scale: 0.52, phase: 4.1, speed: 0.3 },
  { x: -2.1, y: -1.05, z: -2.0, scale: 0.56, phase: 5.2, speed: 0.32 },
  { x: 3.0, y: -2.15, z: -0.6, scale: 1.02, phase: 6.4, speed: 0.36 },
];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (value: number) => value * value * (3 - 2 * value);

function setCanvasSize(canvas: HTMLCanvasElement, renderer: any) {
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  const pixelRatio = Math.min(1.6, window.devicePixelRatio || 1);

  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
}

function startFallbackCanvas(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return () => undefined;

  let frame = 0;
  let raf = 0;
  let scroll = 0;

  const resize = () => {
    const ratio = Math.min(1.6, window.devicePixelRatio || 1);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const updateScroll = () => {
    const range = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    scroll = smooth(clamp01(window.scrollY / range));
  };

  const draw = () => {
    frame += 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    context.clearRect(0, 0, width, height);

    assetSpecs.forEach((asset, index) => {
      const pulse = Math.sin(frame * 0.018 * asset.speed + asset.phase);
      const x = width * (0.62 + asset.x * 0.055) - scroll * width * 0.1;
      const y = height * (0.48 + asset.y * 0.09) + pulse * 18 - scroll * height * 0.08;
      const radius = Math.max(38, asset.scale * 118 * (1 + scroll * 0.24));
      const morph = clamp01(scroll * 1.25 + index * 0.04);

      const gradient = context.createRadialGradient(x - radius * 0.36, y - radius * 0.42, 0, x, y, radius);
      gradient.addColorStop(0, morph > 0.45 ? 'rgba(235,255,241,0.94)' : 'rgba(255,239,197,0.96)');
      gradient.addColorStop(0.44, morph > 0.45 ? 'rgba(105,226,169,0.48)' : 'rgba(207,153,66,0.58)');
      gradient.addColorStop(1, 'rgba(8,14,12,0.26)');

      context.save();
      context.translate(x, y);
      context.rotate(frame * 0.003 + asset.phase);
      context.scale(1, 0.62 + morph * 0.22);
      context.globalAlpha = 0.72 + asset.scale * 0.2;
      context.fillStyle = gradient;
      context.strokeStyle = 'rgba(244,255,248,0.46)';
      context.lineWidth = 1.2;

      if (morph > 0.48) {
        context.beginPath();
        for (let point = 0; point < 6; point += 1) {
          const angle = Math.PI / 6 + (Math.PI * 2 * point) / 6;
          const px = Math.cos(angle) * radius;
          const py = Math.sin(angle) * radius;
          if (point === 0) context.moveTo(px, py);
          else context.lineTo(px, py);
        }
        context.closePath();
      } else {
        context.beginPath();
        context.arc(0, 0, radius, 0, Math.PI * 2);
      }

      context.fill();
      context.stroke();
      context.restore();
    });

    raf = requestAnimationFrame(draw);
  };

  resize();
  updateScroll();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', updateScroll, { passive: true });
  raf = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('scroll', updateScroll);
  };
}

export default function PbrDepthField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let cleanup: () => void = () => undefined;

    const start = async () => {
      try {
        const threeUrl = 'https://esm.sh/three@0.162.0?bundle';
        const THREE = (await import(/* @vite-ignore */ threeUrl)) as ThreeModule;
        if (disposed) return;

        const renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 2.05;
        setCanvasSize(canvas, renderer);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, window.innerWidth / Math.max(1, window.innerHeight), 0.1, 100);
        camera.position.set(0, 0.12, 6.4);

        const rig = new THREE.Group();
        scene.add(rig);

        const ambient = new THREE.HemisphereLight(0xf3fff7, 0x162018, 2.15);
        scene.add(ambient);

        const keyLight = new THREE.PointLight(0xffe0a6, 8.4, 20, 1.75);
        keyLight.position.set(2.2, 3.6, 4.4);
        scene.add(keyLight);

        const rimLight = new THREE.PointLight(0x8dffc7, 6.2, 18, 1.9);
        rimLight.position.set(-3.5, -1.1, 3.2);
        scene.add(rimLight);

        const frontLight = new THREE.DirectionalLight(0xffffff, 1.85);
        frontLight.position.set(0.8, 1.4, 3.8);
        scene.add(frontLight);

        const coinGeometry = new THREE.CylinderGeometry(1, 1, 0.16, 96, 1, false);
        coinGeometry.rotateX(Math.PI / 2);
        const tokenGeometry = new THREE.CylinderGeometry(1.05, 1.05, 0.18, 96, 1, false);
        tokenGeometry.rotateX(Math.PI / 2);
        const rimGeometry = new THREE.TorusGeometry(1.02, 0.035, 16, 96);

        const coinMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xf0bd61,
          metalness: 0.96,
          roughness: 0.16,
          clearcoat: 0.88,
          clearcoatRoughness: 0.18,
          emissive: 0x3a250b,
          emissiveIntensity: 0.18,
          transparent: true,
        });

        const accentMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xc4ffe3,
          metalness: 0.74,
          roughness: 0.12,
          clearcoat: 1,
          clearcoatRoughness: 0.12,
          transmission: 0.12,
          emissive: 0x1c6a49,
          emissiveIntensity: 0.24,
          transparent: true,
        });

        const rimMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xf8e3b1,
          metalness: 1,
          roughness: 0.18,
          clearcoat: 0.7,
          transparent: true,
          opacity: 0.9,
        });

        const assets: PbrAsset[] = assetSpecs.map((spec) => {
          const group = new THREE.Group();
          const coin = new THREE.Mesh(coinGeometry, coinMaterial.clone());
          const accentCoin = new THREE.Mesh(tokenGeometry, accentMaterial.clone());
          const rim = new THREE.Mesh(rimGeometry, rimMaterial.clone());

          accentCoin.scale.setScalar(0.82);
          group.add(coin, accentCoin, rim);
          group.position.set(spec.x, spec.y, spec.z);
          group.scale.setScalar(spec.scale);
          rig.add(group);

          return {
            group,
            coin,
            accentCoin,
            rim,
            baseX: spec.x,
            baseY: spec.y,
            baseZ: spec.z,
            scale: spec.scale,
            phase: spec.phase,
            speed: spec.speed,
          };
        });

        const pointer = { x: 0, y: 0 };
        const targetPointer = { x: 0, y: 0 };
        let scrollTarget = 0;
        let scroll = 0;
        let frame = 0;

        const updateScroll = () => {
          const range = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
          scrollTarget = smooth(clamp01(window.scrollY / range));
        };

        const updatePointer = (event: PointerEvent) => {
          targetPointer.x = (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
          targetPointer.y = (event.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
        };

        const resize = () => {
          setCanvasSize(canvas, renderer);
          camera.aspect = window.innerWidth / Math.max(1, window.innerHeight);
          camera.updateProjectionMatrix();
        };

        const render = () => {
          if (disposed) return;

          frame += 1;
          pointer.x += (targetPointer.x - pointer.x) * 0.045;
          pointer.y += (targetPointer.y - pointer.y) * 0.045;
          scroll += (scrollTarget - scroll) * 0.055;

          const time = frame / 60;
          rig.rotation.y = -0.18 + pointer.x * 0.08 + scroll * 0.36;
          rig.rotation.x = pointer.y * -0.035 + scroll * 0.05;
          rig.position.x = -scroll * 0.85;
          rig.position.y = scroll * 0.16;
          camera.position.z = 6.35 - scroll * 1.55;
          camera.position.x = pointer.x * 0.18;
          camera.position.y = 0.1 - pointer.y * 0.06;
          camera.lookAt(0.12, 0, 0);

          keyLight.position.x = 2.4 + Math.sin(time * 0.52) * 0.56 + pointer.x * 0.28;
          keyLight.position.y = 3.2 + Math.cos(time * 0.34) * 0.32;
          rimLight.position.x = -3.5 + Math.cos(time * 0.4) * 0.42;

          assets.forEach((asset, index) => {
            const local = time * asset.speed + asset.phase;
            const morph = clamp01(scroll * 1.28 + index * 0.035);
            const tokenOpacity = smooth(morph);
            const coinOpacity = 1 - tokenOpacity * 0.82;

            asset.group.position.x = asset.baseX + Math.sin(local * 0.9) * 0.26 - scroll * asset.scale * 1.55;
            asset.group.position.y = asset.baseY + Math.cos(local * 0.8) * 0.18 + scroll * asset.scale * 0.5;
            asset.group.position.z = asset.baseZ + Math.sin(local * 0.7) * 0.36 + scroll * 0.82;
            asset.group.rotation.x = local * 0.34 + pointer.y * 0.14;
            asset.group.rotation.y = local * 0.58 + scroll * 1.8 + pointer.x * 0.2;
            asset.group.rotation.z = local * 0.2;
            asset.group.scale.setScalar(asset.scale * (1.16 + scroll * 0.28));

            asset.coin.material.opacity = coinOpacity;
            asset.rim.material.opacity = 0.58 + coinOpacity * 0.36;
            asset.accentCoin.material.opacity = tokenOpacity;
            asset.accentCoin.scale.setScalar(0.78 + tokenOpacity * 0.28);
          });

          renderer.render(scene, camera);
          window.requestAnimationFrame(render);
        };

        updateScroll();
        window.addEventListener('resize', resize, { passive: true });
        window.addEventListener('scroll', updateScroll, { passive: true });
        window.addEventListener('pointermove', updatePointer, { passive: true });
        window.requestAnimationFrame(render);

        cleanup = () => {
          window.removeEventListener('resize', resize);
          window.removeEventListener('scroll', updateScroll);
          window.removeEventListener('pointermove', updatePointer);
          coinGeometry.dispose();
          tokenGeometry.dispose();
          rimGeometry.dispose();
          assets.forEach((asset) => {
            asset.coin.material.dispose();
            asset.accentCoin.material.dispose();
            asset.rim.material.dispose();
          });
          renderer.dispose();
        };
      } catch {
        if (!disposed) {
          cleanup = startFallbackCanvas(canvas);
        }
      }
    };

    void start();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-95" aria-hidden="true" />;
}
