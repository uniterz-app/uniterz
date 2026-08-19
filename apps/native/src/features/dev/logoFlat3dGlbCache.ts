/**
 * Web `/mobile/uniterz-logo-3d` 用 — 同梱平面ワードマーク GLB を一度だけパース。
 */
import { Asset } from "expo-asset";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  UNITERZ_LOGO_FLAT_3D_GLB_ASSET,
  UNITERZ_LOGO_FLAT_3D_LETTERS_GLB_ASSET,
} from "../../logoFlat3dGlbAsset";

export type LogoFlat3dModelId = "joined" | "letters";

function ensureNavigatorUserAgentForThreeGltf() {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.userAgent === "string") return;
  try {
    Object.defineProperty(navigator, "userAgent", {
      value: "",
      configurable: true,
      enumerable: true,
      writable: true,
    });
  } catch {
    /* skip */
  }
}

const MODULE: Record<LogoFlat3dModelId, number> = {
  joined: UNITERZ_LOGO_FLAT_3D_GLB_ASSET as number,
  letters: UNITERZ_LOGO_FLAT_3D_LETTERS_GLB_ASSET as number,
};

const parsed = new Map<LogoFlat3dModelId, THREE.Group>();
const inflight = new Map<LogoFlat3dModelId, Promise<THREE.Group | null>>();

async function loadBundledBuffer(id: LogoFlat3dModelId): Promise<ArrayBuffer | null> {
  try {
    const asset = Asset.fromModule(MODULE[id]);
    if (!asset.localUri) {
      await asset.downloadAsync();
    }
    const uri = asset.localUri ?? asset.uri;
    if (!uri) {
      console.warn("[logo-flat-3d] asset uri empty", id);
      return null;
    }
    const res = await fetch(uri);
    if (!res.ok) {
      console.warn("[logo-flat-3d] fetch failed", id, res.status, uri);
      return null;
    }
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

function parseGlb(buffer: ArrayBuffer): Promise<THREE.Group | null> {
  ensureNavigatorUserAgentForThreeGltf();
  const loader = new GLTFLoader();
  return new Promise((resolve) => {
    try {
      loader.parse(
        buffer,
        "",
        (gltf) => {
          const scene = (gltf as { scene?: THREE.Group }).scene;
          resolve(scene ?? null);
        },
        (err) => {
          console.warn("[logo-flat-3d] GLB parse failed", err);
          resolve(null);
        }
      );
    } catch {
      resolve(null);
    }
  });
}

export async function ensureLogoFlat3dGltfParsed(
  id: LogoFlat3dModelId
): Promise<THREE.Group | null> {
  const hit = parsed.get(id);
  if (hit) return hit;
  const pending = inflight.get(id);
  if (pending) return pending;
  const job = (async () => {
    const buf = await loadBundledBuffer(id);
    if (!buf) {
      console.warn("[logo-flat-3d] buffer missing", id);
      return null;
    }
    const scene = await parseGlb(buf);
    if (scene) parsed.set(id, scene);
    return scene;
  })().finally(() => {
    inflight.delete(id);
  });
  inflight.set(id, job);
  return job;
}

export function getCachedLogoFlat3dGltfScene(
  id: LogoFlat3dModelId
): THREE.Group | null {
  return parsed.get(id) ?? null;
}
