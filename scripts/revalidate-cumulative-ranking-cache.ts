/**
 * Next.js の cumulative-ranking キャッシュタグを無効化。
 * スナップショット手動実行後に併用する。
 *
 * 環境変数:
 *   REVALIDATE_CUMULATIVE_RANKING_URL — 例 https://uniterz.app/api/internal/revalidate/cumulative-ranking
 *   INTERNAL_REVALIDATE_SECRET
 *
 * 使い方:
 *   REVALIDATE_CUMULATIVE_RANKING_URL=... INTERNAL_REVALIDATE_SECRET=... \
 *     npx tsx scripts/revalidate-cumulative-ranking-cache.ts
 */

async function main() {
  const url = process.env.REVALIDATE_CUMULATIVE_RANKING_URL?.trim();
  const token = process.env.INTERNAL_REVALIDATE_SECRET?.trim();
  if (!url || !token) {
    console.error(
      "REVALIDATE_CUMULATIVE_RANKING_URL と INTERNAL_REVALIDATE_SECRET を設定してください"
    );
    process.exit(1);
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "x-revalidate-token": token },
  });
  const body = await res.text();
  if (!res.ok) {
    console.error(`revalidate failed: ${res.status} ${body}`);
    process.exit(1);
  }
  console.log("revalidate ok:", body);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
