/**
 * Web `CyberSlantedTab` / `CyberSlantedTabBar` 相当。
 *
 * 選択: シアン / PRO 紫 / PRO 金は同一 glow 寸法の焼き込み PNG + skewX(-14deg)。
 * それ以外の theme は runtime shadow（GLOW_PAD 込みで Pick Up に寄せる）。
 * 非選択: 透明 + 枠（skew）。光は付けない。
 */
import { createContext, useContext, type ReactNode } from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type ViewStyle,
} from "react-native";
import {
  hasJaScript,
  rankingFontSizePx,
} from "../../../../../lib/rankings/rankingJaTextSize";
import { METRIC_FONT } from "./rankingsUiTheme";
import tabMeta from "../../../assets/cyber-slanted-tab/meta.json";

export const CYBER_TAB_CYAN = "#00F5FF";
const TAB_ACTIVE_TEXT = "#050508";
const SKEW = `${tabMeta.skewDeg}deg` as const;

/** Web `CyberSlantedTabTheme` 相当（Native でも型だけ共有） */
export type CyberSlantedTabThemeNative = {
  accent: string;
  inactiveText?: string;
  activeText?: string;
  activeShadow?: string;
  inactiveBorder?: string;
};

/** 1枚素材。左右中央の3分割だと継ぎ目が縦線になって見える */
const ACTIVE_STRETCH = require("../../../assets/cyber-slanted-tab/active-stretch.png") as ImageSourcePropType;
const ACTIVE_STRETCH_VIOLET = require("../../../assets/cyber-slanted-tab/active-stretch-violet.png") as ImageSourcePropType;
const ACTIVE_STRETCH_GOLD = require("../../../assets/cyber-slanted-tab/active-stretch-gold.png") as ImageSourcePropType;

const GLOW_PAD = tabMeta.glowPadPx1x;
/**
 * 高さは固定してブレさせない。
 * Web: compact ≈ py-1.5+font9 / 通常 ≈ py-2+font10 に相当。
 */
const BODY_H_COMPACT = 30;
const BODY_H_NORMAL = 34;

/** Pick Up シアンと同寸の焼き込み（PRO 紫・金も同じ glow） */
const BAKED_ACTIVE_BY_ACCENT: Record<string, ImageSourcePropType> = {
  [CYBER_TAB_CYAN.toUpperCase()]: ACTIVE_STRETCH,
  "#C084FC": ACTIVE_STRETCH_VIOLET,
  "#F6C344": ACTIVE_STRETCH_GOLD,
};

const CyberSlantedTabFillContext = createContext(false);

type TabProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  compact?: boolean;
  /** 省略時は親 `CyberSlantedTabBarNative` の fill を使う */
  fill?: boolean;
  fontWeight?: "500" | "600" | "700";
  /**
   * Web の theme 相当。
   * シアン / PRO 紫 / 金は焼き込み。それ以外は runtime 塗り。
   */
  theme?: CyberSlantedTabThemeNative;
  accessibilityRole?: "tab";
  accessibilityState?: { selected?: boolean };
};

function tabBodyHeight(compact: boolean): number {
  return compact ? BODY_H_COMPACT : BODY_H_NORMAL;
}

function chromeImageHeight(bodyH: number): number {
  return bodyH + GLOW_PAD * 2;
}

function resolveTabTheme(theme?: CyberSlantedTabThemeNative) {
  const accent = theme?.accent ?? CYBER_TAB_CYAN;
  const bakedSource =
    BAKED_ACTIVE_BY_ACCENT[accent.toUpperCase()] ?? null;
  return {
    accent,
    inactiveText: theme?.inactiveText ?? accent,
    activeText: theme?.activeText ?? TAB_ACTIVE_TEXT,
    inactiveBorder: theme?.inactiveBorder ?? accent,
    /** 焼き込みがある色は Pick Up と同寸の光。無い色だけ runtime shadow */
    bakedActiveSource: bakedSource,
  };
}

/** Web `.cyber-slanted-tab__scan` — transparent 2px + rgba(0,0,0,0.14) 1px */
function ScanOverlay({ height }: { height: number }) {
  const lines: ReactNode[] = [];
  for (let y = 2; y < height; y += 3) {
    lines.push(
      <View
        key={y}
        style={{
          position: "absolute",
          top: y,
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: "rgba(0,0,0,0.14)",
        }}
      />
    );
  }
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, { overflow: "hidden" }]}
    >
      {lines}
    </View>
  );
}

