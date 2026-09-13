/**
 * Web `ProfileProSkinUnlockOverlay` 相当 — 実スキン模様を1枚ヒーロー表示
 */
import { useState } from "react";
import {
  LayoutChangeEvent,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  formatProSkinOwnerCount,
  formatProSkinUnlockCondition,
} from "../../../../../../lib/profile/proSkinUnlock";
import { resolveProSkinUnlockNoticeEntries } from "../../../../../../lib/profile/proSkinUnlockNotice";
import type { ProfilePlanProBgVariant } from "../../../../../../lib/profile/profilePlanProBgVariants";
import ProfilePlanProBackgroundNative from "../kinetik/ProfilePlanProBackgroundNative";
import { saveMeProSkinNative } from "../accountApiNative";
import { CYBER_TAB_CYAN } from "../../../ui/cyberSideMenuNative";
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

type Props = {
  unlockedIds: readonly ProfilePlanProBgVariant[];
  language: string;
  preview?: boolean;
  visible: boolean;
  ownerCounts?: Record<string, number>;
  onDismiss: () => void;
  /** 適用成功後（ローカルの planProBgVariant 更新など） */
  onApplied?: (id: ProfilePlanProBgVariant) => void;
};

export default function ProfileProSkinUnlockOverlayNative({
  unlockedIds,
  language,
  preview = false,
  visible,
  ownerCounts = {},
  onDismiss,
  onApplied,
}: Props) {
  const lang = resolveLocalizedLang(language);
  const entries = resolveProSkinUnlockNoticeEntries(unlockedIds);
  const featured = entries[0] ?? null;
  const [heroSize, setHeroSize] = useState({ w: 0, h: 0 });
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!featured) return null;

  const moreCount = Math.max(0, entries.length - 1);
  const owners = ownerCounts[featured.id] ?? 0;

  function onHeroLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (
      width > 0 &&
      height > 0 &&
      (Math.abs(width - heroSize.w) > 1 || Math.abs(height - heroSize.h) > 1)
    ) {
      setHeroSize({ w: width, h: height });
    }
  }

  async function handleApply() {
    if (applying) return;
    setError(null);
    if (preview) {
      onDismiss();
      return;
    }
    setApplying(true);
    try {
      await saveMeProSkinNative(featured.id);
      onApplied?.(featured.id);
      onDismiss();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : L(lang, {
              ja: "適用に失敗しました",
              en: "Failed to apply",
              ko: "적용에 실패했습니다",
              zh: "应用失败",
              es: "No se pudo aplicar",
              pt: "Falha ao aplicar",
              fr: "Échec de l’application",
            })
      );
    } finally {
      setApplying(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={applying ? undefined : onDismiss}
    >
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={applying ? undefined : onDismiss}
        />
        <View style={styles.panel}>
          <View style={styles.hero} onLayout={onHeroLayout}>
            {heroSize.w > 0 && heroSize.h > 0 ? (
              <ProfilePlanProBackgroundNative
                width={heroSize.w}
                height={heroSize.h}
                variant={featured.id}
                animate
                accentReady
              />
            ) : (
              <View style={styles.heroPlaceholder} />
            )}
            <LinearGradient
              colors={[
                "transparent",
                "rgba(5,11,20,0.55)",
                "rgba(5,11,20,0.95)",
              ]}
              locations={[0, 0.45, 1]}
              style={styles.heroFade}
              pointerEvents="none"
            />
            <View style={styles.badgeCol}>
              <View style={styles.unlockedBadge}>
                <Text style={styles.unlockedBadgeText}>SKIN UNLOCKED</Text>
              </View>
            </View>
            <View style={styles.heroMeta}>
              <Text style={styles.skinTitle}>
                {featured.label}
                {featured.tag ? (
                  <Text style={styles.skinTag}> {featured.tag}</Text>
                ) : null}
              </Text>
              <Text style={styles.skinCond}>
                {formatProSkinUnlockCondition(featured.unlock, lang)}
                {" · "}
                {formatProSkinOwnerCount(owners, lang)}
              </Text>
              {moreCount > 0 ? (
                <Text style={styles.moreText}>
                  {L(lang, {
                    ja: `ほか ${moreCount} 件も解放`,
                    en: `+${moreCount} more unlocked`,
                    ko: `외 ${moreCount}개 더 해제`,
                    zh: `另有 ${moreCount} 个已解锁`,
                    es: `+${moreCount} más desbloqueados`,
                    pt: `+${moreCount} mais desbloqueados`,
                    fr: `+${moreCount} de plus débloqués`,
                  })}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.footer}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Pressable
              style={[styles.primaryBtn, applying ? styles.btnDisabled : null]}
              onPress={() => void handleApply()}
              disabled={applying}
            >
              <Text style={styles.primaryBtnText}>
                {applying
                  ? L(lang, {
                      ja: "適用中…",
                      en: "Applying…",
                      ko: "적용 중…",
                      zh: "应用中…",
                      es: "Aplicando…",
                      pt: "Aplicando…",
                      fr: "Application…",
                    })
                  : L(lang, {
                      ja: "適用する",
                      en: "Apply",
                      ko: "적용",
                      zh: "应用",
                      es: "Aplicar",
                      pt: "Aplicar",
                      fr: "Appliquer",
                    })}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.secondaryBtn, applying ? styles.btnDisabled : null]}
              onPress={onDismiss}
              disabled={applying}
            >
              <Text style={styles.secondaryBtnText}>
                {L(lang, {
                  ja: "とじる",
                  en: "Close",
                  ko: "닫기",
                  zh: "关闭",
                  es: "Cerrar",
                  pt: "Fechar",
                  fr: "Fermer",
                })}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.78)",
  },
  panel: {
    width: "100%",
    maxWidth: 340,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.4)",
    backgroundColor: "#050b14",
    overflow: "hidden",
  },
  hero: {
    width: "100%",
    aspectRatio: 3 / 4,
    backgroundColor: "#03080d",
    overflow: "hidden",
  },
  heroPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#060a12",
  },
  heroFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "48%",
  },
  badgeCol: {
    position: "absolute",
    top: 24,
    left: 12,
    right: 12,
    alignItems: "center",
  },
  unlockedBadge: {
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.35)",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  unlockedBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
    color: "rgba(165,243,252,0.95)",
  },
  heroMeta: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  skinTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  skinTag: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },
  skinCond: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "rgba(207,250,254,0.85)",
  },
  moreText: {
    marginTop: 6,
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 8,
  },
  errorText: {
    textAlign: "center",
    fontSize: 11,
    color: "rgba(252,165,165,0.95)",
  },
  primaryBtn: {
    borderWidth: 2,
    borderColor: CYBER_TAB_CYAN,
    backgroundColor: CYBER_TAB_CYAN,
    paddingVertical: 11,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "#050508",
    textTransform: "uppercase",
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 11,
    alignItems: "center",
  },
  secondaryBtnText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.75)",
    textTransform: "uppercase",
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
