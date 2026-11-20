import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import { abbr, disposeTree, frameDt, LAB_BG, teamGlowColor, useLabels, type LabSceneProps } from "../lab3dKitNative";
import { LAB_SEASONS, LAB_TEAMS, teamSeason } from "../lab3dDataNative";

export const LAB_RIDGE_SEASONS = LAB_SEASONS.filter((s) => s !== LAB_SEASONS[LAB_SEASONS.length - 1])
  .reverse()
  .map((s) => [s, s] as [string, string]);
const W = 34;
const GAP = 1.7;

function build(season: string) {
  const rows = LAB_TEAMS.map((id, ti) => {
    const games = teamSeason(season, ti);
    const m = games.map((g) => g.margin);
    const smooth = m.map((_, i) => ((m[i - 1] ?? m[i]) + 2 * m[i] + (m[i + 1] ?? m[i])) / 4);
    return { id, smooth, w: games.filter((g) => g.win).length, l: games.filter((g) => !g.win).length };
  }).sort((a, b) => a.w - b.w);

  const root = new THREE.Group();
  const occMat = new THREE.MeshBasicMaterial({ color: LAB_BG, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const lines: THREE.Line[] = [];
  const anchors: { obj: THREE.Object3D; text: string; color: string }[] = [];
  rows.forEach((r, row) => {
    const z = -(row - rows.length / 2) * GAP;
    const n = r.smooth.length;
    const pts = r.smooth.map((v, i) => new THREE.Vector3((i / (n - 1) - 0.5) * W, v * 0.11, z));
    const c = teamGlowColor(r.id);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: c.clone().lerp(new THREE.Color("#ffffff"), 0.35), toneMapped: false }));
    lines.push(line);
    const occ: number[] = [];
    for (let i = 0; i < n - 1; i += 1) {
      const a = pts[i];
      const b = pts[i + 1];
      occ.push(a.x, a.y, z, b.x, b.y, z, a.x, -8, z, b.x, b.y, z, b.x, -8, z, a.x, -8, z);
    }
    const og = new THREE.BufferGeometry();
    og.setAttribute("position", new THREE.Float32BufferAttribute(occ, 3));
    root.add(new THREE.Mesh(og, occMat), line);
    const a = new THREE.Object3D();
    a.position.set(-W / 2 - 2.2, 0.2, z);
    root.add(a);
    anchors.push({ obj: a, text: `${abbr(r.id)} ${r.w}-${r.l}`, color: `#${c.getHexString()}` });
  });
  const axis = new THREE.Object3D();
  axis.position.set(0, -1.2, (rows.length / 2) * GAP + 1.6);
  root.add(axis);
  return { root, lines, anchors, axis, n: Math.max(...rows.map((r) => r.smooth.length)) };
}

export default function Lab3dRidgeSceneNative({ onHud, option, pulse }: LabSceneProps) {
  const labels = useLabels();
  const season = option || LAB_RIDGE_SEASONS[0][0];
  const world = useMemo(() => build(season), [season]);
  const t = useRef(0);

  useEffect(() => () => disposeTree(world.root), [world]);
  useEffect(() => {
    t.current = 0;
  }, [world, pulse]);
  useEffect(() => {
    const ids = [
      ...world.anchors.map((a) => labels.add({ obj: a.obj, text: a.text, color: a.color, size: 9, scaleDist: 55 })),
      labels.add({ obj: world.axis, text: "開幕 → 82 試合 → 最終戦", color: "#8fdcff", size: 10 }),
    ];
    onHud({ big: `${season} · 30 チームの波`, sub: "1 本＝1 チームの全試合の点差。山＝大勝 / 谷＝大敗。奥ほど勝ち数が多い" });
    return () => ids.forEach((id) => labels.remove(id));
  }, [world, labels, onHud, season]);

  useFrame((_, dt) => {
    if (t.current > 1) return;
    t.current = Math.min(1.01, t.current + frameDt(dt) * 0.4);
    for (const l of world.lines) l.geometry.setDrawRange(0, Math.ceil(world.n * Math.min(1, t.current)));
  });

  return <primitive object={world.root} />;
}
