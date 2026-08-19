/**
 * 同心六角トンネル。同じ大きさの枠を Z に並べ、遠近で中央へ収束する。
 * quaternion は R3F に渡さない。コートへ戻す: authLandingFieldVariant を `"court"`。
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber/native";
import * as THREE from "three";

const RING_N = 14;
const SPACING = 1.38;
const Z_NEAR = 10.05;
const RADIUS = 2.42;
const RADIUS_IN = 2.16;
const TILT = -0.3;
const CORE_W = 0.03;
const BLOOM_W = 0.11;
const THICK = 0.02;
const MAX = RING_N * 12;

const _ring = new THREE.Object3D();
const _edge = new THREE.Object3D();
const _world = new THREE.Matrix4();

function hexCorners(radius: number): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i += 1) {
    const a = Math.PI / 6 + i * (Math.PI / 3);
    pts.push({ x: Math.cos(a) * radius, y: Math.sin(a) * radius });
  }
  return pts;
}

function yOnLookRay(z: number): number {
  const t = (11.2 - z) / 13.6;
  return 4.4 - 4.2 * t;
}

function writeEdge(
  mesh: THREE.InstancedMesh,
  index: number,
  z: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  width: number
) {
  const dx = bx - ax;
  const dy = by - ay;
  _ring.position.set(0, yOnLookRay(z), z);
  _ring.rotation.set(TILT, 0, 0);
  _ring.updateMatrix();
  _edge.position.set((ax + bx) * 0.5, (ay + by) * 0.5, 0);
  _edge.rotation.set(0, 0, Math.atan2(dy, dx));
  _edge.scale.set(Math.hypot(dx, dy) || 0.001, width, THICK);
  _edge.updateMatrix();
  _world.multiplyMatrices(_ring.matrix, _edge.matrix);
  mesh.setMatrixAt(index, _world);
}

function writeAll(
  mesh: THREE.InstancedMesh,
  scroll: number,
  width: number,
  outer: { x: number; y: number }[],
  inner: { x: number; y: number }[]
) {
  let i = 0;
  for (let r = 0; r < RING_N; r += 1) {
    const z = Z_NEAR - r * SPACING + scroll;
    for (let e = 0; e < 6; e += 1) {
      const a = outer[e];
      const b = outer[(e + 1) % 6];
      writeEdge(mesh, i, z, a.x, a.y, b.x, b.y, width);
      i += 1;
      const ia = inner[e];
      const ib = inner[(e + 1) % 6];
      writeEdge(mesh, i, z, ia.x, ia.y, ib.x, ib.y, width * 0.85);
      i += 1;
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
}

export default function AuthHexTunnelSceneNative() {
  const coreRef = useRef<THREE.InstancedMesh>(null);
  const bloomRef = useRef<THREE.InstancedMesh>(null);
  const coreGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const bloomGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const outer = useMemo(() => hexCorners(RADIUS), []);
  const inner = useMemo(() => hexCorners(RADIUS_IN), []);
  const scroll = useRef(0);

  useEffect(() => {
    return () => {
      coreGeo.dispose();
      bloomGeo.dispose();
    };
  }, [bloomGeo, coreGeo]);

  useFrame((_, dt) => {
    scroll.current =
      (scroll.current + Math.min(0.05, dt || 0.016) * 0.42) % SPACING;
    if (bloomRef.current) {
      writeAll(bloomRef.current, scroll.current, BLOOM_W, outer, inner);
    }
    if (coreRef.current) {
      writeAll(coreRef.current, scroll.current, CORE_W, outer, inner);
    }
  });

  return (
    <group>
      <instancedMesh
        ref={bloomRef}
        args={[bloomGeo, undefined, MAX]}
        frustumCulled={false}
      >
        <meshBasicMaterial
          color="#d8d8de"
          transparent
          opacity={0.22}
          toneMapped={false}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
      <instancedMesh
        ref={coreRef}
        args={[coreGeo, undefined, MAX]}
        frustumCulled={false}
      >
        <meshBasicMaterial
          color="#f5f5f7"
          transparent
          opacity={0.95}
          toneMapped={false}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
    </group>
  );
}
