/**
 * プロフィール写真用。毎回新しい file input を作る。
 * 同じ input のままだと、フォルダ許可を一度拒否したあとクリックするたびに許可画面だけが開く。
 */
let pendingFinish: ((file: File | null) => void) | null = null;

export function pickLocalImageFile(): Promise<File | null> {
  pendingFinish?.(null);

  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.tabIndex = -1;
    input.setAttribute("aria-hidden", "true");
    input.style.position = "fixed";
    input.style.left = "-10000px";
    input.style.top = "0";

    let settled = false;
    const finish = (file: File | null) => {
      if (settled) return;
      settled = true;
      if (pendingFinish === finish) pendingFinish = null;
      input.remove();
      resolve(file);
    };
    pendingFinish = finish;

    input.addEventListener("change", () => {
      finish(input.files?.[0] ?? null);
    });
    input.addEventListener("cancel", () => finish(null));
    document.body.appendChild(input);
    input.click();
  });
}
