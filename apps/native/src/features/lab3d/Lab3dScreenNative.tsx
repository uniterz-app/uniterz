/**
 * __DEV__ 3D LAB — 3D の見せ方のデモ。データは demoData/ のスナップショット（本番から読み取りのみ）。
 */
import { useCallback, useMemo, useState, type ComponentType } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { METRIC_FONT } from "../rankings/rankingsUiTheme";
import { abbr, LAB_BG, LabStageNative, portraitK, type LabHud, type LabSceneProps, type LabStageProps } from "./lab3dKitNative";
import Lab3dGalaxySceneNative from "./scenes/Lab3dGalaxySceneNative";
import Lab3dShotsSceneNative, { LAB_SHOT_PLAYERS } from "./scenes/Lab3dShotsSceneNative";
import Lab3dTunnelSceneNative from "./scenes/Lab3dTunnelSceneNative";
import Lab3dCitySceneNative from "./scenes/Lab3dCitySceneNative";
import Lab3dSolarSceneNative from "./scenes/Lab3dSolarSceneNative";
import Lab3dCrystalSceneNative, { LAB_CRYSTAL_MATCHUPS } from "./scenes/Lab3dCrystalSceneNative";
import Lab3dMountainSceneNative from "./scenes/Lab3dMountainSceneNative";
import Lab3dGlobeSceneNative, { LAB_GLOBE_DAYS } from "./scenes/Lab3dGlobeSceneNative";
import Lab3dMapSceneNative from "./scenes/Lab3dMapSceneNative";
import Lab3dSkylineSceneNative, { LAB_SKYLINE_USERS } from "./scenes/Lab3dSkylineSceneNative";
import Lab3dRidgeSceneNative, { LAB_RIDGE_SEASONS } from "./scenes/Lab3dRidgeSceneNative";
import Lab3dSpiralSceneNative, { LAB_SPIRAL_TEAMS } from "./scenes/Lab3dSpiralSceneNative";
import Lab3dJarsSceneNative, { LAB_JAR_GAMES } from "./scenes/Lab3dJarsSceneNative";
import Lab3dNetworkSceneNative, { LAB_NETWORK_TEAMS } from "./scenes/Lab3dNetworkSceneNative";
import Lab3dFlowSceneNative, { LAB_FLOW_DAYS } from "./scenes/Lab3dFlowSceneNative";
import Lab3dHoloCardNative, { LAB_HOLO_CARDS } from "./scenes/Lab3dHoloCardNative";

type Demo = {
  id: string;
  no: number;
  title: string;
  desc: string;
  Scene: ComponentType<LabSceneProps>;
  options: [string, string][];
  /** 押すたびに pulse を増やすボタン（選択状態にはならない） */
  action?: string;
  stage: (k: number) => Omit<LabStageProps, "children">;
  /** GL を使わない RN だけのデモ */
  rn?: boolean;
  /** 一覧の見出し（型の名前） */
  kind?: string;
};

const teamOpts = (ids: string[]): [string, string][] => ids.map((id) => [id, abbr(id)]);

