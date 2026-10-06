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
            ja: "BOS は厳しさ 71。相手の強さ 58 に、アウェイで +5、B2B で +8。LAL は 29（相手の強さ 42・ホーム −5・相手B2B −8）。",
            en: "BOS difficulty 71: opponent 58, road +5, B2B +8. LAL 29 (opponent 42 · home −5 · opp B2B −8).",
            ko: "BOS 난이도 71. 상대 전력 58에 원정 +5, 백투백 +8. LAL은 29(상대 전력 42·홈 −5·상대 백투백 −8).",
            zh: "凯尔特人难度 71：对手实力 58，客场 +5，背靠背 +8。湖人 29（对手实力 42 · 主场 −5 · 对手背靠背 −8）。",
            es: "BOS dificultad 71: rival 58, visitante +5, B2B +8. LAL 29 (rival 42 · local −5 · rival en B2B −8).",
            pt: "BOS dificuldade 71: adversário 58, fora +5, B2B +8. LAL 29 (adversário 42 · casa −5 · adversário em B2B −8).",
            fr: "BOS difficulté 71 : adversaire 58, extérieur +5, B2B +8. LAL 29 (adversaire 42 · domicile −5 · adversaire en B2B −8).",
          },
          evidence: [e("BOS 71 = 58 +5 +8 · LAL 29 = 42 −5 −8")],
          template: "difficulty",
        },
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
            ja: "BOS は厳しさ 71 → 81（J.Tatum 欠場）。LAL は厳しさ 29 → 19（相手 J.Tatum 欠場）。攻撃の起点を欠く BOS は押し切る手段が減り、LAL は主導権を握りやすい。",
            en: "BOS Difficulty 71 → 81 (J.Tatum out). LAL Difficulty 29 → 19 (opp J.Tatum out). Without their main creator BOS have fewer ways to close, and LAL get the easier path to control the game.",
            ko: "BOS 난이도 71 → 81 (J.Tatum 결장). LAL 난이도 29 → 19 (상대 J.Tatum 결장). 공격의 기점을 잃은 BOS는 마무리 수단이 줄고, LAL은 주도권을 잡기 쉽다.",
            zh: "BOS 难度 71 → 81（J.Tatum 缺阵）。LAL 难度 29 → 19（对手 J.Tatum 缺阵）。失去进攻发起点的 BOS 终结手段变少，LAL 更容易掌握主动。",
            es: "BOS dificultad 71 → 81 (baja de J.Tatum). LAL dificultad 29 → 19 (baja rival de J.Tatum). Sin su creador principal, BOS tiene menos recursos para cerrar y LAL lo tiene más fácil para mandar.",
            pt: "BOS dificuldade 71 → 81 (J.Tatum fora). LAL dificuldade 29 → 19 (adversário sem J.Tatum). Sem seu criador principal, o BOS tem menos recursos para fechar e o LAL fica com o caminho mais fácil para controlar o jogo.",
            fr: "BOS difficulté 71 → 81 (J.Tatum absent). LAL difficulté 29 → 19 (adversaire sans J.Tatum). Privés de leur créateur principal, les BOS ont moins de solutions pour conclure, et LAL a la voie la plus simple pour contrôler le match.",
          },
          evidence: [e("J.Tatum OUT · impact −4.7 pts (2025-26 · 17 g out) · when out 11-6")],
          template: "injury_difficulty",
        },
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
      ],
    },
  ],
};

/** @deprecated 旧 HOME/AWAY Brief 型。ゲート例はナラティブのみ。 */
export type ProInsightGateSampleBrief = ProInsightNarrativeBrief;
