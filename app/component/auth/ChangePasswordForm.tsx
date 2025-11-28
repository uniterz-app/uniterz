"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaLock } from "react-icons/fa";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

type Props = {
  variant?: "web" | "mobile";
};

export default function ChangePasswordForm({ variant = "web" }: Props) {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [nextConfirm, setNextConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const formWidth = variant === "mobile" ? 320 : 380;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    try {
      if (!auth.currentUser || !auth.currentUser.email) {
        alert("ログイン状態を確認できません。いったんログインし直してください。");
        return;
      }

      if (!current || !next) {
        alert("現在のパスワードと新しいパスワードを入力してください。");
        return;
      }

      if (next !== nextConfirm) {
        alert("新しいパスワードが一致していません。");
        return;
      }

      setLoading(true);

      // 1) 再認証（現在のパスワードが正しいか確認）
      const cred = EmailAuthProvider.credential(
        auth.currentUser.email,
        current
      );
      await reauthenticateWithCredential(auth.currentUser, cred);

      // 2) パスワード更新
      await updatePassword(auth.currentUser, next);

      alert("パスワードを変更しました。");
      setCurrent("");
      setNext("");
      setNextConfirm("");

      // 変更後はとりあえずプロフィールに戻す（必要なら変更）
      const base = variant === "mobile" ? "/mobile/settings/profile" : "/web/settings/profile";
      router.push(base);
    } catch (err: any) {
      console.error("change password error:", err);
      if (err?.code === "auth/wrong-password") {
        alert("現在のパスワードが違います。");
      } else if (err?.code === "auth/weak-password") {
        alert("新しいパスワードが簡単すぎます。6文字以上にしてください。");
      } else {
        alert(err?.message ?? "パスワード変更に失敗しました。");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          width: formWidth,
          padding: 24,
          backgroundColor: "rgba(10,10,20,0.92)",
          borderRadius: 16,
          textAlign: "center",
          boxShadow: "0 0 40px rgba(0,0,0,0.55)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <h1
          style={{
            fontWeight: "bold",
            fontSize: "1.4rem",
            marginBottom: 4,
          }}
        >
          パスワード変更
        </h1>
        <p
          style={{
            fontSize: "0.85rem",
            opacity: 0.8,
            marginBottom: 16,
          }}
        >
          現在のパスワードを確認してから、新しいパスワードに更新します。
        </p>

        {/* 現在のパスワード */}
        <div style={{ position: "relative", marginTop: 10 }}>
          <input
            type="password"
            placeholder="現在のパスワード"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 40px 12px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(15,23,42,0.75)",
              color: "white",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <FaLock
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              opacity: 0.9,
            }}
          />
        </div>

        {/* 新しいパスワード */}
        <div style={{ position: "relative", marginTop: 10 }}>
          <input
            type="password"
            placeholder="新しいパスワード"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 40px 12px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(15,23,42,0.75)",
              color: "white",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <FaLock
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              opacity: 0.9,
            }}
          />
        </div>

        {/* 新しいパスワード（確認） */}
        <div style={{ position: "relative", marginTop: 10 }}>
          <input
            type="password"
            placeholder="新しいパスワード（確認）"
            value={nextConfirm}
            onChange={(e) => setNextConfirm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 40px 12px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(15,23,42,0.75)",
              color: "white",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <FaLock
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              opacity: 0.9,
            }}
          />
        </div>

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundImage:
              "linear-gradient(135deg, #a855f7, #6366f1 40%, #22d3ee 100%)",
            color: "white",
            width: "100%",
            padding: "12px",
            marginTop: 18,
            border: "none",
            borderRadius: 999,
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 700,
            letterSpacing: "0.03em",
            boxShadow: "0 0 18px rgba(79,70,229,0.7)",
            opacity: loading ? 0.7 : 1,
            transition: "transform 0.1s ease, box-shadow 0.1s ease",
          }}
        >
          {loading ? "更新中..." : "パスワードを変更する"}
        </button>
      </div>
    </form>
  );
}
