/**
 * Web `app/mobile/pro/subscribe/page.tsx` に相当。
 * プラン: Weekly / Monthly / Season Pass（docs/pro-billing-design.md）
 */
import { useMemo, useState } from "react";
import { cyberAlert } from "../../../components/cyberAlert";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MobilePageShell from "./MobilePageShell";
import SlantCtaNative from "../../../ui/SlantCtaNative";
import { useNativeIap } from "../../billing/useNativeIap";
import {
  IAP_FALLBACK_PRICE_JA,
  IAP_PRODUCT_IDS,
  type ProIapPlan,
} from "../../billing/iapProductIds";
import { L, Ls, resolveLocalizedLang } from "@/lib/i18n/localize";
import {
  restorePurchasesLabel,
  taxInclLabel,
} from "@/lib/pro/proSubscribePurchaseCopy";

type PlanCard = {
  id: ProIapPlan;
  title: string;
  period: string;
  badge?: string;
  note: string;
};

function catalogPriceLabel(products: unknown[], productId: string, fallback: string): string {
  const item = products.find(
    (p) => typeof p === "object" && p != null && (p as { productId?: string }).productId === productId
  ) as Record<string, unknown> | undefined;
  if (!item) return fallback;
  const price =
    (typeof item.localizedPrice === "string" && item.localizedPrice) ||
    (typeof item.price === "string" && item.price) ||
    null;
  return price ?? fallback;
}

type Props = {
  language: string;
  onClose: () => void;
  onSuccess?: (plan: ProIapPlan) => void;
  onOpenPreview?: () => void;
};

