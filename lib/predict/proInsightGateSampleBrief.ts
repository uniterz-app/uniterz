/**
 * Free ゲート下の表示イメージ用サンプル（新 UI · 試合1本ナラティブ）。
 * BOS @ LAL · 移動距離・Tatum OUT を含む。A.Davis は出さない。
 */
import type { ProInsightNarrativeBrief } from "@/lib/predict/proInsightNarrativeTypes";
import {
  formatTravelKm,
  nbaTravelAbbr,
} from "@/lib/nba/nbaArenaTravel";
import { travelSummaryForBrief } from "@/lib/predict/nbaProBriefTravel";

const TIP_MS = Date.UTC(2026, 2, 13, 2, 30);
const HOUR = 60 * 60 * 1000;

/** BOS → MIA（30h前）→ LAL 今夜。今夜移動 + 48h 合計を出す */
const CELTICS_TRAVEL = travelSummaryForBrief({
  teamId: "nba-celtics",
  tonightVenueTeamId: "nba-lakers",
  tonightStartAtMs: TIP_MS,
  recentStops: [
    {
      venueTeamId: "nba-celtics",
      startAtMs: TIP_MS - 72 * HOUR,
    },
    {
      venueTeamId: "nba-heat",
      startAtMs: TIP_MS - 30 * HOUR,
    },
  ],
});

const tonightHop = `${nbaTravelAbbr(CELTICS_TRAVEL.tonightFromId ?? "")}→${nbaTravelAbbr(CELTICS_TRAVEL.tonightToId)}`;
const tonightKm =
  CELTICS_TRAVEL.tonightKm != null
    ? formatTravelKm(CELTICS_TRAVEL.tonightKm)
    : "";
const windowKm = formatTravelKm(CELTICS_TRAVEL.windowKm);

const e = (line: string) => ({
  ja: line,
  en: line,
  ko: line,
  zh: line,
  es: line,
  pt: line,
  fr: line,
});

