"use client";

/**
 * /mobile/uniterz-logo-3d · /dev/uniterz-logo-3d
 * 確定版 U マーク / ワードマークを押し出した GLB の確認用。
 */
import { Center, ContactShadows, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo, useState } from "react";
import * as THREE from "three";
import { nameOxanium, nameRajdhani } from "@/lib/fonts";
import { UNITERZ_LOGO_ASSET } from "@/lib/units/uniterzLogoAsset";
import { UNITERZ_LOGO_FLAT_ASSET } from "@/lib/units/uniterzLogoFlat";
import { UNITERZ_U_MARK_ASSET } from "@/lib/units/uniterzUMark";

const ACCENT = "#00E8FF";

const THEME = {
  baseColor: "#07090d",
  emissiveColor: "#1c2430",
  edgeGlowColor: ACCENT,
  emissiveIntensity: 0.16,
  metalness: 1,
  roughness: 0.16,
  clearcoat: 0.9,
  clearcoatRoughness: 0.1,
};

type ModelId = "blender" | "letters" | "u-mark" | "wordmark";

const MODELS: Record<
  ModelId,
  { url: string; label: string; scale: number; cameraZ: number; file: string }
> = {
  blender: {
    url: UNITERZ_LOGO_FLAT_ASSET.webGlb3dPath,
    label: "結合",
    scale: 1.05,
    cameraZ: 3.35,
    file: "public/brand/uniterz-logo-flat-3d.glb",
  },
  letters: {
    url: UNITERZ_LOGO_FLAT_ASSET.webGlbLettersPath,
    label: "文字分け",
    scale: 0.78,
    cameraZ: 4.4,
    file: "public/brand/uniterz-logo-flat-3d-letters.glb",
  },
  "u-mark": {
    url: UNITERZ_U_MARK_ASSET.webGlbPath,
    label: "U mark",
    scale: 1.35,
    cameraZ: 2.35,
    file: "public/brand/uniterz-u-mark.glb",
  },
  wordmark: {
    url: UNITERZ_LOGO_ASSET.webGlb3dPath,
    label: "Auto",
    scale: 1.2,
    cameraZ: 2.8,
    file: "public/brand/uniterz-logo-3d.glb",
  },
};

function explodeLetters(root: THREE.Object3D) {
  const meshes: THREE.Mesh[] = [];
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    if (obj.name.startsWith("letter-")) meshes.push(obj);
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

function LogoGlb({ url, scale, explode }: { url: string; scale: number; explode?: boolean }) {
  const { scene } = useGLTF(url);

  const cloned = useMemo(() => {
    const s = scene.clone(true);
    s.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow = true;
      obj.receiveShadow = false;
      obj.material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(THEME.baseColor),
        emissive: new THREE.Color(THEME.emissiveColor),
        emissiveIntensity: THEME.emissiveIntensity,
        metalness: THEME.metalness,
        roughness: THEME.roughness,
        clearcoat: THEME.clearcoat,
        clearcoatRoughness: THEME.clearcoatRoughness,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
    });
    if (explode) explodeLetters(s);
    return s;
  }, [explode, scene]);

  return (
    <group scale={scale} rotation={[0, 0.26, 0]}>
      <Center>
        <primitive object={cloned} />
      </Center>
    </group>
  );
}

export default function UniterzLogo3dPreviewPage() {
  const [model, setModel] = useState<ModelId>("blender");
  const meta = MODELS[model];

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#03070b] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-8">
        <div className="mx-auto w-full max-w-[480px]">
          <p
            className={[
              nameOxanium.className,
              "text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/70",
            ].join(" ")}
          >
            Logo 3D
          </p>
          <h1
            className={[
              nameRajdhani.className,
              "mt-1 text-2xl font-bold text-white",
            ].join(" ")}
          >
            確定版ロゴの立体
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/45">
            Blender 書き出しと自動押し出しを見比べられます。斜めから静止表示します。
          </p>
        </div>
      </div>

      <div className="absolute inset-0">
        <Canvas
          key={model}
          dpr={[1.5, 2]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          camera={{ position: [0, 0.22, meta.cameraZ], fov: 34 }}
        >
          <color attach="background" args={["#03070b"]} />
          <ambientLight intensity={0.12} />
          <directionalLight
            position={[4, 6, 8]}
            intensity={1.15}
            color="#dcfffd"
          />
          <pointLight
            position={[-4, 4, 7]}
            intensity={9}
            color="#85b6de"
            distance={24}
          />
          <pointLight
            position={[4, -1, 7]}
            intensity={7.2}
            color="#6f92b4"
            distance={22}
          />
          <pointLight
            position={[0, 2, -8]}
            intensity={1.1}
            color="#00E8FF"
            distance={18}
          />
          <LogoGlb
            key={meta.url}
            url={meta.url}
            scale={meta.scale}
            explode={model === "letters"}
          />
          <ContactShadows
            position={[0, -0.72, 0]}
            opacity={0.42}
            scale={6}
            blur={2.6}
            far={1.4}
          />
        </Canvas>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-4 pb-8">
        <div className="pointer-events-auto mx-auto flex w-full max-w-[480px] gap-2">
          {(Object.keys(MODELS) as ModelId[]).map((id) => {
            const on = id === model;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setModel(id)}
                className={[
                  nameOxanium.className,
                  "flex-1 border px-3 py-3 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors",
                  on
                    ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-100"
                    : "border-white/10 bg-black/55 text-white/50",
                ].join(" ")}
              >
                {MODELS[id].label}
              </button>
            );
          })}
        </div>
        <p
          className={[
            nameOxanium.className,
            "mx-auto mt-3 max-w-[480px] text-center text-[10px] font-bold uppercase tracking-[0.16em] text-white/28",
          ].join(" ")}
        >
          {meta.file}
        </p>
      </div>
    </main>
  );
}

useGLTF.preload(UNITERZ_LOGO_FLAT_ASSET.webGlb3dPath);
useGLTF.preload(UNITERZ_LOGO_FLAT_ASSET.webGlbLettersPath);
useGLTF.preload(UNITERZ_U_MARK_ASSET.webGlbPath);
useGLTF.preload(UNITERZ_LOGO_ASSET.webGlb3dPath);
