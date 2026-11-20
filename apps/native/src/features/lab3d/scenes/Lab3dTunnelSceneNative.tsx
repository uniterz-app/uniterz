import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber/native";
import * as THREE from "three";
import games from "../demoData/games.json";
import { abbr, disposeTree, glowSprite, glowTexture, LAB_CYAN, LAB_MAGENTA, teamGlowColor, useLabels, useThrottledHud, type LabSceneProps, frameDt } from "../lab3dKitNative";

/** [home, away, startMs, homeScore, awayScore] */
type G = [string, string, number, number | null, number | null];
const GAMES = games as unknown as G[];
const GAP = 16;

type Item = { z: number; rec: string | null };

function build(teamId: string) {
  const root = new THREE.Group();
  const anchors: { obj: THREE.Object3D; text: string; color: string; size: number }[] = [];
  const tc = teamGlowColor(teamId);
  const mine = GAMES.filter((g) => g[0] === teamId || g[1] === teamId).sort((a, b) => a[2] - b[2]);
  let w = 0;
  let l = 0;
  let todayZ = 0;
  const items: Item[] = mine.map((g, i) => {
    const home = g[0] === teamId;
    const opp = home ? g[1] : g[0];
    const z = -i * GAP;
    if (g[3] != null && g[4] != null) {
      const me = home ? g[3] : g[4];
      const op = home ? g[4] : g[3];
      const win = me > op;
      if (win) w += 1;
      else l += 1;
      const margin = Math.abs(me - op);
      const color = win ? LAB_CYAN : LAB_MAGENTA;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(9, 0.05 + margin * 0.012, 10, 96), new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(0.9), toneMapped: false }));
      ring.position.z = z;
      root.add(ring);
      const halo = new THREE.Mesh(new THREE.TorusGeometry(9, 0.35 + margin * 0.03, 8, 96), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
      halo.position.z = z;
      root.add(halo);
      const pts: THREE.Vector3[] = [];
      const n = 18 + margin * 2;
      for (let k = 0; k < n; k += 1) {
        const a = (k / n) * Math.PI * 2;
        const len = 0.6 + Math.random() * margin * 0.12;
        pts.push(new THREE.Vector3(Math.cos(a) * 9, Math.sin(a) * 9, z), new THREE.Vector3(Math.cos(a) * (9 + len), Math.sin(a) * (9 + len), z));
      }
      root.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45 })));
      const anchor = new THREE.Object3D();
      anchor.position.set(0, 11.6, z);
      root.add(anchor);
      anchors.push({ obj: anchor, text: `${win ? "W" : "L"} ${me}-${op} ${home ? "vs" : "@"} ${abbr(opp)}`, color: win ? "#00f5ff" : "#ff2bd6", size: 13 });
      todayZ = z;
      return { z, rec: `${w}-${l}` };
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(9, 0.06, 6, 64), new THREE.MeshBasicMaterial({ color: tc.clone().multiplyScalar(0.35), transparent: true, opacity: 0.5 }));
    ring.position.z = z;
    root.add(ring);
    if (i % 4 === 0) {
      const anchor = new THREE.Object3D();
      anchor.position.set(0, 10.6, z);
      root.add(anchor);
      anchors.push({ obj: anchor, text: `${home ? "vs" : "@"} ${abbr(opp)}`, color: "rgba(255,255,255,0.4)", size: 10 });
    }
    return { z, rec: null };
  });
  const gate = new THREE.Mesh(new THREE.TorusGeometry(11, 0.25, 8, 6), new THREE.MeshBasicMaterial({ color: tc.clone().multiplyScalar(1.4), toneMapped: false }));
  gate.position.z = todayZ - GAP / 2;
  gate.rotation.z = Math.PI / 6;
  root.add(gate);
  const nowAnchor = new THREE.Object3D();
  nowAnchor.position.set(0, -13, todayZ - GAP / 2);
  root.add(nowAnchor);
  anchors.push({ obj: nowAnchor, text: "NOW", color: "#ffffff", size: 16 });
  const core = glowSprite(tc, 30, 0.5);
  core.position.z = -(items.length + 2) * GAP;
  root.add(core);

  const n = 2000;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const r = 12 + Math.random() * 30;
    pos.set([Math.cos(a) * r, Math.sin(a) * r, 30 - Math.random() * 400], i * 3);
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: "#6fdcff", size: 0.8, map: glowTexture(), transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  root.add(dust);
  return { root, items, todayZ, gate, dust, anchors, w, l, tc };
}

export default function Lab3dTunnelSceneNative({ onHud, option }: LabSceneProps) {
  const labels = useLabels();
  const camera = useThree((s) => s.camera);
  const world = useMemo(() => build(option), [option]);
  const motion = useMemo(() => ({ camZ: 30, speed: 0 }), [option]);
  const hud = useThrottledHud(onHud);

  useEffect(() => {
    const ids = world.anchors.map((a) => labels.add({ ...a, scaleDist: 22 }));
    return () => {
      ids.forEach((id) => labels.remove(id));
      disposeTree(world.root);
    };
  }, [labels, world]);

  useFrame((state, dtRaw) => {
    const dt = frameDt(dtRaw);
    const t = state.clock.elapsedTime;
    const { items, todayZ } = world;
    const endZ = -(items.length - 1) * GAP;
    const nearToday = motion.camZ < todayZ + 30 && motion.camZ > todayZ - 40;
    const target = nearToday ? 6 : motion.camZ > todayZ ? 38 : 70;
    motion.speed += (target - motion.speed) * Math.min(1, dt * 1.5);
    motion.camZ -= motion.speed * dt;
    if (motion.camZ < endZ - 20) motion.camZ = 30;
    camera.position.set(Math.sin(t * 0.4) * 1.4, Math.cos(t * 0.3), motion.camZ);
    camera.lookAt(Math.sin(t * 0.4 + 0.3), 0, motion.camZ - 40);
    camera.rotation.z += Math.sin(t * 0.2) * 0.05;
    world.gate.rotation.z += dt * 0.6;
    const dp = world.dust.geometry.attributes.position as THREE.BufferAttribute;
    for (let k = 0; k < dp.count; k += 1) {
      const z = dp.getZ(k);
      if (z > motion.camZ + 10) dp.setZ(k, z - 400);
      else if (z < motion.camZ - 390) dp.setZ(k, z + 400);
    }
    dp.needsUpdate = true;
    const cur = items.find((x) => x.z <= motion.camZ) ?? items[items.length - 1];
    const i = items.indexOf(cur);
    const done = items.filter((x) => x.rec).length;
    hud(`${abbr(option)}  ${world.w}-${world.l}`, `GAME ${i + 1} · ${cur?.rec ?? "まだ"} · 消化 ${done}/${items.length}`);
  });

  return <primitive object={world.root} />;
}
