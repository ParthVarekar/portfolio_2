"use client";

import { useEffect, useRef, useState } from "react";
import type { BufferGeometry, Mesh, Vector3 } from "three";

type ViewStatus = "loading" | "ready" | "error";

type FurUniforms = {
  uFurTime: { value: number };
  uFurStrength: { value: number };
  uFurRadius: { value: number };
  uFurPointerLocal: { value: Vector3 };
  uFurDirectionLocal: { value: Vector3 };
  uFurRightLocal: { value: Vector3 };
  uFurUpLocal: { value: Vector3 };
  uFurViewLocal: { value: Vector3 };
};

type FurDriver = {
  mesh: Mesh;
  uniforms: FurUniforms;
};

const REST_LID_ANGLE_DEGREES = 22;

export function ClamshellViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toggleRef = useRef<() => void>(() => undefined);
  const openRef = useRef(false);
  const [status, setStatus] = useState<ViewStatus>("loading");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (canvasElement === null) return;
    const canvas: HTMLCanvasElement = canvasElement;

    let disposed = false;
    let animationFrame = 0;
    let renderer: import("three").WebGLRenderer | null = null;
    let mixer: import("three").AnimationMixer | null = null;
    let action: import("three").AnimationAction | null = null;
    let draco: import("three/addons/loaders/DRACOLoader.js").DRACOLoader | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let removePointerHandlers: (() => void) | undefined;
    let restLidTime = 0;
    const furDrivers: FurDriver[] = [];
    const furMaterials: import("three").Material[] = [];
    const furGeometries: BufferGeometry[] = [];

    let model: import("three").Group | null = null;
    let breezeTarget = 0;
    let breezeStrength = 0;
    let breezeTime = 0;
    let lastGustAt = 0;
    let lastPointerAt = 0;
    let lastPointerWorld: Vector3 | null = null;
    let breezePointerWorld: Vector3 | null = null;
    let breezeDirectionWorld: Vector3 | null = null;
    let viewRightWorld: Vector3 | null = null;
    let viewUpWorld: Vector3 | null = null;
    let viewTowardViewerWorld: Vector3 | null = null;

    const setOpen = (nextOpen: boolean) => {
      if (!action) return;

      openRef.current = nextOpen;
      setIsOpen(nextOpen);
      action.enabled = true;
      action.timeScale = nextOpen ? 1 : -1;
      action.paused = false;
      action.play();
    };

    toggleRef.current = () => setOpen(!openRef.current);

    async function initialize() {
      try {
        const [THREE, { GLTFLoader }, { DRACOLoader }] = await Promise.all([
          import("three"),
          import("three/addons/loaders/GLTFLoader.js"),
          import("three/addons/loaders/DRACOLoader.js"),
        ]);
        if (disposed) return;

        const scene = new THREE.Scene();
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.12;
        renderer.setClearColor(0x000000, 0);

        const camera = new THREE.PerspectiveCamera(36, 1, 0.05, 100);
        scene.add(new THREE.HemisphereLight(0xe5fbff, 0x12383b, 2.1));

        const keyLight = new THREE.DirectionalLight(0xf5fbff, 3.4);
        keyLight.position.set(-4, 8, 6);
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0x69e9e7, 1.7);
        fillLight.position.set(6, 3, -5);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0xdfff75, 2.1);
        rimLight.position.set(2, 5, -7);
        scene.add(rimLight);

        draco = new DRACOLoader();
        draco.setDecoderPath("/draco/gltf/");
        const loader = new GLTFLoader();
        loader.setDRACOLoader(draco);

        const gltf = await loader.loadAsync("/models/fuzzy-clamshell.glb");
        if (disposed) {
          gltf.scene.traverse((object) => {
            const mesh = object as import("three").Mesh;
            mesh.geometry?.dispose();
            if (Array.isArray(mesh.material)) mesh.material.forEach((material) => material.dispose());
            else mesh.material?.dispose();
          });
          return;
        }

        model = gltf.scene;
        scene.add(model);

        const computerRoot = model.getObjectByName("Computer_Import_Root");
        if (computerRoot) computerRoot.position.y += 0.28;

        if (!gltf.animations.length) {
          throw new Error("The model does not contain its lid animation.");
        }

        const clip = gltf.animations[0];
        const hingeTrack = clip.tracks.find((track) =>
          track.name.includes("Hinge_Upper_Pivot") && track.getValueSize() === 4,
        );
        if (hingeTrack) {
          const targetAngle = THREE.MathUtils.degToRad(REST_LID_ANGLE_DEGREES);
          let closestDifference = Number.POSITIVE_INFINITY;
          for (let index = 0; index < hingeTrack.times.length; index += 1) {
            const offset = index * 4;
            const x = hingeTrack.values[offset];
            const y = hingeTrack.values[offset + 1];
            const z = hingeTrack.values[offset + 2];
            const w = hingeTrack.values[offset + 3];
            const angle = 2 * Math.atan2(Math.hypot(x, y, z), Math.abs(w));
            const difference = Math.abs(angle - targetAngle);
            if (difference < closestDifference) {
              closestDifference = difference;
              restLidTime = hingeTrack.times[index];
            }
          }
        } else {
          restLidTime = clip.duration * 0.3;
        }

        mixer = new THREE.AnimationMixer(model);
        action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        action.play();
        action.paused = true;
        action.time = restLidTime;
        mixer.update(0);

        // Frame the initial 22-degree viewing pose and the full open pose.
        const initialBounds = new THREE.Box3().setFromObject(model);
        action.time = clip.duration;
        mixer.update(0);
        const fullBounds = initialBounds.union(new THREE.Box3().setFromObject(model));
        action.time = restLidTime;
        mixer.update(0);

        const center = fullBounds.getCenter(new THREE.Vector3());
        const size = fullBounds.getSize(new THREE.Vector3());

        // Add a tip-weight attribute and a lightweight vertex-shader gust field
        // only to the fur meshes, leaving the shell and computer rigid.
        model.traverse((object) => {
          const mesh = object as Mesh;
          if (!mesh.isMesh || !mesh.name.includes("Fur_Tufts_")) return;

          const geometry = mesh.geometry.clone();
          const positions = geometry.getAttribute("position");
          const tipWeights = new Float32Array(positions.count);
          for (let index = 0; index < positions.count; index += 1) {
            const radius = Math.hypot(
              positions.getX(index),
              positions.getY(index),
              positions.getZ(index),
            );
            const ramp = THREE.MathUtils.clamp((radius - 1.4) / 0.38, 0, 1);
            tipWeights[index] = ramp * ramp * (3 - 2 * ramp);
          }
          geometry.setAttribute("aFurTipWeight", new THREE.BufferAttribute(tipWeights, 1));
          mesh.geometry = geometry;
          furGeometries.push(geometry);

          const uniforms: FurUniforms = {
            uFurTime: { value: 0 },
            uFurStrength: { value: 0 },
            uFurRadius: { value: 1.35 },
            uFurPointerLocal: { value: new THREE.Vector3() },
            uFurDirectionLocal: { value: new THREE.Vector3(1, 0, 0) },
            uFurRightLocal: { value: new THREE.Vector3(1, 0, 0) },
            uFurUpLocal: { value: new THREE.Vector3(0, 1, 0) },
            uFurViewLocal: { value: new THREE.Vector3(0, 0, 1) },
          };

          const originalMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          const materials = originalMaterials.map((originalMaterial) => {
            const material = originalMaterial.clone();
            material.onBeforeCompile = (shader) => {
              Object.assign(shader.uniforms, uniforms);
              shader.vertexShader = shader.vertexShader.replace(
                "#include <common>",
                "#include <common>\nattribute float aFurTipWeight;\nuniform float uFurTime;\nuniform float uFurStrength;\nuniform float uFurRadius;\nuniform vec3 uFurPointerLocal;\nuniform vec3 uFurDirectionLocal;\nuniform vec3 uFurRightLocal;\nuniform vec3 uFurUpLocal;\nuniform vec3 uFurViewLocal;",
              );
              shader.vertexShader = shader.vertexShader.replace(
                "#include <begin_vertex>",
                "#include <begin_vertex>\nvec3 furDelta = transformed - uFurPointerLocal;\nvec3 furSpace = vec3(dot(furDelta, uFurRightLocal), dot(furDelta, uFurUpLocal), dot(furDelta, uFurViewLocal));\nfloat furFalloff = exp(-dot(furSpace, furSpace) / (uFurRadius * uFurRadius));\nfloat furInfluence = furFalloff * uFurStrength * aFurTipWeight;\nfloat furPhase = uFurTime * 7.0 + dot(transformed, uFurDirectionLocal) * 8.0 + transformed.y * 2.2;\nvec3 furBend = uFurDirectionLocal * (0.12 + sin(furPhase) * 0.045) + uFurUpLocal * cos(furPhase * 0.72) * 0.025;\ntransformed += furBend * furInfluence;",
              );
            };
            material.customProgramCacheKey = () => "clamshell-pointer-breeze-v1";
            material.needsUpdate = true;
            furMaterials.push(material);
            return material;
          });
          mesh.material = Array.isArray(mesh.material) ? materials : materials[0];
          furDrivers.push({ mesh, uniforms });
        });

        const resize = () => {
          if (!renderer) return;
          const width = Math.max(1, canvas.clientWidth);
          const height = Math.max(1, canvas.clientHeight);
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();

          const verticalHalfFov = THREE.MathUtils.degToRad(camera.fov / 2);
          const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * camera.aspect);
          const halfDepth = size.z / 2;
          const projectedHalfWidth = size.x / 2;
          const projectedHalfHeight = size.y / 2;
          const distance = halfDepth + Math.max(
            projectedHalfHeight / Math.tan(verticalHalfFov),
            projectedHalfWidth / Math.tan(horizontalHalfFov),
          ) * 1.12;

          // Keep the display directly facing visitors while the lid rests slightly open.
          camera.position.set(center.x, center.y, center.z + distance);
          camera.lookAt(center);
        };

        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(canvas);
        resize();

        viewTowardViewerWorld = camera.position.clone().sub(center).normalize();
        viewRightWorld = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).normalize();
        viewUpWorld = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion).normalize();

        const breezePlanePoint = center.clone().addScaledVector(viewTowardViewerWorld, size.z * 0.36);
        const breezePlane = new THREE.Plane().setFromNormalAndCoplanarPoint(
          camera.getWorldDirection(new THREE.Vector3()),
          breezePlanePoint,
        );
        breezePointerWorld = breezePlanePoint.clone();
        breezeDirectionWorld = viewRightWorld.clone();

        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        let pointerStart: { x: number; y: number } | null = null;

        const setPointerFromEvent = (event: PointerEvent) => {
          const bounds = canvas.getBoundingClientRect();
          pointer.set(
            ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
            -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
          );
          raycaster.setFromCamera(pointer, camera);
          const point = raycaster.ray.intersectPlane(breezePlane, new THREE.Vector3());
          if (!point || !breezePointerWorld || !breezeDirectionWorld || !viewTowardViewerWorld) return;

          const now = performance.now();
          if (lastPointerWorld && lastPointerAt > 0) {
            const elapsed = (now - lastPointerAt) / 1000;
            if (elapsed > 0 && elapsed < 0.24) {
              const movement = point.clone().sub(lastPointerWorld);
              movement.addScaledVector(viewTowardViewerWorld, -movement.dot(viewTowardViewerWorld));
              const speed = movement.length() / elapsed;
              if (speed > 0.08) {
                breezeDirectionWorld.copy(movement.normalize());
                breezeTarget = Math.min(0.82, Math.max(0, (speed - 0.12) / 1.7) * 0.82);
                lastGustAt = now;
              }
            } else {
              breezeTarget = 0;
            }
          }

          breezePointerWorld.copy(point);
          lastPointerWorld = point;
          lastPointerAt = now;
        };

        const onPointerMove = (event: PointerEvent) => setPointerFromEvent(event);
        const onPointerLeave = () => {
          pointerStart = null;
          lastPointerWorld = null;
          lastPointerAt = 0;
          breezeTarget = 0;
        };

        const onPointerDown = (event: PointerEvent) => {
          if (event.button !== 0) return;
          pointerStart = { x: event.clientX, y: event.clientY };
        };

        const onPointerUp = (event: PointerEvent) => {
          if (!pointerStart) return;
          const moved = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
          pointerStart = null;
          if (moved > 6) return;

          const bounds = canvas.getBoundingClientRect();
          pointer.set(
            ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
            -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
          );
          raycaster.setFromCamera(pointer, camera);
          if (raycaster.intersectObject(model!, true).length > 0) toggleRef.current();
        };

        const clearPointer = () => {
          pointerStart = null;
        };

        canvas.addEventListener("pointermove", onPointerMove);
        canvas.addEventListener("pointerleave", onPointerLeave);
        canvas.addEventListener("pointerdown", onPointerDown);
        canvas.addEventListener("pointerup", onPointerUp);
        canvas.addEventListener("pointercancel", clearPointer);
        canvas.style.cursor = "pointer";

        const clock = new THREE.Clock();
        const render = () => {
          if (disposed || !renderer) return;
          animationFrame = window.requestAnimationFrame(render);
          const delta = Math.min(clock.getDelta(), 0.05);
          breezeTime += delta;
          mixer?.update(delta);

          const now = performance.now();
          if (now - lastGustAt > 170) breezeTarget = 0;
          const response = breezeTarget > breezeStrength ? 10 : 4.2;
          breezeStrength += (breezeTarget - breezeStrength) * (1 - Math.exp(-delta * response));

          if (action) {
            if (openRef.current && action.time >= action.getClip().duration) {
              action.time = action.getClip().duration;
              action.paused = true;
              mixer?.update(0);
            } else if (!openRef.current && action.time <= restLidTime) {
              action.time = restLidTime;
              action.paused = true;
              mixer?.update(0);
            }
          }

          model?.updateMatrixWorld(true);
          if (model && breezePointerWorld && breezeDirectionWorld && viewRightWorld && viewUpWorld && viewTowardViewerWorld) {
            for (const driver of furDrivers) {
              const inverseWorld = driver.mesh.matrixWorld.clone().invert();
              driver.uniforms.uFurTime.value = breezeTime;
              driver.uniforms.uFurStrength.value = breezeStrength;
              driver.uniforms.uFurPointerLocal.value = driver.mesh.worldToLocal(breezePointerWorld.clone());
              driver.uniforms.uFurDirectionLocal.value = breezeDirectionWorld.clone().transformDirection(inverseWorld);
              driver.uniforms.uFurRightLocal.value = viewRightWorld.clone().transformDirection(inverseWorld);
              driver.uniforms.uFurUpLocal.value = viewUpWorld.clone().transformDirection(inverseWorld);
              driver.uniforms.uFurViewLocal.value = viewTowardViewerWorld.clone().transformDirection(inverseWorld);
            }
          }

          renderer.render(scene, camera);
        };

        render();
        setStatus("ready");

        return () => {
          canvas.removeEventListener("pointermove", onPointerMove);
          canvas.removeEventListener("pointerleave", onPointerLeave);
          canvas.removeEventListener("pointerdown", onPointerDown);
          canvas.removeEventListener("pointerup", onPointerUp);
          canvas.removeEventListener("pointercancel", clearPointer);
        };
      } catch (error) {
        if (!disposed) {
          console.error("Unable to load the hero clamshell model.", error);
          setStatus("error");
        }
      }
    }

    void initialize().then((cleanup) => {
      if (disposed) cleanup?.();
      else removePointerHandlers = cleanup;
    });

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      removePointerHandlers?.();
      toggleRef.current = () => undefined;
      draco?.dispose();
      mixer?.stopAllAction();
      furMaterials.forEach((material) => material.dispose());
      furGeometries.forEach((geometry) => geometry.dispose());
      renderer?.dispose();
    };
  }, []);

  return (
    <>
      <div className="core-stage">
        <span className="core-orbit" aria-hidden="true" />
        <span className="core-orbit core-orbit--two" aria-hidden="true" />
        <span className="core-orbit-dot core-orbit-dot--one" aria-hidden="true" />
        <span className="core-orbit-dot core-orbit-dot--two" aria-hidden="true" />
        <div className="clamshell-scene">
          <canvas ref={canvasRef} className="clamshell-canvas" aria-label="Interactive fuzzy clamshell computer, front view" />
          {status === "loading" ? <span className="clamshell-loading">Loading the clamshell…</span> : null}
          {status === "error" ? <span className="clamshell-loading" role="status">3D view unavailable</span> : null}
        </div>
      </div>

      <div className="clamshell-controls">
        <span className="clamshell-hint" aria-live="polite">
          {status === "loading"
            ? "Preparing the clamshell"
            : status === "error"
              ? "Refresh to retry the 3D view"
              : isOpen
                ? "Move over the fur for a breeze · click to close"
                : "Move over the fur for a breeze · click to open"}
        </span>
        <button
          className="clamshell-toggle"
          type="button"
          onClick={() => toggleRef.current()}
          disabled={status !== "ready"}
          aria-pressed={isOpen}
        >
          {status === "loading" ? "Loading…" : status === "error" ? "Unavailable" : isOpen ? "Close shell" : "Open shell"}
        </button>
      </div>
    </>
  );
}