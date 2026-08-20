import { getAdminAuth } from "@/lib/firebaseAdmin";
import { isAdminUid } from "@/lib/constants";

export async function requireAdminUid(req: Request): Promise<string> {
  const authz =
    req.headers.get("authorization") || req.headers.get("Authorization");
  const token = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) {
    const err = new Error("unauthorized");
    (err as Error & { status?: number }).status = 401;
    throw err;
  }
  const decoded = await getAdminAuth().verifyIdToken(token);
  if (!isAdminUid(decoded.uid)) {
    const err = new Error("forbidden");
    (err as Error & { status?: number }).status = 403;
    throw err;
  }
  return decoded.uid;
}
