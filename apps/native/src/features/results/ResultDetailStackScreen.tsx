import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import ResultDetailScreen from "./ResultDetailScreen";
import type { ResultStackParamList } from "../../navigation/types";

/** Stack route 用ラッパー */
export default function ResultDetailStackScreen() {
  const route = useRoute<RouteProp<ResultStackParamList, "ResultDetail">>();
  const navigation = useNavigation();
  const { postId } = route.params;

  return (
    <ResultDetailScreen
      visible
      postId={postId}
      language="ja"
      onClose={() => navigation.goBack()}
    />
  );
}
