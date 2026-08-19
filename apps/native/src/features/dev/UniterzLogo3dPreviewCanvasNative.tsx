/**
 * Web `UniterzLogo3dPreviewPage` の Canvas 相当 — Blender 平面ワードマーク。
 * 回転なし。実ビューポートで AABB にカメラを合わせ、1〜2 フレームだけ描く。
 */
import { advance, Canvas, useThree } from "@react-three/fiber/native";
import { memo, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { requireNativeModule } from "expo-modules-core";
import * as THREE from "three";
import {
  ensureLogoFlat3dGltfParsed,
  getCachedLogoFlat3dGltfScene,
  type LogoFlat3dModelId,
} from "./logoFlat3dGlbCache";

const BG = "#03070b";
/** 厚みが見える程度の yaw。大きいと横に見切れる */
const YAW = 0.16;
const FIT_MARGIN = 1.38;
const FOV = 28;

function asMesh(obj: THREE.Object3D): THREE.Mesh | null {
  const mesh = obj as THREE.Mesh;
  if (!mesh.isMesh || !mesh.geometry) return null;
  return mesh;
}

const PREVIEW_MAT = () =>
  new THREE.MeshLambertMaterial({
    color: "#d8e2ea",
    emissive: "#152028",
    emissiveIntensity: 0.22,
    side: THREE.DoubleSide,
  });

function worldBox(root: THREE.Object3D): THREE.Box3 | null {
  try {
    root.updateMatrixWorld(true);
    const acc = new THREE.Box3();
    const tmp = new THREE.Box3();
    let has = false;
    root.traverse((obj) => {
      const mesh = asMesh(obj);
      if (!mesh) return;
      const geom = mesh.geometry;
      if (!geom.getAttribute("position")) return;
      if (!geom.boundingBox) {
        try {
          geom.computeBoundingBox();
        } catch {
          return;
        }
      }
      const bb = geom.boundingBox;
      if (!bb || bb.isEmpty()) return;
      tmp.copy(bb).applyMatrix4(mesh.matrixWorld);
      if (!has) {
        acc.copy(tmp);
        has = true;
      } else {
        acc.union(tmp);
      }
    });
    return has && !acc.isEmpty() ? acc : null;
  } catch {
    return null;
  }
}

function paintOnce() {
  advance(performance.now() / 1000);
}

/** 文字分け GLB は元の字間のままなので、隙間を空けてバラバラに見せる */
function explodeLetters(root: THREE.Object3D) {
  const meshes: THREE.Mesh[] = [];
  root.traverse((obj) => {
    const mesh = asMesh(obj);
    if (mesh && mesh.name.startsWith("letter-")) meshes.push(mesh);
  });
  if (meshes.length < 2) return;

  root.updateMatrixWorld(true);
  const tmp = new THREE.Box3();
  const items = meshes.map((mesh) => {
    tmp.setFromObject(mesh);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    tmp.getCenter(center);
    tmp.getSize(size);
    return { mesh, center, size };
  });
  items.sort((a, b) => a.center.x - b.center.x);

  const avgW = items.reduce((sum, it) => sum + it.size.x, 0) / items.length;
  const extra = avgW * 0.72;
  let cursor = 0;
  items.forEach((it, i) => {
    const targetX = cursor + it.size.x / 2;
    const sign = i % 2 === 0 ? 1 : -1;
    it.mesh.position.x += targetX - it.center.x;
    it.mesh.position.y += sign * it.size.y * 1.35;
    it.mesh.rotation.z = sign * 0.18;
    cursor = targetX + it.size.x / 2 + extra;
  });
}

function isExpoGLNativeLinked(): boolean {
  try {
    requireNativeModule("ExponentGLObjectManager");
    return true;
  } catch {
    return false;
  }
}

function LogoModel({ modelId }: { modelId: LogoFlat3dModelId }) {
  const wrapRef = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera);
  const viewW = useThree((s) => s.size.width);
  const viewH = useThree((s) => s.size.height);
  const [gltfRoot, setGltfRoot] = useState<THREE.Group | null>(() =>
    getCachedLogoFlat3dGltfScene(modelId)
  );

  useEffect(() => {
    let cancelled = false;
    const cached = getCachedLogoFlat3dGltfScene(modelId);
    if (cached) setGltfRoot(cached);
    else setGltfRoot(null);
    void ensureLogoFlat3dGltfParsed(modelId).then((scene) => {
      if (!cancelled && scene) setGltfRoot(scene);
    });
    return () => {
      cancelled = true;
    };
  }, [modelId]);

  const cloned = useMemo(() => {
    if (!gltfRoot) return null;
    const s = gltfRoot.clone(true);
    s.traverse((obj) => {
      const mesh = asMesh(obj);
      if (!mesh) return;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.material = PREVIEW_MAT();
    });
    if (modelId === "letters") explodeLetters(s);
    const oriented = new THREE.Group();
    oriented.rotation.set(Math.PI / 2, 0, 0);
    oriented.add(s);
    return oriented;
  }, [gltfRoot, modelId]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !cloned) return;
    wrap.position.set(0, 0, 0);
    wrap.updateMatrixWorld(true);
    const box = worldBox(wrap);
    if (!box) {
      paintOnce();
      return;
    }
    const center = new THREE.Vector3();
    const dim = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(dim);
    wrap.position.sub(center);

    const persp = camera as THREE.PerspectiveCamera;
    const aspect = Math.max(viewW, 1) / Math.max(viewH, 1);
    persp.aspect = aspect;
    persp.fov = FOV;
    persp.near = 0.05;
    persp.far = 80;
    const half = THREE.MathUtils.degToRad(persp.fov / 2);
    const tan = Math.tan(half);
    const distW = dim.x / (2 * aspect * tan);
    const distH = dim.y / (2 * tan);
    persp.position.set(0, 0, Math.max(distW, distH, 0.4) * FIT_MARGIN);
    persp.up.set(0, 1, 0);
    persp.lookAt(0, 0, 0);
    persp.updateProjectionMatrix();
    paintOnce();
    const t = requestAnimationFrame(() => paintOnce());
    return () => cancelAnimationFrame(t);
  }, [camera, cloned, viewH, viewW]);

  if (!cloned) return null;

  return (
    <group ref={wrapRef} rotation={[0, YAW, 0]}>
      <primitive object={cloned} />
    </group>
  );
}

