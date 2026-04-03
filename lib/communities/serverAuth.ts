import { adminAuth } from "@/lib/firebaseAdmin";

export async function requireUidFromRequest(req: Request): Promise<string> {
  const authz =
    req.headers.get("authorization") || req.headers.get("Authorization");
  const token = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) throw new Error("unauthorized");
  const decoded = await adminAuth.verifyIdToken(token);
  return decoded.uid;
}
