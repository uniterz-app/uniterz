/**
 * トレード Buzz / 確定トレード。
 * Buzz を見るとき Free はリワード広告（サーバーで解除を確認・日本時間 0 時まで有効）、Pro はスキップ。確定タブは広告なし。
 */
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MobilePageShell from "../../../profile/mobileScreens/MobilePageShell";
import { useFirebaseUser } from "../../../../auth/FirebaseUserProvider";
import { useNativeLanguage } from "../../../../i18n/NativeLanguageProvider";
import { useNativeUserPlan } from "../../../../hooks/useNativeUserPlan";
import TradeBuzzIntroModalNative from "./TradeBuzzIntroModalNative";
import {
  hasSeenTradeBuzzIntroNative,
  markTradeBuzzIntroSeenNative,
} from "./tradeBuzzIntroSeenNative";
import { openProSubscribeNative } from "../../../../navigation/navigationRef";
import {
  showTradeBuzzRewardedAdNative,
  type ProPickRewardedResult,
} from "../../../ads/proPickRewardedAdNative";
import { startTradeBuzzUnlockPollNative } from "../../../ads/rewardedAdUnlockPollNative";
import { fetchTradeBuzzUnlockNative } from "./tradeBuzzUnlockApiNative";
import {
  hydrateTradeBuzzAdEarned,
  peekTradeBuzzAdEarned,
  setTradeBuzzAdEarned,
} from "./tradeBuzzAdSessionNative";
import { waitHostDismissedForRewardedAd } from "../../scheduleAfterPredictModalDismissed";
import NbaTradeBuzzFeedNative from "./NbaTradeBuzzFeedNative";
import NbaTradeConfirmedFeedNative from "./NbaTradeConfirmedFeedNative";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../../../rankings/CyberSlantedTabNative";
import { cyberAlert } from "../../../../components/cyberAlert";
import { useBottomTabBarInsets } from "../../../../navigation/useBottomTabBarInsets";
import { useTradeBuzzUnreadNative } from "./useTradeBuzzUnreadNative";
import BuzzTeamFilterRowNative from "./BuzzTeamFilterRowNative";
import { useMyNbaFavoritesNative } from "../../../profile/useMyNbaFavoritesNative";
import {
  nbaConfirmedTradeTeamAbbrs,
  nbaFavoriteTeamAbbr,
  nbaTradeBuzzItemTeamAbbrs,
  sortNbaTeamFilterAbbrs,
  uniqueNbaTeamAbbrs,
} from "../../../../../../../lib/predict/nbaTradeBuzzTeamFilter";

type Mode = "buzz" | "confirmed";

type Props = {
  onClose: () => void;
  /**
   * 画面を一度閉じてから広告を出す（iOS でシートの × と報酬ボタンが重ならないように）。
   * 無いときはこの画面のまま出す（説明モーダルだけ先に閉じる）。
   */
  presentRewardedAd?: (userId: string) => Promise<ProPickRewardedResult>;
};

