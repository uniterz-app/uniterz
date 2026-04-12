/** ScheduleList の myPostMap を、リザルト側で投稿削除したときに同期する */
export const SCHEDULE_MY_POST_DELETED_EVENT = "uniterz:myPostDeleted";

export type ScheduleMyPostDeletedDetail = { gameId: string };
