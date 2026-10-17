/**
 * パートナー招待コード（Admin SDK）。定数・型は `referralPartner.ts`。
 */
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { normalizeReferralInviteCode } from "./referralInviteCode";
import {
  PARTNER_INVITEE_UNITS,
  REFERRAL_PARTNER_CODES_COLLECTION,
  isValidPartnerCodeFormat,
  partnerReferrerUid,
  type ReferralPartnerCode,
  type ReferralPartnerRow,
  type ReferralPartnerStats,
} from "./referralPartner";
import { referralInviteeRewardLedgerKey } from "./settleReferralRelation";
import { preseasonBonusIdempotencyKey } from "@/lib/units/preseasonBonus";

function toMs(v: unknown): number | null {
  const t = v as { toMillis?: () => number } | null | undefined;
  return typeof t?.toMillis === "function" ? t.toMillis() : null;
}

function rowFromData(code: string, data: Record<string, unknown>): ReferralPartnerCode {
  const units = Number(data.inviteeUnits);
  return {
    code,
    label: String(data.label ?? code),
    active: data.active !== false,
    inviteeUnits: Number.isFinite(units) && units > 0 ? units : PARTNER_INVITEE_UNITS,
    createdAtMs: toMs(data.createdAt),
  };
}

/** 有効なパートナーコードなら返す（無効化・未登録は null） */
export async function loadActivePartnerCodeAdmin(
  db: Firestore,
  codeRaw: string
): Promise<ReferralPartnerCode | null> {
  const code = normalizeReferralInviteCode(codeRaw);
  if (!code) return null;
  const snap = await db.collection(REFERRAL_PARTNER_CODES_COLLECTION).doc(code).get();
  if (!snap.exists) return null;
  const row = rowFromData(code, snap.data() ?? {});
  return row.active ? row : null;
}

/**
 * コードで登録した時点で招待された側へ付与（台帳キーで冪等。7 日達成時の settle は二重付与しない）。
 * プレシーズン参加ボーナスとは併給しない（Native 初期設定はプロフィール保存 → bind の順でボーナスが先に付く）。
 */
export async function grantPartnerInviteeUnitsAdmin(
  db: Firestore,
  inviteeUid: string,
  code: string,
  units: number
): Promise<boolean> {
  const key = referralInviteeRewardLedgerKey(inviteeUid);
  const ledgerRef = db.collection("unit_ledger").doc(key);
  const preseasonLedgerRef = db
    .collection("unit_ledger")
    .doc(preseasonBonusIdempotencyKey(inviteeUid));
  const userRef = db.collection("users").doc(inviteeUid);
  return db.runTransaction(async (tx) => {
    const [ledgerSnap, preseasonSnap] = await Promise.all([
      tx.get(ledgerRef),
      tx.get(preseasonLedgerRef),
    ]);
    if (ledgerSnap.exists || preseasonSnap.exists) return false;
    tx.set(ledgerRef, {
      uid: inviteeUid,
      amount: units,
      reason: "referral_invitee",
      idempotencyKey: key,
      inviteeUid,
      referrerUid: partnerReferrerUid(code),
      partnerCode: code,
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.set(
      userRef,
      {
        unitBalance: FieldValue.increment(units),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    tx.set(userRef.collection("pending_unit_earns").doc(key), {
      amount: units,
      reason: "referral_invitee",
      titleJa: "招待ボーナス",
      titleEn: "Invite bonus",
      subtitleJa: null,
      subtitleEn: null,
      claimedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      createdAtMs: Date.now(),
    });
    return true;
  });
}

export type CreatePartnerCodeResult =
  | { ok: true; partner: ReferralPartnerCode }
  | { ok: false; error: "invalid_code" | "code_taken" };

export async function createPartnerCodeAdmin(
  db: Firestore,
  input: { code: string; label: string; inviteeUnits?: number }
): Promise<CreatePartnerCodeResult> {
  const code = normalizeReferralInviteCode(input.code);
  if (!isValidPartnerCodeFormat(code)) return { ok: false, error: "invalid_code" };

  const userCodeSnap = await db.collection("inviteCodes").doc(code).get();
  if (userCodeSnap.exists) return { ok: false, error: "code_taken" };

  const units =
    input.inviteeUnits != null && Number.isFinite(input.inviteeUnits) && input.inviteeUnits > 0
      ? Math.floor(input.inviteeUnits)
      : PARTNER_INVITEE_UNITS;
  const label = input.label.trim() || code;
  try {
    await db.collection(REFERRAL_PARTNER_CODES_COLLECTION).doc(code).create({
      label,
      active: true,
      inviteeUnits: units,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (e: unknown) {
    const codeNum =
      e && typeof e === "object" && "code" in e ? Number((e as { code?: number }).code) : null;
    if (codeNum === 6) return { ok: false, error: "code_taken" };
    throw e;
  }
  return {
    ok: true,
    partner: { code, label, active: true, inviteeUnits: units, createdAtMs: Date.now() },
  };
}

export async function setPartnerCodeActiveAdmin(
  db: Firestore,
  codeRaw: string,
  active: boolean
): Promise<boolean> {
  const code = normalizeReferralInviteCode(codeRaw);
  const ref = db.collection(REFERRAL_PARTNER_CODES_COLLECTION).doc(code);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.set({ active, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return true;
}

async function loadPartnerStats(db: Firestore, code: string): Promise<ReferralPartnerStats> {
  const snap = await db
    .collection("referralRelations")
    .where("referrerUid", "==", partnerReferrerUid(code))
    .select("status")
    .get();
  const stats: ReferralPartnerStats = { registered: 0, inProgress: 0, completed: 0, withdrawn: 0 };
  for (const doc of snap.docs) {
    const status = String(doc.get("status") ?? "");
    if (status === "withdrawn" || status === "invalid" || status === "fraud_rejected") {
      stats.withdrawn += 1;
      continue;
    }
    stats.registered += 1;
    if (status === "completed") stats.completed += 1;
    else if (status === "in_progress" || status === "under_review") stats.inProgress += 1;
  }
  return stats;
}

export async function listPartnerCodesAdmin(db: Firestore): Promise<ReferralPartnerRow[]> {
  const snap = await db.collection(REFERRAL_PARTNER_CODES_COLLECTION).get();
  const rows = await Promise.all(
    snap.docs.map(async (doc) => ({
      ...rowFromData(doc.id, doc.data()),
      stats: await loadPartnerStats(db, doc.id),
    }))
  );
  return rows.sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));
}
