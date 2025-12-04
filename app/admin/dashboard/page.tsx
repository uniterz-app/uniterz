"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type DailyStats = {
  newUsers: number;
  newPosts: number;
  totalUsers: number;
  dau: number;
  ts: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [dateKey, setDateKey] = useState("");

  useEffect(() => {
    const today = new Date();
    const key = today.toISOString().slice(0, 10);
    setDateKey(key);

    const fetch = async () => {
      const snap = await getDoc(doc(db, "analytics/daily/stats", key));
      setStats(snap.exists() ? (snap.data() as DailyStats) : null);
    };

    fetch();
  }, []);

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-6">📊 管理ダッシュボード</h1>
      <p className="text-white/60 mb-4">日付: {dateKey}</p>

      {!stats ? (
        <div className="text-white/40">まだ集計データがありません</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl bg-white/[0.05] p-4">
            <div className="text-sm text-white/60">新規登録</div>
            <div className="text-2xl">{stats.newUsers}</div>
          </div>

          <div className="rounded-xl bg-white/[0.05] p-4">
            <div className="text-sm text-white/60">投稿数</div>
            <div className="text-2xl">{stats.newPosts}</div>
          </div>

          <div className="rounded-xl bg-white/[0.05] p-4">
            <div className="text-sm text-white/60">DAU</div>
            <div className="text-2xl">{stats.dau}</div>
          </div>

          <div className="rounded-xl bg-white/[0.05] p-4">
            <div className="text-sm text-white/60">累計ユーザー</div>
            <div className="text-2xl">{stats.totalUsers}</div>
          </div>
        </div>
      )}
    </div>
  );
}
