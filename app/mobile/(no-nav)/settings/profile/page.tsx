// 例: app/mobile/(with-nav)/settings/profile-edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Camera, ArrowLeft } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, db, auth } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function ProfileEditPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentPhotoURL, setCurrentPhotoURL] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // ★ 追加：画像の上下位置（object-position 用）
  const [cropY, setCropY] = useState(50);

  // ログインユーザーの現在のプロフィールを読み込み
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const d = snap.data() as any;
        setName(d.displayName ?? "");
        setBio(d.bio ?? "");
        setCurrentPhotoURL(d.photoURL ?? null);

        // ★ 追加：保存されていた位置を復元
        if (typeof d.photoCropY === "number") {
          setCropY(d.photoCropY);
        }
      }
    });
    return () => unsub();
  }, []);

  const defaultAvatarUrl =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="100%" height="100%" fill="%23000"/></svg>';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // ★ ここだけ修正：Storage のパスを avatars/{uid}/... 形式にする
  const handleUpload = async () => {
    if (!selectedFile) return undefined;
    const user = auth.currentUser;
    if (!user) {
      alert("ログインが必要です");
      return undefined;
    }

    try {
      setUploading(true);

      const timestamp = Date.now();
      const fileRef = ref(
        storage,
        `avatars/${user.uid}/${timestamp}_${selectedFile.name}`
      );

      await uploadBytes(fileRef, selectedFile);
      const downloadURL = await getDownloadURL(fileRef);
      console.log("✅ アップロード完了 URL:", downloadURL);
      return downloadURL;
    } catch (error) {
      console.error("アップロード失敗:", error);
      return undefined;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      alert("ログインが必要です");
      return;
    }

    let photoURL: string | null = currentPhotoURL;

    // 画像が選ばれていたらアップロードして URL を更新
    if (selectedFile) {
      const uploaded = await handleUpload();
      if (uploaded) {
        photoURL = uploaded;
      }
    }

    await setDoc(
      doc(db, "users", user.uid),
      {
        displayName: name || "",
        bio: bio || "",
        photoURL: photoURL || "",
        photoCropY: cropY, // ★ 追加：上下位置
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log("✅ Firestore に保存しました");
    router.back();
  };

  // ★ 現在表示する画像 URL
  const previewURL = selectedFile
    ? URL.createObjectURL(selectedFile)
    : currentPhotoURL || defaultAvatarUrl;

  return (
    <main
      className="
        min-h-screen
        text-white
        px-4 py-6
        flex justify-center
        backdrop-blur-lg
        bg-black/5
      "
    >
      <div className="w-full max-w-[480px] rounded-2xl bg-[#111827] border border-white/10 shadow-2xl px-5 py-6">
        {/* ===== ヘッダー ===== */}
        <header className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 hover:bg-white/10"
            aria-label="戻る"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-base font-semibold leading-tight">
              プロフィール設定
            </h1>
            <p className="text-xs text-white/60">
              アイコン・名前・自己紹介を編集できます
            </p>
          </div>
        </header>

        {/* ===== フォーム ===== */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* ===== アバター（丸枠＋トリミング UI） ===== */}
          <div className="flex justify-center">
            <label className="relative inline-block">
              {/* ★ 1) トリミング領域 */}
              <div
                className="
                  relative
                  h-36 w-36
                  rounded-full
                  overflow-hidden
                "
              >
                {/* ★ 画像本体（object-position に cropY を反映） */}
                <img
                  src={previewURL}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    objectPosition: `center ${cropY}%`,
                  }}
                />

                {/* ★ 枠の外側を暗くするマスク */}
                <div className="absolute inset-0 rounded-full ring-4 ring-black/40"></div>
              </div>

              {/* カメラアイコン（変更ボタン） */}
              <span
                className="absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full bg-black text-white shadow-[0_8px_20px_rgba(0,0,0,0.4)] ring-2 ring-white/10 cursor-pointer"
                aria-hidden
              >
                <Camera className="h-4 w-4" />
              </span>

              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* ===== 名前 ===== */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-white/70">名前</label>
            <input
              type="text"
              placeholder="名前"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/60"
            />
          </div>

          {/* ===== 自己紹介 ===== */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-white/70">
              自己紹介
            </label>
            <textarea
              placeholder="自己紹介"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/60 min-h-[96px]"
            />
          </div>

          {/* ===== 保存ボタン ===== */}
          <button
            type="submit"
            disabled={uploading}
            className="mt-2 w-full rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-400 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploading ? "アップロード中..." : "変更を保存"}
          </button>
        </form>
      </div>
    </main>
  );
}