const NEW_DEMOS: Omit<Demo, "no">[] = [
  {
    id: "globe",
    kind: "地球儀と光の弧",
    title: "PICKS ACROSS THE PACIFIC",
    desc: "その日の UNITERZ の予想が、日本からアメリカの会場へ光の粒になって飛ぶ。粒の色＝選んだチーム",
    Scene: Lab3dGlobeSceneNative,
    options: LAB_GLOBE_DAYS,
    stage: (k) => ({ orbit: { dist: 62 * k, yaw: -1.3, pitch: 0.45, autoRotate: 0.04, minDist: 26, maxDist: 320 } }),
  },
  {
    id: "map",
    kind: "地図の上に柱",
    title: "ARENA MAP",
    desc: "30 の本拠地に柱。高さ＝今季の勝ち数。チームを選ぶと 2025-26 の遠征ルートを 1 試合ずつたどる（赤＝連戦の移動）",
    Scene: Lab3dMapSceneNative,
    options: [["", "ALL"], ...teamOpts(["nba-lakers", "nba-celtics", "nba-blazers", "nba-heat", "nba-nuggets"])],
    stage: (k) => ({ orbit: { target: [0, 0, 3], dist: 122 * k, pitch: 0.82, autoRotate: 0.03, minPitch: 0.12, minDist: 20, maxDist: 300 } }),
  },
  {
    id: "skyline",
    kind: "街並み",
    title: "MY SEASON SKYLINE",
    desc: "自分の予想の 1 日＝1 棟。横＝週、奥＝曜日、高さ＝その日の獲得ポイント、色＝的中率（シアンほど当たり）",
    Scene: Lab3dSkylineSceneNative,
    options: LAB_SKYLINE_USERS,
    action: "↺ 建て直す",
    stage: (k) => ({ orbit: { target: [0, 1.5, 0], dist: 30 * k, pitch: 0.5, yaw: -0.5, autoRotate: 0.05, minPitch: 0.08, minDist: 10, maxDist: 160 } }),
  },
  {
    id: "ridge",
    kind: "地形と波",
    title: "SEASON RIDGES",
    desc: "30 チームのシーズンを 1 本ずつの波に。山＝大勝 / 谷＝大敗。奥ほど勝ち数が多い（Joy Division のジャケット風）",
    Scene: Lab3dRidgeSceneNative,
    options: LAB_RIDGE_SEASONS,
    action: "↺ もう一度",
    stage: (k) => ({ orbit: { dist: 44 * k, pitch: 0.55, autoRotate: 0, minPitch: 0.05, minDist: 15, maxDist: 200 } }),
  },
  {
    id: "spiral",
    kind: "らせん",
    title: "SEASON SPIRAL",
    desc: "1 周＝1 シーズン、下から 4 シーズン積み上がる。外へ広がる＝直近 10 試合の勝率が高い（気温のらせん風）",
    Scene: Lab3dSpiralSceneNative,
    options: LAB_SPIRAL_TEAMS,
    action: "↺ もう一度",
    stage: (k) => ({ orbit: { target: [0, 8, 0], dist: 40 * k, pitch: 0.38, autoRotate: 0.12, minDist: 12, maxDist: 200 } }),
  },
  {
    id: "jars",
    kind: "1 つずつ物として積む",
    title: "PICK JARS",
    desc: "予想した人の数だけボールが筒に落ちる。左＝アウェー、右＝ホーム。全部落ちると結果が出て、当たった側が金色に",
    Scene: Lab3dJarsSceneNative,
    options: LAB_JAR_GAMES,
    action: "↺ もう一度",
    stage: (k) => ({ orbit: { target: [0, 6, 0], dist: 25 * k, pitch: 0.28, autoRotate: 0.06, minDist: 10, maxDist: 120 } }),
  },
  {
    id: "network",
    kind: "つながりの網",
    title: "TRADE WEB",
    desc: "今の主力選手と、在籍したことがあるチームを線で結ぶ。チームを選ぶと、そこを通った選手だけが光る",
    Scene: Lab3dNetworkSceneNative,
    options: LAB_NETWORK_TEAMS,
    stage: (k) => ({ fog: 0.004, orbit: { dist: 62 * k, pitch: 0.2, autoRotate: 0.06, minDist: 15, maxDist: 400 } }),
  },
  {
    id: "flow",
    kind: "粒子の流れ",
    title: "PICK FLOW",
    desc: "UNITERZ → 試合 → 選んだチーム → 的中 / 外れ。1 粒＝予想の流れ。金色に流れ込むほど当たった",
    Scene: Lab3dFlowSceneNative,
    options: LAB_FLOW_DAYS,
    stage: (k) => ({ orbit: { target: [0, 1, 0], dist: 38 * k, pitch: 0.12, yaw: 0.3, autoRotate: 0, minDist: 15, maxDist: 200 } }),
  },
  {
    id: "holo",
    kind: "傾けると光るカード",
    title: "HOLO BADGE",
    desc: "月間バッジを傾けると虹色の光とつやが流れる。タップで裏返る（シミュレーターはドラッグで傾ける）",
    Scene: Lab3dHoloCardNative,
    options: LAB_HOLO_CARDS,
    stage: () => ({}),
    rn: true,
  },
];

