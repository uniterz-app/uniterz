import PredictOverlayCornerButtonNative from "./PredictOverlayCornerButtonNative";

type Props = {
  onPress: () => void;
  accessibilityLabel: string;
};

/** Web `.predict-overlay-close-btn` */
export default function PredictOverlayCloseButtonNative(props: Props) {
  return <PredictOverlayCornerButtonNative {...props} align="left" icon="close" />;
}
