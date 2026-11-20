import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import { abbr, disposeTree, frameDt, glowSprite, teamGlowColor, useLabels, type LabSceneProps } from "../lab3dKitNative";
import { gamesOnDay, LAB_TEAMS, labPickDays, type LabGame } from "../lab3dDataNative";

const TUBE_R = 3.2;
const BALL_R = 0.42;
const MAX_BALLS = 420;
const GOLD = new THREE.Color("#ffd23f");
const LOSER = new THREE.Color("#2a3140");

const JAR_GAMES: LabGame[] = labPickDays(2)
  .flatMap((d) => gamesOnDay(d))
  .sort((a, b) => b[5] + b[6] - (a[5] + a[6]))
  .slice(0, 4);
export const LAB_JAR_GAMES = JAR_GAMES.map((g, i) => [String(i), `${abbr(LAB_TEAMS[g[1]])}@${abbr(LAB_TEAMS[g[0]])}`] as [string, string]);

/** 筒の中の積み位置（六方に詰めて層を重ねる） */
const SLOTS: THREE.Vector2[] = (() => {
  const out: THREE.Vector2[] = [];
  const s = BALL_R * 2.05;
  for (let y = -4; y <= 4; y += 1)
    for (let x = -4; x <= 4; x += 1) {
      const px = (x + (y % 2 ? 0.5 : 0)) * s;
      const pz = y * s * 0.866;
      if (Math.hypot(px, pz) <= TUBE_R - BALL_R * 1.1) out.push(new THREE.Vector2(px, pz));
    }
  return out;
})();

type Ball = { x: number; z: number; y: number; vy: number; rest: number; spawn: number; side: 0 | 1; done: boolean };

function tube(color: THREE.Color, x: number) {
  const g = new THREE.Group();
  g.position.x = x;
  const h = 14;
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(TUBE_R, TUBE_R, h, 40, 1, true).translate(0, h / 2, 0), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false })));
  for (const y of [0, h]) {
    const ring = Array.from({ length: 65 }, (_, k) => new THREE.Vector3(Math.cos((k / 64) * Math.PI * 2) * TUBE_R, y, Math.sin((k / 64) * Math.PI * 2) * TUBE_R));
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7, toneMapped: false })));
  }
  const label = new THREE.Object3D();
  label.position.y = h + 1.6;
  g.add(label);
  return { g, label };
}

