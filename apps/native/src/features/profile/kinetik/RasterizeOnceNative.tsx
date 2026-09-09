/**
 * 重い SVG を 1 回キャプチャして Image に差し替える。
 * 見た目は同じで、以降のベクトル再塗りを止める。
 * サムネ一括焼き用に同時キャプチャは最大 8 件。
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Image, InteractionManager, PixelRatio, View } from "react-native";
import { captureRef } from "react-native-view-shot";

const MAX_CACHE = 48;
const MAX_CAPTURE = 8;
const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();
let liveCaptures = 0;
const captureWaiters: Array<() => void> = [];
const rasterListeners = new Set<() => void>();

function notifyRasterListeners() {
  rasterListeners.forEach((fn) => fn());
}

function cacheGet(key: string): string | null {
  const hit = cache.get(key);
  if (!hit) return null;
  cache.delete(key);
  cache.set(key, hit);
  return hit;
}

function cacheSet(key: string, uri: string) {
  cache.delete(key);
  cache.set(key, uri);
  while (cache.size > MAX_CACHE) {
    const oldest = cache.keys().next().value;
    if (oldest == null) break;
    cache.delete(oldest);
  }
  notifyRasterListeners();
}

function acquireCaptureSlot(): Promise<void> {
  if (liveCaptures < MAX_CAPTURE) {
    liveCaptures += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    captureWaiters.push(() => {
      liveCaptures += 1;
      resolve();
    });
  });
}

function releaseCaptureSlot() {
  liveCaptures = Math.max(0, liveCaptures - 1);
  const next = captureWaiters.shift();
  if (next) next();
}

function captureRaster(
  node: View,
  key: string,
  pixelRatio: number
): Promise<string | null> {
  const pending = inflight.get(key);
  if (pending) return pending;

  const job = (async () => {
    await acquireCaptureSlot();
    try {
      const uri = await captureRef(node, {
        format: "png",
        quality: 1,
        result: "tmpfile",
        pixelRatio,
      });
      if (typeof uri === "string" && uri.length > 0) {
        cacheSet(key, uri);
        return uri;
      }
    } catch {
      /* SVG のまま残す */
    } finally {
      releaseCaptureSlot();
    }
    return null;
  })();

  inflight.set(key, job);
  void job.finally(() => {
    inflight.delete(key);
  });
  return job;
}

export function peekProSkinRaster(key: string): string | null {
  return cacheGet(key);
}

export function subscribeProSkinRaster(listener: () => void): () => void {
  rasterListeners.add(listener);
  return () => {
    rasterListeners.delete(listener);
  };
}

export function proSkinRasterCacheKey(
  variantKey: string,
  width: number,
  height: number
): string {
  const w = Math.max(1, Math.round(width / 2) * 2);
  const h = Math.max(1, Math.round(height / 2) * 2);
  return `${variantKey}|${w}x${h}`;
}

type Props = {
  cacheKey: string;
  width: number;
  height: number;
  children: ReactNode;
  pixelRatio?: number;
  onRasterized?: (uri: string) => void;
  /** 成功・失敗どちらでも 1 回。バッチ進行用 */
  onComplete?: () => void;
};

export default function RasterizeOnceNative({
  cacheKey,
  width,
  height,
  children,
  pixelRatio,
  onRasterized,
  onComplete,
}: Props) {
  const hostRef = useRef<View>(null);
  const [uri, setUri] = useState(() => cacheGet(cacheKey));
  const ratio = pixelRatio ?? Math.min(PixelRatio.get(), 2);
  const completedRef = useRef(false);

  const finish = (next: string | null) => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (next) {
      setUri(next);
      onRasterized?.(next);
    }
    onComplete?.();
  };

  useEffect(() => {
    completedRef.current = false;
    const hit = cacheGet(cacheKey);
    setUri(hit);
    if (hit) finish(hit);
    // cacheKey 変更時だけ焼き直し
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  useEffect(() => {
    if (uri || width < 8 || height < 8) {
      if (uri) finish(uri);
      return;
    }
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const task = InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          timeoutId = setTimeout(() => {
            if (cancelled) return;
            const node = hostRef.current;
            if (!node) {
              finish(null);
              return;
            }
            const hit = cacheGet(cacheKey);
            if (hit) {
              finish(hit);
              return;
            }
            void captureRaster(node, cacheKey, ratio).then((next) => {
              if (cancelled) return;
              finish(next);
            });
          }, 48);
        });
      });
    });
    return () => {
      cancelled = true;
      if (timeoutId != null) clearTimeout(timeoutId);
      task.cancel();
    };
  }, [cacheKey, height, ratio, uri, width]);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ position: "absolute", top: 0, left: 0, width, height }}
        resizeMode="stretch"
        pointerEvents="none"
      />
    );
  }

  return (
    <View
      ref={hostRef}
      collapsable={false}
      pointerEvents="none"
      style={{ width, height }}
    >
      {children}
    </View>
  );
}