/** Android で skew レイヤが潰されないよう GPU に載せる（見た目の数値は変えない） */
const androidSkewHost =
  Platform.OS === "android"
    ? ({ collapsable: false, renderToHardwareTextureAndroid: true, opacity: 0.999 } as const)
    : null;

/** 選択: 焼き込み1枚を横ストレッチし、Web と同じ skew で傾ける */
function ActiveTabChrome({
  bodyH,
  source = ACTIVE_STRETCH,
}: {
  bodyH: number;
  source?: ImageSourcePropType;
}) {
  const imageH = chromeImageHeight(bodyH);
  return (
    <View
      pointerEvents="none"
      {...androidSkewHost}
      style={[styles.chromeSkew, { height: imageH, width: "100%" }]}
    >
      <Image
        source={source}
        style={{ width: "100%", height: imageH }}
        resizeMode="stretch"
      />
    </View>
  );
}

/**
 * 選択: 焼き込みが無い theme 色のフォールバック。
 * Pick Up 焼き込みと同寸（GLOW_PAD + 二重 shadow ≈ 10px / 22px）。
 */
function ActiveTabChromeThemed({
  bodyH,
  accent,
}: {
  bodyH: number;
  accent: string;
}) {
  const imageH = chromeImageHeight(bodyH);
  return (
    <View
      pointerEvents="none"
      style={[styles.chromeSkew, { height: imageH, width: "100%" }]}
    >
      <View
        {...androidSkewHost}
        style={[
          styles.themedGlowOuter,
          {
            marginTop: GLOW_PAD,
            height: bodyH,
            shadowColor: accent,
          },
        ]}
      >
        <View
          style={[
            styles.themedGlowInner,
            {
              height: bodyH,
              shadowColor: accent,
            },
          ]}
        >
          <View
            style={[
              styles.themedActiveChrome,
              {
                height: bodyH,
                width: "100%",
                backgroundColor: accent,
                overflow: "hidden",
              },
            ]}
          >
            <ScanOverlay height={bodyH} />
          </View>
        </View>
      </View>
    </View>
  );
}

/** Web 非選択: 透明 + 枠（skew）。光は付けない。 */
function InactiveTabChrome({
  bodyH,
  borderColor,
}: {
  bodyH: number;
  borderColor: string;
}) {
  return (
    <View
      pointerEvents="none"
      {...androidSkewHost}
      style={[
        styles.inactiveChrome,
        { height: bodyH, width: "100%", borderColor },
      ]}
    />
  );
}

/** Web `CyberSlantedTab` のネイティブ版 */
export function CyberSlantedTabNative({
  label,
  active,
  onPress,
  compact = false,
  fill: fillProp,
  fontWeight = "700",
  theme,
  accessibilityRole,
  accessibilityState,
}: TabProps) {
  const fillFromBar = useContext(CyberSlantedTabFillContext);
  const fill = fillProp ?? fillFromBar;
  const bodyH = tabBodyHeight(compact);
  const imageH = chromeImageHeight(bodyH);
  const jaLabel = hasJaScript(label);
  const fontSize = rankingFontSizePx(compact ? 9 : 10, label);
  const letterSpacing = jaLabel
    ? fontSize * 0.06
    : fontSize * tabMeta.letterSpacingEm;
  const resolved = resolveTabTheme(theme);

  const tab = (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tabPressable,
        { height: bodyH },
        pressed ? styles.tabPressed : null,
      ]}
    >
      <View style={[styles.tabFrame, { height: bodyH }]} pointerEvents="box-none">
        {active ? (
          resolved.bakedActiveSource ? (
            <View
              pointerEvents="none"
              style={[
                styles.chromeHost,
                {
                  top: -GLOW_PAD,
                  left: -GLOW_PAD,
                  right: -GLOW_PAD,
                  height: imageH,
                },
              ]}
            >
              <ActiveTabChrome
                bodyH={bodyH}
                source={resolved.bakedActiveSource}
              />
            </View>
          ) : (
            <View
              pointerEvents="none"
              style={[
                styles.chromeHost,
                {
                  top: -GLOW_PAD,
                  left: -GLOW_PAD,
                  right: -GLOW_PAD,
                  height: imageH,
                },
              ]}
            >
              <ActiveTabChromeThemed bodyH={bodyH} accent={resolved.accent} />
            </View>
          )
        ) : (
          <View style={styles.inactiveSlot} pointerEvents="none">
            <InactiveTabChrome
              bodyH={bodyH}
              borderColor={resolved.inactiveBorder}
            />
          </View>
        )}
        <View pointerEvents="none" style={styles.labelLayer}>
          {/**
           * Android は Text の skewX が効かないため View に載せる
           *（試合カードチーム名と同じ）。角度・サイズは据え置き。
           */}
          <View {...androidSkewHost} style={styles.labelSkew}>
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={1.1}
              style={[
                styles.tabText,
                {
                  fontSize,
                  fontWeight,
                  lineHeight: Math.round(fontSize * 1.2),
                  letterSpacing,
                  color: active ? resolved.activeText : resolved.inactiveText,
                },
                !jaLabel ? styles.tabTextUpper : null,
              ]}
            >
              {label}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );

  /** Pressable の flex が不安定なため、均等幅は外側 View で確保（Web flex-1 相当） */
  if (fill) {
    return <View style={styles.fillSlot}>{tab}</View>;
  }
  return <View style={styles.shrinkSlot}>{tab}</View>;
}

