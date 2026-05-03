import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { signOut, updateProfile } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { colors, radius, spacing, typography } from "../../theme/tokens";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function ProfileHomeScreen({
  bottomReserveY = 0,
  onSaved,
}: {
  /** フローティング下部ナビと被らないよう確保する余白（App.tsx から注入） */
  bottomReserveY?: number;
  onSaved?: () => void;
}) {
  const { fUser } = useFirebaseUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [language, setLanguage] = useState<"ja" | "en">("ja");
  const isJa = language === "ja";
  const t = isJa
    ? {
        title: "PROFILE",
        loading: "読み込み中...",
        displayName: "表示名",
        displayNamePlaceholder: "表示名を入力",
        handle: "ハンドル",
        handlePlaceholder: "@handle",
        bio: "自己紹介",
        bioPlaceholder: "自己紹介を入力",
        avatarUrl: "アバター画像URL",
        coverUrl: "カバー画像URL",
        language: "表示言語",
        summary: "SUMMARY",
        posts: "投稿数",
        wins: "的中",
        winRate: "勝率",
        totalPoints: "総合得点",
        maxStreak: "最大連勝",
        upsetPoints: "アップセット得点",
        save: "プロフィール保存",
        saving: "保存中...",
        account: "ログイン中アカウント",
        uid: "uid",
        logout: "ログアウト",
        invalidTitle: "入力不正",
        invalidName: "表示名は50文字以内で入力してください。",
        savedTitle: "保存完了",
        savedBody: "プロフィールを更新しました。",
        saveErrorTitle: "保存エラー",
        saveErrorBody: "プロフィール更新に失敗しました。",
      }
    : {
        title: "PROFILE",
        loading: "Loading...",
        displayName: "Display name",
        displayNamePlaceholder: "Enter display name",
        handle: "Handle",
        handlePlaceholder: "@handle",
        bio: "Bio",
        bioPlaceholder: "Enter bio",
        avatarUrl: "Avatar URL",
        coverUrl: "Cover URL",
        language: "Language",
        summary: "SUMMARY",
        posts: "Posts",
        wins: "Wins",
        winRate: "Win Rate",
        totalPoints: "Total Points",
        maxStreak: "Max Streak",
        upsetPoints: "Upset Points",
        save: "Save profile",
        saving: "Saving...",
        account: "Signed-in account",
        uid: "uid",
        logout: "Log out",
        invalidTitle: "Invalid input",
        invalidName: "Display name must be 50 characters or fewer.",
        savedTitle: "Saved",
        savedBody: "Profile has been updated.",
        saveErrorTitle: "Save error",
        saveErrorBody: "Failed to update profile.",
      };

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!fUser?.uid) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "users", fUser.uid));
        if (!alive) return;
        const data = snap.data() as
          | {
              displayName?: unknown;
              handle?: unknown;
              bio?: unknown;
              avatarUrl?: unknown;
              coverUrl?: unknown;
              language?: unknown;
              posts?: unknown;
              wins?: unknown;
              winRate?: unknown;
              pointsSumV3?: unknown;
              maxStreak?: unknown;
              upsetPointsSum?: unknown;
            }
          | undefined;
        setDisplayName(typeof data?.displayName === "string" ? data.displayName : "");
        setHandle(typeof data?.handle === "string" ? data.handle : "");
        setBio(typeof data?.bio === "string" ? data.bio : "");
        setAvatarUrl(typeof data?.avatarUrl === "string" ? data.avatarUrl : "");
        setCoverUrl(typeof data?.coverUrl === "string" ? data.coverUrl : "");
        setLanguage(data?.language === "en" ? "en" : "ja");
        setSummary({
          posts: asNumber(data?.posts),
          wins: asNumber(data?.wins),
          winRate: asNumber(data?.winRate),
          pointsSumV3: asNumber(data?.pointsSumV3),
          maxStreak: asNumber(data?.maxStreak),
          upsetPointsSum: asNumber(data?.upsetPointsSum),
        });
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [fUser?.uid]);

  const [summary, setSummary] = useState({
    posts: 0,
    wins: 0,
    winRate: 0,
    pointsSumV3: 0,
    maxStreak: 0,
    upsetPointsSum: 0,
  });

  const safeDisplayName = useMemo(() => {
    const name = displayName.trim();
    if (name) return name;
    if (fUser?.displayName) return fUser.displayName;
    return "UNITERZ USER";
  }, [displayName, fUser?.displayName]);

  const safeHandle = useMemo(() => {
    const raw = handle.trim() || fUser?.email?.split("@")[0] || "user";
    return raw.startsWith("@") ? raw : `@${raw}`;
  }, [handle, fUser?.email]);

  async function handleSaveProfile() {
    if (!fUser?.uid || saving) return;
    const safeName = displayName.trim();
    const safeBio = bio.trim();
    if (safeName.length > 50) {
      Alert.alert(t.invalidTitle, t.invalidName);
      return;
    }
    setSaving(true);
    try {
      if (auth.currentUser && auth.currentUser.uid === fUser.uid) {
        await updateProfile(auth.currentUser, { displayName: safeName || null });
      }
      await setDoc(
        doc(db, "users", fUser.uid),
        {
          displayName: safeName,
          handle: handle.trim(),
          bio: safeBio,
          avatarUrl: avatarUrl.trim(),
          coverUrl: coverUrl.trim(),
          language,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      onSaved?.();
      Alert.alert(t.savedTitle, t.savedBody);
    } catch (error: any) {
      Alert.alert(t.saveErrorTitle, error?.message ?? t.saveErrorBody);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <Image
        source={require("../../../assets/AuthFormScreen.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.backgroundDim} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomReserveY + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.coverWrap}>
            {coverUrl ? (
              <Image source={{ uri: coverUrl }} style={styles.coverImage} />
            ) : (
              <LinearGradient
                colors={["#0b1220", "#111827", "#060a12"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.coverImage}
              />
            )}
            <View style={styles.coverOverlay} />
          </View>
          <View style={styles.avatarWrap}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={42}
                  color="rgba(226,232,240,0.9)"
                />
              </View>
            )}
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName} numberOfLines={1}>
              {safeDisplayName}
            </Text>
            <Text style={styles.heroHandle} numberOfLines={1}>
              {safeHandle}
            </Text>
            {bio.trim() ? (
              <Text style={styles.heroBio} numberOfLines={3}>
                {bio.trim()}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t.summary}</Text>
          <View style={styles.summaryGrid}>
            <SummaryMetric label={t.posts} value={`${summary.posts}`} />
            <SummaryMetric label={t.wins} value={`${summary.wins}`} />
            <SummaryMetric
              label={t.winRate}
              value={`${Math.round(summary.winRate * 100)}%`}
            />
            <SummaryMetric label={t.totalPoints} value={formatOne(summary.pointsSumV3)} />
            <SummaryMetric label={t.maxStreak} value={`${summary.maxStreak}`} />
            <SummaryMetric
              label={t.upsetPoints}
              value={formatOne(summary.upsetPointsSum)}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t.title}</Text>
          {loading ? <Text style={styles.body}>{t.loading}</Text> : null}

          <Text style={styles.body}>{t.displayName}</Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            style={styles.input}
            placeholder={t.displayNamePlaceholder}
            placeholderTextColor={colors.textSecondary}
            maxLength={50}
          />
          <Text style={styles.metaText}>{displayName.length}/50</Text>

          <Text style={styles.body}>{t.handle}</Text>
          <TextInput
            value={handle}
            onChangeText={setHandle}
            style={styles.input}
            placeholder={t.handlePlaceholder}
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={30}
          />

          <Text style={styles.body}>{t.bio}</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            style={[styles.input, styles.bioInput]}
            placeholder={t.bioPlaceholder}
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={280}
          />
          <Text style={styles.metaText}>{bio.length}/280</Text>

          <Text style={styles.body}>{t.avatarUrl}</Text>
          <TextInput
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            style={styles.input}
            placeholder="https://..."
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.body}>{t.coverUrl}</Text>
          <TextInput
            value={coverUrl}
            onChangeText={setCoverUrl}
            style={styles.input}
            placeholder="https://..."
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.body}>{t.language}</Text>
          <View style={styles.languageRow}>
            <Pressable
              style={[
                styles.languageChip,
                language === "ja" && styles.languageChipActive,
              ]}
              onPress={() => setLanguage("ja")}
            >
              <Text style={styles.languageChipText}>日本語</Text>
            </Pressable>
            <Pressable
              style={[
                styles.languageChip,
                language === "en" && styles.languageChipActive,
              ]}
              onPress={() => setLanguage("en")}
            >
              <Text style={styles.languageChipText}>English</Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.saveButton, saving && styles.buttonDisabled]}
            onPress={() => void handleSaveProfile()}
            disabled={saving}
          >
            <Text style={styles.saveText}>{saving ? t.saving : t.save}</Text>
          </Pressable>

          <Text style={styles.body}>{t.account}</Text>
          <Text style={styles.value}>{fUser?.email ?? "-"}</Text>
          <Text style={styles.body}>{t.uid}</Text>
          <Text style={styles.value}>{fUser?.uid ?? "-"}</Text>

          <Pressable style={styles.logoutButton} onPress={() => void signOut(auth)}>
            <Text style={styles.logoutText}>{t.logout}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function asNumber(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function formatOne(v: number): string {
  return `${Math.round(v * 10) / 10}`;
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.metricValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
    backgroundColor: "#020617",
  },
  backgroundImage: {
    position: "absolute",
    top: -64,
    bottom: -64,
    left: -24,
    right: -24,
  },
  backgroundDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,6,23,0.2)",
  },
  scrollContent: {
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.sm,
    gap: 10,
  },
  heroCard: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(8,12,20,0.84)",
  },
  coverWrap: {
    height: 180,
    position: "relative",
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  avatarWrap: {
    position: "absolute",
    top: 126,
    left: "50%",
    marginLeft: -46,
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
    backgroundColor: "#0f2d35",
    zIndex: 2,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroInfo: {
    alignItems: "center",
    paddingTop: 52,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: "rgba(5,8,20,0.85)",
  },
  heroName: {
    color: colors.textPrimary,
    fontSize: 24,
    lineHeight: 28,
    fontFamily: "Oxanium_800ExtraBold",
  },
  heroHandle: {
    color: "rgba(226,232,240,0.74)",
    fontSize: 14,
    lineHeight: 18,
    marginTop: 2,
  },
  heroBio: {
    marginTop: 8,
    color: "rgba(226,232,240,0.9)",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  sectionCard: {
    position: "relative",
    overflow: "hidden",
    width: "100%",
    backgroundColor: "rgba(11,17,32,0.88)",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 5,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: "700",
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: "BebasNeue_400Regular",
    letterSpacing: 1.3,
    fontSize: 28,
    lineHeight: 30,
    marginBottom: 2,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  metricCard: {
    width: "48.9%",
    minHeight: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.11)",
    backgroundColor: "rgba(15,21,38,0.76)",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    justifyContent: "center",
  },
  metricLabel: {
    color: "rgba(226,232,240,0.7)",
    fontSize: 12,
    lineHeight: 16,
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: 24,
    lineHeight: 28,
    fontFamily: "Oxanium_700Bold",
    marginTop: 3,
  },
  body: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  value: {
    color: colors.textPrimary,
    fontSize: typography.body,
    lineHeight: 22,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 11,
    alignSelf: "flex-end",
  },
  input: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(15,21,38,0.86)",
    color: colors.textPrimary,
    fontSize: typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bioInput: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  languageRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  languageChip: {
    flex: 1,
    minHeight: 38,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,21,38,0.84)",
  },
  languageChipActive: {
    borderColor: "rgba(103,232,249,0.46)",
    backgroundColor: "rgba(124,92,255,0.22)",
  },
  languageChipText: {
    color: colors.textPrimary,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  saveButton: {
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.3)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31,72,160,0.92)",
    marginTop: 2,
  },
  saveText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontFamily: "BebasNeue_400Regular",
    letterSpacing: 1.2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  logoutButton: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(15,21,38,0.84)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  logoutText: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: "700",
  },
});
