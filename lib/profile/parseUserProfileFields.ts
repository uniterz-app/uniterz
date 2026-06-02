import { looksLikeFirestoreUid } from "@/lib/profile/profilePathKey";

function pickStringField(data: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = data[key];
    if (typeof v !== "string") continue;
    const s = v.trim();
    if (!s) continue;
    if (looksLikeFirestoreUid(s)) continue;
    return s;
  }
  return "";
}

/** Firestore `users` ドキュメントから表示用の名前・ハンドルを取り出す */
export function parseUserProfileFields(data: Record<string, unknown>): {
  displayName: string;
  handle: string;
} {
  const handle = pickStringField(data, ["handle", "slug", "username"]);
  const displayName =
    pickStringField(data, ["displayName", "name"]) || handle;
  return { displayName, handle };
}

/** URL ルートキー（ハンドル or uid）を表示に混ぜないためのフォールバック */
export function profileDisplayFromUser(
  user: {
    displayName?: string;
    handle?: string;
  },
  routeKey: string,
  loading: boolean
): { displayName: string; handle: string } {
  const routeIsUid = looksLikeFirestoreUid(routeKey);
  const handle = user.handle?.trim() ?? "";
  const displayName = user.displayName?.trim() || handle;

  if (loading) {
    return {
      displayName: routeIsUid ? "…" : routeKey,
      handle: routeIsUid ? "" : routeKey,
    };
  }

  return {
    displayName: displayName || "User",
    handle: routeIsUid ? handle : handle || routeKey,
  };
}
