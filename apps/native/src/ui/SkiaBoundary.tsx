import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback: ReactNode;
  onError?: (error: unknown) => void;
};

type State = {
  hasError: boolean;
};

/** Skia Canvas 周りのネイティブクラッシュを JS 側で吸収してフォールバック表示 */
export default class SkiaBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onError?.(error);
    if (__DEV__) {
      console.warn("[SkiaBoundary] renderer failed, using fallback.", error);
    }
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
