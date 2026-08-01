import TutorialPreviewPage from "@/app/component/tutorial/TutorialPreviewPage";

/** /dev/tutorial-preview — AuthGate なし（開発時のみ） */
export default function DevTutorialPreviewRoute() {
  return <TutorialPreviewPage variant="mobile" />;
}
