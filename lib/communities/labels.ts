import type {
  CommunityLeague,
  CommunityMetric,
  CommunityPeriodType,
} from "./types";
import type { Language } from "@/lib/i18n/language";
import { LEAGUE_DISPLAY, type League } from "@/lib/leagues";

export function leagueLabel(league: CommunityLeague, lang: Language): string {
  if (league === "all") {
    return lang === "en" ? "All leagues" : "全リーグ";
  }
  return LEAGUE_DISPLAY[league as League] ?? league;
}

export function metricLabel(m: CommunityMetric, lang: Language): string {
  if (lang === "en") {
    switch (m) {
      case "totalPoints":
        return "SCORE";
      case "totalUpset":
        return "Upset points";
      case "winRate":
        return "Win rate";
      case "activeWinStreak":
        return "Win streak";
      default:
        return m;
    }
  }
  switch (m) {
    case "totalPoints":
      return "SCORE";
    case "totalUpset":
      return "アップセット";
    case "winRate":
      return "勝率";
    case "activeWinStreak":
      return "連勝";
    default:
      return m;
  }
}

export function periodLabel(p: CommunityPeriodType, lang: Language): string {
  if (lang === "en") {
    switch (p) {
      case "from_now":
        return "From group start";
      case "calendar_month":
        return "Calendar month";
      case "nba_season":
        return "NBA season";
      case "nba_playoffs":
        return "NBA playoffs";
      default:
        return p;
    }
  }
  switch (p) {
    case "from_now":
      return "グループ開始以降";
    case "calendar_month":
      return "カレンダー月";
    case "nba_season":
      return "NBAシーズン";
    case "nba_playoffs":
      return "プレーオフ";
    default:
      return p;
  }
}

export function gamesScopeLabel(
  scope: "all" | "pickup",
  lang: Language
): string {
  if (lang === "en") {
    return scope === "pickup" ? "Match Pickup only" : "All ranked games";
  }
  return scope === "pickup" ? "ピックアップのみ" : "全試合（ランキング対象）";
}

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_KEY_RE = /^\d{4}-\d{2}$/;

function formatDateKey(dateKey: string, lang: Language): string {
  if (!DATE_KEY_RE.test(dateKey)) return "—";
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(lang === "en" ? "en-US" : "ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatMonthKey(monthKey: string, lang: Language): string {
  if (!MONTH_KEY_RE.test(monthKey)) return "—";
  const [y, m] = monthKey.split("-").map(Number);
  const date = new Date(y, m - 1, 1);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(lang === "en" ? "en-US" : "ja-JP", {
    year: "numeric",
    month: "long",
  });
}

/** 集計期間の表示値（プリセット + 開始/終了） */
export function communityRankingPeriodValue(
  rankingStartDateKey: string | null | undefined,
  lang: Language,
  opts?: {
    periodType?: CommunityPeriodType;
    rankingEndDateKey?: string | null;
    rankingPeriodMonthKey?: string | null;
    rankingSeasonKey?: string | null;
  }
): string {
  const period = opts?.periodType ?? "from_now";
  if (period === "calendar_month") {
    const mk = opts?.rankingPeriodMonthKey;
    return mk ? formatMonthKey(mk, lang) : periodLabel(period, lang);
  }
  if (period === "nba_season") {
    const sk = opts?.rankingSeasonKey;
    return sk
      ? lang === "en"
        ? `Season ${sk}`
        : `シーズン ${sk}`
      : periodLabel(period, lang);
  }
  if (period === "nba_playoffs") {
    const sk = opts?.rankingSeasonKey;
    return sk
      ? lang === "en"
        ? `Playoffs ${sk}`
        : `プレーオフ ${sk}`
      : periodLabel(period, lang);
  }

  if (!rankingStartDateKey || !DATE_KEY_RE.test(rankingStartDateKey)) {
    return lang === "en" ? "—" : "—";
  }
  const start = formatDateKey(rankingStartDateKey, lang);
  const endKey = opts?.rankingEndDateKey;
  if (endKey && DATE_KEY_RE.test(endKey)) {
    const end = formatDateKey(endKey, lang);
    return lang === "en" ? `${start} → ${end}` : `${start} 〜 ${end}`;
  }
  return lang === "en" ? `From ${start}` : `${start} 以降`;
}

/** チームIDから表示名（WC は国旗名、それ以外は nameById または ID 末尾） */
export function rankingTeamLabel(
  teamId: string,
  lang: Language,
  nameById?: Record<string, string>
): string {
  const fromMap = nameById?.[teamId];
  if (fromMap) return fromMap;
  const tail = teamId.includes("-") ? teamId.split("-").slice(1).join("-") : teamId;
  return tail;
}

/** 複数チームの表示（0件なら null） */
export function rankingTeamsLabel(
  teamIds: string[],
  lang: Language,
  nameById?: Record<string, string>
): string | null {
  if (teamIds.length === 0) return null;
  return teamIds
    .map((id) => rankingTeamLabel(id, lang, nameById))
    .join(lang === "en" ? ", " : "、");
}
