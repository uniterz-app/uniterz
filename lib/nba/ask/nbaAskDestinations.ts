/**
 * アプリの機能を聞かれたとき、答えの下に出す「その画面を開く」ボタン。
 * Web のパスと表示名。Native の遷移は画面側が id を見て行う。
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

export const NBA_ASK_DESTINATION_IDS = [
  "games",
  "stats",
  "rankings",
  "pro",
  "notifications",
  "invite",
  "squads",
] as const;
export type NbaAskDestinationId = (typeof NBA_ASK_DESTINATION_IDS)[number];

const WEB_PATH: Record<NbaAskDestinationId, string> = {
  games: "/mobile/games",
  stats: "/mobile/stats-preview",
  rankings: "/mobile/rankings",
  pro: "/mobile/pro/subscribe",
  notifications: "/mobile/settings/notifications",
  invite: "/mobile/invite",
  squads: "/mobile/squad-battle",
};

/** ガイドのトピック → 開く画面。このチャット自身（ask_chat）はボタンを出さない */
const TOPIC_OPEN: Record<string, NbaAskDestinationId | undefined> = {
  prediction_form: "games",
  stats: "stats",
  scoring: "rankings",
  ranking: "rankings",
  unit_rewards: "rankings",
  pro_plans: "pro",
  notifications: "notifications",
  invite: "invite",
  squads: "squads",
};

export function nbaAskDestinationForTopic(topic: string): NbaAskDestinationId | null {
  const id = TOPIC_OPEN[topic];
  return id ?? null;
}

export function isNbaAskDestinationId(value: unknown): value is NbaAskDestinationId {
  return NBA_ASK_DESTINATION_IDS.some((id) => id === value);
}

export function nbaAskDestinationWebPath(id: NbaAskDestinationId): string {
  return WEB_PATH[id];
}

export function nbaAskDestinationLabel(id: NbaAskDestinationId, language: string): string {
  const lang = resolveLocalizedLang(language);
  switch (id) {
    case "games":
      return L(lang, {
        ja: "試合一覧を開く",
        en: "Open games",
        ko: "경기 목록 열기",
        zh: "打开比赛列表",
        es: "Abrir partidos",
        pt: "Abrir jogos",
        fr: "Ouvrir les matchs",
      });
    case "stats":
      return L(lang, {
        ja: "スタッツを開く",
        en: "Open stats",
        ko: "스탯 열기",
        zh: "打开数据",
        es: "Abrir estadísticas",
        pt: "Abrir estatísticas",
        fr: "Ouvrir les stats",
      });
    case "rankings":
      return L(lang, {
        ja: "ランキングを開く",
        en: "Open rankings",
        ko: "랭킹 열기",
        zh: "打开排名",
        es: "Abrir el ranking",
        pt: "Abrir o ranking",
        fr: "Ouvrir le classement",
      });
    case "pro":
      return L(lang, {
        ja: "PRO を開く",
        en: "Open PRO",
        ko: "PRO 열기",
        zh: "打开 PRO",
        es: "Abrir PRO",
        pt: "Abrir PRO",
        fr: "Ouvrir PRO",
      });
    case "notifications":
      return L(lang, {
        ja: "通知設定を開く",
        en: "Open notifications",
        ko: "알림 설정 열기",
        zh: "打开通知设置",
        es: "Abrir notificaciones",
        pt: "Abrir notificações",
        fr: "Ouvrir les notifications",
      });
    case "invite":
      return L(lang, {
        ja: "招待を開く",
        en: "Open invite",
        ko: "초대 열기",
        zh: "打开邀请",
        es: "Abrir invitación",
        pt: "Abrir convite",
        fr: "Ouvrir l'invitation",
      });
    case "squads":
      return L(lang, {
        ja: "スクワッドを開く",
        en: "Open squads",
        ko: "스쿼드 열기",
        zh: "打开小队",
        es: "Abrir squads",
        pt: "Abrir squads",
        fr: "Ouvrir les squads",
      });
  }
}
