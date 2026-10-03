/**
 * 共有リンクのプレビュー画像（1200×630）。next/og（Satori）で描く。
 * Satori は複数子要素の div に display:flex が必須。
 */
import { ImageResponse } from "next/og";
import type { ReactElement, ReactNode } from "react";
import {
  formatSharePoints,
  formatShareStartTime,
  matchupLabel,
  shareLandingCopy,
} from "@/lib/share/shareLandingCopy";
import type {
  CommunityShareMeta,
  ProfileShareMeta,
  ResultShareMeta,
} from "@/lib/share/shareMetaTypes";

export const SHARE_OG_SIZE = { width: 1200, height: 630 };
export const SHARE_OG_CONTENT_TYPE = "image/png";

const BG = "#05080e";
const ACCENT = "#00F5FF";
const TEXT = "#f4f7fb";
const MUTED = "#8b97a8";
const FONT_FAMILY = "Noto Sans JP";

const c = shareLandingCopy("ja");

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    p,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]).catch(() => null);
}

/** 表示文字だけのサブセット TTF（失敗時は既定フォント） */
async function loadFont(text: string): Promise<ArrayBuffer | null> {
  const run = async () => {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(cssUrl)).text();
    const src = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!src) return null;
    const res = await fetch(src);
    return res.ok ? res.arrayBuffer() : null;
  };
  return withTimeout(run(), 4000);
}

/** PNG / JPEG のときだけ data URL 化（webp 等は Satori が描けない） */
async function loadImageDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  const run = async () => {
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    if (type !== "image/png" && type !== "image/jpeg") return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${buf.toString("base64")}`;
  };
  return withTimeout(run(), 3000);
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: BG,
        backgroundImage:
          "radial-gradient(circle at 85% 10%, rgba(0,245,255,0.18), transparent 45%), radial-gradient(circle at 10% 95%, rgba(0,245,255,0.10), transparent 40%)",
        padding: "56px 72px",
        fontFamily: FONT_FAMILY,
        color: TEXT,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 14, height: 40, background: ACCENT, transform: "skewX(-14deg)" }} />
        <div style={{ fontSize: 34, letterSpacing: 8, color: ACCENT }}>UNITERZ</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}

function ScoreBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        padding: "22px 28px",
        border: `2px solid ${accent ? ACCENT : "rgba(255,255,255,0.18)"}`,
        background: accent ? "rgba(0,245,255,0.10)" : "rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ fontSize: 26, color: MUTED }}>{label}</div>
      <div style={{ fontSize: 64, color: accent ? ACCENT : TEXT }}>{value}</div>
    </div>
  );
}

async function render(node: ReactElement, text: string): Promise<ImageResponse> {
  const font = await loadFont(`UNITERZ${text}0123456789-.:@pt`);
  return new ImageResponse(node, {
    ...SHARE_OG_SIZE,
    ...(font
      ? { fonts: [{ name: FONT_FAMILY, data: font, weight: 700 as const, style: "normal" as const }] }
      : {}),
  });
}

export async function renderGenericShareOgImage(): Promise<ImageResponse> {
  const node = (
    <Frame>
      <div style={{ fontSize: 88 }}>UNITERZ</div>
      <div style={{ fontSize: 40, color: MUTED, marginTop: 16 }}>{c.siteTagline}</div>
    </Frame>
  );
  return render(node, c.siteTagline);
}

export async function renderResultShareOgImage(
  meta: ResultShareMeta | null
): Promise<ImageResponse> {
  if (!meta || meta.kind === "missing") return renderGenericShareOgImage();

  const matchup = matchupLabel(meta.homeName, meta.awayName);
  const title = c.resultTitle(meta.author.name);

  if (!meta.visible) {
    const when =
      meta.startAtMs !== null ? c.lockedStart(formatShareStartTime(meta.startAtMs, "ja")) : "";
    const node = (
      <Frame>
        <div style={{ fontSize: 34, color: MUTED }}>{title}</div>
        <div style={{ fontSize: matchup.length > 28 ? 56 : 76, marginTop: 8 }}>{matchup}</div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 36,
            padding: "24px 32px",
            border: `2px solid ${ACCENT}`,
            background: "rgba(0,245,255,0.08)",
          }}
        >
          <div style={{ fontSize: 40, color: ACCENT }}>{c.lockedTitle}</div>
          {when ? <div style={{ fontSize: 30, color: MUTED, marginTop: 8 }}>{when}</div> : null}
        </div>
      </Frame>
    );
    return render(node, `${title}${matchup}${c.lockedTitle}${when}`);
  }

  const pick = meta.pick ? `${meta.pick.home}-${meta.pick.away}` : "—";
  const final = meta.final ? `${meta.final.home}-${meta.final.away}` : "—";
  const pts = meta.totalPoints !== null ? `${formatSharePoints(meta.totalPoints)}pt` : "—";
  const node = (
    <Frame>
      <div style={{ fontSize: 34, color: MUTED }}>{title}</div>
      <div style={{ fontSize: matchup.length > 28 ? 56 : 72, marginTop: 8 }}>{matchup}</div>
      <div style={{ display: "flex", gap: 24, marginTop: 36 }}>
        <ScoreBox label={c.pickLabel} value={pick} />
        <ScoreBox label={c.finalLabel} value={final} />
        <ScoreBox label={c.pointsLabel} value={pts} accent />
      </div>
    </Frame>
  );
  return render(node, `${title}${matchup}${c.pickLabel}${c.finalLabel}${c.pointsLabel}—`);
}

export async function renderProfileShareOgImage(
  meta: ProfileShareMeta | null
): Promise<ImageResponse> {
  if (!meta || meta.kind === "missing") return renderGenericShareOgImage();

  const avatar = await loadImageDataUrl(meta.photoURL);
  const initial = Array.from(meta.displayName)[0] ?? "U";
  const bio = meta.bio ? meta.bio.slice(0, 70) : c.siteTagline;
  const node = (
    <Frame>
      <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            width={220}
            height={220}
            style={{ borderRadius: 9999, border: `4px solid ${ACCENT}`, objectFit: "cover" }}
            alt=""
          />
        ) : (
          <div
            style={{
              width: 220,
              height: 220,
              borderRadius: 9999,
              border: `4px solid ${ACCENT}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 110,
              color: ACCENT,
              background: "rgba(0,245,255,0.08)",
            }}
          >
            {initial}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 72, lineHeight: 1.1 }}>{meta.displayName}</div>
          <div style={{ fontSize: 36, color: ACCENT, marginTop: 8 }}>{`@${meta.handle}`}</div>
          <div style={{ fontSize: 30, color: MUTED, marginTop: 20, lineHeight: 1.4 }}>{bio}</div>
        </div>
      </div>
    </Frame>
  );
  return render(node, `${meta.displayName}${meta.handle}${bio}${initial}`);
}

export async function renderCommunityShareOgImage(
  meta: CommunityShareMeta | null
): Promise<ImageResponse> {
  if (!meta || meta.kind === "missing") return renderGenericShareOgImage();

  const lead = "グループに招待されています";
  const members = c.communityMembers(meta.memberCount);
  const node = (
    <Frame>
      <div style={{ fontSize: 36, color: MUTED }}>{lead}</div>
      <div style={{ fontSize: 84, marginTop: 8 }}>{meta.name}</div>
      <div style={{ fontSize: 34, color: ACCENT, marginTop: 24 }}>{members}</div>
    </Frame>
  );
  return render(node, `${lead}${meta.name}${members}`);
}
