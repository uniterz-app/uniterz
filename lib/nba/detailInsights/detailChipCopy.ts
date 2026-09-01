/** TEAM IDENTITY / ROLE / ROLE CHANGE — チップタップ時の説明文 */

export type DetailChipCopy = {
  hintJa: string;
  hintEn: string;
};

const COPY: Record<string, DetailChipCopy> = {
  // — Team identity —
  fast_pace: {
    hintJa: "1試合あたりのポゼッション数が多く、テンポの速いバスケをするチーム。",
    hintEn: "Plays at a fast pace with more possessions per game.",
  },
  slow_pace: {
    hintJa: "ペースを落としてセットオフェンス中心。点数は少なめ・じっくり型。",
    hintEn: "Slows the game down; fewer possessions, half-court oriented.",
  },
  three_heavy: {
    hintJa: "3ポイント試投が多い、または得点のかなりの割合を3Pで稼ぐ。",
    hintEn: "Takes a lot of threes or scores a large share of points from beyond the arc.",
  },
  paint_attack: {
    hintJa: "ペイント内・ゴール下からの得点比率が高い。ドライブ・リム攻撃型。",
    hintEn: "Scores heavily in the paint — drives, rim runs, and interior finishing.",
  },
  ft_line: {
    hintJa: "フリースロー試投が多い。接触を作ってラインに行くスタイル。",
    hintEn: "Gets to the free-throw line often; contact and foul drawing.",
  },
  offense_first: {
    hintJa: "攻撃効率（ORTG）がリーグ上位。点数を取ることで勝負を決めやすい。",
    hintEn: "Top-tier offensive rating — wins with efficient scoring.",
  },
  defense_first: {
    hintJa: "守備効率（DRTG）がリーグ上位。失点を抑えて勝つタイプ。",
    hintEn: "Top-tier defensive rating — wins by limiting opponent scoring.",
  },
  elite_net: {
    hintJa: "ネットレーティング（100 poss あたり得失点差）がリーグ最上位級。",
    hintEn: "Elite net rating — one of the best point-differential teams.",
  },
  iso_heavy: {
    hintJa: "アイソレーション（1対1）の使用率が高い。個人技で崩す比重が大きい。",
    hintEn: "Runs a lot of isolation plays — one-on-one scoring emphasis.",
  },
  pnr_heavy: {
    hintJa: "ピックアンドロール（PnR）の使用率が高い。ハンドラー×ロール型 offense。",
    hintEn: "Pick-and-roll heavy — ball-handler and roll-man actions drive the offense.",
  },
  spotup_team: {
    hintJa: "スポットアップ（受けて即シュート）の比重が大きい。",
    hintEn: "Relies on spot-up shooting — catch-and-shoot threes and mid-range.",
  },
  post_up: {
    hintJa: "ポストアップの使用率が高い。低ポストからの得点源がある。",
    hintEn: "Post-up oriented — scores through back-to-basket actions.",
  },
  transition: {
    hintJa: "トランジション（速攻）プレイの使用率が高い。",
    hintEn: "Transition-heavy — pushes in early offense after changes of possession.",
  },
  cut_team: {
    hintJa: "カット（ゴール下への切り込み）の使用率が高い。ボールムーブメント型。",
    hintEn: "Cut-heavy — off-ball movement to the rim.",
  },
  ball_movement: {
    hintJa: "パス数が多く、ボールが回る offense。",
    hintEn: "High pass volume — ball movement is a core identity.",
  },
  drive_heavy: {
    hintJa: "ドライブ（ペンetration）が多い。ハンドラーが崩して仕掛ける。",
    hintEn: "Drive-heavy — frequent penetration from the perimeter.",
  },
  cns_heavy: {
    hintJa: "キャッチ＆シュートの比重・効率が高い。",
    hintEn: "Catch-and-shoot oriented — thrives on kick-out looks.",
  },
  pullup_heavy: {
    hintJa: "プルアップジャンパーからの得点が多い。",
    hintEn: "Pull-up jumper heavy — scores off the dribble from mid-range and three.",
  },
  second_chance: {
    hintJa: "オフェンスリバウンド率が高く、セカンドチャンス得点を作りやすい。",
    hintEn: "Strong offensive rebounding — extra possessions and second-chance points.",
  },
  rebound_strong: {
    hintJa: "オフェンスリバウンドが強く、ボード争いで優位。",
    hintEn: "Strong on the offensive glass — wins extra possessions.",
  },
  fb_points: {
    hintJa: "ファストブレイク得点の割合が高い。",
    hintEn: "Scores a large share of points in transition / fast breaks.",
  },
  clutch_strong: {
    hintJa: "接戦・終盤（クラッチ）の net rating がリーグ上位。",
    hintEn: "Strong clutch net rating — performs well in tight late-game minutes.",
  },
  clutch_weak: {
    hintJa: "接戦・終盤の成績がリーグ下位。フィニッシュに課題。",
    hintEn: "Weak clutch net rating — struggles to close tight games.",
  },
  perim_def: {
    hintJa: "相手の3P%を抑えている。ペリメーター DF が強い。",
    hintEn: "Limits opponent three-point percentage — strong perimeter defense.",
  },
  rim_protect: {
    hintJa: "相手の FG% 全体を抑えている。インナー DF / リム protection。",
    hintEn: "Suppresses opponent FG% — solid interior and rim protection.",
  },
  force_tos: {
    hintJa: "相手のターンオーバーを多く誘発。プレッシャー DF。",
    hintEn: "Forces turnovers — disruptive, pressure-based defense.",
  },
  hustle_team: {
    hintJa: "ディフレクション・チャージ・ルーズボールなどハッスル指標が高い。",
    hintEn: "High hustle stats — deflections, charges, and loose-ball plays.",
  },
  clean_ball: {
    hintJa: "ターンオーバー率が低く、ボールを大切にする。",
    hintEn: "Low turnover rate — takes care of the basketball.",
  },
  turnover_prone: {
    hintJa: "ターンオーバー率が高く、ボールを失いやすい。",
    hintEn: "Turnover prone — gives away possessions frequently.",
  },
  surging: {
    hintJa: "直近10試合の net rating がシーズン平均より大幅に改善。上昇中。",
    hintEn: "Last-10 net rating is much better than season average — trending up.",
  },
  free_fall: {
    hintJa: "直近10試合の net rating がシーズン平均より大幅に悪化。下落中。",
    hintEn: "Last-10 net rating is much worse than season average — sliding.",
  },
  injury_risk: {
    hintJa: "主力の欠場・疑い（OUT/GTD）が複数、または ace 級選手が欠場中。",
    hintEn: "Multiple OUT/GTD players or a key star unavailable — rotation risk.",
  },

  // — Player role —
  first_option: {
    hintJa: "チームの第1得点源。Usage・得点ともリーグ上位。",
    hintEn: "Primary scoring option — elite usage and points.",
  },
  second_option: {
    hintJa: "第2得点源。スターに次ぐ offensive  load。",
    hintEn: "Secondary scoring option — second-highest offensive responsibility.",
  },
  third_option: {
    hintJa: "第3得点源。スコアリング hierarchy の中位。",
    hintEn: "Third scoring option in the team's pecking order.",
  },
  primary_handler: {
    hintJa: "Pick-and-roll ハンドラー、または AST 上位の主創造者。",
    hintEn: "Primary ball-handler — PnR handler or top playmaker.",
  },
  secondary_creator: {
    hintJa: "第2創造者。パスは出すが Usage は控えめ。",
    hintEn: "Secondary creator — assists without dominating usage.",
  },
  playmaker: {
    hintJa: "アシスト率が高い組み立て役。",
    hintEn: "High assist rate — sets up teammates.",
  },
  spot_up: {
    hintJa: "スポットアップ shooter。受けて即シュートが主武器。",
    hintEn: "Spot-up shooter — catch-and-shoot specialist.",
  },
  floor_spacer: {
    hintJa: "3P 試投が多く、スペースを作る shooter。",
    hintEn: "Floor spacer — volume three-point shooter.",
  },
  three_d: {
    hintJa: "3P と守備の両方。3&D ウィング。",
    hintEn: "Three-and-D — perimeter shooting plus defense.",
  },
  rim_runner: {
    hintJa: "リム付近の FG% が高い。ゴール下 finisher。",
    hintEn: "Rim runner — efficient finisher at the basket.",
  },
  slasher: {
    hintJa: "ドライブが多い。ペンetration 型。",
    hintEn: "Slasher — attacks the rim off the dribble.",
  },
  paint_finisher: {
    hintJa: "ペイントタッチが多く、ゴール下で得点する。",
    hintEn: "Paint finisher — scores through interior touches.",
  },
  post_scorer: {
    hintJa: "ポストアップの使用率が高い。",
    hintEn: "Post scorer — back-to-basket offense.",
  },
  cutter: {
    hintJa: "カットの使用率が高い。オフボール mover。",
    hintEn: "Cutter — thrives on backdoor and rim cuts.",
  },
  off_ball_mover: {
    hintJa: "オフスクリーン・ハンドオフなど off-ball  action が多い。",
    hintEn: "Off-ball mover — off-screens and handoffs.",
  },
  transition_threat: {
    hintJa: "トランジション playtype の比重が高い。",
    hintEn: "Transition threat — scores in early offense.",
  },
  volume_scorer: {
    hintJa: "試投数（FGA）がリーグ上位。量で攻める。",
    hintEn: "Volume scorer — high field-goal attempts.",
  },
  efficient_scorer: {
    hintJa: "TS% が高い。少ないショットで効率よく得点。",
    hintEn: "Efficient scorer — strong true shooting percentage.",
  },
  ft_magnet: {
    hintJa: "フリースロー試投率が高い。ファウルを誘う。",
    hintEn: "Free-throw magnet — draws fouls and gets to the line.",
  },
  closer: {
    hintJa: "クラッチ時の Usage / 得点が高い。終盤の主役。",
    hintEn: "Closer — high clutch usage and scoring.",
  },
  pao_defender: {
    hintJa: "ポイント・オブ・アタック defender。相手 PG/Wing を抑える。",
    hintEn: "Point-of-attack defender — guards primary ball-handlers.",
  },
  rim_protector: {
    hintJa: "ブロック・リム protection が強い。",
    hintEn: "Rim protector — blocks shots and deters drives.",
  },
  def_anchor: {
    hintJa: "個人 DRTG が良く、守備の柱。",
    hintEn: "Defensive anchor — strong individual defensive rating.",
  },
  glass_cleaner: {
    hintJa: "リバウンド率が高い。ボードを取る。",
    hintEn: "Glass cleaner — elite rebounding rate.",
  },
  hustle_energy: {
    hintJa: "ディフレクション・チャージなどハッスルプレイが多い。",
    hintEn: "Hustle player — deflections, charges, effort plays.",
  },
  stretch_big: {
    hintJa: "ビッグマンながら 3P を打つ。スペース型 frontcourt。",
    hintEn: "Stretch big — frontcourt player who shoots threes.",
  },
  roll_man: {
    hintJa: "PnR ロールマン。ゴール下へ rolling して得点。",
    hintEn: "Roll man — pick-and-roll finisher at the rim.",
  },
  backup_big: {
    hintJa: "ビッグの控え。出場時間・Usage は控えめ。",
    hintEn: "Backup big — reserve frontcourt minutes.",
  },
  connector: {
    hintJa: "Usage は低めだがパス・効率でつなぐ。",
    hintEn: "Connector — low usage, efficient passing hub.",
  },
  sixth_man: {
    hintJa: "スターター以外で高い MPG。第6人として大きな役割。",
    hintEn: "Sixth man — high minutes off the bench.",
  },
  low_usage: {
    hintJa: "Usage が低い。ロールプレイヤー型。",
    hintEn: "Low-usage role player — limited offensive touches.",
  },

  // — Role change signals —
  min_up: {
    hintJa: "直近5試合の出場時間が、その前5試合より15%以上増加。",
    hintEn: "Minutes up 15%+ over the last 5 games vs the prior 5.",
  },
  min_down: {
    hintJa: "直近5試合の出場時間が、その前5試合より15%以上減少。",
    hintEn: "Minutes down 15%+ over the last 5 games vs the prior 5.",
  },
  fga_up: {
    hintJa: "直近5試合の FGA が前5試合より20%以上増加。",
    hintEn: "Field-goal attempts up 20%+ in the last 5 vs prior 5.",
  },
  pts_up: {
    hintJa: "直近5試合の得点が前5試合より20%以上増加。",
    hintEn: "Scoring up 20%+ in the last 5 vs prior 5.",
  },
  starter_push: {
    hintJa: "直近3試合の MIN がシーズン平均より大幅に増。スターター昇格 push。",
    hintEn: "Recent minutes surge — pushing into a starter role.",
  },
  bench_slide: {
    hintJa: "直近3試合の MIN がシーズン平均より大幅に減。ベンチ降格傾向。",
    hintEn: "Recent minutes drop — sliding toward the bench.",
  },
};

export function getDetailChipCopy(id: string): DetailChipCopy | null {
  return COPY[id] ?? null;
}

export function enrichInsightChip<
  T extends { id: string; label: string },
>(chip: T): T & DetailChipCopy {
  const copy = getDetailChipCopy(chip.id);
  return {
    ...chip,
    hintJa: copy?.hintJa ?? `${chip.label} — 今季スタッツから自動判定。`,
    hintEn: copy?.hintEn ?? `${chip.label} — Auto-tagged from season stats.`,
  };
}

export function enrichInsightChips<
  T extends { id: string; label: string },
>(chips: T[]): Array<T & DetailChipCopy> {
  return chips.map(enrichInsightChip);
}

