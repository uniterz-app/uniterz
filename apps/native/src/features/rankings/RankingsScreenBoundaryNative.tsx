import { Component, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNativeLanguage } from "../../i18n/NativeLanguageProvider";
import { L, resolveLocalizedLang } from "../../../../../lib/i18n/localize";

type BoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type BoundaryState = { hasError: boolean };

class Boundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (__DEV__) {
      console.warn("[RankingsScreenBoundary] render failed.", error);
    }
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function RankingsErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { language } = useNativeLanguage();
  const loc = resolveLocalizedLang(language);
  return (
    <View style={styles.wrap}>
      <Text style={styles.message}>
        {L(loc, {
          ja: "ランキングを表示できませんでした",
          en: "Couldn't load the rankings",
          ko: "랭킹을 표시할 수 없습니다",
          zh: "无法显示排行榜",
          es: "No se pudo cargar el ranking",
          pt: "Não foi possível carregar o ranking",
          fr: "Impossible d'afficher le classement",
        })}
      </Text>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>
          {L(loc, {
            ja: "再読み込み",
            en: "Retry",
            ko: "다시 불러오기",
            zh: "重新加载",
            es: "Reintentar",
            pt: "Tentar novamente",
            fr: "Réessayer",
          })}
        </Text>
      </Pressable>
    </View>
  );
}

/** 描画エラーでタブ全体（アプリ全体）が灰色にならないよう、ランキング画面だけで受け止める */
export default function RankingsScreenBoundaryNative({
  children,
}: {
  children: ReactNode;
}) {
  const [attempt, setAttempt] = useState(0);
  return (
    <Boundary
      key={attempt}
      fallback={<RankingsErrorFallback onRetry={() => setAttempt((n) => n + 1)} />}
    >
      {children}
    </Boundary>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  message: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    textAlign: "center",
  },
  button: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.75)",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  buttonText: {
    color: "#00F5FF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
