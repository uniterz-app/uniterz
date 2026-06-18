import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useFirebaseUser } from "../auth/FirebaseUserProvider";
import { db } from "../lib/firebase";
import NativeStackBackdrop from "../components/NativeStackBackdrop";
import type { AuthStackParamList, RootStackParamList } from "./types";
import MainTabNavigator from "./MainTabNavigator";
import LoginScreenNative from "../features/auth/LoginScreenNative";
import SignupScreenNative from "../features/auth/SignupScreenNative";
import ResetPasswordScreenNative from "../features/auth/ResetPasswordScreenNative";
import OnboardingScreenNative from "../features/auth/OnboardingScreenNative";
import LandingScreenNative from "../features/legal/LandingScreenNative";
import { prefetchRankingsLogoGlb } from "../features/rankings/rankingsLogoGlbCache";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const transparentStack = {
  headerShown: false,
  contentStyle: { backgroundColor: "transparent" as const },
  animation: "fade" as const,
  detachInactiveScreens: false,
  freezeOnBlur: false,
};

function AuthNavigator() {
  return (
    <NativeStackBackdrop>
      <AuthStack.Navigator screenOptions={{ ...transparentStack, animation: "fade" }}>
        <AuthStack.Screen name="Landing" component={LandingScreenNative} />
        <AuthStack.Screen name="Login" component={LoginScreenNative} />
        <AuthStack.Screen name="Signup" component={SignupScreenNative} />
        <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreenNative} />
        <AuthStack.Screen name="Onboarding" component={OnboardingScreenNative} />
      </AuthStack.Navigator>
    </NativeStackBackdrop>
  );
}

/** Web AuthGate 相当 — handle 未設定なら onboarding へ */
function useNeedsOnboarding(uid: string | undefined): boolean | null {
  const [needs, setNeeds] = useState<boolean | null>(null);

  useEffect(() => {
    if (!uid) {
      setNeeds(null);
      return;
    }
    return onSnapshot(doc(db, "users", uid), (snap) => {
      const handle = snap.data()?.handle;
      setNeeds(!handle || handle === "");
    });
  }, [uid]);

  return needs;
}

export default function RootNavigator() {
  const { status, fUser } = useFirebaseUser();
  const needsOnboarding = useNeedsOnboarding(fUser?.uid);
  const isAuthed = status === "ready" && !!fUser;

  useEffect(() => {
    if (isAuthed) prefetchRankingsLogoGlb();
  }, [isAuthed]);

  if (status === "loading" || (isAuthed && needsOnboarding === null)) {
    return null;
  }

  return (
    <RootStack.Navigator screenOptions={transparentStack}>
      {!isAuthed ? (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : needsOnboarding ? (
        <RootStack.Screen name="Auth">
          {() => (
            <NativeStackBackdrop>
              <AuthStack.Navigator screenOptions={{ ...transparentStack, animation: "fade" }}>
                <AuthStack.Screen name="Onboarding" component={OnboardingScreenNative} />
              </AuthStack.Navigator>
            </NativeStackBackdrop>
          )}
        </RootStack.Screen>
      ) : (
        <RootStack.Screen name="Main" component={MainTabNavigator} />
      )}
    </RootStack.Navigator>
  );
}
