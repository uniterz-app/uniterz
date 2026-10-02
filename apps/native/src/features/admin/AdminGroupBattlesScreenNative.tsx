/**
 * Web `/admin/group-battles` 相当 — 大会作成・フェーズ操作
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MobilePageShell from "../profile/mobileScreens/MobilePageShell";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../../hooks/useNativeUserLanguage";
import { useIsAdminNative } from "./useIsAdminNative";
import { CURRENT_NBA_SEASON_KEY } from "../../../../../lib/rankings/nbaSeason";
import { deriveBattleSchedule } from "../../../../../lib/groupBattles/schedule";
import type { ProfileStackParamList } from "../../navigation/types";
import {
  createAdminGroupBattleNative,
  fetchAdminGroupBattlesNative,
  setAdminGroupBattlePhaseNative,
  type AdminGroupBattleRow,
} from "./adminGroupBattlesApiNative";

const PHASE_ACTIONS: Array<{ phase: string; labelJa: string; labelEn: string }> =
  [
    { phase: "recruiting", labelJa: "募集開始", labelEn: "Recruit" },
    { phase: "battle", labelJa: "締切→BATTLE", labelEn: "Lock→Battle" },
    { phase: "settling", labelJa: "集計へ", labelEn: "Settling" },
    { phase: "final", labelJa: "確定へ", labelEn: "Final" },
    { phase: "closed", labelJa: "クローズ", labelEn: "Close" },
  ];

function toLocalInputValue(ms: number): string {
  const jst = new Date(ms + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(jst.getUTCDate()).padStart(2, "0");
  const hh = String(jst.getUTCHours()).padStart(2, "0");
  const mm = String(jst.getUTCMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function defaultForm() {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return {
    name: "",
    seasonKey: CURRENT_NBA_SEASON_KEY,
    recruitStartAt: toLocalInputValue(now),
    recruitEndAt: toLocalInputValue(now + 10 * day),
    battleStartAt: toLocalInputValue(now + 10 * day + 60_000),
    battleEndAt: toLocalInputValue(now + 10 * day + 28 * day),
    startRecruiting: true,
  };
}

function fmtMs(ms: number, isJa: boolean): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleString(isJa ? "ja-JP" : "en-US", {
    timeZone: "Asia/Tokyo",
  });
}

export default function AdminGroupBattlesScreenNative() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { isAdmin, loading: adminLoading } = useIsAdminNative();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const isJa = language === "ja";
  const [battles, setBattles] = useState<AdminGroupBattleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [busy, setBusy] = useState(false);
  const [phaseBusyId, setPhaseBusyId] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const preview = useMemo(
    () =>
      deriveBattleSchedule({
        recruitStartAt: form.recruitStartAt,
        recruitEndAt: form.recruitEndAt,
        battleStartAt: form.battleStartAt,
        battleEndAt: form.battleEndAt,
      }),
    [form]
  );

  const load = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchAdminGroupBattlesNative();
      setBattles(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (adminLoading) return;
    void load();
  }, [adminLoading, load]);

  async function onCreate() {
    if (!preview.ok || !form.name.trim()) return;
    setBusy(true);
    setError(null);
    setCreatedId(null);
    try {
      const id = await createAdminGroupBattleNative({
        name: form.name.trim(),
        seasonKey: form.seasonKey.trim(),
        recruitStartAt: form.recruitStartAt.trim(),
        recruitEndAt: form.recruitEndAt.trim(),
        battleStartAt: form.battleStartAt.trim(),
        battleEndAt: form.battleEndAt.trim(),
        startRecruiting: form.startRecruiting,
      });
      setCreatedId(id);
      setForm(defaultForm());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onPhase(battleId: string, phase: string) {
    setPhaseBusyId(battleId);
    setError(null);
    try {
      await setAdminGroupBattlePhaseNative(battleId, phase);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPhaseBusyId(null);
    }
  }

  if (adminLoading) {
    return (
      <MobilePageShell
        eyebrow="ADMIN"
        title="SQUAD"
        subtitle={isJa ? "認証確認中…" : "Checking access…"}
        onClose={() => navigation.goBack()}
      >
        <View style={styles.pad}>
          <ActivityIndicator color="#00F5FF" />
        </View>
      </MobilePageShell>
    );
  }

  if (!isAdmin) {
    return (
      <MobilePageShell
        eyebrow="ADMIN"
        title="SQUAD"
        subtitle={isJa ? "管理者のみ利用できます" : "Admins only"}
        onClose={() => navigation.goBack()}
      >
        <View style={styles.pad}>
          <Text style={styles.muted}>
            {isJa ? "権限がありません" : "Not authorized"}
          </Text>
        </View>
      </MobilePageShell>
    );
  }

  return (
    <MobilePageShell
      eyebrow="ADMIN"
      title="SQUAD"
      subtitle={
        isJa
          ? "募集・対戦期間を入れると週ラベルと Unit 表を自動設定します"
          : "Set recruit & battle windows; weeks and Unit tables auto-fill"
      }
      onClose={() => navigation.goBack()}
    >
      <ScrollView
        contentContainerStyle={styles.pad}
        keyboardShouldPersistTaps="handled"
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {createdId ? (
          <Text style={styles.ok}>
            {isJa ? "作成しました" : "Created"} · {createdId}
          </Text>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {isJa ? "新規大会" : "New battle"}
          </Text>
          <Field
            label={isJa ? "大会名" : "Name"}
            value={form.name}
            onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            placeholder="2026-11 Squad Battle"
          />
          <Field
            label="seasonKey"
            value={form.seasonKey}
            onChange={(v) => setForm((f) => ({ ...f, seasonKey: v }))}
            mono
          />
          <Field
            label={isJa ? "募集開始（JST）" : "Recruit start (JST)"}
            value={form.recruitStartAt}
            onChange={(v) => setForm((f) => ({ ...f, recruitStartAt: v }))}
            placeholder="YYYY-MM-DDTHH:mm"
            mono
          />
          <Field
            label={isJa ? "募集終了（JST）" : "Recruit end (JST)"}
            value={form.recruitEndAt}
            onChange={(v) => setForm((f) => ({ ...f, recruitEndAt: v }))}
            placeholder="YYYY-MM-DDTHH:mm"
            mono
          />
          <Field
            label={isJa ? "対戦開始（JST）" : "Battle start (JST)"}
            value={form.battleStartAt}
            onChange={(v) => setForm((f) => ({ ...f, battleStartAt: v }))}
            placeholder="YYYY-MM-DDTHH:mm"
            mono
          />
          <Field
            label={isJa ? "対戦終了（JST）" : "Battle end (JST)"}
            value={form.battleEndAt}
            onChange={(v) => setForm((f) => ({ ...f, battleEndAt: v }))}
            placeholder="YYYY-MM-DDTHH:mm"
            mono
          />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              {isJa
                ? "作成と同時に募集開始"
                : "Start recruiting on create"}
            </Text>
            <Switch
              value={form.startRecruiting}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, startRecruiting: v }))
              }
              trackColor={{
                false: "rgba(255,255,255,0.15)",
                true: "rgba(34,211,238,0.45)",
              }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.previewBox}>
            {preview.ok ? (
              <>
                <Text style={styles.previewText}>
                  weeks ({preview.schedule.weeklyLabels.length}):{" "}
                  {preview.schedule.weeklyLabels.join(", ")}
                </Text>
                <Text style={styles.previewText}>
                  monthly: {preview.schedule.monthlyRange.startKey} →{" "}
                  {preview.schedule.monthlyRange.endKey} (
                  {preview.schedule.monthlyRange.label})
                </Text>
                <Text style={styles.previewHint}>
                  {isJa
                    ? "Unit 表は設計デフォルトを自動セット"
                    : "Default Unit tables applied"}
                </Text>
              </>
            ) : (
              <Text style={styles.error}>{preview.error}</Text>
            )}
          </View>

          <Pressable
            onPress={() => void onCreate()}
            disabled={busy || !preview.ok || !form.name.trim()}
            style={({ pressed }) => [
              styles.primaryBtn,
              (busy || !preview.ok || !form.name.trim()) && styles.btnDisabled,
              pressed && { opacity: 0.9 },
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#ecfeff" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {isJa ? "大会を作成" : "Create battle"}
              </Text>
            )}
          </Pressable>
        </View>

        <Text style={styles.listTitle}>
          {isJa ? "既存大会" : "Existing battles"}
        </Text>
        {loading ? (
          <Text style={styles.muted}>
            {isJa ? "読み込み中…" : "Loading…"}
          </Text>
        ) : battles.length === 0 ? (
          <Text style={styles.muted}>
            {isJa ? "まだ大会がありません" : "No battles yet"}
          </Text>
        ) : (
          battles.map((b) => (
            <View key={b.id} style={styles.card}>
              <Text style={styles.cardTitle}>{b.name}</Text>
              <Text style={styles.monoMeta}>{b.id}</Text>
              <Text style={styles.meta}>
                phase={b.phase} · season={b.seasonKey} · weeks=
                {b.weeklyLabels?.length ?? 0}
              </Text>
              <Text style={styles.metaDim}>
                {isJa ? "募集" : "Recruit"} {fmtMs(b.recruitStartAtMs, isJa)} →{" "}
                {fmtMs(b.recruitEndAtMs, isJa)}
              </Text>
              <Text style={styles.metaDim}>
                {isJa ? "対戦" : "Battle"} {fmtMs(b.battleStartAtMs, isJa)} →{" "}
                {fmtMs(b.battleEndAtMs, isJa)}
              </Text>
              <View style={styles.phaseRow}>
                {PHASE_ACTIONS.map((a) => (
                  <Pressable
                    key={a.phase}
                    disabled={phaseBusyId === b.id}
                    onPress={() => void onPhase(b.id, a.phase)}
                    style={({ pressed }) => [
                      styles.phaseBtn,
                      phaseBusyId === b.id && styles.btnDisabled,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text style={styles.phaseBtnText}>
                      {isJa ? a.labelJa : a.labelEn}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </MobilePageShell>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.28)"
        autoCapitalize="none"
        autoCorrect={false}
        style={[styles.input, mono && styles.inputMono]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 48, gap: 12 },
  muted: { color: "rgba(255,255,255,0.45)", fontSize: 13 },
  error: {
    color: "#fecaca",
    fontSize: 13,
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.4)",
    backgroundColor: "rgba(244,63,94,0.12)",
    padding: 10,
    borderRadius: 12,
    overflow: "hidden",
  },
  ok: {
    color: "#a7f3d0",
    fontSize: 13,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.35)",
    backgroundColor: "rgba(16,185,129,0.12)",
    padding: 10,
    borderRadius: 12,
    overflow: "hidden",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    color: "rgba(165,243,252,0.95)",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  listTitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8,
  },
  field: { gap: 6 },
  fieldLabel: { color: "rgba(255,255,255,0.55)", fontSize: 12 },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 14,
  },
  inputMono: { fontFamily: "Menlo", fontSize: 13 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 4,
  },
  switchLabel: { color: "rgba(255,255,255,0.7)", fontSize: 13, flex: 1 },
  previewBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.28)",
    padding: 12,
    gap: 4,
  },
  previewText: { color: "rgba(165,243,252,0.85)", fontSize: 11 },
  previewHint: { color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 4 },
  primaryBtn: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.4)",
    backgroundColor: "rgba(6,182,212,0.18)",
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#ecfeff",
    fontSize: 14,
    fontWeight: "700",
  },
  btnDisabled: { opacity: 0.4 },
  cardTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  monoMeta: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    fontFamily: "Menlo",
  },
  meta: { color: "rgba(255,255,255,0.55)", fontSize: 12 },
  metaDim: { color: "rgba(255,255,255,0.38)", fontSize: 11 },
  phaseRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  phaseBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  phaseBtnText: { color: "rgba(255,255,255,0.78)", fontSize: 11 },
});
