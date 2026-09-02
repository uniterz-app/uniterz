import {
  NotificationTypeV2,
  Subtype,
  type ResponseBodyV2DecodedPayload,
} from "@apple/app-store-server-library";
import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  verifyAndDecodeAppleNotificationJws,
  verifyAndDecodeAppleRenewalInfoJws,
  verifyAndDecodeAppleTransactionJws,
} from "@/lib/billing/apple/appleSignedDataVerifier";
import {
  applyAppleTransactionEntitlement,
  applyAppleTransactionEntitlementByOriginalTxId,
} from "@/lib/billing/apple/applyAppleTransactionEntitlement";
import {
  applyProEntitlement,
  revokeProEntitlement,
} from "@/lib/billing/applyProEntitlement";
import {
  proPlanTypeFromAppleProductId,
  proUntilFromAppleTransaction,
  trialEndAtFromAppleTransaction,
} from "@/lib/billing/apple/proUntilFromAppleTransaction";
import { resolveUidByAppleOriginalTransactionId } from "@/lib/billing/userBillingSecure";

async function decodeTxFromNotification(
  notification: ResponseBodyV2DecodedPayload
) {
  const signed = notification.data?.signedTransactionInfo;
  if (!signed) return null;
  const { tx } = await verifyAndDecodeAppleTransactionJws(signed);
  return tx;
}

async function decodeRenewalAutoRenewStatus(
  notification: ResponseBodyV2DecodedPayload
): Promise<boolean | null> {
  const signed = notification.data?.signedRenewalInfo;
  if (!signed) return null;
  try {
    const { renewal } = await verifyAndDecodeAppleRenewalInfoJws(signed);
    if (typeof renewal.autoRenewStatus === "number") {
      return renewal.autoRenewStatus === 1;
    }
  } catch {
    return null;
  }
  return null;
}

export async function handleAppleServerNotification(
  signedPayload: string,
  db: Firestore = getAdminDb()
): Promise<void> {
  const { notification } = await verifyAndDecodeAppleNotificationJws(
    signedPayload
  );
  const type = notification.notificationType;
  const subtype = notification.subtype;
  const tx = await decodeTxFromNotification(notification);
  const originalTransactionId = String(tx?.originalTransactionId ?? "").trim();

  if (!type) return;

  switch (type) {
    case NotificationTypeV2.SUBSCRIBED:
    case NotificationTypeV2.DID_RENEW:
    case NotificationTypeV2.OFFER_REDEEMED:
    case NotificationTypeV2.RENEWAL_EXTENDED:
    case NotificationTypeV2.REFUND_DECLINED: {
      if (!tx || !originalTransactionId) return;
      const uid = await resolveUidByAppleOriginalTransactionId(
        db,
        originalTransactionId
      );
      if (!uid) return;
      await applyAppleTransactionEntitlement(db, uid, tx, {
        cancelAtPeriodEnd: false,
      });
      return;
    }
    case NotificationTypeV2.DID_CHANGE_RENEWAL_STATUS: {
      if (!originalTransactionId) return;
      const uid = await resolveUidByAppleOriginalTransactionId(
        db,
        originalTransactionId
      );
      if (!uid) return;
      const autoRenew = await decodeRenewalAutoRenewStatus(notification);
      if (autoRenew == null) {
        const disabled =
          subtype === Subtype.AUTO_RENEW_DISABLED ||
          subtype === Subtype.VOLUNTARY;
        const enabled = subtype === Subtype.AUTO_RENEW_ENABLED;
        if (!disabled && !enabled) return;
        await db.doc(`users/${uid}`).set(
          {
            cancelAtPeriodEnd: disabled,
            updatedAt: new Date(),
          },
          { merge: true }
        );
        return;
      }
      await db.doc(`users/${uid}`).set(
        {
          cancelAtPeriodEnd: !autoRenew,
          updatedAt: new Date(),
        },
        { merge: true }
      );
      return;
    }
    case NotificationTypeV2.EXPIRED:
    case NotificationTypeV2.GRACE_PERIOD_EXPIRED:
    case NotificationTypeV2.REFUND:
    case NotificationTypeV2.REVOKE: {
      if (!originalTransactionId) return;
      const uid = await resolveUidByAppleOriginalTransactionId(
        db,
        originalTransactionId
      );
      if (!uid) return;
      await revokeProEntitlement(db, uid);
      return;
    }
    case NotificationTypeV2.DID_FAIL_TO_RENEW: {
      if (subtype === Subtype.GRACE_PERIOD && tx && originalTransactionId) {
        await applyAppleTransactionEntitlementByOriginalTxId(
          db,
          originalTransactionId,
          tx
        );
      }
      return;
    }
    case NotificationTypeV2.DID_CHANGE_RENEWAL_PREF: {
      if (!tx || !originalTransactionId) return;
      const uid = await resolveUidByAppleOriginalTransactionId(
        db,
        originalTransactionId
      );
      if (!uid) return;
      const planType = proPlanTypeFromAppleProductId(tx.productId);
      if (!planType) return;
      const proUntil = proUntilFromAppleTransaction(tx, planType);
      await applyProEntitlement(db, uid, {
        planType,
        proUntil,
        trialEndAt: trialEndAtFromAppleTransaction(tx),
        billing: {
          billingProvider: "apple",
          appleOriginalTransactionId: originalTransactionId,
          nextPlanType: null,
        },
      });
      return;
    }
    default:
      return;
  }
}
