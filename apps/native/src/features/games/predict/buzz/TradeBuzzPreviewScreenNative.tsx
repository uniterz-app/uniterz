/**
 * トレード Buzz / 確定トレード。
 * Buzz を見るとき Free はリワード広告（サーバーで解除を確認・日本時間 0 時まで有効）、Pro はスキップ。確定タブは広告なし。
 */
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MobilePageShell from "../../../profile/mobileScreens/MobilePageShell";
import { useFirebaseUser } from "../../../../auth/FirebaseUserProvider";
import { useNativeUserPlan } from "../../../../hooks/useNativeUserPlan";
import { openProSubscribeNative } from "../../../../navigation/navigationRef";
import { showTradeBuzzRewardedAdNative } from "../../../ads/proPickRewardedAdNative";
import { fetchTradeBuzzUnlockNative } from "./tradeBuzzUnlockApiNative";
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
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function TradeBuzzPreviewScreenNative({ onClose }: Props) {
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const { fUser } = useFirebaseUser();
  const { isPro: planPro } = useNativeUserPlan(fUser?.uid);
  const [mode, setMode] = useState<Mode>("buzz");
  const [teamAbbr, setTeamAbbr] = useState<string | null>(null);
  /** DEV だけ Free / Pro を切り替えてゲートを確認する */
  const [devPro, setDevPro] = useState(false);
  const isPro = planPro || (__DEV__ && devPro);
  /** 今日（日本時間）の解除があるか（サーバーの判定） */
  const [buzzUnlocked, setBuzzUnlocked] = useState(false);
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
    if (canSeeBuzz) markSeen();
  }, [canSeeBuzz, markSeen]);

  // 開いたとき、サーバーに今日の解除があるか確認する（前に見ていれば広告は出さない）
  useEffect(() => {
    if (!fUser) return;
    let cancelled = false;
    void (async () => {
      const state = await fetchTradeBuzzUnlockNative();
      if (!cancelled && state?.unlocked) setBuzzUnlocked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [fUser?.uid]);

  const openBuzzTab = () => {
    setMode("buzz");
  };

  const watchAd = async () => {
    if (!fUser || adPlaying) return;
    setAdPlaying(true);
    try {
      // Buzz 専用の広告ユニット（PRO PICK とは別）
      const result = await showTradeBuzzRewardedAdNative({ userId: fUser.uid });
      if (result === "error") {
        cyberAlert("広告", "広告を読み込めませんでした。少し待ってからもう一度お試しください。");
        return;
      }
      if (result !== "earned") return;
      // 報酬は AdMob の SSV で少し遅れて届く。サーバーで解除が見えるまで待つ（最大約 20 秒）
      for (let i = 0; i < 10; i++) {
        const state = await fetchTradeBuzzUnlockNative();
        if (state?.unlocked) {
          setBuzzUnlocked(true);
          return;
        }
        await sleep(2000);
      }
      cyberAlert(
        "確認中",
        "広告の確認に少し時間がかかっています。しばらくしてから開き直してください。"
      );
    } finally {
      setAdPlaying(false);
    }
  };

  return (
    <MobilePageShell title="トレード Buzz" appBackground onClose={onClose}>
      <ScrollView
        contentContainerStyle={[
          styles.pad,
          { paddingBottom: bottomContentReserveY + 24 },
        ]}
      >
        {__DEV__ ? (
          <Pressable
            onPress={() => setDevPro((v) => !v)}
            style={styles.banner}
            accessibilityRole="button"
          >
            <Text style={styles.toggle}>
              {isPro ? "DEV · Pro" : "DEV · Free"}
            </Text>
          </Pressable>
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
                disabled={adPlaying}
                style={[styles.gateBtn, adPlaying ? styles.gateBtnBusy : null]}
                accessibilityRole="button"
              >
                <Text style={styles.gateBtnText}>
                  {adPlaying ? "再生中…" : "広告を見て開く"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (__DEV__) setDevPro(true);
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
  banner: {
    alignSelf: "flex-start",
    marginBottom: 12,
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