const OLD_DEMOS: Omit<Demo, "no">[] = [
  {
    id: "galaxy",
    title: "STYLE GALAXY",
    desc: "選手 220 人が星。横＝3P 依存 / 縦＝USG / 奥＝守備の動き。大きさ＝得点",
    Scene: Lab3dGalaxySceneNative,
    options: [["", "ALL"], ...teamOpts(["nba-lakers", "nba-spurs", "nba-thunder", "nba-celtics", "nba-nuggets"])],
    stage: (k) => ({ fog: 0.0012, orbit: { dist: 210 * k, pitch: 0.24, autoRotate: 0.1, minDist: 30, maxDist: 900 } }),
  },
  {
    id: "shots",
    title: "SHOT ARC SHOWER",
    desc: "今季のシュートを 1 本ずつ実際の位置から再生。シアン＝成功 / マゼンタ＝失敗",
    Scene: Lab3dShotsSceneNative,
    options: LAB_SHOT_PLAYERS,
    stage: (k) => ({ orbit: { target: [0, 4, 14], dist: 44 * k, pitch: 0.52, autoRotate: 0.06, minPitch: 0.05, minDist: 15, maxDist: 200 } }),
  },
  {
    id: "tunnel",
    title: "SEASON WARP",
    desc: "82 試合のトンネルを飛ぶ。光るリング＝終わった試合（太さ＝点差）、暗いリング＝これから",
    Scene: Lab3dTunnelSceneNative,
    options: teamOpts(["nba-lakers", "nba-spurs", "nba-thunder", "nba-76ers", "nba-celtics", "nba-warriors"]),
    stage: () => ({ fov: 70, fog: 0.018, orbitEnabled: false }),
  },
  {
    id: "city",
    title: "STANDINGS CITY",
    desc: "30 チームがビル。高さ＝勝ち数、開幕から 1 日ずつ伸びる。左 EAST / 右 WEST。ビーム＝3 連勝以上",
    Scene: Lab3dCitySceneNative,
    options: [["x1", "×1"], ["x2", "×2"], ["x5", "×5"]],
    action: "↺ 開幕から",
    stage: (k) => ({ fog: 0.006, orbit: { target: [0, 6, 2], dist: 42 * k, pitch: 0.32, yaw: -0.6, autoRotate: 0.07, minPitch: 0.05, maxPitch: 1.3, minDist: 20, maxDist: 250 } }),
  },
  {
    id: "solar",
    title: "TEAM SOLAR SYSTEM",
    desc: "チームが太陽、選手が惑星。大きさ＝得点 / 内側ほど出場時間が長い / 速さ＝USG / 輪＝3P 5 本以上 / 衛星＝アシスト",
    Scene: Lab3dSolarSceneNative,
    options: teamOpts(["nba-lakers", "nba-spurs", "nba-thunder", "nba-76ers", "nba-nuggets", "nba-warriors"]),
    stage: (k) => ({ orbit: { dist: 66 * k, pitch: 0.66, autoRotate: 0.045, minDist: 15, maxDist: 400 } }),
  },
  {
    id: "crystal",
    title: "MATCHUP CRYSTAL",
    desc: "上半分＝ホーム、下半分＝アウェー。8 指標のリーグ内順位で結晶が張り出す。とがった方向が強み",
    Scene: Lab3dCrystalSceneNative,
    options: LAB_CRYSTAL_MATCHUPS,
    stage: (k) => ({ orbit: { dist: 43 * k, pitch: 0.23, autoRotate: 0.17, minDist: 15, maxDist: 200 } }),
  },
  {
    id: "mountain",
    title: "CROWD SCORE MOUNTAIN",
    desc: "UNITERZ ユーザーの予想スコアが地形に。高い所＝みんなが予想したスコア。黄色の柱＝実際の結果",
    Scene: Lab3dMountainSceneNative,
    options: [],
    action: "↺ 山をもう一度",
    stage: (k) => ({ orbit: { target: [0, 4, 0], dist: 47 * k, pitch: 0.45, yaw: -0.6, autoRotate: 0.09, minPitch: 0.05, minDist: 15, maxDist: 220 } }),
  },
];

const DEMOS: Demo[] = [...NEW_DEMOS, ...OLD_DEMOS].map((d, i) => ({ ...d, no: i + 1 }));

