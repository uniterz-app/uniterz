// lib/ensureSlug.ts
import { doc, getDoc, setDoc } from "firebase/firestore";

function genSlug(len = 8) {
  const chars = "abcdefghjkmnpqrstuvwxyz0123456789";
  const buf = new Uint8Array(len);
  crypto.getRandomValues(buf);
  let out = "";
  for (let i = 0; i < len; i++) out += chars[buf[i] % chars.length];
  return out;
}

export async function ensureUserSlug(db: any, uid: string) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  // 既に slug があれば OK
  if (userSnap.exists()) {
    const u = userSnap.data();
    if (u.slug) return u.slug;
  }

  // 新規 slug 生成ループ
  for (let tries = 0; tries < 5; tries++) {
    const slug = genSlug();
    const slugRef = doc(db, "slugs", slug);

    const slugSnap = await getDoc(slugRef);
    if (!slugSnap.exists()) {
      // ここは setDoc で create
      await setDoc(slugRef, { uid });

      // user に slug を書く
      await setDoc(
        userRef,
        { slug, username: slug, handle: slug },
        { merge: true }
      );

      return slug;
    }
  }

  throw new Error("Failed to generate unique slug");
}
