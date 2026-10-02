# Pro Insight ナラティブ — コスト試算

前提（実装どおり）:

- モデル既定: `gpt-4o-mini`（`OPENAI_PRO_INSIGHT_MODEL` / `OPENAI_MODEL`）
- **full** = OpenAI Batch（50% 割引）
- **patch** = 通常 Chat Completions（指紋変化時のみ）
- 7 言語を **1 リクエスト** で生成
- データは Firestore のみ → **このパスの BDL 追加コストは $0**（`BALLDONTLIE_API_KEY` は既存 ingest 用）

## 単価（2026-09 時点の目安）

| | Input /1M | Output /1M |
|---|---|---|
| gpt-4o-mini 通常 | $0.15 | $0.60 |
| gpt-4o-mini **Batch** | $0.075 | $0.30 |

## 1 試合あたりトークン見積もり

| | tokens（目安） |
|---|---|
| system + facts JSON（input） | 1,500–2,500 |
| 7 言語 prose JSON（output） | 2,500–4,000 |

### Batch（full）1 試合

- input 2,000 × $0.075/1M ≈ **$0.00015**
- output 3,500 × $0.30/1M ≈ **$0.00105**
- **合計 ≈ $0.0012 / 試合**（幅: 約 $0.0008–0.002）

### Chat（patch）1 試合

通常単価なので Batch の約 **2 倍** → **≈ $0.0024 / 試合**

## 月次・シーズン

| シナリオ | 計算 | 概算 |
|---|---|---|
| レギュラー 1 試合 × 1 回 Batch | 1,230 × $0.0012 | **~$1.5 / シーズン** |
| シーズン中の月（~200 tip / 月）Batch のみ | 200 × $0.0012 | **~$0.24** |
| + patch 30%（injury 指紋変化） | 60 × $0.0024 | + **~$0.14** |
| 運用目安（シーズン中 / 月） | Batch + 少なめ patch | **~$0.5–2** |
| tip 1h · injury 未変更 | skip | **$0** |
| ポーリング（15 分 cron） | GET batch のみ | **$0**（トークン課金なし） |

キー未設定時は fact フォールバックのみ → OpenAI **$0**。

## BDL

| 項目 | コスト |
|---|---|
| Pro Insight narrative batch / poll | **+$0**（Firestore 読みのみ） |
| 既存の日次 / injury / league-stats ingest | 既存プランどおり（この機能では増やさない） |

## env（あとで投入 · Next サーバーのみ）

```
# .env.local / Vercel Production
OPENAI_API_KEY=sk-...
# 任意エイリアス: CHATGPT_API_KEY
# 任意: OPENAI_PRO_INSIGHT_MODEL=gpt-4o-mini
```

`EXPO_PUBLIC_` に載せない。Cron は Firebase → Next `/api/admin/nba-pro-brief-ingest` を叩くので、**キーは Next 側**に置く。

### Functions デプロイ（対象）

```bash
cd functions && npm run build
npx firebase deploy --only \
  functions:runNbaProBriefFullCron,\
functions:runNbaProInsightBatchPollCron,\
functions:runNbaProBriefPatchCron
```

| Cron | スケジュール | mode |
|---|---|---|
| `runNbaProBriefFullCron` | 毎日 20:00 JST | `batch_submit` |
| `runNbaProInsightBatchPollCron` | 15 分ごと | `batch_poll` |
| `runNbaProBriefPatchCron` | 毎時 :15 | `narrative_patch`（injury 変更時のみ） |
