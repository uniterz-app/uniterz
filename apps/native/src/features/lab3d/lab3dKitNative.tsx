/**
 * __DEV__ 3D LAB の共通土台。expo-gl には後処理ブルームも 2D canvas も無いので、
 * 光は加算合成スプライト、文字は 3D 座標を投影して RN Text を重ねる。
 */
import { advance, Canvas, useFrame, useThree } from "@react-three/fiber/native";
import * as THREE from "three";
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { PanResponder, StyleSheet, Text, View } from "react-native";
import * as Device from "expo-device";
import { teamColorsNBA } from "@/lib/teams-nba";
import { TEAM_SHORT } from "@/lib/team-short";

export const LAB_BG = "#03040a";
export const LAB_CYAN = new THREE.Color("#00f5ff");
export const LAB_MAGENTA = new THREE.Color("#ff2bd6");

/** 低 FPS でも実時間で進める。タブ復帰などの大きな飛びだけ切る */
export const frameDt = (dt: number) => Math.min(0.25, dt || 0.016);

export const abbr = (teamId: string) =>
  TEAM_SHORT[teamId] ?? teamId.replace(/^nba-/, "").slice(0, 3).toUpperCase();

/** 暗すぎる / 白っぽいチームカラーは発光用に持ち上げる */
export function teamGlowColor(teamId: string): THREE.Color {
  const c = teamColorsNBA[teamId];
  let hex = c?.primary ?? "#00F5FF";
  const hsl = { h: 0, s: 0, l: 0 };
  new THREE.Color(hex).getHSL(hsl);
  if (
    (hsl.l < 0.35 || hsl.s < 0.15) &&
    c?.secondary &&
    c.secondary !== "#000000"
  )
    hex = c.secondary;
  const out = new THREE.Color(hex);
  out.getHSL(hsl);
  if (hsl.l < 0.45) out.setHSL(hsl.h, Math.max(hsl.s, 0.6), 0.55);
  return out;
}

let glowTex: THREE.DataTexture | null = null;
export function glowTexture(): THREE.DataTexture {
  if (glowTex) return glowTex;
  const S = 64;
  const data = new Uint8Array(S * S * 4);
  for (let y = 0; y < S; y += 1) {
    for (let x = 0; x < S; x += 1) {
      const d = Math.hypot(x - S / 2 + 0.5, y - S / 2 + 0.5) / (S / 2);
      const a = d >= 1 ? 0 : Math.exp(-d * d * 4.5) * (1 - d);
      const i = (y * S + x) * 4;
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = Math.round(a * 255);
    }
  }
  glowTex = new THREE.DataTexture(data, S, S, THREE.RGBAFormat);
  glowTex.needsUpdate = true;
  return glowTex;
}

