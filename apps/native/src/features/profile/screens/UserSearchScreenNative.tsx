/**
 * メニュー → ユーザー検索。ハンドル検索して MARK / プロフィール閲覧。
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import LegalPageLayoutNative from "../../legal/LegalPageLayoutNative";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../../../hooks/useNativeUserLanguage";
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";
import { navigateToPublicProfileNative } from "../../../navigation/navigateToPublicProfileNative";
import { RankingsAvatarNative } from "../../rankings/RankingsAvatarAndTabs";
import ProCyberBadgeNative from "../kinetik/ProCyberBadgeNative";
import { useProfileMarksNative } from "../useProfileMarksNative";
import { searchUsersNative } from "../userSearchApiNative";
import { userSearchCopy } from "../../../../../../lib/users/userSearchCopy";
import type { UserSearchHit } from "../../../../../../lib/users/searchUsersByHandle";
import { maxMarksForPlan } from "../../../../../../lib/marks/markTypes";
import { cyberAlert } from "../../../components/cyberAlert";
import { peekProfileUserDocNative } from "../profileUserDocCacheNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";

const DEBOUNCE_MS = 320;

export default function UserSearchScreenNative() {
  const navigation = useNavigation();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const copy = userSearchCopy(language);
  const myUid = fUser?.uid ?? null;
  const myPeek = myUid ? peekProfileUserDocNative(myUid) : null;
  const myIsPro = myPeek?.plan === "pro";
  const maxMarks = maxMarksForPlan(!!myIsPro);
  const { addMark, removeMark, isMarked, atCap } = useProfileMarksNative(
    myUid,
    maxMarks
  );

  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<UserSearchHit[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markBusyUid, setMarkBusyUid] = useState<string | null>(null);

  const trimmed = query.trim().replace(/^@+/, "");
  const canSearch = trimmed.length >= 2;

  useEffect(() => {
    if (!canSearch) {
      setResults([]);
      setSearched(false);
      setBusy(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setBusy(true);
    setError(null);
    const t = setTimeout(() => {
      void (async () => {
        try {
          const users = await searchUsersNative(trimmed);
          if (cancelled) return;
          setResults(users);
          setSearched(true);
        } catch {
          if (cancelled) return;
          setResults([]);
          setSearched(true);
          setError(copy.failed);
        } finally {
          if (!cancelled) setBusy(false);
        }
      })();
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [canSearch, copy.failed, trimmed]);

  const openProfile = useCallback(
    (hit: UserSearchHit) => {
      if (!hit.handle) return;
      navigateToPublicProfileNative(navigation as never, {
        handle: hit.handle,
        fromUserSearch: true,
        warm: {
          uid: hit.uid,
          handle: hit.handle,
          displayName: hit.displayName,
          photoURL: hit.photoURL,
          plan: hit.plan,
        },
      });
    },
    [navigation]
  );

  const onToggleMark = useCallback(
    async (hit: UserSearchHit) => {
      if (!myUid || markBusyUid) return;
      setMarkBusyUid(hit.uid);
      try {
        if (isMarked(hit.uid)) {
          const result = await removeMark(hit.uid);
          if (!result.ok) cyberAlert("", copy.markFailed);
          return;
        }
        if (atCap) {
          cyberAlert(
            "",
            myIsPro ? copy.capPro(maxMarks) : copy.capFree(maxMarks)
          );
          return;
        }
        const result = await addMark({
          targetUid: hit.uid,
          handle: hit.handle,
          displayName: hit.displayName,
          photoURL: hit.photoURL,
        });
        if (!result.ok) {
          if (result.error === "cap") {
            cyberAlert(
              "",
              myIsPro ? copy.capPro(maxMarks) : copy.capFree(maxMarks)
            );
          } else {
            cyberAlert("", copy.markFailed);
          }
        }
      } finally {
        setMarkBusyUid(null);
      }
    },
    [
      addMark,
      atCap,
      copy,
      isMarked,
      markBusyUid,
      maxMarks,
      myIsPro,
      myUid,
      removeMark,
    ]
  );

  const statusLine = useMemo(() => {
    if (!canSearch) return copy.hint;
    if (busy) return copy.searching;
    if (error) return error;
    if (searched && results.length === 0) return copy.empty;
    return null;
  }, [busy, canSearch, copy, error, results.length, searched]);

  return (
    <LegalPageLayoutNative title={copy.title} eyebrow="MARK">
      <View style={[styles.body, { paddingBottom: bottomContentReserveY + 16 }]}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color="rgba(165,243,252,0.75)"
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={copy.placeholder}
            placeholderTextColor="rgba(255,255,255,0.35)"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            returnKeyType="search"
            style={styles.input}
          />
          {query.length > 0 ? (
            <Pressable
              onPress={() => setQuery("")}
              hitSlop={8}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color="rgba(255,255,255,0.4)"
              />
            </Pressable>
          ) : null}
        </View>

        {statusLine ? (
          <View style={styles.statusRow}>
            {busy ? <ActivityIndicator color="#a5f3fc" size="small" /> : null}
            <Text style={styles.statusText}>{statusLine}</Text>
          </View>
        ) : null}

        <View style={styles.list}>
          {results.map((hit) => {
            const marked = isMarked(hit.uid);
            const marking = markBusyUid === hit.uid;
            return (
              <View key={hit.uid} style={styles.row}>
                <Pressable
                  style={styles.rowMain}
                  onPress={() => openProfile(hit)}
                  accessibilityRole="button"
                >
                  <View style={styles.avatarWrap}>
                    <RankingsAvatarNative
                      photoURL={hit.photoURL}
                      label={hit.displayName}
                      size={36}
                      square
                    />
                  </View>
                  <View style={styles.meta}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name} numberOfLines={1}>
                        {hit.displayName}
                      </Text>
                      {hit.plan === "pro" ? (
                        <ProCyberBadgeNative compact />
                      ) : null}
                    </View>
                    <Text style={styles.handle} numberOfLines={1}>
                      @{hit.handle}
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => void onToggleMark(hit)}
                  disabled={marking}
                  style={[
                    styles.markBtn,
                    marked ? styles.markBtnOn : null,
                    marking ? styles.markBtnBusy : null,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={marked ? copy.unmarked : copy.mark}
                >
                  {marking ? (
                    <ActivityIndicator color="#050508" size="small" />
                  ) : (
                    <Text
                      style={[
                        styles.markBtnText,
                        marked ? styles.markBtnTextOn : null,
                      ]}
                    >
                      {marked ? copy.marked : copy.mark}
                    </Text>
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>
    </LegalPageLayoutNative>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(165,243,252,0.28)",
    backgroundColor: "rgba(8,12,18,0.92)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 48,
  },
  input: {
    flex: 1,
    color: "#f8fafc",
    fontSize: 15,
    paddingVertical: 0,
    fontFamily: METRIC_FONT,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 2,
  },
  statusText: {
    color: "rgba(226,242,255,0.7)",
    fontSize: 12,
    fontWeight: "600",
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    paddingVertical: 10,
    paddingHorizontal: 10,
    minHeight: 56,
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  name: {
    flexShrink: 1,
    color: "#a5f3fc",
    fontSize: 14,
    fontWeight: "700",
  },
  handle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontFamily: METRIC_FONT,
    fontWeight: "700",
  },
  markBtn: {
    minWidth: 64,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#00F5FF",
    alignItems: "center",
    justifyContent: "center",
  },
  markBtnOn: {
    backgroundColor: "#00F5FF",
  },
  markBtnBusy: {
    opacity: 0.7,
  },
  markBtnText: {
    color: "#00F5FF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    fontFamily: METRIC_FONT,
  },
  markBtnTextOn: {
    color: "#050508",
  },
});
