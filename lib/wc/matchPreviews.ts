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
  "wc-2026-B-che-can": {
    ja: [
      "B組の最終戦で最も大きな意味を持つのが、スイス対カナダです。両チームともここまで勝点4。カナダは初戦でボスニア・ヘルツェゴビナと1-1で引き分けたあと、2戦目でカタールに6-0と大勝しました。スイスも初戦でカタールと1-1、2戦目でボスニア・ヘルツェゴビナに4-1で勝利。どちらも突破に近い位置にいて、この直接対決はB組首位を決める試合になります。",
      "カナダは勝てばもちろん首位通過。引き分けでもスイスと勝点5で並び、得失点差で上回るため首位通過が決まります。スイスも引き分け以上なら勝点5となり、ラウンド32進出は確定。つまり両チームにとって最低限の目標は勝点1ですが、首位通過を考えるとスイスは勝ちに行く必要があります。",
      "カナダの注目点は、6-0で見せた攻撃の勢いをスイス相手にも出せるかです。ただし、そのカタール戦でイスマエル・コネが負傷しており、中盤の強度や前進力には影響が出ます。ホーム開催国としての勢いはありますが、前がかりになりすぎるとスイスのカウンターや試合運びに飲まれる危険があります。",
      "スイスはボスニア戦で終盤に一気に試合を壊しました。途中出場の若手も結果を出していて、先発だけでなく交代策でも勝負できるチームです。カナダが序盤から勢いで押し込むのか、それともスイスが経験値と守備の安定感で試合を落ち着かせるのか。B組の首位通過、そして決勝トーナメントの山にも影響する重要な一戦です。",
    ],
    en: [
      "The biggest Group B fixture on the final matchday is Switzerland against Canada. Both sit on four points. Canada drew 1–1 with Bosnia and Herzegovina then thrashed Qatar 6–0; Switzerland drew 1–1 with Qatar and beat Bosnia 4–1. Both are close to the knockouts and this head-to-head decides who tops the group.",
      "Canada win and they top the group outright. A draw also sends Canada through on goal difference at five points alongside Switzerland. Switzerland need only a point for five and a round-of-32 place, so both sides want at least one point — but Switzerland must chase the win to top the group.",
      "Canada’s question is whether they can carry the attacking momentum from the 6–0 into this game. Ismaël Koné was injured in the Qatar match, which weakens midfield drive. Home support helps, but overcommitting risks being picked off by Swiss counters and game management.",
      "Switzerland blew the game open late against Bosnia, with substitutes contributing — they can win from the bench as well as the XI. Will Canada push early or will Switzerland settle matters with experience and defensive stability? A pivotal game for the group summit and the knockout bracket.",
    ],
  },
  "wc-2026-B-bih-qat": {
    ja: [
      "この試合は、両チームとも勝利が必要な試合です。ボスニア・ヘルツェゴビナは初戦でカナダと1-1。悪くない入りでしたが、2戦目のスイス戦では1-4で敗れました。カタールも初戦でスイスと1-1と健闘しましたが、2戦目はカナダに0-6で大敗。両チームとも勝点1で最終戦を迎えます。",
      "勝ったチームは勝点4になり、3位通過の可能性を残します。さらに、スイス対カナダで敗者が出れば、そのチームも勝点4で並ぶ可能性があります。つまり単なる3位争いではなく、条件次第では2位争いにも絡む試合です。ただし引き分けなら両チーム勝点2止まりとなり、突破はかなり厳しくなります。",
      "ボスニアはジェコを中心に、前線の高さとフィジカルを使って押し込みたい試合です。スイス戦では終盤に崩れましたが、カナダ戦では先制して勝点1を取っています。内容がまったく悪いわけではなく、勝負どころで耐えられるか、そしてリードした時間をどう管理するかが課題です。",
      "カタールはまず守備の立て直しが必要です。カナダ戦の0-6はかなり重い敗戦で、さらにHomam AhmedとAssim Madiboが退場。Madiboのタックルでカナダのコネが骨折するなど、チームとしても精神的に難しい状況にあります。前半に失点するとまた崩れる可能性があるので、まずは試合を壊さないこと。逆にボスニアは、早い時間に先制できれば一気に優位に立てます。",
    ],
    en: [
      "Both sides need a win. Bosnia and Herzegovina drew 1–1 with Canada in round one but lost 4–1 to Switzerland in round two. Qatar drew 1–1 with Switzerland then were hammered 6–0 by Canada. Both arrive on one point for the final matchday.",
      "The winner reaches four points and keeps third-place hopes alive — and if Switzerland v Canada produces a loser, that side could also finish on four, so this is not only a third-place scrap but potentially a second-place race. A draw leaves both on two and makes advancement very unlikely.",
      "Bosnia will push high through Edin Džeko, using physical presence up front. They collapsed late against Switzerland but scored first against Canada, so the performance is not hopeless — the test is holding firm in key moments and managing a lead.",
      "Qatar must rebuild defensively after the 6–0 loss; Homam Ahmed and Assim Madibo are suspended, and Madibo’s tackle broke Ismaël Koné’s leg, leaving a difficult mood in the camp. Conceding early could trigger another collapse, so staying compact is priority. Bosnia can seize control with an early goal.",
    ],
  },
  "wc-2026-C-sct-bra": {
    ja: [
      "ブラジルはここまでモロッコと1-1、ハイチに3-0。勝点4でグループ首位に立っています。一方のスコットランドはハイチに1-0で勝利したあと、モロッコに0-1で敗戦。勝点3で、まだ突破の可能性は十分にあります。この試合で勝点を取れるかどうかが、スコットランドにとって歴史的な決勝トーナメント進出に直結します。",
      "ブラジルは勝てば突破確定。さらにモロッコの結果を上回る、または同じ結果で終えれば首位通過が見えてきます。ただし、この試合を落とすとスコットランドに勝点で抜かれるため、ブラジルにとっても完全な安全圏ではありません。初戦のモロッコ戦ではやや不安定な部分もありましたが、ハイチ戦ではマテウス・クーニャが2得点、ヴィニシウスも得点して、攻撃面は上向いています。",
      "気になるのはコンディション面です。ラフィーニャはハイチ戦で負傷し、スコットランド戦は欠場見込み。ネイマールは出場可能な状態ですが、アンチェロッティ監督が実際に使うかはまだ読みにくい状況です。決勝トーナメントを見据えながら、どこまで主力を使うかも注目点になります。",
      "スコットランドは、ブラジルにボールを持たれる時間が長くなるのは避けられません。だからこそ、ロバートソン、マクトミネイ、マッギンを中心に、球際、セカンドボール、セットプレーでどこまで対抗できるかが重要です。勝てば2位以内が見える。引き分けでも3位通過争いではかなり大きな勝点1になります。スコットランドにとっては守るだけではなく、どこかで勝負に出る必要がある試合です。",
    ],
    en: [
      "Brazil drew 1–1 with Morocco and beat Haiti 3–0 for four points and the group lead. Scotland beat Haiti 1–0 then lost 1–0 to Morocco, sitting on three with a real path to the knockouts. Points here could decide a historic Scotland appearance in the round of 32.",
      "Brazil win and they are through, and they can top the group depending on Morocco’s result. Lose and Scotland can overtake them on points, so Brazil are not entirely safe. They were slightly uneven against Morocco but Matheus Cunha scored twice and Vinícius Júnior also netted against Haiti — the attack is trending up.",
      "Fitness is the worry. Raphinha is injured after the Haiti game and expected to miss Scotland. Neymar is available but whether Carlo Ancelotti starts him remains unclear as he balances the knockout stage ahead.",
      "Scotland will concede possession to Brazil, so Andy Robertson, Scott McTominay and John McGinn must compete in duels, second balls and set pieces. A win opens second place; even a draw is a valuable point in the third-place race. Scotland cannot only defend — they must take a risk somewhere.",
    ],
  },
  "wc-2026-C-mar-hti": {
    ja: [
      "モロッコはここまでかなり良い位置にいます。初戦でブラジルと1-1、2戦目でスコットランドに1-0で勝利。勝点4で、ハイチに勝てば勝点7となり、ラウンド32進出はほぼ確実です。さらにブラジルがスコットランド戦で勝ち切れなければ、首位通過の可能性もあります。",
      "ただし、モロッコは内容の良さに対して得点数は多くありません。ブラジル戦もスコットランド戦も1得点止まり。守備は安定していますが、相手を押し込んだときにどうやってゴールをこじ開けるかは課題です。特にハイチは敗退が決まっているため、低い位置で守り、カウンターとセットプレーに絞ってくる可能性があります。",
      "ハイチはスコットランドに0-1、ブラジルに0-3で連敗し、すでに敗退が決まっています。ただ、失うものがないチームはやりにくい相手です。ハイチにとっては大会初勝点を狙う試合であり、モロッコが焦れば焦るほど守りやすくなります。",
      "モロッコの注目点は、勝たなければいけない空気の中で冷静に崩せるかです。サイドから単調にクロスを入れるだけになると、ハイチにも耐える時間を与えてしまいます。中央のコンビネーション、ミドルシュート、セットプレーをうまく混ぜながら、早い時間に先制できるか。首位通過まで狙えるモロッコにとって、取りこぼしは避けたい試合です。",
    ],
    en: [
      "Morocco are in a strong position: 1–1 with Brazil and 1–0 over Scotland for four points. Beat Haiti and they reach seven and are virtually through; if Brazil fail to beat Scotland, topping the group is also possible.",
      "Yet Morocco have not scored heavily despite good performances — one goal in each of the Brazil and Scotland games. Defence is stable but breaking down a block when dominating remains the challenge. Haiti are already eliminated and may sit low, counter and lean on set pieces.",
      "Haiti lost 1–0 to Scotland and 3–0 to Brazil and are out, but teams with nothing to lose are awkward. Haiti will chase a first World Cup win; the more Morocco rush, the easier it is to defend.",
      "Morocco must stay calm under pressure to unlock Haiti. Repetitive wide crosses give Haiti time to survive — mix central combinations, shots from distance and set pieces, and score early. A slip-up is costly for a side still eyeing the group summit.",
    ],
  },
  "wc-2026-A-cze-mex": {
    ja: [
      "メキシコはここまで南アフリカに2-0、韓国に1-0で連勝。勝点6で、すでにA組首位通過を決めています。2試合無失点で堅く勝ってきた一方、攻撃面は圧倒的というより効率的。アギーレ監督も韓国戦の内容について改善の余地を認めており、決勝トーナメント前に攻撃の流れをもう少し良くしたい試合でもあります。",
      "一方のチェコは、韓国に1-2で敗れ、南アフリカとは1-1。勝点1で最終戦を迎えます。チェコは勝てば勝点4になり、2位通過の可能性も3位通過の可能性も残ります。韓国が南アフリカに勝てば、チェコは勝利でA組2位に浮上できます。韓国が引き分けた場合は韓国とチェコが勝点4で並びますが、直接対決で韓国がチェコに勝っているため、チェコは3位になります。南アフリカが韓国に勝った場合は、チェコと南アフリカが勝点4で並び、両者の直接対決は1-1なので、得失点差などの勝負になります。",
      "つまりチェコにとっては、単に生き残るためではなく、2位通過まで狙える試合です。メキシコが首位確定でローテーションする可能性があるため、チェコにとってはチャンスもあります。",
      "チェコの武器は高さです。パトリック・シック、トマーシュ・ソウチェク、ラディスラフ・クレイチーを使ったセットプレーやクロスは、メキシコにとって厄介です。メキシコは消化試合のような入り方をすると危険です。チェコは最初から勝ちに来るので、メキシコのローテーション組が試合に入りきれないと、前半から押し込まれる可能性があります。",
    ],
    en: [
      "Mexico have won 2–0 against South Africa and 1–0 against Korea Republic for six points and a secured group summit. Two clean sheets show solidity rather than overwhelming attack, and Javier Aguirre has acknowledged room to improve before the knockouts.",
      "The Czech Republic lost 2–1 to Korea and drew 1–1 with South Africa, arriving on one point. Win and they reach four with second- or third-place chances alive. If Korea beat South Africa, a Czech win takes them second; if Korea draw, Korea finish above the Czechs on head-to-head at four points; if South Africa beat Korea, the Czechs and South Africa could both finish on four with goal difference deciding after their 1–1 draw.",
      "So the Czechs are not only surviving — second place is realistic. Mexico may rotate with qualification secured, which opens a window for the Czechs.",
      "Height is the Czech weapon: Patrik Schick, Tomáš Souček and Ladislav Krejčí on set pieces and crosses trouble Mexico. A casual approach from Mexico is risky; the Czechs will come to win, and if a rotated side fails to settle they could be pinned back early.",
    ],
  },
  "wc-2026-A-zaf-kor": {
    ja: [
      "この試合は、A組の2位争いに大きく関わる直接対決です。韓国はチェコに2-1で勝利し、メキシコには0-1で敗戦。勝点3で最終戦を迎えます。南アフリカはメキシコに0-2で敗れ、チェコとは1-1。勝点1なので、突破のためには勝利が必要です。",
      "韓国は勝てば勝点6で2位通過が確定します。引き分けでも勝点4になり、チェコがメキシコに勝って勝点4で並んだとしても、直接対決で韓国がチェコに勝っているため、2位を守れます。つまり韓国は引き分け以上で2位通過です。",
      "南アフリカは勝てば勝点4になり、突破の可能性を残します。ただし、勝てば無条件で2位確定ではありません。チェコがメキシコに勝つと、南アフリカとチェコが勝点4で並びます。両者の直接対決は1-1なので、その場合は得失点差などで順位が決まります。だから南アフリカは、ただ勝つだけでなく、できれば得失点差も意識したい試合になります。",
      "韓国は引き分けでもいい立場ですが、受けに回りすぎると危険です。南アフリカは勝つしかないため、どこかで必ずリスクをかけてきます。韓国としては、守るだけではなく、相手が前に出てきたところをカウンターで仕留めたい試合です。",
      "南アフリカは初戦のメキシコ戦で守備的に入りすぎましたが、チェコ戦では後半に攻撃の人数を増やして改善しました。ただし、テボホ・モコエナが累積警告で出場停止、テンバ・ズワネも出場停止。中盤の質と経験が落ちるのは大きな不安です。状況は韓国が有利ですが、南アフリカが後半に勝負をかける展開になれば、試合は一気にオープンになる可能性があります。",
    ],
    en: [
      "A direct Group A clash that shapes the race for second. Korea Republic beat the Czech Republic 2–1 and lost 1–0 to Mexico, sitting on three points. South Africa lost 2–0 to Mexico and drew 1–1 with the Czechs on one point — they need a win to stay alive.",
      "Korea win and they finish second on six points. A draw also secures second on four even if the Czechs beat Mexico, thanks to head-to-head superiority over the Czechs. In short, a point is enough for Korea to advance in second.",
      "South Africa win and they reach four with a path through, but not automatically second. If the Czechs beat Mexico, South Africa and the Czechs both finish on four and goal difference decides after their 1–1 draw — so South Africa want goals as well as the win.",
      "Korea can afford a draw but sitting too deep is dangerous. South Africa must gamble somewhere; Korea should punish transitions when opponents push forward rather than only defending.",
      "South Africa were too defensive against Mexico but added numbers in attack late against the Czechs. Teboho Mokoena and Themba Zwane are suspended, weakening midfield quality and experience. Korea hold the edge, but if South Africa throw caution away in the second half the game could open up quickly.",
    ],
  },
  "wc-2026-E-ecu-deu": {
    ja: [
      "ドイツはここまでキュラソーに7-1、コートジボワールに2-1で連勝。勝点6で、すでにE組首位通過を決めています。今大会は同勝点の場合に直接対決が得失点差より優先されるため、最終戦でドイツが敗れ、コートジボワールが勝って勝点6で並んでも、直接対決で勝っているドイツが上に立ちます。",
      "そのためドイツにとって、この試合は順位をかけた試合ではありません。ただし、完全な消化試合でもありません。決勝トーナメントに向けて強度を落とさず、ここまでの流れを維持できるかがテーマになります。ドイツは大会前から含めて連勝を続けており、ナーゲルスマン監督としても、勝ち癖を切らさずにラウンド32へ入りたい試合です。",
      "一方のエクアドルはかなり苦しい状況です。初戦でコートジボワールに0-1で敗れ、2戦目はキュラソーと0-0。南米予選2位、19試合無敗で大会に入ったチームが、ここまで2試合無得点です。突破のためには、まずドイツに勝って勝点4にする必要があります。ただし、コートジボワールがキュラソーに引き分け以上なら、エクアドルは直接対決でコートジボワールに敗れているため2位には届きません。その場合は3位通過争いに回ります。2位を狙うには、エクアドルが勝ち、かつコートジボワールが敗れる展開が必要です。",
      "注目点は、エクアドルがどこまで前に出るかです。勝利が必要な試合ですが、無理にラインを上げるとドイツのカウンターを受けます。逆に慎重になりすぎると、ここまでの2試合と同じように得点が遠くなります。ドイツはニコ・シュロッターベックが足首の負傷で大会終了となり、アントニオ・リュディガーがジョナタン・ターと組む見込みです。首位通過が決まっているドイツにとっては、守備ラインの再確認もこの試合の大きなポイントになります。",
    ],
    en: [
      "Germany have beaten Curaçao 7–1 and Côte d’Ivoire 2–1 for six points and a secured Group E summit. At this tournament, head-to-head record beats goal difference on equal points — so even if Germany lose here and Côte d’Ivoire win to finish level on six, Germany stay above them on the direct result.",
      "So this is not a game about table position for Germany, but not a pure dead rubber either. The theme is maintaining intensity and momentum into the knockouts without dropping off. Germany have been winning through the pre-tournament run and Julian Nagelsmann will want that habit intact heading into the round of 32.",
      "Ecuador are in a tough spot: 0–1 to Côte d’Ivoire and 0–0 with Curaçao, goalless in two games after arriving unbeaten through 19 qualifiers. They must beat Germany to reach four points, but if Côte d’Ivoire draw or beat Curaçao, Ecuador cannot finish second on head-to-head. Second place needs an Ecuador win plus a Côte d’Ivoire defeat.",
      "Watch how far Ecuador push forward. They need a win but a high line invites German counters; too cautious and goals stay distant as in the first two games. Nico Schlotterbeck is out with an ankle injury, with Antonio Rüdiger expected to partner Jonathan Tah — a chance for Germany to reset the back line even with qualification secured.",
    ],
  },
  "wc-2026-E-cuw-civ": {
    ja: [
      "コートジボワールは初戦でエクアドルに1-0で勝利し、2戦目ではドイツ相手に先制しながら1-2で逆転負け。勝点3で最終戦を迎えます。ドイツの首位通過が決まっているため、この試合の最大のテーマはコートジボワールが2位を確定できるかどうかです。",
      "コートジボワールは引き分け以上で2位通過が決まります。仮にエクアドルがドイツに勝って勝点4で並んでも、コートジボワールは直接対決でエクアドルに勝っているため上に立ちます。つまり、この試合で最低限必要なのは勝点1です。ただし、負けると勝点3のままになり、エクアドルがドイツに勝てば2位から落ちるため、完全に守りに入れる状況ではありません。",
      "キュラソーは初戦でドイツに1-7と大敗しましたが、2戦目ではエクアドルを0-0で止めました。大会最小国としての出場で、初戦は力の差を見せられましたが、2戦目で守備を立て直したことは評価できます。37歳GKエロイ・ルームの好守もあり、簡単には崩れないチームに修正してきました。",
      "この試合のポイントは、コートジボワールが主導権を握る側で冷静に戦えるかです。ドイツ戦のように格上へ挑む試合ではなく、今度は勝ち切る、あるいは最低でも引き分けで終えることを求められる試合になります。キュラソーは低く守って、カウンターとセットプレーでワンチャンスを狙うはずです。コートジボワールは早い時間に点を取れないと、時間の経過とともに焦りが出る可能性があります。",
    ],
    en: [
      "Côte d’Ivoire beat Ecuador 1–0 then led Germany before losing 2–1, arriving on three points. With Germany’s summit secured, the main theme is whether Côte d’Ivoire can lock in second place.",
      "A draw is enough for second. Even if Ecuador beat Germany to finish level on four, Côte d’Ivoire win the head-to-head. So one point is the minimum — but defeat leaves them on three and vulnerable if Ecuador beat Germany, so they cannot sit in a pure low block.",
      "Curaçao lost 7–1 to Germany but held Ecuador 0–0 in round two. The smallest nation at the tournament were overpowered in the opener but rebuilt defensively, with 37-year-old goalkeeper Eloy Room in strong form.",
      "The axis is whether Côte d’Ivoire control the game calmly as favourites. Unlike chasing Germany, they must win or at least draw. Curaçao will sit deep and hunt one chance on counters and set pieces; if Côte d’Ivoire fail to score early, nerves may grow as time passes.",
    ],
  },
  "wc-2026-F-tun-nld": {
    ja: [
      "オランダは初戦で日本と2-2で引き分けたあと、2戦目でスウェーデンに5-1と大勝しました。勝点4、得失点差+4で日本と並んでいますが、総得点で日本を上回ってF組首位に立っています。チュニジア戦で勝てば突破は確定。首位通過については、日本対スウェーデンの結果と得失点差、総得点次第になります。",
      "チュニジアはスウェーデンに1-5、日本に0-4。2試合で9失点し、すでに敗退が決まっています。途中でエルベ・ルナール監督が入ったものの、日本戦でも守備の立て直しはできませんでした。失うものはない状態なので、最後に意地を見せる試合になりますが、守備の不安はかなり大きいです。",
      "オランダの注目点は、どこまで得点を取りに行くかです。日本と首位を争う可能性があるため、ただ勝つだけでなく、点差や総得点も重要になります。スウェーデン戦ではブライアン・ブロビーが2得点し、CFとして大きくアピールしました。一方で、メンフィス・デパイは太ももの問題でまだ先発しておらず、コンディション管理が続いています。",
      "オランダにとっては、勝ち方まで問われる試合です。早い時間に先制できれば大量得点の流れも作れますが、チュニジアに0-0の時間を長く与えると、試合は少し重くなります。決勝トーナメントを見据えた主力管理と、首位通過を狙うための得点ペース。そのバランスがこの試合の見どころになります。",
    ],
    en: [
      "The Netherlands drew 2–2 with Japan then thrashed Sweden 5–1 for four points and +4 goal difference. They lead Group F on goals scored over Japan. Beat Tunisia and they are through; topping the group depends on Japan v Sweden plus goal difference and goals scored.",
      "Tunisia lost 5–1 to Sweden and 4–0 to Japan, conceding nine in two games and already eliminated. Hervé Renard took over mid-tournament but the defence did not recover against Japan. They have nothing to lose but the defensive doubts are severe.",
      "The Netherlands must decide how hard to chase goals. With Japan competing for first, margin and goals scored matter as well as the win. Brian Brobbey scored twice against Sweden; Memphis Depay has yet to start due to a thigh issue and fitness management continues.",
      "How they win matters. An early lead can open a rout; a long 0–0 makes the game heavy. Balancing squad management for the knockouts against the scoring pace needed to top the group is the story here.",
    ],
  },
  "wc-2026-F-jpn-swe": {
    ja: [
      "日本は初戦でオランダと2-2、2戦目でチュニジアに4-0。勝点4、得失点差+4でオランダと並んでいます。スウェーデン戦は、引き分け以上で2位以内が確定します。日本が引き分ければ勝点5となり、スウェーデンは勝点4止まり。チュニジアはすでに敗退しているため、日本は少なくとも2位以内に入ります。勝てば突破確定で、オランダの結果次第では首位通過も狙えます。",
      "スウェーデンは初戦でチュニジアに5-1と大勝しましたが、2戦目ではオランダに1-5で大敗しました。攻撃力と守備の不安定さが、はっきり出た2試合です。勝点3なので、日本に勝てば勝点6となり、2位以内での突破が決まります。一方で、引き分けだと勝点4で3位に回り、3位上位枠に入れるかを待つ形になります。",
      "日本の最大のポイントは、アレクサンデル・イサクとヴィクトル・ギェケレシュの2トップをどう抑えるかです。単純な高さだけではなく、裏抜け、ポストプレー、セカンドボール回収があり、CBだけで完結する守備では対応しきれません。中盤の戻り、奪われた直後の切り替え、サイドからのクロス対応が重要になります。",
      "日本は森保監督がここまで26人中22人を起用しており、ローテーションの幅も見せています。チュニジア戦では攻撃面の形も良く、得点力にも手応えがありました。ただ、スウェーデンは前線の個の力が強く、日本がボールを持てていても、一発でゴール前まで運ばれる怖さがあります。",
      "この試合は、F組で最も重い直接対決です。日本は引き分け以上で2位以内が決まる一方、スウェーデンは勝たないと2位以内が厳しい。日本が試合をコントロールするのか、スウェーデンが前線の破壊力で流れを変えるのか。先制点の意味がかなり大きい試合になります。",
    ],
    en: [
      "Japan drew 2–2 with the Netherlands and beat Tunisia 4–0 for four points and +4 goal difference alongside the Dutch. A draw against Sweden secures a top-two finish — Japan would reach five while Sweden stay on four with Tunisia eliminated. Win and Japan are through, with first place still possible depending on the Netherlands.",
      "Sweden thrashed Tunisia 5–1 but lost 5–1 to the Netherlands, showing both firepower and defensive fragility. On three points, they need a win for six and a guaranteed top-two place; a draw leaves them third and waiting on the best-third-place race.",
      "Japan’s biggest task is containing Alexander Isak and Viktor Gyökeres. It is not only height — runs in behind, hold-up play and second balls mean centre-backs alone cannot solve it. Midfield recovery, immediate transitions after losing the ball and wide defending against crosses will be critical.",
      "Hajime Moriyasu has used 22 of 26 players, showing rotation depth. Tunisia brought good attacking shape and scoring confidence, but Sweden’s front line can reach the box in one move even when Japan have the ball.",
      "Group F’s heaviest head-to-head: Japan need only a point for the top two while Sweden must win. Will Japan control the tempo or will Sweden’s strikers swing it? The first goal carries enormous weight.",
    ],
  },
  "wc-2026-D-tur-usa": {
    ja: [
      "アメリカは初戦でパラグアイに4-1、2戦目でオーストラリアに2-0で勝利。勝点6で、すでにD組首位通過を決めています。トルコはオーストラリアに0-2、パラグアイに0-1で連敗し、無得点のまま敗退が決定しました。今大会の直接対決優先ルールの影響もあり、この試合は組の順位に大きな影響を与えないカードになっています。",
      "ただ、アメリカにとって意味がない試合ではありません。決勝トーナメントに向けて、勢いを維持しながら、出場停止リスクと負傷リスクを避けることがテーマになります。バログン、タイラー・アダムス、クリス・リチャーズ、アントニー・ロビンソンが警告を抱えており、ポチェッティーノ監督は主力を休ませる可能性があります。クリスチャン・プリシッチもふくらはぎの問題から復帰途上で、無理をさせるかどうかは慎重に判断されるはずです。",
      "トルコは大会初得点と初勝点を狙う試合です。若いチームとして期待されていましたが、ここまで2試合無得点で敗退。最後にどれだけ前向きな内容を残せるかがテーマになります。アメリカがローテーションするなら、トルコにもチャンスはあります。",
      "一方で、アメリカの控え組にとってもこの試合はアピールの場です。主力が休んでも強度が落ちるとは限りません。アメリカは2002年大会で、すでに突破に近い状況からポーランドに敗れた経験もあり、消化試合のような入り方は避けたいはずです。トルコが意地を見せるのか、アメリカが首位通過チームらしく締めるのか。順位以上に、決勝トーナメントへ入る空気を左右する試合です。",
    ],
    en: [
      "The United States beat Paraguay 4–1 and Australia 2–0 for six points and a secured Group D summit. Turkey lost 0–2 to Australia and 0–1 to Paraguay, goalless and eliminated. With head-to-head prioritised at this tournament, the fixture barely shifts the table.",
      "It is not meaningless for the US. The theme is keeping momentum while avoiding suspensions and injuries. Folarin Balogun, Tyler Adams, Chris Richards and Antonee Robinson are on yellow cards and Mauricio Pochettino may rest key players. Christian Pulisic is still returning from a calf issue and minutes will be managed carefully.",
      "Turkey chase a first World Cup goal and win. A young side arrived with expectation but leave goalless; the question is what positive impression they can leave. US rotation could open a window.",
      "US substitutes also want to impress — depth does not guarantee a drop in intensity. The US remember losing to Poland in 2002 when already close to advancing and will avoid a casual start. Turkey’s pride against a group winner setting knockout tone is the subplot beyond the table.",
    ],
  },
  "wc-2026-D-pry-aus": {
    ja: [
      "D組で最も重要なのが、パラグアイ対オーストラリアです。オーストラリアは初戦でトルコに2-0で勝利したあと、アメリカに0-2で敗戦。パラグアイは初戦でアメリカに1-4と大敗しましたが、2戦目でトルコに1-0で勝利しました。両チームとも勝点3で最終戦を迎えます。",
      "この試合は、実質的なD組2位決定戦です。オーストラリアは引き分けで2位通過が決まります。引き分けなら両チーム勝点4で並び、直接対決も引き分けになりますが、得失点差でオーストラリアが上に立ちます。現状の得失点差はオーストラリアが0、パラグアイが-2で、引き分けならこの差は変わりません。",
      "一方のパラグアイは、2位通過を狙うなら勝利が必要です。引き分けなら勝点4で3位となり、3位上位8チームに入れるかを待つ形になります。負けると勝点3のままで、突破はかなり苦しくなります。状況としてはオーストラリアが有利ですが、パラグアイには勝つしかない明確さがあります。",
      "パラグアイはトルコ戦で10人になりながら1-0で勝ち切りました。粘り強さは見せましたが、ミゲル・アルミロンが退場処分を受け、このオーストラリア戦には出場できません。攻撃の推進力をどう補うかは大きな課題です。アルミロン不在で、パラグアイがどれだけ前に出られるかが試合の流れを左右します。",
      "オーストラリアはアメリカ戦で前半に崩れ、メンバー選択にも批判が出ました。ネストリ・イランクンダやコナー・メトカーフをどう使うかは注目点です。引き分けでいい状況ですが、最初から守りに入るとパラグアイの球際と勢いに押し込まれる可能性があります。",
      "この試合のポイントは、オーストラリアが引き分けでいい立場をどう使うかです。受け身になりすぎると危ない。逆に、パラグアイが前に出てきたところをカウンターで仕留められれば、一気に試合を決められます。パラグアイは後半にリスクを上げる展開になるはずなので、その時間帯をどう耐えるか、あるいはどう突くかが最大の見どころになります。",
    ],
    en: [
      "The biggest Group D fixture is Paraguay v Australia. Australia beat Turkey 2–0 then lost 2–0 to the US; Paraguay lost 4–1 to the US but beat Turkey 1–0. Both arrive on three points.",
      "This is effectively the Group D runner-up decider. Australia advance in second with a draw — both would finish on four with a head-to-head draw, but Australia’s superior goal difference (+0 v −2) keeps them above Paraguay.",
      "Paraguay need a win to chase second. A draw leaves them third on four and waiting on the best-third-place slots; defeat on three makes advancement very unlikely. Australia hold the advantage but Paraguay’s task is clear.",
      "Paraguay won 1–0 against Turkey with ten men, showing grit, but Miguel Almirón is suspended after a red card. Replacing his drive in attack is a major problem — how far Paraguay push without him shapes the game.",
      "Australia collapsed early against the US and faced selection criticism. How Graham Arnold uses Nestory Irankunda and Connor Metcalfe is worth watching. A draw suits them but sitting in from the start risks being overrun by Paraguay’s duels and momentum.",
      "The axis is how Australia use a favourable draw position. Sitting too deep is dangerous; counters when Paraguay push can settle the match. Paraguay will raise risk in the second half — how Australia survive or strike in that phase is the key watch.",
    ],
  },
  "wc-2026-I-nor-fra": {
    ja: [
      "I組の最終戦で最も注目されるのが、ノルウェー対フランスです。両チームともここまで2連勝で勝点6。すでにラウンド32進出は決めていますが、この試合はI組の首位を決める直接対決になります。",
      "フランスは初戦でセネガルに3-1、2戦目でイラクに3-0で勝利。ムバッペがイラク戦で2得点し、今大会でも中心として存在感を見せています。デンベレも得点に絡み、オリーズ、バルコラ、ドゥエなど周囲の攻撃陣も厚い。過去2大会で決勝に進んだチームらしく、個人能力だけでなく、前線の選択肢の多さが大きな強みです。",
      "ノルウェーはイラクに4-1、セネガルに3-2で勝利。ハーランドが2試合連続2得点で、ここまで4得点。ノルウェーとしては久々のW杯で決勝トーナメント進出を決め、勢いはかなりあります。ただ、2試合で3失点しているため、守備面にはまだ不安があります。",
      "この試合は、勝った方が首位通過です。引き分けの場合は、直接対決も引き分けとなるため得失点差に進みます。現時点でフランスは得失点差+5、ノルウェーは+4なので、引き分けならフランスが首位通過になります。つまりノルウェーは首位を取るには勝利が必要です。",
      "注目点は、ノルウェーがハーランドまでどうボールを届けるかです。フランス相手に押し込まれる時間が長くなると、ハーランドが孤立する可能性があります。一方のフランスは、無理に勝ちに行かなくても首位を取れる立場です。主力をどこまで使うか、試合をどこまで管理するかも見どころになります。ムバッペ対ハーランドという構図だけでなく、チームとしての完成度の差も見える一戦です。",
    ],
    en: [
      "The headline Group I final matchday fixture is Norway v France. Both have won twice for six points and are already through, but this head-to-head decides who tops the group.",
      "France beat Senegal 3–1 and Iraq 3–0. Kylian Mbappé scored twice against Iraq and remains the focal point, with Ousmane Dembélé among the scorers and depth around Bradley Barcola and Warren Zaïre-Emery. Like a side that reached the last two finals, their strength is options up front as much as individual quality.",
      "Norway beat Iraq 4–1 and Senegal 3–2. Erling Haaland has scored twice in both games for four goals total. Momentum is strong after ending a long World Cup drought, but three conceded in two games leave defensive doubts.",
      "The winner tops the group. A draw goes to goal difference — France are +5 and Norway +4, so France would finish first on a draw. Norway need a win for the summit.",
      "Watch how Norway feed Haaland. Long spells pinned back could isolate him. France can top the group without forcing the issue — how many starters they use and how they manage the game matters. Beyond Mbappé v Haaland, this may expose the gap in team completeness.",
    ],
  },
  "wc-2026-I-sen-irq": {
    ja: [
      "セネガルとイラクは、どちらもここまで2連敗です。セネガルはフランスに1-3、ノルウェーに2-3で敗戦。イラクはノルウェーに1-4、フランスに0-3で敗れました。両チームとも勝点0ですが、3位上位8チームが突破できる大会形式のため、まだ完全に終わったわけではありません。",
      "この試合は、勝った方だけが3位通過争いに残る試合です。勝てば勝点3。2位以内はすでにフランスとノルウェーが決めているため届きませんが、3位上位枠に入る可能性は残ります。逆に引き分け以下なら、勝点1以下となり、突破はかなり厳しくなります。",
      "セネガルは2試合とも敗れていますが、ノルウェー戦では3-2まで持ち込みました。攻撃面では可能性を見せています。ただ、フランス戦でもノルウェー戦でも守備のミスが失点に直結しており、クーリバリを中心とした守備陣がどこまで立て直せるかが重要になります。勝利が必要な試合なので前に出る必要はありますが、リスク管理を間違えるとまた失点が重くなります。",
      "イラクは初戦でハーランド、2戦目でムバッペと、世界トップクラスのストライカーに連続でやられました。相手が強かったとはいえ、2試合で7失点は重いです。ただ、セネガル戦はフランスやノルウェーほど一方的に押し込まれる試合ではないはずです。守るだけでは勝点3に届かないため、どこかで攻撃に人数をかける必要があります。",
      "この試合は、どちらが先にメンタルを立て直せるかです。戦力的にはセネガルが上ですが、2連敗の流れを引きずると危ない。イラクは守備を整えながら、少ないチャンスを決め切る必要があります。勝った方だけが3位通過の可能性を残す、かなりはっきりした試合です。",
    ],
    en: [
      "Senegal and Iraq have both lost twice. Senegal fell 3–1 to France and 3–2 to Norway; Iraq lost 4–1 to Norway and 3–0 to France. Both are on zero points, but with eight best third-placed teams advancing, neither is fully out.",
      "Only the winner stays alive in the third-place race. Three points are enough for a best-third-place shot — second is already settled by France and Norway. A draw or defeat leaves one point or fewer and makes advancement very unlikely.",
      "Senegal lost both games but pushed Norway to 3–2, showing attacking potential. Defensive errors cost them against France and Norway; Kalidou Koulibaly’s back line must stabilise. They must push forward for a win but poor risk management could mean more costly concessions.",
      "Iraq faced Haaland then Mbappé and conceded seven in two — understandable opponents, but heavy. Senegal should be less one-sided than France or Norway; sitting back will not deliver three points, so they must commit numbers forward at some stage.",
      "The axis is who resets mentally first. Senegal are stronger on paper but two defeats carry weight. Iraq must organise defensively and finish sparse chances. A clear knockout for third-place hopes.",
    ],
  },
  "wc-2026-H-ury-esp": {
    ja: [
      "H組はまだ複雑です。スペインはカーボベルデと0-0、サウジアラビアに4-0で勝利して勝点4。ウルグアイはサウジアラビアと1-1、カーボベルデと2-2で勝点2。スペインは引き分け以上で2位以内が確定し、勝てば首位通過に大きく近づきます。一方のウルグアイは勝てば勝点5となり、2位以内が確定します。",
      "スペインは初戦のカーボベルデ戦では崩し切れず、かなり重い入りになりました。ただ、2戦目のサウジアラビア戦では4-0で快勝。初戦で見えた停滞感をどこまで払拭できているかを確認する試合でもあります。ボール保持で主導権を握れるチームですが、相手が強度高く前から来たときに、どれだけテンポよく剥がせるかがポイントになります。",
      "ウルグアイはここまで2試合とも引き分けです。サウジアラビア戦もカーボベルデ戦も、勝ち切れなかったことが響いています。ビエルサ監督のチームらしく、前からの圧力と運動量はありますが、試合を支配しても勝点3に変え切れていません。スペイン相手には、ただ激しく行くだけでなく、奪った後の質が必要になります。",
      "この試合の注目点は、スペインの保持に対して、ウルグアイがどこまで圧力をかけられるかです。スペインがテンポよくボールを動かせば、ウルグアイは走らされる時間が長くなります。逆にウルグアイが前線からはめ込めれば、スペインの若いサイドや中盤にプレッシャーをかけられます。スペインにとっては2位以内を確定させる試合。ウルグアイにとっては、勝って自力で突破を決めたい試合です。",
    ],
    en: [
      "Group H remains complicated. Spain drew 0–0 with Cape Verde and beat Saudi Arabia 4–0 for four points; Uruguay drew 1–1 with Saudi Arabia and 2–2 with Cape Verde on two. Spain secure a top-two finish with a point and move close to first with a win; Uruguay reach five and guarantee the top two with victory.",
      "Spain could not break down Cape Verde in a heavy opener but thrashed Saudi Arabia 4–0 in round two — a chance to show how much of that sluggish start is gone. They dominate possession but must unpick high pressing at tempo when opponents step forward.",
      "Uruguay have drawn both games, failing to convert control into three points against Saudi Arabia and Cape Verde. Marcelo Bielsa’s side press and run hard but need quality after winning the ball against Spain, not only intensity.",
      "Watch how far Uruguay can press Spain’s possession. Quick Spanish circulation forces long running spells; trap Spain high and Uruguay can stress young full-backs and midfield. Spain want to lock up the top two; Uruguay want to qualify on their own terms with a win.",
    ],
  },
  "wc-2026-H-cpv-sau": {
    ja: [
      "カーボベルデは初出場ながら、ここまで大きな存在感を見せています。初戦でスペインと0-0、2戦目でウルグアイと2-2。勝点2で最終戦を迎えます。サウジアラビアはウルグアイと1-1で引き分けたあと、スペインに0-4で敗戦。勝点1で、突破のためには勝利が必要です。",
      "カーボベルデは勝てば勝点5となり、2位以内が確定します。スペイン対ウルグアイの結果に関係なく、少なくとも2位以内に入れるため、自力で突破を決められる試合です。引き分けでも勝点3となり、3位通過の可能性は残りますが、他会場の結果待ちになります。",
      "サウジアラビアは勝てば勝点4。スペイン対ウルグアイの結果次第で、2位通過の可能性も3位通過の可能性も残ります。特にスペインがウルグアイに勝つ、またはスペインとウルグアイが引き分ける場合、サウジアラビアが勝てば2位に入れる可能性があります。ただし、ウルグアイがスペインに勝つと、スペインとサウジアラビアが勝点4で並びます。その場合は直接対決でスペインがサウジアラビアに勝っているため、サウジアラビアは3位になります。",
      "この試合は、カーボベルデが夢を現実に変えられるかがテーマです。初出場でスペインとウルグアイから勝点を取った流れは大きいですが、最後に勝ち切れるかは別の話です。サウジアラビアは勝つしかないため、試合は徐々にオープンになる可能性があります。",
      "カーボベルデは冷静に守りながら、カウンターを刺せるか。サウジアラビアはスペイン戦の0-4から立て直し、前に出ながらも守備のバランスを崩さずに戦えるか。H組の2位争い、3位争いに直結する試合です。",
    ],
    en: [
      "Debutants Cape Verde have made a major impact: 0–0 with Spain and 2–2 with Uruguay for two points. Saudi Arabia drew 1–1 with Uruguay then lost 4–0 to Spain on one point and need a win to stay alive.",
      "Cape Verde win and they reach five and secure a top-two finish regardless of Spain v Uruguay — qualification in their own hands. A draw takes them to three and leaves third-place hopes dependent on other results.",
      "Saudi Arabia win and they reach four with second- or third-place chances depending on Spain v Uruguay. If Spain beat or draw Uruguay, a Saudi win could mean second; if Uruguay beat Spain, Saudi finish third on head-to-head behind Spain at four points.",
      "Can Cape Verde turn the dream into reality? Points off Spain and Uruguay are historic, but finishing the job is another step. Saudi must attack and the game may open up over time.",
      "Cape Verde need calm defending and sharp counters; Saudi must rebuild after the 4–0 loss and push without losing defensive balance. Directly shapes the Group H race for second and third.",
    ],
  },
  "wc-2026-G-nzl-bel": {
    ja: [
      "G組は4チームすべてに突破の可能性が残っています。ニュージーランドは初戦でイランと2-2、2戦目でエジプトに1-3で敗れて勝点1。ベルギーはエジプトと1-1、イランと0-0で勝点2。どちらも勝利が必要な試合ですが、特にベルギーにとっては、勝てば2位以内が確定する試合です。",
      "ベルギーは勝てば勝点5となり、エジプト対イランの結果に関係なく、少なくとも2位以内に入ります。ただし、引き分けだと勝点3で、他会場の結果待ちになります。負ければ勝点2のままで、突破はかなり厳しくなります。タレントを考えれば、ここまで2試合で1得点というのはかなり物足りない内容です。",
      "ベルギーはエジプト戦で1-1、イラン戦で0-0。主導権を握る時間はありましたが、最後の決定力が足りていません。イラン戦ではナタン・ヌゴイが退場しており、守備面の調整も必要になります。攻撃陣のタレント差はありますが、ここまでの2試合を見る限り、簡単に勝ち切れる保証はありません。",
      "ニュージーランドはイラン戦で2得点し、攻撃面では可能性を見せました。エジプト戦でも先制しましたが、後半に逆転されて1-3で敗戦。勝ち切る、守り切るという部分に課題があります。ベルギー相手にボールを持たれる時間は長くなるはずなので、守備の集中とカウンターの精度が重要になります。",
      "ニュージーランドも勝てば勝点4となり、突破の可能性を大きく残します。エジプトがイランに勝つ、またはエジプトとイランが引き分ける場合、ニュージーランドは勝利で2位に入れる可能性があります。ただし、イランがエジプトに勝った場合は、エジプトとニュージーランドが勝点4で並び、直接対決でエジプトがニュージーランドに勝っているため、ニュージーランドは3位になります。",
      "この試合は、ベルギーが実力通りに押し切れるかが最大のテーマです。ベルギーは勝てば2位以内確定。ニュージーランドは勝てば生き残る。状況としてはベルギーが有利ですが、ここまでの停滞を考えると、早い時間に点を取れないと試合は重くなります。",
    ],
    en: [
      "All four Group G teams can still advance. New Zealand drew 2–2 with Iran and lost 3–1 to Egypt on one point; Belgium drew 1–1 with Egypt and 0–0 with Iran on two. Both need a win, but Belgium secure a top-two finish with victory.",
      "Belgium win and they reach five and are at least second regardless of Egypt v Iran. A draw leaves them on three waiting on other results; defeat on two makes advancement very hard. One goal in two games is underwhelming for their talent.",
      "Belgium drew 1–1 with Egypt and 0–0 with Iran, controlling spells without enough cutting edge. Nathan Ngoy’s red against Iran forces defensive reshuffling. Attack looks stronger on paper but two games offer no guarantee of an easy win.",
      "New Zealand scored twice against Iran and led Egypt before a 3–1 reverse — finishing and protecting leads remain issues. They will concede possession to Belgium and need concentration and counter precision.",
      "A New Zealand win reaches four with advancement chances — they could finish second if Egypt beat or draw Iran, but lose the head-to-head to Egypt if Iran beat Egypt and both finish on four.",
      "The theme is whether Belgium finally impose their quality. Belgium win and the top two are secured; New Zealand win and they survive. Belgium are favourites but slow starts could make the game heavy.",
    ],
  },
  "wc-2026-G-egy-irn": {
    ja: [
      "G組のもう一つの試合、エジプト対イランもかなり重要です。エジプトはベルギーと1-1、ニュージーランドに3-1で勝利して勝点4。G組首位に立っています。イランはニュージーランドと2-2、ベルギーと0-0で勝点2。エジプトは引き分け以上で2位以内が確定し、勝てば首位通過が決まります。イランは勝てば勝点5となり、自力で突破できます。",
      "エジプトはニュージーランド戦でW杯初勝利を挙げました。サラーが得点とアシストで違いを作り、後半に試合をひっくり返しました。初戦のベルギー戦でも勝点1を取っており、ここまでの内容はかなり安定しています。サラーへの依存はありますが、ジコやトレゼゲも絡み、攻撃に複数のルートが出てきたことは大きいです。",
      "イランはここまで負けていません。ニュージーランド戦では2-2、ベルギー戦では0-0。特にベルギー戦ではGKベイランヴァンドの好守もあり、強豪相手に勝点1を取りました。守備の粘りはある一方で、勝たなければ2位以内が難しくなるため、この試合ではどこかで前に出る必要があります。",
      "この試合のポイントは、エジプトが引き分けでもいい状況をどう使うかです。無理に前に出る必要はありませんが、受けに回りすぎるとイランの勢いを助けます。イランは守備の粘りを保ちながら、どのタイミングで勝負をかけるか。エジプトはサラーを中心に、相手が前に出た裏を突けるか。",
      "G組は4チームすべてに可能性があるため、この試合の結果はニュージーランド対ベルギーにも大きく影響します。エジプトは勝てば首位通過。イランは勝てば自力突破。引き分けならエジプトは突破確定、イランは他会場次第。状況はエジプトが有利ですが、イランの守備の粘りを考えると、簡単な試合にはなりません。",
    ],
    en: [
      "Egypt v Iran is equally pivotal in Group G. Egypt drew 1–1 with Belgium and beat New Zealand 3–1 to lead on four points; Iran drew 2–2 with New Zealand and 0–0 with Belgium on two. Egypt secure the top two with a point and clinch first with a win; Iran reach five and qualify outright with victory.",
      "Egypt earned their first World Cup win against New Zealand as Mohamed Salah scored and assisted in a second-half turnaround. A point off Belgium in the opener makes their run stable. Salah remains central but Jiko and David Trezeguet add routes beyond him.",
      "Iran are unbeaten: 2–2 with New Zealand and 0–0 with Belgium, with Alireza Beiranvand strong against the Belgians. They defend stubbornly but must push forward somewhere to reach the top two.",
      "The axis is how Egypt use a position where a draw is acceptable. They need not overcommit but sitting too deep feeds Iranian momentum. Iran must choose when to gamble; Egypt want to punish space behind Salah when Iran step forward.",
      "With all four teams still alive, this result heavily shapes New Zealand v Belgium. Egypt win and top the group; Iran win and qualify on their own; a draw sends Egypt through with Iran waiting on the other fixture. Egypt are favoured but Iran’s defensive resilience makes this far from straightforward.",
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
