"use client";

/**
 * 「新機能だけ」: プロフィールを遠景にして welcome カメラ追い抜きする。
 */
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";
import {
  readTutorialLivePhase,
  writeTutorialLivePhase,
} from "@/lib/tutorial/tutorialLivePhase";
import { writeTutorialLiveTrack } from "@/lib/tutorial/tutorialLiveTrack";
import { writeTutorialHorizonSubstep } from "@/lib/tutorial/tutorialHorizonSubstep";
import { markAppTutorialSeen } from "@/lib/tutorial/tutorialSeen";
import { setAppTutorialBlockingEvents } from "@/lib/tutorial/tutorialBlockingEvents";
import { clearTutorialLivePick } from "@/lib/tutorial/tutorialLivePick";
import { tutorialSkipConfirmProps } from "@/lib/tutorial/tutorialSkipConfirmProps";
import { TUTORIAL_WELCOME_LAND_HOLD_MS } from "@/lib/tutorial/tutorialMotion";
import {
  readTutorialWelcomeHandoff,
  writeTutorialWelcomeHandoff,
} from "@/lib/tutorial/tutorialWelcomeHandoff";
import TutorialWelcomeWorldCamera from "@/app/component/tutorial/TutorialWelcomeWorldCamera";
import TutorialLiveCoach from "@/app/component/tutorial/TutorialLiveCoach";

function isProfileWelcomeFlyActive(): boolean {
  return (
    readTutorialLivePhase() === "welcome" &&
    readTutorialWelcomeHandoff() === "profile"
  );
}

export default function TutorialWelcomeProfileFlyShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const m = t(language);
  const skipConfirm = tutorialSkipConfirmProps(m.tutorial);
  const [active, setActive] = useState(isProfileWelcomeFlyActive);
  const [flying, setFlying] = useState(false);
  const startWelcomeFly = useCallback(() => {
    setFlying(true);
  }, []);
  const finishedRef = useRef(false);
  const landTimerRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    setActive(isProfileWelcomeFlyActive());
  }, [pathname]);

  const finishSkip = useCallback(() => {
    const uid = user?.uid ?? null;
    void markAppTutorialSeen(uid);
    writeTutorialLivePhase(null);
    writeTutorialLiveTrack(null);
    writeTutorialWelcomeHandoff(null);
    clearTutorialLivePick();
    setActive(false);
    setAppTutorialBlockingEvents(false);
  }, [user?.uid]);

  const goHorizon = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (landTimerRef.current != null) window.clearTimeout(landTimerRef.current);
    landTimerRef.current = window.setTimeout(() => {
      writeTutorialWelcomeHandoff(null);
      writeTutorialLiveTrack("features");
      writeTutorialHorizonSubstep(0);
      writeTutorialLivePhase("horizon");
      setActive(false);
    }, TUTORIAL_WELCOME_LAND_HOLD_MS);
  }, []);

  if (!active) return <>{children}</>;

  return (
    <TutorialWelcomeWorldCamera
      active
      flying={flying}
      onFlyComplete={goHorizon}
      overlay={
        <TutorialLiveCoach
          open
          embedInCamera
          autoWelcomeFly="features"
          title={m.tutorial.practice.welcomeTitle}
          body={m.tutorial.practice.welcomeBody}
          skipLabel={m.tutorial.skip}
          nextLabel={m.tutorial.practice.welcomeFullCta}
          altNextLabel={m.tutorial.practice.welcomeFeaturesCta}
          visual="welcome"
          {...skipConfirm}
          onSkip={finishSkip}
          onWelcomeFlyStart={startWelcomeFly}
          onNext={goHorizon}
          onAltNext={goHorizon}
        />
      }
    >
      {children}
    </TutorialWelcomeWorldCamera>
  );
}
