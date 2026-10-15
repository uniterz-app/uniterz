import { StackActions, useRoute, useNavigation } from "@react-navigation/native";
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
      language={language}
      onClose={() => {
        // 詳細だけのスタックで goBack すると親タブへ抜け、Result タブが詳細のまま残る
        if (navigation.getState()?.routes.length === 1) {
          navigation.dispatch(StackActions.replace("ResultHome"));
          return;
        }
        navigation.goBack();
      }}
    />
  );
}
