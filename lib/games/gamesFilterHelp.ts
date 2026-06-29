import type { TeamFilterMatchMode } from "./gameTeamFilter";
import type { Language } from "@/lib/i18n/language";

type TeamRow = { id: string; name: string };

export type GamesFilterHelpParams = {
  language: Language;
  selectedIds: string[];
  teams: TeamRow[];
  matchMode: TeamFilterMatchMode;
};

function isJa(language: Language): boolean {
  return language === "ja";
}

/** 現在の絞り込み状態（チーム選択時のみ） */
export function gamesFilterStatusLine({
  language,
  selectedIds,
  teams,
  matchMode,
}: GamesFilterHelpParams): string | null {
  if (selectedIds.length === 0) return null;
  if (selectedIds.length === 1) {
    const n = teams.find((t) => t.id === selectedIds[0])?.name ?? selectedIds[0];
    return isJa(language)
      ? `「${n}」が出る試合を表示しています。`
      : `Showing games that include ${n}.`;
  }
  const [id1, id2] = selectedIds;
  const n1 = teams.find((t) => t.id === id1)?.name ?? id1;
  const n2 = teams.find((t) => t.id === id2)?.name ?? id2;
  if (matchMode === "h2h") {
    return isJa(language)
      ? `「${n1}」対「${n2}」の試合だけを表示しています。`
      : `Showing only games between ${n1} and ${n2}.`;
  }
  return isJa(language)
    ? `「${n1}」または「${n2}」のどちらかが出る試合を表示しています（他チームとの対戦も含みます）。`
    : `Showing games where ${n1} or ${n2} plays—including games vs other teams.`;
}

/** 使い方ボタン内にまとめる説明文 */
export function gamesFilterHelpParagraphs(
  params: GamesFilterHelpParams
): string[] {
  const ja = isJa(params.language);
  const status = gamesFilterStatusLine(params);
  const paragraphs = [
    ja
      ? "チームは選ばなくても、点差だけで絞れます（任意で最大2チーム）。点差は上下どちらか空欄ならその側は制限なし。未開始の試合はそのまま表示されます。"
      : "Team filter is optional—you can use only the score margin. Up to 2 teams if you want. Empty min/max side = no bound on that side. Scheduled games stay visible.",
    ja
      ? "得点差（大きい方の差）が、左の数以上かつ右の数以下の試合に絞ります（両方入れたとき）。例: 8 と 12 → 8〜12点差のみ。"
      : "|Home − Away| must be ≥ min and ≤ max (inclusive). Example: min 8, max 12 → wins by 8–12 points.",
    ja
      ? "2チーム選択時は「どちらかが出る試合」か「直接対決のみ」を切り替えられます。"
      : "With 2 teams selected, switch between “either team plays” and “head-to-head only”.",
  ];
  if (status) paragraphs.unshift(status);
  return paragraphs;
}

export function gamesFilterHelpButtonLabel(language: Language): string {
  return isJa(language) ? "使い方" : "Help";
}
