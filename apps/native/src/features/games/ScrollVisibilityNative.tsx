/**
 * スクロール親の contentOffset 変化を子に通知し、画面近傍だけ重い描画を載せる。
 * UI 見た目は変えず、Viewport 外の Skia をアンマウントする。
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  Dimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type View,
} from "react-native";

type ScrollVisibilityApi = {
  /** スクロール時に呼ぶ（親 ScrollView onScroll） */
  publishScroll: () => void;
  subscribe: (listener: () => void) => () => void;
  margin: number;
};

const ScrollVisibilityContext = createContext<ScrollVisibilityApi | null>(null);

export function ScrollVisibilityProvider({
  children,
  margin = 320,
}: {
  children: ReactNode;
  margin?: number;
}) {
  const listenersRef = useRef(new Set<() => void>());

  const lastPublishRef = useRef(0);
  const publishScroll = useCallback(() => {
    const now = Date.now();
    // 毎フレーム measure は重いので間引き（見た目は変えず負荷だけ下げる）
    if (now - lastPublishRef.current < 80) return;
    lastPublishRef.current = now;
    listenersRef.current.forEach((fn) => fn());
  }, []);

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const api = useMemo(
    () => ({ publishScroll, subscribe, margin }),
    [publishScroll, subscribe, margin]
  );

  return (
    <ScrollVisibilityContext.Provider value={api}>
      {children}
    </ScrollVisibilityContext.Provider>
  );
}

export function useScrollVisibilityOnScroll():
  | ((e: NativeSyntheticEvent<NativeScrollEvent>) => void)
  | undefined {
  const ctx = useContext(ScrollVisibilityContext);
  if (!ctx) return undefined;
  return () => {
    ctx.publishScroll();
  };
}

/**
 * Provider 配下: ウィンドウ内（上下 margin）に近いか。無いときは常に true。
 * `hostRef` は measureInWindow できる View を指すこと。
 */
export function useNearViewportNative(
  hostRef: RefObject<View | null>,
  enabled = true
): { near: boolean; onLayout: () => void } {
  const ctx = useContext(ScrollVisibilityContext);
  const [near, setNear] = useState(!ctx || !enabled);

  const recompute = useCallback(() => {
    if (!ctx || !enabled) {
      setNear(true);
      return;
    }
    const node = hostRef.current;
    if (!node) return;
    node.measureInWindow((_x, y, _w, h) => {
      const winH = Dimensions.get("window").height;
      const visible = y + h > -ctx.margin && y < winH + ctx.margin;
      setNear(visible);
    });
  }, [ctx, enabled, hostRef]);

  useEffect(() => {
    if (!ctx || !enabled) {
      setNear(true);
      return;
    }
    recompute();
    return ctx.subscribe(recompute);
  }, [ctx, enabled, recompute]);

  return { near, onLayout: recompute };
}
