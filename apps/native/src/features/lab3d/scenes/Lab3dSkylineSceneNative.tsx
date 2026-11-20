import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import myPosts from "../demoData/myPosts.json";
import { disposeTree, frameDt, LAB_CYAN, LAB_MAGENTA, starfield, useLabels, useLabTap, type LabSceneProps } from "../lab3dKitNative";
import { dayLabel } from "../lab3dDataNative";

const POSTS = myPosts as unknown as Record<string, [number, number, number][]>;
export const LAB_SKYLINE_USERS = Object.keys(POSTS).map((n) => [n, n] as [string, string]);
const CELL = 1.25;

type Day = { day: number; n: number; wins: number; pts: number };

function build(name: string) {
  const byDay = new Map<number, Day>();
  for (const [day, win, pts] of POSTS[name] ?? []) {
    const d = byDay.get(day) ?? { day, n: 0, wins: 0, pts: 0 };
    d.n += 1;
    if (win === 1) d.wins += 1;
    d.pts += pts;
    byDay.set(day, d);
  }
  const days = [...byDay.values()].sort((a, b) => a.day - b.day);
  const first = days[0]?.day ?? 0;
  const monday = first - ((new Date(first * 86400000).getUTCDay() + 6) % 7);
  /** 予想のない週が続く所（オフシーズン）は 1 列の隙間に詰める */
  const rawWeeks = new Set(days.map((d) => Math.floor((d.day - monday) / 7)));
  const lastRaw = Math.max(0, ...rawWeeks);
  const col = new Map<number, number>();
  let c = 0;
  for (let w = 0; w <= lastRaw; w += 1) {
    if (rawWeeks.has(w)) col.set(w, c++);
    else if (rawWeeks.has(w - 1)) c += 1;
  }
  const weeks = c;
  const ox = (weeks * CELL) / 2;
  const cellPos = (day: number) => new THREE.Vector3((col.get(Math.floor((day - monday) / 7)) ?? -1) * CELL - ox, 0, ((day - monday) % 7) * CELL - 3.5 * CELL);

  const root = new THREE.Group();
  root.add(starfield(1500, 700, 2.5, 0.5));
  const base = new THREE.Mesh(new THREE.BoxGeometry(weeks * CELL + 2, 0.6, 7 * CELL + 2), new THREE.MeshStandardMaterial({ color: "#0b1424", roughness: 0.8 }));
  base.position.set(-CELL / 2, -0.3, -CELL / 2);
  root.add(base);
  const cells = [...col.keys()].flatMap((w) => Array.from({ length: 7 }, (_, d) => monday + w * 7 + d));
  const empty = new THREE.InstancedMesh(new THREE.BoxGeometry(CELL * 0.82, 0.08, CELL * 0.82), new THREE.MeshBasicMaterial({ color: "#13233a" }), Math.max(1, cells.length));
  const m = new THREE.Matrix4();
  cells.forEach((day, i) => empty.setMatrixAt(i, m.makeTranslation(cellPos(day).setY(0.04))));
  const bars = new THREE.InstancedMesh(new THREE.BoxGeometry(CELL * 0.82, 1, CELL * 0.82).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ roughness: 0.35, emissive: "#ffffff", emissiveIntensity: 0.12 }), Math.max(1, days.length));
  bars.frustumCulled = false;
  empty.frustumCulled = false;
  days.forEach((d, i) => {
    const rate = d.wins / d.n;
    bars.setColorAt(i, LAB_MAGENTA.clone().lerp(LAB_CYAN, rate).multiplyScalar(0.6 + rate * 0.6));
  });
  const months: { obj: THREE.Object3D; text: string }[] = [];
  let lastMonth = -1;
  for (const w of col.keys()) {
    const mo = new Date((monday + w * 7) * 86400000).getUTCMonth();
    if (mo === lastMonth) continue;
    lastMonth = mo;
    const o = new THREE.Object3D();
    o.position.copy(cellPos(monday + w * 7)).setZ(4.6 * CELL);
    root.add(o);
    months.push({ obj: o, text: `${mo + 1}月` });
  }
  root.add(empty, bars, new THREE.AmbientLight("#ffffff", 0.55), new THREE.DirectionalLight("#ffffff", 1.4).translateY(20).translateX(-10).translateZ(14));
  return { root, bars, days, cellPos, months, monday, weeks };
}

export default function Lab3dSkylineSceneNative({ onHud, option, pulse }: LabSceneProps) {
  const labels = useLabels();
  const name = option || LAB_SKYLINE_USERS[0][0];
  const world = useMemo(() => build(name), [name]);
  const grow = useRef(0);

  useEffect(() => () => disposeTree(world.root), [world]);
  useEffect(() => {
    grow.current = 0;
  }, [world, pulse]);

  useEffect(() => {
    const ids = world.months.map((mo) => labels.add({ obj: mo.obj, text: mo.text, color: "#8fdcff", size: 10 }));
    const { days } = world;
    const n = days.reduce((a, d) => a + d.n, 0);
    const w = days.reduce((a, d) => a + d.wins, 0);
    const pts = days.reduce((a, d) => a + d.pts, 0);
    const best = [...days].sort((a, b) => b.pts - a.pts)[0];
    onHud({
      big: `${name} の予想シーズン`,
      sub: `${days.length} 日 · ${n} 試合 · 的中 ${n ? Math.round((w / n) * 100) : 0}% · 合計 ${Math.round(pts)}pt${best ? ` · 最高 ${dayLabel(best.day)} ${best.pts.toFixed(1)}pt` : ""}`,
    });
    return () => ids.forEach((id) => labels.remove(id));
  }, [world, labels, onHud, name]);

  useLabTap((tap, camera, size) => {
    const v = new THREE.Vector3();
    let best: Day | null = null;
    let bestD = 34;
    for (const d of world.days) {
      v.copy(world.cellPos(d.day)).setY(0.5 + d.pts * 0.18).project(camera);
      const dist = Math.hypot(((v.x + 1) / 2) * size.width - tap.x, ((1 - v.y) / 2) * size.height - tap.y);
      if (dist < bestD) {
        bestD = dist;
        best = d;
      }
    }
    if (best) onHud({ big: `${dayLabel(best.day)} · ${best.pts.toFixed(1)}pt`, sub: `${best.n} 試合を予想して ${best.wins} 試合的中` });
  });

  useFrame((_, dt) => {
    if (grow.current > 1.2) return;
    grow.current += frameDt(dt) * 0.35;
    const m = new THREE.Matrix4();
    world.days.forEach((d, i) => {
      const week = (world.cellPos(d.day).x / CELL + world.weeks / 2) / Math.max(1, world.weeks);
      const k = THREE.MathUtils.smoothstep(grow.current * 1.4 - week * 0.4, 0, 1);
      m.makeScale(1, Math.max(0.001, (0.3 + d.pts * 0.18) * k), 1).setPosition(world.cellPos(d.day));
      world.bars.setMatrixAt(i, m);
    });
    world.bars.instanceMatrix.needsUpdate = true;
  });

  return <primitive object={world.root} />;
}
