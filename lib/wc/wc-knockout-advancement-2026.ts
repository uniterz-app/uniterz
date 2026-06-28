/**
 * WC 2026 グループステージ確定順位（2026-06-28 時点 — 全48チーム・全72試合終了）
 *
 * 3位通過 8 組: BDEFGIKL（Annex C キー）
 */

import type { WcGroupCode } from "@/lib/wc/groups";
import type { WcKnockoutAdvancement } from "@/lib/wc/wc-knockout-bracket-utils";
import { wcTeamIdFromIso3 } from "@/lib/wc/wc-team-display";

const t = wcTeamIdFromIso3;

/** 確定した 1位・2位・3位（全12組） */
export const WC_2026_GROUP_STANDINGS = {
  groupWinners: {
    A: t("mex"),
    B: t("che"),
    C: t("bra"),
    D: t("usa"),
    E: t("deu"),
    F: t("nld"),
    G: t("bel"),
    H: t("esp"),
    I: t("fra"),
    J: t("arg"),
    K: t("col"),
    L: t("eng"),
  } satisfies Partial<Record<WcGroupCode, string>>,

  groupRunnersUp: {
    A: t("zaf"),
    B: t("can"),
    C: t("mar"),
    D: t("aus"),
    E: t("civ"),
    F: t("jpn"),
    G: t("egy"),
    H: t("cpv"),
    I: t("nor"),
    J: t("aut"),
    K: t("prt"),
    L: t("hrv"),
  } satisfies Partial<Record<WcGroupCode, string>>,

  groupThirdPlaces: {
    A: t("kor"),
    B: t("bih"),
    C: t("hti"),
    D: t("pry"),
    E: t("ecu"),
    F: t("swe"),
    G: t("dza"),
    H: t("sau"),
    I: t("sen"),
    J: t("jor"),
    K: t("cod"),
    L: t("gha"),
  } satisfies Partial<Record<WcGroupCode, string>>,

  /** Annex C キー BDEFGIKL に対応 */
  advancingThirdPlaceGroups: [
    "B",
    "D",
    "E",
    "F",
    "G",
    "I",
    "K",
    "L",
  ] as const satisfies readonly WcGroupCode[],
};

export function buildWc2026KnockoutAdvancement(): WcKnockoutAdvancement {
  return {
    groupWinners: { ...WC_2026_GROUP_STANDINGS.groupWinners },
    groupRunnersUp: { ...WC_2026_GROUP_STANDINGS.groupRunnersUp },
    groupThirdPlaces: { ...WC_2026_GROUP_STANDINGS.groupThirdPlaces },
    advancingThirdPlaceGroups: [
      ...WC_2026_GROUP_STANDINGS.advancingThirdPlaceGroups,
    ],
  };
}

/** Firestore 未読込時の静的フォールバック */
export const WC_2026_KNOCKOUT_ADVANCEMENT = buildWc2026KnockoutAdvancement();
