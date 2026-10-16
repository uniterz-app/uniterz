/**
 * 開幕前の紹介特典（Admin SDK）。
 * 開幕戦ティップオフまでに、招待で登録した人がシーズン予想（順位 or アワード）を初めて提出したら
 * 紹介者・招待された人の双方へ即時付与する。通常の 7 日条件の紹介報酬とは別枠。
 */
import { FieldValue, type DocumentSnapshot, type Firestore } from "firebase-admin/firestore";
import { PRESEASON_BONUS_SEASON } from "@/lib/units/preseasonBonus";
import {
  REFERRAL_PRESEASON_DEADLINE_MS,
  REFERRAL_PRESEASON_INVITEE_UNITS,
  REFERRAL_PRESEASON_MAX_PER_REFERRER,
  REFERRAL_PRESEASON_REFERRER_UNITS,
} from "@/lib/referral/referralPreseasonBonus";
import { isPartnerReferrerUid } from "@/lib/referral/referralPartner";

const REJECTED_STATUSES = new Set(["invalid", "fraud_rejected", "withdrawn"]);

export function referralPreseasonInviteeKey(inviteeUid: string): string {
  return `referral:preseason:${PRESEASON_BONUS_SEASON}:invitee:${inviteeUid}`;
}

export function referralPreseasonReferrerKey(inviteeUid: string): string {
  return `referral:preseason:${PRESEASON_BONUS_SEASON}:referrer:${inviteeUid}`;
}

function hasDisplayName(snap: DocumentSnapshot): boolean {
  const name = snap.get("displayName");
  return snap.exists && typeof name === "string" && name.trim() !== "";
}

export type ReferralPreseasonGrantResult = {
  invitee: boolean;
  referrer: boolean;
};

/**
 * 招待された本人（inviteeUid）のシーズン予想提出時に呼ぶ。冪等。
 * 紹介者が上限に達していても、招待された側の分は付与する。
 */
export async function grantReferralPreseasonBonus(
  db: Firestore,
  inviteeUid: string,
  nowMs = Date.now()
): Promise<ReferralPreseasonGrantResult> {
  const none = { invitee: false, referrer: false };
  if (nowMs >= REFERRAL_PRESEASON_DEADLINE_MS) return none;

  const relRef = db.collection("referralRelations").doc(inviteeUid);
  const inviteeRef = db.collection("users").doc(inviteeUid);
  const inviteeKey = referralPreseasonInviteeKey(inviteeUid);
  const referrerKey = referralPreseasonReferrerKey(inviteeUid);
  const inviteeLedgerRef = db.collection("unit_ledger").doc(inviteeKey);
  const referrerLedgerRef = db.collection("unit_ledger").doc(referrerKey);

  return db.runTransaction(async (tx) => {
    const relSnap = await tx.get(relRef);
    if (!relSnap.exists) return none;
    const status = String(relSnap.get("status") ?? "");
    const referrerUid = String(relSnap.get("referrerUid") ?? "").trim();
    if (
      !referrerUid ||
      referrerUid === inviteeUid ||
      isPartnerReferrerUid(referrerUid) ||
      REJECTED_STATUSES.has(status)
    ) {
      return none;
    }

    const referrerRef = db.collection("users").doc(referrerUid);
    const counterRef = db
      .collection("referralPreseasonCounts")
      .doc(`${PRESEASON_BONUS_SEASON}_${referrerUid}`);
    const [inviteeSnap, referrerSnap, inviteeLedger, referrerLedger, counterSnap] =
      await Promise.all([
        tx.get(inviteeRef),
        tx.get(referrerRef),
        tx.get(inviteeLedgerRef),
        tx.get(referrerLedgerRef),
        tx.get(counterRef),
      ]);
    if (!hasDisplayName(inviteeSnap)) return none;

    const grantInvitee = !inviteeLedger.exists;
    const used = Number(counterSnap.get("count") ?? 0);
    const grantReferrer =
      !referrerLedger.exists &&
      hasDisplayName(referrerSnap) &&
      used < REFERRAL_PRESEASON_MAX_PER_REFERRER;

    const nowTs = FieldValue.serverTimestamp();
    if (grantInvitee) {
      tx.set(inviteeLedgerRef, {
        uid: inviteeUid,
        amount: REFERRAL_PRESEASON_INVITEE_UNITS,
        reason: "referral_preseason",
        idempotencyKey: inviteeKey,
        label: PRESEASON_BONUS_SEASON,
        role: "invitee",
        referrerUid,
        createdAt: nowTs,
      });
      tx.set(
        inviteeRef,
        {
          unitBalance: FieldValue.increment(REFERRAL_PRESEASON_INVITEE_UNITS),
          updatedAt: nowTs,
        },
        { merge: true }
      );
      tx.set(inviteeRef.collection("pending_unit_earns").doc(inviteeKey), {
        amount: REFERRAL_PRESEASON_INVITEE_UNITS,
        reason: "referral_preseason",
        titleJa: "招待特典（開幕前）",
        titleEn: "Invite bonus (preseason)",
        subtitleJa: "招待コードで参加してシーズン予想を提出",
        subtitleEn: "Joined with an invite and submitted season picks",
        claimedAt: null,
        createdAt: nowTs,
        createdAtMs: nowMs,
      });
    }
    if (grantReferrer) {
      tx.set(referrerLedgerRef, {
        uid: referrerUid,
        amount: REFERRAL_PRESEASON_REFERRER_UNITS,
        reason: "referral_preseason",
        idempotencyKey: referrerKey,
        label: PRESEASON_BONUS_SEASON,
        role: "referrer",
        inviteeUid,
        createdAt: nowTs,
      });
      tx.set(
        referrerRef,
        {
          unitBalance: FieldValue.increment(REFERRAL_PRESEASON_REFERRER_UNITS),
          updatedAt: nowTs,
        },
        { merge: true }
      );
      tx.set(
        counterRef,
        { referrerUid, season: PRESEASON_BONUS_SEASON, count: used + 1, updatedAt: nowTs },
        { merge: true }
      );
      tx.set(referrerRef.collection("pending_unit_earns").doc(referrerKey), {
        amount: REFERRAL_PRESEASON_REFERRER_UNITS,
        reason: "referral_preseason",
        titleJa: "招待特典（開幕前）",
        titleEn: "Invite bonus (preseason)",
        subtitleJa: "招待した友だちがシーズン予想を提出",
        subtitleEn: "A friend you invited submitted season picks",
        claimedAt: null,
        createdAt: nowTs,
        createdAtMs: nowMs,
      });
    }
    return { invitee: grantInvitee, referrer: grantReferrer };
  });
}

/** シーズン予想の保存後に呼ぶ。失敗しても保存処理は止めない */
export async function autoGrantReferralPreseasonBonus(
  db: Firestore,
  inviteeUid: string
): Promise<void> {
  if (Date.now() >= REFERRAL_PRESEASON_DEADLINE_MS) return;
  try {
    await grantReferralPreseasonBonus(db, inviteeUid);
  } catch (e) {
    console.error("autoGrantReferralPreseasonBonus:", e);
  }
}
