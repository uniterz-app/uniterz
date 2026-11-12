/**
 * チュートリアル「情報タブ」ステップ用。
 * オーバーレイから NbaPredictToolsTabsNative の setTab を叩く。
 * （CyberSlantedTab 本体は変更しない）
 */

export type TutorialPredictToolsTab = "insight" | "info" | "roster";

/** 旧 INJURY / STATS タブ。INFORMATION にまとめたあとも深リンクから開く */
type LegacyPredictToolsTab = TutorialPredictToolsTab | "injuries" | "stats";

type Listener = (tab: TutorialPredictToolsTab) => void;

const listeners = new Set<Listener>();

export function registerTutorialPredictToolsListener(
  next: Listener
): () => void {
  listeners.add(next);
  return () => {
    listeners.delete(next);
  };
}

export function tutorialSelectPredictToolsTab(
  tab: LegacyPredictToolsTab
): void {
  const next: TutorialPredictToolsTab =
    tab === "injuries" || tab === "stats" ? "info" : tab;
  for (const fn of listeners) fn(next);
}

export const TUTORIAL_PREDICT_TOOLS_TABS: TutorialPredictToolsTab[] = [
  "insight",
  "info",
  "roster",
];

export const TUTORIAL_PREDICT_TOOLS_TAB_LABELS: Record<
  TutorialPredictToolsTab,
  string
> = {
  insight: "INSIGHT",
  info: "INFORMATION",
  roster: "ROSTER",
};
