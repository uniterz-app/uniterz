"use client";

import LegalPageLayout from "@/app/component/settings/LegalPageLayout";

export default function MobileSpecifiedCommercialTransactionPage() {
  return (
    <LegalPageLayout
      variant="mobile"
      title="特定商取引法に基づく表記"
      description="有料サービスに関する事業者情報および取引条件を明示します。"
      updatedAt="2026-01-26"
    >
      <section className="space-y-5 text-sm leading-relaxed text-white/80">
        {/* 事業者情報 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            事業者情報
          </h2>
          <ul className="space-y-1">
            <li>事業者名：神谷陸登</li>
            <li>運営責任者：神谷陸登</li>
            <li>所在地：〒220-0072
神奈川県横浜市西区浅間町1丁目4番3号ウィザードビル402</li>
            <li>
              電話番号：
              <span className="ml-1">
                請求があった場合、遅滞なく開示します
              </span>
            </li>
            <li>メールアドレス：uniterz.team@gmail.com</li>
          </ul>
        </div>

        {/* サービス内容 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            販売するサービス
          </h2>
          <p>
            Uniterz Pro は、スポーツ分析データの可視化および高度な分析指標を提供する
            サブスクリプション型サービスです。
          </p>
        </div>

        {/* 販売価格 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            販売価格
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>月額プラン：600円（税込）</li>
            <li>年額プラン：4,800円（税込）</li>
          </ul>
        </div>

        {/* 支払い方法・時期 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            支払い方法・支払い時期
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>支払い方法：クレジットカード（Stripe）</li>
            <li>支払い時期：申込時に即時決済され、その後は自動更新されます</li>
          </ul>
        </div>

        {/* 提供時期 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            サービスの提供時期
          </h2>
          <p>
            決済完了後、ただちにProプランの機能を利用できます。
          </p>
        </div>

        {/* 解約・キャンセル */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            解約・キャンセルについて
          </h2>
          <p>
            解約はアプリ内の所定の手続きからいつでも行うことができます。
            解約後も、契約期間の終了日まではPro機能を利用できます。
          </p>
        </div>

        {/* 返金 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            返金について
          </h2>
          <p>
            サービスの性質上、原則として返金は行いません。
            ただし、当社が特別に認めた場合に限り返金対応を行うことがあります。
          </p>
        </div>

        {/* 注意事項 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            注意事項
          </h2>
          <p>
            本サービスは分析・可視化を目的としたものであり、
            投資助言・ギャンブル行為を目的とするものではありません。
            成果や利益を保証するものではありません。
          </p>
        </div>
      </section>
    </LegalPageLayout>
  );
}