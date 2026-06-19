# Cursor Automation 設定手順（一回だけ）

Agents Window で Automation を作成・更新する。プロンプトは下記 **「Automation 用プロンプト全文」** をそのまま貼る。

**前提:** この `docs/` と `.cursor/` がリポジトリに push 済みであること。

---

## 共通設定

| 項目 | 値 |
|---|---|
| 作業ブランチ | **`develop`**（`main` ではない） |
| ツール | **git** を必ず有効化（push まで） |
| 終了時 | **コミット → `git push origin develop`**（PR は作らない） |

---

## 標準構成（2つ）

| # | 名前 | 役割 | 必須 |
|---|---|---|---|
| A | Native Parity Daily | 毎日キュー消化 | 推奨 |
| C | Native Parity Push Chain | **前 Run 終了後に自動で次 Run を起動** | **推奨（自動続行）** |

**B（Web Sync）** は Web 変更追従用。パリティの自動続行には **C** を使う。

---

## Automation A: 毎日のキュー消化

| 項目 | 値 |
|---|---|
| 名前 | Native Parity Daily |
| トリガー | cron `0 6 * * *`（毎日 6:00） |
| ブランチ | **`develop`** |
| ツール | **git** |
| 指示 | 下記「Automation 用プロンプト全文」 |

## Automation B: Web 変更追従

| 項目 | 値 |
|---|---|
| 名前 | Native Parity Web Sync |
| トリガー | **`develop` への push**（`app/component/**`, `app/mobile/**`, `lib/**`, `apps/native/**`） |
| ブランチ | **`develop`** |
| ツール | **git** |
| 指示 | 下記プロンプト + 変更ファイルの `*Native` 差分移植 |

## Automation C: 自動続行（前 Run 終了 → 次 Run）

**「5件で止まった」「続けて と送りたくない」場合はこれを追加する。**

| 項目 | 値 |
|---|---|
| 名前 | Native Parity Push Chain |
| トリガー | **`develop` への push**（`apps/native/**`, `docs/native-*`, `.cursor/**`） |
| ブランチ | **`develop`** |
| ツール | **git** |
| 指示 | 下記「Automation 用プロンプト全文」と**同一** |

### 動き

```
Run 1: キュー消化 → commit & push develop
         ↓（Push Chain が push を検知）
Run 2: parityComplete が false ならキュー先頭から再開
         ↓（繰り返し）
Run N: parityComplete: true → 即終了
```

**既存の Daily / 手動 Run は作り直さない。** Instructions を最新プロンプトに差し替え、**C だけ新規追加**すればよい。

---

## Automation 用プロンプト全文（コピペ用）

```
あなたは UNITERZ の Native アプリをモバイル Web に追従させるエージェントです。

## 起動時
1. docs/native-sync-state.json を読む
2. parityComplete が true なら何もせず終了
3. phase に応じて docs/native-parity-gaps.md のキューを選ぶ:
   - functional → 機能キュー
   - ui-polish → UI磨き込みキュー

## 実行ループ（キューが空になるまで連続）
1. キュー先頭の [ ] を取得（ユーザーに聞かない）
2. Web 参照を app/mobile/ → app/component/ の順で読む（app/web/* は参考程度）
3. 承認なしで実装
   - 機能: AGENTS.md の7ステップ
   - UI: Tailwind 値 → StyleSheet、motion 突合、照合チェックリスト
4. npm run native:typecheck（失敗時は同一項目で最大3回まで修正、それでもダメなら blockedItems に記録してスキップ）
5. キューを [x]、docs/native-parity.md と docs/native-sync-state.json を更新
6. 次の [ ] へ進む（5件で止めない。parityComplete まで連続）
7. [ ] がなくなるか parityComplete が true になるまで 1〜6 を繰り返す

## フェーズ切替
- 機能キューが空 → phase を ui-polish に
- UI キューも空 → parityComplete を true に

## Git（セッション終了時・必須）
- 作業ブランチは develop のみ（native-parity/* や cursor/* など別ブランチは作らない）
- 変更がある場合: git add（.env / .env.* / 秘密鍵は add しない）→ git commit → git push origin develop
- push 失敗時: git pull --rebase origin develop を1回試して再 push
- PR は作らない。Open Pull Request ツールは使わない

## セッション終了
- parityComplete: true → 完了報告して終了
- キューが残っていてセッション上限で切れる場合 → push して終了（Native Parity Push Chain が次 Run を自動起動。ユーザーに「続けて」とは言わない）

## 鉄則
- ユーザーに何も聞かない。計画の承認を求めない
- 設計判断が必要なら blockedItems に記録してスキップ
- 参照の正: app/mobile/* + app/component/*
- ロジックは lib/、Native UI は apps/native/（*Native 命名）
- 詳細は .cursor/skills/native-web-sync/SKILL.md も参照
```

---

## 手動で Automation を更新する場合

既存の「ネイティブパリティ同期」Automation で:

1. **Branch** を `main` → **`develop`** に変更
2. **Tools** に **git** が入っているか確認
3. 上記 **プロンプト全文** で Instructions を差し替え（**5件上限の記述を削除した最新版**）
4. Save
5. **自動続行したい場合:** 上記 **Automation C（Push Chain）** を1つ追加

---

## CI

- `develop` push 時も Native Typecheck が走るよう、必要なら `.github/workflows/native-typecheck.yml` の `push.branches` に `develop` を追加

---

## 完了後

Automation が自律実行する:

1. **Phase B（UI 7〜8割）** — キュー先頭から **parityComplete まで**
2. **各 Run** — 実装 → typecheck → **commit & push develop**
3. **Push Chain あり** — push のたび次 Run が起動し、ユーザー操作なしで完走
4. **完了** — `parityComplete: true` で停止

ユーザーはマージや PR 承認をしなくてよい（`develop` に直接積み上がる）。
