/**
 * 認証起動の 3D 世界 — 夜間コート。
 * ワイヤーグリッドや 3D ロゴは置かない。ブランドは 2D ランディング側。
 */
import { useMemo } from "react";
import * as THREE from "three";
import {
  SPLASH_CAMERA3D_ACCENT,
  SPLASH_CAMERA3D_BG,
} from "@/lib/splash/camera3dPaths";

const COURT_W = 7.2;
const COURT_D = 13.4;
const LINE = SPLASH_CAMERA3D_ACCENT;

function lineMat(opacity: number) {
  return (
    <lineBasicMaterial
      color={LINE}
      transparent
      opacity={opacity}
      toneMapped={false}
      blending={THREE.AdditiveBlending}
      depthWrite={false}
    />
  );
}

function CourtFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
      <planeGeometry args={[42, 42]} />
      <meshBasicMaterial
        color="#05090d"
        transparent
        opacity={0.42}
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
  );
}

function CourtMarkings() {
  const geos = useMemo(() => {
    const rect = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-COURT_W, 0.03, -COURT_D),
      new THREE.Vector3(COURT_W, 0.03, -COURT_D),
      new THREE.Vector3(COURT_W, 0.03, COURT_D),
      new THREE.Vector3(-COURT_W, 0.03, COURT_D),
      new THREE.Vector3(-COURT_W, 0.03, -COURT_D),
    ]);
    const mid = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-COURT_W, 0.03, 0),
      new THREE.Vector3(COURT_W, 0.03, 0),
    ]);
    const circle: THREE.Vector3[] = [];
    for (let i = 0; i <= 72; i += 1) {
      const a = (i / 72) * Math.PI * 2;
      circle.push(new THREE.Vector3(Math.cos(a) * 2.15, 0.03, Math.sin(a) * 2.15));
    }
    const center = new THREE.BufferGeometry().setFromPoints(circle);
    const inner: THREE.Vector3[] = [];
    for (let i = 0; i <= 48; i += 1) {
      const a = (i / 48) * Math.PI * 2;
      inner.push(new THREE.Vector3(Math.cos(a) * 0.28, 0.03, Math.sin(a) * 0.28));
    }
    const spot = new THREE.BufferGeometry().setFromPoints(inner);
    return { rect, mid, center, spot };
  }, []);

  return (
    <group>
      <line geometry={geos.rect}>{lineMat(0.42)}</line>
      <line geometry={geos.mid}>{lineMat(0.28)}</line>
      <line geometry={geos.center}>{lineMat(0.38)}</line>
      <line geometry={geos.spot}>{lineMat(0.55)}</line>
    </group>
  );
}

function CenterGlow() {
  return (
    <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[3.4, 48]} />
      <meshBasicMaterial
        color={LINE}
        transparent
        opacity={0.07}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function HorizonBand() {
  return (
    <mesh position={[0, 0.4, -16]} rotation={[0, 0, 0]}>
      <planeGeometry args={[48, 0.08]} />
      <meshBasicMaterial
        color={LINE}
        transparent
        opacity={0.22}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function StadiumBeams() {
  const beams = useMemo(() => {
    const arr: { x: number; z: number; h: number }[] = [];
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      arr.push({
        x: Math.cos(a) * 9.2,
        z: Math.sin(a) * 9.2,
        h: 7.2 + (i % 2) * 1.1,
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {beams.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]}>
          <boxGeometry args={[0.045, b.h, 0.045]} />
          <meshBasicMaterial
            color={LINE}
            transparent
            opacity={0.14}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function AuthFieldSceneNative() {
  return (
    <group>
      <fog attach="fog" args={[SPLASH_CAMERA3D_BG, 12, 34]} />
      <ambientLight intensity={0.08} />
      <directionalLight position={[3, 10, 5]} intensity={0.4} color="#c8fff8" />
      <pointLight
        position={[0, 7, 0]}
        intensity={10}
        color={LINE}
        distance={26}
        decay={2}
      />
      <CourtFloor />
      <CenterGlow />
      <CourtMarkings />
      <HorizonBand />
      <StadiumBeams />
    </group>
  );
}
