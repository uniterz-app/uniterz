import WebClientWrapper from "./WebClientWrapper";

export default function WebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WebClientWrapper>{children}</WebClientWrapper>;
}
