/**
 * クリップボードへコピー。HTTPS 以外や一部 WebView では
 * `navigator.clipboard` が無いため execCommand にフォールバックする。
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard?.writeText
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall through */
    }
  }

  if (typeof document === "undefined") return false;

  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
