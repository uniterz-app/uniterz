import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import type { Options } from "html-to-image/lib/types";

export type ShareRankCardResult = "shared" | "cancelled" | "unsupported" | "failed";

export type RankCardImagePayload = {
  dataUrl: string;
  blob: Blob;
  file: File;
  /** 順位・リーグ入りの共有本文（URL なし） */
  shareText: string;
};

/** 共有キャプション生成用の文脈（順位・リーグ・母数） */
export type RankCardShareContext = {
  language: Language;
  rank?: number | null;
  leagueLabel?: string | null;
  totalEntries?: number | null;
};

/** 画像取得失敗時の 1px 透明 GIF（キャプチャ中断を防ぐ） */
const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

function getAppUrl(): string | undefined {
  if (typeof process === "undefined") return undefined;
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
}

export function buildRankCardShareCaption(ctx: RankCardShareContext): string {
  const { language, rank, leagueLabel, totalEntries } = ctx;
  const r = t(language).rankings;
  const locale = language === "ja" ? "ja-JP" : "en-US";

  if (typeof rank === "number" && rank > 0 && leagueLabel) {
    const rankStr = rank.toLocaleString(locale);
    if (typeof totalEntries === "number" && totalEntries > 0) {
      return r.shareRankCardText
        .replace("{league}", leagueLabel)
        .replace("{rank}", rankStr)
        .replace("{total}", totalEntries.toLocaleString(locale));
    }
    return r.shareRankCardTextNoTotal
      .replace("{league}", leagueLabel)
      .replace("{rank}", rankStr);
  }

  return language === "ja"
    ? "Uniterz ランキング #Uniterz"
    : "My Uniterz ranking #Uniterz";
}

export function buildRankCardShareUrls(language: Language, shareText?: string) {
  const caption =
    shareText ?? buildRankCardShareCaption({ language });
  const appUrl = getAppUrl();
  const lineText = appUrl ? `${caption}\n${appUrl}` : caption;
  const urlPart = appUrl ? `&url=${encodeURIComponent(appUrl)}` : "";
  return {
    text: caption,
    lineAppUrl: `line://msg/text/${encodeURIComponent(lineText)}`,
    lineUrl: `https://social-plugins.line.me/lineit/share?text=${encodeURIComponent(caption)}${urlPart}`,
    xUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}${urlPart}`,
  };
}

export function isMobileShareContext(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return (
    /iPhone|iPad|iPod|Android/i.test(ua) ||
    (typeof window !== "undefined" &&
      window.matchMedia("(max-width: 768px)").matches)
  );
}

/** 共有 PNG 生成時に除外する要素（data-capture-skip / data-share-exclude） */
export function shouldIncludeInRankCardCapture(el: Node): boolean {
  if (!(el instanceof HTMLElement)) return true;
  if (el.dataset.shareExclude != null) return false;
  if (el.dataset.captureSkip != null) return false;
  return true;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onloadend = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Failed to read blob"));
    };
    reader.readAsDataURL(blob);
  });
}

function baseCaptureOptions(): Options {
  return {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: "#070c18",
    fetchRequestInit: {
      mode: "cors",
      cache: "no-cache",
    },
    filter: shouldIncludeInRankCardCapture,
    /** Google アバター等の CORS 失敗で全体が落ちないようにする */
    onImageErrorHandler: () => TRANSPARENT_PIXEL,
  };
}

async function blobFromCapture(
  node: HTMLElement,
  options: Options
): Promise<Blob> {
  const { toBlob } = await import("html-to-image");
  const blob = await toBlob(node, options);
  if (!blob || blob.size === 0) {
    throw new Error("Empty capture blob");
  }
  return blob;
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  return img
    .decode()
    .then(() => img)
    .finally(() => URL.revokeObjectURL(url));
}

/**
 * キャプチャ PNG を濃紺背景 + ブランドフッター付きの canvas に合成。
 * タイムラインで「切り抜きスクショ」ではなく「公式カード」に見せる。
 * 失敗時は null（呼び出し側で素のキャプチャへフォールバック）。
 */
async function composeBrandedRankCard(captureBlob: Blob): Promise<Blob | null> {
  try {
    const img = await loadImageFromBlob(captureBlob);
    const cardW = img.naturalWidth;
    const cardH = img.naturalHeight;
    if (!cardW || !cardH) return null;

    const pad = Math.round(cardW * 0.055);
    const footerH = Math.round(cardW * 0.075);
    const w = cardW + pad * 2;
    const h = cardH + pad * 2 + footerH;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // 背景: カードと同系色の濃紺グラデ
    const bg = ctx.createLinearGradient(0, 0, w * 0.25, h);
    bg.addColorStop(0, "#0b1526");
    bg.addColorStop(0.55, "#070d1a");
    bg.addColorStop(1, "#04070e");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // カード背面のシアングロー
    const glowR = Math.max(w, h) * 0.7;
    const glow = ctx.createRadialGradient(
      w / 2,
      pad + cardH * 0.35,
      0,
      w / 2,
      pad + cardH * 0.35,
      glowR
    );
    glow.addColorStop(0, "rgba(34,211,238,0.10)");
    glow.addColorStop(0.5, "rgba(34,211,238,0.035)");
    glow.addColorStop(1, "rgba(34,211,238,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // カード本体（影付き）
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = pad * 0.6;
    ctx.shadowOffsetY = pad * 0.18;
    ctx.drawImage(img, pad, pad, cardW, cardH);
    ctx.restore();

    // フッターブランド: シアンティック + UNITERZ / 右にサービス URL
    const baseY = pad + cardH + footerH * 0.68;
    const brandSize = Math.max(12, Math.round(footerH * 0.44));
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(34,211,238,0.9)";
    ctx.fillRect(
      pad,
      baseY - brandSize * 0.8,
      Math.max(2, Math.round(brandSize * 0.16)),
      Math.round(brandSize * 0.95)
    );
    ctx.font = `800 ${brandSize}px Oxanium, 'Avenir Next', Futura, system-ui, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillText("UNITERZ", pad + brandSize * 0.5, baseY);

    const appUrl = getAppUrl();
    if (appUrl) {
      const host = appUrl.replace(/^https?:\/\//, "");
      const urlSize = Math.max(10, Math.round(brandSize * 0.7));
      ctx.font = `600 ${urlSize}px Oxanium, system-ui, sans-serif`;
      ctx.fillStyle = "rgba(140,240,255,0.55)";
      const tw = ctx.measureText(host).width;
      ctx.fillText(host, w - pad - tw, baseY);
    }

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    return blob && blob.size > 0 ? blob : null;
  } catch {
    return null;
  }
}

