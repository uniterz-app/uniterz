import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import { abbr, disposeTree, frameDt, LAB_CYAN, LAB_MAGENTA, starfield, teamGlowColor, useLabels, type LabSceneProps } from "../lab3dKitNative";
import { LAB_SEASONS, teamIndex, teamSeason } from "../lab3dDataNative";

const LAP = 82;
const RISE = 4.2;
const radius = (rate: number) => 4 + rate * 13;

function build(teamId: string) {
  const team = teamIndex(teamId);
  const root = new THREE.Group();
  root.add(starfield(1500, 700, 2.5, 0.5));
  const tc = teamGlowColor(teamId);
  const pts: THREE.Vector3[] = [];
  const cols: number[] = [];
  const beads: { p: THREE.Vector3; win: boolean }[] = [];
  const anchors: { obj: THREE.Object3D; text: string; color: string }[] = [];
  const records: string[] = [];
  LAB_SEASONS.forEach((season, si) => {
    const games = teamSeason(season, team);
    let w = 0;
    games.forEach((g, i) => {
      const recent = games.slice(Math.max(0, i - 9), i + 1);
      const rate = recent.filter((x) => x.win).length / recent.length;
      const a = (i / LAP) * Math.PI * 2;
      const r = radius(rate);
      const p = new THREE.Vector3(Math.sin(a) * r, si * RISE + (i / LAP) * RISE, Math.cos(a) * r);
      pts.push(p);
      const c = LAB_MAGENTA.clone().lerp(LAB_CYAN, rate);
      cols.push(c.r, c.g, c.b);
      beads.push({ p, win: g.win });
      if (g.win) w += 1;
    });
    records.push(`${season.slice(2)} ${w}-${games.length - w}`);
    const ring = Array.from({ length: 97 }, (_, k) => {
      const a = (k / 96) * Math.PI * 2;
      return new THREE.Vector3(Math.sin(a) * radius(0.5), si * RISE + (k / 96) * RISE, Math.cos(a) * radius(0.5));
    });
    root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring), new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.12 })));
    const o = new THREE.Object3D();
    o.position.set(0, si * RISE + 0.3, radius(1) + 2.5);
    root.add(o);
    anchors.push({ obj: o, text: `${season}  ${w}-${games.length - w}`, color: "#ffffff" });
  });
  const lg = new THREE.BufferGeometry().setFromPoints(pts);
  lg.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  const line = new THREE.Line(lg, new THREE.LineBasicMaterial({ vertexColors: true, toneMapped: false }));
  const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.22, 8, 8), new THREE.MeshBasicMaterial({ toneMapped: false }), beads.length);
  dots.frustumCulled = false;
  const m = new THREE.Matrix4();
  beads.forEach((b, i) => {
    dots.setMatrixAt(i, m.makeTranslation(b.p));
    dots.setColorAt(i, b.win ? LAB_CYAN : LAB_MAGENTA.clone().multiplyScalar(0.55));
  });
  dots.count = 0;
  const axis = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, LAB_SEASONS.length * RISE, 0)]),
    new THREE.LineBasicMaterial({ color: tc, transparent: true, opacity: 0.5 })
  );
  root.add(line, dots, axis);
  return { root, line, dots, total: beads.length, anchors, records };
}

export const LAB_SPIRAL_TEAMS = ["nba-thunder", "nba-celtics", "nba-pistons", "nba-lakers", "nba-spurs", "nba-wizards"].map((id) => [id, abbr(id)] as [string, string]);

export default function Lab3dSpiralSceneNative({ onHud, option, pulse }: LabSceneProps) {
  const labels = useLabels();
  const teamId = option || LAB_SPIRAL_TEAMS[0][0];
  const world = useMemo(() => build(teamId), [teamId]);
  const t = useRef(0);

  useEffect(() => () => disposeTree(world.root), [world]);
  useEffect(() => {
    t.current = 0;
  }, [world, pulse]);
  useEffect(() => {
    const ids = world.anchors.map((a) => labels.add({ obj: a.obj, text: a.text, color: a.color, size: 10, scaleDist: 45 }));
    onHud({ big: `${abbr(teamId)} · ${LAB_SEASONS.length} シーズン`, sub: "1 周＝1 シーズン（下が古い）。外へ広がる＝直近 10 試合の勝率が高い。粒＝1 試合（シアン勝ち）" });
    return () => ids.forEach((id) => labels.remove(id));
  }, [world, labels, onHud, teamId]);

  useFrame((_, dt) => {
    if (t.current >= world.total) return;
    t.current = Math.min(world.total, t.current + frameDt(dt) * 70);
    const n = Math.floor(t.current);
    world.line.geometry.setDrawRange(0, n);
    world.dots.count = n;
  });

  return <primitive object={world.root} />;
}
