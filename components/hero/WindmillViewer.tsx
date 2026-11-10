"use client";

import { useEffect, useRef, useState } from "react";
import { Wind } from "lucide-react";
import type { BufferGeometry, Material, Object3D } from "three";
import { Core } from "./Core";

type Three = typeof import("three");
type ViewStatus = "loading" | "ready" | "error";
type Point = readonly [number, number];
type Disposable = { dispose(): void };

/* ---------- Proportions (scene units; the plinth is ~2.6 wide) ---------- */

const TOWER = { y0: 0.46, y1: 2.55, r0: 1, r1: 0.47 };
const TOWER_SLOPE = (TOWER.r0 - TOWER.r1) / (TOWER.y1 - TOWER.y0);
const TOWER_LEAN = Math.atan(TOWER_SLOPE);
const HUB = { y: 3, z: 0.84, radius: 0.5 };
/** The rotor leans back so the lower blades clear the conical tower. */
const ROTOR_TILT = 0.16;
const BLADE_PITCH = 0.14;

/** What the camera must keep in frame: the full blade sweep plus the plinth. */
const FRAME = { centerY: 2.5, halfWidth: 2.25, halfHeight: 2.72, depth: 1.5 };
const CAMERA_ELEVATION = 0.15;
const REST_YAW = -0.26;

/* ---------- Motion ---------- */

const IDLE_SPEED = 1; // rad/s, about 10 rpm
const MAX_BOOST = 10;
const GUST_BOOST = 6.5;
const RAD_PER_SEC_TO_RPM = 60 / (Math.PI * 2);

const towerRadiusAt = (y: number) => TOWER.r0 - (y - TOWER.y0) * TOWER_SLOPE;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** A closed polygon whose corners are softened with quadratic curves. */
function roundedPolygon(THREE: Three, points: readonly Point[], radius: number) {
  const shape = new THREE.Shape();
  const count = points.length;
  for (let index = 0; index < count; index += 1) {
    const [px, py] = points[(index + count - 1) % count];
    const [cx, cy] = points[index];
    const [nx, ny] = points[(index + 1) % count];
    const toPrev = Math.hypot(px - cx, py - cy);
    const toNext = Math.hypot(nx - cx, ny - cy);
    const cut = Math.min(radius, toPrev / 2, toNext / 2);
    const ax = cx + ((px - cx) / toPrev) * cut;
    const ay = cy + ((py - cy) / toPrev) * cut;
    const bx = cx + ((nx - cx) / toNext) * cut;
    const by = cy + ((ny - cy) / toNext) * cut;
    if (index === 0) shape.moveTo(ax, ay);
    else shape.lineTo(ax, ay);
    shape.quadraticCurveTo(cx, cy, bx, by);
  }
  shape.closePath();
  return shape;
}

/** A doorway: flat sill, straight jambs, semicircular head. Origin at the sill centre. */
function archShape(THREE: Three, width: number, height: number, corner: number) {
  const half = width / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-half + corner, 0);
  shape.lineTo(half - corner, 0);
  shape.quadraticCurveTo(half, 0, half, corner);
  shape.lineTo(half, height - half);
  shape.absarc(0, height - half, half, 0, Math.PI, false);
  shape.lineTo(-half, corner);
  shape.quadraticCurveTo(-half, 0, -half + corner, 0);
  return shape;
}

/** Lathe profile for a puck with rounded rims. */
function discProfile(THREE: Three, radius: number, y0: number, y1: number, corner: number) {
  const points = [new THREE.Vector2(0, y0)];
  const steps = 6;
  for (let step = 0; step <= steps; step += 1) {
    const angle = -Math.PI / 2 + (step / steps) * (Math.PI / 2);
    points.push(new THREE.Vector2(radius - corner + Math.cos(angle) * corner, y0 + corner + Math.sin(angle) * corner));
  }
  for (let step = 0; step <= steps; step += 1) {
    const angle = (step / steps) * (Math.PI / 2);
    points.push(new THREE.Vector2(radius - corner + Math.cos(angle) * corner, y1 - corner + Math.sin(angle) * corner));
  }
  points.push(new THREE.Vector2(0, y1));
  return points;
}

