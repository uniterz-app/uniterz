import {
  Environment,
  SignedDataVerifier,
} from "@apple/app-store-server-library";
import { loadAppleRootCertificates } from "@/lib/billing/apple/appleRootCertificates";
import {
  appleIapAppAppleId,
  appleIapBundleId,
} from "@/lib/billing/apple/appleIapEnv";

const verifiers = new Map<Environment, SignedDataVerifier>();

function verifierFor(environment: Environment): SignedDataVerifier {
  const hit = verifiers.get(environment);
  if (hit) return hit;
  const next = new SignedDataVerifier(
    loadAppleRootCertificates(),
    true,
    environment,
    appleIapBundleId(),
    environment === Environment.PRODUCTION
      ? appleIapAppAppleId()
      : undefined
  );
  verifiers.set(environment, next);
  return next;
}

/** Sandbox → Production の順で JWS transaction を検証・デコード */
export async function verifyAndDecodeAppleTransactionJws(
  signedTransactionInfo: string
) {
  let lastError: unknown;
  for (const environment of [Environment.SANDBOX, Environment.PRODUCTION]) {
    try {
      const tx = await verifierFor(environment).verifyAndDecodeTransaction(
        signedTransactionInfo
      );
      return { tx, environment };
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError ?? new Error("apple_jws_verify_failed");
}

/** App Store Server Notifications V2 */
export async function verifyAndDecodeAppleNotificationJws(
  signedPayload: string
) {
  let lastError: unknown;
  for (const environment of [Environment.SANDBOX, Environment.PRODUCTION]) {
    try {
      const notification = await verifierFor(
        environment
      ).verifyAndDecodeNotification(signedPayload);
      return { notification, environment };
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError ?? new Error("apple_notification_verify_failed");
}

/** signedRenewalInfo を検証・デコード */
export async function verifyAndDecodeAppleRenewalInfoJws(
  signedRenewalInfo: string
) {
  let lastError: unknown;
  for (const environment of [Environment.SANDBOX, Environment.PRODUCTION]) {
    try {
      const renewal = await verifierFor(environment).verifyAndDecodeRenewalInfo(
        signedRenewalInfo
      );
      return { renewal, environment };
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError ?? new Error("apple_renewal_verify_failed");
}
