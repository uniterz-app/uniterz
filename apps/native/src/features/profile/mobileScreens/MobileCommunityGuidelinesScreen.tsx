/**
 * Web `CommunityGuidelinesPage` variant=mobile に相当。
 */
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MobilePageShell from "./MobilePageShell";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

export default function MobileCommunityGuidelinesScreen({ language, onClose }: Props) {
  const isJa = language === "ja";
  const updatedAt = "2026-03-23";

  return (
    <MobilePageShell
      title={isJa ? "コミュニティガイドライン" : "Community Guidelines"}
      onClose={onClose}
    >
      <ScrollView contentContainerStyle={styles.pad}>
        <LinearGradient
          colors={["rgba(34,211,238,0.08)", "rgba(15,23,42,0.95)"]}
          style={styles.card}
        >
          <Text style={styles.lead}>
            {isJa
              ? "スポーツ予想ファンタジーゲームを健全に楽しむために"
              : "To enjoy this sports-prediction fantasy game in a healthy and fair way."}
          </Text>
          <Text style={styles.updated}>
            {isJa ? `最終更新日: ${updatedAt}` : `Last updated: ${updatedAt}`}
          </Text>

          <Section
            title={isJa ? "1. Uniterz について" : "1. About Uniterz"}
            body={
              isJa
                ? "Uniterz はスポーツ試合の結果を予想し、スコアを競い合うファンタジーゲームです。\n試合ごとに勝敗・スコアを予想して投稿すると、結果に応じてポイントが付与され、\nランキングやプロフィールに反映されます。\n\n金銭的リターンを目的としたサービスではなく、ゲーム内のポイントのみで競います。"
                : "Uniterz is a fantasy sports game where you predict match results and compete with scores. Predictions earn points reflected in rankings and profiles.\n\nThis is not for financial gain—only in-game points matter."
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
                    "No impersonation or using others’ accounts.",
                    "No intentional abuse of bugs.",
                  ]
            }
          />
          <Section
            title={isJa ? "3. プロフィール・表示名について" : "3. Profiles / Display Names"}
            body={
              isJa
                ? "プロフィールの表示名・ハンドル・自己紹介文は、他のユーザーに公開されます。\n以下の内容を含めることは禁止です。"
                : "Display name, handle, and bio are public. Do not include:"
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
            body={
              isJa
                ? "ガイドライン違反が確認された場合、以下のいずれかの対応を行うことがあります。"
                : "If a violation is confirmed, we may:"
            }
            bullets={
              isJa
                ? ["軽度：警告・内容の修正依頼", "中度：一時的な利用制限", "重大：アカウント停止または永久BAN"]
                : ["Mild: warning / request to fix.", "Moderate: temporary restriction.", "Severe: suspension or permanent ban."]
            }
            footer={
              isJa
                ? "対応の内容・程度は、当社の判断により決定します。"
                : "Severity and response are at our discretion."
            }
          />
          <Section
            title={isJa ? "6. サービスについて" : "6. About the Service"}
            body={
              isJa
                ? "Uniterz のサービス内容・仕様は予告なく変更される場合があります。\n掲載されている試合情報・ランキング・ポイント計算などについて、\n正確性・完全性を保証するものではありません。\n\nすべてのユーザーが健全にゲームを楽しめるよう、\n本ガイドラインの遵守にご協力ください。"
                : "Specs may change without notice. We don’t guarantee accuracy of schedules, rankings, or points.\n\nPlease follow these guidelines so everyone can enjoy the game."
            }
          />
        </LinearGradient>
      </ScrollView>
    </MobilePageShell>
  );
}

function Section({
  title,
  body,
  bullets,
  footer,
}: {
  title: string;
  body?: string;
  bullets?: string[];
  footer?: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>{title}</Text>
      {body ? <Text style={styles.p}>{body}</Text> : null}
      {bullets?.map((b) => (
        <Text key={b} style={styles.li}>
          {"\u2022 "}
          {b}
        </Text>
      ))}
      {footer ? <Text style={[styles.p, { marginTop: 8 }]}>{footer}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 48 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 18,
  },
  lead: { fontSize: 12, color: "rgba(248,250,252,0.65)", lineHeight: 18 },
  updated: { marginTop: 6, fontSize: 11, color: "rgba(248,250,252,0.45)" },
  section: { marginTop: 20 },
  h2: { fontSize: 17, fontWeight: "800", color: "#fff", marginBottom: 8 },
  p: { fontSize: 14, lineHeight: 22, color: "rgba(248,250,252,0.85)" },
  li: { fontSize: 14, lineHeight: 22, color: "rgba(248,250,252,0.85)", marginTop: 4, paddingLeft: 4 },
});
