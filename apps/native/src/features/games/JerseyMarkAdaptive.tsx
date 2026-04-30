import { Component, type ComponentType, type ReactNode } from "react";
import JerseyMarkSvg from "./JerseyMarkSvg";

type JerseyProps = {
  accent: string;
  accentEnd?: string;
  size?: number;
};

let cachedSkiaComponent: ComponentType<JerseyProps> | null = null;
let skiaLoadTried = false;
let skiaRenderDisabled = false;
const ENABLE_SKIA_RENDERER = false;

function resolveSkiaComponent(): ComponentType<JerseyProps> | null {
  if (!ENABLE_SKIA_RENDERER) return null;
  if (skiaRenderDisabled) return null;
  if (skiaLoadTried) return cachedSkiaComponent;
  skiaLoadTried = true;
  try {
    const mod = require("./JerseyMarkSkia") as { default?: ComponentType<JerseyProps> };
    if (mod?.default) {
      cachedSkiaComponent = mod.default;
    }
  } catch {
    cachedSkiaComponent = null;
  }
  return cachedSkiaComponent;
}

type SkiaBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type SkiaBoundaryState = {
  hasError: boolean;
};

class SkiaBoundary extends Component<SkiaBoundaryProps, SkiaBoundaryState> {
  state: SkiaBoundaryState = { hasError: false };

  static getDerivedStateFromError(): SkiaBoundaryState {
    skiaRenderDisabled = true;
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[native] Skia renderer failed. Fallback to SVG.", error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export default function JerseyMarkAdaptive(props: JerseyProps) {
  const SkiaComponent = resolveSkiaComponent();
  if (SkiaComponent) {
    return (
      <SkiaBoundary fallback={<JerseyMarkSvg {...props} />}>
        <SkiaComponent {...props} />
      </SkiaBoundary>
    );
  }
  return <JerseyMarkSvg {...props} />;
}
