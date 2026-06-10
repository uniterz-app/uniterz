import type {
  CommunityLeague,
  CommunityMetric,
  CommunityPeriodType,
} from "./types";
import type { Language } from "@/lib/i18n/language";
import { LEAGUE_DISPLAY, type League } from "@/lib/leagues";
import { teamIdToCountryName } from "@/lib/wc/wcCountry";

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
        return "Total points";
      case "totalPrecision":
        return "Score precision";
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
      return "総合ポイント";
    case "totalPrecision":
      return "スコア精度";
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
    return p === "from_now" ? "From group start" : p;
  }
  return p === "from_now" ? "グループ開始以降" : p;
}

/** チームIDから表示名（WC は国旗名、それ以外は nameById または ID 末尾） */
export function rankingTeamLabel(
  teamId: string,
  lang: Language,
  nameById?: Record<string, string>
): string {
  const fromMap = nameById?.[teamId];
  if (fromMap) return fromMap;
  const wc = teamIdToCountryName(teamId, lang);
  if (wc) return wc;
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
