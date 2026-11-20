import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import geo from "../demoData/geo.json";
import { abbr, disposeTree, frameDt, glowSprite, LAB_CYAN, LAB_MAGENTA, teamGlowColor, useLabels, useThrottledHud, type LabSceneProps } from "../lab3dKitNative";
import { arenaMiles, dayLabel, LAB_ARENAS, LAB_CURRENT_SEASON, LAB_SEASON_GAMES, LAB_TEAMS, teamIndex, teamSeason } from "../lab3dDataNative";

const ROUTE_SEASON = "2025-26";
const toXZ = (x: number, y: number) => new THREE.Vector3((x - 487.5) / 10, 0, (y - 305) / 10);
const arenaPos = (i: number) => toXZ(LAB_ARENAS[i][2], LAB_ARENAS[i][3]);

function outline(lines: number[][], color: string, opacity: number) {
  const pts: THREE.Vector3[] = [];
  for (const l of lines) for (let i = 0; i + 3 < l.length; i += 2) pts.push(toXZ(l[i], l[i + 1]), toXZ(l[i + 2], l[i + 3]));
  return new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
}

function build() {
  const root = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(140, 100), new THREE.MeshBasicMaterial({ color: "#04070f" }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.05;
  root.add(floor, outline(geo.usOuter, "#00f5ff", 0.75), outline(geo.usInner, "#00f5ff", 0.18));

  const wins = new Array(30).fill(0);
  const losses = new Array(30).fill(0);
  for (const g of LAB_SEASON_GAMES[LAB_CURRENT_SEASON]) {
    if (g[3] < 0) continue;
    const hw = g[3] > g[4];
    wins[hw ? g[0] : g[1]] += 1;
    losses[hw ? g[1] : g[0]] += 1;
  }
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.4, transparent: true, opacity: 1 });
  const pillars = new THREE.InstancedMesh(new THREE.BoxGeometry(1.3, 1, 1.3).translate(0, 0.5, 0), mat, 30);
  pillars.frustumCulled = false;
  const tops: THREE.Object3D[] = [];
  const m = new THREE.Matrix4();
  LAB_TEAMS.forEach((id, i) => {
    const h = 0.4 + wins[i] * 1.1;
    const p = arenaPos(i);
    m.makeScale(1, h, 1).setPosition(p);
    pillars.setMatrixAt(i, m);
    pillars.setColorAt(i, teamGlowColor(id));
    const top = new THREE.Object3D();
    top.position.set(p.x, h + 1.2, p.z);
    root.add(top);
    tops.push(top);
  });
  root.add(pillars, new THREE.AmbientLight("#ffffff", 0.7), new THREE.DirectionalLight("#ffffff", 1.6).translateY(30).translateX(-20));
  return { root, pillars, mat, tops, wins, losses };
}

type Leg = { from: number; to: number; b2b: boolean; start: number; end: number };