function buildWindmill(THREE: Three) {
  const disposables: Disposable[] = [];
  const track = <T extends Disposable>(item: T) => {
    disposables.push(item);
    return item;
  };

  const white = track(
    new THREE.MeshPhysicalMaterial({ color: 0xf3f5f9, roughness: 0.46, clearcoat: 0.55, clearcoatRoughness: 0.4 }),
  );
  const lime = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xd3ec3a,
      roughness: 0.34,
      clearcoat: 0.7,
      clearcoatRoughness: 0.3,
      emissive: 0x9db800,
      emissiveIntensity: 0.22,
    }),
  );
  const recess = track(new THREE.MeshStandardMaterial({ color: 0x252c0c, roughness: 0.7 }));
  const glow = track(new THREE.MeshBasicMaterial({ color: 0xeaff6a, toneMapped: false }));

  const solid = (geometry: BufferGeometry, material: Material, parent: Object3D) => {
    const mesh = new THREE.Mesh(track(geometry), material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  const root = new THREE.Group();

  /* Plinth: two pucks with a lit seam between them, then a step for the tower. */
  solid(new THREE.LatheGeometry(discProfile(THREE, 1.32, 0, 0.16, 0.06), 72), white, root);
  const seam = solid(new THREE.CylinderGeometry(1.285, 1.285, 0.05, 72), glow, root);
  seam.position.y = 0.185;
  seam.castShadow = false;
  solid(new THREE.LatheGeometry(discProfile(THREE, 1.32, 0.21, 0.38, 0.06), 72), white, root);
  solid(new THREE.LatheGeometry(discProfile(THREE, 1.12, 0.38, TOWER.y0, 0.035), 72), white, root);

  /* Tower, collar and cap. */
  solid(
    new THREE.LatheGeometry([new THREE.Vector2(TOWER.r0, TOWER.y0), new THREE.Vector2(TOWER.r1, TOWER.y1)], 72),
    white,
    root,
  );
  solid(new THREE.LatheGeometry(discProfile(THREE, TOWER.r1 + 0.04, TOWER.y1 - 0.05, TOWER.y1 + 0.05, 0.03), 56), lime, root);
  const cap = solid(new THREE.SphereGeometry(TOWER.r1 + 0.01, 48, 24), lime, root);
  cap.position.y = TOWER.y1;
  cap.scale.y = 0.9;

  /* Door and window sit flush on the cone: tilt each panel back by the tower's lean. */
  const panelOnTower = (y: number) => {
    const panel = new THREE.Group();
    panel.position.set(0, y, towerRadiusAt(y) + 0.012);
    panel.rotation.x = -TOWER_LEAN;
    root.add(panel);
    return panel;
  };
  const plate = (shape: import("three").Shape, depth: number, front: number, material: Material, parent: Object3D) => {
    const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 20 });
    geometry.translate(0, 0, front - depth);
    const mesh = solid(geometry, material, parent);
    mesh.castShadow = false;
    return mesh;
  };

  const door = panelOnTower(TOWER.y0);
  plate(archShape(THREE, 0.44, 0.66, 0.02), 0.1, 0, recess, door);
  plate(
    roundedPolygon(THREE, [[-0.03, 0.13], [0.03, 0.13], [0.03, 0.47], [-0.03, 0.47]], 0.03),
    0.02,
    0.006,
    glow,
    door,
  );

  const windowPanel = panelOnTower(1.52);
  plate(archShape(THREE, 0.27, 0.38, 0.05), 0.08, 0, recess, windowPanel);
  const pane = plate(archShape(THREE, 0.17, 0.27, 0.035), 0.02, 0.006, glow, windowPanel);
  pane.position.y = 0.055;

  /* The lit openings spill a little lime onto the tower and plinth. */
  const doorLight = new THREE.PointLight(0xd8f04a, 0.5, 2.2, 2);
  doorLight.position.set(0, 0.74, 1.3);
  const windowLight = new THREE.PointLight(0xd8f04a, 0.22, 1.4, 2);
  windowLight.position.set(0, 1.72, 0.98);
  root.add(doorLight, windowLight);

  /* Rotor: axle into the cap, hub ball, four pitched paddles. */
  const rotor = new THREE.Group();
  rotor.position.set(0, HUB.y, HUB.z);
  rotor.rotation.x = -ROTOR_TILT;
  root.add(rotor);

  const axleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.9, 28);
  axleGeometry.rotateX(Math.PI / 2);
  axleGeometry.translate(0, 0, -0.45);
  solid(axleGeometry, lime, rotor);

  const spinner = new THREE.Group();
  rotor.add(spinner);
  solid(new THREE.SphereGeometry(HUB.radius, 56, 36), lime, spinner);

  // The paddle flares toward its leading (+x) edge, where the lime inlay runs.
  const bladeGeometry = track(
    new THREE.ExtrudeGeometry(
      roundedPolygon(THREE, [[-0.12, 0.3], [0.17, 0.3], [0.45, 1.98], [-0.31, 1.98]], 0.15),
      { depth: 0.06, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 5, curveSegments: 10 },
    ),
  );
  bladeGeometry.translate(0, 0, -0.03);
  const inlayGeometry = track(
    new THREE.ExtrudeGeometry(
      roundedPolygon(THREE, [[0.105, 0.62], [0.17, 0.62], [0.4, 1.86], [0.2, 1.86]], 0.035),
      { depth: 0.014, bevelEnabled: false, curveSegments: 8 },
    ),
  );
  inlayGeometry.translate(0, 0, 0.072);

  for (let index = 0; index < 4; index += 1) {
    const arm = new THREE.Group();
    arm.rotation.z = Math.PI / 4 + (index * Math.PI) / 2;
    const blade = new THREE.Mesh(bladeGeometry, white);
    blade.castShadow = true;
    blade.receiveShadow = true;
    blade.rotation.y = BLADE_PITCH;
    blade.position.z = -0.04;
    const inlay = new THREE.Mesh(inlayGeometry, lime);
    inlay.receiveShadow = true;
    blade.add(inlay);
    arm.add(blade);
    spinner.add(arm);
  }

  return {
    root,
    spinner,
    glow,
    doorLight,
    windowLight,
    dispose: () => disposables.forEach((item) => item.dispose()),
  };
}

