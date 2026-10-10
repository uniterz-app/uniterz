/**
 * 規律スナップショット更新後に `/api/nba/league-team-stats` の unstable_cache を捨てる。
 * Route Handler 内から呼ぶ。
 */
import { revalidateTag } from "next/cache";

export function revalidateNbaDisciplineApiCache(): void {
  try {
    revalidateTag("nba-league-team-stats", {});
  } catch {
    // スクリプト（Next 外）から呼ばれたときは無視
  }
}
