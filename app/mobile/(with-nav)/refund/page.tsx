// app/web/(with-nav)/legal/refund/page.tsx
"use client";

import LegalPageLayout from "@/app/component/settings/LegalPageLayout";

export default function WebRefundPolicyPage() {
  return (
    <LegalPageLayout
      variant="web"
      title="返金・キャンセルポリシー（Refund & Cancellation Policy）"
      description="Uniterz の有料プランに関する解約および返金条件について説明します。"
      updatedAt="2025-12-08"
    >
      <section>
        <h2 className="text-base font-semibold mb-1">
          1. サブスクリプションについて
        </h2>
        <p>
          Uniterz の有料プラン（Proプラン）は、月額または年額の
          サブスクリプション形式で提供されます。
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">2. 解約について</h2>
        <p>
          ユーザーは、いつでも自身の操作によりサブスクリプションを解約することができます。
        </p>
        <p className="mt-2">
          解約後も、次回更新日（契約期間終了日）までは、
          有料機能を引き続き利用できます。
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">3. 返金について</h2>
        <p>
          契約期間の途中で解約した場合であっても、
          <span className="font-semibold">
            日割り・月割り等による返金は行っておりません
          </span>
          。
        </p>
        <p className="mt-2">
          年額プランについても、途中解約による返金は行われません。
          ただし、契約期間終了日まではサービスをご利用いただけます。
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">4. 料金の請求</h2>
        <p>
          料金は、各プラン選択時に表示される金額に基づき、
          Stripe を通じて請求されます。
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">5. ポリシーの変更</h2>
        <p>
          本ポリシーは、必要に応じて変更される場合があります。
          重要な変更がある場合は、アプリ内またはWebサイト上で告知します。
        </p>
      </section>
    </LegalPageLayout>
  );
}