export const PRO_INSIGHT_GATE_SAMPLE_BRIEF: ProInsightNarrativeBrief = {
  homeTeamId: "nba-lakers",
  awayTeamId: "nba-celtics",
  sampleNote: null,
  sections: [
    {
      kind: "MATCHUP",
      items: [
        {
          body: {
            ja: "BOS の 3P ボリュームは上位だが、J.Tatum OUT で決め手が薄い。外周は LAL 有利に寄りやすい。",
            en: "BOS leads in 3P volume, but without J.Tatum the finisher thins out — edge LAL on the perimeter.",
            ko: "BOS 3P 볼륨은 상위지만 J.Tatum OUT으로 마무리가 얇다. 외곽은 LAL 유리.",
            zh: "凯尔特人三分出手靠前，但 J.Tatum OUT 终结变薄，外线偏湖人有利。",
            es: "BOS lidera en volumen de 3P, pero sin J.Tatum remata menos — ventaja LAL en perímetro.",
            pt: "BOS lidera em volume de 3P, mas sem J.Tatum finaliza menos — vantagem LAL no perímetro.",
            fr: "BOS mène en volume 3P, mais sans J.Tatum finit moins — avantage LAL au périmètre.",
          },
          evidence: [e("BOS 3PA #3 · Opp 3P% #24 · J.Tatum OUT")],
        },
        {
          body: {
            ja: "LAL のリバウンドは上位。BOS は連戦でボックスアウトが甘くなりやすく、ボードは LAL 有利。",
            en: "LAL rank high on the glass. BOS on a B2B tend to box out late — edge LAL rebounding.",
            ko: "LAL 리바운드 상위. BOS는 연전이라 박스아웃이 늦기 쉬워 보드에서 LAL 유리.",
            zh: "湖人篮板靠前。凯尔特人连战易松掉篮板，篮板偏湖人有利。",
            es: "LAL alto en rebotes. BOS en B2B boxea tarde — ventaja LAL.",
            pt: "LAL alto no rebote. BOS em B2B boxeia tarde — vantagem LAL.",
            fr: "LAL fort au rebond. BOS en B2B boxe tard — avantage LAL.",
          },
          evidence: [e("LAL OREB% #4 · Opp DREB% #26 · BOS rest 0")],
        },
      ],
    },
    {
      kind: "SCHEDULE",
      items: [
        {
          body: {
            ja: `BOS は ${tonightHop} · 移動距離 ${tonightKm}。LAL は休養 2 日・ホーム。今夜いちばん大きい負荷差。`,
            en: `BOS ${tonightHop} · travel ${tonightKm}. LAL with 2 days rest at home — clearest load gap tonight.`,
            ko: `BOS ${tonightHop} · 이동 ${tonightKm}. LAL은 2일 휴식·홈. 오늘 가장 큰 부하 차.`,
            zh: `凯尔特人 ${tonightHop} · 移动 ${tonightKm}。湖人休息 2 天主场——今晚最大负荷差。`,
            es: `BOS ${tonightHop} · viaje ${tonightKm}. LAL con 2 días en casa — mayor hueco de carga.`,
            pt: `BOS ${tonightHop} · viagem ${tonightKm}. LAL com 2 dias em casa — maior gap de carga.`,
            fr: `BOS ${tonightHop} · trajet ${tonightKm}. LAL avec 2 jours à domicile — plus grand écart de charge.`,
          },
          evidence: [
            e(`BOS ${tonightHop} ${tonightKm} · 48h ${windowKm} · LAL rest 2`),
          ],
        },
        {
          body: {
            ja: "BOS は連戦2日目・4日で3試合目。LAL は前試合 OT で主力 2 人が 36 分超。",
            en: "BOS: 2nd of a B2B, 3rd game in 4 nights. LAL had two starters 36+ min after OT.",
            ko: "BOS는 백투백 2번째·4일간 3번째. LAL은 직전 연장에서 주전 2명 36분 이상.",
            zh: "凯尔特人背靠背第 2 场、4 天内第 3 场。湖人上一场加时两名主力超过 36 分钟。",
            es: "BOS: 2.º del B2B, 3.er en 4 días. LAL: 2 titulares 36+ tras prórroga.",
            pt: "BOS: 2.º do B2B, 3.º em 4 dias. LAL: 2 titulares 36+ após OT.",
            fr: "BOS: 2e du B2B, 3e en 4 jours. LAL: 2 titulaires 36+ après OT.",
          },
          evidence: [e("BOS B2B · 3 in 4 · LAL OT · A.Reaves 38 · L.James 37")],
        },
      ],
    },
    {
      kind: "CONTEXT",
      items: [
        {
          body: {
            ja: "LAL は直近 10 の NET が上振れ。BOS は格上相手に直近 5 で 1勝4敗。",
            en: "LAL’s last-10 NET is up. BOS are 1-4 in their last 5 vs .500+ foes.",
            ko: "LAL은 최근 10 NET이 상승. BOS는 강호 상대 최근 5경기 1승 4패.",
            zh: "湖人近 10 场 NET 上扬。凯尔特人对阵五成以上近 5 场 1 胜 4 负。",
            es: "NET de LAL en últimos 10 arriba. BOS 1-4 en 5 vs .500+.",
            pt: "NET do LAL nos últimos 10 sobe. BOS 1-4 em 5 vs .500+.",
            fr: "NET LAL sur 10 en hausse. BOS 1-4 sur 5 vs .500+.",
          },
          evidence: [e("LAL last10 NET +4.2 · BOS vs .500+ 1-4")],
        },
        {
          body: {
            ja: "LAL の直近相手は勝率 5 割未満続き。今夜は格上ロードの BOS で強度が上がる。",
            en: "LAL’s recent foes were mostly sub-.500. Tonight a tougher road BOS raises the bar.",
            ko: "LAL 최근 상대는 승률 5할 미만이 많았다. 오늘은 강호 원정 BOS로 강도가 오른다.",
            zh: "湖人近几场对手多在五成以下。今晚客场强队凯尔特人强度上升。",
            es: "Rivales recientes de LAL bajo .500. Hoy BOS de visita sube la intensidad.",
            pt: "Rivais recentes do LAL abaixo de .500. Hoje BOS visitante sobe a intensidade.",
            fr: "Adversaires récents de LAL sous .500. Ce soir BOS en déplacement monte l’intensité.",
          },
          evidence: [e("LAL last 4 opp win% .41 · vs BOS")],
        },
      ],
    },
    {
      kind: "INJURY IMPACT",
      items: [
        {
          body: {
            ja: "J.Tatum OUT · BOS 今季欠場時 11-6。チーム USG/AST リーダー欠場で形が変わり、OFF −5.3 · DEF +1.8。LAL 有利。",
            en: "J.Tatum OUT · BOS when-out 11-6. Team USG/AST leader out — shape shifts; OFF −5.3 · DEF +1.8. Edge LAL.",
            ko: "J.Tatum OUT · BOS 결장 시 11-6. 팀 USG/AST 리더 결장으로 형이 바뀌고 OFF −5.3 · DEF +1.8. LAL 유리.",
            zh: "J.Tatum OUT · 凯尔特人本季缺阵 11-6。球队 USG/AST 核心缺阵导致形制变化；OFF −5.3 · DEF +1.8。偏湖人有利。",
            es: "J.Tatum OUT · BOS sin él 11-6. Sale el líder USG/AST — cambia la forma; OFF −5.3 · DEF +1.8. Ventaja LAL.",
            pt: "J.Tatum OUT · BOS sem ele 11-6. Sai o líder USG/AST — a forma muda; OFF −5.3 · DEF +1.8. Vantagem LAL.",
            fr: "J.Tatum OUT · BOS sans lui 11-6. Leader USG/AST absent — la forme change ; OFF −5.3 · DEF +1.8. Avantage LAL.",
          },
          evidence: [
            e(
              "J.Tatum OUT · leaders USG/AST/… · when-out 11-6 · 109.9-110.1 · OFF −5.3 · DEF +1.8"
            ),
          ],
        },
        {
          body: {
            ja: "LAL は主力フル。欠場の影響は BOS 側に寄っており、今夜は LAL 有利。",
            en: "LAL are at full strength. The absence load sits with BOS — edge LAL tonight.",
            ko: "LAL은 주력 풀. 결장 영향은 BOS 쪽에 있어 오늘은 LAL 유리.",
            zh: "湖人主力齐全。伤停影响在凯尔特人一侧，今晚偏湖人有利。",
            es: "LAL a plena. La carga de bajas cae en BOS — ventaja LAL.",
            pt: "LAL completo. A carga de baixas fica com o BOS — vantagem LAL.",
            fr: "LAL au complet. La charge d’absences est côté BOS — avantage LAL.",
          },
          evidence: [e("LAL OUT 0 · BOS OUT 1 (J.Tatum)")],
        },
      ],
    },
  ],
};

/** @deprecated 旧 HOME/AWAY Brief 型。ゲート例はナラティブのみ。 */
export type ProInsightGateSampleBrief = ProInsightNarrativeBrief;
