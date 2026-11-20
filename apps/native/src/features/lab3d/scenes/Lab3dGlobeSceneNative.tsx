import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import geo from "../demoData/geo.json";
import { abbr, disposeTree, frameDt, glowSprite, glowTexture, starfield, teamGlowColor, useLabels, type LabSceneProps } from "../lab3dKitNative";
import { dayLabel, gamesOnDay, LAB_ARENAS, LAB_TEAMS, labPickDays, latLngToVec, TOKYO } from "../lab3dDataNative";

const R = 20;
const SEG = 64;
export const LAB_GLOBE_DAYS = labPickDays(3).map((d) => [String(d), dayLabel(d)] as [string, string]);

function buildEarth() {
  const root = new THREE.Group();
  root.add(starfield(1800, 900, 2.5, 0.6));
  root.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.99, 48, 32), new THREE.MeshBasicMaterial({ color: "#040c18" })));
  root.add(glowSprite("#1a6cff", R * 3.1, 0.22));
  const d = geo.dots as number[];
  const pos = new Float32Array((d.length / 2) * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < d.length; i += 2) {
    latLngToVec(d[i] / 10, d[i + 1] / 10, R, v);
    pos.set([v.x, v.y, v.z], (i / 2) * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  root.add(new THREE.Points(g, new THREE.PointsMaterial({ color: "#2a8fb0", size: 0.42, map: glowTexture(), transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false })));
  const tokyo = glowSprite("#ffd23f", 3.2, 1);
  latLngToVec(TOKYO[0], TOKYO[1], R * 1.01, tokyo.position);
  root.add(tokyo);
  return { root, tokyo };
}

type Flow = { pts: THREE.Vector3[]; n: number; hColor: THREE.Color; aColor: THREE.Color; share: number; glow: THREE.Sprite };

export default function Lab3dGlobeSceneNative({ onHud, option }: LabSceneProps) {
  const labels = useLabels();
  const earth = useMemo(buildEarth, []);
  const dyn = useMemo(() => new THREE.Group(), []);
  const st = useRef<{ flows: Flow[]; pulses: THREE.Points | null; seeds: Float32Array; owner: Int16Array; side: Uint8Array }>({
    flows: [],
    pulses: null,
    seeds: new Float32Array(0),
    owner: new Int16Array(0),
    side: new Uint8Array(0),
  });

  useEffect(() => () => {
    disposeTree(earth.root);
    disposeTree(dyn);
  }, [earth, dyn]);

  useEffect(() => {
    const id = labels.add({ obj: earth.tokyo, text: "UNITERZ · JAPAN", color: "#ffd23f", size: 11 });
    return () => labels.remove(id);
  }, [labels, earth]);

  useEffect(() => {
    const s = st.current;
    for (const c of [...dyn.children]) {
      dyn.remove(c);
      disposeTree(c);
    }
    const day = Number(option || LAB_GLOBE_DAYS[0]?.[0]);
    const games = gamesOnDay(day);
    const from = latLngToVec(TOKYO[0], TOKYO[1], 1);
    const ids: number[] = [];
    let total = 0;
    s.flows = games.map((g) => {
      const [lat, lng] = LAB_ARENAS[g[0]];
      const to = latLngToVec(lat, lng, 1);
      const ang = from.angleTo(to);
      const q = new THREE.Quaternion().setFromUnitVectors(from, to);
      const pts = Array.from({ length: SEG + 1 }, (_, i) => {
        const t = i / SEG;
        const p = from.clone().applyQuaternion(new THREE.Quaternion().slerp(q, t));
        return p.multiplyScalar(R * (1 + Math.sin(Math.PI * t) * ang * 0.32));
      });
      dyn.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: "#5fdcff", transparent: true, opacity: 0.18 })));
      const picks = g[5] + g[6];
      total += picks;
      const glow = glowSprite(teamGlowColor(LAB_TEAMS[g[0]]), 2 + Math.sqrt(picks) * 0.12, 0.9);
      glow.position.copy(pts[SEG]);
      dyn.add(glow);
      ids.push(labels.add({ obj: glow, text: `${abbr(LAB_TEAMS[g[1]])} @ ${abbr(LAB_TEAMS[g[0]])}`, color: "#ffffff", size: 10, scaleDist: 60 }));
      return {
        pts,
        n: Math.max(8, Math.min(90, Math.round(picks / 12))),
        hColor: teamGlowColor(LAB_TEAMS[g[0]]),
        aColor: teamGlowColor(LAB_TEAMS[g[1]]),
        share: picks ? g[5] / picks : 0.5,
        glow,
      };
    });
    const count = s.flows.reduce((a, f) => a + f.n, 0);
    s.seeds = new Float32Array(count);
    s.owner = new Int16Array(count);
    s.side = new Uint8Array(count);
    const col = new Float32Array(count * 3);
    let k = 0;
    s.flows.forEach((f, fi) => {
      for (let i = 0; i < f.n; i += 1, k += 1) {
        s.seeds[k] = Math.random();
        s.owner[k] = fi;
        const home = i / f.n < f.share;
        s.side[k] = home ? 1 : 0;
        const c = home ? f.hColor : f.aColor;
        col.set([c.r, c.g, c.b], k * 3);
      }
    });
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage));
    pg.setAttribute("color", new THREE.BufferAttribute(col, 3));
    s.pulses = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.9, map: glowTexture(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    s.pulses.frustumCulled = false;
    dyn.add(s.pulses);
    onHud({ big: `${dayLabel(day)} · ${games.length} 試合`, sub: `UNITERZ の予想 ${total.toLocaleString()} 件が日本から会場へ。粒の色＝選んだチーム` });
    return () => ids.forEach((id) => labels.remove(id));
  }, [option, dyn, labels, onHud]);

  useFrame((_, dtRaw) => {
    const dt = frameDt(dtRaw);
    const s = st.current;
    if (!s.pulses) return;
    const attr = s.pulses.geometry.attributes.position as THREE.BufferAttribute;
    const a = attr.array as Float32Array;
    for (let k = 0; k < s.seeds.length; k += 1) {
      s.seeds[k] = (s.seeds[k] + dt * 0.28) % 1;
      const f = s.flows[s.owner[k]];
      const x = s.seeds[k] * SEG;
      const i = Math.floor(x);
      const p = f.pts[i];
      const q = f.pts[Math.min(SEG, i + 1)];
      const t = x - i;
      a[k * 3] = p.x + (q.x - p.x) * t;
      a[k * 3 + 1] = p.y + (q.y - p.y) * t;
      a[k * 3 + 2] = p.z + (q.z - p.z) * t;
    }
    attr.needsUpdate = true;
  });

  return (
    <group>
      <primitive object={earth.root} />
      <primitive object={dyn} />
    </group>
  );
}
