# Cursor Automation 設定手順（一回だけ）

Agents Window で Automation を作成・更新する。プロンプトは下記 **「Automation 用プロンプト全文」** をそのまま貼る。

**前提:** この `docs/` と `.cursor/` がリポジトリに push 済みであること。

---

## チェーンが止まったとき（即対応）

1. **Merge Chain のトリガー** — `develop` push、**パスフィルタを外す**（または `apps/native/**` を含める）
2. **Daily / Web Sync / Merge Chain** — 3つとも Instructions を下記プロンプト全文に差し替え
3. **Merge Chain を手動 Run** — 1回 push すれば以降は自動連鎖

止まる典型原因: Run が docs だけ更新して **push しなかった**、または push が `apps/native/**` を含まず Merge Chain が反応しなかった。

---

## 共通設定

| 項目 | 値 |
|---|---|
| 作業ブランチ | **`develop`**（`main` ではない） |
| ツール | **git** を必ず有効化（push まで） |
| 終了時 | **コミット → `git push origin develop`**（PR は作らない） |

---

## 標準構成（3つ）

| # | 名前 | 役割 | 必須 |
|---|---|---|---|
| A | Native Parity Daily | 毎日キュー消化 | 推奨 |
| B | Native Parity Web Sync | Web 変更追従 | 任意 |
| C | Native Parity Merge Chain | **前 Run 終了後に自動で次 Run を起動** | **必須（自動続行）** |

**C がないと Run 終了後に止まる。** Daily / Web Sync / Merge Chain は **同一プロンプト** を使う。

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

## Automation C: 自動続行（Merge Chain）

**Run 終了 → push → 即次 Run。** これがないと docs だけの commit 後などにチェーンが途切れる。

| 項目 | 値 |
|---|---|
| 名前 | Native Parity Merge Chain |
| トリガー | **`develop` への push**（**パスフィルタなし** 推奨。狭める場合は `apps/native/**` を必ず含める） |
| ブランチ | **`develop`** |
| ツール | **git** |
| 指示 | 下記「Automation 用プロンプト全文」と**同一** |

### 動き

```
Run 1: キュー消化 → commit & push develop
         ↓（Merge Chain が push を検知 → 数秒〜数分で次 Run）
Run 2: parityComplete が false ならキュー先頭から再開
         ↓（繰り返し）
Run N: parityComplete: true → push せず終了
```

### チェーン継続の鉄則（プロンプトに含まれる）

1. **`parityComplete: false` なら Run 終了前に必ず push**（実装ゼロでも可）
2. **`apps/native/**` に変更がない場合** → `apps/native/.parity-chain` の `lastPushAt` を更新して commit に含める
3. **`parityComplete: true` のときだけ** push 不要

**Daily / Web Sync / Merge Chain の Instructions をすべて最新プロンプトに差し替える。**

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
   - phase-c → Phase C キュー

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
- UI キューも空 → phase-c が残っていれば phase-c へ、なければ parityComplete を true に
- Phase C キューも空 → parityComplete を true に

## Git（セッション終了時・必須）
- 作業ブランチは develop のみ（native-parity/* や cursor/* など別ブランチは作らない）
- git add（.env / .env.* / 秘密鍵は add しない）→ git commit → git push origin develop
- push 失敗時: git pull --rebase origin develop を1回試して再 push
- PR は作らない。Open Pull Request ツールは使わない

## チェーン継続（セッション終了時・必須）
- **parityComplete: false → 必ず push してから終了**（変更が docs だけでも、実装ゼロでも push する）
- `apps/native/**` に変更がない commit では、必ず `apps/native/.parity-chain` の `lastPushAt` を ISO8601 で更新して含める（Merge Chain 起動用）
- `docs/native-sync-state.json` の `lastSessionAt` も同時に更新する
- push 後に終了。Native Parity Merge Chain が次 Run を自動起動する
- **parityComplete: true のときだけ** push 不要

## セッション終了
- parityComplete: true → 完了報告して終了（push 不要）
- キューが残っている → 上記チェーン継続ルールで push して終了（ユーザーに「続けて」とは言わない）

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
5. **Automation C（Merge Chain）** のトリガーを **`develop` push・パスフィルタなし** に設定（または `apps/native/**` 必須）
6. Daily / Web Sync / Merge Chain すべての Instructions を上記プロンプト全文に差し替え

---

## CI

- `develop` push 時も Native Typecheck が走るよう、必要なら `.github/workflows/native-typecheck.yml` の `push.branches` に `develop` を追加

---

## 完了後

Automation が自律実行する:

1. **Phase B（UI 7〜8割）** — キュー先頭から **parityComplete まで**
2. **各 Run** — 実装 → typecheck → **commit & push develop**
3. **Merge Chain あり** — 毎 Run 終了時に push → 次 Run が自動起動し、ユーザー操作なしで完走
4. **完了** — `parityComplete: true` で停止

ユーザーはマージや PR 承認をしなくてよい（`develop` に直接積み上がる）。
