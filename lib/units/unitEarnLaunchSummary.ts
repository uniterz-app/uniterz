/**
 * アプリ起動時の Unit 獲得カード — 未表示の pending_unit_earns を 1 枚にまとめる（Web / Native 共通）
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import { formatUnitEarnRankOrdinal } from "@/lib/units/formatUnitEarnRank";
import {
  pendingUnitEarnDocToPlayEntry,
  type PendingUnitEarnDoc,
} from "@/lib/units/pendingUnitEarnTypes";

/** カードに並べる行数の上限（超えた分は「ほか N 件」） */
export const UNIT_EARN_LAUNCH_MAX_LINES = 4;

/** 起動直後の画面が落ち着くまで待つ */
export const UNIT_EARN_LAUNCH_DELAY_MS = 1400;

export type UnitEarnLaunchLine = {
  id: string;
  amount: number;
  title: string;
  subtitle: string | null;
  rankText: string | null;
};

export type UnitEarnLaunchSummary = {
  ids: string[];
  total: number;
  lines: UnitEarnLaunchLine[];
  hiddenCount: number;
};

export function buildUnitEarnLaunchSummary(
  docs: readonly PendingUnitEarnDoc[],
  language: string | null | undefined
): UnitEarnLaunchSummary | null {
  const copy = unitEarnLaunchCopy(language);
  const all: UnitEarnLaunchLine[] = [...docs]
    .sort((a, b) => a.createdAtMs - b.createdAtMs)
    .map((doc) => {
      const entry = pendingUnitEarnDocToPlayEntry(doc, language);
      return {
        id: doc.id,
        amount: entry.amount,
        title: entry.title?.trim() || entry.label?.trim() || copy.defaultTitle,
        subtitle: entry.subtitle?.trim() || null,
        rankText:
          entry.rank != null ? formatUnitEarnRankOrdinal(entry.rank) : null,
      };
    });
  const positive = all.filter((line) => line.amount > 0);
  if (positive.length === 0) return null;
  return {
    ids: all.map((line) => line.id),
    total: positive.reduce((sum, line) => sum + line.amount, 0),
    lines: positive.slice(0, UNIT_EARN_LAUNCH_MAX_LINES),
    hiddenCount: Math.max(0, positive.length - UNIT_EARN_LAUNCH_MAX_LINES),
  };
}

export function formatUnitEarnLaunchAmount(n: number): string {
  return `+${Math.max(0, Math.floor(n)).toLocaleString("en-US")}`;
}

export function unitEarnLaunchCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    heading: L(lang, {
      ja: "Unit を獲得しました",
      en: "You earned Units",
      ko: "Unit을 획득했습니다",
      zh: "已获得 Unit",
      es: "Has ganado Units",
      de: "Du hast Units erhalten",
      fr: "Tu as gagné des Units",
      ar: "لقد حصلت على Units",
      pt: "Você ganhou Units",
    }),
    defaultTitle: L(lang, {
      ja: "Unit 報酬",
      en: "Unit reward",
      ko: "Unit 보상",
      zh: "Unit 奖励",
      es: "Recompensa Unit",
      de: "Unit-Belohnung",
      fr: "Récompense Unit",
      ar: "مكافأة Unit",
      pt: "Recompensa Unit",
    }),
    total: L(lang, {
      ja: "合計",
      en: "Total",
      ko: "합계",
      zh: "合计",
      es: "Total",
      de: "Gesamt",
      fr: "Total",
      ar: "المجموع",
      pt: "Total",
    }),
    more: (n: number) =>
      L(lang, {
        ja: `ほか ${n} 件`,
        en: `+${n} more`,
        ko: `외 ${n}건`,
        zh: `另有 ${n} 项`,
        es: `+${n} más`,
        de: `+${n} weitere`,
        fr: `+${n} autres`,
        ar: `+${n} أخرى`,
        pt: `+${n} outros`,
      }),
    ok: L(lang, {
      ja: "受け取る",
      en: "Claim",
      ko: "받기",
      zh: "领取",
      es: "Reclamar",
      de: "Abholen",
      fr: "Récupérer",
      ar: "استلام",
      pt: "Resgatar",
    }),
  };
}
