"use client";

export default function MaintenanceModal() {
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-black text-white px-6">
      <div className="max-w-sm text-center">
        <h1 className="text-xl font-bold mb-4">現在、大幅な仕様変更中です</h1>
        <p className="text-sm text-white/80 mb-4 leading-relaxed">
          皆さんの意見を受けて、より良いアプリを作るため
          現在大規模なアップデート作業を行っています。
        </p>
        <p className="text-sm text-white/80 mb-4 leading-relaxed">
          作業完了まで <span className="font-semibold">1週間ほど</span> お時間をいただきます。
        </p>
        <p className="text-sm text-white/80">
          せっかく来ていただいたのに申し訳ありません。
          少しだけ時間をください。
        </p>
      </div>
    </div>
  );
}
