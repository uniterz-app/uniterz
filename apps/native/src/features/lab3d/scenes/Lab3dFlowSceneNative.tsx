import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import { abbr, disposeTree, frameDt, glowSprite, glowTexture, LAB_CYAN, starfield, teamGlowColor, useLabels, type LabSceneProps } from "../lab3dKitNative";
import { dayLabel, gamesOnDay, LAB_TEAMS, labPickDays } from "../lab3dDataNative";

export const LAB_FLOW_DAYS = labPickDays(3).map((d) => [String(d), dayLabel(d)] as [string, string]);
const N = 1400;
const GOLD = new THREE.Color("#ffd23f");
const GREY = new THREE.Color("#4a5366");
const SRC = new THREE.Vector3(0, 21, 0);
const HIT = new THREE.Vector3(-9, -17, 0);
const MISS = new THREE.Vector3(9, -17, 0);
const GAME_Y = 7;
const SPLIT_Y = -4;

/** 縦に流れる 3 次ベジェ（制御点は y の中点で、x・z は両端のまま） */
const bez = (a: THREE.Vector3, b: THREE.Vector3, t: number, out: THREE.Vector3) => {
  const my = (a.y + b.y) / 2;
  const u = 1 - t;
  const w0 = u * u * u;
  const w1 = 3 * u * u * t;
  const w2 = 3 * u * t * t;
  const w3 = t * t * t;
  out.x = (w0 + w1) * a.x + (w2 + w3) * b.x;
  out.y = w0 * a.y + (w1 + w2) * my + w3 * b.y;
  out.z = (w0 + w1) * a.z + (w2 + w3) * b.z;
  return out;
};

function build(day: number) {
  const games = gamesOnDay(day).sort((a, b) => b[5] + b[6] - (a[5] + a[6]));
  const root = new THREE.Group();
  root.add(starfield(1200, 700, 2.5, 0.5));
  const anchors: { obj: THREE.Object3D; text: string; color: string; size: number }[] = [];
  const node = (p: THREE.Vector3, c: THREE.Color, s: number, text: string, size: number, dy: number) => {
    const g = glowSprite(c, s, 0.9);
    g.position.copy(p);
    root.add(g);
    const o = new THREE.Object3D();
    o.position.copy(p).setY(p.y + dy);
    root.add(o);
    anchors.push({ obj: o, text, color: `#${c.getHexString()}`, size });
  };
  const total = games.reduce((a, g) => a + g[5] + g[6], 0);
  let hits = 0;
  let majorityRight = 0;
  const nodes = games.map((g, i) => {
    const x = ((i + 0.5) / games.length - 0.5) * 32;
    const gp = new THREE.Vector3(x, GAME_Y, 0);
    const homeWin = g[3] > g[4];
    const sum = Math.max(1, g[5] + g[6]);
    hits += homeWin ? g[5] : g[6];
    if (homeWin === g[5] >= g[6]) majorityRight += 1;
    const hc = teamGlowColor(LAB_TEAMS[g[0]]);
    const ac = teamGlowColor(LAB_TEAMS[g[1]]);
    const hp = new THREE.Vector3(x + 1, SPLIT_Y, gp.z);
    const ap = new THREE.Vector3(x - 1, SPLIT_Y, gp.z);
    node(gp, new THREE.Color("#ffffff"), 2.2, `${abbr(LAB_TEAMS[g[1]])}@${abbr(LAB_TEAMS[g[0]])}`, 8, i % 2 ? 4.2 : 2.2);
    const winner = LAB_TEAMS[homeWin ? g[0] : g[1]];
    const right = Math.round(((homeWin ? g[5] : g[6]) / sum) * 100);
    const lab = new THREE.Object3D();
    lab.position.set(x, SPLIT_Y - (i % 2 ? 3.8 : 1.8), gp.z);
    root.add(lab);
    anchors.push({ obj: lab, text: `${abbr(winner)}✓${right}%`, color: right >= 50 ? "#ffd23f" : "#ff2bd6", size: 8 });
    return { g, gp, hp, ap, hc, ac, homeWin };
  });
  node(SRC, LAB_CYAN, 7, "UNITERZ", 14, -3.4);
  node(HIT, GOLD, 8, `的中 ${Math.round((hits / Math.max(1, total)) * 100)}%`, 14, 3.4);
  node(MISS, GREY.clone().multiplyScalar(2), 6, "外れ", 12, 3.4);

  const weights = nodes.map((n) => n.g[5] + n.g[6]);
  const wsum = weights.reduce((a, b) => a + b, 0) || 1;
  const parts = Array.from({ length: N }, () => {
    let r = Math.random() * wsum;
    let gi = 0;
    while (gi < nodes.length - 1 && r > weights[gi]) r -= weights[gi++];
    const n = nodes[gi];
    const home = Math.random() < n.g[5] / Math.max(1, n.g[5] + n.g[6]);
    return { n, home, hit: home === n.homeWin, t: Math.random(), speed: 0.1 + Math.random() * 0.04, j: new THREE.Vector3((Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.9) };
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(N * 3), 3).setUsage(THREE.DynamicDrawUsage));
  const points = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.7, map: glowTexture(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  points.frustumCulled = false;
  root.add(points);
  return { root, anchors, parts, points, games: games.length, total, hits, majorityRight };
}

export default function Lab3dFlowSceneNative({ onHud, option }: LabSceneProps) {
  const labels = useLabels();
  const day = Number(option || LAB_FLOW_DAYS[0]?.[0]);
  const world = useMemo(() => build(day), [day]);

  useEffect(() => () => disposeTree(world.root), [world]);
  useEffect(() => {
    const ids = world.anchors.map((a) => labels.add({ obj: a.obj, text: a.text, color: a.color, size: a.size }));
    onHud({
      big: `${dayLabel(day)} · 予想 ${world.total.toLocaleString()} 件`,
      sub: `多数派が当たった試合 ${world.majorityRight}/${world.games} · 全体の的中 ${Math.round((world.hits / Math.max(1, world.total)) * 100)}%。試合の下＝勝ったチームと、それを選んだ人の割合`,
    });
    return () => ids.forEach((id) => labels.remove(id));
  }, [world, labels, onHud, day]);

  useFrame((_, dtRaw) => {
    const dt = frameDt(dtRaw);
    const pos = world.points.geometry.attributes.position as THREE.BufferAttribute;
    const col = world.points.geometry.attributes.color as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    world.parts.forEach((p, i) => {
      p.t = (p.t + dt * p.speed) % 1;
      const side = p.home ? p.n.hp : p.n.ap;
      let c: THREE.Color;
      if (p.t < 0.35) {
        bez(SRC, p.n.gp, p.t / 0.35, v);
        c = LAB_CYAN;
      } else if (p.t < 0.65) {
        bez(p.n.gp, side, (p.t - 0.35) / 0.3, v);
        c = p.home ? p.n.hc : p.n.ac;
      } else {
        bez(side, p.hit ? HIT : MISS, (p.t - 0.65) / 0.35, v);
        c = p.hit ? GOLD : GREY;
      }
      v.add(p.j);
      pos.setXYZ(i, v.x, v.y, v.z);
      col.setXYZ(i, c.r, c.g, c.b);
    });
    pos.needsUpdate = true;
    col.needsUpdate = true;
  });

  return <primitive object={world.root} />;
}
