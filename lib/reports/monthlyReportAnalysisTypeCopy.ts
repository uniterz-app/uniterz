// 月次レポート用・分析タイプ説明文（docs/pro-subscription-plan.md ドラフト確定尺）
// タイプ名（label）はプロダクトのブランド語として英語のまま。本文は 7 言語ネイティブ訳。

import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";
import type { UiStrings } from "@/lib/i18n/ui";

export type MonthlyReportAnalysisTypeCopy = {
  label: string;
  /** 改行区切りの本文（現在言語で解決済み） */
  description: string;
};

type MonthlyReportAnalysisTypeCopySource = {
  label: string;
  /** 改行区切りの本文。7 言語すべてを持つ */
  description: UiStrings;
};

/** 段落を `\n` で連結する。UI 側は split("\n") で行ごとに描画する */
function lines(...rows: readonly string[]): string {
  return rows.join("\n");
}

/**
 * V1 19 種。未移行の旧 ID は nearest にエイリアスして参照する。
 */
export const MONTHLY_REPORT_ANALYSIS_TYPE_COPY: Record<
  string,
  MonthlyReportAnalysisTypeCopySource
> = {
  PROSPECT: {
    label: "Prospect",
    description: {
      ja: lines(
        "まだ特定の分析スタイルに固定されていない、伸びしろ優先のタイプです。",
        "ピックアップへの参加が半分未満か、5軸のどれもまだ「強み」まで届いていない状態。型がないのではなく、これから作る途中にいます。",
        "まずはピックアップの半分以上に参加し、手応えのある軸を1つ選んで強みラインまで押し上げましょう。参加が足りない月は、質より先に量の土台です。",
        "何者にもなれる可能性を秘めた Prospect。"
      ),
      en: lines(
        "A growth-first profile that hasn't locked into any one analysis style yet.",
        "Either you picked under half of the pickup slate, or none of the five axes reached the strength line. You don't lack a style — you're still building it.",
        "Start by clearing half of the pickup slate, then choose the axis that feels best and push it past the strength line. In a thin month, volume comes before quality.",
        "Still able to become anything — a true Prospect."
      ),
      ko: lines(
        "아직 특정 분석 스타일에 고정되지 않은, 성장 여력 우선의 타입입니다.",
        "픽업 참여가 절반 미만이거나, 5개 축 중 어느 것도 아직 '강점' 라인에 닿지 않은 상태입니다. 스타일이 없는 게 아니라 지금 만들어 가는 중입니다.",
        "먼저 픽업의 절반 이상에 참여하고, 감이 좋은 축 하나를 골라 강점 라인까지 밀어 올리세요. 참여가 부족한 달에는 질보다 양의 토대가 먼저입니다.",
        "무엇이든 될 수 있는 가능성을 품은 Prospect."
      ),
      zh: lines(
        "尚未固定于某种分析风格、以成长空间为先的类型。",
        "要么本月参与的精选场次不到一半，要么五个维度都还没达到「强项」线。不是没有风格，而是正在打造。",
        "先把精选场次的参与率提到一半以上，再挑一个手感最好的维度推过强项线。参与量不足的月份，先立量的基础，再谈质。",
        "一切皆有可能的 Prospect。"
      ),
      es: lines(
        "Un perfil orientado al crecimiento que aún no se ha fijado en un estilo de análisis.",
        "O participaste en menos de la mitad de los partidos destacados, o ninguno de los cinco ejes llegó a la línea de fortaleza. No te falta estilo: todavía lo estás construyendo.",
        "Empieza por superar la mitad de los partidos destacados y elige el eje con mejores sensaciones para llevarlo hasta la línea de fortaleza. En un mes flojo, la cantidad va antes que la calidad.",
        "Con todo por delante: un auténtico Prospect."
      ),
      pt: lines(
        "Um perfil focado em crescimento que ainda não se fixou em um estilo de análise.",
        "Ou você participou de menos da metade dos jogos em destaque, ou nenhum dos cinco eixos alcançou a linha de força. Não falta estilo: você ainda está construindo o seu.",
        "Comece passando da metade dos jogos em destaque e escolha o eixo com melhor sensação para empurrá-lo até a linha de força. Em um mês fraco, quantidade vem antes de qualidade.",
        "Com tudo em aberto: um verdadeiro Prospect."
      ),
      fr: lines(
        "Un profil axé sur la progression, qui ne s'est pas encore figé dans un style d'analyse.",
        "Soit vous avez joué moins de la moitié des matchs sélectionnés, soit aucun des cinq axes n'a atteint la ligne de force. Ce n'est pas l'absence de style : il est encore en construction.",
        "Commencez par dépasser la moitié des matchs sélectionnés, puis choisissez l'axe qui vous inspire le plus et poussez-le au-delà de la ligne de force. Un mois creux, la quantité passe avant la qualité.",
        "Tout reste possible : un vrai Prospect."
      ),
    },
  },
  GOAT: {
    label: "GOAT",
    description: {
      ja: lines(
        "5軸すべてが強みの、月間における最高到達点のタイプです。",
        "勝敗・得点者・波乱・参加量・安定のどれにも穴がなく、総合力で一段上にいます。",
        "次に足すものより、この水準を翌月も落とさない運用がテーマ。参加のムラや連敗の傷に注意し、5軸のバランスを維持しましょう。",
        "すべてを兼ね備えた頂点は、まさに GOAT。"
      ),
      en: lines(
        "All five axes are strengths — the highest tier a month can reach.",
        "Wins, scorers, upsets, volume and stability: no holes anywhere, a clear step above on overall ability.",
        "The theme isn't adding something new, it's holding this level next month. Watch for uneven participation and losing runs, and keep the five axes balanced.",
        "Everything, all at once — the GOAT."
      ),
      ko: lines(
        "5개 축 모두가 강점인, 한 달에 도달할 수 있는 최고 등급입니다.",
        "승패·득점자·업셋·참여량·안정성 어디에도 빈틈이 없고, 종합력에서 한 단계 위에 있습니다.",
        "무엇을 더할지보다 이 수준을 다음 달에도 유지하는 운영이 과제입니다. 참여 편차와 연패의 상처를 경계하고 5개 축의 균형을 지키세요.",
        "모든 것을 갖춘 정점, 그것이 GOAT."
      ),
      zh: lines(
        "五个维度全部为强项，是单月能达到的最高层级。",
        "胜负、得分者、冷门、参与量、稳定性都没有短板，综合实力高出一档。",
        "主题不是再加什么，而是下个月守住这个水准。留意参与量的起伏和连败的损伤，保持五维平衡。",
        "面面俱到的顶点，正是 GOAT。"
      ),
      es: lines(
        "Los cinco ejes son fortalezas: el techo más alto que puede alcanzar un mes.",
        "Victorias, anotadores, upsets, volumen y estabilidad: sin huecos en ningún lado, un escalón por encima en conjunto.",
        "El tema no es añadir algo nuevo, sino mantener este nivel el mes que viene. Vigila la irregularidad en la participación y las malas rachas, y conserva el equilibrio entre los cinco ejes.",
        "Todo a la vez: el GOAT."
      ),
      pt: lines(
        "Os cinco eixos são forças: o teto mais alto que um mês pode alcançar.",
        "Vitórias, cestinhas, upsets, volume e estabilidade: sem furos em nenhum ponto, um degrau acima no conjunto.",
        "O tema não é acrescentar algo novo, mas sustentar esse nível no mês seguinte. Atenção à irregularidade de participação e às séries de derrotas, e mantenha o equilíbrio entre os cinco eixos.",
        "Tudo ao mesmo tempo: o GOAT."
      ),
      fr: lines(
        "Les cinq axes sont des forces : le plus haut niveau atteignable sur un mois.",
        "Victoires, marqueurs, upsets, volume et régularité : aucun trou, un cran au-dessus sur l'ensemble.",
        "L'enjeu n'est pas d'ajouter, mais de tenir ce niveau le mois prochain. Surveillez l'irrégularité de participation et les séries de défaites, et gardez les cinq axes équilibrés.",
        "Tout à la fois : le GOAT."
      ),
    },
  },
  COMPLETE_PLAYER: {
    label: "Complete Player",
    description: {
      ja: lines(
        "5軸中4つが強みの、ほぼ完成形の総合タイプです。",
        "致命的な穴はなく、残る1軸だけが強みライン未達。いわば GOAT の一歩手前です。",
        "来月は全部を均等に伸ばすより、未達の1軸だけを単一目標にして押し上げましょう。それが埋まれば GOAT 圏に届きます。",
        "高い完成度で戦うスタイルは、まさに Complete Player。"
      ),
      en: lines(
        "Four of five axes are strengths — an almost finished all-round profile.",
        "There's no fatal hole; only one axis is short of the strength line. You're one step from GOAT.",
        "Next month, don't spread the effort evenly — make that single missing axis your only target. Close it and GOAT is in range.",
        "Winning on sheer completeness: a Complete Player."
      ),
      ko: lines(
        "5개 축 중 4개가 강점인, 거의 완성형에 가까운 종합 타입입니다.",
        "치명적인 빈틈은 없고, 남은 1개 축만 강점 라인에 못 미칩니다. 말하자면 GOAT 한 걸음 앞입니다.",
        "다음 달에는 전부를 고르게 올리기보다, 미달인 1개 축만 단일 목표로 밀어 올리세요. 그것만 메우면 GOAT 권에 닿습니다.",
        "높은 완성도로 싸우는 스타일, 그것이 Complete Player."
      ),
      zh: lines(
        "五维中有四项为强项，接近完成形的综合型。",
        "没有致命短板，只剩一个维度未达强项线，可谓距 GOAT 一步之遥。",
        "下个月不必平均用力，把未达标的那一维当成唯一目标推上去。补齐之后就能进入 GOAT 区间。",
        "以高完成度取胜的风格，正是 Complete Player。"
      ),
      es: lines(
        "Cuatro de los cinco ejes son fortalezas: un perfil integral casi terminado.",
        "No hay ningún hueco grave; solo un eje se queda corto de la línea de fortaleza. Estás a un paso del GOAT.",
        "El mes que viene no reparta el esfuerzo: convierta ese único eje pendiente en su objetivo exclusivo. Si lo cierra, el GOAT queda a tiro.",
        "Ganar por pura solidez: un Complete Player."
      ),
      pt: lines(
        "Quatro dos cinco eixos são forças: um perfil completo quase pronto.",
        "Não há furo grave; só um eixo ficou abaixo da linha de força. Você está a um passo do GOAT.",
        "No mês seguinte, não divida o esforço: faça daquele único eixo pendente o seu objetivo exclusivo. Fechado ele, o GOAT fica ao alcance.",
        "Vencer pela solidez: um Complete Player."
      ),
      fr: lines(
        "Quatre axes sur cinq sont des forces : un profil complet presque abouti.",
        "Aucun trou grave ; un seul axe reste sous la ligne de force. Vous êtes à un pas du GOAT.",
        "Le mois prochain, ne dispersez pas vos efforts : faites de cet axe manquant votre unique objectif. Comblé, le GOAT devient accessible.",
        "Gagner par la solidité : un Complete Player."
      ),
    },
  },
  ALL_ROUNDER: {
    label: "All-Rounder",
    description: {
      ja: lines(
        "5軸中3つが強みの、多面的に戦えるタイプです。",
        "ひとつの武器に依存せず、複数の勝ち筋を同時に持てるのが強み。過半数がすでに機能しています。",
        "さらに上を目指すなら、未達の2軸のうち優先の1本だけを伸ばしましょう。次の到達点は Complete Player（強み4）です。",
        "局面を選ばず機能する総合力は、まさに All-Rounder。"
      ),
      en: lines(
        "Three of five axes are strengths — a profile that can fight on several fronts.",
        "You don't lean on a single weapon; multiple paths to points work at once, and the majority of axes already fire.",
        "To climb higher, pick just one of the two remaining axes and grow it. The next stop is Complete Player (four strengths).",
        "Effective in any situation: an All-Rounder."
      ),
      ko: lines(
        "5개 축 중 3개가 강점인, 다면적으로 싸울 수 있는 타입입니다.",
        "하나의 무기에 의존하지 않고 여러 승리 루트를 동시에 갖는 것이 강점입니다. 이미 과반의 축이 작동합니다.",
        "더 위를 노린다면 미달인 2개 축 중 우선순위 1개만 키우세요. 다음 도달점은 Complete Player(강점 4)입니다.",
        "국면을 가리지 않는 종합력, 그것이 All-Rounder."
      ),
      zh: lines(
        "五维中有三项为强项，能多线作战的类型。",
        "不依赖单一武器，可同时拥有多条得分路径，过半维度已在运作。",
        "想再上一层，就从未达标的两维中只挑一项来提升。下一个目标是 Complete Player（四项强项）。",
        "不挑局面都能发挥的综合力，正是 All-Rounder。"
      ),
      es: lines(
        "Tres de los cinco ejes son fortalezas: un perfil capaz de pelear en varios frentes.",
        "No depende de un solo recurso; tiene varias vías de puntuar a la vez y ya funciona en la mayoría de los ejes.",
        "Para subir más, elija solo uno de los dos ejes pendientes y hágalo crecer. La siguiente parada es Complete Player (cuatro fortalezas).",
        "Eficaz en cualquier escenario: un All-Rounder."
      ),
      pt: lines(
        "Três dos cinco eixos são forças: um perfil capaz de brigar em várias frentes.",
        "Não depende de um único recurso; tem vários caminhos de pontuação ao mesmo tempo e já funciona na maioria dos eixos.",
        "Para subir mais, escolha apenas um dos dois eixos pendentes e faça-o crescer. A próxima parada é Complete Player (quatro forças).",
        "Eficaz em qualquer cenário: um All-Rounder."
      ),
      fr: lines(
        "Trois axes sur cinq sont des forces : un profil capable de jouer sur plusieurs tableaux.",
        "Aucune dépendance à une seule arme ; plusieurs voies de points fonctionnent en même temps, et la majorité des axes tourne déjà.",
        "Pour monter encore, ne travaillez qu'un seul des deux axes restants. Prochaine étape : Complete Player (quatre forces).",
        "Efficace en toute situation : un All-Rounder."
      ),
    },
  },
  FINISHER: {
    label: "Finisher",
    description: {
      ja: lines(
        "WIN が唯一の強みの、勝敗予想に特化したタイプです。",
        "試合の勝ち負けを高い水準で取り切る力が、今月の軸になっています。",
        "さらに伸ばすなら SCORER か CONSISTENCY を足し、勝ちを得点と安定につなげましょう。次の二軸到達点は Two-Way Player か High Floor です。",
        "最後に勝負を決める決定力は、まさに Finisher。"
      ),
      en: lines(
        "WIN is your only strength — a profile specialized in calling game winners.",
        "Closing out wins and losses at a high level is what carried this month.",
        "To grow, add SCORER or CONSISTENCY and turn wins into points and stability. The next two-axis stops are Two-Way Player and High Floor.",
        "The one who closes it out: a Finisher."
      ),
      ko: lines(
        "WIN만이 강점인, 승패 예상에 특화된 타입입니다.",
        "경기의 승패를 높은 수준으로 끝까지 잡아내는 힘이 이번 달의 축이었습니다.",
        "더 키우려면 SCORER 또는 CONSISTENCY를 더해 승리를 득점과 안정으로 연결하세요. 다음 2축 도달점은 Two-Way Player 또는 High Floor입니다.",
        "마지막을 결정짓는 결정력, 그것이 Finisher."
      ),
      zh: lines(
        "只有 WIN 是强项，专精胜负预测的类型。",
        "以高水准把比赛的胜负拿下，是本月的支点。",
        "想再进一步，就加上 SCORER 或 CONSISTENCY，把胜利转化为得分与稳定。下一个双维目标是 Two-Way Player 或 High Floor。",
        "最后一锤定音的决定力，正是 Finisher。"
      ),
      es: lines(
        "WIN es tu única fortaleza: un perfil especializado en acertar ganadores.",
        "Cerrar victorias y derrotas a un nivel alto es lo que sostuvo el mes.",
        "Para crecer, añade SCORER o CONSISTENCY y convierte las victorias en puntos y estabilidad. Los siguientes destinos de dos ejes son Two-Way Player y High Floor.",
        "El que remata la jugada: un Finisher."
      ),
      pt: lines(
        "WIN é sua única força: um perfil especializado em acertar vencedores.",
        "Fechar vitórias e derrotas em alto nível foi o que sustentou o mês.",
        "Para crescer, some SCORER ou CONSISTENCY e transforme vitórias em pontos e estabilidade. Os próximos destinos de dois eixos são Two-Way Player e High Floor.",
        "Quem decide no fim: um Finisher."
      ),
      fr: lines(
        "WIN est votre seule force : un profil spécialisé dans les vainqueurs de match.",
        "Conclure les victoires et les défaites à haut niveau a porté ce mois-ci.",
        "Pour progresser, ajoutez SCORER ou CONSISTENCY et transformez les victoires en points et en régularité. Prochaines étapes à deux axes : Two-Way Player ou High Floor.",
        "Celui qui conclut : un Finisher."
      ),
    },
  },
  LASER: {
    label: "Laser",
    description: {
      ja: lines(
        "SCORER が唯一の強みの、得点者予想に特化したタイプです。",
        "細部を射抜く精度が、今月の差別化ポイントになっています。",
        "さらに伸ばすなら WIN か ACTIVITY を足し、的中を総得点に変えましょう。次の二軸到達点は Two-Way Player か Deep Bag です。",
        "一点を狙う判断の鋭さは、まさに Laser。"
      ),
      en: lines(
        "SCORER is your only strength — a profile specialized in top-scorer picks.",
        "Precision on the fine detail is what set you apart this month.",
        "To grow, add WIN or ACTIVITY and convert hits into total points. The next two-axis stops are Two-Way Player and Deep Bag.",
        "Pinpoint reads: a Laser."
      ),
      ko: lines(
        "SCORER만이 강점인, 득점자 예상에 특화된 타입입니다.",
        "세부를 꿰뚫는 정확도가 이번 달의 차별점이었습니다.",
        "더 키우려면 WIN 또는 ACTIVITY를 더해 적중을 총득점으로 바꾸세요. 다음 2축 도달점은 Two-Way Player 또는 Deep Bag입니다.",
        "한 점을 노리는 판단의 예리함, 그것이 Laser."
      ),
      zh: lines(
        "只有 SCORER 是强项，专精得分者预测的类型。",
        "洞穿细节的精准度，是本月的差异化优势。",
        "想再进一步，就加上 WIN 或 ACTIVITY，把命中转化为总得分。下一个双维目标是 Two-Way Player 或 Deep Bag。",
        "直取一点的锐利判断，正是 Laser。"
      ),
      es: lines(
        "SCORER es tu única fortaleza: un perfil especializado en máximos anotadores.",
        "La precisión en el detalle fino es lo que te diferenció este mes.",
        "Para crecer, añade WIN o ACTIVITY y convierte los aciertos en puntos totales. Los siguientes destinos de dos ejes son Two-Way Player y Deep Bag.",
        "Lectura milimétrica: un Laser."
      ),
      pt: lines(
        "SCORER é sua única força: um perfil especializado em cestinhas.",
        "A precisão no detalhe fino foi o que te diferenciou neste mês.",
        "Para crescer, some WIN ou ACTIVITY e converta acertos em pontos totais. Os próximos destinos de dois eixos são Two-Way Player e Deep Bag.",
        "Leitura milimétrica: um Laser."
      ),
      fr: lines(
        "SCORER est votre seule force : un profil spécialisé dans les meilleurs marqueurs.",
        "La précision sur le détail fin vous a distingué ce mois-ci.",
        "Pour progresser, ajoutez WIN ou ACTIVITY et transformez les réussites en points totaux. Prochaines étapes à deux axes : Two-Way Player ou Deep Bag.",
        "Une lecture au millimètre : un Laser."
      ),
    },
  },
  CHAOS_TAKER: {
    label: "Chaos Taker",
    description: {
      ja: lines(
        "UPSET が唯一の強みの、波乱攻略に特化したタイプです。",
        "番狂わせを拾う読みが、今月の得点源になっています。",
        "さらに伸ばすなら WIN か CONSISTENCY を足し、波乱を安定した勝ちにつなげましょう。次の二軸到達点は Big-Game Hunter か Chaos Anchor です。",
        "カオスを恐れず価値に変える勝負勘は、まさに Chaos Taker。"
      ),
      en: lines(
        "UPSET is your only strength — a profile specialized in cracking chaos.",
        "Reading the shocks before they land is where your points came from this month.",
        "To grow, add WIN or CONSISTENCY and turn upsets into steady wins. The next two-axis stops are Big-Game Hunter and Chaos Anchor.",
        "Turning chaos into value without flinching: a Chaos Taker."
      ),
      ko: lines(
        "UPSET만이 강점인, 업셋 공략에 특화된 타입입니다.",
        "이변을 줍는 읽기가 이번 달의 득점원이었습니다.",
        "더 키우려면 WIN 또는 CONSISTENCY를 더해 업셋을 안정적인 승리로 연결하세요. 다음 2축 도달점은 Big-Game Hunter 또는 Chaos Anchor입니다.",
        "혼돈을 두려워하지 않고 가치로 바꾸는 승부 감각, 그것이 Chaos Taker."
      ),
      zh: lines(
        "只有 UPSET 是强项，专精冷门攻略的类型。",
        "捡起意外的判断力，是本月的得分来源。",
        "想再进一步，就加上 WIN 或 CONSISTENCY，把冷门转化为稳定的胜利。下一个双维目标是 Big-Game Hunter 或 Chaos Anchor。",
        "不畏混乱、把它变成价值的胜负感，正是 Chaos Taker。"
      ),
      es: lines(
        "UPSET es tu única fortaleza: un perfil especializado en descifrar el caos.",
        "Leer las sorpresas antes de que ocurran fue tu fuente de puntos este mes.",
        "Para crecer, añade WIN o CONSISTENCY y convierte los upsets en victorias sostenidas. Los siguientes destinos de dos ejes son Big-Game Hunter y Chaos Anchor.",
        "Convertir el caos en valor sin pestañear: un Chaos Taker."
      ),
      pt: lines(
        "UPSET é sua única força: um perfil especializado em decifrar o caos.",
        "Ler as zebras antes de acontecerem foi sua fonte de pontos neste mês.",
        "Para crescer, some WIN ou CONSISTENCY e transforme upsets em vitórias sustentadas. Os próximos destinos de dois eixos são Big-Game Hunter e Chaos Anchor.",
        "Transformar caos em valor sem hesitar: um Chaos Taker."
      ),
      fr: lines(
        "UPSET est votre seule force : un profil spécialisé dans l'exploitation du chaos.",
        "Lire les surprises avant qu'elles n'arrivent a été votre source de points ce mois-ci.",
        "Pour progresser, ajoutez WIN ou CONSISTENCY et transformez les upsets en victoires régulières. Prochaines étapes à deux axes : Big-Game Hunter ou Chaos Anchor.",
        "Transformer le chaos en valeur sans trembler : un Chaos Taker."
      ),
    },
  },
  HIGH_MOTOR: {
    label: "High-Motor",
    description: {
      ja: lines(
        "ACTIVITY が唯一の強みの、参加量に特化したタイプです。",
        "手数と関与量で試合に入り続ける力が、今月の土台になっています。",
        "さらに伸ばすなら WIN か SCORER を足し、量を質と結果に変えましょう。次の二軸到達点は Walking Bucket か Deep Bag です。",
        "止まらず動き続ける推進力は、まさに High-Motor。"
      ),
      en: lines(
        "ACTIVITY is your only strength — a profile specialized in sheer volume.",
        "Staying in the games, pick after pick, is what this month was built on.",
        "To grow, add WIN or SCORER and turn volume into quality and results. The next two-axis stops are Walking Bucket and Deep Bag.",
        "Never stops moving: a High-Motor."
      ),
      ko: lines(
        "ACTIVITY만이 강점인, 참여량에 특화된 타입입니다.",
        "많은 시도와 관여로 경기에 계속 들어가는 힘이 이번 달의 토대였습니다.",
        "더 키우려면 WIN 또는 SCORER를 더해 양을 질과 결과로 바꾸세요. 다음 2축 도달점은 Walking Bucket 또는 Deep Bag입니다.",
        "멈추지 않는 추진력, 그것이 High-Motor."
      ),
      zh: lines(
        "只有 ACTIVITY 是强项，专精参与量的类型。",
        "靠出手次数与参与度持续进入比赛，是本月的根基。",
        "想再进一步，就加上 WIN 或 SCORER，把量转化为质与结果。下一个双维目标是 Walking Bucket 或 Deep Bag。",
        "永不停歇的推进力，正是 High-Motor。"
      ),
      es: lines(
        "ACTIVITY es tu única fortaleza: un perfil especializado en volumen puro.",
        "Seguir dentro de los partidos, pick tras pick, es la base de este mes.",
        "Para crecer, añade WIN o SCORER y convierte el volumen en calidad y resultados. Los siguientes destinos de dos ejes son Walking Bucket y Deep Bag.",
        "Nunca deja de moverse: un High-Motor."
      ),
      pt: lines(
        "ACTIVITY é sua única força: um perfil especializado em volume puro.",
        "Continuar dentro dos jogos, palpite após palpite, é a base deste mês.",
        "Para crescer, some WIN ou SCORER e converta volume em qualidade e resultado. Os próximos destinos de dois eixos são Walking Bucket e Deep Bag.",
        "Nunca para de se mover: um High-Motor."
      ),
      fr: lines(
        "ACTIVITY est votre seule force : un profil spécialisé dans le volume pur.",
        "Rester dans les matchs, pick après pick, a servi de socle ce mois-ci.",
        "Pour progresser, ajoutez WIN ou SCORER et transformez le volume en qualité et en résultats. Prochaines étapes à deux axes : Walking Bucket ou Deep Bag.",
        "Ne s'arrête jamais : un High-Motor."
      ),
    },
  },
  IRON_MAN: {
    label: "Iron Man",
    description: {
      ja: lines(
        "CONSISTENCY が唯一の強みの、安定運用に特化したタイプです。",
        "大崩れしにくく、長い期間で水準を維持できるのが武器です。",
        "さらに伸ばすなら WIN か SCORER を足し、安定を勝ちと的中に直結させましょう。次の二軸到達点は High Floor か Sharpshooter です。",
        "最後まで強度を落とさない持久力は、まさに Iron Man。"
      ),
      en: lines(
        "CONSISTENCY is your only strength — a profile specialized in steady operation.",
        "Rarely collapsing and holding your level over a long stretch is the weapon here.",
        "To grow, add WIN or SCORER and wire that stability straight into wins and hits. The next two-axis stops are High Floor and Sharpshooter.",
        "Never drops intensity: an Iron Man."
      ),
      ko: lines(
        "CONSISTENCY만이 강점인, 안정적 운영에 특화된 타입입니다.",
        "크게 무너지지 않고 긴 기간 동안 수준을 유지하는 것이 무기입니다.",
        "더 키우려면 WIN 또는 SCORER를 더해 안정성을 승리와 적중으로 직결시키세요. 다음 2축 도달점은 High Floor 또는 Sharpshooter입니다.",
        "끝까지 강도를 떨어뜨리지 않는 지속력, 그것이 Iron Man."
      ),
      zh: lines(
        "只有 CONSISTENCY 是强项，专精稳定运作的类型。",
        "不易大崩，能在长周期内维持水准，这就是你的武器。",
        "想再进一步，就加上 WIN 或 SCORER，把稳定直接接到胜利与命中上。下一个双维目标是 High Floor 或 Sharpshooter。",
        "到最后都不掉强度的耐力，正是 Iron Man。"
      ),
      es: lines(
        "CONSISTENCY es tu única fortaleza: un perfil especializado en operar con estabilidad.",
        "Rara vez te derrumbas y mantienes el nivel en tramos largos: ese es el arma.",
        "Para crecer, añade WIN o SCORER y conecta esa estabilidad directamente con victorias y aciertos. Los siguientes destinos de dos ejes son High Floor y Sharpshooter.",
        "Nunca baja la intensidad: un Iron Man."
      ),
      pt: lines(
        "CONSISTENCY é sua única força: um perfil especializado em operar com estabilidade.",
        "Raramente desaba e mantém o nível por longos trechos: essa é a arma.",
        "Para crescer, some WIN ou SCORER e ligue essa estabilidade direto a vitórias e acertos. Os próximos destinos de dois eixos são High Floor e Sharpshooter.",
        "Nunca baixa a intensidade: um Iron Man."
      ),
      fr: lines(
        "CONSISTENCY est votre seule force : un profil spécialisé dans la stabilité.",
        "Rarement en chute libre, capable de tenir son niveau sur la durée : voilà l'arme.",
        "Pour progresser, ajoutez WIN ou SCORER et branchez cette stabilité directement sur les victoires et les réussites. Prochaines étapes à deux axes : High Floor ou Sharpshooter.",
        "Ne baisse jamais d'intensité : un Iron Man."
      ),
    },
  },
  TWO_WAY_PLAYER: {
    label: "Two-Way Player",
    description: {
      ja: lines(
        "WIN と SCORER が強みの、二刀流タイプです。",
        "勝敗も得点者も高い水準で両立し、本筋の予想で差を作れます。",
        "さらに上を目指すなら ACTIVITY か CONSISTENCY を伸ばし、再現の幅を広げましょう。次の到達点は All-Rounder（強み3）です。",
        "攻守両面で試合を作る力は、まさに Two-Way Player。"
      ),
      en: lines(
        "WIN and SCORER are strengths — a two-way profile.",
        "You hold a high level on both winners and scorers, creating separation on the core markets.",
        "To climb higher, grow ACTIVITY or CONSISTENCY and widen your repeatability. The next stop is All-Rounder (three strengths).",
        "Shaping the game on both ends: a Two-Way Player."
      ),
      ko: lines(
        "WIN과 SCORER가 강점인, 이도류 타입입니다.",
        "승패와 득점자를 모두 높은 수준으로 양립시켜 핵심 예상에서 차이를 만듭니다.",
        "더 위를 노린다면 ACTIVITY 또는 CONSISTENCY를 키워 재현 폭을 넓히세요. 다음 도달점은 All-Rounder(강점 3)입니다.",
        "공수 양면에서 경기를 만드는 힘, 그것이 Two-Way Player."
      ),
      zh: lines(
        "WIN 与 SCORER 皆为强项的双刀流类型。",
        "胜负与得分者都保持高水准，在核心盘口上拉开差距。",
        "想再上一层，就提升 ACTIVITY 或 CONSISTENCY，扩大可复制的范围。下一个目标是 All-Rounder（三项强项）。",
        "攻守两端都能主导比赛，正是 Two-Way Player。"
      ),
      es: lines(
        "WIN y SCORER son fortalezas: un perfil de doble filo.",
        "Mantienes un nivel alto en ganadores y en anotadores, y marcas diferencias en los mercados principales.",
        "Para subir más, mejora ACTIVITY o CONSISTENCY y amplía tu capacidad de repetir. La siguiente parada es All-Rounder (tres fortalezas).",
        "Decide en ambos lados de la pista: un Two-Way Player."
      ),
      pt: lines(
        "WIN e SCORER são forças: um perfil de dois gumes.",
        "Você mantém alto nível em vencedores e cestinhas, criando diferença nos mercados principais.",
        "Para subir mais, desenvolva ACTIVITY ou CONSISTENCY e amplie sua capacidade de repetir. A próxima parada é All-Rounder (três forças).",
        "Decide nos dois lados da quadra: um Two-Way Player."
      ),
      fr: lines(
        "WIN et SCORER sont des forces : un profil à double tranchant.",
        "Vous tenez un haut niveau sur les vainqueurs et les marqueurs, et créez l'écart sur les marchés principaux.",
        "Pour monter encore, développez ACTIVITY ou CONSISTENCY et élargissez votre capacité à répéter. Prochaine étape : All-Rounder (trois forces).",
        "Décisif des deux côtés du terrain : un Two-Way Player."
      ),
    },
  },
  BIG_GAME_HUNTER: {
    label: "Big-Game Hunter",
    description: {
      ja: lines(
        "WIN と UPSET が強みの、大勝負タイプです。",
        "勝ち切る力と波乱を突く力を持ち、難局で流れを変えられます。",
        "さらに上を目指すなら SCORER か CONSISTENCY を伸ばし、一撃を継続得点にしましょう。次の到達点は All-Rounder（強み3）です。",
        "大舞台で獲物を仕留める勝負強さは、まさに Big-Game Hunter。"
      ),
      en: lines(
        "WIN and UPSET are strengths — a big-swing profile.",
        "You can close out wins and pierce chaos, which lets you flip the momentum of hard spots.",
        "To climb higher, grow SCORER or CONSISTENCY and turn single strikes into sustained scoring. The next stop is All-Rounder (three strengths).",
        "Bringing down the prize on the big stage: a Big-Game Hunter."
      ),
      ko: lines(
        "WIN과 UPSET이 강점인, 큰 승부 타입입니다.",
        "끝까지 이기는 힘과 이변을 찌르는 힘을 함께 갖춰 난국에서 흐름을 바꿀 수 있습니다.",
        "더 위를 노린다면 SCORER 또는 CONSISTENCY를 키워 한 방을 지속 득점으로 만드세요. 다음 도달점은 All-Rounder(강점 3)입니다.",
        "큰 무대에서 사냥감을 잡는 승부 강함, 그것이 Big-Game Hunter."
      ),
      zh: lines(
        "WIN 与 UPSET 皆为强项的大局型。",
        "兼具拿下胜利与刺穿冷门的能力，能在困难局面里扭转走势。",
        "想再上一层，就提升 SCORER 或 CONSISTENCY，把一击变成持续得分。下一个目标是 All-Rounder（三项强项）。",
        "大舞台上一击必杀的胜负强度，正是 Big-Game Hunter。"
      ),
      es: lines(
        "WIN y UPSET son fortalezas: un perfil de golpes grandes.",
        "Sabes cerrar victorias y perforar el caos, así que puedes dar la vuelta a los momentos difíciles.",
        "Para subir más, mejora SCORER o CONSISTENCY y convierte el golpe único en puntuación sostenida. La siguiente parada es All-Rounder (tres fortalezas).",
        "Cobra la presa en el gran escenario: un Big-Game Hunter."
      ),
      pt: lines(
        "WIN e UPSET são forças: um perfil de golpes grandes.",
        "Você fecha vitórias e perfura o caos, o que permite virar momentos difíceis.",
        "Para subir mais, desenvolva SCORER ou CONSISTENCY e transforme o golpe único em pontuação sustentada. A próxima parada é All-Rounder (três forças).",
        "Abate a presa no grande palco: um Big-Game Hunter."
      ),
      fr: lines(
        "WIN et UPSET sont des forces : un profil de gros coups.",
        "Vous savez conclure les victoires et percer le chaos, de quoi renverser les situations difficiles.",
        "Pour monter encore, développez SCORER ou CONSISTENCY et transformez le coup unique en points réguliers. Prochaine étape : All-Rounder (trois forces).",
        "Abattre la cible sur la grande scène : un Big-Game Hunter."
      ),
    },
  },
  WALKING_BUCKET: {
    label: "Walking Bucket",
    description: {
      ja: lines(
        "WIN と ACTIVITY が強みの、量産タイプです。",
        "手数を出しながら勝ちを積み、総量で差を作れます。",
        "さらに上を目指すなら SCORER か UPSET を伸ばし、1試合あたりの上限を上げましょう。次の到達点は All-Rounder（強み3）です。",
        "点を取り続ける攻撃力は、まさに Walking Bucket。"
      ),
      en: lines(
        "WIN and ACTIVITY are strengths — a mass-production profile.",
        "You stack wins while keeping the volume up, so the totals do the separating.",
        "To climb higher, grow SCORER or UPSET and raise your ceiling per game. The next stop is All-Rounder (three strengths).",
        "Points that just keep coming: a Walking Bucket."
      ),
      ko: lines(
        "WIN과 ACTIVITY가 강점인, 양산 타입입니다.",
        "많은 시도를 유지하며 승리를 쌓아 총량에서 차이를 만듭니다.",
        "더 위를 노린다면 SCORER 또는 UPSET을 키워 경기당 상한을 올리세요. 다음 도달점은 All-Rounder(강점 3)입니다.",
        "계속 점수를 쌓는 공격력, 그것이 Walking Bucket."
      ),
      zh: lines(
        "WIN 与 ACTIVITY 皆为强项的量产型。",
        "一边保持出手量一边累积胜利，用总量拉开差距。",
        "想再上一层，就提升 SCORER 或 UPSET，把单场上限抬高。下一个目标是 All-Rounder（三项强项）。",
        "得分源源不断的攻击力，正是 Walking Bucket。"
      ),
      es: lines(
        "WIN y ACTIVITY son fortalezas: un perfil de producción en serie.",
        "Acumulas victorias sin bajar el volumen, así que los totales marcan la diferencia.",
        "Para subir más, mejora SCORER o UPSET y eleva tu techo por partido. La siguiente parada es All-Rounder (tres fortalezas).",
        "Puntos que no dejan de caer: un Walking Bucket."
      ),
      pt: lines(
        "WIN e ACTIVITY são forças: um perfil de produção em série.",
        "Você acumula vitórias sem baixar o volume, então os totais fazem a diferença.",
        "Para subir mais, desenvolva SCORER ou UPSET e eleve seu teto por jogo. A próxima parada é All-Rounder (três forças).",
        "Pontos que não param de cair: um Walking Bucket."
      ),
      fr: lines(
        "WIN et ACTIVITY sont des forces : un profil de production en série.",
        "Vous empilez les victoires sans baisser le volume : ce sont les totaux qui font l'écart.",
        "Pour monter encore, développez SCORER ou UPSET et relevez votre plafond par match. Prochaine étape : All-Rounder (trois forces).",
        "Des points qui n'arrêtent pas de tomber : un Walking Bucket."
      ),
    },
  },
  HIGH_FLOOR: {
    label: "High Floor",
    description: {
      ja: lines(
        "WIN と CONSISTENCY が強みの、下限の高いタイプです。",
        "勝ちを積みつつ大崩れしにくく、月間の床が高いのが特徴です。",
        "さらに上を目指すなら SCORER か UPSET を伸ばし、天井も押し上げましょう。次の到達点は All-Rounder（強み3）です。",
        "落ちにくい強さは、まさに High Floor。"
      ),
      en: lines(
        "WIN and CONSISTENCY are strengths — a profile with a high floor.",
        "You stack wins and rarely collapse, so your monthly baseline sits high.",
        "To climb higher, grow SCORER or UPSET and push the ceiling up too. The next stop is All-Rounder (three strengths).",
        "Hard to knock down: a High Floor."
      ),
      ko: lines(
        "WIN과 CONSISTENCY가 강점인, 하한이 높은 타입입니다.",
        "승리를 쌓으면서도 크게 무너지지 않아 월간 바닥이 높습니다.",
        "더 위를 노린다면 SCORER 또는 UPSET을 키워 천장도 올리세요. 다음 도달점은 All-Rounder(강점 3)입니다.",
        "쉽게 떨어지지 않는 강함, 그것이 High Floor."
      ),
      zh: lines(
        "WIN 与 CONSISTENCY 皆为强项，下限很高的类型。",
        "一边积累胜利一边不易大崩，月度的地板很高。",
        "想再上一层，就提升 SCORER 或 UPSET，把天花板也抬上去。下一个目标是 All-Rounder（三项强项）。",
        "不容易掉下来的强度，正是 High Floor。"
      ),
      es: lines(
        "WIN y CONSISTENCY son fortalezas: un perfil con suelo alto.",
        "Acumulas victorias y casi nunca te derrumbas, así que tu base mensual es alta.",
        "Para subir más, mejora SCORER o UPSET y eleva también el techo. La siguiente parada es All-Rounder (tres fortalezas).",
        "Difícil de tumbar: un High Floor."
      ),
      pt: lines(
        "WIN e CONSISTENCY são forças: um perfil com piso alto.",
        "Você acumula vitórias e quase nunca desaba, então sua base mensal é alta.",
        "Para subir mais, desenvolva SCORER ou UPSET e eleve também o teto. A próxima parada é All-Rounder (três forças).",
        "Difícil de derrubar: um High Floor."
      ),
      fr: lines(
        "WIN et CONSISTENCY sont des forces : un profil au plancher élevé.",
        "Vous empilez les victoires sans jamais vraiment vous effondrer : votre base mensuelle est haute.",
        "Pour monter encore, développez SCORER ou UPSET et relevez aussi le plafond. Prochaine étape : All-Rounder (trois forces).",
        "Difficile à faire tomber : un High Floor."
      ),
    },
  },
  CLUTCH: {
    label: "Clutch",
    description: {
      ja: lines(
        "SCORER と UPSET が強みの、勝負どころタイプです。",
        "細部の精度と波乱の読みで、価値の高い一手を通せます。",
        "さらに上を目指すなら WIN か ACTIVITY を伸ばし、決定機を増やしましょう。次の到達点は All-Rounder（強み3）です。",
        "ここ一番で決め切る力は、まさに Clutch。"
      ),
      en: lines(
        "SCORER and UPSET are strengths — a big-moment profile.",
        "Fine-detail precision plus a read on chaos lets you land high-value calls.",
        "To climb higher, grow WIN or ACTIVITY and create more of those chances. The next stop is All-Rounder (three strengths).",
        "Delivering when it matters most: Clutch."
      ),
      ko: lines(
        "SCORER와 UPSET이 강점인, 승부처 타입입니다.",
        "세부의 정확도와 이변을 읽는 눈으로 가치 높은 한 수를 통과시킵니다.",
        "더 위를 노린다면 WIN 또는 ACTIVITY를 키워 결정 기회를 늘리세요. 다음 도달점은 All-Rounder(강점 3)입니다.",
        "결정적인 순간에 해결하는 힘, 그것이 Clutch."
      ),
      zh: lines(
        "SCORER 与 UPSET 皆为强项的关键时刻型。",
        "靠细节精度加上对冷门的判读，能打出高价值的一手。",
        "想再上一层，就提升 WIN 或 ACTIVITY，制造更多决胜机会。下一个目标是 All-Rounder（三项强项）。",
        "关键时刻一击定胜负，正是 Clutch。"
      ),
      es: lines(
        "SCORER y UPSET son fortalezas: un perfil de momentos grandes.",
        "La precisión en el detalle y la lectura del caos te permiten colar jugadas de mucho valor.",
        "Para subir más, mejora WIN o ACTIVITY y genera más de esas ocasiones. La siguiente parada es All-Rounder (tres fortalezas).",
        "Aparece cuando más importa: Clutch."
      ),
      pt: lines(
        "SCORER e UPSET são forças: um perfil de grandes momentos.",
        "A precisão no detalhe e a leitura do caos permitem encaixar jogadas de alto valor.",
        "Para subir mais, desenvolva WIN ou ACTIVITY e gere mais dessas chances. A próxima parada é All-Rounder (três forças).",
        "Aparece quando mais importa: Clutch."
      ),
      fr: lines(
        "SCORER et UPSET sont des forces : un profil des grands moments.",
        "Précision sur le détail et lecture du chaos vous permettent de placer des coups à forte valeur.",
        "Pour monter encore, développez WIN ou ACTIVITY et créez davantage de ces occasions. Prochaine étape : All-Rounder (trois forces).",
        "Présent quand ça compte : Clutch."
      ),
    },
  },
  DEEP_BAG: {
    label: "Deep Bag",
    description: {
      ja: lines(
        "SCORER と ACTIVITY が強みの、手札の多いタイプです。",
        "手数を出しても得点者の質を落としにくく、長期で差が開きます。",
        "さらに上を目指すなら WIN か CONSISTENCY を伸ばし、勝ちと安定を足しましょう。次の到達点は All-Rounder（強み3）です。",
        "多彩な選択肢で優位を広げるスタイルは、まさに Deep Bag。"
      ),
      en: lines(
        "SCORER and ACTIVITY are strengths — a profile with a deep toolkit.",
        "Volume doesn't dilute your scorer quality, so the gap widens over time.",
        "To climb higher, grow WIN or CONSISTENCY and add wins and stability. The next stop is All-Rounder (three strengths).",
        "Widening the edge with options: a Deep Bag."
      ),
      ko: lines(
        "SCORER와 ACTIVITY가 강점인, 수단이 많은 타입입니다.",
        "시도를 많이 해도 득점자 예상의 질이 떨어지지 않아 장기적으로 격차가 벌어집니다.",
        "더 위를 노린다면 WIN 또는 CONSISTENCY를 키워 승리와 안정을 더하세요. 다음 도달점은 All-Rounder(강점 3)입니다.",
        "다양한 선택지로 우위를 넓히는 스타일, 그것이 Deep Bag."
      ),
      zh: lines(
        "SCORER 与 ACTIVITY 皆为强项，手牌丰富的类型。",
        "即便出手很多，得分者预测的质量也不易下滑，长期下来差距会拉开。",
        "想再上一层，就提升 WIN 或 CONSISTENCY，补上胜利与稳定。下一个目标是 All-Rounder（三项强项）。",
        "用多样选项扩大优势的风格，正是 Deep Bag。"
      ),
      es: lines(
        "SCORER y ACTIVITY son fortalezas: un perfil con muchos recursos.",
        "El volumen no diluye la calidad de tus anotadores, así que la brecha se abre con el tiempo.",
        "Para subir más, mejora WIN o CONSISTENCY y suma victorias y estabilidad. La siguiente parada es All-Rounder (tres fortalezas).",
        "Amplía la ventaja con opciones: un Deep Bag."
      ),
      pt: lines(
        "SCORER e ACTIVITY são forças: um perfil com muitos recursos.",
        "O volume não dilui a qualidade dos seus cestinhas, então a diferença cresce com o tempo.",
        "Para subir mais, desenvolva WIN ou CONSISTENCY e some vitórias e estabilidade. A próxima parada é All-Rounder (três forças).",
        "Amplia a vantagem com opções: um Deep Bag."
      ),
      fr: lines(
        "SCORER et ACTIVITY sont des forces : un profil à la boîte à outils bien remplie.",
        "Le volume ne dilue pas la qualité de vos marqueurs : l'écart se creuse sur la durée.",
        "Pour monter encore, développez WIN ou CONSISTENCY et ajoutez victoires et régularité. Prochaine étape : All-Rounder (trois forces).",
        "Creuser l'écart par la variété : un Deep Bag."
      ),
    },
  },
  SHARPSHOOTER: {
    label: "Sharpshooter",
    description: {
      ja: lines(
        "SCORER と CONSISTENCY が強みの、精密安定タイプです。",
        "得点者予想をブレにくく継続でき、再現性の高い判断が武器です。",
        "さらに上を目指すなら WIN か UPSET を伸ばし、勝ち筋の幅を広げましょう。次の到達点は All-Rounder（強み3）です。",
        "狙いを外さない再現性は、まさに Sharpshooter。"
      ),
      en: lines(
        "SCORER and CONSISTENCY are strengths — a precise, stable profile.",
        "You keep scorer picks landing without wobble; repeatable judgment is the weapon.",
        "To climb higher, grow WIN or UPSET and widen your paths to points. The next stop is All-Rounder (three strengths).",
        "Repeatable aim that doesn't miss: a Sharpshooter."
      ),
      ko: lines(
        "SCORER와 CONSISTENCY가 강점인, 정밀 안정 타입입니다.",
        "득점자 예상을 흔들림 없이 이어갈 수 있고, 재현성 높은 판단이 무기입니다.",
        "더 위를 노린다면 WIN 또는 UPSET을 키워 승리 루트의 폭을 넓히세요. 다음 도달점은 All-Rounder(강점 3)입니다.",
        "겨냥을 빗나가지 않는 재현성, 그것이 Sharpshooter."
      ),
      zh: lines(
        "SCORER 与 CONSISTENCY 皆为强项的精密稳定型。",
        "得分者预测不易起伏、能长期延续，可复现的判断就是你的武器。",
        "想再上一层，就提升 WIN 或 UPSET，拓宽取胜路径。下一个目标是 All-Rounder（三项强项）。",
        "瞄准就不落空的再现性，正是 Sharpshooter。"
      ),
      es: lines(
        "SCORER y CONSISTENCY son fortalezas: un perfil preciso y estable.",
        "Mantienes los aciertos de anotador sin vaivenes; el criterio repetible es el arma.",
        "Para subir más, mejora WIN o UPSET y amplía tus vías de puntuar. La siguiente parada es All-Rounder (tres fortalezas).",
        "Puntería que se repite: un Sharpshooter."
      ),
      pt: lines(
        "SCORER e CONSISTENCY são forças: um perfil preciso e estável.",
        "Você mantém os acertos de cestinha sem oscilar; o critério repetível é a arma.",
        "Para subir mais, desenvolva WIN ou UPSET e amplie seus caminhos de pontuação. A próxima parada é All-Rounder (três forças).",
        "Mira que se repete: um Sharpshooter."
      ),
      fr: lines(
        "SCORER et CONSISTENCY sont des forces : un profil précis et stable.",
        "Vos choix de marqueurs tombent sans à-coups ; le jugement reproductible est l'arme.",
        "Pour monter encore, développez WIN ou UPSET et élargissez vos voies de points. Prochaine étape : All-Rounder (trois forces).",
        "Une visée qui se répète : un Sharpshooter."
      ),
    },
  },
  CHAOS_RUNNER: {
    label: "Chaos Runner",
    description: {
      ja: lines(
        "UPSET と ACTIVITY が強みの、展開攻略タイプです。",
        "手数で機会を広げながら波乱を拾い、得点機会を増やせます。",
        "さらに上を目指すなら WIN か SCORER を伸ばし、拾った流れを本筋の勝ちに変えましょう。次の到達点は All-Rounder（強み3）です。",
        "カオスを得点に変える推進力は、まさに Chaos Runner。"
      ),
      en: lines(
        "UPSET and ACTIVITY are strengths — a profile that rides the flow.",
        "Volume widens your chances while you keep picking up upsets, multiplying scoring opportunities.",
        "To climb higher, grow WIN or SCORER and convert that momentum into straight wins. The next stop is All-Rounder (three strengths).",
        "Turning chaos into points on the move: a Chaos Runner."
      ),
      ko: lines(
        "UPSET과 ACTIVITY가 강점인, 흐름 공략 타입입니다.",
        "많은 시도로 기회를 넓히면서 이변을 주워 득점 기회를 늘립니다.",
        "더 위를 노린다면 WIN 또는 SCORER를 키워 잡은 흐름을 정공법 승리로 바꾸세요. 다음 도달점은 All-Rounder(강점 3)입니다.",
        "혼돈을 득점으로 바꾸는 추진력, 그것이 Chaos Runner."
      ),
      zh: lines(
        "UPSET 与 ACTIVITY 皆为强项的走势攻略型。",
        "用出手量扩大机会，同时捡起冷门，得分机会随之增加。",
        "想再上一层，就提升 WIN 或 SCORER，把捡到的势头变成正面的胜利。下一个目标是 All-Rounder（三项强项）。",
        "边跑边把混乱变成得分的推进力，正是 Chaos Runner。"
      ),
      es: lines(
        "UPSET y ACTIVITY son fortalezas: un perfil que cabalga la dinámica.",
        "El volumen amplía tus oportunidades mientras sigues recogiendo upsets, y las ocasiones de puntuar se multiplican.",
        "Para subir más, mejora WIN o SCORER y convierte ese impulso en victorias directas. La siguiente parada es All-Rounder (tres fortalezas).",
        "Convierte el caos en puntos en movimiento: un Chaos Runner."
      ),
      pt: lines(
        "UPSET e ACTIVITY são forças: um perfil que cavalga a dinâmica.",
        "O volume amplia suas oportunidades enquanto você segue recolhendo upsets, e as chances de pontuar se multiplicam.",
        "Para subir mais, desenvolva WIN ou SCORER e converta esse embalo em vitórias diretas. A próxima parada é All-Rounder (três forças).",
        "Transforma caos em pontos em movimento: um Chaos Runner."
      ),
      fr: lines(
        "UPSET et ACTIVITY sont des forces : un profil qui surfe sur la dynamique.",
        "Le volume élargit vos occasions pendant que vous ramassez les upsets : les opportunités de points se multiplient.",
        "Pour monter encore, développez WIN ou SCORER et convertissez cet élan en victoires directes. Prochaine étape : All-Rounder (trois forces).",
        "Transformer le chaos en points, en mouvement : un Chaos Runner."
      ),
    },
  },
  CHAOS_ANCHOR: {
    label: "Chaos Anchor",
    description: {
      ja: lines(
        "UPSET と CONSISTENCY が強みの、波乱を支えるタイプです。",
        "荒れた局面でも粘り強く価値を拾い続け、崩れにくいのが武器です。",
        "さらに上を目指すなら WIN か SCORER を伸ばし、波乱を安定した勝ちに接続しましょう。次の到達点は All-Rounder（強み3）です。",
        "カオスの中でも沈まない軸は、まさに Chaos Anchor。"
      ),
      en: lines(
        "UPSET and CONSISTENCY are strengths — a profile that anchors chaos.",
        "Even in messy stretches you keep grinding out value without falling apart.",
        "To climb higher, grow WIN or SCORER and connect upsets to steady wins. The next stop is All-Rounder (three strengths).",
        "The axis that won't sink in the chaos: a Chaos Anchor."
      ),
      ko: lines(
        "UPSET과 CONSISTENCY가 강점인, 혼돈을 버텨내는 타입입니다.",
        "거친 국면에서도 끈질기게 가치를 주워 담으며 잘 무너지지 않는 것이 무기입니다.",
        "더 위를 노린다면 WIN 또는 SCORER를 키워 업셋을 안정적인 승리로 이으세요. 다음 도달점은 All-Rounder(강점 3)입니다.",
        "혼돈 속에서도 가라앉지 않는 축, 그것이 Chaos Anchor."
      ),
      zh: lines(
        "UPSET 与 CONSISTENCY 皆为强项，能撑住混乱的类型。",
        "即使局势混乱，也能顽强地不断捡起价值、不易崩盘，这就是你的武器。",
        "想再上一层，就提升 WIN 或 SCORER，把冷门接到稳定的胜利上。下一个目标是 All-Rounder（三项强项）。",
        "混乱中也不下沉的支点，正是 Chaos Anchor。"
      ),
      es: lines(
        "UPSET y CONSISTENCY son fortalezas: un perfil que ancla el caos.",
        "Incluso en tramos revueltos sigues arañando valor sin desmoronarte.",
        "Para subir más, mejora WIN o SCORER y conecta los upsets con victorias sostenidas. La siguiente parada es All-Rounder (tres fortalezas).",
        "El eje que no se hunde en el caos: un Chaos Anchor."
      ),
      pt: lines(
        "UPSET e CONSISTENCY são forças: um perfil que ancora o caos.",
        "Mesmo em trechos confusos você segue arrancando valor sem desmoronar.",
        "Para subir mais, desenvolva WIN ou SCORER e conecte os upsets a vitórias sustentadas. A próxima parada é All-Rounder (três forças).",
        "O eixo que não afunda no caos: um Chaos Anchor."
      ),
      fr: lines(
        "UPSET et CONSISTENCY sont des forces : un profil qui ancre le chaos.",
        "Même dans les passages agités, vous continuez à gratter de la valeur sans vous effondrer.",
        "Pour monter encore, développez WIN ou SCORER et reliez les upsets à des victoires régulières. Prochaine étape : All-Rounder (trois forces).",
        "L'axe qui ne coule pas dans le chaos : un Chaos Anchor."
      ),
    },
  },
  SPARK_PLUG: {
    label: "Spark Plug",
    description: {
      ja: lines(
        "ACTIVITY と CONSISTENCY が強みの、推進力タイプです。",
        "高い稼働を長く維持でき、試合数が増えるほど存在感が出ます。",
        "さらに上を目指すなら WIN か SCORER を伸ばし、エンジンを得点に変えましょう。次の到達点は All-Rounder（強み3）です。",
        "チームに火をつけ続けるエネルギーは、まさに Spark Plug。"
      ),
      en: lines(
        "ACTIVITY and CONSISTENCY are strengths — an engine-room profile.",
        "You sustain a high workload for long stretches, and the more games there are, the more you show up.",
        "To climb higher, grow WIN or SCORER and turn the engine into points. The next stop is All-Rounder (three strengths).",
        "The energy that keeps lighting the fuse: a Spark Plug."
      ),
      ko: lines(
        "ACTIVITY와 CONSISTENCY가 강점인, 추진력 타입입니다.",
        "높은 가동률을 길게 유지할 수 있어 경기 수가 늘어날수록 존재감이 드러납니다.",
        "더 위를 노린다면 WIN 또는 SCORER를 키워 엔진을 득점으로 바꾸세요. 다음 도달점은 All-Rounder(강점 3)입니다.",
        "계속 불을 붙이는 에너지, 그것이 Spark Plug."
      ),
      zh: lines(
        "ACTIVITY 与 CONSISTENCY 皆为强项的推进型。",
        "能长期维持高强度运转，比赛越多存在感越强。",
        "想再上一层，就提升 WIN 或 SCORER，把引擎变成得分。下一个目标是 All-Rounder（三项强项）。",
        "不断点火的能量，正是 Spark Plug。"
      ),
      es: lines(
        "ACTIVITY y CONSISTENCY son fortalezas: un perfil de motor.",
        "Sostienes una carga alta durante mucho tiempo y, cuantos más partidos hay, más apareces.",
        "Para subir más, mejora WIN o SCORER y convierte el motor en puntos. La siguiente parada es All-Rounder (tres fortalezas).",
        "La energía que enciende la mecha: un Spark Plug."
      ),
      pt: lines(
        "ACTIVITY e CONSISTENCY são forças: um perfil de motor.",
        "Você sustenta uma carga alta por longos períodos e, quanto mais jogos, mais aparece.",
        "Para subir mais, desenvolva WIN ou SCORER e transforme o motor em pontos. A próxima parada é All-Rounder (três forças).",
        "A energia que acende o pavio: um Spark Plug."
      ),
      fr: lines(
        "ACTIVITY et CONSISTENCY sont des forces : un profil de moteur.",
        "Vous tenez une charge élevée sur la durée, et plus il y a de matchs, plus vous êtes présent.",
        "Pour monter encore, développez WIN ou SCORER et transformez le moteur en points. Prochaine étape : All-Rounder (trois forces).",
        "L'énergie qui rallume la mèche : un Spark Plug."
      ),
    },
  },
};

