import type { ReactNode } from "react";

export type Slide = {
  id: string;
  section?: string;
  content: ReactNode;
};

function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-[2.15rem] font-semibold leading-tight tracking-tight text-[var(--ink)] mb-6">
      {children}
    </h2>
  );
}

function Card({
  title,
  children,
  accent,
}: {
  title: string;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent
          ? "border-[var(--accent)]/40 bg-[var(--accent)]/10"
          : "border-[var(--line)] bg-[var(--surface)]"
      }`}
    >
      <p
        className={`text-xs tracking-[0.14em] uppercase mb-3 ${
          accent ? "text-[var(--accent)]" : "text-[var(--muted)]"
        }`}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

function MetricCompare({
  symbol,
  name,
  role,
  points,
  accent,
}: {
  symbol: string;
  name: string;
  role: string;
  points: string[];
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 md:p-6 flex flex-col ${
        accent
          ? "border-[var(--accent)]/45 bg-[var(--accent)]/10"
          : "border-[var(--line)] bg-[var(--surface)]"
      }`}
    >
      <div className="mb-4">
        <p
          className={`font-[family-name:var(--font-brand)] text-[clamp(2.5rem,6vw,3.5rem)] leading-none tracking-[0.04em] ${
            accent ? "text-[var(--accent)]" : "text-[var(--ink)]"
          }`}
        >
          {symbol}
        </p>
        <p className="mt-2 text-sm font-semibold text-[var(--ink)]">{name}</p>
      </div>
      <p
        className={`text-[1.02rem] leading-snug mb-4 ${
          accent ? "text-[var(--ink)]" : "text-[var(--ink)]/90"
        }`}
      >
        {role}
      </p>
      <ul className="space-y-2 text-[0.9rem] text-[var(--ink)]/78 leading-relaxed mt-auto">
        {points.map((p) => (
          <li key={p} className="flex gap-2">
            <span className="text-[var(--muted)] shrink-0">·</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CheckAsk({
  design,
  ask,
}: {
  design: ReactNode;
  ask: ReactNode;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 max-w-4xl">
      <Card title="いまの設計">
        <div className="text-[var(--ink)]/90 leading-relaxed space-y-2 text-[0.98rem]">
          {design}
        </div>
      </Card>
      <Card title="リーガルチェックをお願いしたい点" accent>
        <div className="text-[var(--ink)]/90 leading-relaxed space-y-2 text-[0.98rem]">
          {ask}
        </div>
      </Card>
    </div>
  );
}

export const SLIDES: Slide[] = [
  {
    id: "title",
    content: (
      <div className="flex flex-col justify-center h-full max-w-4xl">
        <p className="text-[var(--muted)] text-[0.8rem] tracking-[0.18em] mb-6">
          弁護士初回面談
        </p>
        <p className="font-[family-name:var(--font-brand)] text-[clamp(4rem,12vw,7rem)] leading-none tracking-[0.04em] text-[var(--ink)]">
          Uniterz
        </p>
        <h1 className="font-[family-name:var(--font-display)] mt-8 text-[clamp(1.45rem,3.2vw,2rem)] leading-[1.55] font-semibold text-[var(--ink)] max-w-2xl">
          アプリ設計の説明と、
          <br />
          リーガルチェックをお願いしたい箇所
        </h1>
      </div>
    ),
  },

  {
    id: "what-is",
    section: "サービス概要",
    content: (
      <div className="h-full flex flex-col justify-center max-w-3xl">
        <H2>UNITERZ のアプリ設計</H2>
        <div className="space-y-5 text-lg leading-relaxed text-[var(--ink)]/90">
          <p>
            ユーザーが{" "}
            <strong className="text-[var(--ink)]">NBA などの試合結果を予想</strong>
            し、その成績をランキングで競うスマホアプリです。
          </p>
          <p>
            予想は{" "}
            <strong className="text-[var(--ink)]">無料</strong>
            で出せます。外してもお金やポイントは減りません。
          </p>
          <p>
            予想を当ててランキング上位になると、運営から{" "}
            <strong className="text-[var(--accent)]">Unit</strong>
            というアプリ内の報酬がもらえます。Unit を貯めると、運営が用意した NBA
            グッズ（ジャージなど）と交換できます。
          </p>
          <p>
            有料プラン（Pro）もありますが、Pro ユーザーに提供しているのは{" "}
            <strong className="text-[var(--ink)]">
              予想を考えるための分析・通知・レポート
            </strong>
            です。正解保証や、ランキング・Unit の優遇はありません。
          </p>
        </div>
      </div>
    ),
  },

  {
    id: "not-betting",
    section: "サービス概要",
    content: (
      <div className="h-full flex flex-col justify-center max-w-3xl">
        <H2>イメージしやすい対比</H2>
        <p className="text-[var(--muted)] text-sm mb-6 max-w-2xl">
          Uniterz はスポーツベットではなく、
          <strong className="text-[var(--ink)] font-medium">
            スポーツ分析力を競うプラットフォーム
          </strong>
          です。
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="スポーツベット（やっていない）">
            <ul className="space-y-2.5 text-[var(--ink)]/85 text-[0.98rem]">
              <li>予想のために現金を払う</li>
              <li>外れたら金や Unit を失う</li>
              <li>Unit を買って予想に賭ける</li>
              <li>ユーザー同士で金や Unit を賭ける</li>
              <li>参加者のお金を集めて上位に配る</li>
            </ul>
          </Card>
          <Card title="スポーツ分析を競う（やっている）" accent>
            <ul className="space-y-2.5 text-[var(--ink)]/90 text-[0.98rem]">
              <li>無料で試合を予想し、分析力・成績を競う</li>
              <li>スコアでランキング化し、順位を可視化する</li>
              <li>上位者に運営が Unit を無償付与する</li>
              <li>Unit で運営指定の商品と交換できる</li>
              <li>Pro は分析・通知・レポートの提供（競技ルールは Free と同一）</li>
            </ul>
          </Card>
        </div>
      </div>
    ),
  },

  {
    id: "free-can",
    section: "Free / Pro",
    content: (
      <div className="h-full flex flex-col justify-center">
        <H2>無料ユーザーができること</H2>
        <p className="text-[var(--muted)] mb-5 text-sm max-w-2xl">
          課金なしで、予想・ランキング・Unit・商品交換まで利用できます。競技ルールは
          Pro と同一です。
        </p>
        <ul className="grid gap-2.5 max-w-3xl">
          {[
            "予想参加にお金はかからない（無料で投稿できる）",
            "試合を選んで、勝敗・スコアなどの予想を投稿する",
            "試合後、自分の予想がスコア（pt）になるのを見る",
            "スコア計算・ランキング条件は Pro と同一",
            "週間・月間などのランキングに載る・見る",
            "ランキング上位になれば Unit をもらえる（Pro と同じ条件）",
            "Unit を貯めて、運営指定の商品と交換申請する（Pro と同じ条件）",
            "グループバトルに参加できる",
          ].map((t) => (
            <li
              key={t}
              className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[var(--ink)]/90"
            >
              {t}
            </li>
          ))}
        </ul>
      </div>
    ),
  },

  {
    id: "pro-can",
    section: "Free / Pro",
    content: (
      <div className="h-full flex flex-col justify-center">
        <H2>有料ユーザー（Pro）ができること</H2>
        <p className="text-[var(--muted)] mb-5 text-sm max-w-2xl">
          Free の機能に加えて、予想の「材料」と振り返り・見た目が増えます。競技ルール自体は変えません。
        </p>
        <div className="grid gap-4 md:grid-cols-2 max-w-4xl">
          <Card title="Pro で増えるもの" accent>
            <ul className="space-y-2.5 text-[0.98rem] text-[var(--ink)]/90">
              <li>
                <strong>PRO INSIGHT</strong> … 試合前の分析カード（後述）
              </li>
              <li>試合直前のアラート通知</li>
              <li>週次・月次の個人レポート（振り返り）</li>
              <li>Pro 専用の見た目（Skin）・バッジ</li>
            </ul>
          </Card>
          <Card title="Pro でも増えないもの">
            <ul className="space-y-2.5 text-[0.98rem] text-[var(--ink)]/85">
              <li>予想できる回数（Free と同じ）</li>
              <li>スコアの計算式</li>
              <li>ランキングの参加条件</li>
              <li>もらえる Unit の量・条件</li>
              <li>商品交換の条件</li>
              <li>「この試合はこちらが勝つ」という断言</li>
            </ul>
          </Card>
        </div>
        <p className="mt-5 text-sm text-[var(--muted)] max-w-3xl">
          料金例: Weekly 約 280 円 / Monthly 約 780 円 / Season Pass 約 5,000 円（税込想定・ストアで変動あり）
        </p>
      </div>
    ),
  },

  {
    id: "free-pro-table",
    section: "Free / Pro",
    content: (
      <div className="h-full flex flex-col justify-center">
        <H2>Free と Pro の違い（一覧）</H2>
        <div className="overflow-x-auto rounded-2xl border border-[var(--line)] max-w-4xl">
          <table className="w-full text-left text-sm md:text-[0.95rem]">
            <thead>
              <tr className="bg-[var(--surface)] border-b border-[var(--line)]">
                <th className="p-3 md:p-4 text-[var(--muted)] font-medium w-[36%]">
                  項目
                </th>
                <th className="p-3 md:p-4 text-[var(--ink)] font-semibold">Free</th>
                <th className="p-3 md:p-4 text-[var(--accent)] font-semibold">
                  Pro
                </th>
              </tr>
            </thead>
            <tbody className="text-[var(--ink)]/88">
              {[
                ["試合の予想投稿", "できる", "できる（同じ）"],
                ["スコア・ランキング", "参加できる", "同じ条件"],
                ["Unit 獲得", "できる", "同じ条件・同じ量"],
                ["商品交換", "できる", "同じ条件"],
                [
                  "チーム・選手データ（スタッツ、怪我人など）",
                  "見れる",
                  "見れる（同じ）",
                ],
                [
                  "試合前の分析（INSIGHT）",
                  "なし",
                  "あり（重要点を整理して表示）",
                ],
                ["直前アラート", "一部のみ", "あり（欠場・先発など）"],
                ["週次・月次レポート", "なし", "あり（プランによる）"],
                ["専用 Skin / バッジ", "なし", "あり"],
              ].map(([a, b, c]) => (
                <tr key={a} className="border-b border-[var(--line)] last:border-0">
                  <td className="p-3 md:p-4 text-[var(--muted)]">{a}</td>
                  <td className="p-3 md:p-4">{b}</td>
                  <td className="p-3 md:p-4">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-[var(--accent)] max-w-3xl">
          ポイント: Pro はデータを独占しない。INSIGHT
          は Free でも見られるデータを整理したもの。競技の有利ではなく、考える材料・振り返り・見た目を提供します。
        </p>
      </div>
    ),
  },

  {
    id: "user-flow",
    section: "アプリの流れ",
    content: (
      <div className="h-full flex flex-col justify-center">
        <H2>ユーザーの流れ（具体例）</H2>
        <ol className="space-y-3 max-w-3xl">
          {[
            [
              "試合を選択する",
              "スケジュールから対象の NBA 試合を選ぶ",
            ],
            [
              "予想する",
              "勝敗・スコア・得点者などを予想して投稿する（無料・賭け金なし）",
            ],
            [
              "試合終了",
              "公式結果と照合し、独自ロジックでスコア（pt）が付く",
            ],
            [
              "ランキング",
              "週間・月間など、期間ごとの合計スコアで順位が決まる",
            ],
            [
              "Unit 付与",
              "上位など条件を満たすと、運営からアカウントに無償付与される（購入不可）",
            ],
            [
              "商品交換",
              "保有 Unit で交換を申請 → 運営が正規店から購入し配送する",
            ],
          ].map(([title, body], i) => (
            <li
              key={title}
              className="grid grid-cols-[2.5rem_1fr] gap-3 items-start"
            >
              <span className="w-9 h-9 rounded-full bg-[var(--accent)] text-[var(--bg)] font-semibold text-sm flex items-center justify-center">
                {i + 1}
              </span>
              <div className="pt-1">
                <p className="font-semibold text-[var(--ink)]">{title}</p>
                <p className="text-[var(--ink)]/75 text-[0.95rem] mt-0.5">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    ),
  },

  {
    id: "flow-pro",
    section: "アプリの流れ",
    content: (
      <div className="h-full flex flex-col justify-center max-w-4xl">
        <H2>同じ流れで、Pro の人はどこが違うか</H2>
        <p className="text-[var(--muted)] text-sm mb-5">
          1〜6 の流れは <strong className="text-[var(--ink)] font-medium">Free も Pro も同じ</strong>
          です。違いは「材料の見せ方」と振り返り・通知です。
        </p>
        <div className="grid gap-4 md:grid-cols-2 mb-4">
          <Card title="Free でも見られるデータ">
            <ul className="space-y-2 text-[0.95rem] text-[var(--ink)]/88">
              <li>チームスタッツ・プレイヤースタッツ</li>
              <li>怪我人・出場ステータス</li>
              <li>試合・選手の基本情報</li>
            </ul>
            <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
              予想に必要なデータ自体は Free でも閲覧できます。
            </p>
          </Card>
          <Card title="Pro で増えるもの" accent>
            <ul className="space-y-2 text-[0.95rem] text-[var(--ink)]/90">
              <li>
                <strong>PRO INSIGHT</strong> … 下記の整理・要約
              </li>
              <li>試合直前アラート（欠場変更など）</li>
              <li>週次・月次レポート（振り返り）</li>
            </ul>
            <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
              Unit の量・ランキング条件には影響しません。
            </p>
          </Card>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4">
          <p className="text-xs tracking-[0.14em] uppercase text-[var(--accent)] mb-3">
            PRO INSIGHT とは（具体例）
          </p>
          <p className="text-[0.95rem] text-[var(--ink)]/85 leading-relaxed mb-3">
            Free でも見られるデータから、<strong className="text-[var(--ink)]">その試合で重要な点だけ 3〜5 件</strong>
            に絞って整理して表示します。勝者の断言・推奨予想はしません。
          </p>
          <ul className="space-y-2.5 text-[0.92rem] text-[var(--ink)]/80 leading-relaxed">
            <li>
              <strong className="text-[var(--ink)]">試合要約</strong> …
              「この試合の鍵はリバウンド。セルティックスがセカンドチャンスを抑えられるかが重要」
            </li>
            <li>
              <strong className="text-[var(--ink)]">INJURY IMPACT</strong> …
              「主力欠場で〇〇の使用率・アシストが上昇（根拠の数値つき）」
            </li>
            <li>
              <strong className="text-[var(--ink)]">RECENT CHANGE</strong> …
              「直近10試合で3P成功率がシーズン平均より +4.2%」
            </li>
            <li>
              <strong className="text-[var(--ink)]">SCHEDULE IMPACT</strong> …
              「連戦で前日に主力が38分以上。相手は休養2日」
            </li>
          </ul>
          <p className="mt-3 text-xs text-[var(--muted)]">
            ステップ「予想する」の前に読めますが、「このチームを選べ」とは言いません。最終的な予想はユーザー自身が決めます。
          </p>
        </div>
      </div>
    ),
  },

  {
    id: "score-unit",
    section: "スコアと Unit",
    content: (
      <div className="h-full flex flex-col justify-center max-w-4xl">
        <H2>アプリの中にある 2 つの数字</H2>
        <p className="text-[var(--muted)] text-sm mb-5 -mt-3">
          混同されやすいので、<strong className="text-[var(--ink)] font-medium">PT</strong> と{" "}
          <strong className="text-[var(--accent)] font-medium">Unit</strong>{" "}
          は別物です。
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <MetricCompare
            symbol="PT"
            name="スコア（Points）"
            role="予想の成績点。ランキングを付けるためだけに使う。"
            points={[
              "買えない・売れない・換金できない",
              "商品にも換えられない",
              "金銭的価値はない",
            ]}
          />
          <MetricCompare
            symbol="UNIT"
            name="ユニット"
            role="運営が条件達成者に無償付与する報酬。商品交換にだけ使う。"
            points={[
              "買えない・換金できない・人に渡せない",
              "予想に賭けて減らさない（外れても減らない）",
            ]}
            accent
          />
        </div>
        <p className="mt-5 text-sm text-[var(--muted)] text-center md:text-left">
          PT は「順位」、Unit は「報酬」。役割が違います。
        </p>
      </div>
    ),
  },

  {
    id: "unit-grant",
    section: "Unit の付与",
    content: (
      <div className="h-full flex flex-col justify-center max-w-3xl">
        <H2>Unit の付与経路</H2>
        <p className="text-[var(--muted)] text-sm mb-5 -mt-3">
          いずれも <strong className="text-[var(--ink)] font-medium">無償付与</strong>。
          Free / Pro で条件・量は同一。開始前に告知します。
        </p>
        <ul className="grid gap-2.5">
          {[
            "個人ランキング上位（週間・月間）",
            "グループバトル上位グループのメンバー",
            "招待制度の条件達成",
            "特別イベント・キャンペーンの成績上位",
          ].map((t) => (
            <li
              key={t}
              className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[var(--ink)]/90"
            >
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-[var(--muted)]">
          購入・換金・譲渡は不可。Pro 加入ボーナスや付与倍率アップは設けない。
        </p>
      </div>
    ),
  },

  {
    id: "unit-product",
    section: "Unit と商品",
    content: (
      <div className="h-full flex flex-col justify-center max-w-4xl">
        <H2>Unit → 商品交換</H2>
        <div className="overflow-x-auto rounded-2xl border border-[var(--line)] max-w-3xl mb-4">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[var(--surface)] border-b border-[var(--line)]">
                <th className="p-3 text-[var(--muted)] font-medium">商品例</th>
                <th className="p-3 text-[var(--muted)] font-medium">必要 Unit</th>
                <th className="p-3 text-[var(--muted)] font-medium">価格上限の目安</th>
              </tr>
            </thead>
            <tbody className="text-[var(--ink)]/88">
              <tr className="border-b border-[var(--line)]">
                <td className="p-3">NBA ジャージ</td>
                <td className="p-3">1,000</td>
                <td className="p-3">約 25,000 円</td>
              </tr>
              <tr className="border-b border-[var(--line)]">
                <td className="p-3">Tシャツ</td>
                <td className="p-3">600</td>
                <td className="p-3">約 10,000 円</td>
              </tr>
              <tr>
                <td className="p-3">キャップ</td>
                <td className="p-3">300</td>
                <td className="p-3">約 6,000 円</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="交換・購入の流れ（設計）">
            <p className="text-[0.92rem] text-[var(--ink)]/88 leading-relaxed mb-3">
              アプリ内では <strong className="text-[var(--ink)]">NBA ロゴや商品画像は掲載しない</strong>
              。ユーザーが欲しい商品の写真・URL・サイズなどを申請フォームで送る形です。
            </p>
            <ol className="space-y-2.5 text-[0.92rem] text-[var(--ink)]/88 leading-relaxed list-decimal list-inside">
              <li>ユーザーが交換申請（希望商品の写真・商品ページ URL・サイズ・配送先など）</li>
              <li>申請は毎月末で締切</li>
              <li>運営が内容を確認し、正規販売店からまとめて購入</li>
              <li>購入した商品をユーザーへ配送（送料は原則運営負担）</li>
              <li>購入確定時に Unit を消費（ユーザーから商品代金は徴収しない）</li>
            </ol>
            <p className="mt-3 text-xs text-[var(--muted)]">
              自社製造・改造・転売市場仕入れ・換金は行わない。
            </p>
          </Card>
          <Card title="確認したい点（ライセンス等）" accent>
            <ul className="space-y-2.5 text-[0.92rem] text-[var(--ink)]/88 leading-relaxed">
              <li>
                正規店から購入してユーザーに渡すだけで、景品・交換としての
                <strong className="text-[var(--ink)]"> NBA 関連ライセンス</strong>
                は必要か
              </li>
              <li>月末まとめ購入→配送の運用で問題ないか</li>
              <li>
                アプリ内にロゴ・商品画像を載せず、ユーザー申請の参考写真のみ受け取る設計で、商標・ライセンス上問題ないか
              </li>
              <li>販売店の購入規約・転売条件への抵触はないか</li>
            </ul>
          </Card>
        </div>
      </div>
    ),
  },

  {
    id: "money",
    section: "お金の流れ",
    content: (
      <div className="h-full flex flex-col justify-center max-w-3xl">
        <H2>お金と Unit はつながらない</H2>
        <div className="space-y-4 font-mono text-sm md:text-[0.95rem] leading-relaxed">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 text-[var(--ink)]/90">
            ユーザーが払うお金
            <br />
            → App Store / Google Play で Pro 課金
            <br />
            → <span className="text-[var(--accent)]">分析・通知・レポート・見た目</span>
            だけが開く
            <br />
            <span className="text-[var(--muted)]">→ Unit 残高は増えない</span>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 text-[var(--ink)]/90">
            無料の予想・ランキング
            <br />
            → 条件達成者に運営が Unit を無償付与
            <br />
            → 指定商品と交換（運営が購入・配送）
          </div>
        </div>
        <p className="mt-5 text-sm text-[var(--muted)]">
          作らない接続: Pro→Unit 付与 / 現金で Unit 購入 / Unit の換金・譲渡 /
          「Pro なら Unit を稼ぎやすい」という宣伝
        </p>
      </div>
    ),
  },

  {
    id: "agenda",
    section: "確認したいこと",
    content: (
      <div className="h-full flex flex-col justify-center max-w-3xl">
        <H2>ここからが、お願いしたい確認</H2>
        <p className="text-[var(--ink)]/85 text-lg leading-relaxed mb-6">
          いま説明した設計を前提に、次の 3 点についてリーガルチェックをお願いしたいです。
        </p>
        <ol className="space-y-4">
          {[
            ["全体設計", "無料予想 → 複数経路での Unit 付与 → 商品交換、の一連は問題ないか"],
            ["pt と Unit", "役割分け・購入譲渡換金不可の整理は問題ないか"],
            ["PRO INSIGHT", "有料分析が、上記の報酬設計と組み合わさって問題にならないか"],
          ].map(([k, v], i) => (
            <li
              key={k}
              className="flex gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4"
            >
              <span className="text-[var(--accent)] font-semibold text-xl shrink-0">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-[var(--ink)]">{k}</p>
                <p className="text-[var(--ink)]/75 text-[0.95rem] mt-1">{v}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    ),
  },

  {
    id: "check-design",
    section: "確認 1 · 全体設計",
    content: (
      <div className="h-full flex flex-col justify-center">
        <H2>確認 1 · 全体の報酬設計</H2>
        <CheckAsk
          design={
            <>
              <p>予想は無料。外れても財産・Unit は減らない。</p>
              <p>
                Unit は個人ランキング（週間/月間）、グループ、招待、イベント等で
                <strong className="text-[var(--ink)]"> 無償付与</strong>
                （Free/Pro 同一・事前告知）。
              </p>
              <p>Unit で指定商品と交換。商品代は運営負担。</p>
            </>
          }
          ask={
            <>
              <p>
                上記の一連（付与経路が複数あっても含め）が、賭博罪・景品表示法・資金決済法上問題ないか。
                経路ごとに法的区分や運用変更が必要か。
              </p>
              <p>本番公開前に、書面で確定すべき論点の優先順位。</p>
            </>
          }
        />
      </div>
    ),
  },

  {
    id: "check-pt-unit",
    section: "確認 2 · pt / Unit",
    content: (
      <div className="h-full flex flex-col justify-center">
        <H2>確認 2 · スコア（pt）と Unit</H2>
        <CheckAsk
          design={
            <>
              <p>pt はランキング用。金銭価値なし。購入・譲渡・換金・商品交換不可。</p>
              <p>Unit は無償付与。購入・譲渡・換金不可。指定商品交換のみ。</p>
              <p>Unit を予想に使わない。外れても減らない。</p>
            </>
          }
          ask={
            <>
              <p>この役割分け・表現で問題ないか。</p>
              <p>Unit を「金銭的価値なし」と書ける範囲はどこまでか。</p>
              <p>
                維持すべき禁止事項（Unit 販売、Pro 加入ボーナス Unit など）の確認。
              </p>
            </>
          }
        />
      </div>
    ),
  },

  {
    id: "insight-detail",
    section: "確認 3 · PRO INSIGHT",
    content: (
      <div className="h-full flex flex-col justify-center">
        <H2>PRO INSIGHT の中身</H2>
        <p className="text-[var(--muted)] text-sm mb-5 max-w-2xl">
          Pro 向けの試合前画面。データから「今回重要な話」を数個に絞って出す。
        </p>
        <div className="grid gap-4 md:grid-cols-2 max-w-4xl">
          <Card title="出るものの例" accent>
            <ul className="space-y-2 text-[0.95rem] text-[var(--ink)]/90">
              <li>試合の要約</li>
              <li>マッチアップの強み弱み</li>
              <li>直近 10 試合での変化</li>
              <li>欠場の影響</li>
              <li>連戦・休養などのスケジュール要因</li>
              <li>根拠となる数字</li>
            </ul>
          </Card>
          <Card title="出さないもの">
            <ul className="space-y-2 text-[0.95rem] text-[var(--ink)]/85">
              <li>「こちらが勝ちます」</li>
              <li>推奨予想・鉄板・絶対</li>
              <li>他の人の予想内容</li>
              <li>Pro 限定のスコア加点</li>
              <li>Pro 限定の Unit 増量</li>
            </ul>
          </Card>
        </div>
      </div>
    ),
  },

  {
    id: "check-insight",
    section: "確認 3 · PRO INSIGHT",
    content: (
      <div className="h-full flex flex-col justify-center">
        <H2>確認 3 · PRO INSIGHT</H2>
        <CheckAsk
          design={
            <>
              <p>有料で分析を提供。勝者・推奨予想は出さない。</p>
              <p>ランキング・Unit・商品交換のルールは Free と同一。</p>
              <p>
                懸念: 「有料ヒントで懸賞（ランキング）が有利」と見られると、商品が
                Pro に付随する景品と評価され得る。
              </p>
            </>
          }
          ask={
            <>
              <p>景品表示法上、その評価になり得るか。</p>
              <p>なり得る場合、現行の商品上限・Unit 設計と両立できるか。</p>
              <p>できない場合の設計変更案（上限・訴求・機能分離など）。</p>
              <p>課金画面から Unit／商品訴求を出さない運用の要否。</p>
            </>
          }
        />
      </div>
    ),
  },

  {
    id: "close",
    content: (
      <div className="h-full flex flex-col justify-center max-w-3xl">
        <H2>まとめ</H2>
        <ul className="space-y-4 text-[1.05rem] text-[var(--ink)]/90 leading-relaxed">
          <li>
            Uniterz は、無料で試合予想して成績を競い、上位に運営から Unit
            が付き、指定グッズと交換できるアプリです。
          </li>
          <li>
            Pro は分析・通知・レポート・見た目の課金で、競技ルールや Unit
            条件は Free と同じです。
          </li>
          <li>
            今日お願いしたいのは、その設計全体・pt/Unit の整理・PRO INSIGHT
            と報酬の組み合わせについてのリーガルチェックです。
          </li>
        </ul>
        <p className="mt-10 text-sm text-[var(--muted)]">
          Uniterz · 弁護士初回面談
        </p>
      </div>
    ),
  },
];
