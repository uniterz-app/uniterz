/**
 * Web `data-tutorial-target` 相当 — 子を測って登録する
 */
import { useEffect, useRef, type ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { registerTutorialTarget } from "./tutorialMeasureNative";

type Props = {
  id: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function TutorialTargetNative({ id, children, style }: Props) {
  const ref = useRef<View>(null);

  useEffect(() => {
    return registerTutorialTarget(id, () => {
      return new Promise((resolve) => {
        const node = ref.current;
        if (!node) {
          resolve(null);
          return;
        }
        node.measureInWindow((x, y, width, height) => {
          if (width < 1 || height < 1) {
            resolve(null);
            return;
          }
          resolve({ x, y, width, height });
        });
      });
    });
  }, [id]);

  return (
    <View ref={ref} style={style} collapsable={false}>
      {children}
    </View>
  );
}
