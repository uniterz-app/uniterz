"use client";

/**
 * 共有リンクの着地画面（未ログイン・Web メンテ中・閲覧不可のとき）。
 * 共有内容の要約 + アプリ / サインアップへの導線。
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { APP_WEB_APP_MAINTENANCE } from "@/lib/app/maintenanceMode";
import { getAppStoreShareUrl } from "@/lib/share/shareAppUrls";
import {
  formatSharePoints,
  formatShareStartTime,
  matchupLabel,
  shareLandingCopy,
  shareLandingLang,
} from "@/lib/share/shareLandingCopy";
import type {
  CommunityShareMeta,
  ProfileShareMeta,
  ResultShareMeta,
} from "@/lib/share/shareMetaTypes";

export type ShareLandingTarget =
  | { kind: "result"; meta: ResultShareMeta | null }
  | { kind: "profile"; meta: ProfileShareMeta | null }
  | { kind: "community"; meta: CommunityShareMeta | null };

type Props = {
  target: ShareLandingTarget;
  /** ログイン後に戻すパス */
  path: string;
  language?: string | null;
  signedIn?: boolean;
};

type Cta = { href: string; label: string; external?: boolean };

function CtaButton({ cta, primary }: { cta: Cta; primary?: boolean }) {
  const cls = primary
    ? "block w-full -skew-x-[14deg] bg-[#00F5FF] py-3.5 text-center text-[15px] font-bold text-[#050508]"
    : "block w-full -skew-x-[14deg] border border-[#00F5FF]/70 py-3 text-center text-[14px] font-bold text-[#00F5FF]";
  const inner = <span className="inline-block skew-x-[14deg]">{cta.label}</span>;
  if (cta.external) {
    return (
      <a href={cta.href} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={cta.href} className={cls}>
      {inner}
    </Link>
  );
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="h-20 w-20 rounded-full border-2 border-[#00F5FF] object-cover"
      />
    );
  }
  return (
    <div className="grid h-20 w-20 place-items-center rounded-full border-2 border-[#00F5FF] bg-[#00F5FF]/10 text-3xl font-bold text-[#00F5FF]">
      {Array.from(name)[0] ?? "U"}
    </div>
  );
}

function ScoreCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`flex flex-1 flex-col items-center border px-2 py-3 ${
        accent ? "border-[#00F5FF] bg-[#00F5FF]/10" : "border-white/15 bg-white/[0.04]"
      }`}
    >
      <span className="text-[11px] text-white/55">{label}</span>
      <span className={`mt-1 text-xl font-bold tabular-nums ${accent ? "text-[#00F5FF]" : "text-white"}`}>
        {value}
      </span>
    </div>
  );
}

export default function ShareLandingView({ target, path, language, signedIn }: Props) {
  const lang = shareLandingLang(
    language ?? (typeof navigator !== "undefined" ? navigator.language : "ja")
  );
  const c = shareLandingCopy(lang);
  const appStoreUrl = getAppStoreShareUrl();
  const webAvailable = !APP_WEB_APP_MAINTENANCE;
  const next = encodeURIComponent(path);

  const primary: Cta = appStoreUrl
    ? { href: appStoreUrl, label: c.ctaApp, external: true }
    : !webAvailable
      ? { href: "/lp", label: c.ctaAbout }
      : signedIn
        ? { href: "/mobile/games", label: c.ctaBack }
        : {
            href: `/mobile/signup?next=${next}`,
            label: target.kind === "community" ? c.ctaJoinCommunity : c.ctaStart,
          };
  const login: Cta | null =
    webAvailable && !signedIn ? { href: `/mobile/login?next=${next}`, label: c.ctaLogin } : null;

  let body: ReactNode;
  let authorCta: Cta | null = null;

  if (target.kind === "result") {
    const m = target.meta;
    if (!m || m.kind === "missing") {
      body = (
        <>
          <h1 className="text-xl font-bold">{c.missingTitle}</h1>
          <p className="mt-2 text-sm text-white/60">{c.missingBody}</p>
        </>
      );
    } else {
      const matchup = matchupLabel(m.homeName, m.awayName);
      if (m.author.handle) {
        authorCta = { href: `/mobile/u/${encodeURIComponent(m.author.handle)}`, label: c.ctaAuthor };
      }
      body = (
        <>
          <p className="text-sm text-white/60">{c.resultTitle(m.author.name)}</p>
          <h1 className="mt-1 text-2xl font-bold">{matchup}</h1>
          {m.visible ? (
            <div className="mt-5 flex gap-2">
              <ScoreCell label={c.pickLabel} value={m.pick ? `${m.pick.home}-${m.pick.away}` : "—"} />
              <ScoreCell label={c.finalLabel} value={m.final ? `${m.final.home}-${m.final.away}` : "—"} />
              <ScoreCell
                label={c.pointsLabel}
                value={m.totalPoints !== null ? `${formatSharePoints(m.totalPoints)}pt` : "—"}
                accent
              />
            </div>
          ) : (
            <div className="mt-5 border border-[#00F5FF]/60 bg-[#00F5FF]/[0.07] px-4 py-3">
              <p className="text-[15px] font-bold text-[#00F5FF]">{c.lockedTitle}</p>
              {m.startAtMs !== null ? (
                <p className="mt-1 text-sm text-white/60">
                  {c.lockedStart(formatShareStartTime(m.startAtMs, lang))}
                </p>
              ) : null}
            </div>
          )}
        </>
      );
    }
  } else if (target.kind === "profile") {
    const m = target.meta;
    if (!m || m.kind === "missing") {
      body = <h1 className="text-xl font-bold">{c.missingTitle}</h1>;
    } else {
      body = (
        <div className="flex flex-col items-center text-center">
          <Avatar url={m.photoURL} name={m.displayName} />
          <h1 className="mt-3 text-2xl font-bold">{m.displayName}</h1>
          <p className="text-sm text-[#00F5FF]">@{m.handle}</p>
          {m.bio ? <p className="mt-3 text-sm whitespace-pre-line text-white/65">{m.bio}</p> : null}
        </div>
      );
    }
  } else {
    const m = target.meta;
    if (!m || m.kind === "missing") {
      body = <h1 className="text-xl font-bold">{c.missingTitle}</h1>;
    } else {
      body = (
        <>
          <p className="text-sm text-white/60">{c.communityTitle(m.name)}</p>
          <h1 className="mt-1 text-2xl font-bold">{m.name}</h1>
          <p className="mt-2 text-sm text-[#00F5FF]">{c.communityMembers(m.memberCount)}</p>
        </>
      );
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-10 text-white">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <span className="h-6 w-2 -skew-x-[14deg] bg-[#00F5FF]" />
          <span className="text-lg font-bold tracking-[0.3em] text-[#00F5FF]">UNITERZ</span>
        </div>
        <section className="border border-white/10 bg-[#05080e]/80 p-5">{body}</section>
        <p className="mt-4 text-center text-xs text-white/50">{c.siteTagline}</p>
        <div className="mt-6 flex flex-col gap-3">
          <CtaButton cta={primary} primary />
          {authorCta ? <CtaButton cta={authorCta} /> : null}
          {login ? <CtaButton cta={login} /> : null}
        </div>
      </div>
    </main>
  );
}
