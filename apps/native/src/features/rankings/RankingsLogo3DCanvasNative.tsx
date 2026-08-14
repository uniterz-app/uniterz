/**
 * Web `app/component/background/UniterzLogo3DBackground.tsx` の Logo3D + シーンライトを RN 向けに移植。
 *
 * 【回転が止まる主因（expo-gl）】R3F の既定 rAF ループだけでは `update` が進まず `useFrame` がほぼ動かないことがある。
 * そのため `frameloop="never"` とし、`ExpoGlR3fFrameDriver` が毎フレーム `advance()` して `useFrame` を駆動する。
 * 経過時間は `state.clock` ではなく `performance.now()` 差分（Clock が進まない対策）。
 *
 * 【有効化の手順】expo-gl はネイティブモジュールのため、導入後に必ず再ビルドする:
 *   `cd apps/native && npx expo run:ios`（または `run:android`）
 * 未再ビルドだと `Cannot find native module 'ExponentGLObjectManager'` になる。
 * 再ビルド後、`RankingsCyberBackgroundNative.tsx` で本コンポーネントを import して差し替える。
 *
 * GLB は `rankingsLogoGlbCache` で同梱アセットを優先し、失敗時のみ Next 相当 URL（`EXPO_PUBLIC_...` + `/logo/...`）を fetch。
 * RN では `useLoader(GLTFLoader, url)` が URL 解決で落ちるため、`fetch` + `GLTFLoader.parse` を使う。
 * postprocessing（Bloom）はネイティブでは入れず、発光はマテリアル側で再現。
 */
import { advance, Canvas, useFrame } from "@react-three/fiber/native";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import { loadRankingsLogoGlbBuffer, getCachedRankingsLogoGltfScene, ensureRankingsLogoGltfParsed } from "./rankingsLogoGlbCache";

/**
 * three.js GLTFParser が `navigator.userAgent.match(...)` を前提にしている一方、
 * RN では `navigator` はあっても `userAgent` が undefined のことがあり、
 * GLB パース直後に `Cannot read property 'match' of undefined` になる。
 */
function ensureNavigatorUserAgentForThreeGltf() {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.userAgent === "string") return;
  try {
    Object.defineProperty(navigator, "userAgent", {
      value: "",
      configurable: true,
      enumerable: true,
      writable: true,
    });
  } catch {
    /* 読み取り専用などの場合はスキップ */
  }
}

ensureNavigatorUserAgentForThreeGltf();

/**
 * expo-gl では R3F 内蔵の rAF ループだけでは `update` が進まず静止画になることがある。
 * `frameloop="never"` と組み合わせ、毎フレーム `advance` で描画・useFrame を駆動する。
 */
