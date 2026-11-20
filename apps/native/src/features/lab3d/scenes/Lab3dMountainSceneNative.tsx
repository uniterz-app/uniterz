import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import data from "../demoData/predictions.json";
import { abbr, disposeTree, glowSprite, starfield, teamGlowColor, useLabels, type LabSceneProps, frameDt } from "../lab3dKitNative";

const LO = 85;
const HI = 145;
const N = HI - LO;
const SIZE = 60;
const HMAX = 22;
const toX = (home: number) => ((home - LO) / N - 0.5) * SIZE;
const toZ = (away: number) => ((away - LO) / N - 0.5) * SIZE;

const STOPS: [number, THREE.Color][] = [
  [0, new THREE.Color("#061028")],
  [0.15, new THREE.Color("#0a3a8a")],
  [0.4, new THREE.Color("#00a8c0")],
  [0.7, new THREE.Color("#c21fb0")],
  [1, new THREE.Color("#ffb3f0")],
];
function ramp(v: number) {
  for (let k = 1; k < STOPS.length; k += 1) {
    if (v <= STOPS[k][0]) return STOPS[k - 1][1].clone().lerp(STOPS[k][1], (v - STOPS[k - 1][0]) / (STOPS[k][0] - STOPS[k - 1][0]));
  }
  return STOPS[STOPS.length - 1][1].clone();
}

function build() {
  const preds = data.preds as [number, number][];
  const valid = preds.filter(([h, a]) => h >= LO && h <= HI && a >= LO && a <= HI);
  const grid = Array.from({ length: N + 1 }, () => new Float32Array(N + 1));
  for (const [h, a] of valid) grid[h - LO][a - LO] += 1;
  const SIG = 2.2;
  const R = 6;
  const smooth = Array.from({ length: N + 1 }, () => new Float32Array(N + 1));
  let max = 0;
  let peak: [number, number] = [0, 0];
  for (let i = 0; i <= N; i += 1) {
    for (let j = 0; j <= N; j += 1) {
      let s = 0;
      for (let di = -R; di <= R; di += 1) {
        for (let dj = -R; dj <= R; dj += 1) {
          const x = i + di;
          const y = j + dj;
          if (x < 0 || y < 0 || x > N || y > N) continue;
          s += grid[x][y] * Math.exp(-(di * di + dj * dj) / (2 * SIG * SIG));
        }
      }
      smooth[i][j] = s;
      if (s > max) {
        max = s;
        peak = [i, j];
      }
    }
  }

  const root = new THREE.Group();
  root.add(starfield(1200, 700, 2.5));
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, N, N);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const col = new Float32Array(pos.count * 3);
  const targetY = new Float32Array(pos.count);
  for (let v = 0; v < pos.count; v += 1) {
    const i = Math.round((pos.getX(v) / SIZE + 0.5) * N);
    const j = Math.round((pos.getZ(v) / SIZE + 0.5) * N);
    const h = smooth[i][j] / max;
    targetY[v] = h * HMAX;
    const c = ramp(Math.pow(h, 0.8));
    col.set([c.r, c.g, c.b], v * 3);
    pos.setY(v, 0);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  root.add(
    new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.8, side: THREE.DoubleSide })),
    new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: "#00f5ff", wireframe: true, transparent: true, opacity: 0.12 }))
  );
  const diag = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(toX(LO), 0.2, toZ(LO)), new THREE.Vector3(toX(HI), 0.2, toZ(HI))]),
    new THREE.LineDashedMaterial({ color: "#ffffff", dashSize: 1, gapSize: 0.8, transparent: true, opacity: 0.6 })
  );
  diag.computeLineDistances();
  root.add(diag);

  const hc = teamGlowColor(data.home);
  const ac = teamGlowColor(data.away);
  const fh = data.score.home;
  const fa = data.score.away;
  const anchors: { obj: THREE.Object3D; text: string; color: string; size: number }[] = [];
  const at = (x: number, y: number, z: number) => {
    const o = new THREE.Object3D();
    o.position.set(x, y, z);
    root.add(o);
    return o;
  };
  anchors.push(
    { obj: at(toX(138), 1.5, toZ(95)), text: `${abbr(data.home)} 勝ち予想`, color: hc.getStyle(), size: 14 },
    { obj: at(toX(95), 1.5, toZ(138)), text: `${abbr(data.away)} 勝ち予想`, color: ac.getStyle(), size: 14 },
    { obj: at(0, 0.5, SIZE / 2 + 3), text: `${abbr(data.home)} の得点 →`, color: "rgba(255,255,255,0.6)", size: 10 },
    { obj: at(SIZE / 2 + 5, 0.5, 0), text: `${abbr(data.away)} の得点 →`, color: "rgba(255,255,255,0.6)", size: 10 },
    { obj: at(toX(fh), HMAX + 8, toZ(fa)), text: `FINAL ${abbr(data.home)} ${fh} - ${fa} ${abbr(data.away)}`, color: "#ffe14d", size: 13 },
    { obj: at(toX(peak[0] + LO), HMAX + 2.5, toZ(peak[1] + LO)), text: `いちばん多い予想 ${peak[0] + LO}-${peak[1] + LO}`, color: "#ffffff", size: 11 }
  );
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 60, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: "#ffe14d", transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })
  );
  beam.position.set(toX(fh), 30, toZ(fa));
  root.add(beam);
  const base = glowSprite("#ffe14d", 6, 1);
  base.position.set(toX(fh), 0.5, toZ(fa));
  root.add(base);
  const total = data.picks.home + data.picks.away;
  const hud = {
    big: `${abbr(data.home)} vs ${abbr(data.away)}`,
    sub: `予想 ${valid.length.toLocaleString()} 件 · ${abbr(data.home)} 勝ち予想 ${Math.round((data.picks.home / total) * 100)}% → 結果は ${fh > fa ? abbr(data.home) : abbr(data.away)} の勝ち`,
  };
  return { root, pos, targetY, beam, anchors, hud };
}

export default function Lab3dMountainSceneNative({ onHud, pulse }: LabSceneProps) {
  const labels = useLabels();
  const world = useMemo(build, []);
  const rise = useRef(0);

  useEffect(() => {
    const ids = world.anchors.map((a) => labels.add(a));
    onHud(world.hud);
    return () => {
      ids.forEach((id) => labels.remove(id));
      disposeTree(world.root);
    };
  }, [labels, world, onHud]);

  useEffect(() => {
    rise.current = 0;
  }, [pulse]);

  useFrame((state, dtRaw) => {
    if (rise.current < 1) {
      rise.current = Math.min(1, rise.current + frameDt(dtRaw) * 0.45);
      const e = 1 - Math.pow(1 - rise.current, 3);
      for (let v = 0; v < world.pos.count; v += 1) world.pos.setY(v, world.targetY[v] * e);
      world.pos.needsUpdate = true;
    }
    (world.beam.material as THREE.MeshBasicMaterial).opacity = 0.4 + Math.sin(state.clock.elapsedTime * 4) * 0.15;
  });

  return <primitive object={world.root} />;
}