export default function MobileProSubscribeScreen({
  language,
  onClose,
  onSuccess,
  onOpenPreview,
}: Props) {
  const lang = resolveLocalizedLang(language);
  const [plan, setPlan] = useState<ProIapPlan>("monthly");
  const features = useMemo(
    () =>
      Ls(lang, [
        {
          ja: "PRO INSIGHT（試合の重要結論 3〜5）",
          en: "PRO INSIGHT (3–5 key takeaways)",
          ko: "PRO INSIGHT(경기 핵심 결론 3–5)",
          zh: "PRO INSIGHT（比赛关键结论 3–5）",
          es: "PRO INSIGHT (3–5 conclusiones clave)",
          pt: "PRO INSIGHT (3–5 conclusões-chave)",
          fr: "PRO INSIGHT (3–5 conclusions clés)",
        },
        {
          ja: "試合直前アラート",
          en: "Pre-tipoff alerts",
          ko: "경기 직전 알림",
          zh: "赛前即时提醒",
          es: "Alertas pre-partido",
          pt: "Alertas pré-jogo",
          fr: "Alertes pré-match",
        },
        {
          ja: "週次レポート",
          en: "Weekly report",
          ko: "주간 리포트",
          zh: "周报",
          es: "Informe semanal",
          pt: "Relatório semanal",
          fr: "Rapport hebdo",
        },
        {
          ja: "月次レポート（Monthly / Season）",
          en: "Monthly report (Monthly / Season)",
          ko: "월간 리포트(Monthly / Season)",
          zh: "月报（Monthly / Season）",
          es: "Informe mensual (Monthly / Season)",
          pt: "Relatório mensal (Monthly / Season)",
          fr: "Rapport mensuel (Monthly / Season)",
        },
        {
          ja: "My Rank Pro（TOP%・進捗）",
          en: "My Rank Pro (TOP% & progress)",
          ko: "My Rank Pro(TOP%·진행)",
          zh: "My Rank Pro（TOP%·进度）",
          es: "My Rank Pro (TOP% y progreso)",
          pt: "My Rank Pro (TOP% e progresso)",
          fr: "My Rank Pro (TOP% et progrès)",
        },
        {
          ja: "Pro バッジ",
          en: "Pro badge",
          ko: "Pro 배지",
          zh: "Pro 徽章",
          es: "Insignia Pro",
          pt: "Medalha Pro",
          fr: "Badge Pro",
        },
        {
          ja: "Pro Skin",
          en: "Pro Skin",
          ko: "Pro Skin",
          zh: "Pro Skin",
          es: "Pro Skin",
          pt: "Pro Skin",
          fr: "Pro Skin",
        },
      ]),
    [lang]
  );
  const plans = useMemo((): PlanCard[] => {
    return [
      {
        id: "weekly",
        title: "Weekly",
        period: L(lang, {
          ja: "/ 週",
          en: "/ week",
          ko: "/ 주",
          zh: "/ 周",
          es: "/ sem.",
          pt: "/ sem.",
          fr: "/ sem.",
        }),
        badge: L(lang, {
          ja: "7日無料",
          en: "7-day free",
          ko: "7일 무료",
          zh: "7 天免费",
          es: "7 días gratis",
          pt: "7 dias grátis",
          fr: "7 jours offerts",
        }),
        note: L(lang, {
          ja: "月次レポートなし",
          en: "No monthly report",
          ko: "월간 리포트 없음",
          zh: "无月报",
          es: "Sin informe mensual",
          pt: "Sem relatório mensal",
          fr: "Pas de rapport mensuel",
        }),
      },
      {
        id: "monthly",
        title: "Monthly",
        period: L(lang, {
          ja: "/ 月",
          en: "/ month",
          ko: "/ 월",
          zh: "/ 月",
          es: "/ mes",
          pt: "/ mês",
          fr: "/ mois",
        }),
        badge: L(lang, {
          ja: "おすすめ",
          en: "Popular",
          ko: "추천",
          zh: "推荐",
          es: "Popular",
          pt: "Popular",
          fr: "Populaire",
        }),
        note: L(lang, {
          ja: "週次・月次レポート",
          en: "Weekly + monthly reports",
          ko: "주간·월간 리포트",
          zh: "周报 + 月报",
          es: "Informes semanal + mensual",
          pt: "Relatórios semanal + mensal",
          fr: "Rapports hebdo + mensuel",
        }),
      },
      {
        id: "season",
        title: "Season Pass",
        period: L(lang, {
          ja: "〜7/31",
          en: "until Jul 31",
          ko: "~7/31",
          zh: "至 7/31",
          es: "hasta 31 jul",
          pt: "até 31 jul",
          fr: "jusqu’au 31 juil.",
        }),
        badge: L(lang, {
          ja: "〜7月末",
          en: "Until July",
          ko: "~7월 말",
          zh: "至 7 月末",
          es: "Hasta julio",
          pt: "Até julho",
          fr: "Jusqu’en juillet",
        }),
        note: L(lang, {
          ja: "自動更新なし・途中返金なし",
          en: "No auto-renew / no mid-season refund",
          ko: "자동 갱신 없음·중도 환불 없음",
          zh: "无自动续订·赛季中不退款",
          es: "Sin renovación / sin reembolso a mitad",
          pt: "Sem renovação / sem reembolso no meio",
          fr: "Sans renouvellement / sans remboursement en cours",
        }),
      },
    ];
  }, [lang]);
  const { ready, products, purchasing, purchase, restore } = useNativeIap();

  async function handlePurchase() {
    const ok = await purchase(plan);
    if (ok) {
      cyberAlert(
        L(lang, {
          ja: "完了",
          en: "Success",
          ko: "완료",
          zh: "完成",
          es: "Listo",
          pt: "Concluído",
          fr: "Succès",
        }),
        L(lang, {
          ja: "Pro プランが有効になりました。",
          en: "Pro plan activated.",
          ko: "Pro 플랜이 활성화되었습니다.",
          zh: "Pro 方案已生效。",
          es: "Plan Pro activado.",
          pt: "Plano Pro ativado.",
          fr: "Plan Pro activé.",
        })
      );
      onSuccess?.(plan);
    }
  }

  const ctaLabel = (() => {
    if (purchasing) {
      return L(lang, {
        ja: "処理中...",
        en: "Processing...",
        ko: "처리 중...",
        zh: "处理中...",
        es: "Procesando...",
        pt: "Processando...",
        fr: "Traitement...",
      });
    }
    if (plan === "weekly") {
      return L(lang, {
        ja: "7日間無料で試す（Weekly）",
        en: "Start 7-day free (Weekly)",
        ko: "7일 무료 체험(Weekly)",
        zh: "免费试用 7 天（Weekly）",
        es: "Probar 7 días gratis (Weekly)",
        pt: "Teste 7 dias grátis (Weekly)",
        fr: "Essai 7 jours gratuits (Weekly)",
      });
    }
    if (plan === "monthly") {
      return L(lang, {
        ja: "7日間無料で試す（Monthly）",
        en: "Start 7-day free (Monthly)",
        ko: "7일 무료 체험(Monthly)",
        zh: "免费试用 7 天（Monthly）",
        es: "Probar 7 días gratis (Monthly)",
        pt: "Teste 7 dias grátis (Monthly)",
        fr: "Essai 7 jours gratuits (Monthly)",
      });
    }
    return L(lang, {
      ja: "Season Pass を購入",
      en: "Buy Season Pass",
      ko: "Season Pass 구매",
      zh: "购买 Season Pass",
      es: "Comprar Season Pass",
      pt: "Comprar Season Pass",
      fr: "Acheter Season Pass",
    });
  })();

  return (
    <MobilePageShell
      title={L(lang, {
        ja: "Pro プラン",
        en: "Get Pro",
        ko: "Pro 플랜",
        zh: "Pro 方案",
        es: "Plan Pro",
        pt: "Plano Pro",
        fr: "Plan Pro",
      })}
      appBackground
      onClose={onClose}
    >
      <ScrollView contentContainerStyle={styles.pad}>
        <View style={styles.cardShell}>
          <View style={styles.heroIcon}>
            <Image
              source={require("../../../../assets/icon.png")}
              style={styles.heroImg}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.h1}>Get Pro</Text>
          <Text style={styles.lead}>
            {L(lang, {
              ja: "予想を助け、自分を分析し、課金者として目立てる。",
              en: "Better picks, clearer self-analysis, and Pro status that shows.",
              ko: "예측을 돕고, 나를 분석하며, Pro로 돋보입니다.",
              zh: "助力预测、看清自己，并以 Pro 身份脱颖而出。",
              es: "Mejores picks, autoanálisis claro y status Pro visible.",
              pt: "Melhores palpites, autoanálise clara e status Pro.",
              fr: "Meilleurs picks, auto-analyse claire et statut Pro.",
            })}
          </Text>

          <View style={styles.grid}>
            {plans.map((p) => {
              const on = plan === p.id;
              const price = catalogPriceLabel(
                products,
                IAP_PRODUCT_IDS[p.id],
                IAP_FALLBACK_PRICE_JA[p.id]
              );
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setPlan(p.id)}
                  style={[styles.priceCard, on ? styles.priceCardOn : styles.priceCardOff]}
                >
                  {p.badge ? (
                    <View style={[styles.badge, on ? styles.badgeOn : styles.badgeOff]}>
                      <Text style={[styles.badgeTxt, on && styles.badgeTxtOn]}>
                        {p.badge}
                      </Text>
                    </View>
                  ) : null}
                  <Text style={[styles.priceTitle, on && styles.priceTitleOn]}>
                    {p.title}
                  </Text>
                  <Text style={[styles.priceAmt, on && styles.priceAmtOn]}>
                    {price}
                    <Text style={[styles.period, on && styles.periodOn]}>
                      {" "}
                      {p.period}
                    </Text>
                  </Text>
                  <Text style={[styles.tax, on && styles.taxOn]}>{taxInclLabel(lang)}</Text>
                  <Text style={[styles.note, on && styles.noteOn]}>{p.note}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.noteSmall}>
            {L(lang, {
              ja: "※ Season Pass は対象 NBA シーズン終了（原則 7/31）まで。自動更新なし。途中解約の返金なし。",
              en: "Season Pass lasts through the NBA season (through July 31). No auto-renew. No mid-season refund.",
              ko: "※ Season Pass는 해당 NBA 시즌 종료(원칙 7/31)까지. 자동 갱신 없음. 중도 환불 없음.",
              zh: "※ Season Pass 覆盖至目标 NBA 赛季结束（原则上 7/31）。无自动续订，中途不退款。",
              es: "※ Season Pass dura hasta fin de temporada NBA (31 jul). Sin renovación ni reembolso a mitad.",
              pt: "※ Season Pass vale até o fim da temporada NBA (31 jul). Sem renovação nem reembolso no meio.",
              fr: "※ Season Pass jusqu’à la fin de saison NBA (31 juil.). Pas de renouvellement ni de remboursement en cours.",
            })}
          </Text>

          <SlantCtaNative
            label={ctaLabel}
            onPress={handlePurchase}
            disabled={!ready || purchasing}
          />

          <Pressable onPress={() => void restore()} style={styles.restoreBtn}>
            <Text style={styles.restoreTxt}>{restorePurchasesLabel(lang)}</Text>
          </Pressable>

          {onOpenPreview ? (
            <Pressable onPress={onOpenPreview} style={styles.previewBtn}>
              <Text style={styles.previewTxt}>
                {L(lang, {
                  ja: "お試し導線のプレビュー",
                  en: "Preview trial flow",
                  ko: "체험 플로우 미리보기",
                  zh: "试用流程预览",
                  es: "Vista previa del trial",
                  pt: "Prévia do fluxo de teste",
                  fr: "Aperçu du parcours d’essai",
                })}
              </Text>
            </Pressable>
          ) : null}

          <Text style={styles.disclaimer}>
            {L(lang, {
              ja: "※ App Store / Google Play 経由の購入です",
              en: "Purchases via App Store / Google Play.",
              ko: "※ App Store / Google Play 구매입니다",
              zh: "※ 通过 App Store / Google Play 购买",
              es: "※ Compras vía App Store / Google Play.",
              pt: "※ Compras via App Store / Google Play.",
              fr: "※ Achats via App Store / Google Play.",
            })}
          </Text>

          <View style={{ marginTop: 16, gap: 10 }}>
            {features.map((text) => (
              <View key={text} style={styles.featRow}>
                <LinearGradient colors={["#3B82F6", "#22D3EE"]} style={styles.featCheck}>
                  <Text style={styles.featCheckTxt}>✓</Text>
                </LinearGradient>
                <Text style={styles.featTxt}>{text}</Text>
              </View>
            ))}
          </View>

          <View style={{ marginTop: 22, gap: 8 }}>
            <Text style={styles.foot}>
              {L(lang, {
                ja: "※ Weekly / Monthly は自動更新されます。解約はストアの管理画面から。",
                en: "Weekly / Monthly auto-renew. Cancel in the store subscription settings.",
                ko: "※ Weekly / Monthly는 자동 갱신됩니다. 해지는 스토어에서.",
                zh: "※ Weekly / Monthly 会自动续订。请在商店订阅设置中取消。",
                es: "※ Weekly / Monthly se renuevan solos. Cancela en la tienda.",
                pt: "※ Weekly / Monthly renovam sozinhos. Cancele na loja.",
                fr: "※ Weekly / Monthly se renouvellent. Annulez dans le store.",
              })}
            </Text>
            <Text style={styles.foot}>
              {L(lang, {
                ja: "※ 他人の予想は見せません。勝者は断言しません。",
                en: "We never show others’ picks or declare winners.",
                ko: "※ 타인의 예측은 보여주지 않습니다. 승자를 단정하지 않습니다.",
                zh: "※ 不会展示他人预测，也不会断言胜者。",
                es: "※ Nunca mostramos picks ajenos ni declaramos ganadores.",
                pt: "※ Nunca mostramos palpites de outros nem declaramos vencedores.",
                fr: "※ Nous ne montrons jamais les picks des autres ni ne déclarons de gagnants.",
              })}
            </Text>
          </View>
        </View>
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingTop: 24, paddingBottom: 48 },
  cardShell: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingVertical: 28,
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 28,
    elevation: 10,
  },
  heroIcon: {
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroImg: { width: 32, height: 32 },
  h1: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 8,
  },
  lead: {
    textAlign: "center",
    fontSize: 13,
    color: "rgba(248,250,252,0.65)",
    marginBottom: 18,
    lineHeight: 18,
  },
  grid: { gap: 10, marginBottom: 10 },
  priceCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  priceCardOn: { backgroundColor: "#fff", borderColor: "#fff" },
  priceCardOff: { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.2)" },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 6,
  },
  badgeOn: { backgroundColor: "#facc15" },
  badgeOff: { backgroundColor: "rgba(250,204,21,0.2)" },
  badgeTxt: { fontSize: 10, fontWeight: "900", color: "rgba(250,204,21,0.95)" },
  badgeTxtOn: { color: "#000" },
  priceTitle: { fontWeight: "800", color: "#fff", fontSize: 15 },
  priceTitleOn: { color: "#000" },
  priceAmt: { fontSize: 22, fontWeight: "900", marginTop: 4, color: "#fff" },
  priceAmtOn: { color: "#000" },
  period: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.55)" },
  periodOn: { color: "rgba(0,0,0,0.5)" },
  tax: { fontSize: 10, opacity: 0.55, color: "#fff", marginTop: 2 },
  taxOn: { color: "rgba(0,0,0,0.55)" },
  note: { fontSize: 11, color: "rgba(248,250,252,0.55)", marginTop: 6 },
  noteOn: { color: "rgba(0,0,0,0.55)" },
  noteSmall: {
    fontSize: 11,
    color: "rgba(248,250,252,0.55)",
    textAlign: "center",
    marginBottom: 12,
  },
  restoreBtn: { alignItems: "center", paddingVertical: 8, marginBottom: 8 },
  restoreTxt: { fontSize: 13, color: "rgba(34,211,238,0.85)", fontWeight: "600" },
  previewBtn: {
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(240,204,114,0.4)",
    borderRadius: 2,
  },
  previewTxt: { fontSize: 12, color: "rgba(240,204,114,0.9)", fontWeight: "700", letterSpacing: 0.6 },
  disclaimer: { fontSize: 11, color: "rgba(248,250,252,0.5)", textAlign: "center", marginBottom: 8 },
  featRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  featCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  featCheckTxt: { fontSize: 10, fontWeight: "900", color: "#000" },
  featTxt: { flex: 1, fontSize: 14, color: "rgba(248,250,252,0.85)", lineHeight: 20 },
  foot: { fontSize: 12, color: "rgba(248,250,252,0.6)", textAlign: "center", lineHeight: 18 },
});
