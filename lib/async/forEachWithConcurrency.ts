/**
 * ワーカープール。外部 API 呼び出しを 1 件ずつ直列に回すと
 * 数百件で数分かかり、サーバーレスのタイムアウトに当たる。
 *
 * `concurrency` は相手のレート制限に収まる範囲で決める。
 * 各ワーカーは自分の 1 件を終えてから次を取るので、
 * 同時に飛ぶリクエストは常に `concurrency` 本以下。
 */
export async function forEachWithConcurrency<T>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>
): Promise<void> {
  const size = Math.max(1, Math.min(Math.trunc(concurrency), items.length));
  if (items.length === 0) return;

  let next = 0;
  const runners = Array.from({ length: size }, async () => {
    for (;;) {
      const index = next;
      next += 1;
      if (index >= items.length) return;
      await worker(items[index]!, index);
    }
  });

  await Promise.all(runners);
}

/** BDL の 1 秒あたり上限に余裕を持たせた既定値 */
export const NBA_INGEST_CONCURRENCY = 6;
