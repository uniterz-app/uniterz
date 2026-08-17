/**
 * チュートリアル「投稿」ステップ用。
 * オーバーレイから予想送信ボタンを押す。
 */

type Handler = {
  submit: () => void;
  enabled: boolean;
  label: string;
};

let handler: Handler | null = null;

export function registerTutorialPredictSubmit(next: Handler): () => void {
  handler = next;
  return () => {
    if (handler === next) handler = null;
  };
}

export function tutorialTriggerPredictSubmit(): boolean {
  if (!handler) return false;
  /** enabled でもブリッジは常に発火（親側でバリデーション） */
  handler.submit();
  return true;
}

export function tutorialPredictSubmitEnabled(): boolean {
  return handler?.enabled === true;
}

export function tutorialPredictSubmitLabel(): string {
  return handler?.label ?? "SUBMIT";
}