export function glowSprite(
  color: THREE.ColorRepresentation,
  scale = 1,
  opacity = 1,
): THREE.Sprite {
  const m = new THREE.SpriteMaterial({
    map: glowTexture(),
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const s = new THREE.Sprite(m);
  s.scale.setScalar(scale);
  return s;
}

/**
 * 点ごとに色・大きさ（ワールド単位）・不透明度を持つ光の点群。スプライトを何百個も並べると
 * 描画呼び出しが増えて expo-gl では重いので、1 回で描く。uScale は毎フレーム updateGlowPointsScale。
 */
export function glowPoints(count: number): THREE.Points {
  const g = new THREE.BufferGeometry();
  g.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(count * 3), 3),
  );
  g.setAttribute(
    "aColor",
    new THREE.BufferAttribute(new Float32Array(count * 3), 3),
  );
  g.setAttribute(
    "aSize",
    new THREE.BufferAttribute(new Float32Array(count), 1).setUsage(
      THREE.DynamicDrawUsage,
    ),
  );
  g.setAttribute(
    "aAlpha",
    new THREE.BufferAttribute(new Float32Array(count), 1).setUsage(
      THREE.DynamicDrawUsage,
    ),
  );
  const m = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: glowTexture() }, uScale: { value: 800 } },
    vertexShader: `
      attribute vec3 aColor; attribute float aSize; attribute float aAlpha;
      uniform float uScale;
      varying vec3 vColor; varying float vAlpha;
      void main() {
        vColor = aColor; vAlpha = aAlpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uScale / max(0.1, -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform sampler2D uMap;
      varying vec3 vColor; varying float vAlpha;
      void main() {
        float a = texture2D(uMap, gl_PointCoord).a * vAlpha;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vColor, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  return pts;
}

/** 画面の高さ（px）とカメラの画角から、ワールド単位の大きさを px に直す係数 */
export function updateGlowPointsScale(
  pts: THREE.Points,
  camera: THREE.Camera,
  heightPx: number,
) {
  const fov = (camera as THREE.PerspectiveCamera).fov ?? 55;
  (pts.material as THREE.ShaderMaterial).uniforms.uScale.value =
    heightPx / (2 * Math.tan((fov * Math.PI) / 360));
}

export function starfield(
  count = 2000,
  radius = 900,
  size = 2,
  opacity = 0.7,
): THREE.Points {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const v = new THREE.Vector3()
      .randomDirection()
      .multiplyScalar(radius * (0.5 + Math.random() * 0.5));
    pos.set([v.x, v.y, v.z], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(
    g,
    new THREE.PointsMaterial({
      size,
      map: glowTexture(),
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
  );
}

export function disposeTree(obj: THREE.Object3D) {
  obj.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    const mat = m.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
    else mat?.dispose();
  });
}

// ---- ラベル（3D → 画面座標） ----

type LabelEntry = {
  obj: THREE.Object3D;
  text: string;
  color: string;
  size: number;
  /** この距離で size。遠いほど小さく、6pt 未満は出さない */
  scaleDist?: number;
};
type LabelPos = {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
};
type LabelFrame = { list: LabelPos[]; ready: boolean; fps: number };

class LabelStore {
  private seq = 0;
  entries = new Map<number, LabelEntry>();
  private listener: ((f: LabelFrame) => void) | null = null;
  add(e: LabelEntry): number {
    this.seq += 1;
    this.entries.set(this.seq, e);
    return this.seq;
  }
  remove(id: number) {
    this.entries.delete(id);
  }
  clear() {
    this.entries.clear();
  }
  subscribe(f: (f: LabelFrame) => void) {
    this.listener = f;
    return () => {
      if (this.listener === f) this.listener = null;
    };
  }
  emit(f: LabelFrame) {
    this.listener?.(f);
  }
}

export type LabTap = { x: number; y: number };

export type OrbitState = {
  enabled: boolean;
  yaw: number;
  pitch: number;
  dist: number;
  target: THREE.Vector3;
  autoRotate: number;
  minDist: number;
  maxDist: number;
  minPitch: number;
  maxPitch: number;
  lastTouch: number;
};

type LabCtx = {
  labels: LabelStore;
  orbit: OrbitState;
  tapHandler: {
    current:
      | ((
          tap: LabTap,
          camera: THREE.Camera,
          size: { width: number; height: number },
        ) => void)
      | null;
  };
  pendingTap: { current: LabTap | null };
  /** GL を縮小して描き、表示で拡大する倍率（画面座標 = GL 座標 × viewScale） */
  viewScale: number;
};

const Ctx = createContext<LabCtx | null>(null);
const useLab = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("lab3d context missing");
  return c;
};

/** 命令的に作ったオブジェクトにラベルを付ける。返り値で外す */
export function useLabels() {
  return useLab().labels;
}

export function useOrbit() {
  return useLab().orbit;
}

/** タップ（ドラッグでない短い触れ）を受ける */
export function useLabTap(
  handler: (
    tap: LabTap,
    camera: THREE.Camera,
    size: { width: number; height: number },
  ) => void,
) {
  const { tapHandler } = useLab();
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    tapHandler.current = (t, c, s) => ref.current(t, c, s);
    return () => {
      tapHandler.current = null;
    };
  }, [tapHandler]);
}

/** 縦長画面ではカメラを引く */
export function portraitK(width: number, height: number) {
  const a = width / height;
  return a < 1 ? Math.min(2.1, 0.85 / a) : 1;
}

/** シミュレーターの GL は CPU のソフトウェア描画で、画素数に比例して重い。MSAA を切り、半分の解像度で描いて拡大する */
const IS_SIMULATOR = !Device.isDevice;
const VIEW_SCALE = IS_SIMULATOR ? 2 : 1;

/**
 * expo-gl は JS が GL 命令を積むだけで、描画は別スレッドが後から実行する。描画が追いつかないと
 * JS は 60fps で積み続けて画面がどんどん遅れる（メモリも増える）。毎フレーム getError で
 * 前のフレームの描画完了を待ち、描ける速さでだけ進める。
 */
function LabFrameDriver() {
  const gl = useThree((s) => s.gl);
  useLayoutEffect(() => {
    const ctx = gl.getContext();
    let alive = true;
    let raf = 0;
    const tick = () => {
      if (!alive) return;
      advance(performance.now() / 1000);
      ctx.getError();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [gl]);
  return null;
}

const _v = new THREE.Vector3();
const _sph = new THREE.Vector3();

function StageDriver() {
  const { labels, orbit, pendingTap, tapHandler, viewScale } = useLab();
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const frame = useRef(0);
  const fpsRef = useRef({ t0: 0, n: 0, fps: 0, lastFps: -1, hadLabels: false });

  useFrame((_, dt) => {
    const d = frameDt(dt);
    if (orbit.enabled) {
      if (Date.now() - orbit.lastTouch > 2500)
        orbit.yaw += orbit.autoRotate * d;
      const cp = Math.cos(orbit.pitch);
      _sph
        .set(
          Math.sin(orbit.yaw) * cp,
          Math.sin(orbit.pitch),
          Math.cos(orbit.yaw) * cp,
        )
        .multiplyScalar(orbit.dist);
      camera.position.copy(orbit.target).add(_sph);
      camera.lookAt(orbit.target);
    }
    const tap = pendingTap.current;
    if (tap) {
      pendingTap.current = null;
      tapHandler.current?.(
        { x: tap.x / viewScale, y: tap.y / viewScale },
        camera,
        size,
      );
    }
    frame.current += 1;
    const fr = fpsRef.current;
    const now = performance.now();
    if (!fr.t0) fr.t0 = now;
    fr.n += 1;
    if (now - fr.t0 >= 1000) {
      fr.fps = Math.round((fr.n * 1000) / (now - fr.t0));
      fr.t0 = now;
      fr.n = 0;
    }
    const ready = frame.current >= 6;
    if (labels.entries.size === 0) {
      if (fr.hadLabels || fr.fps !== fr.lastFps || frame.current === 6) {
        fr.hadLabels = false;
        fr.lastFps = fr.fps;
        labels.emit({ list: [], ready, fps: fr.fps });
      }
      return;
    }
    if (frame.current % 2 !== 0) return;
    fr.hadLabels = true;
    fr.lastFps = fr.fps;
    const out: LabelPos[] = [];
    labels.entries.forEach((e, id) => {
      let vis = e.obj.visible;
      e.obj.traverseAncestors((a) => {
        if (!a.visible) vis = false;
      });
      if (!vis) return;
      e.obj.getWorldPosition(_v);
      let fontSize = e.size;
      if (e.scaleDist) {
        fontSize = Math.min(
          e.size * 1.6,
          (e.size * e.scaleDist) /
            Math.max(0.01, _v.distanceTo(camera.position)),
        );
        if (fontSize < 6) return;
      }
      _v.project(camera);
      if (_v.z > 1 || _v.z < -1 || Math.abs(_v.x) > 1.2 || Math.abs(_v.y) > 1.2)
        return;
      out.push({
        id,
        x: ((_v.x + 1) / 2) * size.width * viewScale,
        y: ((1 - _v.y) / 2) * size.height * viewScale,
        text: e.text,
        color: e.color,
        size: Math.round(fontSize * 2) / 2,
      });
    });
    labels.emit({ list: out, ready, fps: fr.fps });
  });
  return null;
}

function LabelOverlay({ store }: { store: LabelStore }) {
  const [list, setList] = useState<LabelPos[]>([]);
  /** 初回のシェーダーコンパイル中は黒いので、数フレーム描けるまで LOADING */
  const [ready, setReady] = useState(false);
  const [fps, setFps] = useState(0);
  useEffect(
    () =>
      store.subscribe((f) => {
        setList(f.list);
        setFps(f.fps);
        if (f.ready) setReady(true);
      }),
    [store],
  );
  if (!ready) {
    return (
      <View style={styles.loading} pointerEvents="none">
        <Text style={styles.loadingText}>LOADING 3D…</Text>
      </View>
    );
  }
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {fps > 0 ? (
        <Text style={[styles.fps, fps < 30 && styles.fpsLow]}>{fps} FPS</Text>
      ) : null}
      {list.map((l) => (
        <View
          key={l.id}
          style={[
            styles.labelBox,
            { left: l.x - 90, top: l.y - l.size * 0.75 },
          ]}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.label,
              { color: l.color, fontSize: l.size, textShadowColor: l.color },
            ]}
          >
            {l.text}
          </Text>
        </View>
      ))}
    </View>
  );
}

export type LabStageProps = {
  children: ReactNode;
  fov?: number;
  orbit?: Partial<Omit<OrbitState, "target" | "lastTouch">> & {
    target?: [number, number, number];
  };
  /** false でカメラはシーン側が動かす */
  orbitEnabled?: boolean;
  fog?: number;
};

export function LabStageNative({
  children,
  fov = 55,
  orbit: orbitInit,
  orbitEnabled = true,
  fog,
}: LabStageProps) {
  const labels = useMemo(() => new LabelStore(), []);
  const orbit = useMemo<OrbitState>(
    () => ({
      enabled: orbitEnabled,
      yaw: orbitInit?.yaw ?? 0,
      pitch: orbitInit?.pitch ?? 0.25,
      dist: orbitInit?.dist ?? 100,
      target: new THREE.Vector3(...(orbitInit?.target ?? [0, 0, 0])),
      autoRotate: orbitInit?.autoRotate ?? 0.08,
      minDist: orbitInit?.minDist ?? 5,
      maxDist: orbitInit?.maxDist ?? 2000,
      minPitch: orbitInit?.minPitch ?? -1.45,
      maxPitch: orbitInit?.maxPitch ?? 1.45,
      lastTouch: 0,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const tapHandler = useMemo<LabCtx["tapHandler"]>(
    () => ({ current: null }),
    [],
  );
  const pendingTap = useMemo<LabCtx["pendingTap"]>(
    () => ({ current: null }),
    [],
  );
  const ctx = useMemo<LabCtx>(
    () => ({ labels, orbit, tapHandler, pendingTap, viewScale: VIEW_SCALE }),
    [labels, orbit, tapHandler, pendingTap],
  );
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  const gesture = useRef({
    pinch0: 0,
    dist0: 0,
    lastDx: 0,
    lastDy: 0,
    moved: 0,
    t0: 0,
    x0: 0,
    y0: 0,
  });
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          const g = gesture.current;
          g.pinch0 = 0;
          g.lastDx = 0;
          g.lastDy = 0;
          g.moved = 0;
          g.t0 = Date.now();
          g.x0 = e.nativeEvent.locationX;
          g.y0 = e.nativeEvent.locationY;
          orbit.lastTouch = Date.now();
        },
        onPanResponderMove: (e, s) => {
          const g = gesture.current;
          const touches = e.nativeEvent.touches;
          orbit.lastTouch = Date.now();
          if (touches.length >= 2) {
            const d = Math.hypot(
              touches[0].pageX - touches[1].pageX,
              touches[0].pageY - touches[1].pageY,
            );
            if (!g.pinch0) {
              g.pinch0 = d;
              g.dist0 = orbit.dist;
            } else {
              orbit.dist = Math.min(
                orbit.maxDist,
                Math.max(orbit.minDist, (g.dist0 * g.pinch0) / Math.max(1, d)),
              );
            }
            g.moved = 99;
            return;
          }
          const ddx = s.dx - g.lastDx;
          const ddy = s.dy - g.lastDy;
          g.lastDx = s.dx;
          g.lastDy = s.dy;
          g.moved = Math.max(g.moved, Math.hypot(s.dx, s.dy));
          orbit.yaw -= ddx * 0.008;
          orbit.pitch = Math.min(
            orbit.maxPitch,
            Math.max(orbit.minPitch, orbit.pitch + ddy * 0.006),
          );
        },
        onPanResponderRelease: () => {
          const g = gesture.current;
          if (g.moved < 8 && Date.now() - g.t0 < 350)
            pendingTap.current = { x: g.x0, y: g.y0 };
        },
      }),
    [orbit, pendingTap],
  );

  return (
    <Ctx.Provider value={ctx}>
      <View
        style={styles.root}
        onLayout={(e) =>
          setBox({
            w: e.nativeEvent.layout.width,
            h: e.nativeEvent.layout.height,
          })
        }
      >
        {box ? (
          <View
            style={[
              styles.glBox,
              {
                width: box.w / VIEW_SCALE,
                height: box.h / VIEW_SCALE,
                transform: [{ scale: VIEW_SCALE }],
              },
            ]}
          >
            <Canvas
              style={styles.canvas}
              frameloop="never"
              flat
              gl={{
                antialias: !IS_SIMULATOR,
                powerPreference: "high-performance",
              }}
              camera={{ fov, near: 0.1, far: 5000, position: [0, 0, 100] }}
              onCreated={({ gl }) => {
                gl.setClearColor(LAB_BG, 1);
                advance(performance.now() / 1000);
              }}
            >
              <Ctx.Provider value={ctx}>
                <color attach="background" args={[LAB_BG]} />
                {fog ? <fogExp2 attach="fog" args={[LAB_BG, fog]} /> : null}
                <LabFrameDriver />
                <StageDriver />
                {children}
              </Ctx.Provider>
            </Canvas>
          </View>
        ) : null}
        <View style={StyleSheet.absoluteFill} {...pan.panHandlers} />
        <LabelOverlay store={labels} />
      </View>
    </Ctx.Provider>
  );
}

export type LabHud = { big: string; sub: string };
/** option = 選択中のボタン、pulse = 「もう一度」系ボタンを押すたびに増える */
export type LabSceneProps = {
  onHud: (h: LabHud) => void;
  option: string;
  pulse: number;
};

/** HUD を数 Hz に間引いて親へ返す */
export function useThrottledHud(onHud: (h: LabHud) => void, hz = 6) {
  const last = useRef({ t: 0, v: "" });
  return (big: string, sub: string) => {
    const now = Date.now();
    const v = `${big}\n${sub}`;
    if (v === last.current.v || now - last.current.t < 1000 / hz) return;
    last.current = { t: now, v };
    onHud({ big, sub });
  };
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LAB_BG },
  canvas: { ...StyleSheet.absoluteFillObject },
  glBox: { position: "absolute", left: 0, top: 0, transformOrigin: "top left" },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: LAB_BG,
  },
  loadingText: {
    color: "#00F5FF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 3,
  },
  fps: {
    position: "absolute",
    right: 16,
    top: 150,
    color: "rgba(0,245,255,0.7)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  fpsLow: { color: "#ff2bd6" },
  labelBox: { position: "absolute", width: 180, alignItems: "center" },
  label: {
    fontWeight: "800",
    letterSpacing: 0.5,
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
});
