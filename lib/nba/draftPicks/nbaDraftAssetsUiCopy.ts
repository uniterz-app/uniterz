/**
 * チーム詳細 DRAFT ASSETS — UI chrome（7言語）。
 * ピック本文・条件・経緯は ja/en のまま（非 ja は en）。
 */
import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";
import type {
  NbaDraftAssetsSummary,
  NbaDraftPickBadgeType,
} from "@/lib/nba/draftPicks/draftPicksTypes";

/** ピック本文: ja 以外は en（欠ければ ja） */
export function draftPickBodyText(
  lang: LocalizedLang,
  ja: string | null | undefined,
  en: string | null | undefined
): string {
  if (lang === "ja") return (ja ?? en ?? "").trim();
  return (en ?? ja ?? "").trim();
}

export function draftPickBodyLines(
  lang: LocalizedLang,
  ja: readonly string[] | null | undefined,
  en: readonly string[] | null | undefined
): string[] {
  if (lang === "ja") {
    if (ja && ja.length > 0) return [...ja];
    if (en && en.length > 0) return [...en];
    return [];
  }
  if (en && en.length > 0) return [...en];
  if (ja && ja.length > 0) return [...ja];
  return [];
}

export function draftFlexibilityLabel(
  lang: LocalizedLang,
  flexibility: NbaDraftAssetsSummary["flexibility"]
): string {
  const map: Record<NbaDraftAssetsSummary["flexibility"], Parameters<typeof L>[1]> =
    {
      "VERY HIGH": {
        ja: "極めて高い",
        en: "VERY HIGH",
        ko: "매우 높음",
        zh: "极高",
        es: "MUY ALTA",
        pt: "MUITO ALTA",
        fr: "TRÈS ÉLEVÉE",
      },
      HIGH: {
        ja: "高い",
        en: "HIGH",
        ko: "높음",
        zh: "高",
        es: "ALTA",
        pt: "ALTA",
        fr: "ÉLEVÉE",
      },
      MEDIUM: {
        ja: "普通",
        en: "MEDIUM",
        ko: "보통",
        zh: "中",
        es: "MEDIA",
        pt: "MÉDIA",
        fr: "MOYENNE",
      },
      LOW: {
        ja: "低い",
        en: "LOW",
        ko: "낮음",
        zh: "低",
        es: "BAJA",
        pt: "BAIXA",
        fr: "FAIBLE",
      },
      "VERY LOW": {
        ja: "極めて低い",
        en: "VERY LOW",
        ko: "매우 낮음",
        zh: "极低",
        es: "MUY BAJA",
        pt: "MUITO BAIXA",
        fr: "TRÈS FAIBLE",
      },
    };
  return L(lang, map[flexibility]);
}

export function nbaDraftAssetsUiCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    draftAssetsTitle: L(lang, {
      ja: "DRAFT ASSETS (ドラフト指名権・資産)",
      en: "DRAFT ASSETS & CAPITAL",
      ko: "DRAFT ASSETS (드래프트 자산)",
      zh: "DRAFT ASSETS（选秀资产）",
      es: "DRAFT ASSETS Y CAPITAL",
      pt: "DRAFT ASSETS E CAPITAL",
      fr: "DRAFT ASSETS ET CAPITAL",
    }),
    draftSummaryTitle: L(lang, {
      ja: "ドラフト資産サマリー (2027-2033)",
      en: "ASSETS SUMMARY (7-YEAR)",
      ko: "드래프트 자산 요약 (2027-2033)",
      zh: "选秀资产摘要 (2027-2033)",
      es: "RESUMEN DE ACTIVOS (7 AÑOS)",
      pt: "RESUMO DE ATIVOS (7 ANOS)",
      fr: "RÉSUMÉ DES ACTIFS (7 ANS)",
    }),
    flex: L(lang, {
      ja: "柔軟性",
      en: "FLEX",
      ko: "유연성",
      zh: "灵活度",
      es: "FLEX",
      pt: "FLEX",
      fr: "FLEX",
    }),
    firstRound: L(lang, {
      ja: "1巡目指名権",
      en: "1ST ROUND",
      ko: "1라운드 지명권",
      zh: "首轮签",
      es: "1.ª RONDA",
      pt: "1ª RODADA",
      fr: "1ER TOUR",
    }),
    secondRound: L(lang, {
      ja: "2巡目指名権",
      en: "2ND ROUND",
      ko: "2라운드 지명권",
      zh: "次轮签",
      es: "2.ª RONDA",
      pt: "2ª RODADA",
      fr: "2E TOUR",
    }),
    picksUnit: L(lang, {
      ja: "本",
      en: "picks",
      ko: "개",
      zh: "个",
      es: "picks",
      pt: "picks",
      fr: "picks",
    }),
    guar: L(lang, {
      ja: "確定 ",
      en: "Guar ",
      ko: "확정 ",
      zh: "确定 ",
      es: "Guar ",
      pt: "Guar ",
      fr: "Gar ",
    }),
    cond: L(lang, {
      ja: " / 条件付 ",
      en: " / Cond ",
      ko: " / 조건부 ",
      zh: " / 有条件 ",
      es: " / Cond ",
      pt: " / Cond ",
      fr: " / Cond ",
    }),
    swapRights: L(lang, {
      ja: "スワップ権",
      en: "SWAP RIGHTS",
      ko: "스왑 권리",
      zh: "互换权",
      es: "DERECHOS DE SWAP",
      pt: "DIREITOS DE SWAP",
      fr: "DROITS DE SWAP",
    }),
    swapsUnit: L(lang, {
      ja: "件",
      en: "swaps",
      ko: "건",
      zh: "项",
      es: "swaps",
      pt: "swaps",
      fr: "swaps",
    }),
    favorableSwap: L(lang, {
      ja: "有利交換権利",
      en: "Favorable swap",
      ko: "유리한 교환권",
      zh: "有利互换",
      es: "Swap favorable",
      pt: "Swap favorável",
      fr: "Swap favorable",
    }),
    outgoing: L(lang, {
      ja: "放出済み",
      en: "OUTGOING",
      ko: "방출됨",
      zh: "已送出",
      es: "SALIENTES",
      pt: "SAÍDAS",
      fr: "SORTANTS",
    }),
    tradedAway: L(lang, {
      ja: "トレード譲渡",
      en: "Traded away",
      ko: "트레이드 양도",
      zh: "已交易送出",
      es: "Traspasados",
      pt: "Trocados",
      fr: "Échangés",
    }),
    picksTimeline: L(lang, {
      ja: "年別タイムライン (タップで条件詳細)",
      en: "PICKS TIMELINE (TAP FOR DETAILS)",
      ko: "연도별 타임라인 (탭하여 조건)",
      zh: "按年时间线（点按查看条件）",
      es: "CRONOLOGÍA (TOCA PARA DETALLES)",
      pt: "LINHA DO TEMPO (TOQUE P/ DETALHES)",
      fr: "CHRONOLOGIE (TOUCHEZ POUR DÉTAILS)",
    }),
    legendOwn: L(lang, {
      ja: "自前",
      en: "OWN",
      ko: "자체",
      zh: "自有",
      es: "PROPIO",
      pt: "PRÓPRIO",
      fr: "PROPRE",
    }),
    legendFrom: L(lang, {
      ja: "取得",
      en: "FROM",
      ko: "획득",
      zh: "获得",
      es: "DE",
      pt: "DE",
      fr: "DE",
    }),
    legendProt: L(lang, {
      ja: "保護",
      en: "PROT",
      ko: "보호",
      zh: "保护",
      es: "PROT",
      pt: "PROT",
      fr: "PROT",
    }),
    legendOut: L(lang, {
      ja: "放出",
      en: "OUT",
      ko: "방출",
      zh: "送出",
      es: "OUT",
      pt: "OUT",
      fr: "OUT",
    }),
    legendForfeit: L(lang, {
      ja: "没収",
      en: "FORFEIT",
      ko: "몰수",
      zh: "没收",
      es: "FORFEIT",
      pt: "FORFEIT",
      fr: "FORFEIT",
    }),
    none: L(lang, {
      ja: "保有なし",
      en: "None",
      ko: "없음",
      zh: "无",
      es: "Ninguno",
      pt: "Nenhum",
      fr: "Aucun",
    }),
    ownPick: L(lang, {
      ja: "自前指名権",
      en: "OWN PICK",
      ko: "자체 지명권",
      zh: "自有选秀权",
      es: "PICK PROPIO",
      pt: "PICK PRÓPRIO",
      fr: "PICK PROPRE",
    }),
    viaPick: (fromTeamId: string) =>
      L(lang, {
        ja: `獲得 (via ${fromTeamId})`,
        en: `VIA ${fromTeamId}`,
        ko: `획득 (via ${fromTeamId})`,
        zh: `获得 (via ${fromTeamId})`,
        es: `VIA ${fromTeamId}`,
        pt: `VIA ${fromTeamId}`,
        fr: `VIA ${fromTeamId}`,
      }),
    swapWith: (teamId: string) =>
      L(lang, {
        ja: `スワップ権 (${teamId})`,
        en: `SWAP (${teamId})`,
        ko: `스왑권 (${teamId})`,
        zh: `互换权 (${teamId})`,
        es: `SWAP (${teamId})`,
        pt: `SWAP (${teamId})`,
        fr: `SWAP (${teamId})`,
      }),
    protected: L(lang, {
      ja: "プロテクト付き",
      en: "PROTECTED",
      ko: "보호 포함",
      zh: "带保护",
      es: "PROTEGIDO",
      pt: "PROTEGIDO",
      fr: "PROTÉGÉ",
    }),
    outgoingTo: (toTeamId: string) =>
      L(lang, {
        ja: `放出済み (to ${toTeamId})`,
        en: `OUTGOING (to ${toTeamId})`,
        ko: `방출됨 (to ${toTeamId})`,
        zh: `已送出 (to ${toTeamId})`,
        es: `SALIENTES (to ${toTeamId})`,
        pt: `SAÍDAS (to ${toTeamId})`,
        fr: `SORTANTS (to ${toTeamId})`,
      }),
    nbaForfeited: L(lang, {
      ja: "NBA没収",
      en: "NBA FORFEITED",
      ko: "NBA 몰수",
      zh: "NBA 没收",
      es: "NBA FORFEITED",
      pt: "NBA FORFEITED",
      fr: "NBA FORFEITED",
    }),
    conditional: L(lang, {
      ja: "条件付き",
      en: "CONDITIONAL",
      ko: "조건부",
      zh: "有条件",
      es: "CONDICIONAL",
      pt: "CONDICIONAL",
      fr: "CONDITIONNEL",
    }),
    conditionsTitle: L(lang, {
      ja: "行使条件・保護ルール",
      en: "CONDITIONS & CONVEYANCE",
      ko: "행사 조건·보호 규칙",
      zh: "行使条件与保护规则",
      es: "CONDICIONES Y CESIÓN",
      pt: "CONDIÇÕES E CESSÃO",
      fr: "CONDITIONS ET CESSION",
    }),
    noExtraProtection: L(lang, {
      ja: "追加のプロテクション条件はありません（確定）",
      en: "No additional protection conditions (guaranteed).",
      ko: "추가 보호 조건 없음 (확정)",
      zh: "无额外保护条件（确定）",
      es: "Sin condiciones de protección adicionales (garantizado).",
      pt: "Sem condições extras de proteção (garantido).",
      fr: "Pas de conditions de protection supplémentaires (garanti).",
    }),
    close: L(lang, {
      ja: "閉じる",
      en: "CLOSE",
      ko: "닫기",
      zh: "关闭",
      es: "CERRAR",
      pt: "FECHAR",
      fr: "FERMER",
    }),
    noOrigin: L(lang, {
      ja: "経緯データなし",
      en: "No origin on file",
      ko: "경위 데이터 없음",
      zh: "暂无来源记录",
      es: "Sin origen registrado",
      pt: "Sem origem registrada",
      fr: "Pas d’origine enregistrée",
    }),
    tagOwn: L(lang, {
      ja: "自前",
      en: "OWN",
      ko: "자체",
      zh: "自有",
      es: "OWN",
      pt: "OWN",
      fr: "OWN",
    }),
    tagForfeit: L(lang, {
      ja: "没収",
      en: "FORFEIT",
      ko: "몰수",
      zh: "没收",
      es: "FORFEIT",
      pt: "FORFEIT",
      fr: "FORFEIT",
    }),
    tagOut: L(lang, {
      ja: "放出",
      en: "OUT",
      ko: "방출",
      zh: "送出",
      es: "OUT",
      pt: "OUT",
      fr: "OUT",
    }),
    tagProt: L(lang, {
      ja: "プロテクト",
      en: "PROT",
      ko: "보호",
      zh: "保护",
      es: "PROT",
      pt: "PROT",
      fr: "PROT",
    }),
    tagFrom: L(lang, {
      ja: "取得",
      en: "FROM",
      ko: "획득",
      zh: "获得",
      es: "FROM",
      pt: "FROM",
      fr: "FROM",
    }),
  };
}

export type NbaDraftAssetsUiCopy = ReturnType<typeof nbaDraftAssetsUiCopy>;

export function draftBadgeHeadline(
  badgeType: NbaDraftPickBadgeType,
  ui: Pick<
    NbaDraftAssetsUiCopy,
    | "ownPick"
    | "viaPick"
    | "swapWith"
    | "protected"
    | "outgoingTo"
    | "nbaForfeited"
    | "conditional"
  >,
  pick: {
    fromTeamId?: string | null;
    swapWithTeamId?: string | null;
    toTeamId?: string | null;
  }
): string {
  switch (badgeType) {
    case "own":
      return ui.ownPick;
    case "from":
      return ui.viaPick(pick.fromTeamId ?? "");
    case "swap":
      return ui.swapWith(pick.swapWithTeamId ?? "");
    case "prot":
      return ui.protected;
    case "outgoing":
      return ui.outgoingTo(pick.toTeamId ?? "");
    case "forfeited":
      return ui.nbaForfeited;
    default:
      return ui.conditional;
  }
}
