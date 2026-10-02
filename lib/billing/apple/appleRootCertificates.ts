import { readFileSync } from "fs";
import path from "path";

let cached: Buffer[] | null = null;

/** Apple Root CA（DER）— SignedDataVerifier 用 */
export function loadAppleRootCertificates(): Buffer[] {
  if (cached) return cached;
  const dir = path.join(process.cwd(), "lib/billing/apple/certs");
  const files = [
    "AppleIncRootCertificate.cer",
    "AppleRootCA-G2.cer",
    "AppleRootCA-G3.cer",
  ];
  cached = files.map((name) => readFileSync(path.join(dir, name)));
  return cached;
}