/** 旧タイプ ID → V1 コピー ID */
const LEGACY_ANALYSIS_TYPE_ALIAS: Record<string, string> = {
  CHEAT_CODE: "GOAT",
  ELITE_ALLROUNDER: "ALL_ROUNDER",
  GIANT_SLAYER: "BIG_GAME_HUNTER",
  HOT_HAND: "CHAOS_RUNNER",
  UNICORN: "CLUTCH",
  ASSASSIN: "SHARPSHOOTER",
  KILLER_INSTINCT: "WALKING_BUCKET",
  SWISS_ARMY_KNIFE: "ALL_ROUNDER",
  TECHNICIAN: "CHAOS_ANCHOR",
  IRON_ENGINE: "SPARK_PLUG",
  BULLDOG: "HIGH_FLOOR",
  SCRAPPER: "CHAOS_ANCHOR",
};

export function resolveMonthlyReportAnalysisTypeCopy(
  id: string,
  lang: LocalizedLang | string | null | undefined
): MonthlyReportAnalysisTypeCopy {
  const resolved = resolveLocalizedLang(lang);
  const mapped = LEGACY_ANALYSIS_TYPE_ALIAS[id] ?? id;
  const source =
    MONTHLY_REPORT_ANALYSIS_TYPE_COPY[mapped] ??
    MONTHLY_REPORT_ANALYSIS_TYPE_COPY.PROSPECT!;
  return {
    label: source.label,
    description: L(resolved, source.description),
  };
}
