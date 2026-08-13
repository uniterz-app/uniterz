/**
 * チュートリアル「情報タブ」ステップ用。
 * オーバーレイから NbaPredictToolsTabsNative の setTab を叩く。
 * （CyberSlantedTab 本体は変更しない）
 */

export type TutorialPredictToolsTab =
  | "insight"
  | "injuries"
  | "stats"
  | "roster";

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
  tab: TutorialPredictToolsTab
): void {
  for (const fn of listeners) fn(tab);
}

export const TUTORIAL_PREDICT_TOOLS_TABS: TutorialPredictToolsTab[] = [
  "insight",
  "injuries",
  "stats",
  "roster",
];

export const TUTORIAL_PREDICT_TOOLS_TAB_LABELS: Record<
  TutorialPredictToolsTab,
  string
> = {
  insight: "INSIGHT",
  injuries: "INJURY",
  stats: "STATS",
  roster: "ROSTER",
};
