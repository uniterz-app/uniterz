/**
 * アプリの機能を聞かれたとき、答えの下に出す「その画面を開く」ボタン。
 * Web のパス（凍結画面の旧導線）と表示名。Native の遷移は画面側が id を見て行う。
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
  "standings",
  "today",
  "unit_ledger",
  "redeem",
  "plan_status",
  "profile",
  "display",
  "help",
  "badges",
  "groups",
  "results",
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
  standings: "/mobile/standings",
  today: "/mobile/today-leaders",
  unit_ledger: "/mobile/units",
  redeem: "/mobile/redeem",
  plan_status: "/mobile/plan-status",
  profile: "/mobile/settings",
  display: "/mobile/settings",
  help: "/mobile/help",
  badges: "/mobile/badges",
  groups: "/mobile/leaderboards",
  results: "/mobile/result",
};

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
    case "standings":
      return L(lang, { ja: "順位表を開く", en: "Open standings", ko: "순위표 열기", zh: "打开排名表", es: "Abrir clasificación", pt: "Abrir classificação", fr: "Ouvrir le classement" });
    case "today":
      return L(lang, { ja: "TODAY を開く", en: "Open TODAY" });
    case "unit_ledger":
      return L(lang, { ja: "Unit 履歴を開く", en: "Open Unit history" });
    case "redeem":
      return L(lang, { ja: "商品交換を開く", en: "Open Redeem" });
    case "plan_status":
      return L(lang, { ja: "プランの確認を開く", en: "Open plan status" });
    case "profile":
      return L(lang, { ja: "プロフィールを開く", en: "Open profile" });
    case "display":
      return L(lang, { ja: "表示設定を開く", en: "Open display settings" });
    case "help":
      return L(lang, { ja: "ヘルプを開く", en: "Open help" });
    case "badges":
      return L(lang, { ja: "バッジパレットを開く", en: "Open badges" });
    case "groups":
      return L(lang, { ja: "グループを開く", en: "Open groups" });
    case "results":
      return L(lang, { ja: "リザルトを開く", en: "Open results" });
  }
}
