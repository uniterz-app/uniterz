/** UNITERZ AI チャット（アプリの使い方 + NBA スタッツ）。試合一覧ヘッダー右上から */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Animated,
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
import { useNavigation, type CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useBrandShelfSpaceNative } from "../../../navigation/useBrandShelfSpaceNative";
import GamesNbaSubpageShellNative from "../GamesNbaSubpageShellNative";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../../../hooks/useNativeUserLanguage";
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";
import { splitNbaAskLinks } from "../../../../../../lib/nba/ask/nbaAskLinkify";
import { openProSubscribeNative } from "../../../navigation/navigationRef";
import { CYBER_TAB_CYAN } from "../../../ui/cyberSideMenuNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import { nbaAskCopy } from "../../../../../../lib/nba/ask/nbaAskCopy";
import { nbaAskLooksLikeStats, type NbaAskBoard } from "../../../../../../lib/nba/ask/nbaAskBoard";
import {
  nbaAskDestinationLabel,
  type NbaAskDestinationId,
} from "../../../../../../lib/nba/ask/nbaAskDestinations";
import type { GamesStackParamList, MainTabParamList } from "../../../navigation/types";
import type {
  NbaAskStatus,
  NbaAskTurnClient,
} from "../../../../../../lib/nba/ask/nbaAskClient";
import { askNbaStatsNative, loadNbaAskStatusNative } from "./nbaAskApi";

const MAX_QUESTION_CHARS = 300;

type AskNav = CompositeNavigationProp<
  NativeStackNavigationProp<GamesStackParamList, "NbaAsk">,
  BottomTabNavigationProp<MainTabParamList>
>;

/** 答えの下のボタン。機能の画面へ移す */
function openNbaAskDestination(navigation: AskNav, id: NbaAskDestinationId) {
  switch (id) {
    case "games":
      navigation.navigate("GamesHome");
      return;
    case "stats":
      navigation.navigate("LeagueStats", { tab: "team" });
      return;
    case "rankings":
      navigation.navigate("RankingsTab", { screen: "RankingsHome" });
      return;
    case "pro":
      openProSubscribeNative();
      return;
    case "notifications":
      navigation.navigate("ProfileTab", { screen: "NotificationSettings" });
      return;
    case "invite":
      navigation.navigate("ProfileTab", { screen: "Invite" });
      return;
    case "squads":
      navigation.navigate("RankingsTab", { screen: "SquadBattle" });
      return;
  }
}

