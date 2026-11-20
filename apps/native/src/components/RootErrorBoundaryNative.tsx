import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/tokens";

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * 画面の描画で例外が出ても真っ白にしない最上位の受け皿。
 * 「再試行」で子ツリーを描き直す（状態は初期化される）。
 * 言語プロバイダの外に置くので、文言は日英の併記にしている。
 */
export default class RootErrorBoundaryNative extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error("[RootErrorBoundaryNative]", error, info.componentStack);
    }
  }

  private retry = () => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.root} accessibilityRole="alert">
        <Text style={styles.title}>予期しないエラーが発生しました</Text>
        <Text style={styles.body}>
          Something went wrong. Please try again.
        </Text>
        <Pressable
          onPress={this.retry}
          accessibilityRole="button"
          accessibilityLabel="再試行 / Try again"
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>再試行 / Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.bgPrimary,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  body: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "700",
  },
});
