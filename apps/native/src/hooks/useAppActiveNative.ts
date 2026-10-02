import { useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

/** フォアグラウンド（active）かどうか。background / inactive では false。 */
export function useAppActiveNative(): boolean {
  const [active, setActive] = useState(
    () => AppState.currentState === "active"
  );

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      setActive(next === "active");
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, []);

  return active;
}