export function WindmillViewer() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const gustRef = useRef<() => void>(() => undefined);
  const [status, setStatus] = useState<ViewStatus>("loading");

  useEffect(() => {
    const stageElement = stageRef.current;
    const canvasElement = canvasRef.current;
    if (stageElement === null || canvasElement === null) return;
    const stage: HTMLDivElement = stageElement;
    const canvas: HTMLCanvasElement = canvasElement;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let frameId = 0;
    let teardown: (() => void) | undefined;

    async function initialize() {
      try {
        const [THREE, { RoomEnvironment }] = await Promise.all([
          import("three"),
          import("three/addons/environments/RoomEnvironment.js"),
        ]);
        if (disposed) return;

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.NeutralToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.setClearColor(0x000000, 0);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 80);

        // A soft studio environment gives the clearcoat something to reflect.
        const pmrem = new THREE.PMREMGenerator(renderer);
        const room = new RoomEnvironment();
        const environment = pmrem.fromScene(room, 0.04);
        scene.environment = environment.texture;
        scene.environmentIntensity = 0.55;

        scene.add(new THREE.HemisphereLight(0xffffff, 0x4f8fe8, 0.55));

        const keyLight = new THREE.DirectionalLight(0xffffff, 2.3);
        keyLight.position.set(-4.5, 9, 6.5);
        keyLight.target.position.set(0, 2, 0);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(2048, 2048);
        keyLight.shadow.camera.left = -5;
        keyLight.shadow.camera.right = 5;
        keyLight.shadow.camera.top = 5;
        keyLight.shadow.camera.bottom = -5;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 30;
        keyLight.shadow.bias = -0.0004;
        keyLight.shadow.normalBias = 0.03;
        keyLight.shadow.radius = 3;
        scene.add(keyLight, keyLight.target);

        // The blue card bounces back onto the shaded side.
        const fillLight = new THREE.DirectionalLight(0x9cc3ff, 0.8);
        fillLight.position.set(5, 2.5, 3);
        scene.add(fillLight);

        const windmill = buildWindmill(THREE);
        windmill.root.rotation.y = REST_YAW;
        windmill.spinner.rotation.z = -0.2;
        scene.add(windmill.root);

        // Invisible floor that only shows the shadows falling on it.
        const floorGeometry = new THREE.PlaneGeometry(14, 14);
        const floorMaterial = new THREE.ShadowMaterial({ color: 0x0b2a66, opacity: 0.2 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);

        const glowBase = windmill.glow.color.clone();

        const resize = () => {
          const width = Math.max(1, canvas.clientWidth);
          const height = Math.max(1, canvas.clientHeight);
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();

          const verticalHalfFov = THREE.MathUtils.degToRad(camera.fov / 2);
          const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * camera.aspect);
          const distance =
            FRAME.depth +
            Math.max(FRAME.halfHeight / Math.tan(verticalHalfFov), FRAME.halfWidth / Math.tan(horizontalHalfFov)) * 1.04;
          camera.position.set(
            0,
            FRAME.centerY + Math.sin(CAMERA_ELEVATION) * distance,
            Math.cos(CAMERA_ELEVATION) * distance,
          );
          camera.lookAt(0, FRAME.centerY, 0);
          if (reduceMotion) renderer.render(scene, camera);
        };

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(canvas);
        resize();

        let speed = IDLE_SPEED;
        let boost = 0;
        let lookX = 0;
        let lookY = 0;
        let lookTargetX = 0;
        let lookTargetY = 0;
        let elapsed = 0;
        let last = 0;
        let lastReadoutAt = 0;
        let visible = true;
        let lastPointer: { x: number; y: number; at: number } | null = null;

        const tick = (now: number) => {
          frameId = 0;
          if (disposed || !visible) return;
          const delta = Math.min((now - last) / 1000, 0.05);
          last = now;
          elapsed += delta;

          // Wind fades on its own; the rotor has inertia chasing it.
          boost *= Math.exp(-delta * 0.55);
          speed += (IDLE_SPEED + boost - speed) * (1 - Math.exp(-delta * 2.5));
          windmill.spinner.rotation.z -= speed * delta;

          const ease = 1 - Math.exp(-delta * 3.2);
          lookX += (lookTargetX - lookX) * ease;
          lookY += (lookTargetY - lookY) * ease;
          windmill.root.rotation.y = REST_YAW + lookX * 0.3 + Math.sin(elapsed * 0.5) * 0.05;
          windmill.root.rotation.x = lookY * 0.05;

          // More wind, more light: the mill powers its own windows.
          const power = clamp((speed - IDLE_SPEED) / 6, 0, 1);
          windmill.glow.color.copy(glowBase).multiplyScalar(0.86 + power * 0.3);
          windmill.doorLight.intensity = 0.5 + power * 0.9;
          windmill.windowLight.intensity = 0.22 + power * 0.4;

          if (now - lastReadoutAt > 220 && readoutRef.current) {
            lastReadoutAt = now;
            readoutRef.current.textContent = String(Math.round(speed * RAD_PER_SEC_TO_RPM)).padStart(2, "0");
          }

          renderer.render(scene, camera);
          frameId = window.requestAnimationFrame(tick);
        };

        const start = () => {
          if (frameId !== 0 || disposed || reduceMotion) return;
          last = performance.now();
          frameId = window.requestAnimationFrame(tick);
        };

        const onPointerMove = (event: PointerEvent) => {
          const bounds = stage.getBoundingClientRect();
          if (bounds.width === 0 || bounds.height === 0) return;
          const x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
          const y = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;
          if (event.pointerType === "mouse") {
            lookTargetX = clamp(x / 2.4, -1, 1);
            lookTargetY = clamp(y / 2.4, -1, 1);
          }

          // Movement across the stage is wind; the faster the sweep, the harder it blows.
          const now = performance.now();
          const inside = Math.abs(x) <= 1 && Math.abs(y) <= 1.15;
          if (inside && lastPointer && now - lastPointer.at < 120) {
            const travelled = Math.hypot(event.clientX - lastPointer.x, event.clientY - lastPointer.y);
            boost = Math.min(MAX_BOOST, boost + travelled * 0.012);
          }
          lastPointer = inside ? { x: event.clientX, y: event.clientY, at: now } : null;
        };

        const onPointerGone = () => {
          lookTargetX = 0;
          lookTargetY = 0;
          lastPointer = null;
        };

        const gust = () => {
          boost = Math.min(MAX_BOOST, boost + GUST_BOOST);
        };
        gustRef.current = gust;

        const intersectionObserver = new IntersectionObserver(
          ([entry]) => {
            visible = entry.isIntersecting;
            if (visible) start();
          },
          { threshold: 0 },
        );
        intersectionObserver.observe(stage);

        if (!reduceMotion) {
          window.addEventListener("pointermove", onPointerMove, { passive: true });
          document.documentElement.addEventListener("pointerleave", onPointerGone);
          canvas.addEventListener("click", gust);
        } else if (readoutRef.current) {
          readoutRef.current.textContent = "00";
        }

        renderer.render(scene, camera);
        start();
        setStatus("ready");

        teardown = () => {
          window.removeEventListener("pointermove", onPointerMove);
          document.documentElement.removeEventListener("pointerleave", onPointerGone);
          canvas.removeEventListener("click", gust);
          resizeObserver.disconnect();
          intersectionObserver.disconnect();
          windmill.dispose();
          floorGeometry.dispose();
          floorMaterial.dispose();
          environment.dispose();
          room.dispose();
          pmrem.dispose();
          renderer.dispose();
        };
        if (disposed) teardown();
      } catch (error) {
        if (!disposed) {
          console.error("Unable to start the hero windmill.", error);
          setStatus("error");
        }
      }
    }

    void initialize();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      gustRef.current = () => undefined;
      teardown?.();
    };
  }, []);

  return (
    <>
      <div className="windmill-stage" ref={stageRef} data-status={status}>
        <canvas
          ref={canvasRef}
          className="windmill-canvas"
          role="img"
          aria-label="A small white and lime windmill, turning in the breeze"
        />
        {status === "error" ? <Core state="idle" /> : null}
      </div>

      <div className="windmill-controls">
        <span className="windmill-readout">
          Rotor ·{" "}
          <span className="windmill-rpm" ref={readoutRef}>
            10
          </span>{" "}
          rpm
        </span>
        <button
          className="windmill-gust"
          type="button"
          onClick={() => gustRef.current()}
          disabled={status !== "ready"}
        >
          <Wind size={14} aria-hidden="true" />
          Send a gust
        </button>
      </div>
    </>
  );
}
