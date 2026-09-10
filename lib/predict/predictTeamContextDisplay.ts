import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";
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
  lang: LocalizedLang
): string {
  if (kind === "b2b") {
    if (location === "away") {
      return L(lang, {
        ja: "移動あり B2B",
        en: "ROAD B2B",
        ko: "원정 백투백",
        zh: "客场背靠背",
        es: "B2B DE VISITANTE",
        pt: "B2B FORA DE CASA",
        fr: "B2B À L'EXTÉRIEUR",
      });
    }
    if (location === "home") {
      return L(lang, {
        ja: "ホーム B2B",
        en: "HOME B2B",
        ko: "홈 백투백",
        zh: "主场背靠背",
        es: "B2B EN CASA",
        pt: "B2B EM CASA",
        fr: "B2B À DOMICILE",
      });
    }
    return "B2B";
  }
  if (kind === "threeInFour") {
    return L(lang, {
      ja: "3日4試合",
      en: "3-IN-4",
      ko: "4일간 3경기",
      zh: "4 天 3 战",
      es: "3 EN 4",
      pt: "3 EM 4",
      fr: "3 EN 4",
    });
  }
  return L(lang, {
    ja: "休養",
    en: "REST",
    ko: "휴식",
    zh: "休息",
    es: "DESCANSO",
    pt: "DESCANSO",
    fr: "REPOS",
  });
}

function sliceDetail(
  wins: number | undefined,
  losses: number | undefined,
  n: number | undefined,
  lang: LocalizedLang
): string | undefined {
  if (wins == null || losses == null || n == null || n < 1) return undefined;
  const pct = winPct(wins, losses);
  const wl = record(wins, losses);
  const tail = pct != null ? ` · ${pct}% · n=${n}` : ` · n=${n}`;
  const seasonWord = L(lang, {
    ja: "シーズン",
    en: "Season",
    ko: "시즌",
    zh: "赛季",
    es: "Temporada",
    pt: "Temporada",
    fr: "Saison",
  });
  return `${seasonWord} ${wl}${tail}`;
}

