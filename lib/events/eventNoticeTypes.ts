/** アプリ内イベントお知らせ（モーダル・一覧・詳細で共有） */
export type EventNoticeContent = {
  id: string;
  tag?: string;
  title: string;
  description: string;
  period: string;
  target?: string;
  reward?: string;
  /** Firestore に同名 ID が無いとき一覧に合成する */
  listInAnnouncements: boolean;
  /** オンボーディング完了後にモーダルを出す */
  showModal: boolean;
  /** 一覧ソート用（pinned 降順） */
  pinned: boolean;
  /** 一覧ソート用（postedAt 降順） */
  postedAtMs: number;
  heroImageURL: string;
};
