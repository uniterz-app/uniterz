import FloatingCloseButton from "@/app/component/common/FloatingCloseButton";

export const metadata = { title: "Admin | Uniterz" };

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
            お知らせ・試合データ・各種承認などを管理します
          </p>
        </header>
        {children}
      </div>
    </div>
  );
}
