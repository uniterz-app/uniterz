/**
 * ASK のアプリ知識。答えはここに書いた文だけ（AI に仕様を作らせない）。
 * Unit の額・上限・料金は定数から作るので、値を変えたらそのまま答えに出る。
 * 画面の場所は Native（`apps/native`）の実際の導線に合わせる。
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import { LANGUAGE_CHOICES, LANGUAGE_CHOICE_NATIVE_NAMES } from "@/lib/i18n/language";
import {
  PERIOD_RANKING_UNIT_DEPARTMENT_METRICS,
  PERIOD_RANKING_UNIT_OVERALL_METRIC,
  PERIOD_UPSET_MIN_WIN_RATE,
  PERIOD_WIN_RATE_PICKUP_PARTICIPATION_RATE,
  periodRankingUnitMaxRank,
  unitsForPeriodRankingRank,
  type PeriodRankingUnitMetric,
  type PeriodRankingUnitPeriod,
} from "@/lib/units/periodRankingUnitRewards";
import { SEASON_PREDICT_UNITS_BY_RANK } from "@/lib/units/seasonPredictUnitRewards";
import {
  REFERRAL_INVITEE_UNITS,
  REFERRAL_MILESTONES,
  REFERRAL_REFERRER_MAX_COMPLETED,
  REFERRAL_REFERRER_MAX_UNITS,
  REFERRAL_REFERRER_UNITS_PER_COMPLETED,
} from "@/lib/referral/referralRewards";
import { PARTNER_INVITEE_UNITS } from "@/lib/referral/referralPartner";
import {
  GROUP_BATTLE_DEFAULT_MONTHLY_UNITS_PER_MEMBER,
  GROUP_BATTLE_DEFAULT_WEEKLY_UNITS_PER_MEMBER,
} from "@/lib/groupBattles/unitLedger";
import { GROUP_BATTLE_MAX_MEMBERS, GROUP_BATTLE_MIN_MEMBERS } from "@/lib/groupBattles/constants";
import { REDEMPTION_CATALOG, REDEMPTION_SEASON_CAP_UNITS } from "@/lib/redemption/redemptionCatalog";
import { MAX_MARKS_FREE, MAX_MARKS_PRO } from "@/lib/marks/markTypes";
import { NBA_FAVORITE_MAX_PLAYERS_FREE, NBA_FAVORITE_MAX_PLAYERS_PRO } from "@/lib/profile/nbaFavorites";
import {
  FREE_MAX_MEMBERSHIPS,
  FREE_MAX_OWNED_GROUPS,
  MAX_MEMBERS_PER_GROUP,
  PRO_MAX_MEMBERSHIPS,
  PRO_MAX_OWNED_GROUPS,
} from "@/lib/communities/limitValues";
import { NBA_TOP_SCORER_BONUS_POINTS } from "@/lib/nba/topScorer";
import { PRO_SUBSCRIBE_PREVIEW_PLANS } from "@/lib/pro/proSubscribePreviewPlans";
import { NBA_ASK_FREE_STATS_DAILY } from "./nbaAskQuota";
import type { NbaAskDestinationId } from "./nbaAskDestinations";

type Lang = string;
type Focus = "overview" | "upset" | "win" | "total" | "streak" | null | undefined;

type Entry = {
  id: string;
  /** 読み取りの AI に渡す一言（英語） */
  hint: string;
  /** AI を通さず即答する言い回し。NBA の質問を誤って拾わないよう、アプリ固有の語だけ */
  fast?: RegExp;
  open?: NbaAskDestinationId[];
  answer: (lang: Lang, focus: Focus) => string;
  /** 「わかりにくい」のあとの短い言い直し */
  short?: (lang: Lang) => string;
};

const T = (lang: Lang, ja: string, en: string) => (lang === "ja" ? ja : en);
const pct = (r: number) => `${Math.round(r * 100)}%`;

/** [50, 40, 30, 25, 20, 15, 15, …] → 1位 50 / 2位 40 / … / 6〜10位 15 */
function rankRuns(units: readonly number[], lang: Lang): string {
  const parts: string[] = [];
  let i = 0;
  while (i < units.length) {
    let j = i;
    while (j + 1 < units.length && units[j + 1] === units[i]) j++;
    const label = i === j ? T(lang, `${i + 1}位`, `#${i + 1}`) : T(lang, `${i + 1}〜${j + 1}位`, `#${i + 1}-${j + 1}`);
    parts.push(`${label} ${units[i]}`);
    i = j + 1;
  }
  return parts.join(" / ");
}

function periodUnits(period: PeriodRankingUnitPeriod, metric: PeriodRankingUnitMetric): number[] {
  const max = periodRankingUnitMaxRank(period, metric);
  const out: number[] = [];
  for (let rank = 1; rank <= max; rank++) {
    const u = unitsForPeriodRankingRank(period, metric, rank);
    if (u == null) break;
    out.push(u);
  }
  return out;
}

function referralMilestoneText(lang: Lang): string {
  return REFERRAL_MILESTONES.map((m) => T(lang, `${m.completedCount}人で +${m.bonusUnits}`, `${m.completedCount} friends +${m.bonusUnits}`)).join("、");
}

function redeemCatalogText(lang: Lang): string {
  return REDEMPTION_CATALOG.map((item) => `${lang === "ja" ? item.titleJa : item.titleEn} ${item.unitsRequired} Unit`).join(" / ");
}

function proPlansText(lang: Lang): string {
  const l = resolveLocalizedLang(lang);
  return PRO_SUBSCRIBE_PREVIEW_PLANS.map((p) => `${p.label} ${p.price}${L(l, p.period)}`).join(" / ");
}

function proFeatureText(lang: Lang): string {
  const l = resolveLocalizedLang(lang);
  const all = PRO_SUBSCRIBE_PREVIEW_PLANS[PRO_SUBSCRIBE_PREVIEW_PLANS.length - 1]?.features ?? [];
  return all.map((f) => L(l, f.title)).join("、");
}

