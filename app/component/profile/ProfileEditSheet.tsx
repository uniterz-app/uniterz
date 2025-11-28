'use client';

import { useState, useEffect } from 'react';
import { Camera } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, db, auth } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

type Props = {
  draftName: string;
  setDraftName: (val: string) => void;
  draftBio: string;
  setDraftBio: (val: string) => void;
  onClose: () => void;
  initialPhotoURL?: string;
  onSaved?: (u: { displayName?: string; bio?: string; photoURL?: string | null }) => void;
  /** BottomSheet の中で使うときは true にする */
  embedded?: boolean;
};

export default function ProfileEditSheet({
  draftName,
  setDraftName,
  draftBio,
  setDraftBio,
  onClose,
  initialPhotoURL,
  onSaved,
  embedded = false,
}: Props) {
  const [nameLocal, setNameLocal] = useState(draftName ?? "");
  const [bioLocal, setBioLocal] = useState(draftBio ?? "");

  useEffect(() => { setNameLocal(draftName ?? ""); }, [draftName]);
  useEffect(() => { setBioLocal(draftBio ?? ""); }, [draftBio]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentPhotoURL, setCurrentPhotoURL] = useState<string | null>(initialPhotoURL ?? null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setCurrentPhotoURL(initialPhotoURL ?? null);
  }, [initialPhotoURL]);

  const defaultAvatarUrl =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="100%" height="100%" fill="%23000"/></svg>';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return null;
    const user = auth.currentUser;
    if (!user) return null;

    try {
      setUploading(true);
      const fileRef = ref(storage, `avatars/${user.uid}/profile.jpg`);
      await uploadBytes(fileRef, selectedFile);
      return await getDownloadURL(fileRef);
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

    let photoURL = currentPhotoURL;
    if (selectedFile) {
      photoURL = await handleUpload();
    }

    await setDoc(
      doc(db, "users", user.uid),
      {
        displayName: (nameLocal ?? "").trim(),
        bio: bioLocal ?? "",
        photoURL: photoURL ?? null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    onSaved?.({
      displayName: nameLocal,
      bio: bioLocal,
      photoURL: photoURL ?? null,
    });

    onClose();
  };

  // ---------- パネル本体 ----------
  const panel = (
    <div
      onClick={(e) => { if (!embedded) e.stopPropagation(); }}
      className="sheet"
      style={{
        width: '100%',
        maxWidth: 480,
        margin: '0 auto',
        background: '#0a3b47',
        color: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        border: '1px solid rgba(255,255,255,.08)',
        padding: 20,
        animation: 'slideUp .2s ease-out',
      }}
    >
      <h3
        style={{
          margin: '0 0 16px',
          fontSize: 18,
          fontWeight: 800,
          textAlign: 'center',
        }}
      >
        プロフィール編集
      </h3>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* アバター */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <label style={{ position: 'relative', cursor: 'pointer' }}>
            <img
              src={
                selectedFile
                  ? URL.createObjectURL(selectedFile)
                  : currentPhotoURL || defaultAvatarUrl
              }
              alt=""
              className="avatar-img"
              style={{
                width: 140,
                height: 140,
                borderRadius: '50%',
                objectFit: 'cover',
                boxShadow:
                  '0 12px 30px rgba(0,0,0,.35), 0 0 0 6px rgba(255,255,255,.06)',
                border: '1px solid rgba(255,255,255,.08)',
                display: 'block',
              }}
            />
            <span
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#111',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Camera size={18} />
            </span>
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          </label>
        </div>

        {/* 名前 */}
        <input
          type="text"
          placeholder="名前"
          value={nameLocal}
          onChange={(e) => setNameLocal(e.target.value)}
          className="field"
          style={{
            padding: '10px',
            borderRadius: 12,
            border: '1px solid #444',
          }}
        />

        {/* 自己紹介 */}
        <textarea
          placeholder="自己紹介"
          value={bioLocal}
          onChange={(e) => setBioLocal(e.target.value)}
          className="field"
          style={{
            padding: '10px',
            borderRadius: 12,
            border: '1px solid #444',
            minHeight: 100,
          }}
        />

        {/* ボタン */}
        <button
          type="submit"
          disabled={uploading}
          className="saveBtn"
          style={{
            background: '#6EA8FE',
            color: '#ffffff',
            padding: '10px',
            borderRadius: 12,
            border: 'none',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          {uploading ? "アップロード中..." : "変更"}
        </button>
      </form>
    </div>
  );

  // ---------- レンダリング ----------
  return (
    <>
      {embedded ? (
        panel
      ) : (
        <div
          role="dialog"
          aria-modal="true"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            zIndex: 1000,
            background: 'rgba(0,0,0,0.05)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          {panel}
        </div>
      )}

      {/* --- アニメーション --- */}
      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* --- スタイル --- */}
      <style jsx>{`
        .field {
          color: #fff;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.18);
        }
        .field::placeholder {
          color: rgba(255,255,255,0.6);
        }

        @media (max-width: 640px) {
          .sheet {
            max-width: 92vw;
            margin: 0 auto;
            padding: 16px;
          }

          .avatar-img {
            width: 110px;
            height: 110px;
          }

          .field {
            padding: 8px;
            font-size: 14px;
          }

          .saveBtn {
            padding: 8px 12px;
            font-size: 14px;
            border-radius: 10px;
          }
        }
      `}</style>
    </>
  );
}
