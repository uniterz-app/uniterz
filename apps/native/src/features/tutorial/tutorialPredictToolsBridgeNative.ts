/**
 * チュートリアル「情報タブ」ステップ用。
 * オーバーレイから NbaPredictToolsTabsNative の setTab を叩く。
 * （CyberSlantedTab 本体は変更しない）
 */

export type TutorialPredictToolsTab = "insight" | "info" | "trend";

/** 旧 INJURY / STATS / ROSTER タブは INFORMATION で開く（詳細からの戻り先の既定が "roster"） */
type LegacyPredictToolsTab = TutorialPredictToolsTab | "injuries" | "stats" | "roster";

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
    tab === "injuries" || tab === "stats" || tab === "roster" ? "info" : tab;
  for (const fn of listeners) fn(next);
}

export const TUTORIAL_PREDICT_TOOLS_TABS: TutorialPredictToolsTab[] = [
  "insight",
  "info",
  "trend",
];

export const TUTORIAL_PREDICT_TOOLS_TAB_LABELS: Record<
  TutorialPredictToolsTab,
  string
> = {
  insight: "PRO PICK",
  info: "INFORMATION",
  trend: "TREND",
};
