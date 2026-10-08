/**
 * プロフィール Overview チャートの PICK UP / PRO LEAGUE 切替 — Web / Native 共用。
 *
 * PICK UP: profileCharts/{season}
 * PRO LEAGUE: profileCharts/{season}__open（countedForRanking の全予想 + 無差別級順位）
 */
import { L, type LocalizedLang } from "@/lib/i18n/localize";

export type ProfileChartsDivision = "pickup" | "open";

export const PROFILE_CHARTS_OPEN_DOC_SUFFIX = "__open";

export function profileChartsDocId(
  seasonKey: string,
  division: ProfileChartsDivision = "pickup"
): string {
  return division === "open"
    ? `${seasonKey}${PROFILE_CHARTS_OPEN_DOC_SUFFIX}`
    : seasonKey;
}

/**
 * - hidden: 切替タブを出さない（Pro 閲覧者 × 他人の Free プロフィール）
 * - visible: PRO LEAGUE を見られる
 * - locked: タブは出すが PRO LEAGUE は Pro 加入導線（Free 閲覧者は相手を問わずこれ）
 */
export type ProfileOpenChartsAccess = "hidden" | "visible" | "locked";

export function resolveProfileOpenChartsAccess(input: {
  isMe: boolean;
  viewerIsPro: boolean;
  targetIsPro: boolean;
}): ProfileOpenChartsAccess {
  if (!input.viewerIsPro) return "locked";
  if (input.isMe || input.targetIsPro) return "visible";
  return "hidden";
}

export function defaultProfileChartsDivision(
  access: ProfileOpenChartsAccess
): ProfileChartsDivision {
  return access === "visible" ? "open" : "pickup";
}

export function profileChartsDivisionCopy(lang: LocalizedLang, isMe: boolean) {
  return {
    pickUp: "PICK UP",
    proLeague: "PRO LEAGUE",
    lockBody: isMe
      ? L(lang, {
          ja: "Pro に加入すると、PRO LEAGUE（全試合）の順位推移・直近20戦・日別成績を見られます。",
          en: "Go Pro to see your PRO LEAGUE (all games) rank progress, last 20 and daily results.",
          ko: "Pro에 가입하면 PRO LEAGUE(전 경기)의 순위 추이·최근 20경기·일별 성적을 볼 수 있습니다.",
          zh: "加入 Pro 即可查看 PRO LEAGUE（全部比赛）的排名走势、近 20 场和每日成绩。",
          es: "Hazte Pro para ver tu progreso en PRO LEAGUE (todos los partidos), últimos 20 y resultados diarios.",
          pt: "Assine o Pro para ver seu progresso na PRO LEAGUE (todos os jogos), últimos 20 e resultados diários.",
          fr: "Passez Pro pour voir votre progression PRO LEAGUE (tous les matchs), 20 derniers et résultats quotidiens.",
          de: "Mit Pro siehst du deinen PRO LEAGUE-Verlauf (alle Spiele), die letzten 20 und Tagesergebnisse.",
          ar: "اشترك في Pro لرؤية تقدمك في PRO LEAGUE (كل المباريات) وآخر 20 ونتائجك اليومية.",
        })
      : L(lang, {
          ja: "Pro に加入すると、Pro ユーザーの PRO LEAGUE（全試合）の順位推移・直近20戦・日別成績を見られます。",
          en: "Go Pro to see Pro members' PRO LEAGUE (all games) rank progress, last 20 and daily results.",
          ko: "Pro에 가입하면 Pro 사용자의 PRO LEAGUE(전 경기) 순위 추이·최근 20경기·일별 성적을 볼 수 있습니다.",
          zh: "加入 Pro 即可查看 Pro 用户的 PRO LEAGUE（全部比赛）排名走势、近 20 场和每日成绩。",
          es: "Hazte Pro para ver el progreso en PRO LEAGUE (todos los partidos), últimos 20 y resultados diarios de los miembros Pro.",
          pt: "Assine o Pro para ver o progresso na PRO LEAGUE (todos os jogos), últimos 20 e resultados diários dos membros Pro.",
          fr: "Passez Pro pour voir la progression PRO LEAGUE (tous les matchs), les 20 derniers et les résultats quotidiens des membres Pro.",
          de: "Mit Pro siehst du PRO LEAGUE-Verlauf (alle Spiele), letzte 20 und Tagesergebnisse von Pro-Mitgliedern.",
          ar: "اشترك في Pro لرؤية تقدم أعضاء Pro في PRO LEAGUE (كل المباريات) وآخر 20 ونتائجهم اليومية.",
        }),
  };
}
