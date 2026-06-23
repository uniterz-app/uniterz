import type { Options } from "html-to-image/lib/types";
import { formatShareLinkDisplay, buildResultShareUrl, getShareAppOrigin } from "@/lib/share/shareAppUrls";
import {
  shouldIncludeInRankCardCapture,
  isMobileShareContext,
  shareRankCardFile,
  downloadRankCardImage,
} from "@/lib/rankings/shareMyRankCardImage";
import {
  buildResultCardShareCaption,
  type ResultCardShareContext,
} from "@/lib/result/shareResultCardCaption";

export type ShareResultCardResult =
  | "shared"
  | "cancelled"
  | "unsupported"
  | "failed";

export type ResultCardImagePayload = {
  dataUrl: string;
  blob: Blob;
  file: File;
  shareText: string;
  shareUrl?: string;
};

const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

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

/** キャプチャ PNG にブランドフッター + リザルト URL を合成 */
async function composeBrandedResultCard(
  captureBlob: Blob,
  shareUrl?: string
): Promise<Blob | null> {
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

    const bg = ctx.createLinearGradient(0, 0, w * 0.25, h);
    bg.addColorStop(0, "#0b1526");
    bg.addColorStop(0.55, "#070d1a");
    bg.addColorStop(1, "#04070e");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

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

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = pad * 0.6;
    ctx.shadowOffsetY = pad * 0.18;
    ctx.drawImage(img, pad, pad, cardW, cardH);
    ctx.restore();

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

    const linkLabel = shareUrl ? formatShareLinkDisplay(shareUrl) : "";
    if (linkLabel) {
      const urlSize = Math.max(10, Math.round(brandSize * 0.7));
      ctx.font = `600 ${urlSize}px Oxanium, system-ui, sans-serif`;
      ctx.fillStyle = "rgba(140,240,255,0.55)";
      const tw = ctx.measureText(linkLabel).width;
      ctx.fillText(linkLabel, w - pad - tw, baseY);
    }

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    return blob && blob.size > 0 ? blob : null;
  } catch {
    return null;
  }
}

export function buildResultCardShareUrls(shareText: string, shareUrl?: string) {
  const urlPart = shareUrl ? `&url=${encodeURIComponent(shareUrl)}` : "";
  const lineText = shareUrl ? `${shareText}\n${shareUrl}` : shareText;
  return {
    text: shareText,
    lineAppUrl: `line://msg/text/${encodeURIComponent(lineText)}`,
    lineUrl: `https://social-plugins.line.me/lineit/share?text=${encodeURIComponent(shareText)}${urlPart}`,
    xUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}${urlPart}`,
  };
}

/** html-to-image でリザルトカード DOM を PNG 化 */
export async function captureResultCardPng(
  node: HTMLElement,
  shareContext: ResultCardShareContext
): Promise<ResultCardImagePayload> {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready.catch(() => undefined);
  }

  const shareText = buildResultCardShareCaption(shareContext);
  const linkUrl = shareContext.postId
    ? buildResultShareUrl(shareContext.postId, shareContext.appBaseUrl ?? getShareAppOrigin())
    : undefined;

  const attempts: Options[] = [
    baseCaptureOptions(),
    { ...baseCaptureOptions(), skipFonts: true },
    { ...baseCaptureOptions(), skipFonts: true, pixelRatio: 1 },
  ];

  let lastError: unknown;
  for (const options of attempts) {
    try {
      const rawBlob = await blobFromCapture(node, options);
      const blob =
        (await composeBrandedResultCard(rawBlob, linkUrl)) ?? rawBlob;
      const dataUrl = await blobToDataUrl(blob);
      const file = new File([blob], "uniterz-result-card.png", {
        type: "image/png",
      });
      return { dataUrl, blob, file, shareText, shareUrl: linkUrl };
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Result card capture failed");
}

export {
  isMobileShareContext,
  shareRankCardFile as shareResultCardFile,
  downloadRankCardImage as downloadResultCardImage,
};