function DemoView({ demo, onBack }: { demo: Demo; onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const k = portraitK(width, height);
  const [option, setOption] = useState(demo.options[0]?.[0] ?? "");
  const [pulse, setPulse] = useState(0);
  const [hud, setHud] = useState<LabHud>({ big: "", sub: "" });
  const onHud = useCallback((h: LabHud) => setHud(h), []);
  const stage = useMemo(() => demo.stage(k), [demo, k]);
  const { Scene } = demo;

  return (
    <View style={styles.fill}>
      {demo.rn ? (
        <Scene onHud={onHud} option={option} pulse={pulse} />
      ) : (
        <LabStageNative {...stage}>
          <Scene onHud={onHud} option={option} pulse={pulse} />
        </LabStageNative>
      )}
      <View style={[styles.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.topRow} pointerEvents="box-none">
          <Text style={styles.kicker}>UNITERZ 3D · DEMO {demo.no}</Text>
          <Pressable onPress={onBack} hitSlop={12}>
            <Text style={styles.back}>✕ CLOSE</Text>
          </Pressable>
        </View>
        <Text style={styles.title}>{demo.title}</Text>
        <Text style={styles.desc}>{demo.desc}</Text>
      </View>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]} pointerEvents="box-none">
        <View pointerEvents="none">
          {hud.big ? <Text style={styles.hudBig}>{hud.big}</Text> : null}
          {hud.sub ? <Text style={styles.hudSub}>{hud.sub}</Text> : null}
        </View>
        <View style={styles.chips}>
          {demo.options.map(([key, label]) => (
            <Pressable key={key || "all"} onPress={() => setOption(key)} style={[styles.chip, option === key && styles.chipOn]}>
              <Text style={[styles.chipText, option === key && styles.chipTextOn]}>{label}</Text>
            </Pressable>
          ))}
          {demo.action ? (
            <Pressable onPress={() => setPulse((n) => n + 1)} style={styles.chip}>
              <Text style={styles.chipText}>{demo.action}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default function Lab3dScreenNative({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [openId, setOpenId] = useState<string | null>(null);
  const demo = DEMOS.find((d) => d.id === openId);

  if (demo) return <DemoView key={demo.id} demo={demo} onBack={() => setOpenId(null)} />;

  return (
    <View style={styles.fill}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 16 }}>
        <View style={styles.topRow}>
          <Text style={styles.kicker}>UNITERZ · 3D LAB</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.back}>✕ CLOSE</Text>
          </Pressable>
        </View>
        <Text style={styles.listTitle}>3D DEMOS</Text>
        <Text style={styles.desc}>本番データのスナップショット。ドラッグで回転、ピンチでズーム。1〜9 が 3D の見せ方の型、10 以降は前回のデモ</Text>
        <View style={styles.list}>
          {DEMOS.map((d) => (
            <Pressable key={d.id} onPress={() => setOpenId(d.id)} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
              <Text style={styles.cardNo}>
                DEMO {d.no}
                {d.kind ? ` · ${d.kind}` : ""}
              </Text>
              <Text style={styles.cardTitle}>{d.title}</Text>
              <Text style={styles.cardDesc}>{d.desc}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const CYAN = "#00F5FF";
const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: LAB_BG },
  top: { position: "absolute", left: 0, right: 0, top: 0, paddingHorizontal: 16 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  kicker: { color: CYAN, fontSize: 10, fontWeight: "800", letterSpacing: 3 },
  back: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "800", letterSpacing: 2 },
  title: { color: "#fff", fontSize: 20, fontWeight: "900", letterSpacing: 1, marginTop: 2, textShadowColor: "rgba(0,245,255,0.5)", textShadowRadius: 12, textShadowOffset: { width: 0, height: 0 } },
  listTitle: { color: "#fff", fontSize: 26, fontWeight: "900", letterSpacing: 1, marginTop: 4, marginBottom: 4 },
  desc: { color: "rgba(255,255,255,0.6)", fontSize: 11, lineHeight: 16, marginTop: 4 },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  hudBig: { color: "#fff", fontSize: 24, fontWeight: "900", letterSpacing: 0.5, fontFamily: METRIC_FONT, textShadowColor: "#000", textShadowRadius: 8, textShadowOffset: { width: 0, height: 0 } },
  hudSub: { color: "rgba(255,255,255,0.85)", fontSize: 12, lineHeight: 18, marginTop: 2, textShadowColor: "#000", textShadowRadius: 6, textShadowOffset: { width: 0, height: 0 } },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12, justifyContent: "center" },
  chip: { borderWidth: 1, borderColor: CYAN, paddingHorizontal: 10, paddingVertical: 6 },
  chipOn: { backgroundColor: CYAN },
  chipText: { color: CYAN, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  chipTextOn: { color: "#050508" },
  list: { marginTop: 18, gap: 10 },
  card: { borderWidth: 1, borderColor: "rgba(0,245,255,0.35)", backgroundColor: "#060914", padding: 14 },
  cardPressed: { borderColor: CYAN },
  cardNo: { color: CYAN, fontSize: 10, fontWeight: "800", letterSpacing: 2 },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "900", marginTop: 2 },
  cardDesc: { color: "rgba(255,255,255,0.55)", fontSize: 11, lineHeight: 16, marginTop: 4 },
});
