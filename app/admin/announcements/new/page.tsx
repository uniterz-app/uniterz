"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_UID } from "@/lib/constants";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { db, storage } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

type FormState = {
  title: string;
  body: string;
  type: "event" | "campaign" | "update" | "maintenance" | "info";
  league: "all" | "B1" | "J1";
  visible: boolean;
  pinned: boolean;
  priority: number;
  heroFile?: File | null;
};

export default function AdminAnnouncementNewPage() {
  const router = useRouter();
  const { fUser: user, status } = useFirebaseUser();

  const [form, setForm] = useState<FormState>({
    title: "",
    body: "",
    type: "info",
    league: "all",
    visible: true,
    pinned: false,
    priority: 0,
    heroFile: null,
  });
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = status === "ready" && user?.uid === ADMIN_UID;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin || submitting) return;
    setSubmitting(true);
    try {
      // 画像アップロード（任意）※動的 import で安全寄り
      let heroImageURL: string | null = null;
      if (form.heroFile) {
        const { getDownloadURL, ref, uploadBytes } = await import("firebase/storage");
        const fname = `${Date.now()}_${form.heroFile.name}`;
        const r = ref(storage, `announcements/${fname}`);
        await uploadBytes(r, form.heroFile, { contentType: form.heroFile.type });
        heroImageURL = await getDownloadURL(r);
      }

      await addDoc(collection(db, "announcements"), {
        title: form.title.trim(),
        body: form.body.trim(),
        type: form.type,
        league: form.league,
        visible: form.visible,
        pinned: form.pinned,
        priority: Number(form.priority) || 0,
        heroImageURL,
        postedAt: serverTimestamp(),
      });

      router.push("/web/announcements");
    } finally {
      setSubmitting(false);
    }
  }

  if (status !== "ready") {
    return <div className="min-h-screen bg-[#0B0F17] text-white p-6">読み込み中...</div>;
  }
  if (!isAdmin) {
    return <div className="min-h-screen bg-[#0B0F17] text-white p-6">権限がありません</div>;
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white">
      <div className="mx-auto max-w-[840px] px-5 py-6">
        <h1 className="text-xl font-bold mb-4">お知らせ作成（運営）</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm mb-1">タイトル</label>
            <input
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-400"
              value={form.title}
              onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">本文</label>
            <textarea
              className="w-full rounded-lg bg白/5 border border-white/10 px-3 py-2 h-40 outline-none focus:ring-2 focus:ring-cyan-400"
              value={form.body}
              onChange={(e) => setForm((s) => ({ ...s, body: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">タイプ</label>
              <select
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                value={form.type}
                onChange={(e) =>
                  setForm((s) => ({ ...s, type: e.target.value as FormState["type"] }))
                }
              >
                <option value="info">info</option>
                <option value="event">event</option>
                <option value="campaign">campaign</option>
                <option value="update">update</option>
                <option value="maintenance">maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">リーグ</label>
              <select
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                value={form.league}
                onChange={(e) =>
                  setForm((s) => ({ ...s, league: e.target.value as FormState["league"] }))
                }
              >
                <option value="all">all</option>
                <option value="B1">B1</option>
                <option value="J1">J1</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.visible}
                onChange={(e) => setForm((s) => ({ ...s, visible: e.target.checked }))}
              />
              <span>公開（visible）</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm((s) => ({ ...s, pinned: e.target.checked }))}
              />
              <span>固定（pinned）</span>
            </label>

            <div>
              <label className="block text-sm mb-1">優先度</label>
              <input
                type="number"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                value={form.priority}
                onChange={(e) => setForm((s) => ({ ...s, priority: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">ヒーロー画像（任意）</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setForm((s) => ({ ...s, heroFile: e.target.files?.[0] ?? null }))}
            />
            <p className="text-xs text-white/60 mt-1">推奨比率 16:9 / 1〜2MB 目安</p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || !form.title.trim()}
              className="rounded-lg bg-cyan-500/90 hover:bg-cyan-400 text-black font-semibold px-5 py-2 shadow-[0_0_20px_rgba(0,229,255,0.35)] disabled:opacity-50"
            >
              {submitting ? "作成中..." : "作成する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