export default function Lab3dJarsSceneNative({ onHud, option, pulse }: LabSceneProps) {
  const labels = useLabels();
  const game = JAR_GAMES[Number(option) || 0];
  const world = useMemo(() => {
    const root = new THREE.Group();
    const hc = teamGlowColor(LAB_TEAMS[game[0]]);
    const ac = teamGlowColor(LAB_TEAMS[game[1]]);
    const away = tube(ac, -5);
    const home = tube(hc, 5);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 48), new THREE.MeshBasicMaterial({ color: "#060a14" }));
    floor.rotation.x = -Math.PI / 2;
    const balls = new THREE.InstancedMesh(new THREE.SphereGeometry(BALL_R, 8, 6), new THREE.MeshLambertMaterial(), MAX_BALLS);
    balls.frustumCulled = false;
    const win = glowSprite(GOLD, 22, 0);
    win.position.set(game[3] > game[4] ? 5 : -5, 6, 0);
    root.add(floor, away.g, home.g, balls, win, new THREE.AmbientLight("#ffffff", 0.6), new THREE.DirectionalLight("#ffffff", 1.5).translateY(20).translateZ(12).translateX(-8));
    return { root, balls, away, home, hc, ac, win };
  }, [game]);
  const st = useRef({ list: [] as Ball[], t: 0, revealed: false });

  useEffect(() => () => disposeTree(world.root), [world]);

  useEffect(() => {
    const [h, a, , , , ph, pa] = game;
    const total = ph + pa;
    const n = Math.min(MAX_BALLS, total);
    const nh = Math.round((n * ph) / Math.max(1, total));
    const sides: (0 | 1)[] = [...Array(nh).fill(1), ...Array(n - nh).fill(0)];
    for (let i = sides.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [sides[i], sides[j]] = [sides[j], sides[i]];
    }
    const filled = [0, 0];
    st.current = {
      t: 0,
      revealed: false,
      list: sides.map((side, i) => {
        const k = filled[side]++;
        const slot = SLOTS[k % SLOTS.length];
        const layer = Math.floor(k / SLOTS.length);
        return { x: (side ? 5 : -5) + slot.x, z: slot.y, y: 22 + Math.random() * 4, vy: 0, rest: BALL_R + layer * BALL_R * 1.75, spawn: (i / n) * 4.5, side, done: false };
      }),
    };
    const m = new THREE.Matrix4();
    st.current.list.forEach((b, i) => {
      world.balls.setMatrixAt(i, m.makeTranslation(b.x, -50, b.z));
      world.balls.setColorAt(i, b.side ? world.hc : world.ac);
    });
    world.balls.count = n;
    world.balls.instanceMatrix.needsUpdate = true;
    if (world.balls.instanceColor) world.balls.instanceColor.needsUpdate = true;
    (world.win.material as THREE.SpriteMaterial).opacity = 0;
    const ids = [
      labels.add({ obj: world.away.label, text: `${abbr(LAB_TEAMS[a])} ${Math.round((pa / Math.max(1, total)) * 100)}%`, color: `#${world.ac.getHexString()}`, size: 14 }),
      labels.add({ obj: world.home.label, text: `${abbr(LAB_TEAMS[h])} ${Math.round((ph / Math.max(1, total)) * 100)}%`, color: `#${world.hc.getHexString()}`, size: 14 }),
    ];
    onHud({ big: `${abbr(LAB_TEAMS[a])} @ ${abbr(LAB_TEAMS[h])}`, sub: `UNITERZ の予想 ${total.toLocaleString()} 件。ボール 1 個＝${(total / Math.max(1, n)).toFixed(1)} 人` });
    return () => ids.forEach((id) => labels.remove(id));
  }, [game, world, labels, onHud, pulse]);

  useFrame((_, dtRaw) => {
    const dt = frameDt(dtRaw);
    const s = st.current;
    s.t += dt;
    const m = new THREE.Matrix4();
    let moving = false;
    s.list.forEach((b, i) => {
      if (b.done || s.t < b.spawn) {
        if (!b.done) moving = true;
        return;
      }
      moving = true;
      b.vy -= 38 * dt;
      b.y += b.vy * dt;
      if (b.y <= b.rest) {
        b.y = b.rest;
        if (Math.abs(b.vy) > 4) b.vy = -b.vy * 0.28;
        else b.done = true;
      }
      world.balls.setMatrixAt(i, m.makeTranslation(b.x, b.y, b.z));
    });
    world.balls.instanceMatrix.needsUpdate = true;
    if (!moving && !s.revealed) {
      s.revealed = true;
      const [h, a, , hs, as, ph, pa] = game;
      const homeWin = hs > as;
      s.list.forEach((b, i) => world.balls.setColorAt(i, (b.side === 1) === homeWin ? GOLD : LOSER));
      if (world.balls.instanceColor) world.balls.instanceColor.needsUpdate = true;
      (world.win.material as THREE.SpriteMaterial).opacity = 0.5;
      const majorityHome = ph >= pa;
      const right = Math.round(((homeWin ? ph : pa) / Math.max(1, ph + pa)) * 100);
      onHud({ big: `結果 ${abbr(LAB_TEAMS[a])} ${as} - ${hs} ${abbr(LAB_TEAMS[h])}`, sub: `${majorityHome === homeWin ? "多数派の的中" : "番狂わせ（少数派の的中）"} · 当たった人 ${right}%（金色）` });
    }
  });

  return <primitive object={world.root} />;
}
