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
    myLabel: "MY RANK",
    myRankOf: (total: number) =>
      L(lang, {
        ja: `/ ${total.toLocaleString("ja-JP")}人`,
        en: `of ${total.toLocaleString("en-US")}`,
        ko: `/ ${total.toLocaleString("ko-KR")}명`,
        zh: `/ ${total.toLocaleString("zh-CN")}人`,
        es: `de ${total.toLocaleString("es-ES")}`,
        pt: `de ${total.toLocaleString("pt-BR")}`,
        fr: `sur ${total.toLocaleString("fr-FR")}`,
        de: `von ${total.toLocaleString("de-DE")}`,
        ar: `من ${total}`,
      }),
    myRankSuffix: L(lang, { ja: "位", en: "", ko: "위", zh: "名", es: "", pt: "", fr: "", de: "", ar: "" }),
    myNoScore: L(lang, {
      ja: "この試合日の対象の予想はまだありません",
      en: "No counted picks from you on this slate",
      ko: "이 경기일에 집계된 내 예측이 아직 없습니다",
      zh: "你在这个比赛日还没有计入的预测",
      es: "Aún no tienes picks contabilizados en esta jornada",
      pt: "Você ainda não tem palpites contabilizados nesta rodada",
      fr: "Aucun de vos pronostics n'est encore comptabilisé ce jour",
      de: "Noch keine gewerteten Tipps von dir an diesem Spieltag",
      ar: "لا توجد لك توقعات محتسبة في هذا اليوم بعد",
    }),
    hitsLabel: (wins: number, posts: number) =>
      L(lang, {
        ja: `${wins}/${posts} 的中`,
        en: `${wins}/${posts} hit`,
        ko: `${wins}/${posts} 적중`,
        zh: `${wins}/${posts} 命中`,
        es: `${wins}/${posts} aciertos`,
        pt: `${wins}/${posts} acertos`,
        fr: `${wins}/${posts} réussis`,
        de: `${wins}/${posts} Treffer`,
        ar: `${wins}/${posts} صحيحة`,
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
