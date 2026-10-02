/**
 * スクワッドバトル開催告知の表示判定（Web / Native 共有）
 */

/** 募集が開いているフェーズ — アプリ起動時に開催モーダル対象 */
export function isSquadBattleLaunchPhase(
  phase: string | null | undefined
): boolean {
  return phase === "announced" || phase === "recruiting";
}

/**
 * この大会の開催モーダルをまだ見せていないか。
 * storage には「見た battleId」を保存する（旧 `"1"` は未見扱い）。
 */
export function shouldShowSquadBattleLaunch(args: {
  battleId: string | null | undefined;
  phase: string | null | undefined;
  seenBattleId: string | null | undefined;
}): boolean {
  const id = String(args.battleId ?? "").trim();
  if (!id) return false;
  if (!isSquadBattleLaunchPhase(args.phase)) return false;
  const seen = String(args.seenBattleId ?? "").trim();
  if (!seen || seen === "1") return true;
  return seen !== id;
}

/** エントリー期限ラベル（JST） */
export function formatSquadBattleRecruitDeadlineLabel(
  recruitEndAtMs: number | null | undefined
): string | null {
  const ms = Number(recruitEndAtMs);
  if (!Number.isFinite(ms) || ms <= 0) return null;
  try {
    return new Date(ms).toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}
