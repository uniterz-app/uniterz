import { CommonActions } from "@react-navigation/native";
import type { NavigationState, PartialState } from "@react-navigation/native";

function gamesStackIsHomeOnly(
  state: NavigationState | PartialState<NavigationState> | undefined
): boolean {
  if (!state?.routes?.length) return true;
  const index = state.index ?? 0;
  return state.routes.length === 1 && index === 0 && state.routes[0]?.name === "GamesHome";
}

type ResetNavigation = {
  getState(): NavigationState;
  navigate: (...args: never[]) => void;
  dispatch: (action: ReturnType<typeof CommonActions.reset>) => void;
};

/**
 * Games スタックを GamesHome だけに戻す（タブは切り替えない）。
 * 別タブへ移る直前 / GamesTab blur 向け。
 */
export function resetGamesStackInBackgroundNative(
  navigation: ResetNavigation
): void {
  const state = navigation.getState();

  if (state.routeNames?.includes("GamesHome")) {
    if (gamesStackIsHomeOnly(state)) return;
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "GamesHome", params: {} }],
      })
    );
    return;
  }

  const gamesTab = state.routes.find((route) => route.name === "GamesTab");
  if (gamesStackIsHomeOnly(gamesTab?.state)) return;

  // 他タブの route は完全な state を持ったまま渡す（PartialRoute 型には stale:false が入らない）
  const nextState = {
    index: state.index,
    routes: state.routes.map((route) =>
      route.name === "GamesTab"
        ? {
            ...route,
            state: {
              routes: [{ name: "GamesHome", params: {} }],
              index: 0,
            },
          }
        : route
    ),
  } as unknown as PartialState<NavigationState>;
  navigation.dispatch(CommonActions.reset(nextState));
}

/** Games タブを開き、試合一覧へ（Games タブボタン向け）。 */
export function openGamesTabHomeNative(navigation: ResetNavigation): void {
  /** v7 の navigate は既存画面へ戻らず push する。詳細を重ねた上に GamesHome を積まないよう戻す */
  (navigation.navigate as unknown as (name: string, params: object) => void).call(
    navigation,
    "GamesTab",
    { screen: "GamesHome", params: {}, pop: true }
  );
}

/** @deprecated 背景 reset とタブ遷移を区別するため非推奨 */
export function resetGamesTabHomeNative(navigation: ResetNavigation): void {
  openGamesTabHomeNative(navigation);
}
