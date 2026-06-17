import LegalScrollScreenNative from "./LegalScrollScreenNative";

export default function HelpScreenNative() {
  return (
    <LegalScrollScreenNative
      title="ヘルプ"
      description="Uniterz の使い方とスコアリングについて"
      sections={[
        {
          title: "試合タブ",
          body: "日程から試合を選び、勝敗・得点差・得点者などを予想します。確定後にリザルトとして投稿できます。",
        },
        {
          title: "リザルトタブ",
          body: "確定した予想の一覧です。フィルターで勝敗・精度・期間などで絞り込めます。",
        },
        {
          title: "ランキング",
          body: "NBA プレーオフ・W杯などの指標別ランキングを確認できます。",
        },
        {
          title: "リーダーボード",
          body: "コミュニティグループを作成・参加し、メンバー内ランキングを競い合えます。",
        },
        {
          title: "Pro プラン",
          body: "詳細な分析指標やコミュニティ上限の拡張などが利用できます。",
        },
      ]}
    />
  );
}
