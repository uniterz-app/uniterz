/** 共有ページ（リンクプレビュー・未ログイン画面）用の最小データ。クライアントに渡してよい項目だけ */

export type ShareAuthorMeta = {
  name: string;
  handle: string | null;
  photoURL: string | null;
};

export type ResultShareMeta =
  | { kind: "missing" }
  | {
      kind: "result";
      /** 試合開始前は false（予想は載せない） */
      visible: boolean;
      startAtMs: number | null;
      homeName: string;
      awayName: string;
      author: ShareAuthorMeta;
      pick: { home: number; away: number } | null;
      final: { home: number; away: number } | null;
      totalPoints: number | null;
    };

export type ProfileShareMeta =
  | { kind: "missing" }
  | {
      kind: "profile";
      displayName: string;
      handle: string;
      photoURL: string | null;
      bio: string | null;
    };

export type CommunityShareMeta =
  | { kind: "missing" }
  | {
      kind: "community";
      name: string;
      memberCount: number;
    };
