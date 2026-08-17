/**
 * チュートリアル「スキップ」押下時の確認ダイアログ用文言。
 * LiveCoach / Annotator にそのまま渡す。
 */
export type TutorialSkipConfirmCopy = {
  skipConfirmTitle: string;
  skipConfirmBody: string;
  skipConfirmStay: string;
  skipConfirmLeave: string;
};

export function tutorialSkipConfirmProps(tutorial: {
  skipConfirmTitle: string;
  skipConfirmBody: string;
  skipConfirmStay: string;
  skipConfirmLeave: string;
}): TutorialSkipConfirmCopy {
  return {
    skipConfirmTitle: tutorial.skipConfirmTitle,
    skipConfirmBody: tutorial.skipConfirmBody,
    skipConfirmStay: tutorial.skipConfirmStay,
    skipConfirmLeave: tutorial.skipConfirmLeave,
  };
}
