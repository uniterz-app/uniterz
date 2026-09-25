/**
 * NbaTeamDetailPanelNative UI chrome（7言語）
 * EDGE の shape label/condition は `shapeDefs` の UiStrings を使う
 * DRAFT ASSETS chrome は `nbaDraftAssetsUiCopy` 共有
 */
import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";
import type { NbaApronStatus } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import {
  draftBadgeHeadline,
  nbaDraftAssetsUiCopy,
} from "@/lib/nba/draftPicks/nbaDraftAssetsUiCopy";

export { draftBadgeHeadline };

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
        ja: `キャップ総額 (${label})`,
        en: `CAP TOTAL (${label})`,
        ko: `캡 총액 (${label})`,
        zh: `总帽薪 (${label})`,
        es: `TOTAL CAP (${label})`,
        pt: `TOTAL CAP (${label})`,
        fr: `TOTAL CAP (${label})`,
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
    activeSalaryLabel: L(lang, {
      ja: "Active",
      en: "Active",
      ko: "Active",
      zh: "Active",
      es: "Active",
      pt: "Active",
      fr: "Active",
    }),
    deadMoneyLabel: L(lang, {
      ja: "DEAD SALARY",
      en: "DEAD SALARY",
      ko: "DEAD SALARY",
      zh: "DEAD SALARY",
      es: "DEAD SALARY",
      pt: "DEAD SALARY",
      fr: "DEAD SALARY",
    }),
    deadMoneySection: L(lang, {
      ja: "DEAD SALARY",
      en: "DEAD SALARY",
      ko: "DEAD SALARY",
      zh: "DEAD SALARY",
      es: "DEAD SALARY",
      pt: "DEAD SALARY",
      fr: "DEAD SALARY",
    }),
    deadSalaryBadge: L(lang, {
      ja: "DEAD SALARY",
      en: "DEAD SALARY",
      ko: "DEAD SALARY",
      zh: "DEAD SALARY",
      es: "DEAD SALARY",
      pt: "DEAD SALARY",
      fr: "DEAD SALARY",
    }),
    deadSalaryLegend: L(lang, {
      ja: "ロスター外でも残るキャップ負担（WAIVE / STRETCH）",
      en: "Cap hit still on the books after waive / stretch",
      ko: "로스터 밖이어도 남는 캡 부담 (WAIVE / STRETCH)",
      zh: "不在名册仍计入帽薪（WAIVE / STRETCH）",
      es: "Impacto de tope que queda tras waivers / stretch",
      pt: "Impacto de teto que resta após waive / stretch",
      fr: "Impact cap qui reste après waive / stretch",
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
    twoWayContract: L(lang, {
      ja: "Two-Way 契約",
      en: "Two-Way contract",
      ko: "투웨이 계약",
      zh: "双向合同",
      es: "Contrato Two-Way",
      pt: "Contrato Two-Way",
      fr: "Contrat Two-Way",
    }),
    exhibit10Contract: L(lang, {
      ja: "Exhibit 10（非保証キャンプ）",
      en: "Exhibit 10 (non-guaranteed camp)",
      ko: "Exhibit 10 (비보장 캠프)",
      zh: "Exhibit 10（非保障训练营）",
      es: "Exhibit 10 (campamento no garantizado)",
      pt: "Exhibit 10 (campo não garantido)",
      fr: "Exhibit 10 (camp non garanti)",
    }),
    ...nbaDraftAssetsUiCopy(lang),
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
