import { normalizeLeague } from "@/lib/leagues";

/** リザルト UI で WC 専用扱いにするか */
export function isWcResultLeague(raw: unknown): boolean {
  return normalizeLeague(raw) === "wc";
}
