"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaUser, FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { ensureUserSlug } from "@/lib/ensureSlug";

type SignupFormProps = {
  variant?: "web" | "mobile";
};

export default function SignupForm({ variant = "web" }: SignupFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 👁 パスワード表示切り替え
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  // ==== すでにログインしている場合はプロフィールへ ====
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      const d = snap.data() as any;
      const handle = d?.handle || d?.username;
      if (handle) {
        const base = variant === "mobile" ? "/mobile/u" : "/web/u";
        router.replace(`${base}/${encodeURIComponent(handle)}`);
      }
    });
    return () => unsub();
  }, [router, variant]);

  // ==== サインアップ処理（修正版） ====
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // ① Firebase Auth でユーザー作成
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      // ② displayName を更新
      await updateProfile(user, { displayName: name });

      // ③ users/{uid} を先に作成（←ここが重要）
      await setDoc(
        doc(db, "users", user.uid),
        {
          displayName: name,
          bio: "",
          photoURL: user.photoURL ?? "",
          createdAt: serverTimestamp(),
          counts: { followers: 0, following: 0, posts: 0 },
        },
        { merge: true }
      );

      // ④ slug を生成
      const slug = await ensureUserSlug(db, user.uid);

      // ⑤ slug / handle を users/{uid} に反映
      await setDoc(
        doc(db, "users", user.uid),
        {
          slug,
          handle: slug,
          username: slug,
        },
        { merge: true }
      );

      // ⑥ プロフィールへ遷移
      const base = variant === "mobile" ? "/mobile/u" : "/web/u";
      router.replace(`${base}/${encodeURIComponent(slug)}`);
    } catch (e: any) {
      console.error("サインアップ失敗:", e);
      alert(e?.message ?? "Signup failed");
    }
  };

  const formWidth = variant === "mobile" ? 320 : 360;

  return (
    <form onSubmit={handleSignup}>
      <div
        style={{
          width: formWidth,
          padding: 24,
          backgroundColor: "rgba(255,255,255,0.08)",
          borderRadius: 12,
          textAlign: "center",
          boxShadow: "0 0 30px rgba(0,0,0,0.3)",
        }}
      >
        <h1 style={{ fontWeight: "bold", fontSize: "1.7rem" }}>
          Create Account
        </h1>

        {/* Username */}
        <div style={{ position: "relative", marginTop: 10 }}>
          <input
            type="text"
            placeholder="Username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 40px 12px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.12)",
              color: "white",
              outline: "none",
            }}
          />
          <FaUser
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              opacity: 0.9,
            }}
          />
        </div>

        {/* Email */}
        <div style={{ position: "relative", marginTop: 10 }}>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 40px 12px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.12)",
              color: "white",
              outline: "none",
            }}
          />
          <FaEnvelope
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              opacity: 0.9,
            }}
          />
        </div>

        {/* Password */}
<div style={{ position: "relative", marginTop: 10 }}>
  <input
    type={showPassword ? "text" : "password"}
    placeholder="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    style={{
      width: "100%",
      padding: "12px 40px 12px 12px",
      borderRadius: 8,
      border: "1px solid rgba(255,255,255,0.15)",
      background: "rgba(255,255,255,0.12)",
      color: "white",
      outline: "none",
    }}
  />

  {/* 👁 目アイコン（正しい動き） */}
  {showPassword ? (
    // ← パスワードが見えてる時 → 目アイコン
    <FaEye
      onClick={() => setShowPassword(false)}
      style={{
        position: "absolute",
        right: 12,
        top: "50%",
        transform: "translateY(-50%)",
        opacity: 0.9,
        cursor: "pointer",
      }}
    />
  ) : (
    // ← パスワードが隠れてる時 → 斜線アイコン
    <FaEyeSlash
      onClick={() => setShowPassword(true)}
      style={{
        position: "absolute",
        right: 12,
        top: "50%",
        transform: "translateY(-50%)",
        opacity: 0.9,
        cursor: "pointer",
      }}
    />
  )}
</div>


        {/* === Gradient Button === */}
        <button
          type="submit"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
            padding: "12px 14px",
            marginTop: 16,
            border: "none",
            borderRadius: 14,
            color: "white",
            fontWeight: 700,
            letterSpacing: 0.4,
            background:
              "linear-gradient(90deg, #7C3AED 0%, #EC4899 50%, #06B6D4 100%)",
            boxShadow:
              "0 10px 30px rgba(124,58,237,0.25), 0 12px 34px rgba(6,182,212,0.22)",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.90)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <span>SIGN UP</span>
          <span style={{ fontSize: 18 }}>↗</span>
        </button>

        <p style={{ marginTop: 20, fontSize: "0.85rem" }}>
          すでにアカウントをお持ちの方は{" "}
          <Link
            href={variant === "mobile" ? "/mobile/login" : "/web/login"}
            style={{
              color: "#7DD3FC",
              textDecoration: "underline",
              fontWeight: "bold",
            }}
          >
            ログイン
          </Link>
        </p>
      </div>
    </form>
  );
}
