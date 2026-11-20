import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import teamStats from "../demoData/teamStats.json";
import { abbr, disposeTree, glowSprite, starfield, teamGlowColor, useLabels, type LabSceneProps, frameDt } from "../lab3dKitNative";

type Row = (typeof teamStats)[number];
type Key = Exclude<keyof Row, "teamId">;
const METRICS: [Key, string, boolean][] = [
  ["ortg", "ORTG", true],
  ["drtg", "DRTG", false],
  ["efgPct", "eFG%", true],
  ["fg3Pct", "3P%", true],
  ["tovPct", "TOV%", false],
  ["orebPct", "OREB%", true],
  ["ftaRate", "FT RATE", true],
  ["oppEfgPct", "OPP eFG%", false],
];

function pct(row: Row, [key, , hi]: [Key, string, boolean]) {
  const sorted = teamStats.map((r) => r[key] ?? 0).sort((a, b) => a - b);
  const v = row[key] ?? 0;
  const i = sorted.findIndex((x) => x >= v);
  const p = (i < 0 ? sorted.length - 1 : i) / Math.max(1, sorted.length - 1);
  return hi ? p : 1 - p;
}
const fmt = (key: Key, v: number | null) => (v == null ? "-" : key.endsWith("Pct") || key === "ftaRate" ? (v * 100).toFixed(1) : v.toFixed(1));

function half(radii: number[], color: THREE.Color, up: boolean) {
  const n = radii.length;
  const H = up ? 9 : -9;
  const pos: number[] = [];
  for (let i = 0; i < n; i += 1) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 1) / n) * Math.PI * 2;
    const v0 = [Math.cos(a0) * radii[i], 0, Math.sin(a0) * radii[i]];
    const v1 = [Math.cos(a1) * radii[(i + 1) % n], 0, Math.sin(a1) * radii[(i + 1) % n]];
    if (up) pos.push(0, H, 0, ...v1, ...v0);
    else pos.push(0, H, 0, ...v0, ...v1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  const grp = new THREE.Group();
  grp.add(
    new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.1, flatShading: true, transparent: true, opacity: 0.45, roughness: 0.2, metalness: 0.3, side: THREE.DoubleSide })),
    new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color, toneMapped: false }))
  );
  const tip = glowSprite(color, 3, 0.55);
  tip.position.y = H * 1.05;
  grp.add(tip);
  return grp;
}

function build(key: string) {
  const [homeId, awayId] = key.split("|");
  const root = new THREE.Group();
  root.add(starfield(1200, 600, 2.5));
  root.add(new THREE.AmbientLight("#ffffff", 0.25));
  const l1 = new THREE.PointLight("#ffffff", 220, 0, 1.5);
  l1.position.set(20, 25, 20);
  const l2 = new THREE.PointLight("#8a2cff", 260, 0, 1.5);
  l2.position.set(-20, -20, -10);
  root.add(l1, l2);
  const crystal = new THREE.Group();
  root.add(crystal);
  const home = teamStats.find((r) => r.teamId === homeId)!;
  const away = teamStats.find((r) => r.teamId === awayId)!;
  const hc = teamGlowColor(homeId);
  const ac = teamGlowColor(awayId);
  const rh = METRICS.map((m) => 2 + pct(home, m) * 9);
  const ra = METRICS.map((m) => 2 + pct(away, m) * 9);
  const top = half(rh, hc, true);
  const bottom = half(ra, ac, false);
  crystal.add(top, bottom);
  const anchors: { obj: THREE.Object3D; text: string; color: string; size: number }[] = [];
  let edgeH = 0;
  let edgeA = 0;
  const spokes: THREE.Vector3[] = [];
  METRICS.forEach((m, i) => {
    const a = (i / METRICS.length) * Math.PI * 2;
    const winH = pct(home, m) >= pct(away, m);
    if (winH) edgeH += 1;
    else edgeA += 1;
    const R = Math.max(rh[i], ra[i]);
    spokes.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(Math.cos(a) * 12.5, 0, Math.sin(a) * 12.5));
    const spark = glowSprite(winH ? hc : ac, 1.8, 0.8);
    spark.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
    crystal.add(spark);
    const anchor = new THREE.Object3D();
    anchor.position.set(Math.cos(a) * 14, 0.6, Math.sin(a) * 14);
    crystal.add(anchor);
    anchors.push({ obj: anchor, text: `${m[1]} ${fmt(m[0], home[m[0]])} / ${fmt(m[0], away[m[0]])}`, color: (winH ? hc : ac).getStyle(), size: 10 });
  });
  crystal.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(spokes), new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.15 })));
  const ring = new THREE.Mesh(new THREE.RingGeometry(12.4, 12.6, 96), new THREE.MeshBasicMaterial({ color: "#00f5ff", side: THREE.DoubleSide, transparent: true, opacity: 0.4 }));
  ring.rotation.x = Math.PI / 2;
  crystal.add(ring);
  const ah = new THREE.Object3D();
  ah.position.y = 12;
  const aa = new THREE.Object3D();
  aa.position.y = -12;
  crystal.add(ah, aa);
  anchors.push({ obj: ah, text: abbr(homeId), color: hc.getStyle(), size: 20 }, { obj: aa, text: abbr(awayId), color: ac.getStyle(), size: 20 });
  return { root, crystal, top, bottom, anchors, homeId, awayId, edgeH, edgeA };
}

export const LAB_CRYSTAL_MATCHUPS: [string, string][] = [
  ["nba-spurs|nba-thunder", "SAS-OKC"],
  ["nba-lakers|nba-nuggets", "LAL-DEN"],
  ["nba-celtics|nba-76ers", "BOS-PHI"],
  ["nba-warriors|nba-rockets", "GSW-HOU"],
];

export default function Lab3dCrystalSceneNative({ onHud, option }: LabSceneProps) {
  const labels = useLabels();
  const world = useMemo(() => build(option), [option]);

  useEffect(() => {
    const ids = world.anchors.map((a) => labels.add(a));
    onHud({ big: `${abbr(world.homeId)} vs ${abbr(world.awayId)}`, sub: `8 指標の勝ち越し ${abbr(world.homeId)} ${world.edgeH} - ${world.edgeA} ${abbr(world.awayId)}` });
    return () => {
      ids.forEach((id) => labels.remove(id));
      disposeTree(world.root);
    };
  }, [labels, world, onHud]);

  useFrame((state, dtRaw) => {
    const t = state.clock.elapsedTime;
    world.top.position.y = 0.3 + Math.sin(t * 1.2) * 0.25;
    world.bottom.position.y = -0.3 - Math.sin(t * 1.2) * 0.25;
    world.crystal.rotation.y += frameDt(dtRaw) * 0.05;
  });

  return <primitive object={world.root} />;
}
