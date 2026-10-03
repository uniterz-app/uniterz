/**
 * Web の window イベント通知。React Native（Hermes）は `window` はあるが
 * `Event` / `CustomEvent` / `dispatchEvent` が無いので、無ければ何もしない。
 */
export function dispatchWindowEvent<T>(name: string, detail?: T): void {
  if (typeof window === "undefined") return;
  if (typeof window.dispatchEvent !== "function") return;
  try {
    if (detail === undefined) {
      if (typeof Event !== "function") return;
      window.dispatchEvent(new Event(name));
      return;
    }
    if (typeof CustomEvent !== "function") return;
    window.dispatchEvent(new CustomEvent<T>(name, { detail }));
  } catch {
    /* 購読側の例外で呼び出し元を落とさない */
  }
}
