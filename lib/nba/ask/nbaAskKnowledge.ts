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
import { PREDICT_KIT_RECORD_STRONG_PCT } from "@/lib/nba/insights/predictKit/predictKitTypes";
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
    hint: "what UNITERZ is / what you can do in the app / free vs paid basics",
    fast: /(?:uniterz|ユニターズ|このアプリ).{0,12}(?:って何|とは|何ができ|なにができ|どんなアプリ)|無料(?:で|プラン)?(?:できる|できること|の範囲)|what is uniterz|what can i do (?:in|with) (?:this|the) app/i,
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
    fast: /^(?!.*(?:アワード|順位|シーズン)予想).*(?:予想|ピック)の(?:仕方|しかた|やり方|やりかた|方法|手順)|どう(?:やって)?(?:予想|ピック)する|how (?:do i|to) (?:make a )?(?:predict|pick)/i,
    open: ["games"],
    answer: (lang) =>
      T(
        lang,
        [
          "試合一覧（下タブの一番左）で試合カードをタップすると予想画面が開きます。",
          "・勝つチームを選ぶ",
          "・両チームの得点を入れる（必須）",
          `・最多得点者を選ぶ（任意・当たると +${NBA_TOP_SCORER_BONUS_POINTS}）`,
          "1試合に予想は1つ。試合開始までは何度でも直せます。予想画面の PRO PICK / INFORMATION / TREND タブで材料も見られます。",
        ].join("\n"),
        [
          "Tap a game card in the games list (leftmost tab) to open the pick screen.",
          "- Choose the winner",
          "- Enter both teams' scores (required)",
          `- Optionally pick the top scorer (+${NBA_TOP_SCORER_BONUS_POINTS} if right)`,
          "One pick per game, editable until tip-off. The PRO PICK / INFORMATION / TREND tabs help you decide.",
        ].join("\n")
      ),
  },
  {
    id: "predict_tabs",
    hint: "tabs on the pick screen before tip-off: PRO PICK / INFORMATION / TREND — what each shows",
    fast: /(?:予想画面|予想の画面)(?:の)?.{0,6}(?:タブ|information|trend)|information(?:タブ)?(?:って|とは|は何|で何)|TREND(?:タブ)?(?:って|は|の)?(?:どこ|何|なに|見方|みかた)/i,
    open: ["games"],
    answer: (lang) =>
      T(
        lang,
        [
          "試合前の予想画面に3つのタブがあります（最初は INFORMATION。同じタブをもう一度タップで閉じる）:",
          "・PRO PICK: 勝つ確率・予想スコア・得点王の候補（PRO）",
          "・INFORMATION: 両チームの欠場情報と、チームスタッツ（SEASON / LAST 10 の NET・ORTG・DRTG・PACE・勝敗）",
          "・TREND: SCHEDULE（休み・連戦2日目・4日で3試合目の成績）、SITUATION（ホーム / アウェー・相手の強さ別・接戦）、MOMENTUM（連勝・連敗と直近10試合）",
          "試合が始まると、タブの代わりに試合スタッツが出ます。",
        ].join("\n"),
        [
          "Before tip-off the pick screen has three tabs (INFORMATION opens first; tap again to close):",
          "- PRO PICK: win probability, projected score, top-scorer candidates (PRO)",
          "- INFORMATION: both teams' injuries and team stats (SEASON / LAST 10: NET, ORTG, DRTG, PACE, record)",
          "- TREND: SCHEDULE (rest, back-to-backs, 3-in-4s), SITUATION (home / away, by opponent strength, close games), MOMENTUM (streak and last 10)",
          "After tip-off the tabs are replaced by live game stats.",
        ].join("\n")
      ),
  },
  {
    id: "season_predict",
    hint: "season predictions (standings / award predictions) and their rewards",
    fast: /(?:シーズン|順位|アワード)予想(?:の)?(?:やり方|仕方|しかた|どこ|見方|みかた)?|season predict|award predictions?|standings predictions?/i,
    open: ["games"],
    answer: (lang) =>
      T(
        lang,
        `試合一覧のヘッダー左の「アワード予想」「順位予想」から出せます。開幕戦の開始前が締切で、それまでは何度でも直せます。それぞれ別のランキングで、上位20位に Unit が出ます（${rankRuns(SEASON_PREDICT_UNITS_BY_RANK, lang)}）。Unit はシーズンが終わって採点が確定したあとに付きます（週間・月間ランキングの Unit とは別）。同点は最後に提出した時刻が早い人が上です。`,
        `Open "Award Predictions" or "Standings Predictions" at the top left of the games list. They lock at the season's first tip-off and can be edited until then. Each has its own ranking; the top 20 get Units (${rankRuns(SEASON_PREDICT_UNITS_BY_RANK, lang)}). Units are given after the season ends and results are final (separate from weekly / monthly ranking Units). Ties go to the earlier final submission.`
      ),
  },
  {
    id: "postponed",
    hint: "postponed / cancelled games: what happens to picks and points",
    fast: /延期|中止|順延|postpone|cancell?ed game/i,
    open: ["games"],
    answer: (lang) =>
      T(
        lang,
        "採点は試合が終わったときだけ行います。延期や中止で行われなかった試合はポイントが付かず、外れにもならないので、連勝も切れません。",
        "Picks are scored only when the game ends. A postponed or cancelled game gives no points and doesn't count as a miss, so it won't break your streak."
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
        "予想は試合開始時刻まで、何度でも変更・削除できます。採点は締切の時点で残っている最後の予想で行い、途中で直しても点は減りません。開始時刻を過ぎるか試合が始まると、変更も削除もできなくなります。締切が近い未予想の試合は通知でお知らせします（通知設定で何分前かを選べます）。",
        "You can edit or delete a pick until tip-off. Only your last pick at the deadline is scored; editing costs nothing. Once the game starts it locks. A reminder before the deadline for unpicked games can be set in notification settings."
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
        `PICK UP は運営が選んだ注目試合で、PICK UP ランキングはその試合だけで競います（誰でも参加・Unit の対象）。PICK UP の試合だけ予想していれば PICK UP ランキングに載ります（勝率ランキングだけは PICK UP 試合の ${pct(PERIOD_WIN_RATE_PICKUP_PARTICIPATION_RATE)} 以上の予想が必要）。PRO LEAGUE はすべての試合で競う PRO 会員だけのランキングです。試合カードの PICK UP 表示で見分けられます。`,
        `PICK UP games are featured games; the PICK UP ranking counts only those (open to everyone, and it pays Units). Picking only PICK UP games is enough to appear on it (the win-rate ranking alone needs picks on ${pct(PERIOD_WIN_RATE_PICKUP_PARTICIPATION_RATE)}+ of PICK UP games). PRO LEAGUE counts every game and lists PRO members only. Look for the PICK UP label on game cards.`
      ),
  },
  {
    id: "ranking",
    hint: "how the rankings work / where they are / when they update",
    fast: /^(?!.*VALUE).*(?:ランキング(?:の|は|って)?(?:見方|みかた|仕組み|更新|ルール|どこ)|ランキング(?:って|とは|はいつ更新))|where (?:is|are) (?:the )?rankings?|how (?:do|does) (?:the )?rankings? work/i,
    open: ["rankings"],
    answer: (lang) =>
      T(
        lang,
        "下タブの RANKING で見られます。上で Pick Up / PRO LEAGUE、Season / Weekly / Monthly を切り替え、指標はスコア・最多得点者的中・アップセット・勝率です。全体ランキングは毎日日本時間16時に更新されます。右端の MENU からプレーオフとスクワッドバトルにも行けます。",
        "Open the RANKING tab. Switch Pick Up / PRO LEAGUE and Season / Weekly / Monthly at the top; metrics are score, top-scorer hits, upset, and win rate. Global rankings update daily at 16:00 JST. The MENU on the right edge leads to Playoffs and Squad Battle."
      ),
  },
  {
    id: "ranking_periods",
    hint: "weekly vs monthly vs season rankings: when each period starts / resets, joining mid-period, when ranking Units are paid",
    fast: /(?:週間|weekly).{0,14}(?:月間|monthly).{0,10}(?:違い|ちがい|差|difference)|(?:週間|月間)(?:ランキング)?(?:は|って)?.{0,6}(?:いつから|いつまで|何曜|期間|区切り|リセット|締め)|途中(?:から|参加).{0,16}(?:ランキング|1位|一位|間に合|不利|狙え|勝て)|unit.{0,10}(?:いつ|何時).{0,6}(?:もらえ|付与|入る)/i,
    open: ["rankings"],
    answer: (lang) =>
      T(
        lang,
        [
          "・週間: 月曜〜日曜。月間: 1日〜月末（どちらも米国東部の日付）。Season: シーズンの累計",
          "・スコアのランキングは期間中のポイントの合計です。予想した試合が多いほど有利で、外しても減りません",
          "・画面に出す週間・月間は、次の期間の最初の試合日の全試合が終わるまで前の期間のままです（空の NO DATA にしないため）。Unit の付与タイミングは変わりません",
          "・順位は期間の最後の日の試合まで終わった時点で決まります。期間が変わると全員0から。途中から始めた期間は残りの試合だけで競いますが、次の週・月からは同じ条件です",
          "・ランキングの Unit は、週間は月曜、月間は毎月1日の日本時間16時過ぎに自動で付きます",
        ].join("\n"),
        [
          "- Weekly: Monday-Sunday. Monthly: 1st to month end (US Eastern dates). Season: the whole season",
          "- Score rankings sum your points in the period, so more picks help; misses never subtract",
          "- The weekly / monthly board keeps showing the previous period until that next period's first game day is fully finished (so it does not flash empty). Unit payout timing is unchanged",
          "- Final standings are set once the period's last day of games is done. Everyone restarts at 0 each period. Joining mid-period means fewer games that period, but the next week / month is a level start",
          "- Ranking Units are paid automatically on Monday (weekly) and the 1st (monthly), just after 16:00 JST",
        ].join("\n")
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
    id: "unit_rules",
    hint: "do Units decrease (missed picks), expire, or reset each season",
    fast: /(?:unit|ユニット).{0,14}(?:減|へる|なくな|消え|有効期限|期限|失効|リセット|没収|引かれ)|(?:units?).{0,10}(?:expire|decrease|reset)/i,
    open: ["unit_ledger"],
    answer: (lang) =>
      T(
        lang,
        `予想を外しても Unit は減りません。Unit が減るのは商品交換に使ったときだけです（申請中は確保され、取り消し・却下なら戻ります）。いまは有効期限もなく、シーズンをまたいでも残ります（変えるときは事前にお知らせします）。交換に使えるのは1シーズン ${REDEMPTION_SEASON_CAP_UNITS} Unit までです。`,
        `Missed picks never cost Units. Units only go down when you redeem them (held while an application is pending, returned if it's cancelled or rejected). They currently don't expire and carry over between seasons (we'll announce any change in advance). Up to ${REDEMPTION_SEASON_CAP_UNITS} Units can be redeemed per season.`
      ),
  },
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
    open: ["rankings", "redeem"],
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
          "Unit はプロフィールのメニュー →「商品交換」で NBA グッズと交換できます。",
        ].join("\n"),
        [
          "Ranking Units (PICK UP score only; not PRO LEAGUE, season, or win rate; ties get the same amount)",
          `Weekly: ${rankRuns(periodUnits("weekly", PERIOD_RANKING_UNIT_OVERALL_METRIC), lang)}`,
          `Monthly: ${rankRuns(periodUnits("monthly", PERIOD_RANKING_UNIT_OVERALL_METRIC), lang)}`,
          `Monthly categories (upset, top scorer, each): ${rankRuns(periodUnits("monthly", dept), lang)}`,
          `The monthly upset category requires a ${pct(PERIOD_UPSET_MIN_WIN_RATE)}+ win rate that month. Also on the RANKING screen's Unit table chip.`,
          "Units can be redeemed for NBA gear from Profile → MENU → Redeem Units.",
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
    fast: /^(?!.*(?:グループ|group|招待コードの(?:見方|みかた|どこ|確認))).*(?:友達.{0,6}招待|紹介コード|invite|referral)|友達を招待/i,
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
    id: "squads_vs_groups",
    hint: "difference between Squad Battle and groups",
    fast: /(?:スクワッド|squad).{0,14}(?:グループ|group).{0,10}(?:違い|ちがい|差|difference)|(?:グループ|group).{0,14}(?:スクワッド|squad).{0,10}(?:違い|ちがい|差|difference)/i,
    open: ["groups", "squads"],
    answer: (lang) =>
      T(
        lang,
        `グループは仲間内のランキングです。いつでも作れて（最大 ${MAX_MEMBERS_PER_GROUP}人）、メンバー同士でポイントを比べるだけで Unit はありません。スクワッドバトルは ${GROUP_BATTLE_MIN_MEMBERS}〜${GROUP_BATTLE_MAX_MEMBERS}人のチームで出る大会で、約2ヶ月に1回の開催期間に、PICK UP 試合のスコア平均でほかのチームと競います。上位チームはメンバー全員に Unit（週間1位 ${GROUP_BATTLE_DEFAULT_WEEKLY_UNITS_PER_MEMBER[0]}・月間1位 ${GROUP_BATTLE_DEFAULT_MONTHLY_UNITS_PER_MEMBER[0]} が目安）。`,
        `A group is a private ranking among friends: create one any time (up to ${MAX_MEMBERS_PER_GROUP} members) and compare points; no Units. Squad Battle is an event for teams of ${GROUP_BATTLE_MIN_MEMBERS}-${GROUP_BATTLE_MAX_MEMBERS}, held about every 2 months, where squads compete on the members' average PICK UP score; top squads earn Units for every member (about ${GROUP_BATTLE_DEFAULT_WEEKLY_UNITS_PER_MEMBER[0]} for weekly #1, ${GROUP_BATTLE_DEFAULT_MONTHLY_UNITS_PER_MEMBER[0]} for monthly #1).`
      ),
  },
  {
    id: "squads",
    hint: "Squad Battle (team competition) and its rewards",
    fast: /スクワッド|squad|(?:バトル|グループバトル)(?:の)?(?:参加|やり方|始め方|入り方)/i,
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
    fast: /グループ(?:を|の|に|って|とは|作|参加|入)|コミュニティ|招待コードの(?:見方|みかた|どこ|確認)|community|communities/i,
    open: ["groups"],
    answer: (lang) =>
      T(
        lang,
        `下タブの GROUP で、仲間内のランキング（グループ）を作ったり参加したりできます。1つのグループに入れるのは最大 ${MAX_MEMBERS_PER_GROUP}人。1人が参加できるグループの数は無料 ${FREE_MAX_MEMBERSHIPS}個・PRO ${PRO_MAX_MEMBERSHIPS}個、作れるグループの数は無料 ${FREE_MAX_OWNED_GROUPS}個・PRO ${PRO_MAX_OWNED_GROUPS}個まで。参加は作った人が共有する8文字の招待コードで行います。招待コードは GROUP タブでそのグループを開くと見られます（作った直後にも表示されます）。`,
        `Use the GROUP tab to create or join private rankings (groups). A group holds up to ${MAX_MEMBERS_PER_GROUP} members. One user can be in up to ${FREE_MAX_MEMBERSHIPS} groups free (${PRO_MAX_MEMBERSHIPS} on PRO) and own up to ${FREE_MAX_OWNED_GROUPS} groups (${PRO_MAX_OWNED_GROUPS} on PRO). Join with the 8-character code the owner shares; open the group in the GROUP tab to see its code (it is also shown right after you create it).`
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
        `チーム詳細・選手詳細の星ボタンでお気に入りに登録できます。お気に入りチームは1つ、選手は無料 ${NBA_FAVORITE_MAX_PLAYERS_FREE}人・PRO ${NBA_FAVORITE_MAX_PLAYERS_PRO}人まで。プロフィールに表示され、お気に入り選手のテクニカルや退場は通知でも届きます。お気に入りチームの試合は試合一覧の先頭に並び、日付の列とカレンダーではその試合がある日にチームカラーの印が付きます。`,
        `Tap the star on a team or player page to favorite it. One favorite team; players: ${NBA_FAVORITE_MAX_PLAYERS_FREE} free, ${NBA_FAVORITE_MAX_PLAYERS_PRO} on PRO. They show on your profile, and favorite players' techs and ejections can notify you. Your favorite team's games come first in the games list, and its game days get a team-color mark on the date strip and calendar.`
      ),
  },
  // ---------------------------------------------------------------- PRO
  {
    id: "pro_cancel_league",
    hint: "what happens to PRO LEAGUE rank / points after cancelling or when PRO expires, and on rejoining PRO",
    fast: /(?:解約|cancel).{0,16}(?:pro\s*league|プロリーグ|ランキング|ポイント|順位|points|ranking)|(?:pro|プロ)(?:が|を|の期限が)?(?:切れ|やめ|失効|expire).{0,16}(?:pro\s*league|プロリーグ|ランキング|ポイント|順位|points|ranking)|(?:pro\s*league|プロリーグ).{0,14}(?:解約|やめ|切れ|cancel)/i,
    open: ["plan_status"],
    answer: (lang) =>
      T(
        lang,
        "解約しても、支払い済みの期間が終わるまでは PRO のままで、PRO LEAGUE にも載ります。期間が切れると、次の更新（毎日日本時間16時）から PRO LEAGUE に出なくなります。ポイントは消えません。PRO LEAGUE はそのとき PRO の人を並べるので、また PRO になれば、無料の間に予想した試合の分も含めて戻ります。PICK UP ランキングは無料でもそのまま続きます。",
        "After cancelling you stay PRO, and on PRO LEAGUE, until the paid period ends. Once it lapses you drop off PRO LEAGUE at the next update (daily, 16:00 JST). Your points are kept: PRO LEAGUE lists whoever is PRO at the time, so rejoining brings you back, including games you picked while free. The PICK UP ranking continues as normal on the free plan."
      ),
  },
  {
    id: "pro_pick_accuracy",
    hint: "PRO PICK accuracy: what the percentages mean and how they are measured",
    fast: /(?:pro\s*pick|プロピック|pro\s*insight)(?:の)?.{0,4}(?:精度|的中率|当たる確率|当たって|accuracy)/i,
    open: ["games"],
    answer: (lang) =>
      T(
        lang,
        [
          `PRO PICK の精度は、今季の終わった試合をその試合より前のデータだけで予想し直した検証と、本番の予想を試合後に採点した結果を合わせて出しています。本番の結果は毎日の採点で足されていきます。`,
          `・勝つチームを当てた割合`,
          `・勝つ確率 ${PREDICT_KIT_RECORD_STRONG_PCT}% 以上と出た試合だけの割合`,
          `・得点王の候補の1番手が、実際に両チーム最多得点だった割合`,
          `精度は予想画面の PRO PICK タブで見られます（無料プランでも見られます）。当たることを保証するものではありません。`,
        ].join("\n"),
        [
          "PRO PICK accuracy combines a test (re-predicting this season's finished games using only data from before each game) with grading the live picks after each game; live results are added daily.",
          "- How often it picked the winner",
          `- The rate on games where the win probability was ${PREDICT_KIT_RECORD_STRONG_PCT}% or more`,
          "- How often the top scorer candidate was actually the game's top scorer",
          "See it in the PRO PICK tab of the pick screen (free users can see it too). It doesn't guarantee a correct pick.",
        ].join("\n")
      ),
  },
  {
    id: "pro_pick",
    hint: "what PRO PICK shows (win probability, projected score, top scorer), when it updates, what free users see",
    fast: /(?:pro\s*pick|プロピック|pro\s*insight)(?:は|って|の|で|が)?.{0,6}(?:何|なに|とは|わかる|分かる|見れ|見られ|どうやって見|いつ|更新)/i,
    open: ["games"],
    answer: (lang) =>
      T(
        lang,
        [
          "PRO PICK は、試合前の予想画面（試合カードをタップ）の PRO PICK タブにある予想の材料です（PRO 向け・プレシーズンは対象外）。",
          "・WINNER: 有利なチームと勝つ確率、予想点差の内訳（実力差〔ガベージタイム抜き・相手補正〕・ホーム・連戦・休養・欠場など）。みんなの予想（20人以上のとき）も並びます",
          "・SCORING: 予想スコアと合計点、リーグ平均よりロースコア寄りかハイスコア寄りか",
          "・TOP SCORER: 両チームで最多得点になる確率が高い選手",
          `・精度: 勝つチームを当てた割合、勝つ確率 ${PREDICT_KIT_RECORD_STRONG_PCT}% 以上の試合だけの割合、得点王の1番手が当たった割合。今季の終わった試合をその試合より前のデータだけで予想し直した検証と、本番の予想の試合後の採点から出しています`,
          "前日の夜に作り、欠場情報が変わると作り直します。更新されるとタブに黄色の点が付き、予想が大きく変わったときは通知も届きます（PRO・通知設定で切り替え）。無料プランでは精度だけ見られ、この試合の中身は PRO で表示されます。当たることを保証するものではありません。",
        ].join("\n"),
        [
          "PRO PICK is the prediction kit in the PRO PICK tab of the pick screen (tap a game card before tip-off). PRO only; not for preseason.",
          "- WINNER: the favored team and its win probability, with the projected margin broken down (team strength [garbage time removed, opponent-adjusted], home, back-to-back, rest, injuries). The crowd pick appears when 20+ people picked",
          "- SCORING: projected score and total, and whether it leans low or high versus the league average",
          "- TOP SCORER: players most likely to be the game's top scorer",
          `- Accuracy: how often it picked the winner, the rate on games at ${PREDICT_KIT_RECORD_STRONG_PCT}%+ win probability, and the top-scorer hit rate. Measured by re-predicting this season's finished games using only data from before each game, plus grading the live picks after each game`,
          "Built the evening before and rebuilt when injury news changes. Updates put a yellow dot on the tab, and a big change sends a notification (PRO; toggle in notification settings). Free users see the accuracy only; the game's kit shows on PRO. It doesn't guarantee a correct pick.",
        ].join("\n")
      ),
  },
  {
    id: "pro_plans",
    hint: "PRO price, plans, free trial, what PRO includes, PRO features like Pro Pick (formerly Pro Insight)",
    fast: /(?:pro|プロ).{0,8}(?:料金|値段|いくら|価格|プラン|トライアル|無料期間|特典|でできる|って何|とは|のメリット)|(?:料金|月額|年額|サブスク|課金)(?:の)?(?:やり方|方法|見方)?|pro ?(?:insight|pick)(?:って|とは)|how much is pro|pro (?:price|plans?)/i,
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
    fast: /このチャット|(?:ask|アスク|ai).{0,6}(?:何回|回数|制限|何が聞|何を聞)|何回(?:聞|質問)|スタッツ(?:の)?質問(?:は|って)?(?:何回|回数|制限)/i,
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
        "プロフィールのメニュー →「通知設定」で切り替えられます。試合結果の確定、予想締切（未予想の試合だけ・30分前）、Unit 付与、お気に入り選手のテクニカル・退場は無料。締切の60分前・10分前、出場ステータスの変更、PRO PICK の更新、週次・月次レポートは PRO です。",
        "Open Profile → MENU → Notifications. Free: game final, pick deadline (unpicked games, 30 min before), Unit rewards, favorite players' techs and ejections. PRO: 60 / 10 min deadline reminders, player status changes, PRO PICK updates, weekly and monthly reports."
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
    hint: "forgot password / reset password / can't log in",
    fast: /パスワード.{0,4}(?:忘れ|わすれ|リセット|再設定|変更|変え|わから)|ログイン(?:でき|出来)ない|サインイン(?:でき|出来)ない|forgot (?:my )?password|reset (?:my )?password|change (?:my )?password|can'?t log ?in/i,
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
    fast: /問い合わせ|問合せ|サポート|ヘルプ|機能リクエスト|要望|不具合|バグ|利用規約|プライバシー(?:ポリシー)?|contact|support|feature request|terms|privacy/i,
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
    id: "games_filter",
    hint: "filtering the games list (one team only, PICK UP only) and the order of games",
    fast: /(?:試合一覧|試合)?(?:の)?(?:絞り込|しぼりこ|フィルター|フィルタ)|(?:チーム|試合)(?:の試合)?(?:だけ|のみ)(?:を)?(?:表示|見せ|出|並べ)|filter (?:the )?games/i,
    open: ["games"],
    answer: (lang) =>
      T(
        lang,
        "試合一覧に絞り込み（特定のチームの試合だけ表示など）はありません。お気に入りチームを登録すると、その試合が一覧の先頭に並び、日付の列とカレンダーにも印が付きます。PICK UP の試合はカードに PICK UP と出ます。",
        "The games list has no filter (e.g. one team only). Set a favorite team and its games come first, with marks on the date strip and calendar. PICK UP games show a PICK UP label on the card."
      ),
  },
  {
    id: "games_calendar",
    hint: "games list calendar and moving between dates (future / past game days, back to today)",
    fast: /カレンダー|(?:先|未来|過去|前|別)の(?:日付|日)に(?:飛|移|行)|calendar/i,
    open: ["games"],
    answer: (lang) =>
      T(
        lang,
        [
          "試合一覧の右上のカレンダーで、先の日も過去の日も選べます（押せるのは試合がある日だけ）。各日に試合数、お気に入りチームの試合日に印が出て、下の「今日」で今日以降の最初の試合日へ戻ります。",
          "ほかに、一覧を左右にスワイプすると前後の試合日へ、月の見出しの ←/→ で前後の月へ移れます。見出しの年月をダブルタップすると今日の試合日に戻ります。",
        ].join("\n"),
        [
          "Use the calendar at the top right of the games list to pick past or future dates (only game days can be tapped). Each day shows its game count, your favorite team's game days are marked, and \"Today\" jumps to the next game day.",
          "You can also swipe the list left / right for the previous / next game day, or use the month header's arrows. Double-tap the month to return to today.",
        ].join("\n")
      ),
  },
  {
    id: "game_stats",
    hint: "box score / live game stats / finished game details: where to see them",
    fast: /ボックススコア|box\s*score|ライブスコア|クォータースコア|試合中(?:の)?スコア|(?:試合|ゲーム)(?:の)?(?:スタッツ|詳細|結果の詳細|スコア)(?:は|って|を|が)?(?:どこ|見たい|見れ|見られ|どうやって|見方)/i,
    open: ["games"],
    answer: (lang) =>
      T(
        lang,
        [
          "試合が始まったら、試合一覧でその試合のカードをタップすると、試合スタッツ（Score by Quarter・Team Stats・Game Leaders・Box Score）が見られます。試合中も見られます。",
          "自分が予想した終わった試合は、タップするとリザルト詳細が開き、上の STATS タブに同じスタッツ、UNITERZ タブにポイントの内訳があります。選手名・チーム名をタップで詳細へ。チーム詳細の GAMES の試合ログの行からも開けます。",
          "スコアを見たくないときは、表示設定でライブ・試合後のスコアを隠せます。",
        ].join("\n"),
        [
          "Once a game starts, tap its card in the games list for game stats (Score by Quarter, Team Stats, Game Leaders, Box Score), live as well.",
          "For finished games you picked, the card opens the result detail: STATS has the same stats and UNITERZ has your point breakdown. Tap a player or team for its page. A team page's GAMES log rows open box scores too.",
          "To avoid spoilers, hide live / final scores in display settings.",
        ].join("\n")
      ),
  },
  {
    id: "crowd_picks",
    hint: "the crowd pick split (what percent picked each team): where it is and when it shows",
    fast: /みんなの予想|予想人数|(?:予想|ピック)(?:の)?(?:割合|比率|分布)|何(?:人|％|%)(?:が|が勝つと)?予想|crowd picks?|pick (?:counts?|split|distribution)/i,
    open: ["games"],
    answer: (lang) =>
      T(
        lang,
        "みんなの予想は、予想画面（試合カードをタップ）の上のマッチカードの下に、両チームを選んだ割合のバーと総予想数で出ます。予想する前も後も、試合開始後も見られます。割合だけで、誰がどちらを選んだかは出ません。",
        "The crowd pick shows on the pick screen (tap a game card), under the match card: a bar with each team's share and the total number of picks. It's visible before and after you pick, and after tip-off. Only percentages; it doesn't show who picked what."
      ),
  },
  {
    id: "others_picks",
    hint: "seeing other users' picks / who can see my pick",
    fast: /(?:他の人|ほかの人|他人|友達|友だち|フレンド|上位の人|ランカー)(?:の|が)?(?:予想|ピック)(?:を|が|は)?(?:見|確認|わか)|(?:自分の)?予想(?:は|って|が)?(?:他の人|ほかの人|みんな)に(?:見え|見られ|バレ)|see (?:other (?:users'?|people'?s)|friends'?) picks/i,
    open: ["rankings"],
    answer: (lang) =>
      T(
        lang,
        "ほかの人の予想は、試合開始後にランキングでその人をタップしてプロフィールを開くと、決着した予想が見られます。自分の予想も試合が始まるまでほかの人には見えません。試合ごとの「みんなの予想」は割合だけで、誰がどちらを選んだかは出ません。",
        "To see someone's picks, tap them on a ranking after tip-off to open their profile and see their settled picks. Your own pick is hidden from others until tip-off. A game's crowd view only shows percentages, not who picked what."
      ),
  },
  {
    id: "compare",
    hint: "comparing two players or teams side by side",
    fast: /(?:選手|チーム)(?:同士|どうし)?(?:を|の)?(?:比較|比べ)(?:でき|られ|れる|たい|する)|compare (?:two )?(?:players|teams)/i,
    open: ["standings"],
    answer: (lang) =>
      T(
        lang,
        "選手は、STANDING → LEAGUE → PLAYER → STYLE のスタイルマップで1人目の点をタップしたあと2人目をタップすると、今季のスタッツを左右に並べて比べられます（検索で選手を図に足せます）。このチャットでも「レブロンとカリーを比べて」「レイカーズとセルティックスを比べて」のように聞けます。",
        "For players, open STANDING → LEAGUE → PLAYER → STYLE, tap one dot on the style map, then another, to see this season's stats side by side (search adds players to the map). You can also ask here, e.g. \"compare LeBron and Curry\" or \"compare the Lakers and Celtics\"."
      ),
  },
  {
    id: "injuries_where",
    hint: "where to see injury / availability information in the app",
    fast: /(?:(?:ケガ|怪我|けが)(?:人|情報)?|負傷者|欠場(?:者|情報)?(?:一覧)?|injur(?:y|ies)|INJURIES?(?:タブ)?)(?:の)?(?:情報|一覧)?(?:は|って|を|が|の)?(?:どこ|見たい|見れ|見られ|見方|みかた)/i,
    open: ["games"],
    answer: (lang) =>
      T(
        lang,
        "欠場情報は、予想画面（試合前）の INFORMATION タブ、チーム詳細の TEAM タブの INJURIES、選手詳細の OVERVIEW の出場可否で見られます。このチャットでも「レイカーズのケガ人」「今日の欠場者」のように聞けます。",
        "Injury info is in the INFORMATION tab of the pick screen (before tip-off), INJURIES on a team page's TEAM tab, and availability on a player page's OVERVIEW. You can also ask here, e.g. \"Lakers injuries\" or \"who's out today\"."
      ),
  },
  {
    id: "share",
    hint: "sharing: ranking card, result card, profile, LEAGUE charts (Instagram / X / LINE)",
    fast: /共有|シェア|インスタ|instagram|ストーリー|(?:x|twitter|ツイッター|line)に(?:載せ|投稿|送)|share/i,
    answer: (lang) =>
      T(
        lang,
        [
          "共有は画像（PNG）で、スマホの共有画面から Instagram・X・LINE などに送れます。",
          "・順位カード: RANKING の自分の順位カードの共有ボタン（PRO のとき）",
          "・リザルトカード: RESULT のカード左下の角のメニュー → 共有",
          "・LEAGUE の図: スタイルマップ・ラダー・TOP PERFORMANCES などの見出し右の共有アイコン",
          "・プロフィール: プロフィールの「ID」をタップで、プロフィールのリンクを共有",
        ].join("\n"),
        [
          "Shares are images (PNG) sent through your phone's share sheet to Instagram, X, LINE, etc.",
          "- Ranking card: the share button on your rank card in RANKING (PRO)",
          "- Result card: the corner menu at the bottom left of a card in RESULT → Share",
          "- LEAGUE charts: the share icon next to the style map, ladders, top performances, etc.",
          "- Profile: tap your ID on the profile to share your profile link",
        ].join("\n")
      ),
  },
  {
    id: "nav_stats",
    hint: "where team / player league stats tables are",
    fast: /^(?!.*(?:今日|TODAY|today)).*(?:スタッツ(?:画面|表)?|成績(?:表)?)(?:は|って|が|を|の)?(?:どこ|どうやって見|見たい|どこで見|見方|みかた)|where (?:are|can i see) (?:the )?(?:team |player )?stats/i,
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
    fast: /(?:順位表|STANDING(?:タブ)?)(?:は|って)?(?:どこ|見たい|どうやって|見方|みかた)|where (?:are|is) (?:the )?standings/i,
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
    fast: /league\s*(?:タブ|tab)|(?:LEAGUE|リーグ)タブ(?:は|って)?(?:どこ|何)|(?:mvp|dpoy|mip|新人王|シックスマン)?(?:ラダー|ladder)(?:の|は|って)?(?:見方|みかた|どこ|どこで見|どうやって見|どうやってみ)|VALUE(?:ランキング)?(?:は|の)?(?:どこ|見方)/i,
    open: ["standings"],
    answer: (lang) =>
      T(
        lang,
        [
          "試合一覧の右端 STANDING → 上の LEAGUE タブ → PLAYER → LADDER です（今季だけ）。",
          "LADDER の中で MVP / ROOKIE / DPOY / SIXTH MAN / MIP を切り替えられます。",
          "同じ LEAGUE タブに、週間トップパフォーマンス・好調 / 不調・通算の節目・スタイルマップもあります。",
        ].join("\n"),
        [
          "Right edge STANDING → LEAGUE → PLAYER → LADDER (this season only).",
          "Switch MVP / ROOKIE / DPOY / SIXTH MAN / MIP inside LADDER.",
          "The same LEAGUE tab also has top performances, hot / cold, milestones, and style maps.",
        ].join("\n")
      ),
  },
  {
    id: "style_map",
    hint: "how to open / read / use the STYLE MAP (player and team scatter charts in the LEAGUE tab)",
    fast: /(?:スタイルマップ|style\s*map)(?:は|って|の|を)?(?:どこ|どうやって|どう(?:見|使)|見方|見かた|使い方|とは|って何|ってなに|何|なに)/i,
    open: ["standings"],
    answer: (lang) =>
      T(
        lang,
        [
          "試合一覧の右端 STANDING → 上の LEAGUE タブ → PLAYER か TEAM → STYLE にあります（今季だけ）。",
          "・横軸と縦軸の 2 つのスタッツで選手（チーム）を並べた図です。図の上の一文が軸の読み方です",
          "・四隅（右上・左上・右下・左下）の言葉の意味: 図の真ん中の 2 本の線は、図に出ている選手（チーム）の平均です。四隅の言葉は、その線で 4 つに分けた区画に入る選手（チーム）のタイプ名です。右上は横軸も縦軸も平均より良い側、左下はどちらも平均より悪い側です（失点や被 FG% のように低いほど良い軸は、低い値ほど右・上に来ます）。例えば「3P の量と質」の図なら、右上 = エリートシューター（多く打ってよく入る）、左上 = セレクティブシューター（少なめでよく入る）、右下 = ボリュームシューター（多く打つが確率は平均以下）、左下 = 不調",
          "・PLAYER: 上の段で SCORING / ATTACK / DEFENSE / BALL / IMPACT / REB を選び、下の段で図を切り替えます。G / F / C の絞り込み、TOP 30 / 50、検索で選手を図に追加できます",
          "・点をタップするとその選手の数字と順位・似たスタイルの選手が出て、もう 1 人タップすると 2 人を比較できます。名前をタップで選手詳細",
          "・TEAM: PLAY STYLE（OVERALL / OFFENSE / PLAY TYPE / DEFENSE）と ROSTER の図で 30 チームを並べます。四角をタップでそのチームの数字",
        ].join("\n"),
        [
          "Right edge STANDING → LEAGUE tab → PLAYER or TEAM → STYLE (this season only).",
          "- Each map plots players (or teams) on two stats. The line above the map explains the axes",
          "- What the four corner words (top right, top left, bottom right, bottom left) mean: the two center lines are the average of everyone on the map, and each corner word names the style of the players (teams) in that area. Top right = the better side of average on both axes, bottom left = the worse side on both (for lower-is-better stats such as points allowed or opponent FG%, lower values sit right / up). On the 3PT map: top right = ELITE SHOOTER (many attempts, high %), top left = SELECTIVE SHOOTER, bottom right = VOLUME SHOOTER (many attempts, below-average %), bottom left = COLD",
          "- PLAYER: pick SCORING / ATTACK / DEFENSE / BALL / IMPACT / REB on the top row and the map on the second row. Filter G / F / C, switch TOP 30 / 50, or search to add a player",
          "- Tap a dot for the player's numbers, ranks, and similar players; tap another to compare the two. Tap the name for the player page",
          "- TEAM: PLAY STYLE (OVERALL / OFFENSE / PLAY TYPE / DEFENSE) and ROSTER maps of all 30 teams. Tap a square for that team's numbers",
        ].join("\n")
      ),
    short: (lang) =>
      T(
        lang,
        "STANDING → LEAGUE → PLAYER か TEAM → STYLE。点（四角）をタップで数字、もう 1 人タップで比較です。",
        "STANDING → LEAGUE → PLAYER or TEAM → STYLE. Tap a dot (square) for numbers, tap another to compare."
      ),
  },
  {
    id: "league_hub_player_tabs",
    hint: "LEAGUE tab → PLAYER sections: STYLE, ZONE, LADDER, TREND, ON/OFF — what each shows",
    fast: /(?:zone|ladder|on\s*\/?\s*off)(?:タブ|画面)(?:は|って|には|で)?(?:何|なに|どこ)|(?:ゾーン|ラダー|オンオフ)タブ(?:は|って|には|で)?(?:何|なに|どこ)/i,
    open: ["standings"],
    answer: (lang) =>
      T(
        lang,
        [
          "STANDING → LEAGUE → PLAYER の上のタブ（今季だけ）:",
          "・STYLE: 選手のスタイルマップ（散布図）",
          "・ZONE: コートのエリアごとのシュート成功率トップ。コートをタップでエリア切り替え、名前で選手詳細",
          "・LADDER: MVP / ROOKIE / DPOY / SIXTH MAN / MIP の UNITERZ の試算ランキング（公式の投票とは別物）。先週からの順位の上下も出ます",
          "・TREND: 週間 TOP PERFORMANCES（1試合の Game Score 順）、HOT / COLD（直近5試合とそれより前の平均得点の差）、ホーム / アウェー・連戦2日目の得点差、SEASON HIGHS、連続記録と回数（20点以上連続・ダブルダブルなど）、VALUE（年俸の順位と働きの順位の差）、MILESTONE WATCH（通算の節目まであと少しの選手）",
          "・ON/OFF: コートにいるときといないときの得失点の差（オン100分・オフ50分以上の上位10人）",
        ].join("\n"),
        [
          "STANDING → LEAGUE → PLAYER tabs (this season only):",
          "- STYLE: player style maps (scatter charts)",
          "- ZONE: top shooters by court zone. Tap the court to switch zones, a name for the player",
          "- LADDER: UNITERZ's MVP / ROOKIE / DPOY / SIXTH MAN / MIP estimates (not the official vote), with moves since last week",
          "- TREND: top performances of the week (single-game Game Score), HOT / COLD (last 5 games vs before), home / away and back-to-back scoring gaps, season highs, streaks and counts (20+ points, double-doubles…), VALUE (salary rank vs production rank), and MILESTONE WATCH (players close to career milestones)",
          "- ON/OFF: point differential with the player on vs off the court (100+ on / 50+ off minutes, top 10)",
        ].join("\n")
      ),
  },
  {
    id: "award_ladders",
    hint: "how the LADDER (MVP / rookie / DPOY / sixth man / MIP) rankings are calculated",
    fast: /^(?!.*どうやってみ).*(?:(?:ladder|ラダー)(?:の)?.{0,10}(?:どうやって決め|どうやって計算|決め|計算|基準|仕組み)|(?:mvp|dpoy|mip|新人王|シックスマン)(?:ラダー|ladder)?(?:は|って|の順位は)?(?:どうやって決め|どう決め|計算|基準))/i,
    open: ["standings"],
    answer: (lang) =>
      T(
        lang,
        [
          "LADDER は UNITERZ の試算で、公式の投票とは別物です（STANDING → LEAGUE → PLAYER → LADDER）。",
          "・MVP: 65試合ルール（20分以上の出場）にまだ届く選手を、個人の貢献度（PIE）5割・効率込みの得点2割・チームの勝率3割",
          "・ROOKIE: 前季までに NBA の試合に出ていない選手を、Game Score の平均6割・PIE 2割・総出場時間2割（チーム試合の半分以上・平均12分以上）",
          "・DPOY: 65試合ルールにまだ届く選手を、出場中の失点ペース（DRtg）3割・STL+BLK 2.5割・ディフレクション+シュートチェック2割・マークした相手の FG% 1.5割・DREB 1割",
          "・SIXTH MAN: 65試合ルールにまだ届き、先発よりベンチ出場が多い選手を、ベンチ出場時の Game Score 平均5割・効率込みの得点3割・PIE 2割",
          "・MIP: 前季20試合以上・前季平均25点未満で65試合ルールにまだ届く選手の伸び。得点の増分3割・得点の伸び率2割・PIE の増分3割・出場時間の増分2割",
        ].join("\n"),
        [
          "LADDER is UNITERZ's estimate, not the official vote (STANDING → LEAGUE → PLAYER → LADDER).",
          "- MVP: players still able to meet the 65-game rule (20+ minutes), weighted PIE 50%, efficiency-adjusted scoring 20%, team win rate 30%",
          "- ROOKIE: players with no NBA games before this season; average Game Score 60%, PIE 20%, total minutes 20% (half the team's games and 12+ minutes a game)",
          "- DPOY: 65-game-rule eligible; on-court DRtg 30%, STL+BLK 25%, deflections + contests 20%, opponent FG% when guarding 15%, DREB 10%",
          "- SIXTH MAN: 65-game-rule eligible and more bench than starting games; bench Game Score 50%, efficiency-adjusted scoring 30%, PIE 20%",
          "- MIP: 20+ games and under 25 points a game last season, 65-game-rule eligible; points gain 30%, points growth rate 20%, PIE gain 30%, minutes gain 20%",
        ].join("\n")
      ),
  },
  {
    id: "league_hub_team_tabs",
    hint: "LEAGUE tab → TEAM sections: STYLE, SCORING, FORM, DEFENSE, LINEUP — what each shows",
    fast: /(?:scoring mix|form & splits|allowed by position)|league.{0,6}team.{0,6}(?:タブ|tab)/i,
    open: ["standings"],
    answer: (lang) =>
      T(
        lang,
        [
          "STANDING → LEAGUE → TEAM の上のタブ（今季だけ）:",
          "・STYLE: チームのスタイルマップ（PLAY STYLE と ROSTER）",
          "・SCORING: 得点（失点）のうち 3P・ペイント・ミドル・フリースローが占める割合",
          "・FORM: 連勝・連敗と状況別の勝敗（5点差以内・連戦2日目・4日で3試合目・勝率5割以上の相手・ホーム / アウェー・東 / 西）、日程の厳しさ（当たった相手と残りの相手の勝率の平均）、UNITERZ PICKS（みんなの予想から出した予想の勝ち数と実際の差）",
          "・DEFENSE: 相手のガード・フォワード・センターに1試合で取られた得点・リバウンド・アシスト・3P",
          "・LINEUP: 5人組のネットレーティングのリーグ上位",
        ].join("\n"),
        [
          "STANDING → LEAGUE → TEAM tabs (this season only):",
          "- STYLE: team style maps (PLAY STYLE and ROSTER)",
          "- SCORING: share of points (scored / allowed) from 3s, the paint, midrange, and free throws",
          "- FORM: streaks and situational records (games within 5, back-to-backs, 3 in 4 nights, vs .500+ teams, home / away, East / West), strength of schedule (played and remaining), and UNITERZ PICKS (expected wins from the crowd's picks vs actual)",
          "- DEFENSE: points, rebounds, assists, and 3s allowed per game to guards, forwards, and centers",
          "- LINEUP: the league's best five-man lineups by net rating",
        ].join("\n")
      ),
  },
  {
    id: "playoffs_view",
    hint: "playoff bracket / playoff picture / play-in: what the app shows",
    fast: /(?:トーナメント表|ブラケット|組み合わせ表|bracket)|(?:プレーオフ|playoff)(?:の)?(?:組み合わせ|表|picture|進出圏)|(?:プレーオフ|プレーイン)(?:進出)?圏(?:って|は|の)?(?:どこ|どう|わかる|見方|みかた)|プレーイン(?:圏)?(?:って|は|の)?(?:どこ|どう|わかる|見方|みかた)/i,
    open: ["standings"],
    answer: (lang) =>
      T(
        lang,
        "今のアプリにプレーオフの組み合わせ表（トーナメント表）はありません。順位表（試合一覧の右端 STANDING）では 1〜6位が緑、7〜10位（プレーイン圏）が黄、11位以下が赤で、6位と7位・10位と11位の間に区切り線があります。プレーオフの試合も予想でき、RANKING の MENU → PLAYOFFS にプレーオフのランキングがあります。",
        "The app has no playoff bracket right now. In the standings (STANDING on the right edge of the games list), seeds 1-6 are green, 7-10 (play-in) yellow, 11+ red, with lines after 6th and 10th. Playoff games can be picked, and RANKING → MENU → PLAYOFFS has the playoff ranking."
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
    id: "nav_team_payroll",
    hint: "how to view team salary / payroll / cap / draft picks in the app",
    fast: /^(?!.*選手).*(?:チーム|球団)?(?:の)?(?:サラリー|年俸|ペイロール|payroll|給料)(?:総額|一覧)?(?:の|って|は)?(?:見方|みかた|見かた|どこ|どうやって|見れる|見られる|開き方)|(?:年俸総額|サラリーキャップ|キャップ|ぜいたく税|贅沢税|ドラフト指名権)(?:の|って|は)?(?:見方|みかた|どこ|どうやって|見れる)|OFFICE(?:タブ)?.*(?:年俸|サラリー|ペイロール|指名権)|(?:where|how).{0,12}(?:team )?(?:payroll|salary|cap|draft picks?)/i,
    open: ["stats"],
    answer: (lang) =>
      T(
        lang,
        "チームのサラリー（年俸総額・キャップ・エプロン）とドラフト指名権は、チーム詳細の OFFICE タブにあります。STATS や STANDING、予想画面の STATS からチームを開いて OFFICE を選んでください。選手ひとりの契約・年俸は選手詳細の CONTRACT タブです。",
        "Team salary (payroll, cap, aprons) and draft picks are on the team's OFFICE tab. Open a team from STATS, STANDING, or the pick screen's STATS tab, then choose OFFICE. A single player's contract / salary is on the player's CONTRACT tab."
      ),
  },
  {
    id: "nav_player_contract",
    hint: "how to view a player's contract / salary in the app",
    fast: /選手(?:の)?(?:契約|年俸|サラリー|給料)(?:年数)?(?:の|って|は)?(?:見方|みかた|どこ|どうやって|見れる|見られる)|契約(?:の)?(?:見方|みかた|どこ|どうやって)|CONTRACT(?:タブ)?(?:は|って)?(?:どこ|何)|(?:where|how).{0,12}(?:player )?(?:contract|salary)/i,
    open: ["stats"],
    answer: (lang) =>
      T(
        lang,
        "選手の契約・今季年俸・FA は、選手詳細の CONTRACT タブにあります。STATS の PLAYER や検索、チーム詳細のロスターから選手を開いてください。チーム全体の年俸総額はチーム詳細の OFFICE タブです。",
        "A player's contract, this season's salary, and free agency are on the player's CONTRACT tab. Open a player from STATS (PLAYER or search) or a team roster. Team payroll totals are on the team's OFFICE tab."
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
    fast: /today(?:'s)? leaders|today(?:タブ|画面)?(?:の)?(?:見方|みかた|どこ)?|今日のリーダー(?:は|って)?(?:どこ|見たい)?|今日の(?:スタッツ)?リーダー/i,
    open: ["today"],
    answer: (lang) =>
      T(
        lang,
        "試合一覧の右端 TODAY に、その日の NBA スタッツリーダー（得点・リバウンドなど）と、UNITERZ の今日のスコアリーダー（PICK UP / PRO LEAGUE・上位50人）があります。UNITERZ タブの MY RANK は、その試合日の自分の順位（N位 / 何人中）・予想数と的中数・合計ポイントです（その日に終わった試合があるとき。PRO LEAGUE は PRO のみ）。UNITERZ に新しい結果があると TODAY に黄色の点が付きます。",
        "TODAY on the right edge of the games list shows the day's NBA stat leaders and UNITERZ score leaders (PICK UP / PRO LEAGUE, top 50). MY RANK in the UNITERZ tab shows your rank that game day (N of M), picks and hits, and total points (once a game has finished that day; PRO LEAGUE is PRO only). A yellow dot on TODAY means new UNITERZ results."
      ),
  },
  {
    id: "team_detail_tabs",
    hint: "team detail page tabs: TEAM / GAMES / ROSTER / LINEUP / OFFICE and sections like SPLITS, EDGE, PERFORMANCE METRICS",
    fast: /チーム詳細(?:の)?(?:タブ|画面)?(?:は|って|には|で)?(?:何が見|何がある|なにがある)/i,
    open: ["stats"],
    answer: (lang) =>
      T(
        lang,
        [
          "チーム詳細のタブ:",
          "・TEAM: 概要・ケガ人・PERFORMANCE METRICS（攻撃 / 守備の効率、NET の全時間 / ガベージ抜き / 相手補正 / 直近10試合）・ポジション別失点・HOW THEY PLAY（プレーの特徴）・SPLITS・EDGE（得意な形 / 苦手な形の勝敗）・ON / OFF",
          "・GAMES: 直近10試合の流れ、試合ログ（行をタップで試合スタッツ）、直接対決、日程の厳しさ",
          "・ROSTER: ロスター、オフシーズンの IN / OUT、DISCIPLINE（テクニカル・罰金など）",
          "・LINEUP: 2〜5人の組み合わせの成績",
          "・OFFICE: 年俸総額（キャップ・エプロン）・ドラフト指名権・球団情報",
          "SPLITS は状況別の成績です: ホーム / アウェー、対東 / 対西、勝率5割以上 / 未満の相手、連戦2日目・4日で3試合目の勝敗と、それぞれの1試合平均スタッツ。",
        ].join("\n"),
        [
          "Team page tabs:",
          "- TEAM: summary, injuries, PERFORMANCE METRICS (offense / defense ratings; NET all minutes / garbage time removed / opponent-adjusted / last 10), points allowed by position, HOW THEY PLAY, SPLITS, EDGE (records in favorable / unfavorable game shapes), ON / OFF",
          "- GAMES: last-10 form, game logs (tap a row for the box score), head-to-head, schedule strength",
          "- ROSTER: roster, offseason IN / OUT, DISCIPLINE (techs, fines…)",
          "- LINEUP: two- to five-man lineup results",
          "- OFFICE: payroll (cap, aprons), draft picks, franchise info",
          "SPLITS are situational records: home / away, vs East / West, vs .500+ / sub-.500 teams, back-to-backs and 3-in-4s, each with per-game averages.",
        ].join("\n")
      ),
  },
  {
    id: "player_detail_tabs",
    hint: "player detail page tabs: OVERVIEW / GAMES / CAREER / CONTRACT and what each has",
    fast: /選手詳細(?:の)?(?:タブ|画面)?(?:は|って|には|で)?(?:何が見|何がある|なにがある)/i,
    open: ["stats"],
    answer: (lang) =>
      T(
        lang,
        [
          "選手詳細のタブ:",
          "・OVERVIEW: 出場可否・シーズン平均・次の試合・HOW THEY PLAY（プレーの特徴）・マッチアップ・ON / OFF・シュートチャート・安定感",
          "・GAMES: 直近20試合の推移・試合ログ・SPLITS（連戦2日目・4日で3試合目・相手の強さ別など）・シーズン最高・HIT RATE",
          "HIT RATE は、得点・リバウンド・アシスト・3P成功数がそれぞれ基準（例: 20点以上、10リバウンド以上）に届いた試合が、今季と直近10試合で何試合中何試合あったかです。基準は今季平均に近い値を各項目2つまで（今季一度も届いていない基準は出さない）。",
          "・CAREER: 年ごとの平均（レギュラー / プレーオフ）・受賞・経歴",
          "・CONTRACT: 契約（今季年俸・残り・総額・FA）と DISCIPLINE（テクニカル・罰金など）",
        ].join("\n"),
        [
          "Player page tabs:",
          "- OVERVIEW: availability, season averages, next game, HOW THEY PLAY, matchups, ON / OFF, shot chart, consistency",
          "- GAMES: last-20 trend, game logs, SPLITS (back-to-backs, 3-in-4s, opponent strength…), season highs, HIT RATE",
          "HIT RATE shows how many games (this season and last 10) the player reached a line in points, rebounds, assists, and 3s made (e.g. 20+ points, 10+ rebounds). Up to two lines per stat near the season average; lines never reached this season aren't shown.",
          "- CAREER: season-by-season averages (regular / playoffs), awards, background",
          "- CONTRACT: contract (this season's salary, years left, total, free agency) and DISCIPLINE (techs, fines…)",
        ].join("\n")
      ),
  },
  {
    id: "discipline",
    hint: "technical fouls / flagrants / ejections / suspensions / fines: where to see them and how fines are calculated",
    fast: /(?:テクニカル|フラグラント|退場|出場停止|罰金|discipline|technical fouls?)(?:の)?(?:数|回数)?(?:は|って|を|が)?(?:どこ|見たい|見れ|見られ)/i,
    open: ["stats"],
    answer: (lang) =>
      T(
        lang,
        [
          "テクニカル（TECH）・フラグラント（FLAG）・退場（EJECT）・出場停止（SUSP）・罰金（FINES）は、STATS の表の左の DISCIPLINE、チーム詳細の ROSTER タブ、選手詳細の CONTRACT タブで見られます（シーズン累計とリーグ順位）。",
          "・テクニカル・フラグラント・退場は試合記録から数えます（コーチは除く・リーグが取り消した分は引く・プレーインは数えない）",
          "・罰金は、テクニカル・退場の NBA 規定額、出場停止で失った年俸（労使協定の日割り）、リーグが発表した罰金の合計です",
        ].join("\n"),
        [
          "Techs (TECH), flagrants (FLAG), ejections (EJECT), suspensions (SUSP), and fines (FINES) are under DISCIPLINE on the left of the STATS tables, the ROSTER tab of a team page, and the CONTRACT tab of a player page (season totals and league ranks).",
          "- Techs, flagrants, and ejections are counted from game records (coaches excluded, rescinded ones removed, play-in not counted)",
          "- Fines add up the NBA's set amounts for techs and ejections, salary lost to suspensions (per the CBA), and fines the league announced",
        ].join("\n")
      ),
  },
  {
    id: "clean_ratings",
    hint: "what garbage time removed / CLN NET / CLN ORTG / CLN DRTG / ADJ NET / L10 NET mean",
    fast: /(?:ガベージ(?:タイム)?(?:抜き)?|garbage time|cln(?:\s*(?:net|ortg|drtg))?|adj\s*net|l10\s*net|相手補正)(?:レーティング)?(?:って|とは|の意味|はどういう|の定義|の見方|みかた|はどこ|どこで見)|what (?:is|does) (?:garbage time|cln|adj net)/i,
    open: ["stats"],
    answer: (lang) =>
      T(
        lang,
        [
          "CLN はガベージタイム（大差がついた終盤）を除いた値です。",
          "・ガベージタイム: 4Q の残り12〜9分で25点差以上、9〜6分で20点差以上、6分〜で10点差以上の時間（延長は含めない。点差が縮めば戻る）",
          "・CLN NET / ORTG / DRTG: ガベージタイム抜きの得失点差 / 攻撃効率 / 守備効率（100ポゼッションあたり）",
          "・ADJ NET: ガベージ抜きの NET を、対戦相手の強さとホーム / アウェーで補正した値",
          "・L10 NET: 直近10試合のガベージ抜きの NET",
          "STATS のチーム表の RATINGS とチーム詳細の PERFORMANCE METRICS にあります（公式の ORTG / DRTG / NET は BASIC）。",
        ].join("\n"),
        [
          "CLN means garbage time (late blowout minutes) removed.",
          "- Garbage time: in the 4th quarter, a 25+ point margin with 12-9 minutes left, 20+ with 9-6, 10+ with under 6 (not in overtime; it ends if the margin shrinks)",
          "- CLN NET / ORTG / DRTG: net, offensive, and defensive rating per 100 possessions without garbage time",
          "- ADJ NET: clean NET adjusted for opponent strength and home / away",
          "- L10 NET: clean NET over the last 10 games",
          "Find them under RATINGS in the STATS team table and in PERFORMANCE METRICS on team pages (official ORTG / DRTG / NET are under BASIC).",
        ].join("\n")
      ),
  },
  {
    id: "tutorial",
    hint: "replay the tutorial",
    fast: /チュートリアル|tutorial/i,
    open: ["profile"],
    answer: (lang) =>
      T(
        lang,
        "チュートリアルはプロフィールの右端の MENU →「サポート」の「チュートリアル」から、もう一度最初から見られます。",
        "Replay the tutorial from Profile → MENU (right edge) → Support → Tutorial."
      ),
  },
  {
    id: "nav_results",
    hint: "where to see my past picks and their results",
    fast: /(?:自分の|過去の)?予想(?:の)?(?:結果|履歴)(?:は|って|を|が)?(?:どこ|見たい|見れ|確認)|リザルト(?:の)?(?:見方|みかた|どこ)|結果画面(?:は|って)?(?:どこ|見方)|(?:my )?(?:pick|prediction) (?:history|results)/i,
    open: ["results"],
    answer: (lang) =>
      T(
        lang,
        "自分の予想の結果と履歴は、下タブの RESULT で見られます。タップするとその試合の詳細（スコア・得点内訳）が開きます。",
        "Your picks and results are in the RESULT tab. Tap one for the game detail and point breakdown."
      ),
  },
  {
    id: "nav_my_rank",
    hint: "where MY RANK / my ranking card is",
    fast: /(?:my\s*rank|マイランク|自分の順位(?:カード)?)(?:の)?(?:見方|みかた|どこ)|順位カード(?:は|って)?(?:どこ|見方)/i,
    open: ["rankings", "today"],
    answer: (lang) =>
      T(
        lang,
        "自分の順位は、下タブの RANKING の MY RANK カードで見られます。今日の試合日の自分の順位・的中は、試合一覧右端の TODAY → UNITERZ タブの MY RANK にもあります。",
        "Your place on the board is the MY RANK card in the RANKING tab. For today's game-day rank and hits, open TODAY (right edge of the games list) → UNITERZ → MY RANK."
      ),
  },
  {
    id: "nav_detail_sections",
    hint: "where shot chart / on-off / lineups / splits / HOW THEY PLAY are on detail pages",
    fast: /(?:ショットチャート|シュートチャート|shot\s*chart|オン.?オフ|on\s*\/?\s*off|ラインナップ|lineup|splits?|edge|how they play|ハウゼイプレイ)(?:の|って|は)?(?:見方|みかた|どこ|どうやって|見れる)/i,
    open: ["stats"],
    answer: (lang) =>
      T(
        lang,
        [
          "チーム詳細 / 選手詳細の中にあります。",
          "・ショットチャート・ON / OFF・HOW THEY PLAY: 選手詳細の OVERVIEW",
          "・試合ログ・SPLITS: 選手詳細の GAMES / チーム詳細の GAMES・TEAM",
          "・ラインナップ・ON / OFF: チーム詳細の LINEUP / TEAM",
          "・EDGE（得意形 / 苦手形）: チーム詳細の TEAM",
          "開き方は STATS・STANDING・予想画面の STATS / ROSTER からチームや選手をタップです。",
        ].join("\n"),
        [
          "They're on team and player pages:",
          "- Shot chart, ON / OFF, HOW THEY PLAY: player OVERVIEW",
          "- Game logs and SPLITS: player GAMES and team GAMES / TEAM",
          "- Lineups and ON / OFF: team LINEUP / TEAM",
          "- EDGE (favorable / unfavorable shapes): team TEAM tab",
          "Open a team or player from STATS, STANDING, or the pick screen's STATS / ROSTER tabs."
        ].join("\n")
      ),
  },
  {
    id: "nav_profile",
    hint: "where the profile / settings screens are",
    fast: /プロフィール(?:の)?(?:見方|みかた|どこ|開き方)|設定画面(?:は|って)?(?:どこ|見方)|profile(?: screen)?(?:は|って)?(?:どこ)/i,
    open: ["profile"],
    answer: (lang) =>
      T(
        lang,
        "プロフィールは下タブの右端です。右端の MENU から通知・表示・プラン・サポート（ヘルプ・お問い合わせ・利用規約）などに行けます。",
        "Profile is the rightmost bottom tab. The MENU on its right edge opens notifications, display, plan, and support (help, contact, terms)."
      ),
  },
  {
    id: "hit_rate_where",
    hint: "where to see my hit rate / accuracy",
    fast: /(?:的中率|正解率|ヒット率)(?:の)?(?:見方|みかた|どこ)|自分の(?:的中|正解)(?:率)?(?:は|って)?(?:どこ|見方)/i,
    open: ["rankings", "results"],
    answer: (lang) =>
      T(
        lang,
        "勝者の的中率は、RANKING の勝率指標と、自分の RESULT / MY RANK まわりで確認できます。週間・月間の勝率ランキングに載るには、その時点までの PICK UP 試合の一定割合以上を予想している必要があります。",
        "Winner hit rate shows under RANKING's win-rate metric and around your RESULT / MY RANK. Weekly / monthly win-rate boards require picking a minimum share of PICK UP games so far."
      ),
  },
  {
    id: "stats_refresh",
    hint: "when NBA stats / scores / injuries in the app update",
    fast: /(?:スタッツ|データ|スコア|欠場|ケガ)(?:は|って)?(?:いつ|何時)(?:更新|反映)|(?:更新|反映)(?:は|って)?(?:いつ|何時)|いつ(?:スタッツ|データ)(?:が|は)?(?:更新|入)/i,
    answer: (lang) =>
      T(
        lang,
        [
          "アプリ内のデータは次のタイミングで入ります（ライブの外部サイト取得ではありません）。",
          "・試合中のスコア / ボックス: 試合があるあいだ、約1分ごとに更新",
          "・リーグ表・詳細スタッツ・試合ログなど: 試合終了後に随時、保険で毎日18:00頃にもまとめ更新",
          "・欠場情報: 16:00 / 23:00 と、試合開始前の窓でも更新",
          "・全体ランキング: 毎日日本時間16時",
        ].join("\n"),
        [
          "In-app data updates on this schedule (not live pulls from third-party sites on each open):",
          "- Live scores / box scores: about every minute while games are on",
          "- League tables, detail stats, game logs: after games finish, plus a daily pass around 18:00 JST",
          "- Injuries: 16:00 / 23:00 JST and pregame windows",
          "- Global rankings: daily at 16:00 JST",
        ].join("\n")
      ),
  },
  {
    id: "platforms",
    hint: "iOS / Android availability and offline",
    fast: /(?:android|アンドロイド|iphone|ios|アイフォン)(?:でも|だけ|対応)|オフライン(?:で)?(?:使える|利用)/i,
    answer: (lang) =>
      T(
        lang,
        "iPhone（App Store）と Android（Google Play）の両方で使えます。試合スコアやスタッツはネット接続が必要で、オフライン専用モードはありません。",
        "Available on iPhone (App Store) and Android (Google Play). Scores and stats need a network connection; there is no offline-only mode."
      ),
  },
];

/** どの話題にも入りきらない細かい仕様。AI が説明文から答えるときだけ使う（コード・規約で確かめたものだけ） */
const FACTS: Array<(lang: Lang) => string> = [
  (lang) => T(lang, "延長戦になった試合は、延長を含む最終スコアで採点します。", "Overtime games are scored on the final score including overtime."),
  (lang) => T(lang, "最多得点者が同点のときは、同点の全員が当たりです。", "If players tie for the most points, picking any of them counts as a hit."),
  (lang) =>
    T(
      lang,
      "予想しなかった試合は、ポイントも付かず減点もありません。連勝も切れません（予想した試合だけで数えます。シーズンが変わると連勝は0に戻ります）。",
      "Games you don't pick give no points and no penalty, and don't break your streak (only picked games count; streaks reset each season)."
    ),
  (lang) =>
    T(
      lang,
      "プレシーズンの試合も予想・採点されますが、ランキング・通算成績・連勝には入りません。",
      "Preseason games can be picked and are scored, but they don't count toward rankings, career stats, or streaks."
    ),
  (lang) =>
    T(
      lang,
      "プレーオフの試合も予想できます。RANKING の MENU → PLAYOFFS に別のランキングがあります（総合と各ラウンド）。プレーインはランキングに入りません。",
      "Playoff games can be picked too, with a separate ranking under RANKING → MENU → PLAYOFFS (overall and by round). Play-In games don't count."
    ),
  (lang) =>
    T(
      lang,
      "ランキングで同点の人は同じ順位です（Unit も同額）。一覧は100位まで（100位が同点ならその全員）。",
      "Tied users share the same rank (and the same Units). Lists show the top 100 (everyone tied at 100th is included)."
    ),
  (lang) => T(lang, "PICK UP の試合は運営が週ごとに選びます。", "PICK UP games are chosen by the UNITERZ team each week."),
  (lang) =>
    T(
      lang,
      "招待コード・パートナーコードを入れられるのは新規登録のときだけです。登録したあとから入れることはできません。",
      "Invite and partner codes can only be entered at sign-up, not afterwards."
    ),
  (lang) =>
    T(
      lang,
      "予想・ポイント・Unit・PRO はアカウントに保存されます。機種変更や再インストールのあとも、同じメールアドレスとパスワードでログインすればそのまま戻ります（ログインはメールアドレスとパスワード）。PRO が出ないときは購入画面の「購入を復元」。",
      "Picks, points, Units, and PRO are saved to your account. After changing phones or reinstalling, log in with the same email and password and everything is back (sign-in is email and password). If PRO is missing, tap \"Restore purchases\" on the purchase screen."
    ),
  (lang) =>
    T(
      lang,
      "PRO は端末ではなくアカウントに付くので、同じアカウントなら iPhone でも Android でも PRO です。解約やプラン変更は買ったストア側（iPhone で買ったなら App Store）で行います。1つの購入は1つのアカウントにだけ紐づきます。",
      "PRO belongs to your account, not the device, so the same account is PRO on both iPhone and Android. Cancel or change plans in the store you bought from (App Store if bought on iPhone). One purchase links to one account."
    ),
  (lang) =>
    T(
      lang,
      "Weekly と Monthly は、プロフィールのメニュー →「プランの確認」から切り替えられます（手続きは App Store / Google Play）。上げるときはストアの仕様どおりに反映、下げるときは今の期間が終わってからで返金はありません。Season Pass は買い切りで、Weekly / Monthly へ切り替えることはできません（期間が終わったら、あらためて好きなプランを購入）。",
      "Switch between Weekly and Monthly from Profile → MENU → Plan Status (handled by the App Store / Google Play). Upgrades apply per the store's rules; downgrades start after the current period with no refund. The Season Pass is a one-time purchase and can't be switched to Weekly / Monthly (buy a plan again after it ends)."
    ),
  (lang) =>
    T(
      lang,
      "商品交換の送料（海外も）と関税は原則運営が負担します。住所の誤りなどで再配達・転送になったときは着払い770円（税込）。海外にも送れます（ブラジルは対象外）。申請には氏名・住所・電話番号が要ります。注文後の変更やキャンセルはできません。",
      "Shipping (including overseas) and import duties for redemptions are generally covered by UNITERZ. Redelivery or forwarding due to a wrong address is cash on delivery, 770 JPY (tax incl.). Overseas shipping is available (except Brazil). You need your name, address, and phone number. Orders can't be changed or cancelled once placed."
    ),
  (lang) =>
    T(
      lang,
      "PRO の料金は、一度支払ったあとは途中で解約しても日割りや返金はありません（Season Pass も同じ）。返金を求めるときは、買ったストア（App Store / Google Play）の返金手続きになります。",
      "PRO fees aren't prorated or refunded by UNITERZ after payment, even if you cancel mid-period (the Season Pass too). For a refund, use the refund process of the store you bought from (App Store / Google Play)."
    ),
  (lang) => T(lang, "いまアプリ内に広告は出ません。", "The app currently shows no ads."),
  (lang) =>
    T(
      lang,
      "ログインボーナスや毎日のボーナスはありません（Unit はランキング・スクワッドバトル・招待などでもらえます）。",
      "There's no login or daily bonus (Units come from rankings, Squad Battle, invites, and so on)."
    ),
  (lang) =>
    T(
      lang,
      "Unit は買う・換金する・払い戻す・人に譲る（友達に送る）ことはできません。",
      "Units can't be bought, cashed out, refunded, or transferred (you can't send them to friends)."
    ),
  (lang) =>
    T(
      lang,
      "アカウントを削除すると Unit の残高は0になり、戻せません。",
      "Deleting your account sets your Unit balance to 0 and it can't be restored."
    ),
  (lang) =>
    T(
      lang,
      "スクワッドのメンバーの参加・脱退・入れ替えは、エントリー期間（募集中）だけです。バトルが始まると追加も交代もできません。",
      "Squad members can join, leave, or be swapped only during the entry window. Once the battle starts, no additions or substitutions."
    ),
  (lang) =>
    T(
      lang,
      "PRO PICK は勝つ確率や予想スコアなどの予想の材料で、当たることを保証するものではありません。",
      "PRO PICK gives prediction inputs such as win probability and projected score; it doesn't guarantee a correct pick."
    ),
];

/** AI が説明文から答えるときに渡す全文（毎回同じ文 → プロンプトキャッシュが効く） */
export function nbaAskKnowledgeReference(language: string): string {
  const lang = language === "ja" ? "ja" : "en";
  const lines: string[] = [];
  for (const e of ENTRIES) {
    if (e.id === "scoring") {
      for (const focus of ["overview", "upset", "win", "streak"] as const) lines.push(`[scoring:${focus}] ${e.answer(lang, focus)}`);
      continue;
    }
    lines.push(`[${e.id}] ${e.answer(lang, null)}`);
  }
  for (const f of FACTS) lines.push(`[fact] ${f(lang)}`);
  return lines.join("\n");
}

const BY_ID = new Map(ENTRIES.map((e) => [e.id, e]));

export const NBA_ASK_KNOWLEDGE_IDS: readonly string[] = ENTRIES.map((e) => e.id);

/** 読み取りの AI に渡す一覧（id: 説明） */
export function nbaAskKnowledgeCatalogLine(): string {
  return ENTRIES.map((e) => `${e.id}: ${e.hint}`).join("\n");
}

/** NBA のデータを聞いている語。これがあれば即答しない（AI に読ませる） */
const NBA_DATA_WORDS =
  /平均|直近|前回|前の試合|ラインナップ|ロスター|契約|年俸|サラリー|ペイロール|ケガ|怪我|けが|欠場|リバウンド|アシスト|得点王|何点|勝敗|成績|スタッツを|順位は|何位|MVP争い|ドラフト|トレード|移籍/;

/** 画面の場所・見方の質問。データ語（年俸など）が混ざっても即答してよい */
const APP_HOW_TO_VIEW_WORDS =
  /見方|みかた|見かた|開き方|どこ|どうやって|見れる|見られる|where|how (?:do|to) (?:i |you )?(?:view|see|open|find)/i;

/**
 * よくあるアプリの質問だけ、言い回しで即答する。迷うものは null（AI に読ませる）。
 * 長い文は別の話が混ざりやすいので 60 文字まで。
 */
export function matchNbaAskKnowledge(question: string): { id: string; focus?: Focus } | null {
  const q = question.trim();
  if (!q || q.length > 60) return null;
  if (NBA_DATA_WORDS.test(q) && !APP_HOW_TO_VIEW_WORDS.test(q)) return null;
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
