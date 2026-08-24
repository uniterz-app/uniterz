/**
 * Void Corona 案 A〜W のホスト（U 欠番）。
 */
import type { VoidCoronaConceptId } from "../../../../../../lib/splash/voidCoronaConcepts";
import VoidCoronaSplashANative from "./VoidCoronaSplashANative";
import VoidCoronaSplashBNative from "./VoidCoronaSplashBNative";
import VoidCoronaSplashCNative from "./VoidCoronaSplashCNative";
import VoidCoronaSplashDNative from "./VoidCoronaSplashDNative";
import VoidCoronaSplashENative from "./VoidCoronaSplashENative";
import VoidCoronaSplashFNative from "./VoidCoronaSplashFNative";
import VoidCoronaSplashGNative from "./VoidCoronaSplashGNative";
import VoidCoronaSplashHNative from "./VoidCoronaSplashHNative";
import VoidCoronaSplashINative from "./VoidCoronaSplashINative";
import VoidCoronaSplashJNative from "./VoidCoronaSplashJNative";
import VoidCoronaSplashKNative from "./VoidCoronaSplashKNative";
import VoidCoronaSplashLNative from "./VoidCoronaSplashLNative";
import VoidCoronaSplashMNative from "./VoidCoronaSplashMNative";
import VoidCoronaSplashNNative from "./VoidCoronaSplashNNative";
import VoidCoronaSplashONative from "./VoidCoronaSplashONative";
import VoidCoronaSplashPNative from "./VoidCoronaSplashPNative";
import VoidCoronaSplashQNative from "./VoidCoronaSplashQNative";
import VoidCoronaSplashRNative from "./VoidCoronaSplashRNative";
import VoidCoronaSplashSNative from "./VoidCoronaSplashSNative";
import VoidCoronaSplashTNative from "./VoidCoronaSplashTNative";
import VoidCoronaSplashVNative from "./VoidCoronaSplashVNative";
import VoidCoronaSplashWNative from "./VoidCoronaSplashWNative";

type Props = {
  concept: VoidCoronaConceptId;
  playKey: number;
  forceStatic?: boolean;
  onComplete?: () => void;
};

export default function VoidCoronaSplashHostNative({
  concept,
  playKey,
  forceStatic,
  onComplete,
}: Props) {
  const common = { playKey, forceStatic, onComplete };
  switch (concept) {
    case "B":
      return <VoidCoronaSplashBNative {...common} />;
    case "C":
      return <VoidCoronaSplashCNative {...common} />;
    case "D":
      return <VoidCoronaSplashDNative {...common} />;
    case "E":
      return <VoidCoronaSplashENative {...common} />;
    case "F":
      return <VoidCoronaSplashFNative {...common} />;
    case "G":
      return <VoidCoronaSplashGNative {...common} />;
    case "H":
      return <VoidCoronaSplashHNative {...common} />;
    case "I":
      return <VoidCoronaSplashINative {...common} />;
    case "J":
      return <VoidCoronaSplashJNative {...common} />;
    case "K":
      return <VoidCoronaSplashKNative {...common} />;
    case "L":
      return <VoidCoronaSplashLNative {...common} />;
    case "M":
      return <VoidCoronaSplashMNative {...common} />;
    case "N":
      return <VoidCoronaSplashNNative {...common} />;
    case "O":
      return <VoidCoronaSplashONative {...common} />;
    case "P":
      return <VoidCoronaSplashPNative {...common} />;
    case "Q":
      return <VoidCoronaSplashQNative {...common} />;
    case "R":
      return <VoidCoronaSplashRNative {...common} />;
    case "S":
      return <VoidCoronaSplashSNative {...common} />;
    case "T":
      return <VoidCoronaSplashTNative {...common} />;
    case "V":
      return <VoidCoronaSplashVNative {...common} />;
    case "W":
      return <VoidCoronaSplashWNative {...common} />;
    case "A":
    default:
      return <VoidCoronaSplashANative {...common} />;
  }
}