export function CyberSlantedTabBarNative({
  children,
  fill = false,
  gridColumns,
  style,
}: {
  children: ReactNode;
  fill?: boolean;
  gridColumns?: 3;
  style?: ViewStyle;
}) {
  return (
    <CyberSlantedTabFillContext.Provider value={fill}>
      <View
        style={[
          gridColumns === 3
            ? styles.barGrid3
            : fill
              ? styles.barFill
              : styles.barScroll,
          style,
        ]}
      >
        {children}
      </View>
    </CyberSlantedTabFillContext.Provider>
  );
}

export function CyberSlantedTabGridItemNative({
  children,
  columns = 3,
}: {
  children: ReactNode;
  columns?: 3;
}) {
  return (
    <View style={columns === 3 ? styles.gridItem3 : styles.gridItemFill}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  /** Web `flex gap-2` — 発光は overflow ではみ出し。横パディングで幅を縮めない */
  barFill: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    alignItems: "stretch",
    overflow: "visible",
    paddingVertical: 6,
  },
  barScroll: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    overflow: "visible",
    paddingVertical: 6,
  },
  barGrid3: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 8,
    rowGap: 8,
    width: "100%",
    alignItems: "stretch",
    overflow: "visible",
    paddingVertical: 6,
  },
  gridItem3: {
    width: "31%",
    flexGrow: 1,
    minWidth: 0,
    overflow: "visible",
  },
  gridItemFill: {
    flex: 1,
    minWidth: 0,
    overflow: "visible",
  },
  fillSlot: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    overflow: "visible",
  },
  shrinkSlot: {
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: "flex-start",
    overflow: "visible",
  },
  tabPressable: {
    width: "100%",
    overflow: "visible",
  },
  tabFrame: {
    width: "100%",
    overflow: "visible",
  },
  chromeHost: {
    position: "absolute",
    overflow: "visible",
  },
  chromeSkew: {
    transform: [{ skewX: SKEW }],
    overflow: "visible",
  },
  inactiveSlot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    overflow: "visible",
  },
  inactiveChrome: {
    borderWidth: 1,
    borderColor: CYBER_TAB_CYAN,
    backgroundColor: "transparent",
    transform: [{ skewX: SKEW }],
  },
  themedActiveChrome: {
    borderWidth: 0,
  },
  /** Pick Up 焼き込み相当 — 外側 ≈ Web 22px / 内側 ≈ 10px */
  themedGlowOuter: {
    width: "100%",
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.28,
        shadowRadius: 11,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
  themedGlowInner: {
    width: "100%",
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.55,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
  },
  labelLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    zIndex: 2,
  },
  labelSkew: {
    transform: [{ skewX: "-6deg" }],
  },
  tabText: {
    fontFamily: METRIC_FONT,
    textAlign: "center",
    fontWeight: "700",
  },
  tabTextUpper: {
    textTransform: "uppercase",
  },
  tabPressed: {
    opacity: 0.94,
  },
});
