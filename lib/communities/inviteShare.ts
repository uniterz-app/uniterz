import type { Language } from "@/lib/i18n/language";

export type InviteShareResult =
  | "shared"
  | "cancelled"
  | "unsupported"
  | "failed";

type BuildInviteShareTextOptions = {
  inviteCode: string;
  groupName?: string;
  language: Language;
};

/** 招待コード共有用の本文（LINE 等にそのまま貼れる形式） */
export function buildCommunityInviteShareText({
  inviteCode,
  groupName,
  language,
}: BuildInviteShareTextOptions): string {
  const appUrl =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")
      : undefined;

  if (language === "en") {
    const groupLine = groupName
      ? `You're invited to join "${groupName}" on Uniterz.`
      : "You're invited to join my group on Uniterz.";
    const lines = [
      "Join Uniterz and compete with others on your analytical edge!",
      "",
      groupLine,
      "",
      `Invite code: ${inviteCode}`,
      "",
      'In the app, open "Join group" and enter this code.',
    ];
    if (appUrl) lines.push("", appUrl);
    return lines.join("\n");
  }

  const lines = [
    "一緒にUniterzで競おう！",
    groupName ? `グループ: ${groupName}` : null,
    `招待コード: ${inviteCode}`,
    "「グループに参加」で入力してね。",
  ].filter((line): line is string => Boolean(line));
  if (appUrl) lines.push("", appUrl);
  return lines.join("\n");
}

function shareTitle(language: Language, groupName?: string): string {
  if (language === "en") {
    return groupName ? `Join ${groupName} on Uniterz` : "Join Uniterz";
  }
  return groupName ? `Uniterz — ${groupName} への招待` : "Uniterz への招待";
}

/** Web Share API（未対応の場合は unsupported）。 */
export async function shareCommunityInvite(
  options: BuildInviteShareTextOptions
): Promise<InviteShareResult> {
  const text = buildCommunityInviteShareText(options);
  const title = shareTitle(options.language, options.groupName);

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text });
      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return "cancelled";
      }
      return "failed";
    }
  }

  return "unsupported";
}

export type CommunityInviteShareUrls = {
  lineAppUrl: string;
  lineUrl: string;
  xUrl: string;
  text: string;
};

function getAppUrl(): string | undefined {
  if (typeof process === "undefined") return undefined;
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
}

/** LINE/X 共有用 URL（共有文面をそのまま利用） */
export function buildCommunityInviteShareUrls(
  options: BuildInviteShareTextOptions
): CommunityInviteShareUrls {
  const text = buildCommunityInviteShareText(options);
  const appUrl = getAppUrl();

  const urlPart = appUrl ? `&url=${encodeURIComponent(appUrl)}` : "";
  const lineAppUrl = `line://msg/text/${encodeURIComponent(text)}`;
  const lineUrl = `https://social-plugins.line.me/lineit/share?text=${encodeURIComponent(
    text
  )}${urlPart}`;

  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    text
  )}${appUrl ? `&url=${encodeURIComponent(appUrl)}` : ""}`;

  return { lineAppUrl, lineUrl, xUrl, text };
}
