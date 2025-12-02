import MobileClientWrapper from "./MobileClientWrapper";

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MobileClientWrapper>{children}</MobileClientWrapper>;
}
