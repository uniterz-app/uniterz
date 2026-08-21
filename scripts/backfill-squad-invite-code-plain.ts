/**
 * 既存スクワッドの inviteCodePlain を消す。封印できるときは inviteCodeEnc を足す。
 *
 *   npx tsx scripts/backfill-squad-invite-code-plain.ts --dry-run
 *   INVITE_CODE_SECRET=... npx tsx scripts/backfill-squad-invite-code-plain.ts
 */

// @ts-ignore
import adminPkg from "firebase-admin";
import fs from "fs";
import { FieldValue } from "firebase-admin/firestore";
import { sealInviteCode } from "@/lib/security/sealInviteCode";
import { hashInviteCode } from "@/lib/communities/inviteCode";
import { GROUP_BATTLE_COLLECTION } from "@/lib/groupBattles/constants";

const admin = adminPkg as typeof import("firebase-admin");
const DRY_RUN = process.argv.includes("--dry-run");

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function main() {
  const battles = await db.collection(GROUP_BATTLE_COLLECTION).get();
  let scanned = 0;
  let withPlain = 0;
  let updated = 0;
  let skippedNoSeal = 0;

  for (const battle of battles.docs) {
    const squads = await battle.ref.collection("squads").get();
    for (const squad of squads.docs) {
      scanned += 1;
      const data = squad.data();
      const plain =
        typeof data.inviteCodePlain === "string"
          ? data.inviteCodePlain.trim()
          : "";
      if (!plain) continue;
      withPlain += 1;

      const enc = sealInviteCode(plain);
      let hash: string | null = null;
      try {
        hash = hashInviteCode(plain);
      } catch {
        hash = null;
      }
      const last4 = plain.slice(-4);
      if (!enc && !data.inviteCodeEnc) {
        skippedNoSeal += 1;
        console.warn(
          `[skip] ${battle.id}/${squad.id} — no seal secret (INVITE_CODE_SECRET or INTERNAL_JOB_SECRET)`
        );
        continue;
      }

      const patch: Record<string, unknown> = {
        inviteCodePlain: FieldValue.delete(),
      };
      if (!data.inviteCodeEnc && enc) {
        patch.inviteCodeEnc = enc;
      }
      if (!data.inviteCodeHash && hash) {
        patch.inviteCodeHash = hash;
      }
      if (!data.inviteCodeLast4 && last4) {
        patch.inviteCodeLast4 = last4;
      }

      console.log(
        `[${DRY_RUN ? "dry" : "upd"}] ${battle.id}/${squad.id} last4=${last4}`
      );
      if (!DRY_RUN) {
        await squad.ref.set(patch, { merge: true });
      }
      updated += 1;
    }
  }

  console.log(
    JSON.stringify({ scanned, withPlain, updated, skippedNoSeal, dryRun: DRY_RUN })
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
