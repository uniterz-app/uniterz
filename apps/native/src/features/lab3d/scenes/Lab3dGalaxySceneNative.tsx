import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import players from "../demoData/players.json";
import {
  abbr,
  disposeTree,
  glowPoints,
  glowTexture,
  updateGlowPointsScale,
  LAB_CYAN,
  starfield,
  teamGlowColor,
  useLabels,
  useLabTap,
  type LabSceneProps,
  frameDt,
} from "../lab3dKitNative";

type P = (typeof players)[number];
const S = 38;

function zNorm(key: "p3" | "usg" | "def") {
  const vals = players.map((p) => p[key]).filter((v): v is number => typeof v === "number");
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length) || 1;
  return (v: number | null) => (typeof v === "number" ? Math.max(-2.6, Math.min(2.6, (v - mean) / sd)) : 0);
}

function build() {
  const root = new THREE.Group();
  root.add(starfield(2500, 1400, 3));

  const n = 7000;
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const arms = [new THREE.Color("#00f5ff"), new THREE.Color("#8a2cff"), new THREE.Color("#ff2bd6")];
  for (let i = 0; i < n; i += 1) {
    const arm = i % 3;
    const r = Math.pow(Math.random(), 0.7) * 260 + 20;
    const a = arm * ((Math.PI * 2) / 3) + r * 0.018 + (Math.random() - 0.5) * 0.6;
    pos.set([Math.cos(a) * r + (Math.random() - 0.5) * 14, (Math.random() - 0.5) * (18 - r * 0.04), Math.sin(a) * r + (Math.random() - 0.5) * 14], i * 3);
    const c = arms[arm].clone().lerp(new THREE.Color("#ffffff"), Math.random() * 0.2);
    col.set([c.r, c.g, c.b], i * 3);
  }
  const cg = new THREE.BufferGeometry();
  cg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  cg.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const cloud = new THREE.Points(
    cg,
    new THREE.PointsMaterial({ size: 3, map: glowTexture(), vertexColors: true, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })
  );
  cloud.position.y = -95;
  cloud.rotation.x = 0.12;
  root.add(cloud);

  const galaxy = new THREE.Group();
  root.add(galaxy);
  const axisMat = new THREE.LineBasicMaterial({ color: LAB_CYAN, transparent: true, opacity: 0.3 });
  const axisAnchors: { obj: THREE.Object3D; text: string; color: string }[] = [];
  const AX: [THREE.Vector3, string, string][] = [
    [new THREE.Vector3(1, 0, 0), "OUTSIDE", "INSIDE"],
    [new THREE.Vector3(0, 1, 0), "CREATOR", "ROLE"],
    [new THREE.Vector3(0, 0, 1), "ACTIVE D", "QUIET D"],
  ];
  for (const [dir, hi, lo] of AX) {
    const v = dir.clone().multiplyScalar(S * 2.8);
    galaxy.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([v.clone().negate(), v]), axisMat));
    const a = new THREE.Object3D();
    a.position.copy(v.clone().multiplyScalar(1.08));
    const b = new THREE.Object3D();
    b.position.copy(v.clone().multiplyScalar(-1.08));
    galaxy.add(a, b);
    axisAnchors.push({ obj: a, text: hi, color: "#00f5ff" }, { obj: b, text: lo, color: "rgba(0,245,255,0.6)" });
  }

  const nx = zNorm("p3");
  const ny = zNorm("usg");
  const nz = zNorm("def");
  const ptsMax = Math.max(...players.map((p) => p.pts ?? 0));
  const cores = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 12), new THREE.MeshBasicMaterial({ toneMapped: false }), players.length);
  const glows = glowPoints(players.length);
  cores.frustumCulled = false;
  galaxy.add(cores, glows);
  const gPos = glows.geometry.attributes.position as THREE.BufferAttribute;
  const gCol = glows.geometry.attributes.aColor as THREE.BufferAttribute;
  const stars = players.map((p, i) => {
    const color = teamGlowColor(p.teamId);
    const k = (p.pts ?? 0) / ptsMax;
    const node = new THREE.Object3D();
    node.position.set(nx(p.p3) * S, ny(p.usg) * S, nz(p.def) * S);
    galaxy.add(node);
    cores.setColorAt(i, color.clone().multiplyScalar(1.2));
    gPos.setXYZ(i, node.position.x, node.position.y, node.position.z);
    gCol.setXYZ(i, color.r, color.g, color.b);
    const anchor = new THREE.Object3D();
    anchor.position.y = 4 + k * 3;
    node.add(anchor);
    return { node, p, k, phase: Math.random() * 6.28, anchor, radius: 0.5 + k * 1.8 };
  });
  return { root, cloud, galaxy, stars, axisAnchors, cores, glows };
}

