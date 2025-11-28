// app/admin/announcements/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { ADMIN_UID } from "@/lib/constants";
import { db, storage } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

type FormState = {
  title: string;
  body: string;
  type: "event" | "campaign" | "update" | "maintenance" | "info";
  league: "all" | "B1" | "J1";
  visible: boolean;
  pinned: boolean;
  priority: number;
  heroImageURL?: string | null;
  heroFile?: File | null;
};

export default function AdminAnnouncementEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { fUser, status } = useFirebaseUser();
  const isAdmin = status === "ready" && fUser?.uid === ADMIN_UID;

  const [form, setForm] = useState<FormState | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 初期読込
  useEffect(() => {
    if (!isAdmin || !id) return;
    (async () => {
      const snap = await getDoc(doc(db, "announcements", id));
      if (!snap.exists()) {
        router.push("/admin/announcements");
        return;
      }
      const d = snap.data() as any;
      setForm({
        title: d.title ?? "",
        body: d.body ?? "",
        type: (d.type ?? "info") as FormState["type"],
        league: (d.league ?? "all") as FormState["league"],
        visible: !!d.visible,
        pinned: !!d.pinned,
        priority: Number(d.priority ?? 0),
        heroImageURL: d.heroImageURL ?? null,
        heroFile: null,
      });
    })();
  }, [isAdmin, id, router]);

  if (status !== "ready") {
    return <div className="min-h-screen bg-[#0B0F17] text-white p-6">読み込み中...</div>;
  }
  if (!isAdmin) {
    return <div className="min-h-screen bg-[#0B0F17] text-white p-6">権限がありません</div>;
  }
  if (!form) {
    return <div className="min-h-screen bg-[#0B0F17] text-white p-6">ロード中…</div>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !form) return; // ★ nullガード

    try {
      setSubmitting(true);

      // 画像差し替え
      let heroImageURL: string | null = form.heroImageURL ?? null;
      if (form.heroFile) {
        const fname = `${Date.now()}_${form.heroFile.name}`;
        const r = ref(storage, `announcements/${fname}`);
        await uploadBytes(r, form.heroFile, { contentType: form.heroFile.type });
        heroImageURL = await getDownloadURL(r);
      }

      await updateDoc(doc(db, "announcements", id), {
        title: form.title.trim(),
        body: form.body.trim(),
        type: form.type,
        league: form.league,
        visible: form.visible,
        pinned: form.pinned,
        priority: Number(form.priority) || 0,
        heroImageURL,
        updatedAt: serverTimestamp(),
      });

      router.push("/admin/announcements");
    } finally {
      setSubmitting(false);
    }
  }

  function clearImage() {
    setForm((s) => (s ? { ...s, heroImageURL: null, heroFile: null } : s));
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white">
      <div className="mx-auto max-w-[840px] px-5 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">お知らせ編集</h1>
          <button
            className="rounded-lg bg-white/10 hover:bg-white/15 px-3 py-2"
            onClick={() => router.push("/admin/announcements")}
            type="button"
          >
            一覧に戻る
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* タイトル */}
          <div>
            <label className="block text-sm mb-1">タイトル</label>
            <input
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-400"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          {/* 本文 */}
          <div>
            <label className="block text-sm mb-1">本文</label>
            <textarea
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 h-40 outline-none focus:ring-2 focus:ring-cyan-400"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </div>

          {/* セレクト */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">タイプ</label>
              <select
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as FormState["type"] })
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
                  setForm({ ...form, league: e.target.value as FormState["league"] })
                }
              >
                <option value="all">all</option>
                <option value="B1">B1</option>
                <option value="J1">J1</option>
              </select>
            </div>
          </div>

          {/* フラグ & 優先度 */}
          <div className="grid grid-cols-3 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.visible}
                onChange={(e) => setForm({ ...form, visible: e.target.checked })}
              />
              <span>公開（visible）</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
              />
              <span>固定（pinned）</span>
            </label>

            <div>
              <label className="block text-sm mb-1">優先度</label>
              <input
                type="number"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: Number(e.target.value) })
                }
              />
            </div>
          </div>

          {/* 画像 */}
          <div className="space-y-2">
            <label className="block text-sm">ヒーロー画像</label>
            {form.heroImageURL ? (
              <div className="flex items-center gap-3">
                <a
                  href={form.heroImageURL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-300 underline"
                >
                  現在の画像を開く
                </a>
                <button
                  type="button"
                  onClick={clearImage}
                  className="px-3 py-1 rounded bg-white/10 hover:bg-white/15"
                >
                  画像を外す
                </button>
              </div>
            ) : (
              <p className="text-xs text-white/50">未設定</p>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setForm({ ...form, heroFile: e.target.files?.[0] ?? null })
              }
            />
          </div>

          {/* 送信 */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || !form.title.trim()}
              className="rounded-lg bg-cyan-500/90 hover:bg-cyan-400 text-black font-semibold px-5 py-2 shadow-[0_0_20px_rgba(0,229,255,0.35)] disabled:opacity-50"
            >
              {submitting ? "更新中..." : "更新する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
