/** TEAM IDENTITY / ROLE / ROLE CHANGE — チップタップ時の説明文（7言語） */
import { type UiStrings } from "@/lib/i18n/ui";

export type DetailChipCopy = {
  hint: UiStrings;
};

const COPY: Record<string, DetailChipCopy> = {
  // — Team identity —
  fast_pace: {
    hint: {
      ja: "1試合あたりのポゼッション数が多く、テンポの速いバスケをするチーム。",
      en: "Plays at a fast pace with more possessions per game.",
      ko: "경기당 포제션이 많고 템포가 빠른 농구를 하는 팀.",
      zh: "场均回合数多、节奏偏快的球队。",
      es: "Juega a ritmo alto, con más posesiones por partido.",
      pt: "Joga em ritmo alto, com mais posses por jogo.",
      fr: "Joue à un rythme élevé, avec plus de possessions par match.",
    },
  },
  slow_pace: {
    hint: {
      ja: "ペースを落としてセットオフェンス中心。点数は少なめ・じっくり型。",
      en: "Slows the game down; fewer possessions, half-court oriented.",
      ko: "템포를 낮추고 세트 오펜스 중심. 득점은 적고 차분한 스타일.",
      zh: "放慢节奏、以阵地战为主。得分偏少、打得耐心。",
      es: "Frena el ritmo; menos posesiones y ataque estático.",
      pt: "Diminui o ritmo; menos posses e ataque de meia-quadra.",
      fr: "Ralentit le jeu ; moins de possessions, attaque placée.",
    },
  },
  three_heavy: {
    hint: {
      ja: "3ポイント試投が多い、または得点のかなりの割合を3Pで稼ぐ。",
      en: "Takes a lot of threes or scores a large share of points from beyond the arc.",
      ko: "3점 시도가 많거나 득점의 상당 부분을 3점으로 만드는 팀.",
      zh: "三分出手多，或得分中三分占比很高。",
      es: "Lanza muchos triples o anota gran parte de sus puntos desde fuera.",
      pt: "Arremessa muitos 3 ou marca boa parte dos pontos de fora.",
      fr: "Tente beaucoup de 3 pts ou marque une grande part de ses points de loin.",
    },
  },
  paint_attack: {
    hint: {
      ja: "ペイント内・ゴール下からの得点比率が高い。ドライブ・リム攻撃型。",
      en: "Scores heavily in the paint — drives, rim runs, and interior finishing.",
      ko: "페인트존·골밑 득점 비중이 높음. 드라이브와 림 공격 위주.",
      zh: "禁区与篮下得分占比高。以突破和冲击篮筐为主。",
      es: "Anota mucho en la zona: penetraciones, carreras al aro y remates interiores.",
      pt: "Marca muito no garrafão: drives, corridas ao aro e finalizações internas.",
      fr: "Marque beaucoup dans la raquette : pénétrations, courses au cercle, finitions intérieures.",
    },
  },
  ft_line: {
    hint: {
      ja: "フリースロー試投が多い。接触を作ってラインに行くスタイル。",
      en: "Gets to the free-throw line often; contact and foul drawing.",
      ko: "자유투 시도가 많음. 접촉을 만들어 라인으로 가는 스타일.",
      zh: "罚球出手多。善于制造身体接触与犯规。",
      es: "Pisa mucho la línea de libres: busca el contacto y la falta.",
      pt: "Vai muito à linha de lance livre: busca contato e falta.",
      fr: "Se rend souvent sur la ligne des lancers : cherche le contact et la faute.",
    },
  },
  offense_first: {
    hint: {
      ja: "攻撃効率（ORTG）がリーグ上位。点数を取ることで勝負を決めやすい。",
      en: "Top-tier offensive rating — wins with efficient scoring.",
      ko: "공격 효율(ORTG)이 리그 상위. 득점으로 승부를 가름.",
      zh: "进攻效率（ORTG）联盟前列。靠得分决定胜负。",
      es: "Offensive rating de élite: gana anotando con eficiencia.",
      pt: "Offensive rating de elite: vence marcando com eficiência.",
      fr: "Offensive rating d’élite : gagne en marquant efficacement.",
    },
  },
  defense_first: {
    hint: {
      ja: "守備効率（DRTG）がリーグ上位。失点を抑えて勝つタイプ。",
      en: "Top-tier defensive rating — wins by limiting opponent scoring.",
      ko: "수비 효율(DRTG)이 리그 상위. 실점을 줄여 이기는 유형.",
      zh: "防守效率（DRTG）联盟前列。靠限制失分取胜。",
      es: "Defensive rating de élite: gana limitando al rival.",
      pt: "Defensive rating de elite: vence limitando o adversário.",
      fr: "Defensive rating d’élite : gagne en limitant l’adversaire.",
    },
  },
  elite_net: {
    hint: {
      ja: "ネットレーティング（100 poss あたり得失点差）がリーグ最上位級。",
      en: "Elite net rating — one of the best point-differential teams.",
      ko: "넷 레이팅(100포제션당 득실 차)이 리그 최상위급.",
      zh: "净效率值（每100回合净胜分）位居联盟顶尖。",
      es: "Net rating de élite: uno de los mejores diferenciales de la liga.",
      pt: "Net rating de elite: um dos melhores saldos de pontos da liga.",
      fr: "Net rating d’élite : l’un des meilleurs différentiels de la ligue.",
    },
  },
  iso_heavy: {
    hint: {
      ja: "アイソレーション（1対1）の使用率が高い。個人技で崩す比重が大きい。",
      en: "Runs a lot of isolation plays — one-on-one scoring emphasis.",
      ko: "아이솔레이션(1대1) 사용 비중이 높음. 개인 기술로 무너뜨리는 팀.",
      zh: "单打（1对1）使用率高。倚重个人能力打开局面。",
      es: "Usa mucho el uno contra uno: énfasis en la isolación.",
      pt: "Usa muito o um contra um: ênfase em isolamento.",
      fr: "Joue beaucoup en isolation : accent sur le un contre un.",
    },
  },
  pnr_heavy: {
    hint: {
      ja: "ピックアンドロール（PnR）の使用率が高い。ハンドラー×ロールで崩すオフェンス。",
      en: "Pick-and-roll heavy — ball-handler and roll-man actions drive the offense.",
      ko: "픽앤롤 사용 비중이 높음. 핸들러와 롤맨의 조합으로 공격을 만듦.",
      zh: "挡拆使用率高。以持球人与顺下者的配合为进攻核心。",
      es: "Muy de pick-and-roll: el ataque vive del manejador y el roll man.",
      pt: "Muito pick-and-roll: o ataque vive do condutor e do roll man.",
      fr: "Beaucoup de pick-and-roll : l’attaque vit du porteur et du roll man.",
    },
  },
  spotup_team: {
    hint: {
      ja: "スポットアップ（受けて即シュート）の比重が大きい。",
      en: "Relies on spot-up shooting — catch-and-shoot threes and mid-range.",
      ko: "스팟업(받아서 바로 슈팅) 비중이 큼.",
      zh: "定点接球投篮的比重较大。",
      es: "Depende del tiro en spot-up: recibir y lanzar.",
      pt: "Depende do arremesso em spot-up: receber e arremessar.",
      fr: "S’appuie sur le tir en spot-up : recevoir et shooter.",
    },
  },
  post_up: {
    hint: {
      ja: "ポストアップの使用率が高い。低ポストからの得点源がある。",
      en: "Post-up oriented — scores through back-to-basket actions.",
      ko: "포스트업 사용 비중이 높음. 로우포스트 득점원이 있음.",
      zh: "背身单打使用率高。拥有低位得分点。",
      es: "Orientado al post-up: anota de espaldas al aro.",
      pt: "Orientado ao post-up: marca de costas para a cesta.",
      fr: "Orienté poste bas : marque dos au panier.",
    },
  },
  transition: {
    hint: {
      ja: "トランジション（速攻）プレイの使用率が高い。",
      en: "Transition-heavy — pushes in early offense after changes of possession.",
      ko: "트랜지션(속공) 플레이 사용 비중이 높음.",
      zh: "转换进攻（快攻）使用率高。",
      es: "Muy de transición: corre en cuanto cambia la posesión.",
      pt: "Muito de transição: acelera assim que a posse muda.",
      fr: "Beaucoup de transition : accélère dès le changement de possession.",
    },
  },
  cut_team: {
    hint: {
      ja: "カット（ゴール下への切り込み）の使用率が高い。ボールムーブメント型。",
      en: "Cut-heavy — off-ball movement to the rim.",
      ko: "컷인(골밑으로 파고들기) 사용 비중이 높음. 볼 무브먼트형.",
      zh: "空切使用率高。以球的转移和跑动为主。",
      es: "Muchos cortes: movimiento sin balón hacia el aro.",
      pt: "Muitos cortes: movimento sem bola até o aro.",
      fr: "Beaucoup de coupes : mouvement sans ballon vers le cercle.",
    },
  },
  ball_movement: {
    hint: {
      ja: "パス数が多く、ボールが回るオフェンス。",
      en: "High pass volume — ball movement is a core identity.",
      ko: "패스가 많고 볼이 잘 도는 공격.",
      zh: "传球次数多，球权流动顺畅。",
      es: "Mucho volumen de pases: el movimiento de balón es su identidad.",
      pt: "Muito volume de passes: a circulação de bola é a identidade.",
      fr: "Gros volume de passes : la circulation du ballon est son identité.",
    },
  },
  drive_heavy: {
    hint: {
      ja: "ドライブ（ペネトレーション）が多い。ハンドラーが崩して仕掛ける。",
      en: "Drive-heavy — frequent penetration from the perimeter.",
      ko: "드라이브(페네트레이션)가 많음. 핸들러가 직접 무너뜨림.",
      zh: "突破次数多。持球人主动撕开防线。",
      es: "Muchas penetraciones desde el perímetro.",
      pt: "Muitas penetrações a partir do perímetro.",
      fr: "Beaucoup de pénétrations depuis le périmètre.",
    },
  },
  cns_heavy: {
    hint: {
      ja: "キャッチ＆シュートの比重・効率が高い。",
      en: "Catch-and-shoot oriented — thrives on kick-out looks.",
      ko: "캐치&슛 비중과 효율이 높음.",
      zh: "接球即投的比重与效率都很高。",
      es: "Orientado al catch-and-shoot: vive de los pases de salida.",
      pt: "Orientado ao catch-and-shoot: vive dos passes de saída.",
      fr: "Orienté catch-and-shoot : profite des ressorties de balle.",
    },
  },
  pullup_heavy: {
    hint: {
      ja: "プルアップジャンパーからの得点が多い。",
      en: "Pull-up jumper heavy — scores off the dribble from mid-range and three.",
      ko: "풀업 점퍼 득점이 많음.",
      zh: "急停跳投得分较多。",
      es: "Mucho tiro en pull-up: anota desde el bote en media y triple.",
      pt: "Muito arremesso em pull-up: marca no drible de média e de 3.",
      fr: "Beaucoup de tirs en pull-up : marque en dribble à mi-distance et à 3 pts.",
    },
  },
  second_chance: {
    hint: {
      ja: "オフェンスリバウンド率が高く、セカンドチャンス得点を作りやすい。",
      en: "Strong offensive rebounding — extra possessions and second-chance points.",
      ko: "공격 리바운드 비율이 높아 세컨드 찬스 득점을 잘 만듦.",
      zh: "进攻篮板率高，容易制造二次进攻得分。",
      es: "Buen rebote ofensivo: posesiones extra y puntos de segunda opción.",
      pt: "Bom rebote ofensivo: posses extra e pontos de segunda chance.",
      fr: "Bon rebond offensif : possessions bonus et points de seconde chance.",
    },
  },
  rebound_strong: {
    hint: {
      ja: "オフェンスリバウンドが強く、ボード争いで優位。",
      en: "Strong on the offensive glass — wins extra possessions.",
      ko: "공격 리바운드가 강해 보드 싸움에서 우위.",
      zh: "进攻篮板强势，篮板争夺占优。",
      es: "Fuerte en el rebote ofensivo: gana posesiones extra.",
      pt: "Forte no rebote ofensivo: conquista posses extra.",
      fr: "Fort au rebond offensif : gagne des possessions bonus.",
    },
  },
  fb_points: {
    hint: {
      ja: "ファストブレイク得点の割合が高い。",
      en: "Scores a large share of points in transition / fast breaks.",
      ko: "속공 득점 비중이 높음.",
      zh: "快攻得分占比高。",
      es: "Gran parte de sus puntos llegan al contragolpe.",
      pt: "Boa parte dos pontos vem do contra-ataque.",
      fr: "Une grande part des points vient de la contre-attaque.",
    },
  },
  clutch_strong: {
    hint: {
      ja: "接戦・終盤（クラッチ）の net rating がリーグ上位。",
      en: "Strong clutch net rating — performs well in tight late-game minutes.",
      ko: "접전 종반(클러치) 넷 레이팅이 리그 상위.",
      zh: "关键时刻的净效率值联盟前列。",
      es: "Buen net rating en clutch: rinde en finales apretados.",
      pt: "Bom net rating no clutch: rende em finais apertados.",
      fr: "Bon net rating en clutch : performe dans les fins de match serrées.",
    },
  },
  clutch_weak: {
    hint: {
      ja: "接戦・終盤の成績がリーグ下位。フィニッシュに課題。",
      en: "Weak clutch net rating — struggles to close tight games.",
      ko: "접전 종반 성적이 리그 하위. 마무리에 과제가 있음.",
      zh: "关键时刻表现联盟靠后。收尾能力有待提高。",
      es: "Net rating clutch pobre: le cuesta cerrar partidos ajustados.",
      pt: "Net rating no clutch fraco: sofre para fechar jogos apertados.",
      fr: "Net rating clutch faible : peine à conclure les matchs serrés.",
    },
  },
  perim_def: {
    hint: {
      ja: "相手の3P%を抑えている。ペリメーター DF が強い。",
      en: "Limits opponent three-point percentage — strong perimeter defense.",
      ko: "상대 3점 성공률을 억제. 외곽 수비가 강함.",
      zh: "限制对手三分命中率。外线防守强。",
      es: "Limita el 3P% rival: buena defensa exterior.",
      pt: "Limita o 3P% adversário: boa defesa de perímetro.",
      fr: "Limite le 3P% adverse : bonne défense extérieure.",
    },
  },
  rim_protect: {
    hint: {
      ja: "相手の FG% 全体を抑えている。インサイド DF / リムプロテクトが効いている。",
      en: "Suppresses opponent FG% — solid interior and rim protection.",
      ko: "상대 야투 성공률 전반을 억제. 인사이드 수비와 림 프로텍트가 좋음.",
      zh: "整体压制对手命中率。内线防守与护框出色。",
      es: "Reduce el FG% rival: buena defensa interior y protección del aro.",
      pt: "Reduz o FG% adversário: boa defesa interior e proteção do aro.",
      fr: "Réduit le FG% adverse : bonne défense intérieure et protection du cercle.",
    },
  },
  force_tos: {
    hint: {
      ja: "相手のターンオーバーを多く誘発。プレッシャー DF。",
      en: "Forces turnovers — disruptive, pressure-based defense.",
      ko: "상대 턴오버를 많이 유도. 압박 수비.",
      zh: "大量造成对手失误。压迫式防守。",
      es: "Fuerza pérdidas: defensa de presión y desorden.",
      pt: "Força turnovers: defesa de pressão e desorganização.",
      fr: "Provoque des pertes de balle : défense de pression.",
    },
  },
  hustle_team: {
    hint: {
      ja: "ディフレクション・チャージ・ルーズボールなどハッスル指標が高い。",
      en: "High hustle stats — deflections, charges, and loose-ball plays.",
      ko: "디플렉션·차징·루즈볼 등 허슬 지표가 높음.",
      zh: "干扰球、造犯规、争抢球等拼抢数据出色。",
      es: "Buenas cifras de esfuerzo: desvíos, cargas y balones sueltos.",
      pt: "Boas métricas de esforço: desvios, faltas provocadas e bolas soltas.",
      fr: "Bonnes stats d’effort : déviations, fautes provoquées, ballons perdus.",
    },
  },
  clean_ball: {
    hint: {
      ja: "ターンオーバー率が低く、ボールを大切にする。",
      en: "Low turnover rate — takes care of the basketball.",
      ko: "턴오버 비율이 낮고 볼 관리가 좋음.",
      zh: "失误率低，护球意识好。",
      es: "Baja tasa de pérdidas: cuida el balón.",
      pt: "Baixa taxa de turnovers: cuida da bola.",
      fr: "Faible taux de pertes : protège le ballon.",
    },
  },
  turnover_prone: {
    hint: {
      ja: "ターンオーバー率が高く、ボールを失いやすい。",
      en: "Turnover prone — gives away possessions frequently.",
      ko: "턴오버 비율이 높고 볼을 자주 빼앗김.",
      zh: "失误率高，容易丢球。",
      es: "Propenso a las pérdidas: regala posesiones a menudo.",
      pt: "Propenso a turnovers: entrega posses com frequência.",
      fr: "Sujet aux pertes de balle : offre souvent des possessions.",
    },
  },
  surging: {
    hint: {
      ja: "直近10試合の net rating がシーズン平均より大幅に改善。上昇中。",
      en: "Last-10 net rating is much better than season average — trending up.",
      ko: "최근 10경기 넷 레이팅이 시즌 평균보다 크게 향상. 상승세.",
      zh: "近10场净效率值远高于赛季平均。势头上升。",
      es: "Su net rating en los últimos 10 supera con claridad su media: en alza.",
      pt: "Net rating nos últimos 10 bem acima da média da temporada: em alta.",
      fr: "Net rating sur 10 matchs bien au-dessus de la moyenne : en hausse.",
    },
  },
  free_fall: {
    hint: {
      ja: "直近10試合の net rating がシーズン平均より大幅に悪化。下落中。",
      en: "Last-10 net rating is much worse than season average — sliding.",
      ko: "최근 10경기 넷 레이팅이 시즌 평균보다 크게 악화. 하락세.",
      zh: "近10场净效率值远低于赛季平均。势头下滑。",
      es: "Su net rating en los últimos 10 cae claramente: en descenso.",
      pt: "Net rating nos últimos 10 bem abaixo da média: em queda.",
      fr: "Net rating sur 10 matchs bien en dessous de la moyenne : en baisse.",
    },
  },
  injury_risk: {
    hint: {
      ja: "主力の欠場・疑い（OUT/GTD）が複数、または ace 級選手が欠場中。",
      en: "Multiple OUT/GTD players or a key star unavailable — rotation risk.",
      ko: "주력 결장·불확실(OUT/GTD)이 여럿이거나 에이스가 결장 중.",
      zh: "多名主力伤缺或存疑（OUT/GTD），或核心球员缺阵。",
      es: "Varios jugadores OUT/GTD o una estrella clave ausente: riesgo en la rotación.",
      pt: "Vários jogadores OUT/GTD ou um astro fora: risco na rotação.",
      fr: "Plusieurs joueurs OUT/GTD ou une star absente : risque sur la rotation.",
    },
  },

  // — Player role —
  first_option: {
    hint: {
      ja: "チームの第1得点源。Usage・得点ともリーグ上位。",
      en: "Primary scoring option — elite usage and points.",
      ko: "팀의 1옵션 득점원. 사용률과 득점 모두 리그 상위.",
      zh: "球队第一得分点。使用率与得分均在联盟前列。",
      es: "Primera opción ofensiva: usage y puntos de élite.",
      pt: "Primeira opção ofensiva: usage e pontos de elite.",
      fr: "Première option offensive : usage et points d’élite.",
    },
  },
  second_option: {
    hint: {
      ja: "第2得点源。スターに次ぐオフェンスの負荷を担う。",
      en: "Secondary scoring option — second-highest offensive responsibility.",
      ko: "2옵션 득점원. 에이스에 이어 공격 부담을 나눔.",
      zh: "第二得分点。承担仅次于核心的进攻责任。",
      es: "Segunda opción ofensiva: la mayor carga tras la estrella.",
      pt: "Segunda opção ofensiva: a maior carga depois do astro.",
      fr: "Deuxième option offensive : la plus grosse charge après la star.",
    },
  },
  third_option: {
    hint: {
      ja: "第3得点源。スコアリング hierarchy の中位。",
      en: "Third scoring option in the team's pecking order.",
      ko: "3옵션 득점원. 득점 서열의 중간.",
      zh: "第三得分点。位于得分序列中段。",
      es: "Tercera opción en la jerarquía anotadora.",
      pt: "Terceira opção na hierarquia de pontuação.",
      fr: "Troisième option dans la hiérarchie offensive.",
    },
  },
  primary_handler: {
    hint: {
      ja: "Pick-and-roll ハンドラー、または AST 上位の主創造者。",
      en: "Primary ball-handler — PnR handler or top playmaker.",
      ko: "픽앤롤 핸들러 또는 어시스트 상위의 주 창조자.",
      zh: "主要持球人：挡拆发起者或助攻居前的组织核心。",
      es: "Manejador principal: lleva el PnR o lidera la creación.",
      pt: "Condutor principal: comanda o PnR ou lidera a criação.",
      fr: "Meneur principal : porteur sur PnR ou créateur en chef.",
    },
  },
  secondary_creator: {
    hint: {
      ja: "第2創造者。パスは出すが Usage は控えめ。",
      en: "Secondary creator — assists without dominating usage.",
      ko: "제2 창조자. 패스는 주지만 사용률은 낮음.",
      zh: "第二组织者。能传球但使用率不高。",
      es: "Creador secundario: asiste sin acaparar el usage.",
      pt: "Criador secundário: assiste sem dominar o usage.",
      fr: "Créateur secondaire : distribue sans accaparer le ballon.",
    },
  },
  playmaker: {
    hint: {
      ja: "アシスト率が高い組み立て役。",
      en: "High assist rate — sets up teammates.",
      ko: "어시스트 비율이 높은 조율자.",
      zh: "助攻率高的组织者。",
      es: "Alta tasa de asistencias: pone en juego a sus compañeros.",
      pt: "Alta taxa de assistências: coloca os companheiros em jogo.",
      fr: "Taux de passes élevé : met ses coéquipiers en situation.",
    },
  },
  spot_up: {
    hint: {
      ja: "スポットアップ shooter。受けて即シュートが主武器。",
      en: "Spot-up shooter — catch-and-shoot specialist.",
      ko: "스팟업 슈터. 받아서 바로 쏘는 게 주무기.",
      zh: "定点射手。接球即投是主要武器。",
      es: "Tirador de spot-up: especialista en catch-and-shoot.",
      pt: "Arremessador de spot-up: especialista em catch-and-shoot.",
      fr: "Shooteur en spot-up : spécialiste du catch-and-shoot.",
    },
  },
  floor_spacer: {
    hint: {
      ja: "3P 試投が多く、スペースを作る shooter。",
      en: "Floor spacer — volume three-point shooter.",
      ko: "3점 시도가 많아 공간을 만들어 주는 슈터.",
      zh: "三分出手多，为球队拉开空间的射手。",
      es: "Abre el campo: tirador de triples de volumen.",
      pt: "Abre a quadra: arremessador de 3 em volume.",
      fr: "Écarte la défense : gros volume de tirs à 3 pts.",
    },
  },
  three_d: {
    hint: {
      ja: "3P と守備の両方。3&D ウィング。",
      en: "Three-and-D — perimeter shooting plus defense.",
      ko: "3점과 수비를 겸비한 3&D 윙.",
      zh: "兼具三分与防守的 3&D 侧翼。",
      es: "Three-and-D: tiro exterior más defensa.",
      pt: "Three-and-D: arremesso de fora mais defesa.",
      fr: "Three-and-D : tir extérieur et défense.",
    },
  },
  rim_runner: {
    hint: {
      ja: "リム付近の FG% が高い。ゴール下 finisher。",
      en: "Rim runner — efficient finisher at the basket.",
      ko: "림 근처 야투 성공률이 높은 골밑 피니셔.",
      zh: "篮下命中率高的终结者。",
      es: "Corre al aro: finalizador eficiente cerca de la canasta.",
      pt: "Corre ao aro: finalizador eficiente perto da cesta.",
      fr: "Coureur au cercle : finisseur efficace près du panier.",
    },
  },
  slasher: {
    hint: {
      ja: "ドライブが多い。ペネトレーション型。",
      en: "Slasher — attacks the rim off the dribble.",
      ko: "드라이브가 많은 페네트레이션형.",
      zh: "突破次数多，擅长切入攻筐。",
      es: "Penetrador: ataca el aro desde el bote.",
      pt: "Penetrador: ataca o aro no drible.",
      fr: "Pénétrateur : attaque le cercle en dribble.",
    },
  },
  paint_finisher: {
    hint: {
      ja: "ペイントタッチが多く、ゴール下で得点する。",
      en: "Paint finisher — scores through interior touches.",
      ko: "페인트존 터치가 많고 골밑에서 득점.",
      zh: "禁区触球多，主要在篮下得分。",
      es: "Finalizador en la zona: anota con toques interiores.",
      pt: "Finalizador no garrafão: marca com toques internos.",
      fr: "Finisseur dans la raquette : marque sur ballons intérieurs.",
    },
  },
  post_scorer: {
    hint: {
      ja: "ポストアップの使用率が高い。",
      en: "Post scorer — back-to-basket offense.",
      ko: "포스트업 사용 비중이 높음.",
      zh: "背身单打使用率高。",
      es: "Anotador de post: juega de espaldas al aro.",
      pt: "Pontuador de post: joga de costas para a cesta.",
      fr: "Scoreur en poste bas : joue dos au panier.",
    },
  },
  cutter: {
    hint: {
      ja: "カットの使用率が高い。オフボール mover。",
      en: "Cutter — thrives on backdoor and rim cuts.",
      ko: "컷인 사용 비중이 높은 오프볼 무버.",
      zh: "空切使用率高。无球跑动型。",
      es: "Cortador: vive de los cortes al aro y por la espalda.",
      pt: "Cortador: vive dos cortes ao aro e pelas costas.",
      fr: "Coupeur : vit des coupes vers le cercle et dans le dos.",
    },
  },
  off_ball_mover: {
    hint: {
      ja: "オフスクリーン・ハンドオフなどオフボールの動きが多い。",
      en: "Off-ball mover — off-screens and handoffs.",
      ko: "오프스크린·핸드오프 등 오프볼 움직임이 많음.",
      zh: "无球掩护、手递手等无球跑动多。",
      es: "Se mueve sin balón: off-screens y handoffs.",
      pt: "Movimenta-se sem bola: off-screens e handoffs.",
      fr: "Bouge sans ballon : sorties d’écran et passes main à main.",
    },
  },
  transition_threat: {
    hint: {
      ja: "トランジション playtype の比重が高い。",
      en: "Transition threat — scores in early offense.",
      ko: "트랜지션 플레이 비중이 높음.",
      zh: "转换进攻占比高。",
      es: "Amenaza en transición: anota en ataque temprano.",
      pt: "Ameaça em transição: marca no ataque rápido.",
      fr: "Menace en transition : marque en attaque rapide.",
    },
  },
  volume_scorer: {
    hint: {
      ja: "試投数（FGA）がリーグ上位。量で攻める。",
      en: "Volume scorer — high field-goal attempts.",
      ko: "야투 시도(FGA)가 리그 상위. 물량으로 공격.",
      zh: "出手数（FGA）联盟前列。以量取胜。",
      es: "Anotador de volumen: muchos tiros intentados.",
      pt: "Pontuador de volume: muitas tentativas de arremesso.",
      fr: "Scoreur de volume : beaucoup de tirs tentés.",
    },
  },
  efficient_scorer: {
    hint: {
      ja: "TS% が高い。少ないショットで効率よく得点。",
      en: "Efficient scorer — strong true shooting percentage.",
      ko: "TS%가 높음. 적은 슈팅으로 효율적으로 득점.",
      zh: "真实命中率高。用较少出手高效得分。",
      es: "Anotador eficiente: gran true shooting.",
      pt: "Pontuador eficiente: ótimo true shooting.",
      fr: "Scoreur efficace : excellent true shooting.",
    },
  },
  ft_magnet: {
    hint: {
      ja: "フリースロー試投率が高い。ファウルを誘う。",
      en: "Free-throw magnet — draws fouls and gets to the line.",
      ko: "자유투 시도 비율이 높음. 파울을 잘 유도.",
      zh: "罚球率高。善于制造犯规。",
      es: "Imán de faltas: provoca faltas y pisa la línea.",
      pt: "Ímã de faltas: provoca faltas e vai à linha.",
      fr: "Aimant à fautes : provoque des fautes et va sur la ligne.",
    },
  },
  closer: {
    hint: {
      ja: "クラッチ時の Usage / 得点が高い。終盤の主役。",
      en: "Closer — high clutch usage and scoring.",
      ko: "클러치 사용률과 득점이 높음. 종반의 주인공.",
      zh: "关键时刻使用率与得分高。末节主角。",
      es: "Closer: alto usage y anotación en clutch.",
      pt: "Closer: alto usage e pontuação no clutch.",
      fr: "Closer : gros usage et scoring en clutch.",
    },
  },
  pao_defender: {
    hint: {
      ja: "ポイント・オブ・アタック defender。相手 PG/Wing を抑える。",
      en: "Point-of-attack defender — guards primary ball-handlers.",
      ko: "포인트 오브 어택 디펜더. 상대 가드/윙을 막음.",
      zh: "第一线防守者。负责盯防对方主控与侧翼。",
      es: "Defensor del primer punto: marca a los manejadores rivales.",
      pt: "Defensor de primeira linha: marca os condutores adversários.",
      fr: "Défenseur au point d’attaque : prend les meneurs adverses.",
    },
  },
  rim_protector: {
    hint: {
      ja: "ブロック・リム protection が強い。",
      en: "Rim protector — blocks shots and deters drives.",
      ko: "블록과 림 프로텍트가 강함.",
      zh: "盖帽与护框能力强。",
      es: "Protector del aro: tapona y disuade penetraciones.",
      pt: "Protetor do aro: bloqueia e inibe penetrações.",
      fr: "Protecteur du cercle : contre et dissuade les pénétrations.",
    },
  },
  def_anchor: {
    hint: {
      ja: "個人 DRTG が良く、守備の柱。",
      en: "Defensive anchor — strong individual defensive rating.",
      ko: "개인 수비 레이팅이 좋은 수비의 기둥.",
      zh: "个人防守效率出色，是防守支柱。",
      es: "Ancla defensiva: buen defensive rating individual.",
      pt: "Âncora defensiva: bom defensive rating individual.",
      fr: "Pilier défensif : bon defensive rating individuel.",
    },
  },
  glass_cleaner: {
    hint: {
      ja: "リバウンド率が高い。ボードを取る。",
      en: "Glass cleaner — elite rebounding rate.",
      ko: "리바운드 비율이 높음. 보드를 장악.",
      zh: "篮板率高，能吃下篮板。",
      es: "Limpia el tablero: gran tasa de rebote.",
      pt: "Limpa a tabela: ótima taxa de rebote.",
      fr: "Nettoyeur de panneau : excellent taux de rebond.",
    },
  },
  hustle_energy: {
    hint: {
      ja: "ディフレクション・チャージなどハッスルプレイが多い。",
      en: "Hustle player — deflections, charges, effort plays.",
      ko: "디플렉션·차징 등 허슬 플레이가 많음.",
      zh: "干扰球、造犯规等拼抢动作多。",
      es: "Jugador de esfuerzo: desvíos, cargas y jugadas de garra.",
      pt: "Jogador de esforço: desvios, faltas provocadas e garra.",
      fr: "Joueur de l’effort : déviations, fautes provoquées, engagement.",
    },
  },
  stretch_big: {
    hint: {
      ja: "ビッグマンながら 3P を打つ。スペーシング型のフロントコート。",
      en: "Stretch big — frontcourt player who shoots threes.",
      ko: "빅맨이면서 3점을 던짐. 스페이싱형 프론트코트.",
      zh: "能投三分的大个子。拉开空间型内线。",
      es: "Pívot abridor: interior que lanza triples.",
      pt: "Pivô que abre a quadra: interior que arremessa de 3.",
      fr: "Intérieur shooteur : joue à l’intérieur mais tire à 3 pts.",
    },
  },
  roll_man: {
    hint: {
      ja: "PnR ロールマン。ゴール下へ rolling して得点。",
      en: "Roll man — pick-and-roll finisher at the rim.",
      ko: "픽앤롤 롤맨. 골밑으로 파고들어 마무리.",
      zh: "挡拆顺下者。切入篮下完成终结。",
      es: "Roll man: finaliza en el aro tras el bloqueo.",
      pt: "Roll man: finaliza no aro após o bloqueio.",
      fr: "Roll man : finit au cercle après l’écran.",
    },
  },
  backup_big: {
    hint: {
      ja: "ビッグの控え。出場時間・Usage は控えめ。",
      en: "Backup big — reserve frontcourt minutes.",
      ko: "백업 빅맨. 출전 시간과 사용률이 적음.",
      zh: "替补内线。出场时间与使用率都不高。",
      es: "Interior suplente: minutos de rotación.",
      pt: "Interior reserva: minutos de rotação.",
      fr: "Intérieur remplaçant : minutes de rotation.",
    },
  },
  connector: {
    hint: {
      ja: "Usage は低めだがパス・効率でつなぐ。",
      en: "Connector — low usage, efficient passing hub.",
      ko: "사용률은 낮지만 패스와 효율로 연결해 주는 역할.",
      zh: "使用率不高，但用传球与效率串联全队。",
      es: "Conector: poco usage, pero pasa y produce con eficiencia.",
      pt: "Conector: pouco usage, mas passa e produz com eficiência.",
      fr: "Connecteur : peu de ballons, mais relie le jeu efficacement.",
    },
  },
  sixth_man: {
    hint: {
      ja: "スターター以外で高い MPG。第6人として大きな役割。",
      en: "Sixth man — high minutes off the bench.",
      ko: "선발이 아니면서 출전 시간이 많음. 식스맨으로 큰 역할.",
      zh: "非首发但出场时间长。作为第六人角色重要。",
      es: "Sexto hombre: muchos minutos desde el banquillo.",
      pt: "Sexto homem: muitos minutos saindo do banco.",
      fr: "Sixième homme : gros temps de jeu depuis le banc.",
    },
  },
  low_usage: {
    hint: {
      ja: "Usage が低い。ロールプレイヤー型。",
      en: "Low-usage role player — limited offensive touches.",
      ko: "사용률이 낮은 롤 플레이어형.",
      zh: "使用率低的角色球员。",
      es: "Jugador de rol con poco usage: pocos balones.",
      pt: "Jogador de função com pouco usage: poucas bolas.",
      fr: "Joueur de rôle à faible usage : peu de ballons.",
    },
  },

  // — Role change signals —
  min_up: {
    hint: {
      ja: "直近5試合の出場時間が、その前5試合より15%以上増加。",
      en: "Minutes up 15%+ over the last 5 games vs the prior 5.",
      ko: "최근 5경기 출전 시간이 이전 5경기보다 15% 이상 증가.",
      zh: "近5场出场时间比之前5场增加15%以上。",
      es: "Minutos +15% o más en los últimos 5 partidos frente a los 5 previos.",
      pt: "Minutos +15% ou mais nos últimos 5 jogos vs os 5 anteriores.",
      fr: "Minutes en hausse de 15% ou plus sur les 5 derniers matchs vs les 5 précédents.",
    },
  },
  min_down: {
    hint: {
      ja: "直近5試合の出場時間が、その前5試合より15%以上減少。",
      en: "Minutes down 15%+ over the last 5 games vs the prior 5.",
      ko: "최근 5경기 출전 시간이 이전 5경기보다 15% 이상 감소.",
      zh: "近5场出场时间比之前5场减少15%以上。",
      es: "Minutos -15% o más en los últimos 5 partidos frente a los 5 previos.",
      pt: "Minutos -15% ou mais nos últimos 5 jogos vs os 5 anteriores.",
      fr: "Minutes en baisse de 15% ou plus sur les 5 derniers matchs vs les 5 précédents.",
    },
  },
  fga_up: {
    hint: {
      ja: "直近5試合の FGA が前5試合より20%以上増加。",
      en: "Field-goal attempts up 20%+ in the last 5 vs prior 5.",
      ko: "최근 5경기 야투 시도가 이전 5경기보다 20% 이상 증가.",
      zh: "近5场出手数比之前5场增加20%以上。",
      es: "Tiros intentados +20% o más en los últimos 5 frente a los 5 previos.",
      pt: "Tentativas de arremesso +20% ou mais nos últimos 5 vs os 5 anteriores.",
      fr: "Tirs tentés en hausse de 20% ou plus sur les 5 derniers vs les 5 précédents.",
    },
  },
  pts_up: {
    hint: {
      ja: "直近5試合の得点が前5試合より20%以上増加。",
      en: "Scoring up 20%+ in the last 5 vs prior 5.",
      ko: "최근 5경기 득점이 이전 5경기보다 20% 이상 증가.",
      zh: "近5场得分比之前5场增加20%以上。",
      es: "Anotación +20% o más en los últimos 5 frente a los 5 previos.",
      pt: "Pontuação +20% ou mais nos últimos 5 vs os 5 anteriores.",
      fr: "Scoring en hausse de 20% ou plus sur les 5 derniers vs les 5 précédents.",
    },
  },
  starter_push: {
    hint: {
      ja: "直近3試合の MIN がシーズン平均より大幅に増。スターター昇格 push。",
      en: "Recent minutes surge — pushing into a starter role.",
      ko: "최근 3경기 출전 시간이 시즌 평균보다 크게 증가. 선발 승격 흐름.",
      zh: "近3场出场时间明显高于赛季平均。有望升为首发。",
      es: "Subida reciente de minutos: empuja hacia el quinteto inicial.",
      pt: "Alta recente de minutos: caminha para ser titular.",
      fr: "Hausse récente des minutes : pousse vers un rôle de titulaire.",
    },
  },
  bench_slide: {
    hint: {
      ja: "直近3試合の MIN がシーズン平均より大幅に減。ベンチ降格傾向。",
      en: "Recent minutes drop — sliding toward the bench.",
      ko: "최근 3경기 출전 시간이 시즌 평균보다 크게 감소. 벤치로 밀리는 추세.",
      zh: "近3场出场时间明显低于赛季平均。有被挤到替补的趋势。",
      es: "Caída reciente de minutos: se desliza hacia el banquillo.",
      pt: "Queda recente de minutos: escorregando para o banco.",
      fr: "Baisse récente des minutes : glisse vers le banc.",
    },
  },
};

export function getDetailChipCopy(id: string): DetailChipCopy | null {
  return COPY[id] ?? null;
}

/** カタログに無い ID は label から自動生成の説明を出す */
function fallbackHint(label: string): UiStrings {
  return {
    ja: `${label} — 今季スタッツから自動判定。`,
    en: `${label} — Auto-tagged from season stats.`,
    ko: `${label} — 이번 시즌 스탯으로 자동 판정.`,
    zh: `${label} — 依据本季数据自动判定。`,
    es: `${label} — Etiquetado automático según stats de la temporada.`,
    pt: `${label} — Marcado automaticamente pelas stats da temporada.`,
    fr: `${label} — Étiqueté automatiquement d’après les stats de la saison.`,
  };
}

export function enrichInsightChip<
  T extends { id: string; label: string },
>(chip: T): T & DetailChipCopy {
  const copy = getDetailChipCopy(chip.id);
  return {
    ...chip,
    hint: copy?.hint ?? fallbackHint(chip.label),
  };
}

export function enrichInsightChips<
  T extends { id: string; label: string },
>(chips: T[]): Array<T & DetailChipCopy> {
  return chips.map(enrichInsightChip);
}
