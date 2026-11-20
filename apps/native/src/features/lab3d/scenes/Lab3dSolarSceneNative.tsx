import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import players from "../demoData/players.json";
import { abbr, disposeTree, glowSprite, glowTexture, starfield, teamGlowColor, useLabels, type LabSceneProps, frameDt } from "../lab3dKitNative";

type Planet = { body: THREE.Group; moons: THREE.Mesh[]; r: number; a: number; speed: number };

function build(teamId: string) {
  const root = new THREE.Group();
  root.add(starfield(2500, 1200, 3));
  const tc = teamGlowColor(teamId);
  root.add(new THREE.AmbientLight("#ffffff", 0.3));
  const light = new THREE.PointLight(tc.clone().lerp(new THREE.Color("#ffffff"), 0.5), 700, 0, 1.6);
  root.add(light);
  const anchors: { obj: THREE.Object3D; text: string; color: string; size: number }[] = [];

  const sun = new THREE.Mesh(new THREE.SphereGeometry(5, 40, 40), new THREE.MeshBasicMaterial({ color: tc.clone().multiplyScalar(1.5), toneMapped: false }));
  root.add(sun, glowSprite(tc, 16, 0.6), glowSprite(tc, 34, 0.12));
  const sunAnchor = new THREE.Object3D();
  sunAnchor.position.y = 8;
  root.add(sunAnchor);
  anchors.push({ obj: sunAnchor, text: abbr(teamId), color: "#ffffff", size: 16 });

  const n = 1200;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i += 1) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(5.5 + Math.random() * 4);
    pos.set([v.x, v.y, v.z], i * 3);
  }
  const cg = new THREE.BufferGeometry();
  cg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const corona = new THREE.Points(cg, new THREE.PointsMaterial({ color: tc, size: 0.5, map: glowTexture(), transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  root.add(corona);

  const roster = players.filter((p) => p.teamId === teamId).sort((a, b) => (b.min ?? 0) - (a.min ?? 0));
  const planets: Planet[] = roster.map((p, i) => {
    const r = 12 + Math.max(0, 38 - (p.min ?? 20)) * 1.4 + i * 2.2;
    const size = 0.7 + (p.pts ?? 0) / 9;
    const pc = new THREE.Color().setHSL((i * 0.13 + 0.5) % 1, 0.75, 0.5).lerp(tc, 0.35);
    const pivot = new THREE.Group();
    pivot.rotation.x = (Math.random() - 0.5) * 0.25;
    root.add(pivot);
    pivot.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(Array.from({ length: 129 }, (_, k) => new THREE.Vector3(Math.cos((k / 128) * Math.PI * 2) * r, 0, Math.sin((k / 128) * Math.PI * 2) * r))),
        new THREE.LineBasicMaterial({ color: pc, transparent: true, opacity: 0.3 })
      )
    );
    const body = new THREE.Group();
    body.add(new THREE.Mesh(new THREE.SphereGeometry(size, 28, 28), new THREE.MeshStandardMaterial({ color: pc, roughness: 0.6, emissive: pc, emissiveIntensity: 0.06 })));
    if ((p.fg3a ?? 0) >= 5) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(size * 1.5, size * 2.2, 48), new THREE.MeshBasicMaterial({ color: "#00f5ff", side: THREE.DoubleSide, transparent: true, opacity: 0.4, toneMapped: false }));
      ring.rotation.x = Math.PI / 2.4;
      body.add(ring);
    }
    const moons: THREE.Mesh[] = [];
    for (let k = 0; k < Math.round((p.ast ?? 0) / 2); k += 1) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshBasicMaterial({ color: "#ffffff" }));
      m.userData = { r: size + 0.9 + k * 0.45, s: 2 + Math.random() * 2, a: Math.random() * 6 };
      body.add(m);
      moons.push(m);
    }
    const anchor = new THREE.Object3D();
    anchor.position.y = size + 1.6;
    body.add(anchor);
    anchors.push({ obj: anchor, text: `${p.name} ${p.pts}`, color: "#ffffff", size: 11 });
    pivot.add(body);
    return { body, moons, r, a: Math.random() * Math.PI * 2, speed: 0.15 + (p.usg ?? 0.15) * 1.6 };
  });
  const ace = [...roster].sort((a, b) => (b.pts ?? 0) - (a.pts ?? 0))[0];
  return { root, planets, corona, anchors, count: roster.length, ace };
}

export default function Lab3dSolarSceneNative({ onHud, option }: LabSceneProps) {
  const labels = useLabels();
  const world = useMemo(() => build(option), [option]);

  useEffect(() => {
    const ids = world.anchors.map((a) => labels.add(a));
    onHud({ big: abbr(option), sub: `惑星 ${world.count} · 最大の惑星 ${world.ace?.name ?? "-"} (${world.ace?.pts ?? 0} PTS)` });
    return () => {
      ids.forEach((id) => labels.remove(id));
      disposeTree(world.root);
    };
  }, [labels, world, option, onHud]);

  useFrame((_, dtRaw) => {
    const dt = frameDt(dtRaw);
    for (const p of world.planets) {
      p.a += dt * p.speed;
      p.body.position.set(Math.cos(p.a) * p.r, 0, Math.sin(p.a) * p.r);
      for (const m of p.moons) {
        const u = m.userData as { r: number; s: number; a: number };
        u.a += dt * u.s;
        m.position.set(Math.cos(u.a) * u.r, Math.sin(u.a * 0.7) * 0.4, Math.sin(u.a) * u.r);
      }
    }
    world.corona.rotation.y += dt * 0.2;
  });

  return <primitive object={world.root} />;
}
