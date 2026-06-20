import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CYBER_TAB_CYAN, SIDE_MENU_SECTION_FONT } from "./cyberSideMenuNative";

type Props = {
  children: string;
  first?: boolean;
};

/** Web `CyberSideMenuSectionTitle` */
export default function CyberSideMenuSectionTitleNative({ children, first = false }: Props) {
  return (
    <View style={[styles.root, first ? styles.rootFirst : styles.rootRest]}>
      <View style={styles.tick} />
      <View style={styles.diamond} />
      <Text style={styles.label}>{children}</Text>
      <LinearGradient
        colors={["rgba(0, 245, 255, 0.25)", "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.line}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  rootFirst: { marginTop: 0 },
  rootRest: { marginTop: 16 },
  tick: {
    width: 12,
    height: 1,
    backgroundColor: CYBER_TAB_CYAN,
    shadowColor: CYBER_TAB_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  diamond: {
    width: 6,
    height: 6,
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.6)",
    transform: [{ rotate: "45deg" }],
    shadowColor: CYBER_TAB_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  label: {
    ...SIDE_MENU_SECTION_FONT,
    flexShrink: 1,
  },
  line: {
    flex: 1,
    height: 1,
    minWidth: 0,
  },
});
