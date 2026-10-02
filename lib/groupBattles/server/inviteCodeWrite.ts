/**
 * スクワッド文書の招待コード書き込み。平文は置かず、封印 + ハッシュ + 末尾4桁。
 */

import { FieldValue } from "firebase-admin/firestore";
import { hashInviteCode } from "@/lib/communities/inviteCode";
import { sealInviteCode } from "@/lib/security/sealInviteCode";

export function squadInviteCodeWriteFields(plain: string): {
  inviteCodeHash: string;
  inviteCodeLast4: string;
  inviteCodeEnc: string | null;
} {
  const trimmed = plain.trim();
  return {
    inviteCodeHash: hashInviteCode(trimmed),
    inviteCodeLast4: trimmed.slice(-4),
    inviteCodeEnc: sealInviteCode(trimmed),
  };
}

export function squadInviteCodeClearFields(): {
  inviteCodeHash: null;
  inviteCodeLast4: null;
  inviteCodeEnc: FieldValue;
  inviteCodePlain: FieldValue;
} {
  return {
    inviteCodeHash: null,
    inviteCodeLast4: null,
    inviteCodeEnc: FieldValue.delete(),
    inviteCodePlain: FieldValue.delete(),
  };
}
