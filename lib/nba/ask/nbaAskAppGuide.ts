/**
 * チャットの「アプリの使い方」用の道具。答えの元は既存のヘルプ FAQ と Pro 購入ページの文言だけ
 * （ここに無い仕様を AI に作らせない）。トピック単位で返して送る量を抑える。
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import { helpFaqsCopy, type HelpFaqEntryCopy } from "@/lib/settings/helpFaqsCopy";
import { notificationSettingsCopy } from "@/lib/notifications/notificationSettingsUiCopy";
import { PRO_SUBSCRIBE_PREVIEW_PLANS } from "@/lib/pro/proSubscribePreviewPlans";
import {
  PERIOD_RANKING_UNIT_REWARDS_TABS,
  periodRankingUnitRewardsSections,
  periodRankingUnitRewardsTabLabel,
} from "@/lib/units/periodRankingUnitRewardsCopy";
import { referralInviteScreenCopy } from "@/lib/referral/referralInviteCopy";
import { squadBattleIntroOverlayCopy } from "@/lib/squads/squadBattleUiCopy";
import { nbaAskDestinationForTopic } from "./nbaAskDestinations";
import { NBA_ASK_FREE_STATS_LIFETIME, NBA_ASK_PRO_WEB_DAILY } from "./nbaAskQuota";

/** 採点の質問。ひらがなの「あっぷせっと」も同じ */
const SCORING_QUESTION =
  /あっぷせっと|アップセット|番狂わせ|\bupset\b|連勝|れんしょう|採点|勝率|ポイントの仕組み|ポイントの付き|ボーナス/i;

export function nbaAskIsScoringQuestion(text: string): boolean {
  return SCORING_QUESTION.test(text.trim());
}

/** 「わかりにくい」など、直前の答えを短く言い直す続き */
const CLARIFY_FOLLOW_UP =
  /わかりにく|分かりにく|むずかし|難し|もっと簡単|簡単に|かみくだ|噛み砕|つまり|どういうこと|もう一回|もう一度|短く|なにそれ|何それ|意味がわから|意味わか/;

export function nbaAskIsClarifyFollowUp(text: string): boolean {
  return CLARIFY_FOLLOW_UP.test(text.trim());
}

export const NBA_ASK_APP_TOPICS = [
  "prediction_form",
  "stats",
  "scoring",
  "ranking",
  "unit_rewards",
  "pro_plans",
  "ask_chat",
  "notifications",
  "invite",
  "squads",
  "profile",
] as const;

/** 採点ガイドの切り方。全体を原稿にしない */
export type NbaAskScoringFocus = "overview" | "upset" | "win" | "total";

export function nbaAskScoringFocus(text: string): NbaAskScoringFocus {
  if (/あっぷせっと|アップセット|番狂わせ|\bupset\b/i.test(text)) return "upset";
  if (/勝率/.test(text)) return "win";
  if (/総合|基本点/.test(text)) return "total";
  return "overview";
}
export type NbaAskAppTopic = (typeof NBA_ASK_APP_TOPICS)[number];

const FAQ_ID_BY_TOPIC: Partial<Record<NbaAskAppTopic, HelpFaqEntryCopy["id"]>> = {
  prediction_form: "form",
  stats: "stats",
  scoring: "scoring-logic",
  ranking: "ranking",
};

function scoringCeiling(language: string): string {
  const lang = resolveLocalizedLang(language);
  return L(lang, {
    ja: "これより細かい計算式は公開していません。ヘルプに書いてある範囲が公開分です。",
    en: "Finer formulas are not public. The help text is the published limit.",
    ko: "더 세부적인 계산식은 공개하지 않습니다. 도움말에 있는 범위가 공개분입니다.",
    zh: "更细的公式不公开。帮助里写的范围就是公开部分。",
    es: "Las fórmulas más finas no son públicas. El texto de ayuda es el límite publicado.",
    pt: "Fórmulas mais finas não são públicas. O texto de ajuda é o limite publicado.",
    fr: "Les formules plus fines ne sont pas publiques. L'aide est la limite publiée.",
  });
}

function scoringText(entry: HelpFaqEntryCopy, language: string, focus: NbaAskScoringFocus): string {
  if (entry.id !== "scoring-logic") return "";
  const want =
    focus === "upset" ? "upsetPoints" : focus === "win" ? "winRate" : focus === "total" ? "totalPoints" : null;
  const sections = want ? entry.sections.filter((s) => s.id === want) : entry.sections;
  const lines = sections.flatMap((section) => {
    const bodies = section.blocks.filter((b) => b.kind === "body");
    const shown = want ? bodies : bodies.slice(0, 1);
    return [`[${section.title}]`, ...shown.map((b) => b.text)];
  });
  lines.push(scoringCeiling(language));
  return lines.join("\n");
}