export default function NbaAskScreenNative() {
  const navigation = useNavigation<AskNav>();
  const { shelfSpace } = useBrandShelfSpaceNative();

  useLayoutEffect(() => {
    navigation.setOptions({
      contentStyle: {
        backgroundColor: "#07090e",
        paddingTop: 0,
      },
    });
  }, [navigation]);
  const { fUser } = useFirebaseUser();
  const { language, timeZone } = useNativeUserLanguage(fUser?.uid);
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
    const result = await askNbaStatsNative(next, lang, timeZone);
    setBusy(false);
    if (result.ok) {
      setTurns((prev) => [
        ...prev,
        { role: "assistant", content: result.answer, opens: result.opens, board: result.board },
      ]);
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

  const headerBand = 72;
  const glowHeight = shelfSpace + headerBand + 280;
  const glowHold = (shelfSpace + headerBand) / glowHeight;

  return (
    <View style={styles.flex}>
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(0,245,255,0.18)", "rgba(0,245,255,0.18)", "transparent"]}
        locations={[0, glowHold, 1]}
        style={[styles.pageGlow, { height: glowHeight }]}
      />
      <GamesNbaSubpageShellNative
        title={copy.title}
        eyebrow={copy.eyebrow}
        onBack={() => navigation.goBack()}
        scroll={false}
        headerTransparent
        rootStyle={{ paddingTop: shelfSpace }}
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
            <Text style={styles.gateTitle}>{copy.unavailable}</Text>
          ) : turns.length === 0 ? (
            <View>
              {copy.suggestions.map((s) => (
                <Pressable
                  key={s}
                  disabled={busy}
                  onPress={() => void send(s)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.prompt, pressed && styles.chipPressed]}
                >
                  <Text style={styles.promptText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {turns.map((t, i) => {
            const mine = t.role === "user";
            const statsQuestion = mine && nbaAskLooksLikeStats(t.content);
            if (t.board) {
              return (
                <View key={i} style={styles.boardWrap}>
                  <StatsBoardNative board={t.board} />
                  {t.opens?.map((id) => (
                    <Pressable
                      key={id}
                      onPress={() => openNbaAskDestination(navigation, id)}
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.openBtn, pressed && styles.chipPressed]}
                    >
                      <Text style={styles.openBtnText}>{nbaAskDestinationLabel(id, lang)}</Text>
                    </Pressable>
                  ))}
                </View>
              );
            }
            return (
              <View key={i} style={[styles.turn, statsQuestion ? styles.turnBot : mine ? styles.turnUser : styles.turnBot]}>
                <View
                  style={[
                    styles.bubble,
                    statsQuestion ? styles.bubbleStats : mine ? styles.bubbleUser : styles.bubbleBot,
                  ]}
                >
                  <Text style={[styles.bubbleText, mine && !statsQuestion && styles.bubbleTextMine]} selectable>
                    {splitNbaAskLinks(t.content).map((part, j) =>
                      part.kind === "link" ? (
                        <Text
                          key={j}
                          style={[styles.link, mine && styles.linkMine]}
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
                {t.role === "assistant"
                  ? t.opens?.map((id) => (
                      <Pressable
                        key={id}
                        onPress={() => openNbaAskDestination(navigation, id)}
                        accessibilityRole="button"
                        style={({ pressed }) => [styles.openBtn, pressed && styles.chipPressed]}
                      >
                        <Text style={styles.openBtnText}>{nbaAskDestinationLabel(id, lang)}</Text>
                      </Pressable>
                    ))
                  : null}
              </View>
            );
          })}

          {busy ? <AnswerSkeletonNative label={copy.composing} /> : null}

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
                placeholderTextColor="rgba(255,255,255,0.42)"
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
                  color={canSend ? "#041014" : "rgba(255,255,255,0.35)"}
                />
              </Pressable>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </GamesNbaSubpageShellNative>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  flex: { flex: 1 },
  thread: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    gap: 14,
  },
  gateTitle: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  },
  prompt: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.12)",
    paddingVertical: 14,
  },
  chipPressed: { opacity: 0.55 },
  promptText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 15,
    lineHeight: 22,
  },
  turn: {
    maxWidth: "84%",
    gap: 8,
  },
  turnUser: { alignSelf: "flex-end" },
  turnBot: { alignSelf: "flex-start" },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  openBtn: {
    alignSelf: "flex-start",
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: 14,
    backgroundColor: CYBER_TAB_CYAN,
  },
  openBtnText: {
    fontFamily: METRIC_FONT,
    color: "#050508",
    fontSize: 12,
    letterSpacing: 0.6,
  },
  bubbleUser: {
    backgroundColor: CYBER_TAB_CYAN,
  },
  bubbleStats: {
    alignSelf: "flex-start",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: CYBER_TAB_CYAN,
  },
  boardWrap: {
    alignSelf: "stretch",
  },
  preparing: {
    color: CYBER_TAB_CYAN,
    fontSize: 13,
  },
  boardCard: {
    paddingVertical: 4,
  },
  boardEyebrow: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    letterSpacing: 1.4,
  },
  boardColumns: {
    flexDirection: "row",
    marginTop: 12,
  },
  boardValues: {
    flexDirection: "row",
    marginTop: 2,
  },
  boardHead: {
    flex: 1,
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
  },
  boardValue: {
    flex: 1,
    fontFamily: METRIC_FONT,
    color: "#fff",
    fontSize: 28,
    lineHeight: 32,
  },
  boardMeta: {
    marginTop: 12,
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
  },
  boardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  boardLabel: {
    width: 92,
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  boardCell: {
    flex: 1,
    textAlign: "center",
    fontFamily: METRIC_FONT,
    color: "#fff",
    fontSize: 18,
  },
  bubbleBot: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  bubbleText: {
    color: "rgba(255,255,255,0.94)",
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTextMine: {
    color: "#041014",
  },
  link: {
    color: "#00F5FF",
    textDecorationLine: "underline",
  },
  linkMine: {
    color: "#041014",
  },
  skeletonWrap: {
    alignSelf: "stretch",
    maxWidth: "92%",
    gap: 12,
  },
  skeletonBar: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  skeletonBarDim: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  skeletonTrack: {
    height: 8,
    width: "92%",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  skeletonScan: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "34%",
    backgroundColor: CYBER_TAB_CYAN,
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
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: "#07090e",
  },
  pageGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  quota: {
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(255,255,255,0.45)",
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
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 110,
    color: "#fff",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
  },
  sendBtn: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CYBER_TAB_CYAN,
  },
  sendBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});

function AnswerSkeletonNative({ label }: { label: string }) {
  const scan = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(scan, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [scan]);
  const translateX = scan.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 280],
  });
  return (
    <View style={styles.skeletonWrap} accessibilityRole="progressbar">
      <Text style={styles.preparing}>{label}</Text>
      <View style={[styles.skeletonBar, { width: "78%" }]} />
      <View style={styles.skeletonTrack}>
        <Animated.View style={[styles.skeletonScan, { transform: [{ translateX }] }]} />
      </View>
      <View style={[styles.skeletonBarDim, { width: "64%" }]} />
    </View>
  );
}

function StatsBoardNative({ board }: { board: NbaAskBoard }) {
  const single = board.rows.length === 1 ? board.rows[0] : null;
  return (
    <View style={styles.boardCard}>
      {single ? (
        <>
          <Text style={styles.boardEyebrow}>{single.label}</Text>
          <View style={styles.boardColumns}>
            {board.columns.map((column) => (
              <Text key={column} style={styles.boardHead}>
                {column}
              </Text>
            ))}
          </View>
          <View style={styles.boardValues}>
            {single.cells.map((value, index) => (
              <Text key={index} style={styles.boardValue}>
                {value}
              </Text>
            ))}
          </View>
        </>
      ) : (
        <>
          <View style={styles.boardRow}>
            <Text style={styles.boardLabel}> </Text>
            {board.columns.map((column) => (
              <Text key={column} style={[styles.boardHead, { textAlign: "center" }]}>
                {column}
              </Text>
            ))}
          </View>
          {board.rows.map((row, rowIndex) => (
            <View key={`${row.label}-${rowIndex}`} style={styles.boardRow}>
              <Text style={styles.boardLabel} numberOfLines={2}>
                {row.label}
              </Text>
              {row.cells.map((value, index) => (
                <Text key={index} style={styles.boardCell}>
                  {value}
                </Text>
              ))}
            </View>
          ))}
        </>
      )}
      {board.note ? <Text style={styles.boardMeta}>{board.note}</Text> : null}
    </View>
  );
}
