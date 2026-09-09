/**
 * 重い SVG を 1 回キャプチャして Image に差し替える。
 * 見た目は同じで、以降のベクトル再塗りを止める。
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Image, InteractionManager, PixelRatio, View } from "react-native";
import { captureRef } from "react-native-view-shot";

const MAX_CACHE = 8;
const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();

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
}

function captureRaster(node: View, key: string): Promise<string | null> {
  const pending = inflight.get(key);
  if (pending) return pending;

  const job = (async () => {
    try {
      const uri = await captureRef(node, {
        format: "png",
        quality: 1,
        result: "tmpfile",
        pixelRatio: Math.min(PixelRatio.get(), 2),
      });
      if (typeof uri === "string" && uri.length > 0) {
        cacheSet(key, uri);
        return uri;
      }
    } catch {
      /* SVG のまま残す */
    }
    return null;
  })();

  inflight.set(key, job);
  void job.finally(() => {
    inflight.delete(key);
  });
  return job;
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
};

export default function RasterizeOnceNative({
  cacheKey,
  width,
  height,
  children,
}: Props) {
  const hostRef = useRef<View>(null);
  const [uri, setUri] = useState(() => cacheGet(cacheKey));

  useEffect(() => {
    setUri(cacheGet(cacheKey));
  }, [cacheKey]);

  useEffect(() => {
    if (uri || width < 8 || height < 8) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const task = InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          timeoutId = setTimeout(() => {
            if (cancelled) return;
            const node = hostRef.current;
            if (!node) return;
            const hit = cacheGet(cacheKey);
            if (hit) {
              setUri(hit);
              return;
            }
            void captureRaster(node, cacheKey).then((next) => {
              if (!cancelled && next) setUri(next);
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
  }, [cacheKey, height, uri, width]);

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
