import FloatingCloseButton from "@/app/component/common/FloatingCloseButton";
import AdminGuard from "./_components/AdminGuard";

export const metadata = {
  title: "Admin | Uniterz",
  robots: { index: false, follow: false },
};

/**
 * 管理画面は全ページここでガードする。
 * 以前はページ単位に `AdminGuard` を置いていたため、announcements / badges /
 * games-import / team-init が素通しだった。
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 min-h-[100svh] text-white">
      <FloatingCloseButton />
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            管理画面
          </h1>
          <p className="text-white/60 text-sm mt-1">
            機能リクエスト・問い合わせ・商品交換申請を確認します
          </p>
        </header>
        <AdminGuard>{children}</AdminGuard>
      </div>
    </div>
  );
}
