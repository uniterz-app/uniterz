/**
 * AdMob のリワード広告の SSV（サーバー側検証）コールバックの署名を確かめる。
 *
 * - 公開鍵は Google の配布 JSON（verifier-keys）から、key_id で選ぶ
 * - 署名対象は「`&signature=` より前のクエリ文字列そのまま」（ECDSA-SHA256）
 * - 検証に通ったものだけ報酬として扱う（クライアントの「見た」は信用しない）
 *
 * ※ 署名の組み立ては Google の公式仕様に沿っているが、実際のコールバックで
 *    1 回通ることを確認してから本番に出すこと（AdMob 側で SSV の URL 設定が要る）。
 */
import { createVerify } from "crypto";

const VERIFIER_KEYS_URL = "https://www.gstatic.com/admob/reward/verifier-keys.json";
const KEYS_TTL_MS = 24 * 60 * 60 * 1000;

type VerifierKey = { keyId: number; pem: string };

let keysCache: { at: number; keys: VerifierKey[] } | null = null;

async function loadVerifierKeys(): Promise<VerifierKey[]> {
  if (keysCache && Date.now() - keysCache.at < KEYS_TTL_MS) return keysCache.keys;
  const res = await fetch(VERIFIER_KEYS_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`verifier keys HTTP ${res.status}`);
  const json = (await res.json()) as { keys?: Array<{ keyId?: unknown; pem?: unknown }> };
  const keys: VerifierKey[] = (json.keys ?? [])
    .filter((k) => typeof k.keyId === "number" && typeof k.pem === "string")
    .map((k) => ({ keyId: k.keyId as number, pem: k.pem as string }));
  keysCache = { at: Date.now(), keys };
  return keys;
}

/**
 * 広告の用途（custom_data で決まる）。
 * - `pro_pick`: PRO PICK の「この試合だけ」解除（`{"gameId": "..."}`）
 * - `trade_buzz`: トレード Buzz の 1 日 1 回の解除（`{"feature": "trade_buzz"}`）
 */
export type AdMobSsvPurpose =
  | { kind: "pro_pick"; gameId: string }
  | { kind: "trade_buzz" };

export type AdMobSsvResult =
  | {
      ok: true;
      transactionId: string;
      userId: string;
      purpose: AdMobSsvPurpose;
      adUnit: string | null;
    }
  | { ok: false; reason: string };

/**
 * `rawQuery` は `?` より後ろの、加工していない文字列。
 * 必要なのは transaction_id / user_id / custom_data（用途の判定）/ ad_unit。
 */
export async function verifyAdMobSsv(rawQuery: string): Promise<AdMobSsvResult> {
  const marker = "&signature=";
  const sigAt = rawQuery.indexOf(marker);
  if (sigAt < 0) return { ok: false, reason: "no_signature" };

  const message = rawQuery.slice(0, sigAt);
  const afterSig = rawQuery.slice(sigAt + marker.length);
  const signatureToken = afterSig.split("&")[0] ?? "";
  if (!signatureToken) return { ok: false, reason: "empty_signature" };

  const params = new URLSearchParams(rawQuery);
  const keyId = Number(params.get("key_id"));
  if (!Number.isFinite(keyId)) return { ok: false, reason: "no_key_id" };

  let keys: VerifierKey[];
  try {
    keys = await loadVerifierKeys();
  } catch {
    return { ok: false, reason: "keys_unavailable" };
  }
  const key = keys.find((k) => k.keyId === keyId);
  if (!key) return { ok: false, reason: "unknown_key" };

  let signature: Buffer;
  try {
    signature = Buffer.from(decodeURIComponent(signatureToken), "base64url");
  } catch {
    return { ok: false, reason: "bad_signature_encoding" };
  }
  const verifier = createVerify("SHA256");
  verifier.update(message);
  verifier.end();
  if (!verifier.verify(key.pem, signature)) return { ok: false, reason: "bad_signature" };

  const transactionId = params.get("transaction_id")?.trim() ?? "";
  const userId = params.get("user_id")?.trim() ?? "";
  if (!transactionId || !userId) return { ok: false, reason: "missing_fields" };

  const rawCustom = params.get("custom_data") ?? "";
  const parseCustom = (s: string): { gameId?: unknown; feature?: unknown } | null => {
    try {
      return JSON.parse(s) as { gameId?: unknown; feature?: unknown };
    } catch {
      return null;
    }
  };
  let decodedCustom = "";
  try {
    decodedCustom = decodeURIComponent(rawCustom);
  } catch {
    decodedCustom = "";
  }
  const custom = parseCustom(rawCustom) ?? parseCustom(decodedCustom) ?? {};
  let gameId = typeof custom.gameId === "string" ? custom.gameId.trim() : "";
  const feature = typeof custom.feature === "string" ? custom.feature.trim() : "";
  // JSON ではなく試合 ID だけが入っているとき
  if (!gameId && !feature && rawCustom && !rawCustom.trim().startsWith("{")) {
    gameId = rawCustom.trim();
  }

  // custom_data が空でも、署名が通った報酬は uid 付きで残す（解除 API が試合に結びつける）
  const purpose: AdMobSsvPurpose =
    feature === "trade_buzz" ? { kind: "trade_buzz" } : { kind: "pro_pick", gameId };

  return {
    ok: true,
    transactionId,
    userId,
    purpose,
    adUnit: params.get("ad_unit"),
  };
}