export default function Lab3dMapSceneNative({ onHud, option }: LabSceneProps) {
  const labels = useLabels();
  const hud = useThrottledHud(onHud, 6);
  const world = useMemo(build, []);
  const route = useMemo(() => new THREE.Group(), []);
  const st = useRef({ legs: [] as Leg[], line: null as THREE.LineSegments | null, comet: null as THREE.Sprite | null, t: 0, total: 0, games: [] as ReturnType<typeof teamSeason>, curve: [] as THREE.Vector3[][] });

  useEffect(() => () => {
    disposeTree(world.root);
    disposeTree(route);
  }, [world, route]);

  useEffect(() => {
    const s = st.current;
    for (const c of [...route.children]) {
      route.remove(c);
      disposeTree(c);
    }
    s.legs = [];
    s.line = null;
    s.comet = null;
    const team = option ? teamIndex(option) : -1;
    world.mat.opacity = team >= 0 ? 0.22 : 1;
    const ids: number[] = [];
    if (team < 0) {
      LAB_TEAMS.forEach((id, i) => ids.push(labels.add({ obj: world.tops[i], text: abbr(id), color: "#ffffff", size: 10, scaleDist: 150 })));
      const best = LAB_TEAMS.map((id, i) => [id, world.wins[i], world.losses[i]] as const).sort((a, b) => b[1] - a[1])[0];
      onHud({ big: `${LAB_CURRENT_SEASON} の勝ち数`, sub: `柱の高さ＝勝ち数（本拠地の位置）。最多 ${abbr(best[0])} ${best[1]}-${best[2]}` });
      return () => ids.forEach((id) => labels.remove(id));
    }
    const games = teamSeason(ROUTE_SEASON, team);
    s.games = games;
    const pts: THREE.Vector3[] = [];
    const cols: number[] = [];
    let seg = 0;
    s.curve = [];
    for (let i = 1; i < games.length; i += 1) {
      const a = games[i - 1].venue;
      const b = games[i].venue;
      if (a === b) continue;
      const b2b = games[i].day - games[i - 1].day === 1;
      const pa = arenaPos(a);
      const pb = arenaPos(b);
      const h = 2 + pa.distanceTo(pb) * 0.28;
      const c = b2b ? LAB_MAGENTA : LAB_CYAN;
      const curve: THREE.Vector3[] = [];
      for (let k = 0; k <= 24; k += 1) {
        const t = k / 24;
        curve.push(new THREE.Vector3().lerpVectors(pa, pb, t).setY(Math.sin(Math.PI * t) * h + 0.2));
      }
      for (let k = 0; k < 24; k += 1) {
        pts.push(curve[k], curve[k + 1]);
        cols.push(c.r, c.g, c.b, c.r, c.g, c.b);
      }
      s.legs.push({ from: i - 1, to: i, b2b, start: seg, end: seg + 48 });
      s.curve.push(curve);
      seg += 48;
    }
    const lg = new THREE.BufferGeometry().setFromPoints(pts);
    lg.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    lg.setDrawRange(0, 0);
    s.line = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85, toneMapped: false }));
    s.line.frustumCulled = false;
    s.comet = glowSprite("#ffffff", 3, 1);
    const home = glowSprite(teamGlowColor(option), 7, 0.9);
    home.position.copy(arenaPos(team)).setY(0.5);
    route.add(s.line, s.comet, home);
    ids.push(labels.add({ obj: home, text: abbr(option), color: "#ffffff", size: 13 }));
    s.t = 0;
    s.total = 0;
    return () => ids.forEach((id) => labels.remove(id));
  }, [option, world, route, labels, onHud]);

  useFrame((_, dtRaw) => {
    const s = st.current;
    if (!s.line || !s.comet || !s.legs.length) return;
    s.t = (s.t + frameDt(dtRaw) * 2.2) % (s.legs.length + 6);
    const idx = Math.floor(s.t);
    if (idx >= s.legs.length) {
      s.line.geometry.setDrawRange(0, s.legs[s.legs.length - 1].end);
      s.comet.visible = false;
      return;
    }
    const leg = s.legs[idx];
    const f = s.t - Math.floor(s.t);
    s.line.geometry.setDrawRange(0, leg.start + Math.floor(f * 24) * 2);
    const c = s.curve[idx];
    s.comet.visible = true;
    s.comet.position.copy(c[Math.min(24, Math.floor(f * 24))]);
    let miles = 0;
    let b2b = 0;
    for (let i = 0; i <= idx; i += 1) {
      miles += arenaMiles(s.games[s.legs[i].from].venue, s.games[s.legs[i].to].venue);
      if (s.legs[i].b2b) b2b += 1;
    }
    const g = s.games[leg.to];
    hud(
      `${abbr(option)} · ${ROUTE_SEASON} の遠征`,
      `${dayLabel(g.day)} ${g.home ? "vs" : "@"} ${abbr(LAB_TEAMS[g.opp])}（${g.win ? "W" : "L"} ${g.margin > 0 ? "+" : ""}${g.margin}）· 移動 ${Math.round(miles).toLocaleString()} マイル · 連戦の移動 ${b2b} 回（赤）`
    );
  });

  return (
    <group>
      <primitive object={world.root} />
      <primitive object={route} />
    </group>
  );
}
