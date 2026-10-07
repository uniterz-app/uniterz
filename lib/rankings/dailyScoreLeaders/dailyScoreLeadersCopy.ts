/** TODAY UNITERZ（今日のスコアリーダー）コピー — Web / Native 共用 */
import { L, type LocalizedLang } from "@/lib/i18n/localize";

export const TODAY_LEADERS_TABS = ["nba", "uniterz"] as const;
export type TodayLeadersTab = (typeof TODAY_LEADERS_TABS)[number];

export function dailyScoreLeadersCopy(lang: LocalizedLang) {
  return {
    tabNba: "NBA",
    tabUniterz: "UNITERZ",
    pickUp: "PICK UP",
    proLeague: "PRO LEAGUE",
    pointsUnit: "PTS",
    noFinals: L(lang, {
      ja: "試合が終わると、その日の合計ポイント上位がここに表示されます",
      en: "Today's top scorers appear here once games go final",
      ko: "경기가 끝나면 오늘의 합계 포인트 상위가 여기에 표시됩니다",
      zh: "比赛结束后，这里会显示当天总积分前列",
      es: "Los mejores del día aparecerán cuando terminen los partidos",
      pt: "Os melhores do dia aparecerão quando os jogos terminarem",
      fr: "Les meilleurs du jour s'afficheront à la fin des matchs",
      de: "Die Tagesbesten erscheinen, sobald Spiele beendet sind",
      ar: "سيظهر أصحاب أعلى النقاط هنا بعد انتهاء المباريات",
    }),
    noEntries: L(lang, {
      ja: "まだ対象の予想がありません",
      en: "No counted picks yet",
      ko: "아직 집계 대상 예측이 없습니다",
      zh: "暂无计入的预测",
      es: "Aún no hay picks contabilizados",
      pt: "Ainda não há palpites contabilizados",
      fr: "Aucun pronostic comptabilisé pour l'instant",
      de: "Noch keine gewerteten Tipps",
      ar: "لا توجد توقعات محتسبة بعد",
    }),
    finalsLabel: (finals: number, total: number) =>
      L(lang, {
        ja: `確定 ${finals}/${total} 試合`,
        en: `${finals}/${total} final`,
        ko: `확정 ${finals}/${total}경기`,
        zh: `已结束 ${finals}/${total} 场`,
        es: `${finals}/${total} finalizados`,
        pt: `${finals}/${total} encerrados`,
        fr: `${finals}/${total} terminés`,
        de: `${finals}/${total} beendet`,
        ar: `${finals}/${total} منتهية`,
      }),
    postsLabel: (n: number) =>
      L(lang, {
        ja: `${n} 予想`,
        en: `${n} ${n === 1 ? "pick" : "picks"}`,
        ko: `${n}개 예측`,
        zh: `${n} 个预测`,
        es: `${n} ${n === 1 ? "pick" : "picks"}`,
        pt: `${n} ${n === 1 ? "palpite" : "palpites"}`,
        fr: `${n} ${n === 1 ? "prono" : "pronos"}`,
        de: `${n} ${n === 1 ? "Tipp" : "Tipps"}`,
        ar: `${n} توقعات`,
      }),
  };
}

/** 米国東部の試合日 YYYY-MM-DD → "10/6 ET" */
export function formatDailyScoreSlateLabel(dateKey: string): string {
  const [, m, d] = dateKey.split("-");
  return m && d ? `${Number(m)}/${Number(d)} ET` : dateKey;
}

export function formatDailyScorePoints(points: number): string {
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}
