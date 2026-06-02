/** プロフィール URL 用キー（uid 優先。cumulative_stats の handle は古いことがある） */
export function profilePathKeyFromRow(row: {
  uid?: string | null;
  handle?: string | null;
}): string {
  const uid = typeof row.uid === "string" ? row.uid.trim() : "";
  if (uid) return uid;
  const handle = typeof row.handle === "string" ? row.handle.trim() : "";
  return handle;
}

/** Firestore ドキュメント ID としての UID らしさ（ハンドル解決のフォールバック用） */
export function looksLikeFirestoreUid(value: string): boolean {
  return /^[a-zA-Z0-9]{20,128}$/.test(value);
}
