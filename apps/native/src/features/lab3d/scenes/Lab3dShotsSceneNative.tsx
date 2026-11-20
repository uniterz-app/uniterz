import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import shotData from "../demoData/shots.json";
import { disposeTree, glowSprite, glowTexture, LAB_CYAN, LAB_MAGENTA, useThrottledHud, type LabSceneProps, frameDt } from "../lab3dKitNative";

/** [date, made, value, x(ft), y(ft), dist] — ゴールは x 25, y 0 */
type Shot = [string, number, number, number, number, number];
const SHOTS = shotData.shots as unknown as Record<string, Shot[]>;
const NAMES = shotData.players as Record<string, string>;
export const LAB_SHOT_PLAYERS = Object.entries(NAMES).map(([id, n]) => [id, n.split(" ").pop()!.toUpperCase()] as [string, string]);

const RIM = new THREE.Vector3(0, 10, 0);
const SEG = 36;
const FADE_CHUNK = 20;

function buildCourt() {
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(56, 54), new THREE.MeshBasicMaterial({ color: "#060914" }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.01, 21.75);
  g.add(floor);
  const grid = new THREE.GridHelper(56, 28, "#0a2a40", "#0a1a2a");
  grid.position.set(0, 0, 21.75);
  g.add(grid);
  const mat = new THREE.LineBasicMaterial({ color: LAB_CYAN, transparent: true, opacity: 0.8 });
  const L = (pts: [number, number][]) => g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(([x, z]) => new THREE.Vector3(x, 0.02, z))), mat));
  const arc = (r: number, a0: number, a1: number, cx = 0, cz = 0, n = 64) =>
    Array.from({ length: n + 1 }, (_, i) => {
      const a = a0 + ((a1 - a0) * i) / n;
      return [cx + Math.sin(a) * r, cz + Math.cos(a) * r] as [number, number];
    });
  L([[-25, -5.25], [25, -5.25], [25, 41.75], [-25, 41.75], [-25, -5.25]]);
  L([[-8, -5.25], [-8, 13.75], [8, 13.75], [8, -5.25]]);
  L(arc(6, -Math.PI / 2, Math.PI / 2, 0, 13.75));
  L(arc(4, -Math.PI / 2, Math.PI / 2));
  const a3 = Math.asin(22 / 23.75);
  L([[-22, -5.25], ...arc(23.75, -a3, a3), [22, -5.25]]);
  L(arc(6, Math.PI / 2, (Math.PI * 3) / 2, 0, 41.75));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.07, 8, 40), new THREE.MeshBasicMaterial({ color: "#ff7a1a", toneMapped: false }));
  rim.rotation.x = Math.PI / 2;
  rim.position.copy(RIM);
  g.add(rim);
  const bb = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(6, 3.5)), new THREE.LineBasicMaterial({ color: "#ffffff" }));
  bb.position.set(0, 11.2, -1.25);
  g.add(bb);
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -4), new THREE.Vector3(0, 9.5, -4), new THREE.Vector3(0, 9.5, -1.25)]), new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.3 })));
  return g;
}

function arcPoints(s: Shot): THREE.Vector3[] {
  const [, m, , x, y, d] = s;
  const start = new THREE.Vector3(x - 25, 7, y);
  const end = m ? RIM.clone() : RIM.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.6, 0.3, (Math.random() - 0.3) * 1.4));
  const apex = 13 + Math.min(14, d * 0.32);
  const ctrl = start.clone().lerp(end, 0.5);
  ctrl.y = 2 * apex - (start.y + end.y) / 2;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= SEG; i += 1) {
    const t = i / SEG;
    pts.push(new THREE.Vector3().addScaledVector(start, (1 - t) * (1 - t)).addScaledVector(ctrl, 2 * (1 - t) * t).addScaledVector(end, t * t));
  }
  if (!m) {
    const out = new THREE.Vector3(Math.sign(end.x || 1) * (2 + Math.random() * 4), 0, 3 + Math.random() * 6);
    for (let i = 1; i <= 14; i += 1) {
      const t = i / 14;
      pts.push(new THREE.Vector3(end.x + out.x * t, end.y + 3 * t - 13 * t * t, end.z + out.z * t));
    }
  }
  return pts;
}

type Active = { s: Shot; pts: THREE.Vector3[]; line: THREE.Line; ball: THREE.Mesh; t: number; dur: number; done?: boolean };

