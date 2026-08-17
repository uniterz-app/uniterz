/**
 * チュートリアル「得点入力」ステップ用。
 * オーバーレイからスコア TextInput の focus / 値更新を行う。
 */

export type TutorialPredictScoreSide = "home" | "away";

type SideHandlers = {
  focus: () => void;
  setValue: (value: string) => void;
  getValue: () => string;
};

const bySide: Partial<Record<TutorialPredictScoreSide, SideHandlers>> = {};

export function registerTutorialPredictScoreSide(
  side: TutorialPredictScoreSide,
  handlers: SideHandlers
): () => void {
  bySide[side] = handlers;
  return () => {
    if (bySide[side] === handlers) delete bySide[side];
  };
}

/** @deprecated registerTutorialPredictScoreSide を使う */
export function registerTutorialPredictScoreFocus(
  side: TutorialPredictScoreSide,
  focus: () => void
): () => void {
  const prev = bySide[side];
  return registerTutorialPredictScoreSide(side, {
    focus,
    setValue: prev?.setValue ?? (() => {}),
    getValue: prev?.getValue ?? (() => ""),
  });
}

export function tutorialFocusPredictScore(
  side: TutorialPredictScoreSide
): void {
  bySide[side]?.focus();
}

export function tutorialSetPredictScore(
  side: TutorialPredictScoreSide,
  value: string
): void {
  const digits = value.replace(/[^0-9]/g, "").slice(0, 3);
  bySide[side]?.setValue(digits);
}

export function tutorialGetPredictScore(
  side: TutorialPredictScoreSide
): string {
  return bySide[side]?.getValue() ?? "";
}
