/** アプリ内イベントお知らせ（モーダル・一覧・詳細で共有） */
export type EventNoticeContent = {
  id: string;
  /** messages.eventNotices のキー（全言語 UI） */
  i18nKey?: "wcUniformChallenge";
  tag?: string;
  /** 英語 UI 用（未指定時は tag をそのまま表示） */
  tagEn?: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  period: string;
  periodEn?: string;
  target?: string;
  targetEn?: string;
  reward?: string;
  rewardEn?: string;
  /** Firestore に同名 ID が無いとき一覧に合成する */
  listInAnnouncements: boolean;
  /** オンボーディング完了後にモーダルを出す */
  showModal: boolean;
  /** 一覧ソート用（pinned 降順） */
  pinned: boolean;
  /** 一覧ソート用（postedAt 降順） */
  postedAtMs: number;
  heroImageURL: string;
  /** この時刻以降に一覧・モーダル（未指定はすぐ） */
  visibleFromMs?: number;
  /** この時刻未満まで一覧・モーダル（未指定は無期限） */
  visibleUntilMs?: number;
};

export function isEventNoticeLiveAt(
  event: Pick<EventNoticeContent, "visibleFromMs" | "visibleUntilMs">,
  nowMs: number = Date.now()
): boolean {
  if (event.visibleFromMs != null && nowMs < event.visibleFromMs) return false;
  if (event.visibleUntilMs != null && nowMs >= event.visibleUntilMs) return false;
  return true;
}