function ExpoGlR3fFrameDriver() {
  useLayoutEffect(() => {
    advance(performance.now() / 1000);
    let raf = 0;
    const tick = () => {
      advance(performance.now() / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return null;
}

/** Web `UniterzLogo3DBackground.tsx` の `Logo3D` と同値（回転・浮き・呼吸） */
const SCALE = 4.4;
const POSITION: [number, number, number] = [0, 0.1, 0];
const ROTATE_SPEED = 0.52;
const FLOAT_AMPLITUDE = 0.01;
const FLOAT_SPEED = 1.25;
/** Web コメント: 3.6秒で拡大↔縮小を繰り返す */
const BREATH_PERIOD_SEC = 3.6;
/** Web コメント: 縮小側をもう少し強める */
const BREATH_SCALE_AMPLITUDE = 0.055;

/** Web `ACTIVE_COLOR_THEME === "blackMetal"` と揃える（ネイティブは Bloom が無いため発光のみ僅かに強める） */
const THEME = {
  baseColor: "#07090d",
  emissiveColor: "#1c2430",
  edgeGlowColor: "#6b8bab",
  emissiveIntensity: 0.11,
  pulseAmount: 0.006,
  metalness: 1,
  roughness: 0.17,
  clearcoat: 0.88,
  clearcoatRoughness: 0.12,
  reflectivity: 0.86,
  bgColor: "#020409",
  fogColor: "#020409",
  ambientIntensity: 0.055,
  directionalIntensity: 0.62,
  pointLightAIntensity: 8.0,
  pointLightBIntensity: 6.9,
  pointLightAColor: "#85b6de",
  pointLightBColor: "#6f92b4",
} as const;

type NeonMat = (
  | THREE.MeshPhysicalMaterial
  | THREE.MeshStandardMaterial
  | THREE.MeshBasicMaterial
) & {
  userData: {
    baseEmissiveIntensity: number;
    pulseOffset: number;
    pulseSpeed: number;
  };
};

type GlowMat = THREE.MeshBasicMaterial & {
  userData: {
    baseOpacity: number;
    pulseOffset: number;
    pulseSpeed: number;
  };
};

/** Web の `public/logo/uniterz-logo.glb` と同じパス（リモート取得・`loadRankingsLogoGlbBuffer` のフォールバック用） */
function remoteLogoGltfUrl(): string | null {
  const base = getUniterzApiBaseUrl();
  return base ? `${base}/logo/uniterz-logo.glb` : null;
}

/**
 * Web の `Center` に相当するセンタリング。
 * RN + Hermes 環境では `Box3.setFromObject` が落ちる事例があるため、
 * メッシュごとの boundingBox を `matrixWorld` で合成する。
 */
function centerRootFromMeshes(root: THREE.Object3D) {
  try {
    root.updateMatrixWorld(true);
    const acc = new THREE.Box3();
    const tmp = new THREE.Box3();
    let has = false;
    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh) || !obj.geometry) return;
      const geom = obj.geometry;
      const pos = geom.getAttribute("position");
      if (!pos || pos.count === 0) return;
      if (!geom.boundingBox) {
        try {
          geom.computeBoundingBox();
        } catch {
          return;
        }
      }
      const bb = geom.boundingBox;
      if (!bb || bb.isEmpty()) return;
      tmp.copy(bb).applyMatrix4(obj.matrixWorld);
      if (!has) {
        acc.copy(tmp);
        has = true;
      } else {
        acc.union(tmp);
      }
    });
    if (has && !acc.isEmpty()) {
      const c = new THREE.Vector3();
      acc.getCenter(c);
      root.position.sub(c);
    }
  } catch {
    /* センタリング失敗時は原点のまま */
  }
}

/** 共有ジオメトリを二重 dispose しないよう Set でまとめて解放 */
function disposeClonedLogoScene(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    if (obj.geometry) geometries.add(obj.geometry);
    const mat = obj.material;
    if (Array.isArray(mat)) {
      for (const m of mat) {
        if (m) materials.add(m);
      }
    } else if (mat) {
      materials.add(mat);
    }
  });
  for (const g of geometries) {
    g.dispose();
  }
  for (const m of materials) {
    m.dispose();
  }
}

type LogoBuild = {
  scene: THREE.Group;
  emissiveMats: NeonMat[];
  glowMats: GlowMat[];
};

type LogoModelProps = {
  uri: string;
  scale?: number;
  /** false のとき正面固定（チュートリアル等） */
  spinning?: boolean;
  /** 追加ヨー（ラジアン）。正面の微調整用 */
  yawOffset?: number;
  /**
   * 透明 Canvas（inline）向け。
   * transparent マテリアルだと α クリア背景に沈んで「消えた」ように見える。
   */
  solidForInline?: boolean;
  onReady?: () => void;
};

