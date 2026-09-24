import { Platform } from "react-native";

/**
 * KeyboardAvoidingView の behavior。
 * iOS は padding、Android は height（windowSoftInputMode=resize と併用）。
 */
export const keyboardAvoidingBehavior =
  Platform.OS === "ios" ? ("padding" as const) : ("height" as const);
