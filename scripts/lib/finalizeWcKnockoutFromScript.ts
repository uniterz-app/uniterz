/**
 * 管理スクリプトから WC ノックアウト試合を final にしたあと:
 * - advancingTeamId を補完（PK 除く）
 * - wcBracketResults 更新
 * - 子試合生成（決勝 M104 / 3位決定戦 M103 など）
 *
 * onGameFinalV2 と同等の子試合生成連鎖（--bracket-chain 明示時のみ）。
 * ユーザー WC ブラケット再採点は廃止。
 */

import type { Firestore } from "firebase-admin/firestore";
import adminPkg from "firebase-admin";
import { resolveKnockoutWinnerTeamId } from "../../functions/lib/wc-bracket/resolveKnockoutWinner.js";
import { maybeUpdateWcBracketOnKnockoutFinal } from "../../functions/lib/wc-bracket/onKnockoutGameFinal.js";
// 型のみ利用のためビルド成果物（functions/lib）ではなくソースから import
import type { WcFirestoreWriteDeps } from "../../functions/src/wc-bracket/wcFirestoreWriteDeps";

const admin = adminPkg as typeof import("firebase-admin");

function scriptFirestoreWriteDeps(): WcFirestoreWriteDeps {
  return {
    serverTimestamp: () => admin.firestore.FieldValue.serverTimestamp(),
  };
}

function readTeamId(
  data: Record<string, unknown>,
  side: "home" | "away"
): string {
  const nested = data[side] as { teamId?: string } | undefined;
  const flat =
    side === "home" ? data.homeTeamId : (data.awayTeamId as string | undefined);
  return String(nested?.teamId ?? flat ?? "").trim();
}

export type FinalizeWcKnockoutFromScriptParams = {
  gameId: string;
  /** merge 後の games ドキュメント想定 */
  data: Record<string, unknown>;
  /** PK 勝者など。未指定時は homeScore/awayScore から推定（同点は不可） */
  advancingTeamId?: string | null;
  dryRun?: boolean;
};

export async function finalizeWcKnockoutFromScript(
  db: Firestore,
  params: FinalizeWcKnockoutFromScriptParams
): Promise<{
  ran: boolean;
  matchId?: string;
  winnerTeamId?: string;
  advancingTeamId?: string | null;
  childGamesCreated: string[];
}> {
  const { gameId, data, dryRun = false } = params;
  const league = String(data.league ?? "").trim().toLowerCase();
  if (league !== "wc" || data.knockout !== true) {
    return { ran: false, childGamesCreated: [] };
  }
  if (data.final !== true) {
    return { ran: false, childGamesCreated: [] };
  }

  const homeTeamId = readTeamId(data, "home");
  const awayTeamId = readTeamId(data, "away");
  const homeScore =
    typeof data.homeScore === "number" ? data.homeScore : null;
  const awayScore =
    typeof data.awayScore === "number" ? data.awayScore : null;

  let advancingTeamId =
    params.advancingTeamId?.trim() ||
    (typeof data.advancingTeamId === "string"
      ? data.advancingTeamId.trim()
      : "") ||
    null;

  if (!advancingTeamId) {
    advancingTeamId = resolveKnockoutWinnerTeamId({
      homeTeamId,
      awayTeamId,
      homeScore,
      awayScore,
      advancingTeamId: null,
      knockout: true,
    });
  }

  if (!advancingTeamId) {
    console.warn(
      `[wc-knockout] skip bracket chain for ${gameId}: advancingTeamId 不明（PK の場合は --advancing-team-id=wc-xxx を指定）`
    );
    return { ran: false, childGamesCreated: [] };
  }

  if (!dryRun) {
    const writeDeps = scriptFirestoreWriteDeps();
    await db.collection("games").doc(gameId).set(
      {
        advancingTeamId,
        updatedAt: writeDeps.serverTimestamp(),
      },
      { merge: true }
    );
  }

  if (dryRun) {
    console.log(
      `[wc-knockout] dry-run: would set advancingTeamId=${advancingTeamId} on ${gameId}`
    );
    console.log(
      "[wc-knockout] dry-run: would update wcBracketResults + maybe create child games (M104 / M103)"
    );
    return {
      ran: true,
      advancingTeamId,
      childGamesCreated: [],
    };
  }

  const writeDeps = scriptFirestoreWriteDeps();
  const result = await maybeUpdateWcBracketOnKnockoutFinal(
    db,
    {
      gameId,
      season: typeof data.season === "string" ? data.season : null,
      league: "wc",
      knockout: true,
      homeTeamId,
      awayTeamId,
      homeScore,
      awayScore,
      advancingTeamId,
      wcKnockoutMatchId:
        typeof data.wcKnockoutMatchId === "string"
          ? data.wcKnockoutMatchId
          : null,
    },
    writeDeps
  );

  if (result.childGamesCreated?.length) {
    console.log(
      `✓ 子試合を生成/更新: ${result.childGamesCreated.join(", ")}`
    );
  }

  return {
    ran: true,
    matchId: result.matchId,
    winnerTeamId: result.winnerTeamId,
    advancingTeamId,
    childGamesCreated: result.childGamesCreated ?? [],
  };
}
