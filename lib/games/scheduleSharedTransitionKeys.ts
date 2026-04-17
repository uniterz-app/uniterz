/**
 * 試合スケジュール一覧 ↔ 予想オーバーレイの共有要素遷移用の一意名。
 * Jetpack Compose の `sharedBounds` / `sharedElement` に相当する二層。
 *
 * @see https://developer.android.com/develop/ui/compose/animation/shared-elements?hl=ja
 */

/** カード外枠（Compose の sharedBounds 相当） */
export function scheduleSharedBoundsVtName(sanitizedGameId: string): string {
  return `schedule-${sanitizedGameId}-bounds`;
}

/** HOME | 中央 | AWAY のヒーロー領域（sharedElement 塊相当） */
export function scheduleSharedContentVtName(sanitizedGameId: string): string {
  return `schedule-${sanitizedGameId}-content`;
}
