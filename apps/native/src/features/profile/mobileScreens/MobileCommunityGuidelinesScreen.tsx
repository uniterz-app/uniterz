/**
 * Web `CommunityGuidelinesPage` variant=mobile — `LegalPageLayout` 準拠
 */
import { StyleSheet, Text, View } from "react-native";
import LegalPageLayoutNative from "../../legal/LegalPageLayoutNative";

type Props = {
  language: "ja" | "en";
};

export default function MobileCommunityGuidelinesScreen({ language }: Props) {
  const isJa = language === "ja";
  const updatedAt = "2026-03-23";

  return (
    <LegalPageLayoutNative
      title={isJa ? "コミュニティガイドライン" : "Community Guidelines"}
      description={
        isJa
          ? "スポーツ予想ファンタジーゲームを健全に楽しむために"
          : "To enjoy this sports-prediction fantasy game in a healthy and fair way."
      }
      updatedAt={updatedAt}
      lastUpdatedLabel={isJa ? "最終更新: " : "Last updated: "}
    >
      <Section
        title={isJa ? "1. Uniterz について" : "1. About Uniterz"}
        paragraphs={
          isJa
            ? [
                "Uniterz はスポーツ試合の結果を予想し、スコアを競い合うファンタジーゲームです。試合ごとに勝敗・スコアを予想して投稿すると、結果に応じてポイントが付与され、ランキングやプロフィールに反映されます。",
                "金銭的リターンを目的としたサービスではなく、ゲーム内のポイントのみで競います。",
              ]
            : [
                "Uniterz is a fantasy sports game where you predict match results and compete with scores.",
                "This is not for financial gain—only in-game points matter.",
              ]
        }
      />
      <Section
        title={isJa ? "2. 公平なプレイ" : "2. Fair Play"}
        bullets={
          isJa
            ? [
                "1試合につき1回まで予想を投稿できます（試合開始後の投稿は無効）",
                "複数アカウントを用いた不正なスコア稼ぎは禁止です",
                "他人のアカウントを使用したり、なりすましたりすることは禁止です",
                "システムの不具合を意図的に利用する行為は禁止です",
              ]
            : [
                "One prediction per match (submissions after tip-off are invalid).",
                "No score farming with multiple accounts.",
                "No impersonation or using others' accounts.",
                "No intentional abuse of bugs.",
              ]
        }
      />
      <Section
        title={isJa ? "3. プロフィール・表示名について" : "3. Profiles / Display Names"}
        paragraphs={
          isJa
            ? [
                "プロフィールの表示名・ハンドル・自己紹介文は、他のユーザーに公開されます。以下の内容を含めることは禁止です。",
              ]
            : ["Display name, handle, and bio are public. Do not include:"]
        }
        bullets={
          isJa
            ? [
                "他者を攻撃・侮辱・差別する表現",
                "虚偽の肩書き・所属の詐称",
                "外部サービスへの誘導（URL・連絡先の掲示など）",
                "スパム・宣伝目的の文言",
              ]
            : [
                "Attacks, insults, or discrimination.",
                "False titles or affiliations.",
                "Promoting external services (URLs, contact info).",
                "Spam or ads.",
              ]
        }
      />
      <Section
        title={isJa ? "4. 禁止される行為" : "4. Prohibited Acts"}
        bullets={
          isJa
            ? [
                "他者や運営になりすます行為",
                "サービスの動作を妨害・悪用する行為（自動化アクセス、過剰リクエスト等）",
                "不正アクセスその他、法令に違反する行為",
              ]
            : [
                "Impersonating users or staff.",
                "Disrupting the service (bots, excessive requests, etc.).",
                "Unauthorized access or anything illegal.",
              ]
        }
      />
      <Section
        title={isJa ? "5. 違反時の対応" : "5. If Rules Are Broken"}
        paragraphs={
          isJa
            ? ["ガイドライン違反が確認された場合、以下のいずれかの対応を行うことがあります。"]
            : ["If a violation is confirmed, we may:"]
        }
        bullets={
          isJa
            ? ["軽度：警告・内容の修正依頼", "中度：一時的な利用制限", "重大：アカウント停止または永久BAN"]
            : ["Mild: warning / request to fix.", "Moderate: temporary restriction.", "Severe: suspension or permanent ban."]
        }
        paragraphsAfter={
          isJa
            ? ["対応の内容・程度は、当社の判断により決定します。"]
            : ["Severity and response are at our discretion."]
        }
      />
      <Section
        title={isJa ? "6. サービスについて" : "6. About the Service"}
        paragraphs={
          isJa
            ? [
                "Uniterz のサービス内容・仕様は予告なく変更される場合があります。掲載されている試合情報・ランキング・ポイント計算などについて、正確性・完全性を保証するものではありません。",
                "すべてのユーザーが健全にゲームを楽しめるよう、本ガイドラインの遵守にご協力ください。",
              ]
            : [
                "Specs may change without notice. We don't guarantee accuracy of schedules, rankings, or points.",
                "Please follow these guidelines so everyone can enjoy the game.",
              ]
        }
      />
    </LegalPageLayoutNative>
  );
}

function Section({
  title,
  paragraphs,
  bullets,
  paragraphsAfter,
}: {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  paragraphsAfter?: string[];
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>{title}</Text>
      {paragraphs?.map((p) => (
        <Text key={p} style={styles.p}>
          {p}
        </Text>
      ))}
      {bullets?.map((b) => (
        <Text key={b} style={styles.li}>
          {"\u2022 "}
          {b}
        </Text>
      ))}
      {paragraphsAfter?.map((p) => (
        <Text key={p} style={[styles.p, { marginTop: 8 }]}>
          {p}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6 },
  h2: { fontSize: 16, fontWeight: "700", color: "rgba(255,255,255,0.9)", marginBottom: 4 },
  p: { fontSize: 14, lineHeight: 22, color: "rgba(255,255,255,0.8)" },
  li: { fontSize: 14, lineHeight: 22, color: "rgba(255,255,255,0.8)", paddingLeft: 4 },
});
