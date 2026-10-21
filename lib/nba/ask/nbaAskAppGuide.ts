/**
 * チャットの「アプリの使い方」用の道具。答えの元は既存のヘルプ FAQ と Pro 購入ページの文言だけ
 * （ここに無い仕様を AI に作らせない）。トピック単位で返して送る量を抑える。
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import { helpFaqsCopy, type HelpFaqEntryCopy } from "@/lib/settings/helpFaqsCopy";
import { PRO_SUBSCRIBE_PREVIEW_PLANS } from "@/lib/pro/proSubscribePreviewPlans";
import {
  PERIOD_RANKING_UNIT_REWARDS_TABS,
  periodRankingUnitRewardsSections,
  periodRankingUnitRewardsTabLabel,
} from "@/lib/units/periodRankingUnitRewardsCopy";
import { nbaAskDestinationForTopic } from "./nbaAskDestinations";
import { NBA_ASK_FREE_STATS_LIFETIME, NBA_ASK_PRO_WEB_DAILY } from "./nbaAskQuota";

export const NBA_ASK_APP_TOPICS = [
  "prediction_form",
  "stats",
  "scoring",
  "ranking",
  "unit_rewards",
  "pro_plans",
  "ask_chat",
] as const;
export type NbaAskAppTopic = (typeof NBA_ASK_APP_TOPICS)[number];

const FAQ_ID_BY_TOPIC: Partial<Record<NbaAskAppTopic, HelpFaqEntryCopy["id"]>> = {
  prediction_form: "form",
  stats: "stats",
  scoring: "scoring-logic",
  ranking: "ranking",
};

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
    "- Explaining what PRO features are is free for everyone (use the pro_plans guide).",
    "- Looking up one game's Pro Insight, the live PRO LEAGUE board, or the web is PRO-only. Free accounts can hear what those features are, not the live contents.",
    "- Answers come only from the app's data. Opened from the top-right icon on the games list.",
    "- When this guide includes an open id, the app shows a button under the answer that opens that screen. Tell the user to tap it. Do not invent a menu path or URL.",
  ].join("\n");
}

export function nbaAskAppGuide(topic: string, language: string): unknown {
  const t = NBA_ASK_APP_TOPICS.find((x) => x === topic);
  if (!t) return { error: "unknown topic", topics: NBA_ASK_APP_TOPICS };
  const open = nbaAskDestinationForTopic(t);
  const body =
    t === "pro_plans"
      ? proPlansText(language)
      : t === "unit_rewards"
        ? unitRewardsText(language)
        : t === "ask_chat"
        ? askChatText()
        : (() => {
            const id = FAQ_ID_BY_TOPIC[t];
            const entry = helpFaqsCopy(language).find((e) => e.id === id);
            return entry ? faqText(entry) : null;
          })();
  return open ? { topic: t, text: body, open } : { topic: t, text: body };
}
