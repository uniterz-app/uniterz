import { CONTACT_TYPE_OPTIONS } from "@/lib/support/contactTypes";

export type AdminInboxKind = "feature" | "inbox";

export function isFeatureContactType(type: string): boolean {
  return type === "feature";
}

export function matchesAdminInboxKind(
  type: string,
  kind: AdminInboxKind
): boolean {
  return kind === "feature"
    ? isFeatureContactType(type)
    : !isFeatureContactType(type);
}

export type AdminContactRow = {
  id: string;
  type: string;
  message: string;
  email: string | null;
  screenshotUrl: string | null;
  userDisplayName: string | null;
  userUid: string | null;
  status: string;
  createdAtMs: number;
};

export function firestoreTimeToMs(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "object") {
    const o = value as {
      toMillis?: () => number;
      toDate?: () => Date;
      seconds?: number;
    };
    if (typeof o.toMillis === "function") return o.toMillis();
    if (typeof o.toDate === "function") {
      const d = o.toDate();
      return d instanceof Date && !Number.isNaN(d.getTime()) ? d.getTime() : 0;
    }
    if (typeof o.seconds === "number") return o.seconds * 1000;
  }
  return 0;
}

export function parseAdminContactRow(
  id: string,
  data: Record<string, unknown>
): AdminContactRow {
  return {
    id,
    type: String(data.type ?? ""),
    message: String(data.message ?? ""),
    email: data.email ? String(data.email) : null,
    screenshotUrl: data.screenshotUrl ? String(data.screenshotUrl) : null,
    userDisplayName: data.userDisplayName
      ? String(data.userDisplayName)
      : null,
    userUid: data.userUid ? String(data.userUid) : null,
    status: String(data.status ?? "unread"),
    createdAtMs: firestoreTimeToMs(data.createdAt),
  };
}

export function formatAdminInboxDate(
  ms: number,
  language: "ja" | "en" = "ja"
): string {
  if (!ms) return "";
  return new Date(ms).toLocaleString(language === "ja" ? "ja-JP" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TYPE_LABEL_JA = Object.fromEntries(
  CONTACT_TYPE_OPTIONS.map((o) => [o.value, o.label])
) as Record<string, string>;

const TYPE_LABEL_EN: Record<string, string> = {
  bug: "Bug report",
  feature: "Feature request",
  report: "Report",
  other: "Other",
};

export function adminContactTypeLabel(
  type: string,
  language: "ja" | "en"
): string {
  if (language === "en") return TYPE_LABEL_EN[type] ?? type;
  return TYPE_LABEL_JA[type] ?? type;
}

export function isAdminContactUnread(status: string): boolean {
  return status === "unread";
}