function faqText(entry: HelpFaqEntryCopy): string {
  const lines: string[] = [`Q: ${entry.question}`];
  if ("intro" in entry && entry.intro) lines.push(entry.intro);
  if ("bullets" in entry) lines.push(...entry.bullets.map((b) => `- ${b}`));
  if (entry.id === "scoring-logic") {
    for (const section of entry.sections) {
      lines.push(`[${section.title}]`);
      lines.push(...section.blocks.map((b) => (b.kind === "heading" ? `## ${b.text}` : b.text)));
    }
  }
  if ("outro" in entry && entry.outro) lines.push(entry.outro);
  if (entry.id === "ranking") lines.push(`${entry.noteTitle}: ${entry.noteBody}`);
  return lines.join("\n");
}

function proPlansText(language: string): string {
  const lang = resolveLocalizedLang(language);
  return PRO_SUBSCRIBE_PREVIEW_PLANS.map((plan) => {
    const features = plan.features
      .map((f) => `- ${L(lang, f.title)}: ${L(lang, f.detail)}`)
      .join("\n");
    return `${plan.label} ${plan.price}${L(lang, plan.period)} — ${L(lang, plan.blurb)}\n${features}`;
  }).join("\n\n");
}

/** ランキング画面の「unit表」シートと同じ表（週間 / 月間スコア / 月間部門） */
function unitRewardsText(language: string): string {
  const lang = resolveLocalizedLang(language);
  return PERIOD_RANKING_UNIT_REWARDS_TABS.map((tab) => {
    const sections = periodRankingUnitRewardsSections(tab, lang).map(
      (sec) => `[${sec.title}]\n${sec.bullets.map((b) => `- ${b}`).join("\n")}`
    );
    return `## ${periodRankingUnitRewardsTabLabel(tab, lang)}\n${sections.join("\n")}`;
  }).join("\n\n");
}

function askChatText(): string {
  return [
    "UNITERZ ASK (this chat):",
    "- Questions about how to use the UNITERZ app are free and unlimited for everyone.",
    `- NBA stats questions (scores, box scores, recent games, season averages, injuries, standings, this season's roster IN/OUT): free accounts get ${NBA_ASK_FREE_STATS_LIFETIME} in total; PRO is unlimited.`,
    "- Roster IN/OUT is versus last season. It is not a live list of trades from today.",
    `- PRO can search the public web for NBA news the app does not store, up to ${NBA_ASK_PRO_WEB_DAILY} times a day. Answers include the source URL. Free accounts cannot.`,
    "- Explaining what PRO features are is free for everyone (use the pro_plans guide). Prices and feature names are fine.",
    "- Never answer permissions, roles, admin access, or how many people use the app or subscribe to PRO. Say that cannot be answered. Do not estimate.",
    "- Looking up one game's Pro Insight, the live PRO LEAGUE board, or the web is PRO-only. Free accounts can hear what those features are, not the live contents.",
    "- Answers come only from the app's data. Opened from the top-right icon on the games list.",
    "- When this guide includes an open id, the app shows a button under the answer that opens that screen. Tell the user to tap it. Do not invent a menu path or URL.",
  ].join("\n");
}

function publishedTopicText(topic: NbaAskAppTopic, language: string): string | null {
  if (topic === "notifications") {
    const copy = notificationSettingsCopy(language);
    return [copy.description, copy.deliveryHint, copy.matchHint].filter(Boolean).join("\n");
  }
  if (topic === "invite") return referralInviteScreenCopy(language).description;
  if (topic === "squads") {
    const lang = resolveLocalizedLang(language);
    return squadBattleIntroOverlayCopy(lang).srSummary;
  }
  if (topic === "profile") {
    const entry = helpFaqsCopy(language).find((e) => e.id === "stats");
    return entry && "outro" in entry ? entry.outro ?? null : null;
  }
  return null;
}

export function nbaAskAppGuide(topic: string, language: string, focus?: string): unknown {
  const t = NBA_ASK_APP_TOPICS.find((x) => x === topic);
  if (!t) return { error: "unknown topic", topics: NBA_ASK_APP_TOPICS };
  const open = nbaAskDestinationForTopic(t);
  const scoringFocus: NbaAskScoringFocus =
    focus === "upset" || focus === "win" || focus === "total" || focus === "overview" ? focus : "overview";
  const body =
    t === "pro_plans"
      ? proPlansText(language)
      : t === "unit_rewards"
        ? unitRewardsText(language)
        : t === "ask_chat"
        ? askChatText()
        : t === "scoring"
          ? (() => {
              const entry = helpFaqsCopy(language).find((e) => e.id === "scoring-logic");
              return entry ? scoringText(entry, language, scoringFocus) : null;
            })()
          : publishedTopicText(t, language) ??
            (() => {
              const id = FAQ_ID_BY_TOPIC[t];
              const entry = id ? helpFaqsCopy(language).find((e) => e.id === id) : undefined;
              return entry ? faqText(entry) : null;
            })();
  if (!body) return { error: "no published copy", topic: t };
  return open ? { topic: t, text: body, open } : { topic: t, text: body };
}
