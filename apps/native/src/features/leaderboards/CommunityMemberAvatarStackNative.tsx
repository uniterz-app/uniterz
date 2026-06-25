import { Image, StyleSheet, View } from "react-native";
import type { GroupMemberPreview } from "../../../../../lib/communities/memberPreviews";

type Props = {
  previews: GroupMemberPreview[];
  size?: number;
};

export default function CommunityMemberAvatarStackNative({ previews, size = 20 }: Props) {
  const shown = previews.slice(0, 4);
  if (shown.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {shown.map((p, i) => (
        <View
          key={p.uid || String(i)}
          style={[
            styles.avatarWrap,
            {
              width: size,
              height: size,
              marginLeft: i === 0 ? 0 : -size * 0.28,
              zIndex: shown.length - i,
            },
          ]}
        >
          {p.photoURL ? (
            <Image source={{ uri: p.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]} />
          )}
        </View>
      ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    maxWidth: "100%",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.25)",
    borderRadius: 4,
    backgroundColor: "rgba(10,16,24,0.8)",
    paddingHorizontal: 6,
    paddingVertical: 4,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
    overflow: "hidden",
    backgroundColor: "#0a1018",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    backgroundColor: "rgba(34,211,238,0.12)",
  },
});
