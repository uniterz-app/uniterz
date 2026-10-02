/**
 * チーム詳細 OFFSEASON MOVES chrome（9言語）
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import { TEAM_SHORT } from "@/lib/team-short";
import type { NbaOffseasonMove } from "./offseasonMovesTypes";

/** 列あたりの初期表示件数（超えたら SHOW ALL） */
export const OFFSEASON_MOVES_COLLAPSED_ROWS = 8;

export function nbaOffseasonMovesUiCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    sectionTitle: "OFFSEASON MOVES",
    incoming: "IN",
    outgoing: "OUT",
    draft: L(lang, {
      ja: "ドラフト",
      en: "DRAFT",
      ko: "드래프트",
      zh: "选秀",
      es: "DRAFT",
      pt: "DRAFT",
      fr: "DRAFT",
      de: "DRAFT",
      ar: "درافت",
    }),
    signed: L(lang, {
      ja: "新規契約",
      en: "SIGNED",
      ko: "신규 계약",
      zh: "签约",
      es: "FICHAJE",
      pt: "CONTRATADO",
      fr: "SIGNÉ",
      de: "VERPFLICHTET",
      ar: "تعاقد",
    }),
    waived: L(lang, {
      ja: "ウェーブ",
      en: "WAIVED",
      ko: "웨이브",
      zh: "裁掉",
      es: "CORTADO",
      pt: "DISPENSADO",
      fr: "COUPÉ",
      de: "ENTLASSEN",
      ar: "استغناء",
    }),
    unsigned: L(lang, {
      ja: "未契約",
      en: "FA",
      ko: "FA",
      zh: "自由球员",
      es: "AGENTE LIBRE",
      pt: "AGENTE LIVRE",
      fr: "AGENT LIBRE",
      de: "FREE AGENT",
      ar: "لاعب حر",
    }),
    twoWay: "2W",
    empty: L(lang, {
      ja: "なし",
      en: "None",
      ko: "없음",
      zh: "无",
      es: "Ninguno",
      pt: "Nenhum",
      fr: "Aucun",
      de: "Keine",
      ar: "لا يوجد",
    }),
    showAll: (n: number) =>
      L(lang, {
        ja: `すべて表示（${n}）`,
        en: `SHOW ALL (${n})`,
        ko: `모두 보기 (${n})`,
        zh: `显示全部（${n}）`,
        es: `VER TODO (${n})`,
        pt: `VER TUDO (${n})`,
        fr: `TOUT AFFICHER (${n})`,
        de: `ALLE ZEIGEN (${n})`,
        ar: `عرض الكل (${n})`,
      }),
    showLess: L(lang, {
      ja: "閉じる",
      en: "SHOW LESS",
      ko: "접기",
      zh: "收起",
      es: "VER MENOS",
      pt: "VER MENOS",
      fr: "RÉDUIRE",
      de: "WENIGER",
      ar: "عرض أقل",
    }),
    footnote: (priorSeasonKey: string) =>
      L(lang, {
        ja: `${priorSeasonKey} 最終ロスターとの比較。トレードと FA は区別していません。`,
        en: `Compared with the ${priorSeasonKey} final roster. Trades and free agency are not distinguished.`,
        ko: `${priorSeasonKey} 최종 로스터와 비교. 트레이드와 FA는 구분하지 않습니다.`,
        zh: `与 ${priorSeasonKey} 赛季末阵容比较。不区分交易与自由球员签约。`,
        es: `Comparado con la plantilla final de ${priorSeasonKey}. No se distinguen traspasos y agencia libre.`,
        pt: `Comparado ao elenco final de ${priorSeasonKey}. Trocas e agência livre não são diferenciadas.`,
        fr: `Comparé à l'effectif final ${priorSeasonKey}. Échanges et agence libre ne sont pas distingués.`,
        de: `Vergleich mit dem Kader zum Ende ${priorSeasonKey}. Trades und Free Agency werden nicht unterschieden.`,
        ar: `مقارنة بالتشكيلة النهائية لموسم ${priorSeasonKey}. لا يتم التمييز بين الصفقات والوكالة الحرة.`,
      }),
  };
}

export type NbaOffseasonMovesUiCopy = ReturnType<typeof nbaOffseasonMovesUiCopy>;

export type NbaOffseasonMoveTag = {
  /** 例: "DRAFT R1 #8" / "SIGNED" / "WAIVED" */
  label: string | null;
  /** 矢印 + 相手球団（"← OKC" / "→ DAL"） */
  arrow: "←" | "→" | null;
  otherTeamId: string | null;
  otherTeamShort: string | null;
};

export function offseasonMoveTag(
  move: NbaOffseasonMove,
  copy: NbaOffseasonMovesUiCopy
): NbaOffseasonMoveTag {
  const otherTeamShort = move.otherTeamId
    ? TEAM_SHORT[move.otherTeamId] ?? null
    : null;
  const other = { otherTeamId: move.otherTeamId, otherTeamShort };
  switch (move.kind) {
    case "draft": {
      const pick =
        move.draftRound && move.draftNumber
          ? ` R${move.draftRound} #${move.draftNumber}`
          : "";
      return { label: `${copy.draft}${pick}`, arrow: null, otherTeamId: null, otherTeamShort: null };
    }
    case "acquired":
      return { label: null, arrow: "←", ...other };
    case "signed":
      return { label: copy.signed, arrow: null, otherTeamId: null, otherTeamShort: null };
    case "departed":
      return { label: null, arrow: "→", ...other };
    case "waived":
      return {
        label: copy.waived,
        arrow: otherTeamShort ? "→" : null,
        ...other,
      };
    case "unsigned":
    default:
      return { label: copy.unsigned, arrow: null, otherTeamId: null, otherTeamShort: null };
  }
}

/** 行タップでプレイヤー詳細へ行けるか（どこかのロスターにいる選手だけ） */
export function offseasonMoveIsLinkable(
  move: NbaOffseasonMove,
  side: "in" | "out"
): boolean {
  if (side === "in") return true;
  return move.kind === "departed" || (move.kind === "waived" && !!move.otherTeamId);
}
