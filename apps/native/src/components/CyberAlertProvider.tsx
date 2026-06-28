import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import CyberAlertModalNative from "./CyberAlertModalNative";
import type { CyberAlertPayload } from "./cyberAlertTypes";
import { registerCyberAlertHost } from "./cyberAlertHost";

export default function CyberAlertProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CyberAlertPayload | null>(null);
  const queueRef = useRef<CyberAlertPayload[]>([]);
  const showingRef = useRef(false);

  const pump = useCallback(() => {
    if (showingRef.current) return;
    const next = queueRef.current.shift();
    if (!next) {
      setState(null);
      return;
    }
    showingRef.current = true;
    setState(next);
  }, []);

  const enqueue = useCallback(
    (payload: CyberAlertPayload) => {
      queueRef.current.push(payload);
      pump();
    },
    [pump]
  );

  useEffect(() => {
    registerCyberAlertHost(enqueue);
    return () => registerCyberAlertHost(null);
  }, [enqueue]);

  const closeCurrent = useCallback(() => {
    showingRef.current = false;
    setState(null);
    requestAnimationFrame(() => pump());
  }, [pump]);

  const handleButtonPress = useCallback(
    (index: number) => {
      const current = state;
      if (!current) return;
      const btn = current.buttons[index];
      closeCurrent();
      btn?.onPress?.();
    },
    [closeCurrent, state]
  );

  const handleBackdropDismiss = useCallback(() => {
    const cancelIndex = state?.buttons.findIndex((b) => b.style === "cancel") ?? -1;
    if (cancelIndex >= 0) {
      handleButtonPress(cancelIndex);
      return;
    }
    if ((state?.buttons.length ?? 0) <= 1) {
      handleButtonPress(0);
    }
  }, [handleButtonPress, state?.buttons]);

  return (
    <>
      {children}
      <CyberAlertModalNative
        visible={state != null}
        title={state?.title ?? ""}
        message={state?.message ?? ""}
        buttons={state?.buttons ?? [{ text: "OK" }]}
        variant={state?.variant ?? "info"}
        onDismiss={handleBackdropDismiss}
        onButtonPress={handleButtonPress}
      />
    </>
  );
}
