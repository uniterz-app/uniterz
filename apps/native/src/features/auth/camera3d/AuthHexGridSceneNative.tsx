/**
 * 白黒メタルの二重六角。カメラ正面の面にメッシュで描く。
 * （線だけだと端末で消える／床だけだと上が空になる）
 * 戻す: `authLandingFieldVariant.ts` を `"court"`。
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";

const SQRT3 = Math.sqrt(3);
const HEX = 0.62;
const INNER = 0.7;
const Q_MIN = -6;
const Q_MAX = 6;
const R_MIN = -7;
const R_MAX = 7;
const PULSE_COUNT = 5;
const MAX_GLOW = 160;
const TRAIL_DECAY = 0.3;
const RAISE = 0.07;

type Cell = {
  q: number;
  r: number;
  outer: { x: number; y: number }[];
  inner: { x: number; y: number }[];
};

type Graph = {
  cells: Cell[];
  cellAt: Map<string, Cell>;
  dormant: { ax: number; ay: number; bx: number; by: number }[];
};

function cellKey(q: number, r: number): string {
  return `${q},${r}`;
}

function hexCenter(q: number, r: number): { x: number; y: number } {
  return {
    x: HEX * (SQRT3 * q + (SQRT3 / 2) * r),
    y: HEX * (1.5 * r),
  };
}

function ring(cx: number, cy: number, radius: number): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i += 1) {
    const a = Math.PI / 6 + i * (Math.PI / 3);
    pts.push({ x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) });
  }
  return pts;
}

function buildGraph(): Graph {
  const cellAt = new Map<string, Cell>();
  for (let q = Q_MIN; q <= Q_MAX; q += 1) {
    for (let r = R_MIN; r <= R_MAX; r += 1) {
      const { x: cx, y: cy } = hexCenter(q, r);
      cellAt.set(cellKey(q, r), {
        q,
        r,
        outer: ring(cx, cy, HEX),
        inner: ring(cx, cy, HEX * INNER),
      });
    }
  }
  const cells = [...cellAt.values()];
  const dormant: Graph["dormant"] = [];
  const seen = new Set<string>();
  const add = (ax: number, ay: number, bx: number, by: number, unique: boolean) => {
    if (unique) {
      const id =
        ax < bx || (ax === bx && ay <= by)
          ? `${ax.toFixed(3)},${ay.toFixed(3)}|${bx.toFixed(3)},${by.toFixed(3)}`
          : `${bx.toFixed(3)},${by.toFixed(3)}|${ax.toFixed(3)},${ay.toFixed(3)}`;
      if (seen.has(id)) return;
      seen.add(id);
    }
    dormant.push({ ax, ay, bx, by });
  };
  cells.forEach((c) => {
    for (let i = 0; i < 6; i += 1) {
      const a = c.outer[i];
      const b = c.outer[(i + 1) % 6];
      add(a.x, a.y, b.x, b.y, true);
      const ia = c.inner[i];
      const ib = c.inner[(i + 1) % 6];
      add(ia.x, ia.y, ib.x, ib.y, false);
    }
  });
  return { cells, cellAt, dormant };
}

const NEIGHBOR: readonly [number, number][] = [
  [1, 0],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [0, -1],
  [1, -1],
];

const _dummy = new THREE.Object3D();

function setRibbon(
  mesh: THREE.InstancedMesh,
  i: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  z: number,
  width: number,
  thick: number
) {
  const dx = bx - ax;
  const dy = by - ay;
  _dummy.position.set((ax + bx) * 0.5, (ay + by) * 0.5, z);
  _dummy.rotation.set(0, 0, Math.atan2(dy, dx));
  _dummy.scale.set(Math.hypot(dx, dy) || 0.001, width, thick);
  _dummy.updateMatrix();
  mesh.setMatrixAt(i, _dummy.matrix);
}

function hideRibbon(mesh: THREE.InstancedMesh, i: number) {
  _dummy.position.set(0, 0, -4);
  _dummy.rotation.set(0, 0, 0);
  _dummy.scale.set(0.0001, 0.0001, 0.0001);
  _dummy.updateMatrix();
  mesh.setMatrixAt(i, _dummy.matrix);
}

type Agent = {
  cell: Cell;
  side: number;
  t: number;
  speed: number;
};

function DormantGrid({ graph }: { graph: Graph }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    graph.dormant.forEach((e, i) => {
      setRibbon(mesh, i, e.ax, e.ay, e.bx, e.by, 0, 0.034, 0.02);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [graph]);

  useEffect(() => () => geo.dispose(), [geo]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geo, undefined, graph.dormant.length]}
      frustumCulled={false}
    >
      <meshBasicMaterial
        color="#c8c8ce"
        transparent
        opacity={0.38}
        toneMapped={false}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

function TraceLight({ graph }: { graph: Graph }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const agents = useRef<Agent[]>([]);
  const heat = useRef(new Map<string, { cell: Cell; side: number; v: number }>());
  const seeded = useRef(false);

  useEffect(() => () => geo.dispose(), [geo]);

  useFrame((_, dt) => {
    const mesh = meshRef.current;
    if (!mesh || graph.cells.length === 0) return;
    const step = Math.min(0.05, dt > 0.0001 ? dt : 0.016);

    if (!seeded.current) {
      seeded.current = true;
      agents.current = Array.from({ length: PULSE_COUNT }, (_, i) => ({
        cell: graph.cells[(i * 13) % graph.cells.length],
        side: i % 6,
        t: (i * 0.19) % 1,
        speed: 0.5 + (i % 4) * 0.14,
      }));
    }

    const nextHeat = new Map<string, { cell: Cell; side: number; v: number }>();
    heat.current.forEach((h, id) => {
      const v = h.v - TRAIL_DECAY * step;
      if (v > 0.06) nextHeat.set(id, { ...h, v });
    });
    heat.current = nextHeat;

    const live: {
      ax: number;
      ay: number;
      bx: number;
      by: number;
      z: number;
      w: number;
    }[] = [];

    const addSide = (
      cell: Cell,
      side: number,
      t0: number,
      t1: number,
      z: number,
      w: number
    ) => {
      const oa = cell.outer[side];
      const ob = cell.outer[(side + 1) % 6];
      const ia = cell.inner[side];
      const ib = cell.inner[(side + 1) % 6];
      const lerp = (
        a: { x: number; y: number },
        b: { x: number; y: number },
        t: number
      ) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      const o0 = lerp(oa, ob, t0);
      const o1 = lerp(oa, ob, t1);
      const i0 = lerp(ia, ib, t0);
      const i1 = lerp(ia, ib, t1);
      live.push({ ax: o0.x, ay: o0.y, bx: o1.x, by: o1.y, z, w });
      live.push({ ax: i0.x, ay: i0.y, bx: i1.x, by: i1.y, z, w });
    };

    agents.current.forEach((ag) => {
      ag.t += ag.speed * step;
      while (ag.t >= 1) {
        ag.t -= 1;
        const id = `${ag.cell.q},${ag.cell.r},${ag.side}`;
        heat.current.set(id, { cell: ag.cell, side: ag.side, v: 1 });
        if (Math.random() < 0.7) {
          ag.side = (ag.side + 1) % 6;
        } else {
          const [dq, dr] = NEIGHBOR[ag.side];
          const n = graph.cellAt.get(cellKey(ag.cell.q + dq, ag.cell.r + dr));
          if (n) ag.cell = n;
          else ag.side = (ag.side + 1) % 6;
        }
      }
      addSide(ag.cell, ag.side, Math.max(0, ag.t - 0.22), ag.t, RAISE, 0.05);
    });

    heat.current.forEach((h) => {
      addSide(h.cell, h.side, 0, 1, RAISE * (0.4 + h.v * 0.6), 0.028 + h.v * 0.02);
    });

    const n = Math.min(MAX_GLOW, live.length);
    for (let i = 0; i < MAX_GLOW; i += 1) {
      if (i < n) {
        const g = live[i];
        setRibbon(mesh, i, g.ax, g.ay, g.bx, g.by, g.z, g.w, 0.028);
      } else {
        hideRibbon(mesh, i);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geo, undefined, MAX_GLOW]}
      frustumCulled={false}
    >
      <meshBasicMaterial
        color="#f4f4f6"
        transparent
        opacity={0.92}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

export default function AuthHexGridSceneNative() {
  const graph = useMemo(() => buildGraph(), []);

  return (
    <group position={[0, 2.45, 5.2]} rotation={[-0.28, 0, 0]}>
      <DormantGrid graph={graph} />
      <TraceLight graph={graph} />
    </group>
  );
}