const ENTRIES: Entry[] = [
  // ---------------------------------------------------------------- 全体
  {
    id: "app_overview",
    hint: "what UNITERZ is / what you can do in the app",
    fast: /(?:uniterz|ユニターズ|このアプリ).{0,12}(?:って何|とは|何ができ|なにができ|どんなアプリ)|what is uniterz|what can i do (?:in|with) (?:this|the) app/i,
    answer: (lang) =>
      T(
        lang,
        [
          "UNITERZ は NBA の試合結果を予想して、ポイントでランキングを競うアプリです。",
          "・試合一覧で勝敗とスコア、最多得点者を予想",
          "・当たり具合でポイント。週間・月間のランキングで上位に入ると Unit（ジャージなどと交換できるポイント）",
          "・グループやスクワッドバトルで仲間と勝負",
          "・NBA のスタッツ・順位・選手やチームの詳細も見られます（試合一覧の右端 STANDING / STATS / TODAY）",
        ].join("\n"),
        [
          "UNITERZ is an NBA prediction app: pick game results and compete on points rankings.",
          "- Pick the winner, score, and top scorer from the games list",
          "- Earn points; top weekly and monthly ranks get Units (redeemable for jerseys and more)",
          "- Compete with friends in groups and Squad Battles",
          "- Browse NBA stats, standings, and team / player pages (STANDING / STATS / TODAY on the right edge of the games list)",
        ].join("\n")
      ),
  },
  // ---------------------------------------------------------------- 予想
  {
    id: "prediction_how",
    hint: "how to make a prediction (winner, score, top scorer)",
    fast: /(?:予想|ピック)の(?:仕方|しかた|やり方|やりかた|方法|手順)|どう(?:やって)?(?:予想|ピック)する|how (?:do i|to) (?:make a )?(?:predict|pick)/i,
    open: ["games"],
    answer: (lang) =>
      T(
        lang,
        [
          "試合一覧（下タブの一番左）で試合カードをタップすると予想画面が開きます。",
          "・勝つチームを選ぶ",
          "・両チームの得点を入れる（必須）",
          `・最多得点者を選ぶ（任意・当たると +${NBA_TOP_SCORER_BONUS_POINTS}）`,
          "1試合に予想は1つ。試合開始までは何度でも直せます。予想画面の INSIGHT / INJURY / STATS / ROSTER タブで材料も見られます。",
        ].join("\n"),
        [
          "Tap a game card in the games list (leftmost tab) to open the pick screen.",
          "- Choose the winner",
          "- Enter both teams' scores (required)",
          `- Optionally pick the top scorer (+${NBA_TOP_SCORER_BONUS_POINTS} if right)`,
          "One pick per game, editable until tip-off. The INSIGHT / INJURY / STATS / ROSTER tabs help you decide.",
        ].join("\n")
      ),
  },
  {
    id: "season_predict",
    hint: "season predictions (standings / award predictions) and their rewards",
    fast: /シーズン予想|順位予想|アワード予想|season predict|award predictions?|standings predictions?/i,
    open: ["games"],
    answer: (lang) =>
      T(
        lang,
        `試合一覧のヘッダー左の「アワード予想」「順位予想」から出せます。開幕戦の開始前が締切で、それまでは何度でも直せます。それぞれ別のランキングで、上位20位に Unit が出ます（${rankRuns(SEASON_PREDICT_UNITS_BY_RANK, lang)}）。同点は最後に提出した時刻が早い人が上です。`,
        `Open "Award Predictions" or "Standings Predictions" at the top left of the games list. They lock at the season's first tip-off and can be edited until then. Each has its own ranking; the top 20 get Units (${rankRuns(SEASON_PREDICT_UNITS_BY_RANK, lang)}). Ties go to the earlier final submission.`
      ),
  },
  {
    id: "prediction_deadline",
    hint: "when picks lock / editing or deleting a pick",
    fast: /(?:予想|ピック).{0,10}(?:締め?切|しめきり|いつまで|何時まで|変更|修正|編集|取り消|削除|消せ)|(?:pick|prediction).{0,12}(?:deadline|lock|edit|change|delete)/i,
    open: ["games"],
    answer: (lang) =>
      T(
        lang,
        "予想は試合開始時刻まで、何度でも変更・削除できます。開始時刻を過ぎるか試合が始まると、変更も削除もできなくなります。締切が近い未予想の試合は通知でお知らせします（通知設定で何分前かを選べます）。",
        "You can edit or delete a pick until tip-off. Once the game starts it locks. A reminder before the deadline for unpicked games can be set in notification settings."
      ),
  },
  {
    id: "scoring",
    hint: "how points are scored (overview, upset, win rate, total points, the user's own win streak). Set scoring_focus.",
    fast: /あっぷせっと|アップセット|番狂わせ|採点|ポイントの(?:仕組み|計算|付き方|つき方)|何ポイント|連勝ボーナス|(?:自分の|予想の)?連勝(?:って|は|が|を).{0,10}(?:伸|どう|仕組み|切れ|リセット|消え|止ま|数え)|how (?:are )?points|scoring rules|win streak|\bupset\b/i,
    open: ["rankings"],
    answer: (lang, focus) => {
      if (focus === "upset") {
        return T(
          lang,
          "アップセットになるのは、予想が10件以上あり、60%以上の人が選んだチームが負けた試合です。勝った側を当てた人に +2 のボーナスと、ランキング用のアップセット得点（0〜10）が付きます。アップセット得点は多数派が多いほど高く、多数派が90%以上なら10点です。",
          "A game is an upset when it has 10+ picks and the team picked by 60%+ loses. If you picked the winner you get a +2 bonus and upset points (0-10) for the upset ranking. The bigger the majority, the more upset points; 90%+ gives 10."
        );
      }
      if (focus === "streak") {
        return T(
          lang,
          "連勝は、勝者を当てた予想が続くと1ずつ伸び、外すと0に戻ります。予想していない試合は関係なく、連勝は切れません。試合開始の順に数え、シーズンをまたいでは続きません。連勝中に勝者を当てると、3〜4連勝 +1・5〜6連勝 +2・7連勝以上 +3 のボーナスが付きます。",
          "Your streak grows by 1 each time you pick the winner and resets to 0 on a miss. Games you didn't pick don't count and don't break it. It is counted in tip-off order and does not carry over between seasons. Bonus on a correct pick: 3-4 in a row +1, 5-6 +2, 7+ +3."
        );
      }
      if (focus === "win") {
        return T(
          lang,
          `勝率は勝者を当てた割合です。週間・月間の勝率ランキングに載るのは、その時点までの PICK UP 試合の ${pct(PERIOD_WIN_RATE_PICKUP_PARTICIPATION_RATE)} 以上を予想している人だけです。`,
          `Win rate is the share of picks with the right winner. The weekly / monthly win-rate ranking only lists people who picked at least ${pct(PERIOD_WIN_RATE_PICKUP_PARTICIPATION_RATE)} of the PICK UP games so far.`
        );
      }
      return T(
        lang,
        [
          "1試合のポイントは勝者を当てたときだけ付きます（外すと0点）。",
          "・勝者的中 +4",
          "・点差の近さ 最大 +4（15点ずれると0）",
          "・合計得点の近さ 最大 +2（11点ずれると0）",
          "・スコア完全一致 さらに +4",
          `・最多得点者的中 +${NBA_TOP_SCORER_BONUS_POINTS}`,
          "・アップセット的中 +2",
          "・連勝ボーナス 3〜4連勝 +1 / 5〜6連勝 +2 / 7連勝以上 +3",
        ].join("\n"),
        [
          "Points come only when you pick the winner (otherwise 0).",
          "- Correct winner +4",
          "- Margin closeness up to +4 (0 at 15 off)",
          "- Combined score closeness up to +2 (0 at 11 off)",
          "- Exact score +4 more",
          `- Correct top scorer +${NBA_TOP_SCORER_BONUS_POINTS}`,
          "- Upset hit +2",
          "- Win streak bonus: 3-4 in a row +1 / 5-6 +2 / 7+ +3",
        ].join("\n")
      );
    },
    short: (lang) =>
      T(
        lang,
        "勝者を当てると4点。点差と合計点が近いほど最大6点上乗せ、ぴったりならさらに4点。外すと0点です。",
        "Pick the winner for 4 points, up to 6 more for a close margin and total, and 4 more for an exact score. A wrong winner is 0."
      ),
  },
  {
    id: "pickup_vs_pro_league",
    hint: "difference between PICK UP and PRO LEAGUE rankings / which games count",
    fast: /pick\s*up.{0,12}(?:pro\s*league|プロリーグ)|(?:pro\s*league|プロリーグ).{0,12}pick\s*up|ピックアップ(?:って|とは|試合とは|の意味)|pro\s*league(?:って|とは)|プロリーグ(?:って|とは)|what is (?:pick ?up|pro league)/i,
    open: ["rankings"],
    answer: (lang) =>
      T(
        lang,
        "PICK UP は運営が選んだ注目試合で、PICK UP ランキングはその試合だけで競います（誰でも参加・Unit の対象）。PRO LEAGUE はすべての試合で競う PRO 会員だけのランキングです。試合カードの PICK UP 表示で見分けられます。",
        "PICK UP games are featured games; the PICK UP ranking counts only those (open to everyone, and it pays Units). PRO LEAGUE counts every game and lists PRO members only. Look for the PICK UP label on game cards."
      ),
  },
  {
    id: "ranking",
    hint: "how the rankings work / where they are / when they update",
    fast: /ランキングの(?:見方|仕組み|更新|ルール)|ランキング(?:って|とは|はいつ更新)|how (?:do|does) (?:the )?rankings? work/i,
    open: ["rankings"],
    answer: (lang) =>
      T(
        lang,
        "下タブの RANKING で見られます。上で Pick Up / PRO LEAGUE、Season / Weekly / Monthly を切り替え、指標はスコア・最多得点者的中・アップセット・勝率です。全体ランキングは毎日日本時間16時に更新されます。右端の MENU からプレーオフとスクワッドバトルにも行けます。",
        "Open the RANKING tab. Switch Pick Up / PRO LEAGUE and Season / Weekly / Monthly at the top; metrics are score, top-scorer hits, upset, and win rate. Global rankings update daily at 16:00 JST. The MENU on the right edge leads to Playoffs and Squad Battle."
      ),
  },
  {
    id: "ranking_missing",
    hint: "my name is not on the ranking / my points are not reflected",
    fast: /ランキングに.{0,8}(?:出ない|出てこない|載らない|のらない|いない|反映され|表示されない|ない)|(?:自分|名前|ポイント)が.{0,10}(?:ランキング|反映)(?:に)?.{0,6}(?:出ない|ない|されない)|not (?:on|in) the ranking/i,
    open: ["rankings"],
    answer: (lang) =>
      T(
        lang,
        [
          "ランキングに出ないときは、次を確かめてください。",
          "・全体ランキングは毎日日本時間16時に更新されます。それまでは前日の結果のままです",
          "・PICK UP ランキングは PICK UP 試合の予想だけで数えます。PICK UP 以外の試合は入りません",
          "・PRO LEAGUE は PRO 会員だけのランキングです",
          `・勝率ランキングは、その時点までの PICK UP 試合の ${pct(PERIOD_WIN_RATE_PICKUP_PARTICIPATION_RATE)} 以上を予想した人だけが載ります`,
          "・週間・月間は期間が変わるとリセットされます",
        ].join("\n"),
        [
          "If you are not on a ranking, check:",
          "- Global rankings update daily at 16:00 JST; until then they show the previous day",
          "- The PICK UP ranking counts only picks on PICK UP games",
          "- PRO LEAGUE lists PRO members only",
          `- The win-rate ranking only lists people who picked at least ${pct(PERIOD_WIN_RATE_PICKUP_PARTICIPATION_RATE)} of the PICK UP games so far`,
          "- Weekly and monthly rankings reset each period",
        ].join("\n")
      ),
  },
  // ---------------------------------------------------------------- Unit
  {
    id: "unit_about",
    hint: "what Units are",
    fast: /^(?:unit|ユニット)(?:って(?:何|なに|なん)|とは|って[？?]?$)|^what (?:is|are) (?:a )?units?/i,
    open: ["unit_ledger"],
    answer: (lang) =>
      T(
        lang,
        "Unit は UNITERZ のごほうびポイントです。ランキング上位・スクワッドバトル・友達の招待・シーズン予想などでもらえ、貯めた Unit は NBA グッズと交換できます。お金で買うことはできません。残高はプロフィールで見られます。",
        "Units are UNITERZ reward points. You earn them from top ranking finishes, Squad Battle, inviting friends, season predictions and more, and redeem them for NBA gear. They cannot be bought. See your balance on your profile."
      ),
  },
  {
    id: "unit_earn",
    hint: "all ways to earn Units and roughly how many",
    fast: /(?:unit|ユニット).{0,16}(?:稼|もら|貰|獲得|増や|ため|貯|入手|ゲット|どれくらい|いくつ|何個)|(?:稼|もら|獲得|増や).{0,8}(?:unit|ユニット)|(?:earn|get) units/i,
    open: ["unit_ledger"],
    answer: (lang) => {
      const weekly = periodUnits("weekly", PERIOD_RANKING_UNIT_OVERALL_METRIC);
      const monthly = periodUnits("monthly", PERIOD_RANKING_UNIT_OVERALL_METRIC);
      return T(
        lang,
        [
          "Unit は次の方法でもらえます。",
          `・週間ランキング（PICK UP・スコア）上位${weekly.length}位: 1位 ${weekly[0]}〜${weekly[weekly.length - 1]}`,
          `・月間ランキング（PICK UP・スコア）上位${monthly.length}位: 1位 ${monthly[0]}〜${monthly[monthly.length - 1]}。月間はアップセット部門・得点者部門にも別に Unit`,
          `・スクワッドバトル: 週間1位 ${GROUP_BATTLE_DEFAULT_WEEKLY_UNITS_PER_MEMBER[0]}・月間1位 ${GROUP_BATTLE_DEFAULT_MONTHLY_UNITS_PER_MEMBER[0]}（メンバー全員に）`,
          `・友達の招待: 友達が7日予想すると友達に ${REFERRAL_INVITEE_UNITS}、あなたに1人 ${REFERRAL_REFERRER_UNITS_PER_COMPLETED}（最大 ${REFERRAL_REFERRER_MAX_UNITS}）`,
          `・パートナーコードで登録: ${PARTNER_INVITEE_UNITS}`,
          `・シーズン予想（順位 / アワード）上位20位: 1位 ${SEASON_PREDICT_UNITS_BY_RANK[0]}`,
          "細かい順位ごとの額は「ランキングの Unit 表」と聞いてください。",
        ].join("\n"),
        [
          "Ways to earn Units:",
          `- Weekly ranking (PICK UP, score) top ${weekly.length}: #1 ${weekly[0]} down to ${weekly[weekly.length - 1]}`,
          `- Monthly ranking (PICK UP, score) top ${monthly.length}: #1 ${monthly[0]} down to ${monthly[monthly.length - 1]}, plus separate upset and top-scorer categories`,
          `- Squad Battle: weekly #1 ${GROUP_BATTLE_DEFAULT_WEEKLY_UNITS_PER_MEMBER[0]}, monthly #1 ${GROUP_BATTLE_DEFAULT_MONTHLY_UNITS_PER_MEMBER[0]} (each member)`,
          `- Invites: when a friend picks on 7 days, they get ${REFERRAL_INVITEE_UNITS} and you get ${REFERRAL_REFERRER_UNITS_PER_COMPLETED} each (up to ${REFERRAL_REFERRER_MAX_UNITS})`,
          `- Signing up with a partner code: ${PARTNER_INVITEE_UNITS}`,
          `- Season predictions (standings / awards) top 20: #1 ${SEASON_PREDICT_UNITS_BY_RANK[0]}`,
          "Ask for the \"ranking Unit table\" for every rank.",
        ].join("\n")
      );
    },
  },
  {
    id: "unit_ranking_rewards",
    hint: "the Unit table per ranking rank (weekly / monthly / categories)",
    fast: /(?:週間|月間|ランキング|順位|位).{0,10}(?:unit|ユニット)|(?:unit|ユニット)(?:表|テーブル)|unit table|units? for (?:#?\d|rank|weekly|monthly)/i,
    open: ["rankings"],
    answer: (lang) => {
      const dept = PERIOD_RANKING_UNIT_DEPARTMENT_METRICS[0]!;
      return T(
        lang,
        [
          "ランキングの Unit（PICK UP のスコア。PRO LEAGUE・シーズン・勝率は対象外。同点は同額）",
          `週間: ${rankRuns(periodUnits("weekly", PERIOD_RANKING_UNIT_OVERALL_METRIC), lang)}`,
          `月間: ${rankRuns(periodUnits("monthly", PERIOD_RANKING_UNIT_OVERALL_METRIC), lang)}`,
          `月間の部門（アップセット・得点者、それぞれ）: ${rankRuns(periodUnits("monthly", dept), lang)}`,
          `月間アップセット部門は、その月の勝率が ${pct(PERIOD_UPSET_MIN_WIN_RATE)} 以上の人だけが対象です。RANKING 画面の「unit表」でも見られます。`,
        ].join("\n"),
        [
          "Ranking Units (PICK UP score only; not PRO LEAGUE, season, or win rate; ties get the same amount)",
          `Weekly: ${rankRuns(periodUnits("weekly", PERIOD_RANKING_UNIT_OVERALL_METRIC), lang)}`,
          `Monthly: ${rankRuns(periodUnits("monthly", PERIOD_RANKING_UNIT_OVERALL_METRIC), lang)}`,
          `Monthly categories (upset, top scorer, each): ${rankRuns(periodUnits("monthly", dept), lang)}`,
          `The monthly upset category requires a ${pct(PERIOD_UPSET_MIN_WIN_RATE)}+ win rate that month. Also on the RANKING screen's Unit table chip.`,
        ].join("\n")
      );
    },
  },
  {
    id: "unit_spend",
    hint: "what Units can be redeemed for (jersey etc.) and how",
    fast: /(?:unit|ユニット).{0,12}(?:使い道|使え|交換|何に)|商品交換|(?:ジャージ|tシャツ|キャップ).{0,8}(?:交換|もらえ)|redeem/i,
    open: ["redeem"],
    answer: (lang) =>
      T(
        lang,
        `Unit は NBA グッズと交換できます: ${redeemCatalogText(lang)}。交換は1シーズン ${REDEMPTION_SEASON_CAP_UNITS} Unit まで。プロフィールのメニュー →「商品交換」から、欲しい商品のスクリーンショットを付けて申請すると、審査のあと運営が購入して届けます（中古・ギフトカード・名入れなどは対象外）。`,
        `Units can be redeemed for NBA gear: ${redeemCatalogText(lang)}. Up to ${REDEMPTION_SEASON_CAP_UNITS} Units per season. Open Profile → MENU → Redeem Units, attach a screenshot of the item, and after review we buy and ship it (no used items, gift cards, or personalization).`
      ),
  },
  {
    id: "unit_balance",
    hint: "where to see my Unit balance and history",
    fast: /(?:unit|ユニット).{0,8}(?:残高|履歴|いくつ持|確認|どこで見)|unit (?:balance|history)/i,
    open: ["unit_ledger"],
    answer: (lang) =>
      T(
        lang,
        "プロフィールの Unit 残高、またはプロフィールのメニュー先頭の UNITS をタップすると、残高ともらった履歴（Unit 履歴）が見られます。",
        "Tap the Unit balance on your profile, or UNITS at the top of the profile MENU, to see your balance and history."
      ),
  },
  {
    id: "invite",
    hint: "inviting friends / invite code rewards",
    fast: /^(?!.*(?:グループ|group)).*(?:招待|紹介コード|invite|referral)/i,
    open: ["invite"],
    answer: (lang) =>
      T(
        lang,
        `プロフィールのメニュー →「招待」で自分の招待コード（UNIT-XXXX）を共有できます。友達が新規登録のときにコードを入れて、7日（連続でなくてよい）予想すると達成です。友達に ${REFERRAL_INVITEE_UNITS} Unit、あなたに1人 ${REFERRAL_REFERRER_UNITS_PER_COMPLETED} Unit（${REFERRAL_REFERRER_MAX_COMPLETED}人まで）。さらに ${referralMilestoneText(lang)}。あなたの合計は最大 ${REFERRAL_REFERRER_MAX_UNITS} Unit です。コードを入れられるのは登録時の1回だけです。`,
        `Share your invite code (UNIT-XXXX) from Profile → MENU → Invite. A friend enters it at sign-up and completes after picking on 7 days (not necessarily in a row). They get ${REFERRAL_INVITEE_UNITS} Units and you get ${REFERRAL_REFERRER_UNITS_PER_COMPLETED} each (up to ${REFERRAL_REFERRER_MAX_COMPLETED} friends), plus milestones: ${referralMilestoneText(lang)}. Your total caps at ${REFERRAL_REFERRER_MAX_UNITS}. A code can only be entered once, at sign-up.`
      ),
  },
  {
    id: "partner_code",
    hint: "partner codes",
    fast: /パートナーコード|partner code/i,
    answer: (lang) =>
      T(
        lang,
        `パートナーコードは新規登録のとき、招待コードと同じ欄に入れます。登録した時点で ${PARTNER_INVITEE_UNITS} Unit もらえます。入れられるのは登録時の1回だけです。`,
        `Enter a partner code at sign-up, in the same field as invite codes. You get ${PARTNER_INVITEE_UNITS} Units right away. It can only be entered once, at sign-up.`
      ),
  },
  // ---------------------------------------------------------------- 仲間
  {
    id: "squads",
    hint: "Squad Battle (team competition) and its rewards",
    fast: /スクワッド|squad/i,
    open: ["squads"],
    answer: (lang) =>
      T(
        lang,
        `スクワッドバトルは ${GROUP_BATTLE_MIN_MEMBERS}〜${GROUP_BATTLE_MAX_MEMBERS}人のチームで、PICK UP 試合のメンバーのスコア平均を競う大会です。約2ヶ月に1回、エントリー期間（開催の1〜2週間前）→ 約1ヶ月のバトル（週間4回＋月間）の流れです。1大会に入れるチームは1つ。Unit はメンバー全員に同額で、週間1位 ${GROUP_BATTLE_DEFAULT_WEEKLY_UNITS_PER_MEMBER[0]}・月間1位 ${GROUP_BATTLE_DEFAULT_MONTHLY_UNITS_PER_MEMBER[0]} が目安です（大会ごとに変わることがあります）。RANKING の MENU → SQUAD BATTLE、または GROUP タブから入れます。`,
        `Squad Battle is a team event (${GROUP_BATTLE_MIN_MEMBERS}-${GROUP_BATTLE_MAX_MEMBERS} members) competing on the members' average PICK UP score. Roughly every 2 months: an entry window (1-2 weeks before) then about a month of battle (4 weekly rounds plus monthly). One squad per event. Every member gets the same Units, about ${GROUP_BATTLE_DEFAULT_WEEKLY_UNITS_PER_MEMBER[0]} for weekly #1 and ${GROUP_BATTLE_DEFAULT_MONTHLY_UNITS_PER_MEMBER[0]} for monthly #1 (may vary per event). Enter from RANKING → MENU → SQUAD BATTLE or the GROUP tab.`
      ),
  },
  {
    id: "groups",
    hint: "groups / communities: create, join, invite code, limits",
    fast: /グループ(?:を|の|に|って|とは|作|参加|入)|コミュニティ|community|communities/i,
    open: ["groups"],
    answer: (lang) =>
      T(
        lang,
        `下タブの GROUP で、仲間内のランキング（グループ）を作ったり参加したりできます。1グループ最大 ${MAX_MEMBERS_PER_GROUP}人。参加できるのは無料 ${FREE_MAX_MEMBERSHIPS}・PRO ${PRO_MAX_MEMBERSHIPS} グループ、作れるのは無料 ${FREE_MAX_OWNED_GROUPS}・PRO ${PRO_MAX_OWNED_GROUPS} グループまで。参加は作った人が共有する8文字の招待コードで行います。招待コードは GROUP タブでそのグループを開くと見られます（作った直後にも表示されます）。`,
        `Use the GROUP tab to create or join private rankings (groups). Up to ${MAX_MEMBERS_PER_GROUP} members each. You can join ${FREE_MAX_MEMBERSHIPS} groups free (${PRO_MAX_MEMBERSHIPS} on PRO) and create ${FREE_MAX_OWNED_GROUPS} (${PRO_MAX_OWNED_GROUPS} on PRO). Join with the 8-character code the owner shares; open the group in the GROUP tab to see its code (it is also shown right after you create it).`
      ),
  },
  {
    id: "badges",
    hint: "badges: how to earn and where to see",
    fast: /バッジ|badge/i,
    open: ["badges"],
    answer: (lang) =>
      T(
        lang,
        "月間ランキングの上位に入るとバッジがもらえます（スコアは1〜3位、アップセット・得点者・勝率は1位。PICK UP と PRO LEAGUE それぞれ）。もらったバッジはプロフィールと、メニューの「バッジパレット」で見られ、タップすると裏面に当時の記録が出ます。",
        "Monthly ranking leaders earn badges (score top 3; upset, top scorer, and win rate #1; separately for PICK UP and PRO LEAGUE). See them on your profile and in MENU → Badge Palette; tap one to flip it and see the record."
      ),
  },
  {
    id: "marks",
    hint: "MARK (follow list of predictors) and its limit",
    fast: /\bmark\b|マーク(?:リスト|って|とは|の上限|できる)/i,
    answer: (lang) =>
      T(
        lang,
        `MARK は気になる予想者を登録しておくリストです。登録できるのは無料 ${MAX_MARKS_FREE}人・PRO ${MAX_MARKS_PRO}人までです。`,
        `MARK is a list of predictors you want to follow. Up to ${MAX_MARKS_FREE} people free, ${MAX_MARKS_PRO} on PRO.`
      ),
  },
  {
    id: "favorites",
    hint: "favorite team / favorite players and limits",
    fast: /お気に入り|favorite/i,
    answer: (lang) =>
      T(
        lang,
        `チーム詳細・選手詳細の星ボタンでお気に入りに登録できます。お気に入りチームは1つ、選手は無料 ${NBA_FAVORITE_MAX_PLAYERS_FREE}人・PRO ${NBA_FAVORITE_MAX_PLAYERS_PRO}人まで。プロフィールに表示され、お気に入り選手のテクニカルや退場は通知でも届きます。`,
        `Tap the star on a team or player page to favorite it. One favorite team; players: ${NBA_FAVORITE_MAX_PLAYERS_FREE} free, ${NBA_FAVORITE_MAX_PLAYERS_PRO} on PRO. They show on your profile, and favorite players' techs and ejections can notify you.`
      ),
  },
  // ---------------------------------------------------------------- PRO
  {
    id: "pro_plans",
    hint: "PRO price, plans, free trial, what PRO includes, PRO features like Pro Insight",
    fast: /(?:pro|プロ).{0,8}(?:料金|値段|いくら|価格|プラン|トライアル|無料期間|特典|でできる|って何|とは|のメリット)|(?:料金|月額|年額|サブスク)|pro insight(?:って|とは)|how much is pro|pro (?:price|plans?)/i,
    open: ["pro"],
    answer: (lang) =>
      T(
        lang,
        `PRO のプラン: ${proPlansText(lang)}。Weekly と Monthly は初回7日間無料（期間中に解約すれば請求なし）、Season Pass は自動更新なしでトライアルはありません。主な機能: ${proFeatureText(lang)}。ほかに MARK・お気に入り選手・グループの上限が増え、この ASK のスタッツ質問が無制限になります。`,
        `PRO plans: ${proPlansText(lang)}. Weekly and Monthly start with a 7-day free trial (cancel during it and you aren't charged); the Season Pass doesn't renew and has no trial. Features: ${proFeatureText(lang)}. PRO also raises MARK, favorite-player, and group limits, and makes ASK stats questions unlimited.`
      ),
  },
  {
    id: "pro_manage",
    hint: "cancel PRO, change plan, restore purchases",
    fast: /(?:pro|プロ|サブスク).{0,10}(?:解約|やめ|止め|キャンセル|復元|変更)|^解約|購入(?:を|の)?復元|cancel (?:pro|subscription)|restore purchases?/i,
    open: ["plan_status"],
    answer: (lang) =>
      T(
        lang,
        "解約はプロフィールのメニュー →「プランの確認」→ 解約から、App Store / Google Play のサブスクリプション画面で行います（アカウントを削除しても自動では止まりません）。プラン変更も「プランの確認」から。機種変更などで PRO が消えたときは、購入画面の「購入を復元」を押してください。",
        "Cancel from Profile → MENU → Plan Status → Cancel, which opens your App Store / Google Play subscriptions (deleting your account does not stop billing). Change plans from Plan Status too. If PRO disappears after switching phones, tap \"Restore purchases\" on the purchase screen."
      ),
  },
  {
    id: "ask_chat",
    hint: "this ASK chat: what it can answer and limits",
    fast: /このチャット|(?:ask|アスク|ai).{0,6}(?:何回|回数|制限|何が聞|何を聞)|何回(?:聞|質問)/i,
    answer: (lang) =>
      T(
        lang,
        `このチャットは試合一覧の右上の吹き出しアイコンから開けます。アプリの使い方の質問は無制限です。NBA のスタッツの質問は無料で 1 日 ${NBA_ASK_FREE_STATS_DAILY} 回（日本時間 0 時に戻ります）、PRO は無制限です（試合日程は無料でも回数に入りません）。ニュース（トレードや噂）は調べられません。答えはアプリのデータとヘルプだけから作ります。`,
        `Open this chat from the speech-bubble icon at the top right of the games list. App questions are unlimited. NBA stats questions: ${NBA_ASK_FREE_STATS_DAILY} per day free (resets at midnight JST), unlimited on PRO (schedule questions don't count). It can't look up news (trades, rumors). Answers come only from the app's data and help.`
      ),
  },
  // ---------------------------------------------------------------- 設定
  {
    id: "notifications",
    hint: "notification settings: kinds, deadline reminder, turn off",
    fast: /通知|プッシュ|notification|push/i,
    open: ["notifications"],
    answer: (lang) =>
      T(
        lang,
        "プロフィールのメニュー →「通知設定」で切り替えられます。試合結果の確定、予想締切（未予想の試合だけ・30分前）、Unit 付与、お気に入り選手のテクニカル・退場は無料。締切の60分前・10分前、出場ステータスの変更、PRO INSIGHT の更新、週次・月次レポートは PRO です。",
        "Open Profile → MENU → Notifications. Free: game final, pick deadline (unpicked games, 30 min before), Unit rewards, favorite players' techs and ejections. PRO: 60 / 10 min deadline reminders, player status changes, PRO INSIGHT updates, weekly and monthly reports."
      ),
  },
  {
    id: "language",
    hint: "change the app language",
    fast: /言語|日本語(?:に|表示)|英語(?:に|表示)|中国語に|韓国語に|language|idioma|langue|언어|语言/i,
    open: ["profile"],
    answer: (lang) =>
      T(
        lang,
        `プロフィールの右上のメニュー（または右端のハンドル）→「言語」で変えられます。選べる言語: ${LANGUAGE_CHOICES.map((c) => LANGUAGE_CHOICE_NATIVE_NAMES[c].replace(/^[\u2060-\u206f\u200b-\u200f]+/, "")).join(" / ")}。訳が無い文は英語で表示されます。`,
        `Open Profile → MENU (top right, or the handle on the right edge) → Language. Choices: ${LANGUAGE_CHOICES.map((c) => LANGUAGE_CHOICE_NATIVE_NAMES[c].replace(/^[\u2060-\u206f\u200b-\u200f]+/, "")).join(" / ")}. Untranslated text shows in English.`
      ),
  },
  {
    id: "timezone",
    hint: "time zone / game times shown in which time zone",
    fast: /タイムゾーン|時差|時間帯|日本時間で|time ?zone/i,
    open: ["profile"],
    answer: (lang) =>
      T(
        lang,
        "試合の日付と開始時刻は、プロフィール編集の「時刻の表示」で選んだ時間帯で出ます。「自動（端末）」なら端末の設定どおりです。",
        "Game dates and tip-off times follow the time zone in Edit Profile → time display. \"Auto (device)\" uses your phone's setting."
      ),
  },
  {
    id: "profile_edit",
    hint: "edit profile: name, avatar, bio, country",
    fast: /プロフィール(?:の)?(?:編集|変更|写真|画像|アイコン)|(?:名前|ユーザー名|ニックネーム|アイコン|アバター|自己紹介).{0,8}(?:変え|変更|編集)|edit (?:my )?profile|change (?:my )?(?:name|avatar)/i,
    open: ["profile"],
    answer: (lang) =>
      T(
        lang,
        "プロフィールのメニュー →「プロフィール編集」で、写真・名前（50文字まで）・自己紹介（280文字まで）・国 / 地域・時刻の表示を変えて保存できます。",
        "Profile → MENU → Edit Profile: photo, name (up to 50 characters), bio (up to 280), country / region, and time display."
      ),
  },
  {
    id: "display_settings",
    hint: "display settings: hide live / final scores (spoilers), team records; theme dark / light",
    fast: /ネタバレ|スコアを隠|スコア(?:の)?表示|表示設定|テーマ|ダークモード|ライトモード|白地|黒地|spoiler|dark mode|light mode|theme/i,
    open: ["display"],
    answer: (lang) =>
      T(
        lang,
        "プロフィールのメニュー →「表示設定」で、ライブ中のスコア・試合終了スコア（ネタバレ防止で最初はオフ）・チームの勝敗表示を切り替えられます。黒地 / 白地は「テーマ」で選べます（切り替えるとアプリが再起動します）。",
        "Profile → MENU → Display: toggle live scores, final scores (off by default to avoid spoilers), and team records. Dark / Light is under Theme (the app restarts when you switch)."
      ),
  },
  {
    id: "account",
    hint: "log out / delete account",
    fast: /ログアウト|退会|アカウント(?:を)?(?:削除|消)|log ?out|sign ?out|delete (?:my )?account/i,
    open: ["profile"],
    answer: (lang) =>
      T(
        lang,
        "ログアウトとアカウント削除は、プロフィールのメニューの一番下にあります。削除には今のパスワードと「DELETE」の入力が必要で、プロフィールは消えてログインできなくなります。PRO の人は先に App Store / Google Play で解約してください（削除しても請求は止まりません）。",
        "Log out and Delete Account are at the bottom of the profile MENU. Deleting needs your current password and typing DELETE; your profile is removed and you can't sign in. Cancel PRO in the App Store / Google Play first (deleting doesn't stop billing)."
      ),
  },
  {
    id: "password",
    hint: "forgot password / reset password",
    fast: /パスワード.{0,4}(?:忘れ|わすれ|リセット|再設定|変更|変え|わから)|forgot (?:my )?password|reset (?:my )?password|change (?:my )?password/i,
    answer: (lang) =>
      T(
        lang,
        "ログイン画面の「パスワードをお忘れの方はこちら」からメールアドレスを入れると、パスワード再設定のメールが届きます。届かないときは迷惑メールフォルダも確認してください。",
        "On the login screen, tap \"Reset here\" under the password and enter your email; a reset link will be sent. Check your spam folder if it doesn't arrive."
      ),
  },
  {
    id: "help_contact",
    hint: "help page, contact support, feature requests, terms",
    fast: /問い合わせ|問合せ|サポート|ヘルプ|機能リクエスト|要望|不具合|バグ|contact|support|feature request/i,
    open: ["help"],
    answer: (lang) =>
      T(
        lang,
        "プロフィールのメニューの SUPPORT に、ヘルプ・お問い合わせ・機能リクエスト・利用規約・プライバシーポリシーがあります。",
        "The SUPPORT section of the profile MENU has Help, Contact, Feature Request, Terms, and Privacy."
      ),
  },
  // ---------------------------------------------------------------- 画面の場所
  {
    id: "nav_games",
    hint: "where the games list / schedule screen is",
    fast: /試合一覧(?:は|って)?(?:どこ|どうやって)|where (?:is|are) the games/i,
    open: ["games"],
    answer: (lang) =>
      T(
        lang,
        "試合一覧は下タブの一番左（UNITERZ）です。日付を横にスワイプするか、右上のカレンダーで日を選べます。",
        "The games list is the leftmost tab (UNITERZ). Swipe the dates or use the calendar at the top right."
      ),
  },
  {
    id: "nav_stats",
    hint: "where team / player league stats tables are",
    fast: /(?:スタッツ|成績|リーダー)(?:表)?(?:は|って|が|を)?(?:どこ|どうやって見|見たい|どこで見)|where (?:are|can i see) (?:the )?(?:team |player )?stats/i,
    open: ["stats"],
    answer: (lang) =>
      T(
        lang,
        "試合一覧の右端にある縦タブの STATS をタップ（または右端から左にスワイプ）すると、TEAM STATS / PLAYER STATS の表と検索が開きます。行をタップするとチーム詳細・選手詳細に移ります。",
        "Tap STATS on the right edge of the games list (or swipe left from the edge) for TEAM STATS / PLAYER STATS tables and search. Tap a row to open the team or player page."
      ),
  },
  {
    id: "nav_standings",
    hint: "where the standings are",
    fast: /順位表(?:は|って)?(?:どこ|見たい|どうやって)|where (?:are|is) (?:the )?standings/i,
    open: ["standings"],
    answer: (lang) =>
      T(
        lang,
        "試合一覧の右端の縦タブ STANDING をタップすると順位表が開きます。上の STANDINGS / LEAGUE で切り替えられ、過去のシーズンも矢印で見られます。",
        "Tap STANDING on the right edge of the games list. Switch STANDINGS / LEAGUE at the top; arrows go to past seasons."
      ),
  },
  {
    id: "nav_league_hub",
    hint: "LEAGUE tab: MVP ladder, charts, milestones, top performances",
    fast: /league\s*(?:タブ|tab)|mvpラダー|ラダー(?:は|って)?どこ/i,
    open: ["standings"],
    answer: (lang) =>
      T(
        lang,
        "試合一覧の右端 STANDING → 上の LEAGUE タブに、MVP・新人王などのラダー、週間トップパフォーマンス、好調・不調、通算の節目、選手やチームの散布図があります（今季だけ）。",
        "Right edge STANDING → LEAGUE tab: MVP / rookie ladders, top performances of the week, hot and cold players, milestones, and player / team charts (this season only)."
      ),
  },
  {
    id: "nav_team_detail",
    hint: "how to open a team's detail page",
    fast: /チーム(?:の)?詳細(?:ページ)?(?:は|の)?(?:どこ|開き方|見方|どうやって)|team (?:page|detail)/i,
    open: ["stats"],
    answer: (lang) =>
      T(
        lang,
        "チーム詳細は、STATS の表や検索でチームをタップ、STANDING の順位表の行をタップ、または予想画面の STATS タブから開けます。",
        "Open a team page by tapping it in STATS (table or search), a row in STANDING, or from the STATS tab of the pick screen."
      ),
  },
  {
    id: "nav_player_detail",
    hint: "how to open a player's detail page",
    fast: /選手(?:の)?詳細(?:ページ)?(?:は|の)?(?:どこ|開き方|見方|どうやって)|player (?:page|detail)/i,
    open: ["stats"],
    answer: (lang) =>
      T(
        lang,
        "選手詳細は、STATS の PLAYER 表や検索で選手をタップ、TODAY の NBA リーダー、STANDING の LEAGUE タブ、予想画面の INJURY / ROSTER タブ、またはチーム詳細のロスターから開けます。",
        "Open a player page from STATS (PLAYER table or search), TODAY's NBA leaders, the LEAGUE tab under STANDING, the INJURY / ROSTER tabs of the pick screen, or a team page's roster."
      ),
  },
  {
    id: "nav_today",
    hint: "TODAY screen: today's NBA stat leaders and UNITERZ score leaders",
    fast: /today(?:'s)? leaders|today(?:タブ|画面)|今日のリーダー/i,
    open: ["today"],
    answer: (lang) =>
      T(
        lang,
        "試合一覧の右端 TODAY に、その日の NBA スタッツリーダー（得点・リバウンドなど）と、UNITERZ の今日のスコアリーダー（PICK UP / PRO LEAGUE）があります。",
        "TODAY on the right edge of the games list shows the day's NBA stat leaders and UNITERZ score leaders (PICK UP / PRO LEAGUE)."
      ),
  },
  {
    id: "nav_results",
    hint: "where to see my past picks and their results",
    fast: /(?:自分の|過去の)?予想(?:の)?(?:結果|履歴)(?:は|って|を|が)?(?:どこ|見たい|見れ|確認)|(?:my )?(?:pick|prediction) (?:history|results)/i,
    open: ["results"],
    answer: (lang) =>
      T(
        lang,
        "自分の予想の結果と履歴は、下タブの RESULT で見られます。タップするとその試合の詳細（スコア・得点内訳）が開きます。",
        "Your picks and results are in the RESULT tab. Tap one for the game detail and point breakdown."
      ),
  },
];

const BY_ID = new Map(ENTRIES.map((e) => [e.id, e]));

export const NBA_ASK_KNOWLEDGE_IDS: readonly string[] = ENTRIES.map((e) => e.id);

/** 読み取りの AI に渡す一覧（id: 説明） */
export function nbaAskKnowledgeCatalogLine(): string {
  return ENTRIES.map((e) => `${e.id}: ${e.hint}`).join("\n");
}

/** NBA のデータを聞いている語。これがあれば即答しない（AI に読ませる） */
const NBA_DATA_WORDS =
  /平均|直近|前回|前の試合|ラインナップ|ロスター|契約|年俸|ケガ|怪我|けが|欠場|リバウンド|アシスト|得点王|何点|勝敗|成績|スタッツを|順位は|何位|MVP争い|ドラフト|トレード|移籍/;

/**
 * よくあるアプリの質問だけ、言い回しで即答する。迷うものは null（AI に読ませる）。
 * 長い文は別の話が混ざりやすいので 60 文字まで。
 */
export function matchNbaAskKnowledge(question: string): { id: string; focus?: Focus } | null {
  const q = question.trim();
  if (!q || q.length > 60) return null;
  if (NBA_DATA_WORDS.test(q)) return null;
  for (const e of ENTRIES) {
    if (!e.fast?.test(q)) continue;
    if (e.id === "scoring") {
      const focus: Focus = /あっぷせっと|アップセット|番狂わせ|upset/i.test(q) ? "upset" : /勝率|win rate/i.test(q) ? "win" : /連勝|streak/i.test(q) && !/ボーナス|bonus/i.test(q) ? "streak" : "overview";
      return { id: e.id, focus };
    }
    return { id: e.id };
  }
  return null;
}

export function nbaAskKnowledgeAnswer(
  id: string,
  language: string,
  opts: { focus?: Focus; short?: boolean } = {}
): { answer: string; opens: NbaAskDestinationId[] } | null {
  const e = BY_ID.get(id);
  if (!e) return null;
  const lang = language === "ja" ? "ja" : "en";
  const answer = opts.short && e.short ? e.short(lang) : e.answer(lang, opts.focus);
  return { answer, opens: e.open ?? [] };
}
