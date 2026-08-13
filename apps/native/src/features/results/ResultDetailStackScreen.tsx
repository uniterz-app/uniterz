import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import ResultDetailScreen from "./ResultDetailScreen";
import type { ResultStackParamList } from "../../navigation/types";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../../hooks/useNativeUserLanguage";

/** Stack route 用ラッパー */
export default function ResultDetailStackScreen() {
  const route = useRoute<RouteProp<ResultStackParamList, "ResultDetail">>();
  const navigation = useNavigation();
  const { postId } = route.params;
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);

  return (
    <ResultDetailScreen
      visible
      postId={postId}
      language={language === "en" ? "en" : "ja"}
      onClose={() => navigation.goBack()}
    />
  );
}