function LogoModel({
  uri,
  scale = SCALE,
  spinning = true,
  yawOffset = 0,
  solidForInline = false,
  onReady,
}: LogoModelProps) {
  const [gltf, setGltf] = useState<{ scene: THREE.Group } | null>(null);
  const spinRef = useRef<THREE.Group>(null);
  const orientRef = useRef<THREE.Group>(null);
  const emissiveMatsRef = useRef<NeonMat[]>([]);
  const glowMatsRef = useRef<GlowMat[]>([]);
  const readySentRef = useRef(false);
  /** expo-gl 環境で THREE.Clock の elapsed が進まないことがあるため壁時計で駆動する */
  const animT0Ref = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    /** 先読み済みなら null フラッシュせず即セット → 空きフレームを出さない */
    const cached = getCachedRankingsLogoGltfScene();
    if (cached) {
      setGltf({ scene: cached });
    } else {
      setGltf(null);
    }

    void (async () => {
      try {
        const scene = await ensureRankingsLogoGltfParsed();
        if (cancelled) return;
        if (scene) {
          setGltf({ scene });
          return;
        }
        /** パースキャッシュ失敗時のみ従来パス */
        const loaded = await loadRankingsLogoGlbBuffer(uri);
        if (!loaded) {
          throw new Error("GLB取得失敗（同梱・キャッシュ・ネットワーク）");
        }
        if (cancelled) return;
        const loader = new GLTFLoader();
        loader.parse(
          loaded.buffer,
          loaded.resourcePath,
          (parsed) => {
            if (cancelled) return;
            setGltf(parsed as { scene: THREE.Group });
          },
          (err) => {
            console.error("RankingsLogo3DCanvasNative GLTF parse:", err);
            if (!cancelled) setGltf(null);
          }
        );
      } catch (e) {
        if (!cancelled) {
          console.error("RankingsLogo3DCanvasNative GLB fetch:", e);
          setGltf(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uri]);

  const logoBuild = useMemo((): LogoBuild | null => {
    if (!gltf) return null;
    const s = gltf.scene.clone(true);
    const emissiveMats: NeonMat[] = [];
    const glowMats: GlowMat[] = [];
    const meshes: THREE.Mesh[] = [];
    s.traverse((obj) => {
      if (obj instanceof THREE.Mesh) meshes.push(obj);
    });

    /** welcome inline: 「次へ」と同じ #00F5FF。白ライトで飛ばないよう Basic で色を固定 */
    const baseColor = solidForInline ? "#00F5FF" : THEME.baseColor;
    const emissiveColor = solidForInline ? "#00F5FF" : THEME.emissiveColor;
    const emissiveIntensity = solidForInline ? 0 : THEME.emissiveIntensity;
    const edgeOpacity = solidForInline ? 0.42 : 0.065;

    for (const obj of meshes) {
      obj.castShadow = false;
      obj.receiveShadow = false;
      obj.renderOrder = 1;

      const baseMat = (
        solidForInline
          ? new THREE.MeshBasicMaterial({
              color: new THREE.Color(baseColor),
              toneMapped: false,
              side: THREE.DoubleSide,
            })
          : new THREE.MeshStandardMaterial({
              color: new THREE.Color(baseColor),
              emissive: new THREE.Color(emissiveColor),
              emissiveIntensity,
              metalness: THEME.metalness,
              roughness: THEME.roughness,
              transparent: true,
              opacity: 0.92,
              side: THREE.DoubleSide,
              depthWrite: false,
              toneMapped: false,
            })
      ) as NeonMat;

      baseMat.userData = {
        baseEmissiveIntensity: emissiveIntensity,
        pulseOffset: Math.random() * Math.PI * 2,
        pulseSpeed: 0.62 + Math.random() * 0.06,
      };

      obj.material = baseMat;
      emissiveMats.push(baseMat);

      if (obj.geometry) {
        const edgeGlowMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(
            solidForInline ? "#00F5FF" : THEME.edgeGlowColor
          ),
          transparent: true,
          opacity: edgeOpacity,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          toneMapped: false,
        }) as GlowMat;

        edgeGlowMat.userData = {
          baseOpacity: edgeOpacity,
          pulseOffset: Math.random() * Math.PI * 2,
          pulseSpeed: 0.68 + Math.random() * 0.06,
        };

        const edgeGlow = new THREE.Mesh(obj.geometry, edgeGlowMat);
        edgeGlow.name = `${obj.name || "mesh"}__edgeGlow`;
        edgeGlow.renderOrder = 2;
        edgeGlow.scale.setScalar(1.002);
        obj.add(edgeGlow);
        glowMats.push(edgeGlowMat);
      }
    }

    centerRootFromMeshes(s);
    return { scene: s, emissiveMats, glowMats };
  }, [gltf, solidForInline]);

  useLayoutEffect(() => {
    if (!logoBuild) {
      emissiveMatsRef.current = [];
      glowMatsRef.current = [];
      return;
    }
    emissiveMatsRef.current = logoBuild.emissiveMats;
    glowMatsRef.current = logoBuild.glowMats;
  }, [logoBuild]);

  useEffect(() => {
    return () => {
      if (logoBuild) {
        disposeClonedLogoScene(logoBuild.scene);
      }
    };
  }, [logoBuild]);

  useLayoutEffect(() => {
    if (!orientRef.current || !logoBuild) return;
    /**
     * GLB は XZ 平面に寝ている。X 軸 +90° で立て、カメラ正面（+Z）へ向ける。
     * yawOffset で読みやすさを微調整。
     */
    orientRef.current.rotation.set(Math.PI / 2, yawOffset, 0);
  }, [logoBuild, yawOffset]);

  useEffect(() => {
    if (!logoBuild || readySentRef.current) return;
    readySentRef.current = true;
    /** 1 フレーム描画後に ready（Canvas が空のまま onReady しない） */
    const id = requestAnimationFrame(() => {
      onReady?.();
    });
    return () => cancelAnimationFrame(id);
  }, [logoBuild, onReady]);

  // Web と同じ運動式。経過時間は performance.now() ベース（RN+expo-gl で Clock が止まる対策）
  useFrame(() => {
    if (animT0Ref.current == null) {
      animT0Ref.current =
        typeof performance !== "undefined" ? performance.now() : 0;
    }
    const t =
      (typeof performance !== "undefined"
        ? (performance.now() - animT0Ref.current) / 1000
        : 0) || 0;

    if (spinRef.current) {
      if (spinning) {
        spinRef.current.rotation.y = t * ROTATE_SPEED;
        spinRef.current.position.y = Math.sin(t * FLOAT_SPEED) * FLOAT_AMPLITUDE;
        const phase = (t % BREATH_PERIOD_SEC) / BREATH_PERIOD_SEC; // 0..1
        // 0->0.5で吸う(拡大)、0.5->1で吐く(縮小)
        const inhale = phase < 0.5 ? phase / 0.5 : 1 - (phase - 0.5) / 0.5;
        const eased = 0.5 - 0.5 * Math.cos(inhale * Math.PI);
        // 拡大はせず、基準サイズから縮小して戻るだけにする
        const breathScale = 1 - eased * BREATH_SCALE_AMPLITUDE;
        spinRef.current.scale.setScalar(breathScale);
      } else {
        /** チュートリアル正面固定 — 浮遊／呼吸で面がブレないように止める */
        spinRef.current.rotation.y = 0;
        spinRef.current.position.y = 0;
        spinRef.current.scale.setScalar(1);
      }
    }

    for (const mat of emissiveMatsRef.current) {
      if (!("emissiveIntensity" in mat)) continue;
      const { baseEmissiveIntensity, pulseOffset, pulseSpeed } = mat.userData;
      const pulse = (Math.sin(t * pulseSpeed + pulseOffset) + 1) * 0.5;
      (mat as THREE.MeshStandardMaterial).emissiveIntensity =
        baseEmissiveIntensity +
        pulse * (spinning ? THEME.pulseAmount : THEME.pulseAmount * 18);
    }

    for (const mat of glowMatsRef.current) {
      const { baseOpacity, pulseOffset, pulseSpeed } = mat.userData;
      const pulse = (Math.sin(t * pulseSpeed + pulseOffset) + 1) * 0.5;
      mat.opacity = baseOpacity + pulse * (spinning ? 0.007 : 0.05);
    }
  });

  if (!logoBuild) {
    return null;
  }

  return (
    <group position={POSITION} scale={scale}>
      <group ref={spinRef}>
        <group ref={orientRef}>
          <primitive object={logoBuild.scene} />
        </group>
      </group>
    </group>
  );
}

function LogoScene({
  uri,
  variant,
  modelScale,
  spinning,
  yawOffset,
  onReady,
}: {
  uri: string;
  variant: "cyberBg" | "inline";
  modelScale: number;
  spinning: boolean;
  yawOffset: number;
  onReady?: () => void;
}) {
  const inline = variant === "inline";
  return (
    <>
      {/* 先頭で毎フレーム advance → useFrame（回転）が確実に駆動 */}
      <ExpoGlR3fFrameDriver />
      {/**
       * inline も不透明 BG。透明 Canvas + transparent マテリアルだと
       * α 合成でロゴが「消えた」ように見える（チュートリアル welcome の主因）。
       */}
      <color attach="background" args={[inline ? "#060a10" : THEME.bgColor]} />
      {inline ? null : <fog attach="fog" args={[THEME.fogColor, 11, 26]} />}
      <ambientLight intensity={inline ? 0.15 : THEME.ambientIntensity} />
      <directionalLight
        position={[3.5, 5.5, 7]}
        intensity={inline ? 0.35 : THEME.directionalIntensity}
        color={inline ? "#00F5FF" : "#e8fbff"}
      />
      {/* 正面キー — 白飛び防止。シアン寄りのみ */}
      {inline ? (
        <>
          <pointLight
            position={[0, 0.4, 4.8]}
            intensity={6}
            color="#00F5FF"
            distance={22}
          />
          <pointLight
            position={[-2.2, 1.2, 3.5]}
            intensity={4}
            color="#00c8d8"
            distance={18}
          />
        </>
      ) : null}
      <pointLight
        position={[-4, 4, 7]}
        intensity={THEME.pointLightAIntensity * (inline ? 0.55 : 1)}
        color={inline ? "#00F5FF" : THEME.pointLightAColor}
        distance={24}
      />
      <pointLight
        position={[4, -1, 7]}
        intensity={THEME.pointLightBIntensity * (inline ? 0.45 : 1)}
        color={inline ? "#00b8c8" : THEME.pointLightBColor}
        distance={22}
      />
      <pointLight
        position={[0, 2, -8]}
        intensity={inline ? 0.6 : 0.8}
        color="#042028"
        distance={18}
      />
      <LogoModel
        uri={uri}
        scale={modelScale}
        spinning={spinning}
        yawOffset={yawOffset}
        solidForInline={inline}
        onReady={onReady}
      />
    </>
  );
}

type RankingsLogo3DCanvasNativeProps = {
  /** cyberBg=ランキング背景 / inline=透明キャンバス（チュートリアル等） */
  variant?: "cyberBg" | "inline";
  /** inline 時のモデル倍率（省略時 3.1） */
  inlineScale?: number;
  /** inline 時のカメラ Z（小さいほど寄る） */
  inlineCameraZ?: number;
  /** inline 時の視野角（大きいほど寄って大きく見える） */
  inlineFov?: number;
  /** Y 回転アニメ。チュートリアル正面固定は false */
  spinning?: boolean;
  /** 正面のヨー微調整（ラジアン） */
  yawOffset?: number;
  /** GLB パース＋マテリアル構築が終わり描画可能になったとき */
  onReady?: () => void;
};

export default function RankingsLogo3DCanvasNative({
  variant = "cyberBg",
  inlineScale = 3.1,
  inlineCameraZ = 6.4,
  inlineFov = 28,
  spinning = true,
  yawOffset = 0,
  onReady,
}: RankingsLogo3DCanvasNativeProps) {
  /** 同梱 GLB 優先のため、リモート URL が無くてもダミー URI で Canvas を立てる */
  const uri = useMemo(
    () => remoteLogoGltfUrl() ?? "bundled://uniterz-logo.glb",
    []
  );
  const inline = variant === "inline";
  const modelScale = inline ? inlineScale : SCALE;
  const cameraZ = inline ? inlineCameraZ : 8;
  const fov = inline ? inlineFov : 28;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  return (
    <View style={styles.fill} collapsable={false}>
      <Canvas
        style={styles.fill}
        // expo-gl は内蔵ループと相性が悪いことがあるため never + 下記 Driver で advance
        frameloop="never"
        onCreated={() => {
          advance(performance.now() / 1000);
        }}
        gl={{
          antialias: true,
          /** welcome inline も不透明（透明 α 合成でロゴ消失するのを防ぐ） */
          alpha: false,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, cameraZ], fov, near: 0.1, far: 100 }}
      >
        <LogoScene
          uri={uri}
          variant={variant}
          modelScale={modelScale}
          spinning={spinning}
          yawOffset={yawOffset}
          onReady={() => onReadyRef.current?.()}
        />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});
