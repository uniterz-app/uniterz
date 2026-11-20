import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ProfileStackParamList } from "../../navigation/types";
import { acquireAppBrandShelfCollapsed } from "../../../../../lib/ui/appBrandShelfVisibility";
import Lab3dScreenNative from "./Lab3dScreenNative";

export default function Lab3dPreviewScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  useEffect(() => acquireAppBrandShelfCollapsed(), []);
  return <Lab3dScreenNative onClose={() => navigation.goBack()} />;
}