export default function TradeBuzzPreviewScreenNative({
  onClose,
  presentRewardedAd,
}: Props) {
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeLanguage();
  const { isPro: planPro } = useNativeUserPlan(fUser?.uid);
  const [introOpen, setIntroOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("buzz");
  const [teamAbbr, setTeamAbbr] = useState<string | null>(null);
  /** DEV だけ Free / Pro を切り替えてゲートを確認する（実プランが Pro でも Free に落とせる） */
  const [devPlan, setDevPlan] = useState<boolean | null>(null);
  const isPro = devPlan ?? planPro;
  /** 今日（日本時間）の解除があるか（サーバー、または端末に残した今日の広告） */
  const [buzzUnlocked, setBuzzUnlocked] = useState(() => peekTradeBuzzAdEarned());
  /** 端末・サーバーの今日の解除を確認するまでゲートを出さない */
  const [unlockReady, setUnlockReady] = useState(() => peekTradeBuzzAdEarned());
  /** 広告 SDK の読み込み〜表示中 */
  const [adPlaying, setAdPlaying] = useState(false);

  const nowMs = useMemo(() => Date.now(), []);
  const { markSeen, items, confirmed, asOfJst } = useTradeBuzzUnreadNative({
    body: true,
  });
  const { favorites } = useMyNbaFavoritesNative();
  const favoriteAbbr = nbaFavoriteTeamAbbr(favorites.favoriteNbaTeamId);
  const teamAbbrs = useMemo(
    () =>
      sortNbaTeamFilterAbbrs(
        uniqueNbaTeamAbbrs([
          ...items.map(nbaTradeBuzzItemTeamAbbrs),
          ...confirmed.map(nbaConfirmedTradeTeamAbbrs),
        ]),
        favoriteAbbr
      ),
    [items, confirmed, favoriteAbbr]
  );

  const canSeeBuzz = isPro || buzzUnlocked;

  useEffect(() => {
    let cancelled = false;
    void hasSeenTradeBuzzIntroNative().then((seen) => {
      if (!cancelled && !seen) setIntroOpen(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const dismissIntro = () => {
    setIntroOpen(false);
    void markTradeBuzzIntroSeenNative();
  };

  useEffect(() => {
    if (canSeeBuzz) markSeen();
  }, [canSeeBuzz, markSeen]);

  // 開いたとき、端末に今日の解除があるか → サーバーに今日の解除があるか（前に見ていれば広告は出さない）
  useEffect(() => {
    if (__DEV__ && devPlan === false) {
      setUnlockReady(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      const local = await hydrateTradeBuzzAdEarned();
      if (cancelled) return;
      if (local) setBuzzUnlocked(true);
      if (!fUser) {
        setUnlockReady(true);
        return;
      }
      const state = await fetchTradeBuzzUnlockNative();
      if (cancelled) return;
      if (state?.unlocked) {
        setTradeBuzzAdEarned(true);
        setBuzzUnlocked(true);
      }
      setUnlockReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [fUser?.uid, devPlan]);

  const openBuzzTab = () => {
    setMode("buzz");
  };

  const markBuzzAdSession = () => {
    setTradeBuzzAdEarned(true);
    setBuzzUnlocked(true);
    void startTradeBuzzUnlockPollNative();
  };

  const watchAd = async () => {
    if (!fUser || adPlaying) return;
    setAdPlaying(true);
    try {
      if (introOpen) {
        setIntroOpen(false);
        await waitHostDismissedForRewardedAd(280);
      }
      const result = presentRewardedAd
        ? await presentRewardedAd(fUser.uid)
        : await showTradeBuzzRewardedAdNative({
            userId: fUser.uid,
            onPresented: markBuzzAdSession,
          });
      if (result === "error" && !peekTradeBuzzAdEarned()) {
        cyberAlert("広告", "広告を読み込めませんでした。少し待ってからもう一度お試しください。");
        return;
      }
      markBuzzAdSession();
    } finally {
      setAdPlaying(false);
    }
  };

  return (
    <MobilePageShell title="トレード Buzz" appBackground onClose={onClose}>
      <TradeBuzzIntroModalNative open={introOpen} language={language} onClose={dismissIntro} />
      <ScrollView
        contentContainerStyle={[
          styles.pad,
          { paddingBottom: bottomContentReserveY + 24 },
        ]}
      >
        {__DEV__ ? (
          <View style={styles.devRow}>
            <Pressable
              onPress={() => {
                const next = !(devPlan ?? planPro);
                setDevPlan(next);
                if (!next) setBuzzUnlocked(false);
              }}
              style={styles.banner}
              accessibilityRole="button"
            >
              <Text style={styles.toggle}>
                {isPro ? "DEV · Pro" : "DEV · Free"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setIntroOpen(true)}
              style={styles.banner}
              accessibilityRole="button"
            >
              <Text style={styles.toggle}>DEV · 説明</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={{ marginBottom: 14 }}>
          <CyberSlantedTabBarNative fill>
            <CyberSlantedTabNative
              label="Buzz"
              active={mode === "buzz"}
              onPress={openBuzzTab}
              compact
              fontWeight="700"
            />
            <CyberSlantedTabNative
              label="確定"
              active={mode === "confirmed"}
              onPress={() => setMode("confirmed")}
              compact
              fontWeight="700"
            />
          </CyberSlantedTabBarNative>
        </View>

        {canSeeBuzz || mode === "confirmed" ? (
          <View style={{ marginBottom: 14 }}>
            <BuzzTeamFilterRowNative
              abbrs={teamAbbrs}
              selected={teamAbbr}
              favoriteAbbr={favoriteAbbr}
              onSelect={setTeamAbbr}
            />
          </View>
        ) : null}

        {mode === "buzz" ? (
          canSeeBuzz ? (
            <NbaTradeBuzzFeedNative
              items={items}
              teamAbbr={teamAbbr}
              nowMs={nowMs}
              asOfLabel={asOfJst}
              showAdSlot={false}
            />
          ) : (
            <View style={styles.gate}>
              <Text style={styles.gateEyebrow}>AD · FREE</Text>
              <Text style={styles.gateTitle}>Buzz を見る</Text>
              <Text style={styles.gateBody}>
                短い動画広告のあと、トレード噂のまとめを開けます。今日（日本時間）はもう広告なしで見られます。Pro は常に広告なし。
              </Text>
              <Pressable
                onPress={() => void watchAd()}
                disabled={adPlaying || !unlockReady}
                style={[
                  styles.gateBtn,
                  adPlaying || !unlockReady ? styles.gateBtnBusy : null,
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.gateBtnText}>
                  {adPlaying || !unlockReady
                    ? "読み込んでいます…"
                    : "広告を見て開く"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (__DEV__) setDevPlan(true);
                  else openProSubscribeNative("trade_buzz");
                }}
                style={styles.gateProLink}
              >
                <Text style={styles.gateProText}>
                  {__DEV__ ? "Pro にする（広告スキップ）" : "Pro で広告なし"}
                </Text>
              </Pressable>
            </View>
          )
        ) : null}

        {mode === "confirmed" ? (
          <NbaTradeConfirmedFeedNative trades={confirmed} teamAbbr={teamAbbr} />
        ) : null}
      </ScrollView>
    </MobilePageShell>
  );
}

const OX = "Oxanium_700Bold";

const styles = StyleSheet.create({
  pad: {
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  devRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
  },
  banner: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  toggle: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "rgba(165,243,252,0.85)",
    textTransform: "uppercase",
  },
  gate: {
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.28)",
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: 16,
    gap: 8,
  },
  gateEyebrow: {
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "rgba(252,211,77,0.8)",
    textTransform: "uppercase",
  },
  gateTitle: {
    fontFamily: OX,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: "#fff",
    textTransform: "uppercase",
  },
  gateBody: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.55)",
    marginBottom: 4,
  },
  gateBtn: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.5)",
    backgroundColor: "rgba(252,211,77,0.18)",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  gateBtnBusy: {
    opacity: 0.6,
  },
  gateBtnText: {
    fontFamily: OX,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textAlign: "center",
    color: "rgba(255,251,235,0.95)",
    textTransform: "uppercase",
  },
  gateProLink: {
    alignSelf: "center",
    paddingVertical: 8,
  },
  gateProText: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "rgba(0,245,255,0.85)",
    textTransform: "uppercase",
  },
});
