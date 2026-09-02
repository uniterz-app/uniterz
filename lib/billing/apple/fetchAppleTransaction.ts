import {
  APIException,
  AppStoreServerAPIClient,
  Environment,
} from "@apple/app-store-server-library";
import {
  appleIapBundleId,
  isAppleIapConfigured,
  readAppleIapPrivateKey,
} from "@/lib/billing/apple/appleIapEnv";

const clients = new Map<Environment, AppStoreServerAPIClient>();

function clientFor(environment: Environment): AppStoreServerAPIClient {
  const hit = clients.get(environment);
  if (hit) return hit;
  const signingKey = readAppleIapPrivateKey();
  if (!signingKey) {
    throw new Error("apple_iap_signing_key_missing");
  }
  const keyId = process.env.APPLE_IAP_KEY_ID!.trim();
  const issuerId = process.env.APPLE_IAP_ISSUER_ID!.trim();
  const next = new AppStoreServerAPIClient(
    signingKey,
    keyId,
    issuerId,
    appleIapBundleId(),
    environment
  );
  clients.set(environment, next);
  return next;
}

function isTransactionNotFoundError(e: unknown): boolean {
  if (!(e instanceof APIException)) return false;
  return e.apiError === 4040010 || e.httpStatusCode === 404;
}

/** transactionId から signedTransactionInfo を取得しデコード */
export async function fetchAppleTransactionById(transactionId: string) {
  if (!isAppleIapConfigured()) {
    throw new Error("apple_iap_not_configured");
  }
  const id = transactionId.trim();
  if (!id) throw new Error("transaction_id_required");

  let lastError: unknown;
  for (const environment of [Environment.SANDBOX, Environment.PRODUCTION]) {
    try {
      const response = await clientFor(environment).getTransactionInfo(id);
      const signed = response.signedTransactionInfo;
      if (!signed) throw new Error("missing_signed_transaction");
      const { verifyAndDecodeAppleTransactionJws } = await import(
        "@/lib/billing/apple/appleSignedDataVerifier"
      );
      const { tx } = await verifyAndDecodeAppleTransactionJws(signed);
      return { tx, environment, signedTransactionInfo: signed };
    } catch (e) {
      if (isTransactionNotFoundError(e)) {
        lastError = e;
        continue;
      }
      throw e;
    }
  }
  throw lastError ?? new Error("apple_transaction_not_found");
}
