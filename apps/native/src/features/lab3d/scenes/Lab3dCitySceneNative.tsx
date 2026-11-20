import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import games from "../demoData/games.json";
import standings from "../demoData/standings.json";
import { abbr, disposeTree, glowSprite, LAB_CYAN, teamGlowColor, useLabels, useThrottledHud, type LabSceneProps, frameDt } from "../lab3dKitNative";

type G = [string, string, number, number | null, number | null];
const UNIT = 3;

function windowTexture(color: THREE.Color): THREE.DataTexture {
  const W = 64;
  const H = 128;
  const data = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i += 1) data.set([5, 7, 13, 255], i * 4);
  for (let r = 0; r < 16; r += 1) {
    for (let k = 0; k < 6; k += 1) {
      const on = Math.random() < 0.55;
      const a = on ? 0.35 + Math.random() * 0.6 : 0.05;
      const cr = on ? color.r * 255 * a : 255 * a;
      const cg = on ? color.g * 255 * a : 255 * a;
      const cb = on ? color.b * 255 * a : 255 * a;
      for (let y = 4 + r * 8; y < 8 + r * 8; y += 1) for (let x = 4 + k * 10; x < 10 + k * 10; x += 1) data.set([cr, cg, cb, 255], (y * W + x) * 4);
    }
  }
  const t = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  return t;
}

type Tower = { body: THREE.Mesh; roof: THREE.Object3D; beam: THREE.Mesh; halo: THREE.Sprite; tex: THREE.DataTexture; x: number; z: number; h: number; target: number; wins: number; losses: number; streak: number };

const dayKey = (ms: number) => new Date(ms - 5 * 3600e3).toISOString().slice(0, 10);

function build() {
  const root = new THREE.Group();
  const grid = new THREE.GridHelper(400, 100, "#00f5ff", "#0a2440");
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.25;
  root.add(grid);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(4, 120), new THREE.MeshBasicMaterial({ color: LAB_CYAN, transparent: true, opacity: 0.12 }));
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.02;
  root.add(road);
  const anchors: { obj: THREE.Object3D; text: string; color: string; size: number }[] = [];
  for (const [txt, x] of [["EAST", -22], ["WEST", 22]] as const) {
    const a = new THREE.Object3D();
    a.position.set(x, 1.5, 22);
    root.add(a);
    anchors.push({ obj: a, text: txt, color: "#00f5ff", size: 18 });
  }
  const towers: Record<string, Tower> = {};
  (["east", "west"] as const).forEach((conf) => {
    standings[conf].forEach((teamId, i) => {
      const x = (conf === "east" ? -1 : 1) * (6 + (i % 5) * 7);
      const z = 14 - Math.floor(i / 5) * 9;
      const color = teamGlowColor(teamId);
      const tex = windowTexture(color);
      const geo = new THREE.BoxGeometry(4.6, 1, 4.6);
      const body = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex }));
      body.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: color.clone().multiplyScalar(1.3), toneMapped: false })));
      const roof = new THREE.Object3D();
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 60, 8, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      const halo = glowSprite(color, 9, 0);
      root.add(body, roof, beam, halo);
      anchors.push({ obj: roof, text: abbr(teamId), color: color.getStyle(), size: 11 });
      towers[teamId] = { body, roof, beam, halo, tex, x, z, h: 0.4, target: 0.4, wins: 0, losses: 0, streak: 0 };
    });
  });
  const finals = (games as unknown as G[]).filter((g) => g[3] != null && g[4] != null).sort((a, b) => a[2] - b[2]);
  const days = [...new Set(finals.map((g) => dayKey(g[2])))];
  return { root, towers, finals, days, anchors };
}

export default function Lab3dCitySceneNative({ onHud, option, pulse }: LabSceneProps) {
  const labels = useLabels();
  const world = useMemo(build, []);
  const st = useRef({ dayIdx: -1, timer: 0, hold: 0 });
  const hud = useThrottledHud(onHud);
  const speedMs = option === "x5" ? 120 : option === "x2" ? 300 : 700;

  useEffect(() => {
    const ids = world.anchors.map((a) => labels.add({ ...a, scaleDist: 60 }));
    return () => {
      ids.forEach((id) => labels.remove(id));
      disposeTree(world.root);
    };
  }, [labels, world]);

  const reset = () => {
    for (const t of Object.values(world.towers)) Object.assign(t, { wins: 0, losses: 0, streak: 0, target: 0.4 });
    st.current.dayIdx = -1;
    st.current.hold = 0;
  };

  useEffect(() => {
    if (pulse > 0) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulse]);

  useFrame((state, dtRaw) => {
    const dt = frameDt(dtRaw);
    const t = state.clock.elapsedTime;
    const s = st.current;
    s.timer += dt * 1000;
    if (s.dayIdx >= world.days.length - 1) {
      s.hold += dt;
      if (s.hold > 4) reset();
    } else if (s.timer > speedMs) {
      s.timer = 0;
      s.dayIdx += 1;
      const d = world.days[s.dayIdx];
      for (const g of world.finals) {
        if (dayKey(g[2]) !== d) continue;
        const homeWin = (g[3] ?? 0) > (g[4] ?? 0);
        for (const [id, win] of [[g[0], homeWin], [g[1], !homeWin]] as const) {
          const tw = world.towers[id];
          if (!tw) continue;
          if (win) tw.wins += 1;
          else tw.losses += 1;
          tw.streak = win ? Math.max(1, tw.streak + 1) : Math.min(-1, tw.streak - 1);
          tw.target = 0.4 + tw.wins * UNIT;
        }
      }
    }
    let leader: [string, Tower] | null = null;
    const hot: string[] = [];
    for (const [id, tw] of Object.entries(world.towers)) {
      tw.h += (tw.target - tw.h) * Math.min(1, dt * 4);
      tw.body.scale.y = tw.h;
      tw.body.position.set(tw.x, tw.h / 2, tw.z);
      tw.tex.repeat.set(1, Math.max(0.2, tw.h / 6));
      tw.roof.position.set(tw.x, tw.h + 1.6, tw.z);
      const isHot = tw.streak >= 3;
      const bm = tw.beam.material as THREE.MeshBasicMaterial;
      bm.opacity += ((isHot ? 0.35 + Math.sin(t * 6) * 0.1 : 0) - bm.opacity) * 0.1;
      tw.beam.position.set(tw.x, tw.h + 30, tw.z);
      (tw.halo.material as THREE.SpriteMaterial).opacity = isHot ? 0.8 : 0;
      tw.halo.position.set(tw.x, tw.h + 0.4, tw.z);
      if (!leader || tw.wins > leader[1].wins) leader = [id, tw];
      if (isHot) hot.push(`${abbr(id)} ${tw.streak}連勝`);
    }
    const d = s.dayIdx < 0 ? "OPENING" : world.days[s.dayIdx];
    const l = leader as [string, Tower] | null;
    hud(d, `首位 ${l ? `${abbr(l[0])} ${l[1].wins}-${l[1].losses}` : "-"}${hot.length ? `\n🔥 ${hot.join(" · ")}` : ""}`);
  });

  return <primitive object={world.root} />;
}