/** Pro Info 用 — チーム文脈を行表示へ */
export function teamContextToRow(
  ctx: PredictTeamContext,
  language: string | null | undefined,
  teamSide: "home" | "away"
): TeamContextRowView | null {
  const lang = resolveLocalizedLang(language);
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
        const title = L(lang, {
          ja: `休養 ${days}日以上`,
          en: `${days}+ DAYS REST`,
          ko: `${days}일 이상 휴식`,
          zh: `休息 ${days} 天以上`,
          es: `${days}+ DÍAS DE DESCANSO`,
          pt: `${days}+ DIAS DE DESCANSO`,
          fr: `${days}+ JOURS DE REPOS`,
        });
        const restedSlice = sliceDetail(wins, losses, n, lang);
        return {
          title,
          headline: restedSlice
            ? L(lang, {
                ja: "十分な休息",
                en: "Well rested",
                ko: "충분한 휴식",
                zh: "休息充分",
                es: "Bien descansado",
                pt: "Bem descansado",
                fr: "Bien reposé",
              })
            : L(lang, {
                ja: "今夜は休息十分",
                en: "Rested tonight",
                ko: "오늘은 충분한 휴식",
                zh: "今晚休息充足",
                es: "Descansado esta noche",
                pt: "Descansado hoje",
                fr: "Reposé ce soir",
              }),
          detail: restedSlice,
          tone: ctx.tone,
        };
      }

      const title = restTitle(kind, location, lang);
      const headline =
        wins != null && losses != null
          ? record(wins, losses)
          : kind === "b2b"
            ? L(lang, {
                ja: "今夜2日連戦",
                en: "2nd game in 2 nights",
                ko: "이틀 연속 2번째 경기",
                zh: "两天内第 2 场",
                es: "2.º partido en 2 noches",
                pt: "2.º jogo em 2 noites",
                fr: "2e match en 2 soirs",
              })
            : L(lang, {
                ja: "今夜は疲労日程",
                en: "Heavy schedule",
                ko: "빡빡한 일정",
                zh: "赛程密集",
                es: "Calendario exigente",
                pt: "Calendário pesado",
                fr: "Calendrier chargé",
              });

      let detail = sliceDetail(wins, losses, n, lang);
      if (kind === "b2b" && location === "away" && !detail) {
        detail = L(lang, {
          ja: "前日から移動あり",
          en: "Played yesterday on the road",
          ko: "전날 원정 경기 후 이동",
          zh: "昨日客场作战后转场",
          es: "Jugó ayer como visitante",
          pt: "Jogou ontem fora de casa",
          fr: "A joué hier à l'extérieur",
        });
      }

      return { title, headline, detail, tone: ctx.tone };
    }
    case "winStreak":
      return {
        title: L(lang, {
          ja: "連勝",
          en: "WIN STREAK",
          ko: "연승",
          zh: "连胜",
          es: "RACHA GANADORA",
          pt: "SEQUÊNCIA DE VITÓRIAS",
          fr: "SÉRIE DE VICTOIRES",
        }),
        headline: L(lang, {
          ja: `${p.streak}連勝中`,
          en: `${p.streak} in a row`,
          ko: `${p.streak}연승 중`,
          zh: `${p.streak} 连胜`,
          es: `${p.streak} seguidas`,
          pt: `${p.streak} seguidas`,
          fr: `${p.streak} d'affilée`,
        }),
        tone: ctx.tone,
      };
    case "loseStreak":
      return {
        title: L(lang, {
          ja: "連敗",
          en: "LOSE STREAK",
          ko: "연패",
          zh: "连败",
          es: "RACHA PERDEDORA",
          pt: "SEQUÊNCIA DE DERROTAS",
          fr: "SÉRIE DE DÉFAITES",
        }),
        headline: L(lang, {
          ja: `${p.streak}連敗中`,
          en: `${p.streak} in a row`,
          ko: `${p.streak}연패 중`,
          zh: `${p.streak} 连败`,
          es: `${p.streak} seguidas`,
          pt: `${p.streak} seguidas`,
          fr: `${p.streak} d'affilée`,
        }),
        tone: ctx.tone,
      };
    case "sideForm": {
      const side = String(p.side) === "away" ? "AWAY" : "HOME";
      const wins = Number(p.wins) || 0;
      const losses = Number(p.losses) || 0;
      const window = Number(p.window) || wins + losses;
      const pct = winPct(wins, losses);
      return {
        title: L(lang, {
          ja: `${side}成績`,
          en: `${side} FORM`,
          ko: `${side} 성적`,
          zh: `${side} 战绩`,
          es: `FORMA ${side}`,
          pt: `DESEMPENHO ${side}`,
          fr: `FORME ${side}`,
        }),
        headline: record(wins, losses),
        detail: L(lang, {
          ja: pct != null ? `直近${window} · ${pct}%` : `直近${window}`,
          en: pct != null ? `Last ${window} · ${pct}%` : `Last ${window}`,
          ko: pct != null ? `최근 ${window}경기 · ${pct}%` : `최근 ${window}경기`,
          zh: pct != null ? `近 ${window} 场 · ${pct}%` : `近 ${window} 场`,
          es:
            pct != null ? `Últimos ${window} · ${pct}%` : `Últimos ${window}`,
          pt:
            pct != null ? `Últimos ${window} · ${pct}%` : `Últimos ${window}`,
          fr:
            pct != null ? `${window} derniers · ${pct}%` : `${window} derniers`,
        }),
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
        title: L(lang, {
          ja: `対 ${band}`,
          en: `VS ${band}`,
          ko: `${band} 상대`,
          zh: `对阵 ${band}`,
          es: `VS ${band}`,
          pt: `VS ${band}`,
          fr: `VS ${band}`,
        }),
        headline: record(wins, losses),
        detail:
          pct != null
            ? L(lang, {
                ja: `勝率 ${pct}% · n=${n}`,
                en: `${pct}% win rate · n=${n}`,
                ko: `승률 ${pct}% · n=${n}`,
                zh: `胜率 ${pct}% · n=${n}`,
                es: `${pct}% de victorias · n=${n}`,
                pt: `${pct}% de vitórias · n=${n}`,
                fr: `${pct}% de victoires · n=${n}`,
              })
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
        title: L(lang, {
          ja: `直近${window}`,
          en: `LAST ${window}`,
          ko: `최근 ${window}경기`,
          zh: `近 ${window} 场`,
          es: `ÚLTIMOS ${window}`,
          pt: `ÚLTIMOS ${window}`,
          fr: `${window} DERNIERS`,
        }),
        headline:
          draws > 0
            ? L(lang, {
                ja: `${wins}勝${draws}分${losses}敗`,
                en: `${wins}-${draws}-${losses}`,
                ko: `${wins}승 ${draws}무 ${losses}패`,
                zh: `${wins}胜${draws}平${losses}负`,
                es: `${wins}-${draws}-${losses}`,
                pt: `${wins}-${draws}-${losses}`,
                fr: `${wins}-${draws}-${losses}`,
              })
            : record(wins, losses),
        detail:
          pct != null
            ? L(lang, {
                ja: `勝率 ${pct}%`,
                en: `${pct}% win rate`,
                ko: `승률 ${pct}%`,
                zh: `胜率 ${pct}%`,
                es: `${pct}% de victorias`,
                pt: `${pct}% de vitórias`,
                fr: `${pct}% de victoires`,
              })
            : undefined,
        tone: ctx.tone,
      };
    }
    case "giantKilling":
      return {
        title: L(lang, {
          ja: "格上撃破",
          en: "UPSETS",
          ko: "이변 승리",
          zh: "爆冷取胜",
          es: "SORPRESAS",
          pt: "ZEBRAS",
          fr: "EXPLOITS",
        }),
        headline: L(lang, {
          ja: `${p.count}/${p.total} 試合`,
          en: `${p.count} of ${p.total} games`,
          ko: `${p.total}경기 중 ${p.count}회`,
          zh: `${p.total} 场中 ${p.count} 场`,
          es: `${p.count} de ${p.total} partidos`,
          pt: `${p.count} de ${p.total} jogos`,
          fr: `${p.count} sur ${p.total} matchs`,
        }),
        tone: ctx.tone,
      };
    case "recentUpset":
      return {
        title: L(lang, {
          ja: "直近アップセット",
          en: "RECENT UPSETS",
          ko: "최근 이변",
          zh: "近期爆冷",
          es: "SORPRESAS RECIENTES",
          pt: "ZEBRAS RECENTES",
          fr: "EXPLOITS RÉCENTS",
        }),
        headline: L(lang, {
          ja: `${p.count} 試合`,
          en: `${p.count} games`,
          ko: `${p.count}경기`,
          zh: `${p.count} 场`,
          es: `${p.count} partidos`,
          pt: `${p.count} jogos`,
          fr: `${p.count} matchs`,
        }),
        tone: ctx.tone,
      };
    default:
      return null;
  }
}

export function teamContextRows(
  contexts: PredictTeamContext[],
  language: string | null | undefined,
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
