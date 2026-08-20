/**
 * 他人プロフィール閲覧の日次ユニーク記録。
 * 同じ閲覧者×対象×JST日はプロセス内で1回だけ POST する。
 */
import { dateKeyJST } from "@/lib/rankings/rankSnapshotDate";

const recorded = new Set<string>();

function recordKey(viewerUid: string, targetUid: string): string {
  return `${dateKeyJST()}:${viewerUid.trim()}:${targetUid.trim()}`;
}

/** true = この呼び出しが記録リクエストを出す */
export function takeProfileViewRecordSlot(
  viewerUid: string | null | undefined,
  targetUid: string | null | undefined
): boolean {
  const viewer = viewerUid?.trim() ?? "";
  const target = targetUid?.trim() ?? "";
  if (!viewer || !target || viewer === target) return false;
  const key = recordKey(viewer, target);
  if (recorded.has(key)) return false;
  recorded.add(key);
  return true;
}

export function releaseProfileViewRecordSlot(
  viewerUid: string | null | undefined,
  targetUid: string | null | undefined
): void {
  const viewer = viewerUid?.trim() ?? "";
  const target = targetUid?.trim() ?? "";
  if (!viewer || !target) return;
  recorded.delete(recordKey(viewer, target));
}
