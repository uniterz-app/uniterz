import type { EventNoticeContent } from "./eventNoticeTypes";

/**
 * Firestore に同名ドキュメントが無いとき一覧に合成するアプリ内お知らせ。
 * モーダルは先頭から未読のみ順に表示（EventGate）。
 *
 * 2026-09: 既存の合成お知らせ（Playoff Competition / Po R1 バッジ）を一覧から外した。
 * 定義ファイル（playoffCompetition / poR1BadgeGrantNotice）は残置。再掲載時はここに戻す。
 */
export const SYNTHETIC_EVENT_NOTICES: EventNoticeContent[] = [];

export const EVENT_MODAL_QUEUE: EventNoticeContent[] =
  SYNTHETIC_EVENT_NOTICES.filter((e) => e.showModal);

export function getSyntheticEventById(
  id: string
): EventNoticeContent | undefined {
  return SYNTHETIC_EVENT_NOTICES.find(
    (e) => e.listInAnnouncements && e.id === id
  );
}
