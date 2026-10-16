/** Web `RankingCommentEditor` 相当 — PRO LEAGUE 自分のひとことの表示・編集バー */
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  RANKING_COMMENT_MAX_CHARS,
  normalizeRankingComment,
  rankingCommentCopy,
  rankingCommentLength,
  validateRankingComment,
} from "../../../../../lib/rankings/rankingComment";
import {
  fetchMeRankingCommentNative,
  saveMeRankingCommentNative,
} from "./rankingCommentApiNative";
import { CYBER_TAB_CYAN } from "./CyberSlantedTabNative";

type Props = {
  language: string;
  /** 保存後の自分のひとこと（空 = 削除）。行の即時反映用 */
  onSaved?: (comment: string) => void;
};

export default function RankingCommentEditorNative({ language, onSaved }: Props) {
  const copy = useMemo(() => rankingCommentCopy(language), [language]);
  const [loaded, setLoaded] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchMeRankingCommentNative()
      .then((r) => {
        if (!alive) return;
        setIsPro(r.isPro);
        setComment(r.comment);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!loaded || !isPro) return null;

  const draftLength = rankingCommentLength(normalizeRankingComment(draft));
  const overLimit = draftLength > RANKING_COMMENT_MAX_CHARS;

  async function save() {
    const next = normalizeRankingComment(draft);
    const invalid = validateRankingComment(next);
    if (invalid) {
      setError(copy.error(invalid));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const saved = await saveMeRankingCommentNative(next);
      setComment(saved);
      setEditing(false);
      onSaved?.(saved);
    } catch (e) {
      setError(copy.error(e instanceof Error ? e.message : null));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.box}>
      {editing ? (
        <View style={styles.editCol}>
          <View style={styles.inputRow}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              autoFocus
              placeholder={copy.placeholder}
              placeholderTextColor="rgba(255,255,255,0.3)"
              returnKeyType="done"
              onSubmitEditing={() => {
                if (!busy && !overLimit) void save();
              }}
              style={styles.input}
            />
            <Text style={[styles.counter, overLimit ? styles.counterOver : null]}>
              {draftLength}/{RANKING_COMMENT_MAX_CHARS}
            </Text>
          </View>
          <Text style={styles.note}>{copy.note}</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Pressable
              disabled={busy}
              onPress={() => {
                setEditing(false);
                setError(null);
              }}
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
            >
              <Text style={styles.cancelText}>{copy.cancel}</Text>
            </Pressable>
            <Pressable
              disabled={busy || overLimit}
              onPress={() => void save()}
              style={({ pressed }) => [
                styles.saveBtn,
                (busy || overLimit) && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.saveText}>{copy.save}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={() => {
            setDraft(comment);
            setError(null);
            setEditing(true);
          }}
          style={({ pressed }) => [styles.viewRow, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.label}>{copy.label}</Text>
          <Text
            style={[styles.current, !comment && styles.currentEmpty]}
            numberOfLines={1}
          >
            {comment || copy.emptyPrompt}
          </Text>
          <Text style={styles.edit}>{copy.edit}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  viewRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(0,245,255,0.8)",
  },
  current: { flex: 1, minWidth: 0, fontSize: 12, color: "rgba(255,255,255,0.85)" },
  currentEmpty: { color: "rgba(255,255,255,0.4)" },
  edit: { fontSize: 11, color: "rgba(255,255,255,0.5)" },
  editCol: { gap: 8 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
    color: "#fff",
  },
  counter: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    fontVariant: ["tabular-nums"],
  },
  counterOver: { color: "#fda4af" },
  note: { fontSize: 10, lineHeight: 16, color: "rgba(255,255,255,0.45)" },
  error: { fontSize: 11, lineHeight: 16, color: "#fda4af" },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4 },
  cancelText: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  saveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: CYBER_TAB_CYAN,
  },
  saveText: { fontSize: 12, fontWeight: "700", color: "#050508" },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.75 },
});