const CanvasView = memo(function CanvasView({
  modelId,
  width,
  height,
}: {
  modelId: LogoFlat3dModelId;
  width: number;
  height: number;
}) {
  return (
    <View style={{ width, height }} collapsable={false}>
      <Canvas
        style={{ width, height }}
        dpr={1}
        frameloop="never"
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "low-power",
        }}
        camera={{ position: [0, 0, 4], fov: FOV, near: 0.05, far: 80 }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor(BG, 1);
          camera.lookAt(0, 0, 0);
          paintOnce();
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.55} />
          <directionalLight position={[2.8, 3.4, 4.2]} intensity={1.35} color="#f4fbff" />
          <directionalLight position={[-2.4, 0.6, -2.8]} intensity={0.55} color="#00d4ee" />
          <LogoModel modelId={modelId} />
        </Suspense>
      </Canvas>
    </View>
  );
});

export default function UniterzLogo3dPreviewCanvasNative({
  modelId,
  width,
  height,
  onUnavailable,
}: {
  modelId: LogoFlat3dModelId;
  width: number;
  height: number;
  onUnavailable?: () => void;
}) {
  const [available, setAvailable] = useState(() => isExpoGLNativeLinked());

  useEffect(() => {
    if (!isExpoGLNativeLinked()) {
      setAvailable(false);
      onUnavailable?.();
    }
  }, [onUnavailable]);

  if (!available) return null;

  return <CanvasView modelId={modelId} width={width} height={height} />;
}