/** html-to-image でカード DOM を PNG 化（Chrome 向けに段階フォールバック） */
export async function captureRankCardPng(
  node: HTMLElement,
  shareContext: RankCardShareContext
): Promise<RankCardImagePayload> {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready.catch(() => undefined);
  }

  const attempts: Options[] = [
    baseCaptureOptions(),
    { ...baseCaptureOptions(), skipFonts: true },
    { ...baseCaptureOptions(), skipFonts: true, pixelRatio: 1 },
  ];

  let lastError: unknown;
  for (const options of attempts) {
    try {
      const rawBlob = await blobFromCapture(node, options);
      const blob = (await composeBrandedRankCard(rawBlob)) ?? rawBlob;
      const dataUrl = await blobToDataUrl(blob);
      const file = new File([blob], "uniterz-rank-card.png", {
        type: "image/png",
      });
      const shareText = buildRankCardShareCaption(shareContext);
      return { dataUrl, blob, file, shareText };
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Rank card capture failed");
}

/** 画像ファイルを OS の共有シートへ（Instagram / LINE / X 等） */
export async function shareRankCardFile(
  file: File,
  shareText?: string
): Promise<ShareRankCardResult> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return "unsupported";
  }
  const appUrl = getAppUrl();
  const withMeta: ShareData = {
    files: [file],
    ...(shareText ? { text: shareText } : {}),
    ...(appUrl ? { url: appUrl } : {}),
  };
  const filesOnly: ShareData = { files: [file] };
  try {
    if (navigator.canShare?.(filesOnly) === false) {
      return "unsupported";
    }
    await navigator.share(
      navigator.canShare?.(withMeta) !== false ? withMeta : filesOnly
    );
    return "shared";
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return "cancelled";
    }
    // text/url 付きで拒否される環境向けにファイル単体で再試行
    try {
      await navigator.share(filesOnly);
      return "shared";
    } catch (e2) {
      if (e2 instanceof DOMException && e2.name === "AbortError") {
        return "cancelled";
      }
      return "failed";
    }
  }
}

export function downloadRankCardImage(dataUrl: string, filename?: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename ?? "uniterz-rank-card.png";
  a.click();
}
