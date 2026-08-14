import { Asset } from "expo-asset";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { UNITERZ_LOGO_GLB_ASSET } from "../../rankingsLogoAsset";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";

/** Web `public/logo/uniterz-logo.glb` と同じパス（Next オリジン・フォールバック） */
export function getRankingsLogoGlbRemoteUrl(): string | null {
  const base = getUniterzApiBaseUrl();
  return base ? `${base}/logo/uniterz-logo.glb` : null;
}

/** GLTFLoader.parse の path 引数用（スラッシュ無し URL でも空文字に落ちる） */
function gltfResourcePathFromRemoteUrl(uri: string): string {
  const i = uri.lastIndexOf("/");
  return i >= 0 ? uri.slice(0, i + 1) : "";
}

/**
 * three.js GLTFParser が `navigator.userAgent.match(...)` を前提にしている一方、
 * RN では `userAgent` が undefined のことがありパースが落ちる。
 */
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

let bundledBuffer: ArrayBuffer | null = null;
let bundledInflight: Promise<ArrayBuffer | null> | null = null;

let cachedUri: string | null = null;
let cachedBuffer: ArrayBuffer | null = null;
let inflightUri: string | null = null;
let inflightPromise: Promise<ArrayBuffer | null> | null = null;

/** パース済みシーン（マテリアル適用前）。clone して使う */
let parsedSceneRoot: THREE.Group | null = null;
let parseInflight: Promise<THREE.Group | null> | null = null;

async function fetchRemoteGlb(uri: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(uri);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

async function loadBundledGlbBuffer(): Promise<ArrayBuffer | null> {
  if (bundledBuffer) return bundledBuffer;
  if (bundledInflight) return bundledInflight;
  bundledInflight = (async () => {
    try {
      const asset = Asset.fromModule(UNITERZ_LOGO_GLB_ASSET);
      /** 既にローカルなら downloadAsync を待たない */
      if (!asset.localUri) {
        await asset.downloadAsync();
      }
      const uri = asset.localUri ?? asset.uri;
      if (!uri) return null;
      const res = await fetch(uri);
      if (!res.ok) return null;
      const buf = await res.arrayBuffer();
      bundledBuffer = buf;
      return buf;
    } catch {
      return null;
    } finally {
      bundledInflight = null;
    }
  })();
  return bundledInflight;
}

function parseGlbToScene(
  buffer: ArrayBuffer,
  resourcePath: string
): Promise<THREE.Group | null> {
  ensureNavigatorUserAgentForThreeGltf();
  const loader = new GLTFLoader();
  return new Promise((resolve) => {
    try {
      loader.parse(
        buffer,
        resourcePath,
        (parsed) => {
          const scene = (parsed as { scene?: THREE.Group }).scene;
          resolve(scene ?? null);
        },
        () => resolve(null)
      );
    } catch {
      resolve(null);
    }
  });
}

/**
 * バッファ取得 → GLTF パースまで先に済ませる。
 * チュートリアル welcome の初回表示遅れを防ぐ。
 */
export async function ensureRankingsLogoGltfParsed(): Promise<THREE.Group | null> {
  if (parsedSceneRoot) return parsedSceneRoot;
  if (parseInflight) return parseInflight;

  parseInflight = (async () => {
    const bundled = await loadBundledGlbBuffer();
    if (bundled) {
      const scene = await parseGlbToScene(bundled, "");
      if (scene) {
        parsedSceneRoot = scene;
        return scene;
      }
    }
    const remote = getRankingsLogoGlbRemoteUrl();
    if (remote) {
      const loaded = await loadRankingsLogoGlbBuffer(remote);
      if (loaded) {
        const scene = await parseGlbToScene(loaded.buffer, loaded.resourcePath);
        if (scene) {
          parsedSceneRoot = scene;
          return scene;
        }
      }
    }
    return null;
  })().finally(() => {
    parseInflight = null;
  });

  return parseInflight;
}

/** 同期取得（先読み済みなら即表示できる） */
export function getCachedRankingsLogoGltfScene(): THREE.Group | null {
  return parsedSceneRoot;
}

/**
 * 同梱 GLB を最優先で先読みし、可能ならパースまで進める。
 */
export function prefetchRankingsLogoGlb(): void {
  void ensureRankingsLogoGltfParsed();
  const uri = getRankingsLogoGlbRemoteUrl();
  if (!uri) return;
  if (cachedUri === uri && cachedBuffer) return;
  if (inflightUri === uri && inflightPromise) return;
  inflightUri = uri;
  inflightPromise = (async () => {
    const buf = await fetchRemoteGlb(uri);
    if (buf) {
      cachedUri = uri;
      cachedBuffer = buf;
    }
    inflightUri = null;
    inflightPromise = null;
    return buf;
  })();
}

/**
 * 同梱 GLB を優先し、無ければリモート（キャッシュ／進行中）を返す。
 * `GLTFLoader.parse` の第2引数は同梱時は空文字でよい（埋め込みバイナリ想定）。
 */
export async function loadRankingsLogoGlbBuffer(uri: string): Promise<{
  buffer: ArrayBuffer;
  /** 埋め込みリソース解決用。同梱時は `""` */
  resourcePath: string;
} | null> {
  const bundled = await loadBundledGlbBuffer();
  if (bundled) {
    return { buffer: bundled, resourcePath: "" };
  }
  if (cachedUri === uri && cachedBuffer) {
    return { buffer: cachedBuffer, resourcePath: gltfResourcePathFromRemoteUrl(uri) };
  }
  if (inflightUri === uri && inflightPromise) {
    const buf = await inflightPromise;
    if (buf) {
      return { buffer: buf, resourcePath: gltfResourcePathFromRemoteUrl(uri) };
    }
  }
  const buf = await fetchRemoteGlb(uri);
  if (buf) {
    cachedUri = uri;
    cachedBuffer = buf;
    return { buffer: buf, resourcePath: gltfResourcePathFromRemoteUrl(uri) };
  }
  return null;
}
