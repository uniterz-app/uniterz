import { PLAYOFF_COMPETITION_EVENT } from "./playoffCompetition";
import { PO_R1_BADGE_GRANT_NOTICE } from "./poR1BadgeGrantNotice";
import { WC_UNIFORM_CHALLENGE_NOTICE } from "./wcUniformChallengeNotice";
import type { EventNoticeContent } from "./eventNoticeTypes";

/**
 * Firestore に同名ドキュメントが無いとき一覧に合成するアプリ内お知らせ。
 * モーダルは先頭から未読のみ順に表示（EventGate）。
 */
export const SYNTHETIC_EVENT_NOTICES: EventNoticeContent[] = [
  WC_UNIFORM_CHALLENGE_NOTICE,
  PLAYOFF_COMPETITION_EVENT,
  PO_R1_BADGE_GRANT_NOTICE,
];

export const EVENT_MODAL_QUEUE: EventNoticeContent[] =
  SYNTHETIC_EVENT_NOTICES.filter((e) => e.showModal);

export function getSyntheticEventById(
  id: string
): EventNoticeContent | undefined {
  return SYNTHETIC_EVENT_NOTICES.find(
    (e) => e.listInAnnouncements && e.id === id
  );
}
