/**
 * お問い合わせ送信（Admin）— レート制限付き。
 * Native `ContactScreenNative` / Web `submitContact` が利用。
 */
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { dateKeyJST } from "@/lib/rankings/rankSnapshotDate";
import type { ContactType } from "@/lib/support/contactTypes";

export const CONTACT_TYPES = ["bug", "feature", "report", "other"] as const;

export const CONTACT_MESSAGE_MIN = 10;
export const CONTACT_MESSAGE_MAX = 4000;
export const CONTACT_EMAIL_MAX = 254;
export const CONTACT_URL_MAX = 2048;
export const CONTACT_PATH_MAX = 512;

/** 1 ユーザーあたり JST 日次上限 */
export const CONTACT_DAILY_LIMIT = 5;

export type SubmitContactAdminInput = {
  type: string;
  message: string;
  email?: string | null;
  screenshotUrl?: string | null;
  fromPath?: string | null;
  appVariant?: "web" | "mobile" | null;
  userDisplayName?: string | null;
};

export type SubmitContactAdminResult =
  | { ok: true; id: string }
  | {
      ok: false;
      error:
        | "invalid_type"
        | "invalid_message"
        | "invalid_email"
        | "invalid_url"
        | "rate_limited";
    };

function isContactType(v: string): v is ContactType {
  return (CONTACT_TYPES as readonly string[]).includes(v);
}

export async function submitContactAdmin(
  db: Firestore,
  uid: string,
  input: SubmitContactAdminInput
): Promise<SubmitContactAdminResult> {
  const type = String(input.type ?? "").trim();
  if (!isContactType(type)) {
    return { ok: false, error: "invalid_type" };
  }

  const message = String(input.message ?? "").trim();
  if (
    message.length < CONTACT_MESSAGE_MIN ||
    message.length > CONTACT_MESSAGE_MAX
  ) {
    return { ok: false, error: "invalid_message" };
  }

  const emailRaw = String(input.email ?? "").trim();
  if (emailRaw) {
    if (emailRaw.length > CONTACT_EMAIL_MAX) {
      return { ok: false, error: "invalid_email" };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
      return { ok: false, error: "invalid_email" };
    }
  }

  const screenshotUrl = String(input.screenshotUrl ?? "").trim();
  if (screenshotUrl) {
    if (screenshotUrl.length > CONTACT_URL_MAX) {
      return { ok: false, error: "invalid_url" };
    }
    if (!/^https:\/\//i.test(screenshotUrl)) {
      return { ok: false, error: "invalid_url" };
    }
  }

  const fromPath = String(input.fromPath ?? "").trim().slice(0, CONTACT_PATH_MAX);
  const appVariant =
    input.appVariant === "web" || input.appVariant === "mobile"
      ? input.appVariant
      : null;
  const userDisplayName = String(input.userDisplayName ?? "").trim().slice(0, 80);

  const dayKey = dateKeyJST(new Date());
  const rateRef = db
    .collection("users")
    .doc(uid)
    .collection("secure")
    .doc(`contactRate_${dayKey}`);

  try {
    await db.runTransaction(async (tx) => {
      const rateSnap = await tx.get(rateRef);
      const count = Math.max(0, Math.floor(Number(rateSnap.data()?.count ?? 0)));
      if (count >= CONTACT_DAILY_LIMIT) {
        const err = new Error("rate_limited");
        (err as { code?: string }).code = "rate_limited";
        throw err;
      }
      tx.set(
        rateRef,
        {
          count: count + 1,
          dayKey,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });
  } catch (e: unknown) {
    if (
      e instanceof Error &&
      (e.message === "rate_limited" ||
        (e as { code?: string }).code === "rate_limited")
    ) {
      return { ok: false, error: "rate_limited" };
    }
    throw e;
  }

  const docRef = await db.collection("contacts").add({
    type,
    message,
    email: emailRaw || null,
    screenshotUrl: screenshotUrl || null,
    fromPath: fromPath || null,
    appVariant,
    userUid: uid,
    userDisplayName: userDisplayName || null,
    status: "unread",
    createdAt: FieldValue.serverTimestamp(),
  });

  return { ok: true, id: docRef.id };
}