export default function Lab3dGalaxySceneNative({ onHud, option }: LabSceneProps) {
  const labels = useLabels();
  const world = useMemo(build, []);
  const links = useRef<THREE.LineSegments | null>(null);
  const selected = useRef<P | null>(null);

  useEffect(() => () => disposeTree(world.root), [world]);

  useEffect(() => {
    const ids = [
      ...world.axisAnchors.map((a) => labels.add({ obj: a.obj, text: a.text, color: a.color, size: 10 })),
      ...world.stars.filter((s) => s.k > 0.72).map((s) => labels.add({ obj: s.anchor, text: s.p.name, color: "#ffffff", size: 10 })),
    ];
    return () => ids.forEach((id) => labels.remove(id));
  }, [labels, world]);

  useEffect(() => {
    if (links.current) {
      world.galaxy.remove(links.current);
      disposeTree(links.current);
      links.current = null;
    }
    selected.current = null;
    const m = new THREE.Matrix4();
    world.stars.forEach((s, i) => {
      s.node.visible = !option || s.p.teamId === option;
      const r = s.node.visible ? s.radius : 0;
      m.makeScale(r, r, r).setPosition(s.node.position);
      world.cores.setMatrixAt(i, m);
    });
    world.cores.instanceMatrix.needsUpdate = true;
    if (world.cores.instanceColor) world.cores.instanceColor.needsUpdate = true;
    if (!option) {
      onHud({ big: `${world.stars.length} STARS`, sub: "星をタップで選手カード" });
      return;
    }
    const mine = world.stars.filter((s) => s.node.visible);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < mine.length; i += 1) for (let j = i + 1; j < mine.length; j += 1) pts.push(mine[i].node.position, mine[j].node.position);
    links.current = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: teamGlowColor(option), transparent: true, opacity: 0.4 }));
    world.galaxy.add(links.current);
    onHud({ big: abbr(option), sub: `チームの星座 — ${mine.length} 人の位置関係` });
  }, [option, world, onHud]);

  useLabTap((tap, camera, size) => {
    const v = new THREE.Vector3();
    let best: (typeof world.stars)[number] | null = null;
    let bestD = 30;
    for (const s of world.stars) {
      if (!s.node.visible) continue;
      s.node.getWorldPosition(v).project(camera);
      if (v.z > 1) continue;
      const d = Math.hypot(((v.x + 1) / 2) * size.width - tap.x, ((1 - v.y) / 2) * size.height - tap.y);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    selected.current = best?.p ?? null;
    if (!best) return;
    const p = best.p;
    onHud({
      big: p.name,
      sub: `${abbr(p.teamId)} · ${p.pos}  PTS ${p.pts} · USG ${((p.usg ?? 0) * 100).toFixed(1)}% · 3P 得点比 ${((p.p3 ?? 0) * 100).toFixed(0)}% · DEF ${p.def ?? "-"}`,
    });
  });

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    world.cloud.rotation.y += frameDt(dt) * 0.03;
    updateGlowPointsScale(world.glows, state.camera, state.size.height * state.viewport.dpr);
    const aSize = world.glows.geometry.attributes.aSize as THREE.BufferAttribute;
    const aAlpha = world.glows.geometry.attributes.aAlpha as THREE.BufferAttribute;
    world.stars.forEach((s, i) => {
      const sel = selected.current === s.p;
      aAlpha.setX(i, s.node.visible ? (0.35 + s.k * 0.4) * (1 + Math.sin(t * 2 + s.phase) * 0.12) + (sel ? 0.6 : 0) : 0);
      aSize.setX(i, (3 + s.k * 11) * (sel ? 1.8 + Math.sin(t * 6) * 0.2 : 1));
    });
    aSize.needsUpdate = true;
    aAlpha.needsUpdate = true;
  });

  return <primitive object={world.root} />;
}
