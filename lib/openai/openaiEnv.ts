/**
 * OpenAI API キー（サーバー専用。EXPO_PUBLIC_ 禁止）。
 * 未設定でも Batch 投入は dry-run（facts のみ保存）できる。
 */
export function getOpenAiApiKey(): string | null {
  const key =
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.CHATGPT_API_KEY?.trim() ||
    "";
  return key || null;
}

export function requireOpenAiApiKey(): string {
  const key = getOpenAiApiKey();
  if (!key) {
    throw new Error(
      "OPENAI_API_KEY is not set (server env only; do not use EXPO_PUBLIC_)"
    );
  }
  return key;
}

export function getOpenAiProInsightModel(): string {
  return (
    process.env.OPENAI_PRO_INSIGHT_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4o-mini"
  );
}
