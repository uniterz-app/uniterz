import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import network from "../demoData/network.json";
import { abbr, disposeTree, glowPoints, glowTexture, starfield, teamGlowColor, updateGlowPointsScale, useLabels, useLabTap, type LabSceneProps } from "../lab3dKitNative";
import { LAB_TEAMS, teamIndex } from "../lab3dDataNative";

/** [名前, 今のチーム, 得点, 在籍したチーム（古い順）, 位置] */
type NetPlayer = [string, number, number, number[], [number, number, number]];
const S = 0.35;
const PLAYERS = (network.players as unknown as NetPlayer[]).map((p) => [p[0], p[1], p[2], p[3], p[4].map((v) => v * S)] as NetPlayer);
const TEAM_POS = (network.teamPos as number[][]).map((p) => new THREE.Vector3(p[0], p[1], p[2]).multiplyScalar(S));
export const LAB_NETWORK_TEAMS: [string, string][] = [["", "ALL"], ...["nba-lakers", "nba-celtics", "nba-thunder", "nba-spurs", "nba-heat"].map((id) => [id, abbr(id)] as [string, string])];

function build() {
  const root = new THREE.Group();
  root.add(starfield(1500, 800, 2.5, 0.5));
  const pts: THREE.Vector3[] = [];
  const owner: number[] = [];
  PLAYERS.forEach((p, i) => {
    const pp = new THREE.Vector3(...p[4]);
    for (const t of p[3]) {
      pts.push(pp, TEAM_POS[t]);
      owner.push(i);
    }
  });
  const eg = new THREE.BufferGeometry().setFromPoints(pts);
  eg.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array(pts.length * 3), 3));
  const edges = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  const glows = glowPoints(PLAYERS.length + 30);
  const gp = glows.geometry.attributes.position as THREE.BufferAttribute;
  const gc = glows.geometry.attributes.aColor as THREE.BufferAttribute;
  const gs = glows.geometry.attributes.aSize as THREE.BufferAttribute;
  PLAYERS.forEach((p, i) => {
    const c = teamGlowColor(LAB_TEAMS[p[1]]);
    gp.setXYZ(i, ...p[4]);
    gc.setXYZ(i, c.r, c.g, c.b);
    gs.setX(i, 0.7 + p[2] * 0.07);
  });
  const cores = new THREE.InstancedMesh(new THREE.SphereGeometry(0.9, 16, 12), new THREE.MeshBasicMaterial({ toneMapped: false }), 30);
  cores.frustumCulled = false;
  const m = new THREE.Matrix4();
  const anchors: THREE.Object3D[] = [];
  LAB_TEAMS.forEach((id, t) => {
    const c = teamGlowColor(id);
    const k = PLAYERS.length + t;
    gp.setXYZ(k, TEAM_POS[t].x, TEAM_POS[t].y, TEAM_POS[t].z);
    gc.setXYZ(k, c.r, c.g, c.b);
    gs.setX(k, 6);
    cores.setMatrixAt(t, m.makeTranslation(TEAM_POS[t]));
    cores.setColorAt(t, c);
    const a = new THREE.Object3D();
    a.position.copy(TEAM_POS[t]).setY(TEAM_POS[t].y + 1.8);
    root.add(a);
    anchors.push(a);
  });
  const dots = new THREE.Points(
    new THREE.BufferGeometry().setFromPoints(PLAYERS.map((p) => new THREE.Vector3(...p[4]))),
    new THREE.PointsMaterial({ color: "#ffffff", size: 0.35, map: glowTexture(), transparent: true, depthWrite: false, toneMapped: false })
  );
  root.add(edges, glows, cores, dots);
  return { root, edges, owner, glows, anchors };
}

export default function Lab3dNetworkSceneNative({ onHud, option }: LabSceneProps) {
  const labels = useLabels();
  const world = useMemo(build, []);
  const focus = useRef(-1);

  useEffect(() => () => disposeTree(world.root), [world]);

  useEffect(() => {
    const team = option ? teamIndex(option) : -1;
    const col = world.edges.geometry.attributes.color as THREE.BufferAttribute;
    const alpha = world.glows.geometry.attributes.aAlpha as THREE.BufferAttribute;
    const member = PLAYERS.map((p) => team < 0 || p[3].includes(team));
    world.owner.forEach((pi, e) => {
      const p = PLAYERS[pi];
      const c = teamGlowColor(LAB_TEAMS[p[1]]).multiplyScalar(team < 0 ? 0.13 : member[pi] ? 0.9 : 0.02);
      col.setXYZ(e * 2, c.r, c.g, c.b);
      col.setXYZ(e * 2 + 1, c.r, c.g, c.b);
    });
    col.needsUpdate = true;
    PLAYERS.forEach((_, i) => alpha.setX(i, member[i] ? 0.75 : 0.06));
    for (let t = 0; t < 30; t += 1) alpha.setX(PLAYERS.length + t, team < 0 || t === team ? 0.55 : 0.12);
    alpha.needsUpdate = true;
    focus.current = team;
    const ids = LAB_TEAMS.map((id, t) => labels.add({ obj: world.anchors[t], text: abbr(id), color: team < 0 || t === team ? "#ffffff" : "rgba(255,255,255,0.35)", size: t === team ? 14 : 9, scaleDist: 120 }));
    if (team < 0) {
      const multi = PLAYERS.filter((p) => p[3].length >= 3).length;
      onHud({ big: `${PLAYERS.length} 人 × 30 チーム`, sub: `今の主力と、在籍したことがあるチームを線で結ぶ。3 チーム以上を渡った選手 ${multi} 人がリーグをつなぐ` });
    } else {
      const ever = PLAYERS.filter((p) => p[3].includes(team));
      const now = ever.filter((p) => p[1] === team).length;
      onHud({ big: `${abbr(option)} を通った選手 ${ever.length} 人`, sub: `今もいる ${now} 人 · ほかのチームへ散った ${ever.length - now} 人。星をタップで経歴` });
    }
    return () => ids.forEach((id) => labels.remove(id));
  }, [option, world, labels, onHud]);

  useLabTap((tap, camera, size) => {
    const v = new THREE.Vector3();
    let best = -1;
    let bestD = 28;
    PLAYERS.forEach((p, i) => {
      if (focus.current >= 0 && !p[3].includes(focus.current)) return;
      v.set(...p[4]).project(camera);
      const d = Math.hypot(((v.x + 1) / 2) * size.width - tap.x, ((1 - v.y) / 2) * size.height - tap.y);
      if (v.z < 1 && d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best < 0) return;
    const p = PLAYERS[best];
    onHud({ big: p[0], sub: `${p[3].map((t) => abbr(LAB_TEAMS[t])).join(" → ")} · ${p[2]} 点` });
  });

  useFrame((state) => updateGlowPointsScale(world.glows, state.camera, state.size.height * state.viewport.dpr));

  return <primitive object={world.root} />;
}