export default function Lab3dShotsSceneNative({ onHud, option }: LabSceneProps) {
  const court = useMemo(buildCourt, []);
  const shotsGroup = useMemo(() => new THREE.Group(), []);
  const rimFlash = useMemo(() => {
    const s = glowSprite(LAB_CYAN, 0.1, 0);
    s.position.copy(RIM);
    return s;
  }, []);
  const ballGeo = useMemo(() => new THREE.SphereGeometry(0.35, 10, 10), []);
  const mats = useMemo(() => {
    const line = (c: THREE.Color, o: number) => new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: o, toneMapped: false });
    const halo = (c: THREE.Color) =>
      new THREE.SpriteMaterial({ map: glowTexture(), color: c, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    return {
      lineMade: line(LAB_CYAN, 0.95),
      lineMiss: line(LAB_MAGENTA, 0.95),
      fadedMade: line(LAB_CYAN, 0.25),
      fadedMiss: line(LAB_MAGENTA, 0.1),
      ballMade: new THREE.MeshBasicMaterial({ color: "#aaffff", toneMapped: false }),
      ballMiss: new THREE.MeshBasicMaterial({ color: "#ffaaee", toneMapped: false }),
      haloMade: halo(LAB_CYAN),
      haloMiss: halo(LAB_MAGENTA),
    };
  }, []);
  const st = useRef({
    queue: [] as Shot[],
    active: [] as Active[],
    idx: 0,
    acc: 0,
    fgm: 0,
    fga: 0,
    m3: 0,
    a3: 0,
    date: "",
    dots: null as THREE.Points | null,
    /** 終わった弾道。FADE_CHUNK 本たまったら成功 / 失敗ごとに 1 本の静的 LineSegments にまとめる（描画呼び出しを増やさない） */
    pending: [] as { line: THREE.Line; made: boolean }[],
    chunks: [] as THREE.LineSegments[],
  });
  const hud = useThrottledHud(onHud, 8);

  useEffect(
    () => () => {
      disposeTree(court);
      disposeTree(shotsGroup);
      ballGeo.dispose();
      Object.values(mats).forEach((m) => m.dispose());
    },
    [court, shotsGroup, ballGeo, mats]
  );

  const clearShots = () => {
    const s = st.current;
    for (const a of s.active) {
      shotsGroup.remove(a.line, a.ball);
      a.line.geometry.dispose();
    }
    s.active = [];
    for (const o of [...s.pending.map((x) => x.line), ...s.chunks]) {
      shotsGroup.remove(o);
      o.geometry.dispose();
    }
    s.pending = [];
    s.chunks = [];
    s.idx = 0;
    Object.assign(s, { fgm: 0, fga: 0, m3: 0, a3: 0 });
  };

  useEffect(() => {
    const s = st.current;
    clearShots();
    if (s.dots) {
      shotsGroup.remove(s.dots);
      s.dots.geometry.dispose();
    }
    s.queue = SHOTS[option] ?? [];
    s.date = "";
    const pos = new Float32Array(s.queue.length * 3);
    const col = new Float32Array(s.queue.length * 3);
    s.queue.forEach((q, i) => {
      pos.set([q[3] - 25, 0.15, q[4]], i * 3);
      const c = q[1] ? LAB_CYAN : LAB_MAGENTA.clone().multiplyScalar(0.7);
      col.set([c.r, c.g, c.b], i * 3);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setDrawRange(0, 0);
    s.dots = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, map: glowTexture(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    shotsGroup.add(s.dots);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [option, shotsGroup, mats]);

  const flushFaded = () => {
    const s = st.current;
    for (const made of [true, false]) {
      const pts: THREE.Vector3[] = [];
      for (const { line, made: m } of s.pending) {
        if (m !== made) continue;
        const arr = line.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < arr.count - 1; i += 1) pts.push(new THREE.Vector3().fromBufferAttribute(arr, i), new THREE.Vector3().fromBufferAttribute(arr, i + 1));
      }
      if (!pts.length) continue;
      const chunk = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), made ? mats.fadedMade : mats.fadedMiss);
      shotsGroup.add(chunk);
      s.chunks.push(chunk);
    }
    for (const { line } of s.pending) {
      shotsGroup.remove(line);
      line.geometry.dispose();
    }
    s.pending = [];
  };

  useFrame((_, dtRaw) => {
    const dt = frameDt(dtRaw);
    const s = st.current;
    if (!s.queue.length) return;
    s.acc += dt;
    while (s.acc > 0.11) {
      s.acc -= 0.11;
      if (s.idx < s.queue.length) {
        const shot = s.queue[s.idx];
        s.idx += 1;
        const made = shot[1] === 1;
        const pts = arcPoints(shot);
        const g = new THREE.BufferGeometry().setFromPoints(pts);
        g.setDrawRange(0, 0);
        const line = new THREE.Line(g, made ? mats.lineMade : mats.lineMiss);
        const ball = new THREE.Mesh(ballGeo, made ? mats.ballMade : mats.ballMiss);
        const halo = new THREE.Sprite(made ? mats.haloMade : mats.haloMiss);
        halo.scale.setScalar(2.4);
        ball.add(halo);
        shotsGroup.add(line, ball);
        s.active.push({ s: shot, pts, line, ball, t: 0, dur: 0.9 + shot[5] * 0.02 });
        s.date = shot[0];
      } else if (!s.active.length) {
        clearShots();
        break;
      }
    }
    for (const a of s.active) {
      a.t += dt / a.dur;
      const n = Math.min(a.pts.length, Math.floor(a.t * (SEG + 1)));
      a.line.geometry.setDrawRange(0, n);
      a.ball.position.copy(a.pts[Math.max(0, n - 1)]);
      if (n >= a.pts.length) {
        a.done = true;
        const made = a.s[1] === 1;
        shotsGroup.remove(a.ball);
        a.line.material = made ? mats.fadedMade : mats.fadedMiss;
        s.pending.push({ line: a.line, made });
        if (s.pending.length >= FADE_CHUNK) flushFaded();
        s.fga += 1;
        if (made) s.fgm += 1;
        if (a.s[2] === 3) {
          s.a3 += 1;
          if (made) s.m3 += 1;
        }
        if (made) {
          (rimFlash.material as THREE.SpriteMaterial).opacity = 1;
          rimFlash.scale.setScalar(5);
        }
      }
    }
    s.active = s.active.filter((a) => !a.done);
    s.dots?.geometry.setDrawRange(0, s.idx);
    const fm = rimFlash.material as THREE.SpriteMaterial;
    fm.opacity *= 0.9;
    rimFlash.scale.multiplyScalar(1.03);
    const pct = s.fga ? ((s.fgm / s.fga) * 100).toFixed(1) : "0.0";
    hud(NAMES[option] ?? "", `${s.date} まで · FG ${s.fgm}/${s.fga} (${pct}%) · 3P ${s.m3}/${s.a3}`);
  });

  return (
    <group>
      <primitive object={court} />
      <primitive object={shotsGroup} />
      <primitive object={rimFlash} />
    </group>
  );
}
