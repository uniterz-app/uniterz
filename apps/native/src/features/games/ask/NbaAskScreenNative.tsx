/** UNITERZ AI チャット（アプリの使い方 + NBA スタッツ）。試合一覧ヘッダー右上から */
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import GamesNbaSubpageShellNative from "../GamesNbaSubpageShellNative";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../../../hooks/useNativeUserLanguage";
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";
import { splitNbaAskLinks } from "../../../../../../lib/nba/ask/nbaAskLinkify";
import { openProSubscribeNative } from "../../../navigation/navigationRef";
import { CYBER_SIDE_MENU_PANEL, CYBER_TAB_CYAN } from "../../../ui/cyberSideMenuNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import { nbaAskCopy } from "../../../../../../lib/nba/ask/nbaAskCopy";
import type {
  NbaAskStatus,
  NbaAskTurnClient,
} from "../../../../../../lib/nba/ask/nbaAskClient";
import { askNbaStatsNative, loadNbaAskStatusNative } from "./nbaAskApi";

const MAX_QUESTION_CHARS = 300;

export default function NbaAskScreenNative() {
  const navigation = useNavigation();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const lang = String(language ?? "ja");
  const copy = nbaAskCopy(lang);
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const [turns, setTurns] = useState<NbaAskTurnClient[]>([]);
  const [status, setStatus] = useState<NbaAskStatus | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const a = Keyboard.addListener(showEvt, () => setKeyboardOpen(true));
    const b = Keyboard.addListener(hideEvt, () => setKeyboardOpen(false));
    return () => {
      a.remove();
      b.remove();
    };
  }, []);

  useEffect(() => {
    if (!fUser) return;
    let cancelled = false;
    void loadNbaAskStatusNative().then((next) => {
      if (!cancelled && next) setStatus(next);
    });
    return () => {
      cancelled = true;
    };
  }, [fUser]);

  useEffect(() => {
    const id = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(id);
  }, [turns, busy, notice]);

  const unavailable = status != null && !status.available;
  /** 無料のスタッツ枠を使い切った（アプリの質問は続けられる） */
  const statsUsedUp = status != null && status.statsFreeRemaining === 0;

  async function send(raw: string) {
    const question = raw.trim().slice(0, MAX_QUESTION_CHARS);
    if (!question || busy || unavailable) return;
    if (!fUser) {
      setNotice(copy.signIn);
      return;
    }
    const next: NbaAskTurnClient[] = [...turns, { role: "user", content: question }];
    setTurns(next);
    setDraft("");
    setNotice(null);
    setBusy(true);
    const result = await askNbaStatsNative(next, lang);
    setBusy(false);
    if (result.ok) {
      setTurns((prev) => [...prev, { role: "assistant", content: result.answer }]);
      setStatus((prev) =>
        prev ? { ...prev, statsFreeRemaining: result.statsFreeRemaining } : prev
      );
      return;
    }
    // 送れなかった質問は入力欄に戻す（打ち直さなくていいように）
    setTurns(turns);
    setDraft(question);
    if (result.error === "unavailable") {
      setStatus((prev) => (prev ? { ...prev, available: false } : prev));
    } else if (result.error === "rate_limited") {
      setNotice(copy.rateLimited);
    } else if (result.error === "slow_down") {
      setNotice(copy.slowDown);
    } else if (result.error === "auth") {
      setNotice(copy.signIn);
    } else {
      setNotice(copy.failed);
    }
  }

  const canSend = draft.trim().length > 0 && !busy && !unavailable;

  return (
    <GamesNbaSubpageShellNative
      title={copy.title}
      eyebrow={copy.eyebrow}
      onBack={() => navigation.goBack()}
      scroll={false}
      contentStyle={styles.shell}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.thread}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {unavailable ? (
            <View style={styles.intro}>
              <MaterialCommunityIcons name="progress-clock" size={30} color="rgba(0,245,255,0.55)" />
              <Text style={styles.gateTitle}>{copy.unavailable}</Text>
            </View>
          ) : turns.length === 0 ? (
            <View style={styles.intro}>
              <MaterialCommunityIcons
                name="chat-processing-outline"
                size={30}
                color="rgba(0,245,255,0.55)"
              />
              <Text style={styles.introText}>{copy.intro}</Text>
              <View style={styles.suggestions}>
                {copy.suggestions.map((s) => (
                  <Pressable
                    key={s}
                    disabled={busy}
                    onPress={() => void send(s)}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                  >
                    <Text style={styles.chipText}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {turns.map((t, i) => (
            <View
              key={i}
              style={[styles.bubble, t.role === "user" ? styles.bubbleUser : styles.bubbleBot]}
            >
              <Text style={styles.bubbleText} selectable>
                {splitNbaAskLinks(t.content).map((part, j) =>
                  part.kind === "link" ? (
                    <Text
                      key={j}
                      style={styles.link}
                      onPress={() => void Linking.openURL(part.url)}
                    >
                      {part.url}
                    </Text>
                  ) : (
                    <Text key={j}>{part.text}</Text>
                  )
                )}
              </Text>
            </View>
          ))}

          {busy ? (
            <View style={[styles.bubble, styles.bubbleBot, styles.thinking]}>
              <ActivityIndicator size="small" color={CYBER_TAB_CYAN} />
              <Text style={styles.thinkingText}>{copy.thinking}</Text>
            </View>
          ) : null}

          {notice ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          ) : null}
        </ScrollView>

        {unavailable ? (
          <View style={{ height: bottomContentReserveY }} />
        ) : (
          <View
            style={[
              styles.inputBar,
              { paddingBottom: keyboardOpen ? 8 : bottomContentReserveY },
            ]}
          >
            {statsUsedUp ? (
              <View style={styles.proNudge}>
                <Text style={styles.proNudgeText}>{copy.statsUsedUp}</Text>
                <Pressable
                  onPress={openProSubscribeNative}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.proBtn, pressed && styles.chipPressed]}
                >
                  <Text style={styles.proBtnText}>{copy.proCta}</Text>
                </Pressable>
              </View>
            ) : status?.statsFreeRemaining != null ? (
              <Text style={styles.quota}>{copy.statsFreeRemaining(status.statsFreeRemaining)}</Text>
            ) : null}
            <View style={styles.inputRow}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={copy.placeholder}
                placeholderTextColor="rgba(255,255,255,0.45)"
                selectionColor={CYBER_TAB_CYAN}
                style={styles.input}
                multiline
                maxLength={MAX_QUESTION_CHARS}
                accessibilityLabel={copy.open}
              />
              <Pressable
                onPress={() => void send(draft)}
                disabled={!canSend}
                accessibilityRole="button"
                accessibilityLabel={copy.send}
                accessibilityState={{ disabled: !canSend }}
                style={({ pressed }) => [
                  styles.sendBtn,
                  !canSend && styles.sendBtnDisabled,
                  pressed && canSend && styles.chipPressed,
                ]}
              >
                <MaterialCommunityIcons
                  name="send"
                  size={18}
                  color={canSend ? "#050508" : "rgba(0,245,255,0.5)"}
                />
              </Pressable>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </GamesNbaSubpageShellNative>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  flex: { flex: 1 },
  thread: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 10,
  },
  intro: {
    alignItems: "center",
    gap: 12,
    paddingTop: 24,
    paddingHorizontal: 12,
  },
  introText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  gateTitle: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  chip: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.35)",
    borderRadius: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipPressed: { opacity: 0.7 },
  chipText: {
    color: "rgba(165,243,252,0.9)",
    fontSize: 13,
    fontWeight: "600",
  },
  bubble: {
    maxWidth: "86%",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    borderColor: "rgba(0,245,255,0.45)",
    backgroundColor: "rgba(0,245,255,0.1)",
  },
  bubbleBot: {
    alignSelf: "flex-start",
    borderColor: CYBER_SIDE_MENU_PANEL.innerBorderColor,
    backgroundColor: "rgba(4,16,24,0.6)",
  },
  bubbleText: {
    color: "rgba(255,255,255,0.94)",
    fontSize: 14,
    lineHeight: 21,
  },
  link: {
    color: "#00F5FF",
    textDecorationLine: "underline",
  },
  thinking: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  thinkingText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
  },
  notice: {
    alignSelf: "stretch",
    alignItems: "center",
    paddingVertical: 12,
  },
  noticeText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    textAlign: "center",
  },
  inputBar: {
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,245,255,0.16)",
    backgroundColor: "#05080e",
  },
  quota: {
    alignSelf: "flex-end",
    fontFamily: METRIC_FONT,
    fontSize: 10,
    letterSpacing: 0.6,
    color: "rgba(0,245,255,0.7)",
  },
  proNudge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  proNudgeText: {
    flex: 1,
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    lineHeight: 15,
  },
  proBtn: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: 14,
    backgroundColor: CYBER_TAB_CYAN,
  },
  proBtnText: {
    fontFamily: METRIC_FONT,
    color: "#050508",
    fontSize: 12,
    letterSpacing: 1,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.28)",
    backgroundColor: "rgba(0,0,0,0.5)",
    color: "#fff",
    fontSize: 15,
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 11,
  },
  sendBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CYBER_TAB_CYAN,
  },
  sendBtnDisabled: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.3)",
  },
});
