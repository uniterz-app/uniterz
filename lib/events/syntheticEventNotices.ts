import type { EventNoticeContent } from "./eventNoticeTypes";
import { isEventNoticeLiveAt } from "./eventNoticeTypes";
import { DECEMBER_2026_EVENT_NOTICES } from "../campaigns/december2026Campaign";

/**
 * Firestore に同名ドキュメントが無いとき一覧に合成するアプリ内お知らせ。
 * モーダルは先頭から未読のみ順に表示（EventGate）。期間外は出さない。
 *
 * 2026-09: 既存の合成お知らせ（Playoff Competition / Po R1 バッジ）を一覧から外した。
 * 定義ファイル（playoffCompetition / poR1BadgeGrantNotice）は残置。再掲載時はここに戻す。
 */
export const SYNTHETIC_EVENT_NOTICES: EventNoticeContent[] = [
  ...DECEMBER_2026_EVENT_NOTICES,
];

export function liveSyntheticEventNotices(
  nowMs: number = Date.now()
): EventNoticeContent[] {
  return SYNTHETIC_EVENT_NOTICES.filter(
    (e) => e.listInAnnouncements && isEventNoticeLiveAt(e, nowMs)
  );
}

export function eventModalQueueAt(
  nowMs: number = Date.now()
): EventNoticeContent[] {
  return SYNTHETIC_EVENT_NOTICES.filter(
    (e) => e.showModal && isEventNoticeLiveAt(e, nowMs)
  );
}

export const EVENT_MODAL_QUEUE: EventNoticeContent[] =
  SYNTHETIC_EVENT_NOTICES.filter((e) => e.showModal);

export function getSyntheticEventById(
  id: string
): EventNoticeContent | undefined {
  return SYNTHETIC_EVENT_NOTICES.find((e) => e.id === id);
}
