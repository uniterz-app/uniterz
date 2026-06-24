export type PatchCommunityGroupInput = {
  name: string;
  description?: string | null;
  headerImageUrl?: string | null;
  headerImagePositionY?: number;
};

export type PatchCommunityGroupResult =
  | {
      ok: true;
      group: {
        id: string;
        name: string;
        description: string | null;
        headerImageUrl: string | null;
        headerImagePositionY: number;
      };
    }
  | { ok: false; error: string };

/** グループ更新 PATCH（名前は必須・説明・画像は任意） */
export async function patchCommunityGroup(
  groupId: string,
  authHeader: string,
  input: PatchCommunityGroupInput,
  resolveUrl: (path: string) => string = (path) => path
): Promise<PatchCommunityGroupResult> {
  const body: Record<string, unknown> = { name: input.name };
  if (input.description !== undefined) body.description = input.description;
  if (input.headerImageUrl !== undefined) body.headerImageUrl = input.headerImageUrl;
  if (input.headerImagePositionY !== undefined) {
    body.headerImagePositionY = input.headerImagePositionY;
  }

  const res = await fetch(resolveUrl(`/api/communities/${groupId}/update`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: authHeader },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.ok) {
    return { ok: false, error: String(json?.error ?? "failed") };
  }
  return { ok: true, group: json.group };
}
