/** 共有ページ（リンクプレビュー・未ログイン画面・閲覧不可画面）の文言 */
import type {
  CommunityShareMeta,
  ProfileShareMeta,
  ResultShareMeta,
} from "@/lib/share/shareMetaTypes";

export type ShareLandingLang = "ja" | "en";

export function shareLandingLang(language: string | null | undefined): ShareLandingLang {
  return language?.toLowerCase().startsWith("ja") ? "ja" : "en";
}

const COPY = {
  ja: {
    siteName: "UNITERZ",
    siteTagline: "スポーツの試合を予想して、ランキングで競うアプリ",
    resultTitle: (author: string) => `${author} さんの予想`,
    pickLabel: "予想",
    finalLabel: "結果",
    pointsLabel: "獲得",
    lockedTitle: "この予想は試合開始後に公開されます",
    lockedStart: (when: string) => `試合開始: ${when}`,
    missingTitle: "この投稿は見られません",
    missingBody: "削除されたか、URL が間違っている可能性があります。",
    profileTitle: (name: string) => `${name} さんのプロフィール`,
    communityTitle: (name: string) => `グループ「${name}」に招待されています`,
    communityMembers: (n: number) => `メンバー ${n}人`,
    ctaStart: "UNITERZ で予想する",
    ctaLogin: "ログイン",
    ctaAuthor: "投稿した人のプロフィールを見る",
    ctaApp: "アプリを入手",
    ctaJoinCommunity: "参加して順位を競う",
    ctaAbout: "UNITERZ について",
    ctaBack: "試合一覧へ",
  },
  en: {
    siteName: "UNITERZ",
    siteTagline: "Predict real games and climb the rankings",
    resultTitle: (author: string) => `${author}'s prediction`,
    pickLabel: "Pick",
    finalLabel: "Final",
    pointsLabel: "Earned",
    lockedTitle: "This prediction unlocks when the game starts",
    lockedStart: (when: string) => `Tip-off: ${when}`,
    missingTitle: "This post isn't available",
    missingBody: "It may have been deleted, or the link is wrong.",
    profileTitle: (name: string) => `${name}'s profile`,
    communityTitle: (name: string) => `You're invited to "${name}"`,
    communityMembers: (n: number) => `${n} members`,
    ctaStart: "Predict on UNITERZ",
    ctaLogin: "Log in",
    ctaAuthor: "View the author's profile",
    ctaApp: "Get the app",
    ctaJoinCommunity: "Join and compete",
    ctaAbout: "About UNITERZ",
    ctaBack: "Back to games",
  },
} as const;

export function shareLandingCopy(lang: ShareLandingLang) {
  return COPY[lang];
}

/** 試合開始時刻（JST 固定） */
export function formatShareStartTime(ms: number, lang: ShareLandingLang): string {
  return new Intl.DateTimeFormat(lang === "ja" ? "ja-JP" : "en-US", {
    timeZone: "Asia/Tokyo",
    month: lang === "ja" ? "numeric" : "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: lang !== "ja",
  }).format(new Date(ms)) + (lang === "ja" ? "" : " JST");
}

function formatPoints(v: number): string {
  return (Math.round(v * 10) / 10).toFixed(1);
}

export function matchupLabel(home: string, away: string): string {
  if (home && away) return `${home} vs ${away}`;
  return home || away;
}

/** リンクプレビュー用タイトル・説明（日本語固定。プレビューは閲覧者の言語を知れない） */
export function resultShareMetadataText(meta: ResultShareMeta | null): {
  title: string;
  description: string;
} {
  const c = COPY.ja;
  if (!meta || meta.kind === "missing") {
    return { title: c.siteName, description: c.siteTagline };
  }
  const matchup = matchupLabel(meta.homeName, meta.awayName);
  const title = `${c.resultTitle(meta.author.name)}｜${matchup}`;
  if (!meta.visible) {
    const when =
      meta.startAtMs !== null ? ` · ${c.lockedStart(formatShareStartTime(meta.startAtMs, "ja"))}` : "";
    return { title, description: `${c.lockedTitle}${when}` };
  }
  const parts: string[] = [];
  if (meta.pick) parts.push(`${c.pickLabel} ${meta.pick.home}-${meta.pick.away}`);
  if (meta.final) parts.push(`${c.finalLabel} ${meta.final.home}-${meta.final.away}`);
  if (meta.totalPoints !== null) parts.push(`${c.pointsLabel} ${formatPoints(meta.totalPoints)}pt`);
  return {
    title,
    description: parts.length ? parts.join(" · ") : c.siteTagline,
  };
}

export function profileShareMetadataText(meta: ProfileShareMeta | null): {
  title: string;
  description: string;
} {
  const c = COPY.ja;
  if (!meta || meta.kind === "missing") {
    return { title: c.siteName, description: c.siteTagline };
  }
  return {
    title: `${c.profileTitle(meta.displayName)}（@${meta.handle}）`,
    description: meta.bio?.slice(0, 120) || c.siteTagline,
  };
}

export function communityShareMetadataText(meta: CommunityShareMeta | null): {
  title: string;
  description: string;
} {
  const c = COPY.ja;
  if (!meta || meta.kind === "missing") {
    return { title: c.siteName, description: c.siteTagline };
  }
  return {
    title: c.communityTitle(meta.name),
    description: `${c.communityMembers(meta.memberCount)} · ${c.siteTagline}`,
  };
}

export { formatPoints as formatSharePoints };
