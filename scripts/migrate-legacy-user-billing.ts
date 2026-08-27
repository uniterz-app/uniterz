/**
 * @deprecated Use `scripts/scrub-user-root-sensitive.ts` instead.
 *
 *   DRY_RUN=1 npx tsx scripts/scrub-user-root-sensitive.ts
 *   npx tsx scripts/scrub-user-root-sensitive.ts
 */
console.warn(
  "[deprecated] migrate-legacy-user-billing.ts → scrub-user-root-sensitive.ts"
);
import "./scrub-user-root-sensitive";
