/**
 * NbaTeamDetailPanelNative UI chrome（7言語）
 * データ側 labelJa/labelEn は呼び出し側で lang === "ja" ? ja : en
 */
import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";
import type { NbaApronStatus } from "@/lib/predict/nbaTeamDetailPreviewMocks";

export type NbaTeamDetailUiLang = LocalizedLang;
export const resolveNbaTeamDetailUiLang = resolveLocalizedLang;

export function nbaTeamDetailUiCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    noData: L(lang, {
      ja: "データがありません",
      en: "No data yet",
      ko: "데이터가 없습니다",
      zh: "暂无数据",
      es: "Sin datos aún",
      pt: "Sem dados ainda",
      fr: "Pas encore de données",
    }),
    apronSpace1st: L(lang, {
      ja: "1ST APRON余裕",
      en: "1ST APRON SPACE",
      ko: "1ST APRON 여유",
      zh: "1ST APRON 空间",
      es: "ESPACIO 1ST APRON",
      pt: "ESPAÇO 1ST APRON",
      fr: "ESPACE 1ST APRON",
    }),
    apronSpace2nd: L(lang, {
      ja: "2ND APRON余裕",
      en: "2ND APRON SPACE",
      ko: "2ND APRON 여유",
      zh: "2ND APRON 空间",
      es: "ESPACIO 2ND APRON",
      pt: "ESPAÇO 2ND APRON",
      fr: "ESPACE 2ND APRON",
    }),
    totalSalary: (label: string) =>
      L(lang, {
        ja: `総年俸 (${label})`,
        en: `TOTAL SALARY (${label})`,
        ko: `총 연봉 (${label})`,
        zh: `总薪资 (${label})`,
        es: `SALARIO TOTAL (${label})`,
        pt: `SALÁRIO TOTAL (${label})`,
        fr: `SALAIRE TOTAL (${label})`,
      }),
    committedSalary: (label: string) =>
      L(lang, {
        ja: `確定年俸 (${label})`,
        en: `COMMITTED (${label})`,
        ko: `확정 연봉 (${label})`,
        zh: `已承诺薪资 (${label})`,
        es: `COMPROMETIDO (${label})`,
        pt: `COMPROMETIDO (${label})`,
        fr: `ENGAGÉ (${label})`,
      }),
    byPlayerCapPct: (count: number) =>
      L(lang, {
        ja: `選手内訳 (${count}名) · % はCAP比`,
        en: `BY PLAYER (${count}) · % OF CAP`,
        ko: `선수 구성 (${count}명) · CAP 대비 %`,
        zh: `球员构成 (${count}人) · 占 CAP %`,
        es: `POR JUGADOR (${count}) · % DEL CAP`,
        pt: `POR JOGADOR (${count}) · % DO CAP`,
        fr: `PAR JOUEUR (${count}) · % DU CAP`,
      }),
    fetchError: L(lang, {
      ja: "一部データの取得に失敗しました。表示が古い／空の可能性があります。",
      en: "Some live data failed to load. Parts may be empty or stale.",
      ko: "일부 데이터 불러오기에 실패했습니다. 표시가 오래되었거나 비어 있을 수 있습니다.",
      zh: "部分数据加载失败。显示可能过时或为空。",
      es: "Falló la carga de algunos datos. Partes pueden estar vacías o desactualizadas.",
      pt: "Falha ao carregar alguns dados. Partes podem estar vazias ou desatualizadas.",
      fr: "Échec du chargement de certaines données. Des parties peuvent être vides ou obsolètes.",
    }),
    contractLegendTitle: L(lang, {
      ja: "契約オプション / 表記凡例",
      en: "CONTRACT OPTIONS & LEGEND",
      ko: "계약 옵션 / 범례",
      zh: "合同选项 / 图例",
      es: "OPCIONES DE CONTRATO Y LEYENDA",
      pt: "OPÇÕES DE CONTRATO E LEGENDA",
      fr: "OPTIONS DE CONTRAT ET LÉGENDE",
    }),
    teamOption: L(lang, {
      ja: "チームオプション（球団に行使権）",
      en: "Team Option (Club decision)",
      ko: "팀 옵션 (구단 결정)",
      zh: "球队选项（俱乐部决定）",
      es: "Opción de equipo (decisión del club)",
      pt: "Opção do time (decisão do clube)",
      fr: "Option club (décision de l’équipe)",
    }),
    playerOption: L(lang, {
      ja: "プレイヤーオプション（選手に行使権）",
      en: "Player Option (Player decision)",
      ko: "선수 옵션 (선수 결정)",
      zh: "球员选项（球员决定）",
      es: "Opción de jugador (decisión del jugador)",
      pt: "Opção do jogador (decisão do jogador)",
      fr: "Option joueur (décision du joueur)",
    }),
    mutualOption: L(lang, {
      ja: "双方合意オプション（球団・選手両方）",
      en: "Mutual Option (Both agree)",
      ko: "상호 옵션 (양측 합의)",
      zh: "双方选项（双方同意）",
      es: "Opción mutua (ambos acuerdan)",
      pt: "Opção mútua (ambos concordam)",
      fr: "Option mutuelle (accord des deux)",
    }),
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

export type NbaTeamDetailUiCopy = ReturnType<typeof nbaTeamDetailUiCopy>;

export function apronStatusLabel(
  status: NbaApronStatus,
  lang: LocalizedLang
): string {
  switch (status) {
    case "under_cap":
      return L(lang, {
        ja: "CAP以下",
        en: "UNDER CAP",
        ko: "캡 이하",
        zh: "薪资帽下",
        es: "BAJO CAP",
        pt: "ABAIXO DO CAP",
        fr: "SOUS LE CAP",
      });
    case "over_cap":
      return L(lang, {
        ja: "CAP超過",
        en: "OVER CAP",
        ko: "캡 초과",
        zh: "超薪资帽",
        es: "SOBRE CAP",
        pt: "ACIMA DO CAP",
        fr: "AU-DESSUS DU CAP",
      });
    case "tax_payer":
      return L(lang, {
        ja: "TAX超過",
        en: "TAX PAYER",
        ko: "세금선 초과",
        zh: "超奢侈税",
        es: "TAX PAYER",
        pt: "TAX PAYER",
        fr: "TAX PAYER",
      });
    case "first_apron":
      return L(lang, {
        ja: "1ST APRON超過",
        en: "1ST APRON",
        ko: "1ST APRON 초과",
        zh: "超 1ST APRON",
        es: "1ST APRON",
        pt: "1ST APRON",
        fr: "1ST APRON",
      });
    case "second_apron":
      return L(lang, {
        ja: "2ND APRON超過",
        en: "2ND APRON",
        ko: "2ND APRON 초과",
        zh: "超 2ND APRON",
        es: "2ND APRON",
        pt: "2ND APRON",
        fr: "2ND APRON",
      });
    default:
      return String(status);
  }
}

export function draftBadgeHeadline(
  badgeType: import("@/lib/nba/draftPicks/draftPicksTypes").NbaDraftPickBadgeType,
  ui: NbaTeamDetailUiCopy,
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
