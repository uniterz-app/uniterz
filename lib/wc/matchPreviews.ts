import type { Language } from "@/lib/i18n/language";

type WcMatchPreviewCopy = {
  ja: readonly string[];
  en: readonly string[];
};

/** gameId → 試合展望（第2節以降は順次追加） */
const WC_MATCH_PREVIEWS: Record<string, WcMatchPreviewCopy> = {
  "wc-2026-A-cze-zaf": {
    ja: [
      "A組の敗者同士。チェコは韓国に1-2、南アフリカはメキシコに0-2で敗れており、ここで負けると3位通過争いでもかなり厳しくなる。特にチェコは最終節がメキシコ戦のため、この試合で勝点3が欲しい。",
      "チェコは初戦、セットプレーやロングスローなど高さを使った攻撃では可能性を見せた。一方で、オープンプレーから崩す形は少なく、シックに良い形でボールを届けられなかった。南アフリカ相手には、押し込んだ時間を得点に変えられるかが鍵になる。",
      "南アフリカはメキシコ戦で守備に回る時間が長く、攻撃の脅威をほとんど出せなかった。さらに初戦で2人が退場しており、中盤と守備の強度には不安がある。チェコの高さを受け続ける展開は避けたい。",
      "この試合は、チェコの高さとセットプレーに対して、南アフリカがどこまで耐えられるか。0-0の時間が長ければ南アにもカウンターの余地はあるが、先に失点するとかなり苦しくなる。",
    ],
    en: [
      "Two Group A losers meet. The Czech Republic lost 1–2 to Korea Republic and South Africa fell 0–2 to Mexico, so another defeat would make a third-place escape very difficult. The Czechs face Mexico on the final matchday, so three points here matter even more.",
      "In the opener, the Czechs showed threat from set pieces and long throws, using their height. They created fewer chances in open play and struggled to feed Patrik Schick in good positions. Against South Africa, turning territorial pressure into goals will be the key.",
      "South Africa spent long stretches defending against Mexico and offered little going forward. They also lost two players to red cards in the opener, which raises doubts about midfield and defensive depth. They will want to avoid another game of absorbing Czech height.",
      "The match hinges on whether South Africa can withstand Czech set pieces and aerial pressure. A long 0–0 would leave room for counters, but conceding first would make life very hard.",
    ],
  },
  "wc-2026-B-che-bih": {
    ja: [
      "B組は初戦の2試合がどちらも1-1で、4チーム全てが勝点1。勝ったチームは一気に突破へ近づき、負けたチームは最終節でかなり追い込まれる。",
      "スイスはカタール戦で試合を支配し、多くのシュートを放った。ジャカを中心に中盤を握り、内容では上回っていたが、追加点を奪えず終盤に追いつかれた。決定力と試合管理が修正点になる。",
      "ボスニアはカナダ戦で勝点1を確保。フィジカル、球際、セットプレーには強みがあり、スイス相手にも簡単には崩れない。ただし、押し込まれる時間が長くなると前線が孤立しやすい。",
      "注目は、スイスが中盤支配を得点につなげられるか。ボスニアはジャカ周辺を制限し、セットプレーやカウンターで一発を狙いたい。",
    ],
    en: [
      "Group B opened with two 1–1 draws, leaving all four teams on one point. A win pushes a side close to qualification; a loss sets up a stressful final matchday.",
      "Switzerland dominated Qatar and fired plenty of shots. Granit Xhaka anchored midfield and they were the better side on balance, but they could not add a second goal and were pegged back late. Finishing and game management are the fixes.",
      "Bosnia and Herzegovina took a point against Canada. They are strong physically, competitive in duels, and dangerous from set pieces, so they will not be easy to break down. If pinned back for long spells, their front line can become isolated.",
      "Watch whether Switzerland can turn midfield control into goals. Bosnia will try to limit Xhaka’s influence and threaten on set pieces and counters.",
    ],
  },
  "wc-2026-B-can-qat": {
    ja: [
      "B組のもう一つの重要な試合。カナダもカタールも初戦は1-1で、勝てばグループ突破に大きく近づく。開催国カナダにとっては、ホームで勝点3を取りたい試合になる。",
      "カナダはボスニア戦で苦しい入りになったが、最終的には追いついて勝点1を拾った。ラリンの決定力、サイドの推進力、ホームの後押しは武器。ただし、試合の入り方と攻撃のテンポには改善が必要。",
      "カタールはスイス戦でかなり押し込まれながら、終盤に追いついて勝点1を取った。粘り強さは見せたが、被シュート数は多く、内容的には受け身の時間が長かった。カナダ戦でも耐える展開になりやすい。",
      "この試合は、カナダが先制できるかが最大のポイント。早く点を取れればカナダ優勢、0-0が続けばカタールの粘りとカナダの焦りが試合を難しくする。",
    ],
    en: [
      "The other big Group B fixture. Canada and Qatar both drew 1–1 in round one, so a win takes either side a long way toward the knockout stage. For co-host Canada, this is the home game where they want all three points.",
      "Canada made a difficult start against Bosnia but fought back for a point. Jonathan David’s finishing, wide thrust, and home support are weapons, though their opening rhythm and attacking tempo still need sharpening.",
      "Qatar were pinned back heavily by Switzerland yet salvaged a late equalizer. They showed resilience, but faced many shots and spent long periods in a low block. A similar shape is likely here.",
      "The decisive question is whether Canada can score first. An early goal favors Canada; a prolonged 0–0 plays into Qatar’s resilience and Canada’s nerves.",
    ],
  },
  "wc-2026-A-mex-kor": {
    ja: [
      "A組の首位争い。メキシコは南アフリカに2-0、韓国はチェコに2-1で勝利しており、どちらも勝点3。勝ったチームはグループ突破にかなり近づく。",
      "メキシコは初戦を2-0で勝ち切った。ホームの勢いを使いながら結果を出した一方で、CBモンテスが退場しており、韓国戦では最終ラインの再編が必要になる。韓国の速攻を受ける上で、この不在は大きい。",
      "韓国はチェコ戦で先制されながら逆転勝利。ソン・フンミンの使い方、決勝点を決めたオ・ヒョンギュの起用、中盤の組み合わせが注目になる。相手が前に出た後のカウンターは大きな武器。",
      "この試合の軸は、メキシコの保持と韓国の速攻。メキシコがリスク管理できれば優位だが、前がかりになりすぎると、韓国のカウンターが一気に試合を動かす。",
    ],
    en: [
      "A Group A top-of-the-table clash. Mexico beat South Africa 2–0 and Korea Republic came from behind to beat the Czech Republic 2–1, so both sit on three points. The winner moves very close to the round of 32.",
      "Mexico controlled their opener 2–0, riding home momentum, but centre-back César Montes is suspended after a red card. They must reshuffle the back line against Korea’s transitions, and that absence is significant.",
      "Korea overturned an early deficit against the Czechs. How they use Son Heung-min, whether Oh Hyeon-gyu starts after scoring the winner, and their midfield pairing are worth watching. Counter-attacks when Mexico commit forward are a major weapon.",
      "The axis is Mexico’s possession against Korea’s speed. If Mexico manage risk well they hold the edge, but overcommitting will leave them open to counters that can swing the game quickly.",
    ],
  },
  "wc-2026-D-usa-aus": {
    ja: [
      "D組の勝点3同士。アメリカはパラグアイに4-1、オーストラリアはトルコに2-0で勝利しており、この試合に勝った方はグループ首位通過に大きく近づく。",
      "アメリカは初戦、攻撃の連動性が良く、前線と中盤の距離感も整理されていた。バログンの決定力も大きく、開催国として理想的なスタート。ただし、プリシッチのコンディションには不安があり、出場状態次第で攻撃の質は変わる。",
      "オーストラリアはトルコにボールを持たれながらも、守備を崩さず2-0で勝ち切った。中央を固め、少ないチャンスを得点に変える効率は高い。アメリカ相手にも、守ってから速く出る形が基本になる。",
      "この試合の軸は、アメリカの攻撃力がオーストラリアの堅い守備を崩せるか。アメリカが先制すれば展開は楽になるが、0-0の時間が長いとオーストラリアのカウンターとセットプレーが怖くなる。",
    ],
    en: [
      "Two Group D sides on three points. The United States beat Paraguay 4–1 and Australia beat Turkey 2–0, so the winner here moves very close to topping the group.",
      "The US linked attack well in the opener, with the front line and midfield at sensible distances. Folarin Balogun’s finishing was decisive for an ideal start as co-hosts, but Christian Pulisic’s fitness is a concern and his availability will shape how dangerous they look.",
      "Australia conceded possession to Turkey yet held firm and won 2–0. They compact the centre and convert limited chances efficiently. Against the US they will likely defend first and break quickly.",
      "The axis is whether US firepower can crack Australia’s organised defence. An early US goal opens the game up; a long 0–0 raises the threat of Australian counters and set pieces.",
    ],
  },
  "wc-2026-C-sct-mar": {
    ja: [
      "C組はスコットランドが勝点3で首位、モロッコはブラジルと引き分けて勝点1。スコットランドが勝てば突破に大きく近づき、モロッコが勝てば一気にグループ上位へ浮上する。",
      "スコットランドはハイチ戦を1-0で勝ち切った。派手な内容ではなかったが、守備の粘りと勝負強さは見せた。初戦で勝点3を取ったことで、心理的にはかなり楽になっている。",
      "ただし、攻撃面ではまだ物足りない。ボールを持った時の質やチャンスの数は増やしたい。モロッコ相手に守る時間が長くなると、最後まで耐え切れるかが問われる。",
      "モロッコはブラジル相手に1-1と好内容。前半はかなり主導権を握り、組織としての完成度も高かった。スコットランド戦では、サイドの推進力と中盤の強度で押し込めるかが鍵になる。",
      "この試合の軸は、スコットランドの守備ブロックをモロッコが崩せるか。スコットランドは引き分けでも価値があるが、モロッコは内容通りに勝点3まで取り切りたい試合になる。",
    ],
    en: [
      "Scotland lead Group C on three points while Morocco drew 1–1 with Brazil for one. A Scotland win takes them close to the knockouts; a Morocco win vaults them toward the top of the group.",
      "Scotland edged Haiti 1–0 without sparkling football, but showed defensive grit and competitiveness. Taking three points in the opener has eased the mood considerably.",
      "Going forward they still lack punch. They need more quality in possession and more chances. If Morocco pin them back for long spells, the question is whether they can hold out.",
      "Morocco were impressive in a 1–1 draw with Brazil, controlling much of the first half with a well-organised team. Against Scotland, wide thrust and midfield power will be key.",
      "The axis is whether Morocco can break down Scotland’s defensive block. A draw still suits Scotland; Morocco will want all three points to match their performance level.",
    ],
  },
  "wc-2026-C-bra-hti": {
    ja: [
      "ブラジルは初戦でモロッコと1-1。内容面では苦しみ、2戦目のハイチ戦は立て直しが求められる試合になる。ハイチはスコットランドに0-1で敗れており、ここで負けると突破はかなり厳しくなる。",
      "ブラジルはヴィニシウスの個人技で追いついたが、チーム全体としては噛み合っていなかった。中盤の前進、守備の距離感、前線の組み合わせには修正が必要。格下相手でも、内容を改善できるかが見られる。",
      "ハイチはスコットランド戦で勝点を取れなかったが、大崩れはしなかった。守備で粘り、試合を壊さないことはできる。ただし、攻撃の迫力は限られており、ブラジル相手に自分たちから押し返すのは難しい。",
      "この試合の軸は、ブラジルが早い時間に先制できるか。先に取れば大量得点の可能性もあるが、時間がかかると初戦の不安が再び表に出てくる。ブラジルにとっては勝利だけでなく、内容も必要な試合。",
    ],
    en: [
      "Brazil drew 1–1 with Morocco in a difficult opener, so the Haiti match is a reset game. Haiti lost 1–0 to Scotland and another defeat would make qualification very unlikely.",
      "Vinícius Júnior’s individual skill earned Brazil a point, but the team did not click. Midfield progression, defensive spacing, and combinations in attack all need work. Even against lower-ranked opposition, they must show improvement.",
      "Haiti failed to take points against Scotland but did not collapse. They can stay compact and keep the game alive, though their attacking threat is limited and pushing Brazil back is a tall order.",
      "The axis is whether Brazil can score early. A quick lead could open the door to a big win; if it takes time, doubts from the opener may return. Brazil need the win and a better performance.",
    ],
  },
  "wc-2026-D-tur-pry": {
    ja: [
      "D組の敗者同士。トルコはオーストラリアに0-2、パラグアイはアメリカに1-4で敗れており、ここで負けると突破の可能性はかなり小さくなる。どちらも勝点3が必要な試合。",
      "トルコは初戦でボールを持ちながら、オーストラリアの守備を崩せなかった。アルダ・ギュレルを中心に攻撃の才能はあるが、最後の精度と崩し切る力に課題が出た。パラグアイ戦では、保持を得点に変えられるかが重要になる。",
      "パラグアイはアメリカ戦で守備が崩れ、4失点を喫した。大会復帰の初戦としてはかなり厳しい内容で、球際や守備の整理が必要になる。ただし、エンシソやアルミロンの個人能力はあり、カウンターでは十分に脅威を作れる。",
      "この試合の軸は、トルコの保持とパラグアイの速攻。トルコが押し込む展開になりやすいが、前がかりになりすぎるとパラグアイのカウンターを受ける。どちらも引き分けでは足りないため、後半に試合が大きく動く可能性がある。",
    ],
    en: [
      "Two Group D losers meet. Turkey fell 0–2 to Australia and Paraguay lost 4–1 to the United States, so defeat here leaves little hope of advancing. Both sides need three points.",
      "Turkey had the ball against Australia but could not break them down. Arda Güler and others offer attacking talent, but finishing and the final pass to unlock a block were missing. Against Paraguay, turning possession into goals is the priority.",
      "Paraguay’s defence was torn apart in a 4–1 loss to the US on their return to the World Cup. Duels and defensive organisation need fixing, but Julio Enciso and Miguel Almirón can still threaten on the counter.",
      "The axis is Turkey’s possession against Paraguay’s transitions. Turkey are likely to push forward, but overcommitting invites counters. Neither side can afford a draw, so the game may open up late.",
    ],
  },
  "wc-2026-F-nld-swe": {
    ja: [
      "F組の上位争い。スウェーデンはチュニジアに5-1で快勝し、勝点3で首位。オランダは日本と2-2で引き分けており、この試合で勝てないと最終節にプレッシャーがかかる。",
      "オランダは日本戦で2度リードしながら追いつかれた。攻撃の形は作れていたが、試合を閉じる力には課題が残った。スウェーデン相手には、リード後の守備管理と中盤の強度が重要になる。",
      "スウェーデンは初戦で攻撃陣が爆発。イサク、ギェケレシュ、アヤリが機能し、カウンターでも中央突破でも迫力を出せた。ただし、オランダ相手に同じように前へ出られるかは別問題。",
      "この試合の軸は、オランダの保持に対してスウェーデンの前線がどれだけ速く刺せるか。オランダがボールを支配しても、守備の背後を空けるとスウェーデンの2トップが一気に試合を動かす。",
    ],
    en: [
      "A Group F top-of-the-table clash. Sweden thrashed Tunisia 5–1 to lead on three points while the Netherlands drew 2–2 with Japan. The Dutch cannot afford to slip here with the final matchday looming.",
      "The Netherlands twice led Japan only to be pegged back. They built good attacking shapes but still lack the ability to close games out. Against Sweden, managing leads and midfield intensity will matter.",
      "Sweden’s attack exploded in the opener. Alexander Isak, Gyökeres and Ayari all clicked, threatening on counters and through the middle. Whether they can push forward the same way against the Netherlands is another question.",
      "The axis is how quickly Sweden’s front line can punish Dutch possession. Even if the Netherlands dominate the ball, space in behind can let their two strikers swing the game in an instant.",
    ],
  },
  "wc-2026-E-deu-civ": {
    ja: [
      "E組の勝点3同士。ドイツはキュラソーに7-1、コートジボワールはエクアドルに1-0で勝利しており、勝った方は首位通過に大きく近づく。",
      "ドイツは初戦で攻撃陣が爆発した。ハヴァーツ、ムシアラ、ウンダフらが得点に絡み、ボール保持から崩す形もスムーズだった。ただし、相手のレベルを考えると、本当の強度はこの試合で見えてくる。",
      "コートジボワールはエクアドル戦で終盤に勝ち切った。守備で粘りながら、最後にアマドが決めた勝負強さは大きい。一方で、ドイツ戦はワヒが帯同できず、前線の選択肢には影響が出る。",
      "この試合の軸は、ドイツの攻撃力がコートジボワールのフィジカルと守備強度を上回れるか。コートジボワールは耐える時間が長くなっても、サイドとカウンターで一発を狙える。",
    ],
    en: [
      "Two Group E sides on three points. Germany beat Curaçao 7–1 and Côte d’Ivoire edged Ecuador 1–0, so the winner moves very close to topping the group.",
      "Germany’s attack fired in the opener. Kai Havertz, Jamal Musiala and Niclas Füllkrug all scored, and they broke down opponents smoothly from possession. Against stronger opposition, their true level will show here.",
      "Côte d’Ivoire ground out a late win against Ecuador, with Simon Adingra’s winner highlighting their competitiveness. They travel without Nicolas Wahi, which narrows their options up front.",
      "The axis is whether Germany’s firepower can overcome Ivorian physicality and defensive strength. Even if pinned back for long spells, Côte d’Ivoire can threaten wide and on the counter.",
    ],
  },
  "wc-2026-E-ecu-cuw": {
    ja: [
      "E組の勝点0同士。エクアドルはコートジボワールに0-1、キュラソーはドイツに1-7で敗れており、ここで負けると突破はかなり厳しくなる。",
      "エクアドルは初戦で敗れたが、内容が悪すぎたわけではない。クロスバー直撃もあり、チャンス自体は作れていた。ただ、終盤に失点して勝点を落としたことで、2戦目は結果が必要になる。",
      "キュラソーはドイツ相手に大敗したが、W杯初得点を決めたことは大きな意味がある。守備ではかなり崩された一方で、カウンターで得点できる形も見せた。エクアドル相手には、より現実的に勝点を狙いたい。",
      "この試合の軸は、エクアドルが主導権を握って早めに得点できるか。キュラソーは守備を立て直し、カウンターとセットプレーでワンチャンスを狙う展開になる。",
    ],
    en: [
      "Two Group E sides without a point. Ecuador lost 1–0 to Côte d’Ivoire and Curaçao fell 7–1 to Germany, so defeat here makes qualification very unlikely.",
      "Ecuador’s opening loss was not a disaster on performance. They hit the bar and created chances, but a late concession cost them a result. Matchday two demands points.",
      "Curaçao were hammered by Germany but scored their first World Cup goal, which matters symbolically. They were opened up defensively yet showed they can score on the break. Against Ecuador they can target points more realistically.",
      "The axis is whether Ecuador can take control and score early. Curaçao will try to rebuild defensively and hunt one chance on counters and set pieces.",
    ],
  },
  "wc-2026-F-tun-jpn": {
    ja: [
      "F組では日本がオランダと2-2で引き分け、チュニジアはスウェーデンに1-5で大敗。日本は勝てば突破へ大きく近づき、チュニジアは負けるとグループ突破がかなり厳しくなる。",
      "チュニジアは初戦で守備が崩れた。早い時間に失点し、試合プランが壊れた後に立て直せなかった。さらに初戦後に監督が交代しており、日本戦では戦い方の整理がどこまで進むかが焦点になる。",
      "日本はオランダ相手に2度追いつき、勝点1を取った。中村敬斗と鎌田大地の得点で粘り強さを見せた一方、2失点しているため守備の入り方には修正が必要。遠藤不在の中で、中盤のバランスも重要になる。",
      "この試合の軸は、日本がボールを持つ時間を得点につなげられるか。チュニジアは前に出る必要があるため、日本はその背後を使える。先制できれば日本がかなり優位に進められる試合。",
    ],
    en: [
      "Japan drew 2–2 with the Netherlands while Tunisia lost 5–1 to Sweden in Group F. A Japan win takes them close to the knockouts; another Tunisia defeat would make advancement very difficult.",
      "Tunisia’s defence collapsed in the opener. Early goals wrecked their plan and they never recovered. They also changed manager after round one, so how quickly a new approach settles is a key question.",
      "Japan twice came back against the Netherlands for a point. Keito Nakamura and Daichi Kamada showed resilience, but conceding twice means they must sharpen their defensive start. Without Wataru Endo, midfield balance will be critical.",
      "The axis is whether Japan can turn possession into goals. Tunisia must push forward, which should leave space in behind. Score first and Japan can control the game comfortably.",
    ],
  },
  "wc-2026-H-esp-sau": {
    ja: [
      "H組は初戦の2試合がどちらも引き分け。スペインはカーボベルデと0-0、サウジアラビアはウルグアイと1-1で、4チームが勝点1で並んでいる。ここで勝てば、一気に突破争いで前に出られる。",
      "スペインは初戦、ボールを大きく支配し、多くのシュートを放ちながらも無得点に終わった。相手を押し込むことはできていたが、攻撃が外回りになり、最後の崩しと決定力を欠いた。サウジ戦では、保持率ではなくゴール前の質が問われる。",
      "サウジアラビアはウルグアイ相手に勝点1を獲得。守備だけでなく、前に出る場面も作り、強豪相手に簡単には崩れないことを示した。スペイン戦では押し込まれる時間が増えるが、奪った後の一気の前進が武器になる。",
      "注目点は、スペインが低い守備ブロックをどう動かすか。サウジは中央を締めながら、スペインのSB裏や中盤の背後をカウンターで狙いたい。",
    ],
    en: [
      "Group H opened with two draws: Spain 0–0 Cape Verde and Saudi Arabia 1–1 Uruguay, leaving all four teams on one point. A win here pushes a side to the front of the qualification race.",
      "Spain dominated possession and fired plenty of shots against Cape Verde but scored none. They pinned opponents back yet attacked around the edges, lacking the final pass and finishing. Against Saudi Arabia, quality in the box matters more than possession.",
      "Saudi Arabia took a point off Uruguay and showed they are not a defence-only side. They can step forward against strong teams. Spain will pin them back, but quick transitions after winning the ball are Saudi’s weapon.",
      "Watch how Spain break down a low block. Saudi will close the centre and counter into space behind Spain’s full-backs and midfield.",
    ],
  },
  "wc-2026-G-bel-irn": {
    ja: [
      "G組も4チームが勝点1で横並び。ベルギーはエジプトと1-1、イランはニュージーランドと2-2。ベルギーにとっては、初戦の物足りなさを払拭するためにも勝利が必要な試合になる。",
      "ベルギーはエジプト戦でボールを持ちながら、先に失点した。ルカク投入後に前線の圧力は増し、相手のオウンゴールで追いついたが、攻撃全体のテンポはまだ重かった。イラン戦では、序盤からゴール前に人数をかけられるかがポイントになる。",
      "イランはニュージーランド戦で2失点しながらも、2-2まで持ち込んだ。崩れずに点を取り返す力は見せたが、守備の入り方には不安がある。ベルギー相手に先に失点すると、試合を戻す難度はかなり上がる。",
      "見どころは、ベルギーの前線がイランの守備を早めにこじ開けられるか。イランは我慢しながら、セットプレーやカウンターで勝点を拾う展開に持ち込みたい。",
    ],
    en: [
      "Group G is also level on one point: Belgium drew 1–1 with Egypt and Iran drew 2–2 with New Zealand. Belgium need a win to shake off a flat opening performance.",
      "Belgium had the ball against Egypt but fell behind first. Romelu Lukaku’s introduction raised front-line pressure and an own goal levelled the score, but overall attacking tempo remained heavy. Against Iran, flooding the box early will be key.",
      "Iran conceded twice against New Zealand yet fought back to 2–2, showing they can respond without collapsing. Their defensive start is still a worry; falling behind early to Belgium would be much harder to overturn.",
      "The focus is whether Belgium’s attack can unlock Iran early. Iran will sit in and try to steal points on set pieces and counters.",
    ],
  },
  "wc-2026-H-ury-cpv": {
    ja: [
      "H組の勝点1同士。ウルグアイはサウジアラビアと1-1、カーボベルデはスペインを0-0で止めた。勝ったチームは突破へ大きく近づき、負けたチームは最終節がかなり重くなる。",
      "ウルグアイは初戦で勝ち切れなかった。中盤の強度や前線への圧力はあったが、サウジの守備を崩し切る時間は限られた。バルベルデを中心にテンポを上げながら、相手を押し下げる攻撃が必要になる。",
      "カーボベルデはスペイン戦で歴史的な勝点1を獲得。守備ブロックの集中力とGKヴォジーニャの好守で、強豪相手に最後まで耐え切った。ただし、攻撃の時間は少なく、勝つためにはカウンターの精度を上げたい。",
      "焦点は、ウルグアイがカーボベルデの粘りを早い時間に崩せるか。カーボベルデはスペイン戦と同じように耐えながら、少ないチャンスを一発で仕留めたい。",
    ],
    en: [
      "Two Group H sides on one point: Uruguay drew 1–1 with Saudi Arabia and Cape Verde held Spain 0–0. The winner moves close to the knockouts; the loser faces a stressful final matchday.",
      "Uruguay could not finish off Saudi Arabia. They had midfield power and front-line pressure but limited time breaking the block. Federico Valverde must raise the tempo and keep Cape Verde pinned.",
      "Cape Verde earned a historic point against Spain. Concentration in their low block and Vozinha’s goalkeeping held out a favourite. They had little time in attack and need sharper counters to win.",
      "The focus is whether Uruguay can break Cape Verde’s resilience early. Cape Verde will sit deep again and try to finish the few chances they get.",
    ],
  },
  "wc-2026-G-nzl-egy": {
    ja: [
      "G組の勝点1同士。ニュージーランドはイランと2-2、エジプトはベルギーと1-1。どちらも初戦で勝点を取っており、この直接対決で勝てば突破争いの立場はかなり良くなる。",
      "ニュージーランドはイラン戦で2度リードした。イライジャ・ジャストの2得点で攻撃面の可能性を見せ、W杯初勝利にかなり近づいた試合だった。ただ、リードを守り切れず、試合終盤の守備には課題が残った。",
      "エジプトはベルギー相手に先制し、勝点1を持ち帰った。サラーやマーモウシュだけでなく、中盤からも得点が生まれた点は好材料。一方で、後半はベルギーの圧力を受け、最後まで逃げ切ることはできなかった。",
      "この一戦は、ニュージーランドのシンプルな前進と、エジプトの個の質がぶつかる試合になる。ニュージーランドは空中戦とセットプレー、エジプトはサラーとマーモウシュを使った速攻で勝負したい。",
    ],
    en: [
      "Two Group G sides on one point: New Zealand drew 2–2 with Iran and Egypt drew 1–1 with Belgium. Both took something from the opener, so a win here improves their qualification picture sharply.",
      "New Zealand twice led Iran. Elijah Just’s brace showed attacking potential and took them close to a first World Cup win, but they could not protect leads and late defending remains a concern.",
      "Egypt scored first against Belgium and took a point. Goals from beyond Salah and Marmoush were encouraging, though they spent much of the second half under pressure and could not hold out completely.",
      "This is direct New Zealand thrust against Egyptian individual quality. New Zealand will lean on aerial play and set pieces; Egypt want quick attacks through Salah and Omar Marmoush.",
    ],
  },
  "wc-2026-J-arg-aut": {
    ja: [
      "J組の勝点3同士。アルゼンチンはアルジェリアに3-0、オーストリアはヨルダンに3-1で勝利。勝った方はグループ突破へ大きく近づき、首位通過争いでも優位に立つ。",
      "アルゼンチンは初戦、メッシのハットトリックで完勝した。大きな崩れはなく、決めるべき選手が決めた理想的な入り。ただし、攻撃がメッシの個人能力に寄る時間もあり、オーストリアの強度を受けた時に周囲がどれだけ関われるかは見たい。",
      "オーストリアはヨルダン相手に苦しみながらも勝ち切った。シュミットの先制点、途中出場のアルナウトヴィッチの存在感で試合を動かした一方、ヨルダンのカウンターには何度か揺さぶられた。アルゼンチン戦では、前からの圧力と背後の管理を両立する必要がある。",
      "この試合は、アルゼンチンの落ち着いた保持に対して、オーストリアがどこまでテンポを壊せるか。オーストリアが強く出ても、プレスを外された瞬間にメッシや中盤の配球で一気に決定機まで運ばれる危険がある。",
    ],
    en: [
      "Two Group J sides on three points. Argentina beat Algeria 3–0 and Austria beat Jordan 3–1, so the winner moves close to the knockouts and the group summit.",
      "Argentina cruised in the opener behind Lionel Messi’s hat-trick. There were few defensive lapses and the right players finished chances — an ideal start. Yet attacks still tilted toward Messi’s individual brilliance, and against Austria’s intensity we need to see how much the players around him contribute.",
      "Austria laboured but beat Jordan. Marcel Sabitzer’s opener and Marko Arnautović off the bench shifted the game, though Jordan’s counters caused problems. Against Argentina they must combine high pressing with protection in behind.",
      "The axis is whether Austria can disrupt Argentina’s calm possession. Press hard and the moment they escape, Messi and midfield passing can turn a half-chance into a clear scoring opportunity.",
    ],
  },
  "wc-2026-I-fra-irq": {
    ja: [
      "I組はフランスとノルウェーが勝点3で並んでいる。フランスはセネガルに3-1、イラクはノルウェーに1-4で敗戦。フランスは連勝で突破をかなり近づけたい試合になる。",
      "フランスは初戦、前半はかなり重かった。セネガルに決定機を作られ、0-0で折り返した後、後半にムバッペの2得点とバルコラの得点で突き放した。勝ったとはいえ、試合の入り方には修正が必要。",
      "イラクはノルウェー戦で一度は同点に追いついた。アイメン・フセインの得点で粘りを見せたが、その後はミスから失点を重ねて4失点。フランス相手に同じような守備の乱れが出ると、試合は早く壊れる。",
      "焦点は、フランスが前半からスイッチを入れられるか。イラクは深く守るだけでは耐え切るのが難しいため、セットプレーやロングボールでフランスの守備を下げさせたい。",
    ],
    en: [
      "France and Norway lead Group I on three points. France beat Senegal 3–1 and Iraq lost 4–1 to Norway, so France want a second win to close in on qualification.",
      "France were laboured in the first half against Senegal, conceded chances and went in at 0–0. Kylian Mbappé’s brace and Bradley Barcola’s goal pulled away after the break — a win, but the opening rhythm needs fixing.",
      "Iraq equalised against Norway through Aymen Hussein’s goal but unravelled with mistakes for four conceded. The same defensive chaos against France would end the game early.",
      "The focus is whether France can flip the switch from the first whistle. Iraq cannot survive deep blocks alone and will try set pieces and long balls to drag France’s back line down.",
    ],
  },
  "wc-2026-I-nor-sen": {
    ja: [
      "I組の重要な一戦。ノルウェーはイラクに4-1で快勝、セネガルはフランスに1-3で敗れた。ノルウェーが勝てば突破に大きく近づき、セネガルは負けると最終節がかなり厳しくなる。",
      "ノルウェーはハーランドがW杯初戦で2得点。少ないタッチでも決定機を仕留める力を見せ、チーム全体も縦に速い攻撃で迫力を出した。ただし、イラクに一度追いつかれており、守備の安定感にはまだ余地がある。",
      "セネガルはフランス相手に敗れたが、前半は十分に戦えていた。サールの決定機もあり、先制していてもおかしくない時間帯があった。課題は、後半に相手の個の力と交代策で押し切られたこと。",
      "この試合は、セネガルがハーランドへの供給をどこまで止められるか。ノルウェーはクロスや縦パスで早く前線に入れたい一方、セネガルはサイドの推進力とカウンターでノルウェーの守備を走らせたい。",
    ],
    en: [
      "A pivotal Group I fixture. Norway thrashed Iraq 4–1 while Senegal lost 3–1 to France. A Norway win takes them close to the round of 32; defeat leaves Senegal facing a brutal final matchday.",
      "Erling Haaland scored twice on his World Cup debut, finishing with few touches, and Norway attacked vertically with real threat. They were pegged back once by Iraq, so defensive stability still has room to improve.",
      "Senegal lost to France but competed well in the first half. Ismaïla Sarr had chances and could have led; the problem was being overrun in the second half by individual quality and France’s bench.",
      "The axis is how far Senegal can cut off service to Haaland. Norway want early crosses and vertical passes; Senegal will use wide thrust and counters to make Norway’s defence run.",
    ],
  },
  "wc-2026-J-jor-dza": {
    ja: [
      "J組の敗者同士。ヨルダンはオーストリアに1-3、アルジェリアはアルゼンチンに0-3で敗れており、ここで負けると突破はかなり遠のく。両チームにとって勝点3が欲しい試合。",
      "ヨルダンは敗れたものの、初のW杯とは思えない勢いを見せた。オルワンの得点、アル・ターマリのスピード、前向きなカウンターはオーストリアをかなり困らせた。ただし、終盤に押し切られたことで、90分を通した守備の集中は課題になる。",
      "アルジェリアはアルゼンチン相手にメッシを止められなかった。守備ラインの間を使われ、個人の質で差を見せつけられた試合だった。ヨルダン戦では、受けに回るだけでなく、自分たちから主導権を取り返す必要がある。",
      "注目は、ヨルダンの速い攻撃とアルジェリアの修正力。ヨルダンは初戦の勢いをそのまま出せればチャンスがあり、アルジェリアは中盤で落ち着きを作れなければ、再び背後を突かれる展開になる。",
    ],
    en: [
      "Two Group J losers meet. Jordan fell 3–1 to Austria and Algeria lost 3–0 to Argentina, so defeat here makes qualification very unlikely. Both sides need three points.",
      "Jordan lost but hardly looked like World Cup debutants. Ali Olwan’s goal, Musa Al-Taamari’s pace and positive counters troubled Austria deeply. Conceding late raises questions about concentration over 90 minutes.",
      "Algeria could not stop Messi against Argentina. Gaps between the defensive lines were exploited and individual quality told. Against Jordan they must seize the initiative rather than only absorb pressure.",
      "Watch Jordan’s fast attacks against Algeria’s ability to reset. If Jordan carry their opener’s momentum they have a chance; if Algeria fail to settle midfield, they risk being picked off in behind again.",
    ],
  },
  "wc-2026-K-prt-uzb": {
    ja: [
      "K組では、ポルトガルがDRコンゴと1-1の引き分け、ウズベキスタンはコロンビアに1-3で敗戦。ポルトガルはここで勝てないと、最終節のコロンビア戦がかなり重くなる。ウズベキスタンも連敗すれば突破は一気に厳しくなる。",
      "ポルトガルは初戦、早い時間に先制しながら試合を決め切れなかった。攻撃のタレントは揃っているが、リード後にテンポが落ち、DRコンゴに流れを渡した。ロナウドにも決定機はあったが、チーム全体として最後の精度を欠いた。",
      "ウズベキスタンは敗れたものの、W杯デビュー戦で初得点を記録した。コロンビア相手に後半はより直接的に攻め、相手を押し下げる時間も作れた。ただし、強豪相手には小さなミスがすぐ失点につながることも痛感した。",
      "この試合は、ポルトガルが格上として試合を早く落ち着かせられるか。ウズベキスタンは守るだけでなく、ファイズラエフ周辺から速く前進し、ポルトガルの背後を突きたい。",
    ],
    en: [
      "In Group K, Portugal drew 1–1 with DR Congo and Uzbekistan lost 3–1 to Colombia. Portugal cannot afford to slip here with Colombia waiting on the final matchday; another Uzbekistan defeat would make qualification very difficult.",
      "Portugal scored early against DR Congo but could not kill the game. The attacking talent is there, yet the tempo dropped after leading and momentum shifted. Cristiano Ronaldo had chances, but collective finishing fell short.",
      "Uzbekistan lost but scored their first World Cup goal on debut. They attacked more directly in the second half against Colombia and pinned opponents back at times, though small errors against top sides quickly become goals conceded.",
      "The axis is whether Portugal settle the game quickly as favourites. Uzbekistan will not only defend — they want to break quickly through Abbosbek Fayzullaev and hit space behind Portugal.",
    ],
  },
  "wc-2026-L-eng-gha": {
    ja: [
      "L組の勝点3同士。イングランドはクロアチアに4-2、ガーナはパナマに1-0で勝利した。勝ったチームはグループ突破に大きく近づき、首位争いでもかなり有利になる。",
      "イングランドは初戦、ケインの2得点に加えて、ベリンガムとラッシュフォードも得点に絡み、攻撃力の高さを見せた。特に後半は前線の圧力が増し、クロアチアを押し切った。一方で、2失点した守備面には不安が残る。",
      "ガーナはパナマ戦で苦しみながらも、後半アディショナルタイムにイレンキイが決勝点を決めた。前半は相手に主導権を握られたが、最後まで耐えて勝ち切った粘りは大きい。イングランド戦では、守備の集中とカウンターの質が問われる。",
      "焦点は、イングランドの攻撃陣をガーナがどこまで抑えられるか。ガーナは低く構える時間が長くなっても、トーマス＝アサンテやサイドの推進力で一気に前へ出る形を狙いたい。",
    ],
    en: [
      "Two Group L sides on three points. England beat Croatia 4–2 and Ghana edged Panama 1–0. The winner moves close to the knockouts and gains a strong hand in the race to top the group.",
      "Harry Kane scored twice and Jude Bellingham and Marcus Rashford also contributed as England’s attack fired. Second-half pressure finished Croatia off, though conceding twice leaves defensive doubts.",
      "Ghana struggled against Panama but Caleb Yirenkyi scored the winner in second-half stoppage time. They absorbed pressure in the first half and showed resilience to see it out — concentration and counter quality will matter against England.",
      "The focus is how far Ghana can limit England’s attack. Even if they sit deep for long spells, they will try to burst forward through Thomas-Asante and wide thrust.",
    ],
  },
  "wc-2026-L-pan-hrv": {
    ja: [
      "L組の敗者同士。パナマはガーナに0-1、クロアチアはイングランドに2-4で敗れており、どちらも勝点3が必要な試合。負けた方は突破争いでかなり追い込まれる。",
      "パナマはガーナ戦で前半に良い時間を作った。ボールを動かしながら相手陣内へ入る場面もあり、内容だけ見れば勝点を取れる可能性はあった。ただ、最後の精度を欠き、終了間際の失点で勝点を失った。",
      "クロアチアはイングランド相手に2度追いつく粘りを見せたが、後半に突き放された。攻撃ではまだ質を出せる一方で、守備の背後と中盤の強度には不安がある。パナマ戦では、経験値を結果に変えなければいけない。",
      "この試合は、クロアチアが落ち着いてボールを握れるかが軸になる。パナマは前から強く入り、クロアチアのビルドアップに圧力をかけて、初のW杯勝利を狙いたい。",
    ],
    en: [
      "Two Group L losers meet. Panama fell 1–0 to Ghana and Croatia lost 4–2 to England, so both need three points. Defeat leaves either side in serious trouble in the qualification race.",
      "Panama had good spells in the first half against Ghana, moved the ball into the final third and could have taken points on performance. They lacked cutting edge and conceded late.",
      "Croatia twice equalised against England but were pulled away in the second half. They still carry attacking quality, yet spaces in behind and midfield strength are concerns. Against Panama they must turn experience into results.",
      "The axis is whether Croatia can calmly control possession. Panama will press high, disrupt build-up and chase a first World Cup win.",
    ],
  },
  "wc-2026-K-col-cod": {
    ja: [
      "K組では、コロンビアがウズベキスタンに3-1で勝利し、首位に立った。DRコンゴはポルトガル相手に1-1で勝点1を獲得。コロンビアが勝てば突破へ大きく前進し、DRコンゴも勝てば一気に上位へ浮上する。",
      "コロンビアは初戦、ルイス・ディアスが1得点1アシストで攻撃を牽引した。前半から主導権を握り、終盤にも追加点を奪って勝ち切った。ただし、後半にウズベキスタンの直接的な攻撃を受けて押し下げられる時間もあった。",
      "DRコンゴはポルトガル相手に歴史的な勝点1を取った。先制されても崩れず、ウィサの同点弾で試合を戻したのは大きい。守備の規律とメンタルの強さは見せたが、攻撃の回数自体はまだ増やしたい。",
      "注目は、コロンビアのサイド攻撃とDRコンゴの守備ブロックのぶつかり合い。コロンビアはディアスを起点に幅を使い、DRコンゴは耐えながらカウンターで一気にスペースを突きたい。",
    ],
    en: [
      "Colombia lead Group K after a 3–1 win over Uzbekistan; DR Congo took a historic point in a 1–1 draw with Portugal. A Colombia win pushes them close to the knockouts; DR Congo can vault up the table with three points.",
      "Luis Díaz scored and assisted as Colombia controlled from the first half and added late goals to win. They were still pushed back at times by Uzbekistan’s direct second-half attacks.",
      "DR Congo’s draw with Portugal was historic. They did not collapse after falling behind and Yoane Wissa’s equaliser showed discipline and mentality. They still want more volume in attack.",
      "Watch Colombia’s wide play against DR Congo’s defensive block. Colombia will use width through Díaz; DR Congo will sit, absorb and counter into space.",
    ],
  },
};

export function hasWcMatchPreview(gameId: string): boolean {
  return gameId in WC_MATCH_PREVIEWS;
}

export function getWcMatchPreview(
  gameId: string,
  language: Language
): readonly string[] | null {
  const copy = WC_MATCH_PREVIEWS[gameId];
  if (!copy) return null;
  if (language === "ja") return copy.ja;
  return copy.en;
}
