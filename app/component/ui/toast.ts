// app/component/ui/toast.ts
type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: number;
  type: ToastType;
  message: string;
};

let host: ((t: ToastItem) => void) | null = null;
export function _registerToastHost(cb: (t: ToastItem) => void) {
  host = cb;
}

let idSeq = 1;
function push(type: ToastType, message: string) {
  host?.({ id: idSeq++, type, message });
}

export const toast = {
  success: (m: string) => push("success", m),
  error: (m: string) => push("error", m),
  info: (m: string) => push("info", m),
};
