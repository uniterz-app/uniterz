/**
 * 重い SVG を 1 回キャプチャして Image に差し替える。
 * 見た目は同じで、以降のベクトル再塗りを止める。
 * サムネ一括焼き用に同時キャプチャは最大 8 件。
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Image, InteractionManager, Platform, PixelRatio, View } from "react-native";
import { captureRef } from "react-native-view-shot";

const MAX_CACHE = 48;
/** Android は同時焼きが多いとタブ遷移中に固まる */
const MAX_CAPTURE = Platform.OS === "android" ? 2 : 8;
const cache = new Map<string, string>();
type InflightJob = {
  promise: Promise<string | null>;
  /** まだ結果を待っている呼び出し元の数 */
  refs: number;
  /** 全員が離れたら captureRef の前で打ち切る */
  abort: boolean;
};

const inflight = new Map<string, InflightJob>();
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

/**
 * 同じキーの焼きは1本にまとめる。
 * 呼び出し元が全部外れたら、スロット待ちのあいだに captureRef へ進まない
 * （ランキングを離れたあともメインスレッドを奪わないため）。
 */
function captureRaster(
  node: View,
  key: string,
  pixelRatio: number
): { promise: Promise<string | null>; release: () => void } {
  const existing = inflight.get(key);
  if (existing) {
    existing.refs += 1;
    existing.abort = false;
    return {
      promise: existing.promise,
      release: () => {
        existing.refs -= 1;
        if (existing.refs <= 0) existing.abort = true;
      },
    };
  }

  const job: InflightJob = {
    promise: Promise.resolve(null),
    refs: 1,
    abort: false,
  };

  job.promise = (async () => {
    await acquireCaptureSlot();
    try {
      if (job.abort) return null;
      const uri = await captureRef(node, {
        format: "png",
        quality: 1,
        result: "tmpfile",
        pixelRatio,
      });
      if (job.abort) return null;
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
  void job.promise.finally(() => {
    inflight.delete(key);
  });

  return {
    promise: job.promise,
    release: () => {
      job.refs -= 1;
      if (job.refs <= 0) job.abort = true;
    },
  };
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
    let rafOuter = 0;
    let rafInner = 0;
    let releaseCapture: (() => void) | null = null;
    const task = InteractionManager.runAfterInteractions(() => {
      if (cancelled) return;
      rafOuter = requestAnimationFrame(() => {
        if (cancelled) return;
        rafInner = requestAnimationFrame(() => {
          if (cancelled) return;
          /** Android の captureRef はメインスレッドを奪うので初回描画後に遅らせる */
          const delayMs = Platform.OS === "android" ? 520 : 48;
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
            const captured = captureRaster(node, cacheKey, ratio);
            releaseCapture = captured.release;
            void captured.promise.then((next) => {
              if (cancelled) return;
              finish(next);
            });
          }, delayMs);
        });
      });
    });
    return () => {
      cancelled = true;
      if (timeoutId != null) clearTimeout(timeoutId);
      if (rafOuter) cancelAnimationFrame(rafOuter);
      if (rafInner) cancelAnimationFrame(rafInner);
      task.cancel();
      releaseCapture?.();
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
