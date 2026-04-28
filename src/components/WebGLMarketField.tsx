import { useEffect, useRef } from 'react';
import * as pc from 'playcanvas';

type NodeEntity = {
  entity: pc.Entity;
  base: pc.Vec3;
  speed: number;
  radius: number;
};

const makeMaterial = (diffuse: pc.Color, emissive: pc.Color) => {
  const material = new pc.StandardMaterial();
  material.diffuse = diffuse;
  material.emissive = emissive;
  material.metalness = 0.18;
  material.gloss = 0.72;
  material.update();
  return material;
};

const createBoxRoute = (app: pc.Application, from: pc.Vec3, to: pc.Vec3, material: pc.Material) => {
  const route = new pc.Entity('api-route');
  route.addComponent('render', { type: 'box', material });
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  route.setLocalPosition((from.x + to.x) / 2, (from.y + to.y) / 2, -0.18);
  route.setLocalScale(length, 0.018, 0.018);
  route.setEulerAngles(0, 0, Math.atan2(dy, dx) * (180 / Math.PI));
  app.root.addChild(route);
  return route;
};

export default function WebGLMarketField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let pointerX = 0;
    let pointerY = 0;

    const app = new pc.Application(canvas, {
      graphicsDeviceOptions: {
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: false,
      },
    });

    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    app.setCanvasResolution(pc.RESOLUTION_AUTO);
    app.scene.ambientLight = new pc.Color(0.06, 0.1, 0.09);

    const camera = new pc.Entity('market-camera');
    camera.addComponent('camera', {
      clearColor: new pc.Color(0.02, 0.04, 0.04, 0),
      fov: 42,
    });
    camera.setLocalPosition(0, 0, 12);
    app.root.addChild(camera);

    const light = new pc.Entity('market-light');
    light.addComponent('light', {
      type: 'directional',
      color: new pc.Color(0.8, 1, 0.9),
      intensity: 0.58,
    });
    light.setEulerAngles(36, 28, 0);
    app.root.addChild(light);

    const buyerMaterial = makeMaterial(new pc.Color(0.55, 0.84, 0.72), new pc.Color(0.18, 0.62, 0.44));
    const sellerMaterial = makeMaterial(new pc.Color(0.96, 0.52, 0.26), new pc.Color(0.46, 0.18, 0.07));
    const hubMaterial = makeMaterial(new pc.Color(0.88, 0.96, 0.9), new pc.Color(0.28, 0.72, 0.5));
    const routeMaterial = makeMaterial(new pc.Color(0.26, 0.5, 0.44), new pc.Color(0.08, 0.32, 0.25));

    const positions = [
      { base: new pc.Vec3(-4.7, 1.6, 0), radius: 0.17, material: buyerMaterial },
      { base: new pc.Vec3(-3.8, -1.35, 0), radius: 0.2, material: buyerMaterial },
      { base: new pc.Vec3(-2.35, 2.4, 0), radius: 0.13, material: buyerMaterial },
      { base: new pc.Vec3(0, 0.25, 0), radius: 0.38, material: hubMaterial },
      { base: new pc.Vec3(1.9, 1.8, 0), radius: 0.22, material: sellerMaterial },
      { base: new pc.Vec3(3.2, -0.55, 0), radius: 0.18, material: sellerMaterial },
      { base: new pc.Vec3(4.55, 1.25, 0), radius: 0.15, material: sellerMaterial },
      { base: new pc.Vec3(2.1, -2.15, 0), radius: 0.13, material: sellerMaterial },
    ];

    const nodes: NodeEntity[] = positions.map((item, index) => {
      const entity = new pc.Entity(index === 3 ? 'bloomx-routing-hub' : 'market-node');
      entity.addComponent('render', { type: 'sphere', material: item.material });
      entity.setLocalPosition(item.base);
      entity.setLocalScale(item.radius, item.radius, item.radius);
      app.root.addChild(entity);
      return {
        entity,
        base: item.base.clone(),
        speed: 0.28 + index * 0.045,
        radius: item.radius,
      };
    });

    const routePairs = [
      [0, 3],
      [1, 3],
      [2, 3],
      [3, 4],
      [3, 5],
      [3, 6],
      [3, 7],
      [4, 6],
      [5, 7],
    ];

    const routes = routePairs.map(([from, to]) => createBoxRoute(app, positions[from].base, positions[to].base, routeMaterial));

    const onPointerMove = (event: PointerEvent) => {
      pointerX = (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      pointerY = (event.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    };

    const onResize = () => {
      app.resizeCanvas();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    let elapsed = 0;
    app.on('update', (dt) => {
      elapsed += dt;
      const motionScale = reducedMotion ? 0.18 : 1;

      nodes.forEach((node, index) => {
        const wobble = Math.sin(elapsed * node.speed + index) * 0.12 * motionScale;
        node.entity.setLocalPosition(
          node.base.x + pointerX * 0.12 * (index % 3),
          node.base.y - pointerY * 0.1 * ((index + 1) % 3) + wobble,
          Math.sin(elapsed * 0.55 + index) * 0.16 * motionScale,
        );
        node.entity.setLocalScale(
          node.radius + Math.sin(elapsed * 1.2 + index) * 0.012 * motionScale,
          node.radius + Math.cos(elapsed * 1.1 + index) * 0.012 * motionScale,
          node.radius,
        );
      });

      routes.forEach((route, index) => {
        const pulse = 1 + Math.sin(elapsed * 1.8 + index * 0.7) * 0.18 * motionScale;
        const scale = route.getLocalScale();
        route.setLocalScale(scale.x, 0.018 * pulse, 0.018 * pulse);
      });

      camera.setEulerAngles(pointerY * 1.4, -pointerX * 1.8, 0);
    });

    app.start();

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      app.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[1] h-full w-full opacity-70 mix-blend-screen"
      aria-hidden="true"
    />
  );
}
