import type { Language } from "@/lib/i18n/language";
import type {
  PredictTeamContext,
  PredictTeamTone,
} from "@/lib/predict/predictTeamIntel";

export type TeamContextRowView = {
  title: string;
  headline: string;
  detail?: string;
  tone: PredictTeamTone;
};

function winPct(wins: number, losses: number): number | null {
  const n = wins + losses;
  if (n <= 0) return null;
  return Math.round((100 * wins) / n);
}

function record(wins: number, losses: number): string {
  return `${wins}-${losses}`;
}

function restTitle(
  kind: string,
  location: string | undefined,
  language: Language
): string {
  if (kind === "b2b") {
    if (location === "away") {
      return language === "ja" ? "移動あり B2B" : "ROAD B2B";
    }
    if (location === "home") {
      return language === "ja" ? "ホーム B2B" : "HOME B2B";
    }
    return "B2B";
  }
  if (kind === "threeInFour") {
    return language === "ja" ? "3日4試合" : "3-IN-4";
  }
  return language === "ja" ? "休養" : "REST";
}

function sliceDetail(
  wins: number | undefined,
  losses: number | undefined,
  n: number | undefined,
  language: Language
): string | undefined {
  if (wins == null || losses == null || n == null || n < 1) return undefined;
  const pct = winPct(wins, losses);
  if (language === "ja") {
    return pct != null
      ? `シーズン ${record(wins, losses)} · ${pct}% · n=${n}`
      : `シーズン ${record(wins, losses)} · n=${n}`;
  }
  return pct != null
    ? `Season ${record(wins, losses)} · ${pct}% · n=${n}`
    : `Season ${record(wins, losses)} · n=${n}`;
}

/** Pro Info 用 — チーム文脈を行表示へ */
export function teamContextToRow(
  ctx: PredictTeamContext,
  language: Language,
  teamSide: "home" | "away"
): TeamContextRowView | null {
  const p = ctx.params;

  switch (ctx.id) {
    case "rest": {
      const kind = String(p.kind);
      const wins = p.wins != null ? Number(p.wins) : undefined;
      const losses = p.losses != null ? Number(p.losses) : undefined;
      const n = p.n != null ? Number(p.n) : undefined;
      const location =
        p.location != null ? String(p.location) : teamSide === "away" ? "away" : undefined;

      if (kind === "rested") {
        const days = Number(p.days) || 3;
        const title =
          language === "ja" ? `休養 ${days}日以上` : `${days}+ DAYS REST`;
        const restedSlice = sliceDetail(wins, losses, n, language);
        return {
          title,
          headline: restedSlice
            ? language === "ja"
              ? "十分な休息"
              : "Well rested"
            : language === "ja"
              ? "今夜は休息十分"
              : "Rested tonight",
          detail: restedSlice,
          tone: ctx.tone,
        };
      }

      const title = restTitle(kind, location, language);
      const headline =
        wins != null && losses != null
          ? record(wins, losses)
          : kind === "b2b"
            ? language === "ja"
              ? "今夜2日連戦"
              : "2nd game in 2 nights"
            : language === "ja"
              ? "今夜は疲労日程"
              : "Heavy schedule";

      let detail = sliceDetail(wins, losses, n, language);
      if (kind === "b2b" && location === "away" && !detail) {
        detail =
          language === "ja"
            ? "前日から移動あり"
            : "Played yesterday on the road";
      }

      return { title, headline, detail, tone: ctx.tone };
    }
    case "winStreak":
      return {
        title: language === "ja" ? "連勝" : "WIN STREAK",
        headline:
          language === "ja"
            ? `${p.streak}連勝中`
            : `${p.streak} in a row`,
        tone: ctx.tone,
      };
    case "loseStreak":
      return {
        title: language === "ja" ? "連敗" : "LOSE STREAK",
        headline:
          language === "ja"
            ? `${p.streak}連敗中`
            : `${p.streak} in a row`,
        tone: ctx.tone,
      };
    case "sideForm": {
      const side = String(p.side) === "away" ? "AWAY" : "HOME";
      const wins = Number(p.wins) || 0;
      const losses = Number(p.losses) || 0;
      const window = Number(p.window) || wins + losses;
      const pct = winPct(wins, losses);
      return {
        title: language === "ja" ? `${side}成績` : `${side} FORM`,
        headline: record(wins, losses),
        detail:
          pct != null
            ? language === "ja"
              ? `直近${window} · ${pct}%`
              : `Last ${window} · ${pct}%`
            : language === "ja"
              ? `直近${window}`
              : `Last ${window}`,
        tone: ctx.tone,
      };
    }
    case "vsTop": {
      const band = String(p.band ?? "Top10");
      const wins = Number(p.wins) || 0;
      const losses = Number(p.losses) || 0;
      const n = p.n != null ? Number(p.n) : wins + losses;
      const pct = winPct(wins, losses);
      return {
        title: language === "ja" ? `対 ${band}` : `VS ${band}`,
        headline: record(wins, losses),
        detail:
          pct != null
            ? language === "ja"
              ? `勝率 ${pct}% · n=${n}`
              : `${pct}% win rate · n=${n}`
            : `n=${n}`,
        tone: ctx.tone,
      };
    }
    case "recentForm": {
      const draws = Number(p.draws) || 0;
      const wins = Number(p.wins) || 0;
      const losses = Number(p.losses) || 0;
      const window = Number(p.window) || wins + losses + draws;
      const pct = winPct(wins, losses);
      return {
        title: language === "ja" ? `直近${window}` : `LAST ${window}`,
        headline:
          draws > 0
            ? language === "ja"
              ? `${wins}勝${draws}分${losses}敗`
              : `${wins}-${draws}-${losses}`
            : record(wins, losses),
        detail:
          pct != null
            ? language === "ja"
              ? `勝率 ${pct}%`
              : `${pct}% win rate`
            : undefined,
        tone: ctx.tone,
      };
    }
    case "giantKilling":
      return {
        title: language === "ja" ? "格上撃破" : "UPSETS",
        headline:
          language === "ja"
            ? `${p.count}/${p.total} 試合`
            : `${p.count} of ${p.total} games`,
        tone: ctx.tone,
      };
    case "recentUpset":
      return {
        title: language === "ja" ? "直近アップセット" : "RECENT UPSETS",
        headline: language === "ja" ? `${p.count} 試合` : `${p.count} games`,
        tone: ctx.tone,
      };
    default:
      return null;
  }
}

export function teamContextRows(
  contexts: PredictTeamContext[],
  language: Language,
  teamSide: "home" | "away",
  limit = 3
): TeamContextRowView[] {
  const rows: TeamContextRowView[] = [];
  for (const ctx of contexts) {
    const row = teamContextToRow(ctx, language, teamSide);
    if (row) rows.push(row);
    if (rows.length >= limit) break;
  }
  return rows;
}
