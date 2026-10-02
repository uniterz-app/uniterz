/**
 * 2026-27 ロスター未ラベル埋め（昨季少出場・怪我明け・キャンプ枠含む）。
 * 有名選手は個別スカウト、その他は pos/mpg テンプレ + 分かる範囲の補正。
 */
import type { CuratedRoleRow } from "./nbaCuratedPlayerRoles2026Rest";

export const NBA_CURATED_PLAYER_ROLES_2026_FILL: Readonly<
  Record<string, readonly CuratedRoleRow[]>
> = {
  "nba-76ers": [
    {
      "playerId": "1092197212",
      "name": "Duke Miles",
      "hierarchy": "camp_body",
      "roles": [
        "combo_guard",
        "connector_guard",
        "spot_up_shooter"
      ],
      "note": "fill · pos=G · 0mpg"
    },
    {
      "playerId": "1057847891",
      "name": "Jameer Nelson Jr.",
      "hierarchy": "camp_body",
      "roles": [
        "combo_guard",
        "connector_guard",
        "spot_up_shooter"
      ],
      "note": "fill · pos=G · 0mpg"
    },
    {
      "playerId": "1057849072",
      "name": "Saint Thomas",
      "hierarchy": "camp_body",
      "roles": [
        "utility_wing",
        "hustle_player",
        "energy_wing"
      ],
      "note": "fill · pos=F · 0mpg"
    },
    {
      "playerId": "666560",
      "name": "Tacko Fall",
      "hierarchy": "camp_body",
      "roles": [
        "rim_protector",
        "lob_threat",
        "backup_big"
      ],
      "note": "size camp body"
    }
  ],
  "nba-blazers": [
    {
      "playerId": "1076658911",
      "name": "Jayson Kent",
      "hierarchy": "developmental",
      "roles": [
        "energy_wing",
        "hustle_player",
        "spot_up_shooter"
      ],
      "note": "developmental wing"
    },
    {
      "playerId": "1057848654",
      "name": "Mark Sears",
      "hierarchy": "developmental",
      "roles": [
        "secondary_handler",
        "spot_up_shooter",
        "combo_guard"
      ],
      "note": "college scorer adapting to NBA PG/SG"
    },
    {
      "playerId": "1098097073",
      "name": "Barry Dunning",
      "hierarchy": "camp_body",
      "roles": [
        "utility_player",
        "hustle_player",
        "connector"
      ],
      "note": "fill · pos=— · 0mpg"
    },
    {
      "playerId": "278",
      "name": "Damian Lillard",
      "hierarchy": "star_role",
      "roles": [
        "primary_handler",
        "pull_up_shooter",
        "deep_range_shooter",
        "shot_creator"
      ],
      "note": "Achilles recovery · logo 3 / PnR scoring PG"
    },
    {
      "playerId": "1098007406",
      "name": "Keylan Boone",
      "hierarchy": "camp_body",
      "roles": [
        "utility_wing",
        "hustle_player",
        "energy_wing"
      ],
      "note": "fill · pos=F · 0mpg"
    }
  ],
  "nba-bucks": [
    {
      "playerId": "1057394921",
      "name": "Bogoljub Marković",
      "hierarchy": "developmental",
      "roles": [
        "stretch_big",
        "spot_up_shooter",
        "floor_spacer",
        "backup_big"
      ],
      "note": "European stretch forward prospect"
    },
    {
      "playerId": "1093990816",
      "name": "Jake Stephens",
      "hierarchy": "camp_body",
      "roles": [
        "backup_big",
        "rebounder",
        "screen_setter"
      ],
      "note": "fill · pos=C · 0mpg"
    },
    {
      "playerId": "38124126",
      "name": "John Butler Jr.",
      "hierarchy": "fringe_nba",
      "roles": [
        "rim_protector",
        "help_defender",
        "stretch_big"
      ],
      "note": "length / switch big fringe"
    }
  ],
  "nba-bulls": [
    {
      "playerId": "1097973250",
      "name": "Houston Mallette",
      "hierarchy": "camp_body",
      "roles": [
        "utility_player",
        "hustle_player",
        "connector"
      ],
      "note": "fill · pos=— · 0mpg"
    },
    {
      "playerId": "1091907371",
      "name": "Jaylin Sellers",
      "hierarchy": "camp_body",
      "roles": [
        "utility_player",
        "hustle_player",
        "connector"
      ],
      "note": "fill · pos=— · 0mpg"
    },
    {
      "playerId": "1091907681",
      "name": "Peter Suder",
      "hierarchy": "camp_body",
      "roles": [
        "combo_guard",
        "connector_guard",
        "spot_up_shooter"
      ],
      "note": "fill · pos=G · 0mpg"
    },
    {
      "playerId": "1091903404",
      "name": "Tobe Awaka",
      "hierarchy": "camp_body",
      "roles": [
        "utility_wing",
        "hustle_player",
        "energy_wing"
      ],
      "note": "fill · pos=F · 0mpg"
    }
  ],
  "nba-cavaliers": [
    {
      "playerId": "1091907917",
      "name": "Ernest Udeh, Jr.",
      "hierarchy": "camp_body",
      "roles": [
        "backup_big",
        "rebounder",
        "screen_setter"
      ],
      "note": "fill · pos=C · 0mpg"
    },
    {
      "playerId": "1095497363",
      "name": "Khalifa Diop",
      "hierarchy": "camp_body",
      "roles": [
        "backup_big",
        "rebounder",
        "screen_setter"
      ],
      "note": "fill · pos=C · 0mpg"
    },
    {
      "playerId": "208",
      "name": "Mario Hezonja",
      "hierarchy": "end_of_bench",
      "roles": [
        "utility_wing",
        "spot_up_shooter",
        "slashing_wing"
      ],
      "note": "veteran depth wing"
    },
    {
      "playerId": "1098116773",
      "name": "Rashaun Agee",
      "hierarchy": "camp_body",
      "roles": [
        "utility_player",
        "hustle_player",
        "connector"
      ],
      "note": "fill · pos=— · 0mpg"
    },
    {
      "playerId": "1057844738",
      "name": "Zack Austin",
      "hierarchy": "camp_body",
      "roles": [
        "combo_guard",
        "connector_guard",
        "spot_up_shooter"
      ],
      "note": "fill · pos=G · 0mpg"
    }
  ],
  "nba-celtics": [
    {
      "playerId": "1081266162",
      "name": "Hayden Gray",
      "hierarchy": "developmental",
      "roles": [
        "combo_guard",
        "connector_guard",
        "spot_up_shooter",
        "poa_defender"
      ],
      "note": "G League call-up path · two-way combo guard"
    },
    {
      "playerId": "1028255881",
      "name": "Gabe McGlothan",
      "hierarchy": "camp_body",
      "roles": [
        "utility_wing",
        "hustle_player",
        "energy_wing"
      ],
      "note": "fill · pos=F · 0mpg"
    },
    {
      "playerId": "1092292401",
      "name": "Milos Uzan",
      "hierarchy": "camp_body",
      "roles": [
        "combo_guard",
        "connector_guard",
        "spot_up_shooter"
      ],
      "note": "fill · pos=G · 0mpg"
    },
    {
      "playerId": "1092288797",
      "name": "Tucker DeVries",
      "hierarchy": "camp_body",
      "roles": [
        "utility_player",
        "hustle_player",
        "connector"
      ],
      "note": "fill · pos=— · 0mpg"
    }
  ],
  "nba-clippers": [
    {
      "playerId": "1057382509",
      "name": "Johni Broome",
      "hierarchy": "developmental",
      "roles": [
        "paint_finisher",
        "rebounder",
        "backup_big",
        "post_scorer"
      ],
      "note": "college big adapting to NBA"
    },
    {
      "playerId": "1028256970",
      "name": "Jamarion Sharp",
      "hierarchy": "camp_body",
      "roles": [
        "backup_big",
        "rebounder",
        "screen_setter"
      ],
      "note": "fill · pos=C · 0mpg"
    }
  ],
  "nba-grizzlies": [
    {
      "playerId": "1028047928",
      "name": "Quinten Post",
      "hierarchy": "rotation_player",
      "roles": [
        "stretch_big",
        "spot_up_shooter",
        "shooting_big",
        "floor_spacer"
      ],
      "note": "stretch 5 · shoot + space for MEM bench"
    },
    {
      "playerId": "1057390538",
      "name": "Micah Peavy",
      "hierarchy": "developmental",
      "roles": [
        "utility_wing",
        "energy_wing",
        "spot_up_shooter",
        "hustle_player"
      ],
      "note": "6-7 wing size · roster-bubble two-way energy"
    },
    {
      "playerId": "56677837",
      "name": "Jordan Hawkins",
      "hierarchy": "bench_scorer",
      "roles": [
        "spot_up_shooter",
        "pull_up_shooter",
        "movement_shooter",
        "floor_spacer"
      ],
      "note": "shooting guard · off-ball sniper fighting for rotation"
    }
  ],
  "nba-hawks": [
    {
      "playerId": "1097884669",
      "name": "Isaac McKneely",
      "hierarchy": "camp_body",
      "roles": [
        "utility_player",
        "hustle_player",
        "connector"
      ],
      "note": "fill · pos=— · 0mpg"
    },
    {
      "playerId": "17896041",
      "name": "Keon Johnson",
      "hierarchy": "depth_piece",
      "roles": [
        "slashing_wing",
        "transition_threat",
        "rim_pressure",
        "energy_wing"
      ],
      "note": "athlete wing · transition / rim pressure"
    }
  ],
  "nba-heat": [
    {
      "playerId": "1094831183",
      "name": "J'Vonne Hadley",
      "hierarchy": "camp_body",
      "roles": [
        "utility_player",
        "hustle_player",
        "connector"
      ],
      "note": "fill · pos=— · 0mpg"
    },
    {
      "playerId": "1091904403",
      "name": "Tre Donaldson",
      "hierarchy": "camp_body",
      "roles": [
        "combo_guard",
        "connector_guard",
        "spot_up_shooter"
      ],
      "note": "fill · pos=G · 0mpg"
    }
  ],
  "nba-hornets": [
    {
      "playerId": "105",
      "name": "Pat Connaughton",
      "hierarchy": "specialist",
      "roles": [
        "spot_up_shooter",
        "three_pt_specialist",
        "energy_wing",
        "corner_shooter"
      ],
      "note": "3&D / energy wing specialist"
    },
    {
      "playerId": "1092116681",
      "name": "Kylan Boswell",
      "hierarchy": "camp_body",
      "roles": [
        "combo_guard",
        "connector_guard",
        "spot_up_shooter"
      ],
      "note": "fill · pos=G · 0mpg"
    },
    {
      "playerId": "1092116264",
      "name": "Michael Ajayi",
      "hierarchy": "camp_body",
      "roles": [
        "combo_guard",
        "connector_guard",
        "spot_up_shooter"
      ],
      "note": "fill · pos=G · 0mpg"
    }
  ],
  "nba-jazz": [
    {
      "playerId": "1098117890",
      "name": "Ibrahima Diallo",
      "hierarchy": "camp_body",
      "roles": [
        "backup_big",
        "rebounder",
        "screen_setter"
      ],
      "note": "fill · pos=C · 0mpg"
    },
    {
      "playerId": "1057844839",
      "name": "Tamar Bates",
      "hierarchy": "camp_body",
      "roles": [
        "combo_guard",
        "connector_guard",
        "spot_up_shooter"
      ],
      "note": "fill · pos=G · 0mpg"
    }
  ],
  "nba-kings": [
    {
      "playerId": "436846673",
      "name": "Adam Flagler",
      "hierarchy": "fringe_nba",
      "roles": [
        "spot_up_shooter",
        "combo_guard",
        "pull_up_shooter"
      ],
      "note": "shooting guard fringe"
    },
    {
      "playerId": "417",
      "name": "Ben Simmons",
      "hierarchy": "depth_piece",
      "roles": [
        "secondary_playmaker",
        "connector",
        "help_defender",
        "rim_pressure"
      ],
      "note": "availability limited · connector / defense when available"
    },
    {
      "playerId": "369",
      "name": "Elfrid Payton",
      "hierarchy": "fringe_nba",
      "roles": [
        "secondary_handler",
        "playmaker",
        "connector_guard"
      ],
      "note": "veteran backup PG fringe"
    }
  ],
  "nba-knicks": [
    {
      "playerId": "1057393207",
      "name": "Mohamed Diawara",
      "hierarchy": "developmental",
      "roles": [
        "energy_wing",
        "hustle_player",
        "rebounder",
        "cutter"
      ],
      "note": "young energy forward"
    },
    {
      "playerId": "1028025498",
      "name": "Pacome Dadiet",
      "hierarchy": "developmental",
      "roles": [
        "three_d_candidate",
        "spot_up_shooter",
        "slashing_wing",
        "utility_wing"
      ],
      "note": "wing project · size + shooting upside"
    }
  ],
  "nba-lakers": [
    {
      "playerId": "1091906694",
      "name": "AK Okereke",
      "hierarchy": "camp_body",
      "roles": [
        "utility_wing",
        "hustle_player",
        "energy_wing"
      ],
      "note": "fill · pos=F · 0mpg"
    },
    {
      "playerId": "1092732494",
      "name": "Arthur Kaluma",
      "hierarchy": "camp_body",
      "roles": [
        "utility_wing",
        "hustle_player",
        "energy_wing"
      ],
      "note": "fill · pos=F · 0mpg"
    },
    {
      "playerId": "1097596749",
      "name": "Chase Ross",
      "hierarchy": "camp_body",
      "roles": [
        "utility_player",
        "hustle_player",
        "connector"
      ],
      "note": "fill · pos=— · 0mpg"
    },
    {
      "playerId": "1097595092",
      "name": "Meechie Johnson",
      "hierarchy": "camp_body",
      "roles": [
        "combo_guard",
        "connector_guard",
        "spot_up_shooter"
      ],
      "note": "fill · pos=G · 0mpg"
    }
  ],
  "nba-magic": [
    {
      "playerId": "1028271147",
      "name": "Alex Morales",
      "hierarchy": "fringe_nba",
      "roles": [
        "combo_guard",
        "connector_guard",
        "hustle_player"
      ],
      "note": "fringe combo guard"
    },
    {
      "playerId": "56677738",
      "name": "Colin Castleton",
      "hierarchy": "depth_piece",
      "roles": [
        "backup_big",
        "rebounder",
        "paint_finisher",
        "screen_setter"
      ],
      "note": "backup center depth"
    },
    {
      "playerId": "1098137880",
      "name": "Ace Baldwin",
      "hierarchy": "camp_body",
      "roles": [
        "combo_guard",
        "connector_guard",
        "spot_up_shooter"
      ],
      "note": "fill · pos=G · 0mpg"
    },
    {
      "playerId": "1093989939",
      "name": "Au'Diese Toney",
      "hierarchy": "camp_body",
      "roles": [
        "combo_guard",
        "connector_guard",
        "spot_up_shooter"
      ],
      "note": "fill · pos=G · 0mpg"
    },
    {
      "playerId": "24489019",
      "name": "Jarron Cumberland",
      "hierarchy": "fringe_nba",
      "roles": [
        "combo_guard",
        "slashing_wing",
        "spot_up_shooter"
      ],
      "note": "fringe scoring guard"
    },
    {
      "playerId": "56913527",
      "name": "Ricky Council IV",
      "hierarchy": "depth_piece",
      "roles": [
        "slashing_wing",
        "rim_pressure",
        "spot_up_shooter",
        "energy_wing"
      ],
      "note": "athletic scoring wing depth"
    }
  ],
  "nba-mavericks": [
    {
      "playerId": "228",
      "name": "Kyrie Irving",
      "hierarchy": "star_role",
      "roles": [
        "shot_creator",
        "midrange_scorer",
        "pull_up_shooter",
        "iso_scorer"
      ],
      "note": "Achilles recovery · elite on-ball creator"
    },
    {
      "playerId": "1092199635",
      "name": "Tarik Biberovic",
      "hierarchy": "camp_body",
      "roles": [
        "utility_wing",
        "hustle_player",
        "energy_wing"
      ],
      "note": "fill · pos=F · 0mpg"
    }
  ],
  "nba-nets": [
    {
      "playerId": "1098097971",
      "name": "Ben Humrichous",
      "hierarchy": "camp_body",
      "roles": [
        "utility_wing",
        "hustle_player",
        "energy_wing"
      ],
      "note": "fill · pos=F · 0mpg"
    },
    {
      "playerId": "1057845569",
      "name": "Dain Dainja",
      "hierarchy": "camp_body",
      "roles": [
        "utility_wing",
        "hustle_player",
        "energy_wing"
      ],
      "note": "fill · pos=F · 0mpg"
    },
    {
      "playerId": "1097854025",
      "name": "Nick Pringle",
      "hierarchy": "camp_body",
      "roles": [
        "utility_wing",
        "hustle_player",
        "energy_wing"
      ],
      "note": "fill · pos=F · 0mpg"
    }
  ],
  "nba-nuggets": [
    {
      "playerId": "1092288834",
      "name": "Alpha Diallo",
      "hierarchy": "camp_body",
      "roles": [
        "utility_player",
        "hustle_player",
        "connector"
      ],
      "note": "fill · pos=— · 0mpg"
    },
    {
      "playerId": "464",
      "name": "Lonnie Walker IV",
      "hierarchy": "bench_scorer",
      "roles": [
        "slashing_wing",
        "shot_creator",
        "spark_plug",
        "pull_up_shooter"
      ],
      "note": "athletic scoring wing / spark off bench"
    }
  ],
  "nba-pacers": [
    {
      "playerId": "242",
      "name": "James Johnson",
      "hierarchy": "depth_piece",
      "roles": [
        "physical_wing",
        "dirty_work",
        "help_defender",
        "utility_player"
      ],
      "note": "veteran tough wing / glue"
    },
    {
      "playerId": "1097595232",
      "name": "Keba Keita",
      "hierarchy": "camp_body",
      "roles": [
        "backup_big",
        "rebounder",
        "screen_setter"
      ],
      "note": "fill · pos=C · 0mpg"
    },
    {
      "playerId": "1097595694",
      "name": "Rienk Mast",
      "hierarchy": "camp_body",
      "roles": [
        "backup_big",
        "rebounder",
        "screen_setter"
      ],
      "note": "fill · pos=C · 0mpg"
    },
    {
      "playerId": "3547245",
      "name": "Tyrese Haliburton",
      "hierarchy": "star_role",
      "roles": [
        "primary_playmaker",
        "pnr_handler",
        "table_setter",
        "spot_up_shooter"
      ],
      "note": "Achilles recovery · elite table-setter PG"
    }
  ],
  "nba-pelicans": [
    {
      "playerId": "56677838",
      "name": "Kobe Bufkin",
      "hierarchy": "developmental",
      "roles": [
        "secondary_handler",
        "combo_guard",
        "spot_up_shooter",
        "shot_creator"
      ],
      "note": "young combo / secondary creator"
    },
    {
      "playerId": "38017724",
      "name": "Caleb Houstan",
      "hierarchy": "specialist",
      "roles": [
        "three_pt_specialist",
        "spot_up_shooter",
        "corner_shooter",
        "floor_spacer"
      ],
      "note": "pure spacer wing"
    },
    {
      "playerId": "1094002723",
      "name": "Malik Dia",
      "hierarchy": "camp_body",
      "roles": [
        "utility_wing",
        "hustle_player",
        "energy_wing"
      ],
      "note": "fill · pos=F · 0mpg"
    }
  ],
  "nba-pistons": [
    {
      "playerId": "1028205331",
      "name": "Isaac Jones",
      "hierarchy": "depth_piece",
      "roles": [
        "energy_wing",
        "rebounder",
        "cutter",
        "hustle_player"
      ],
      "note": "energy forward depth"
    },
    {
      "playerId": "1098000422",
      "name": "Jordan Riley",
      "hierarchy": "camp_body",
      "roles": [
        "utility_player",
        "hustle_player",
        "connector"
      ],
      "note": "fill · pos=— · 0mpg"
    }
  ],
  "nba-raptors": [
    {
      "playerId": "1092199652",
      "name": "Nate Bittle",
      "hierarchy": "camp_body",
      "roles": [
        "backup_big",
        "rebounder",
        "screen_setter"
      ],
      "note": "fill · pos=C · 0mpg"
    }
  ],
  "nba-rockets": [
    {
      "playerId": "458",
      "name": "Fred VanVleet",
      "hierarchy": "high_end_starter",
      "roles": [
        "primary_handler",
        "deep_range_shooter",
        "spot_up_shooter",
        "game_manager"
      ],
      "note": "ACL recovery · deep range + floor general"
    },
    {
      "playerId": "1092195008",
      "name": "Quadir Copeland",
      "hierarchy": "camp_body",
      "roles": [
        "combo_guard",
        "connector_guard",
        "spot_up_shooter"
      ],
      "note": "fill · pos=G · 0mpg"
    },
    {
      "playerId": "1094642691",
      "name": "Rafael Castro",
      "hierarchy": "camp_body",
      "roles": [
        "backup_big",
        "rebounder",
        "screen_setter"
      ],
      "note": "fill · pos=C · 0mpg"
    }
  ],
  "nba-spurs": [
    {
      "playerId": "1097970628",
      "name": "Miles Barnstable",
      "hierarchy": "camp_body",
      "roles": [
        "combo_guard",
        "connector_guard",
        "spot_up_shooter"
      ],
      "note": "fill · pos=G · 0mpg"
    }
  ],
  "nba-suns": [
    {
      "playerId": "1057387526",
      "name": "Koby Brea",
      "hierarchy": "developmental",
      "roles": [
        "spot_up_shooter",
        "movement_shooter",
        "combo_guard",
        "floor_spacer"
      ],
      "note": "shooting guard prospect"
    },
    {
      "playerId": "1098018124",
      "name": "Corey Camper",
      "hierarchy": "camp_body",
      "roles": [
        "utility_player",
        "hustle_player",
        "connector"
      ],
      "note": "fill · pos=— · 0mpg"
    },
    {
      "playerId": "1098018120",
      "name": "John Camden",
      "hierarchy": "camp_body",
      "roles": [
        "utility_wing",
        "hustle_player",
        "energy_wing"
      ],
      "note": "fill · pos=F · 0mpg"
    },
    {
      "playerId": "1098019474",
      "name": "Samuel Hoiberg",
      "hierarchy": "camp_body",
      "roles": [
        "utility_player",
        "hustle_player",
        "connector"
      ],
      "note": "fill · pos=— · 0mpg"
    }
  ],
  "nba-thunder": [
    {
      "playerId": "1097033907",
      "name": "Cristoph Tilly",
      "hierarchy": "camp_body",
      "roles": [
        "utility_player",
        "hustle_player",
        "connector"
      ],
      "note": "fill · pos=— · 0mpg"
    },
    {
      "playerId": "1091904395",
      "name": "Josh Dix",
      "hierarchy": "camp_body",
      "roles": [
        "utility_player",
        "hustle_player",
        "connector"
      ],
      "note": "fill · pos=— · 0mpg"
    },
    {
      "playerId": "1057274983",
      "name": "Thomas Sorber",
      "hierarchy": "developmental",
      "roles": [
        "rim_protector",
        "rebounder",
        "paint_finisher",
        "backup_big"
      ],
      "note": "young big prospect"
    }
  ],
  "nba-timberwolves": [
    {
      "playerId": "1098099906",
      "name": "Nate Santos",
      "hierarchy": "camp_body",
      "roles": [
        "utility_wing",
        "hustle_player",
        "energy_wing"
      ],
      "note": "fill · pos=F · 0mpg"
    },
    {
      "playerId": "290",
      "name": "Trey Lyles",
      "hierarchy": "depth_piece",
      "roles": [
        "stretch_big",
        "spot_up_shooter",
        "floor_spacer",
        "backup_big"
      ],
      "note": "stretch forward depth"
    }
  ],
  "nba-warriors": [
    {
      "playerId": "1057396605",
      "name": "Alex Toohey",
      "hierarchy": "developmental",
      "roles": [
        "three_d_candidate",
        "spot_up_shooter",
        "defensive_wing",
        "utility_wing"
      ],
      "note": "2025 draft wing · 3&D candidate"
    },
    {
      "playerId": "344",
      "name": "Georges Niang",
      "hierarchy": "specialist",
      "roles": [
        "stretch_big",
        "spot_up_shooter",
        "corner_shooter",
        "floor_spacer"
      ],
      "note": "stretch four specialist"
    },
    {
      "playerId": "1097894227",
      "name": "Graham Ike",
      "hierarchy": "camp_body",
      "roles": [
        "utility_player",
        "hustle_player",
        "connector"
      ],
      "note": "fill · pos=— · 0mpg"
    },
    {
      "playerId": "1097488861",
      "name": "Nick Boyd",
      "hierarchy": "camp_body",
      "roles": [
        "combo_guard",
        "connector_guard",
        "spot_up_shooter"
      ],
      "note": "fill · pos=G · 0mpg"
    }
  ],
  "nba-wizards": [
    {
      "playerId": "1097491682",
      "name": "KeShawn Murphy",
      "hierarchy": "camp_body",
      "roles": [
        "utility_wing",
        "hustle_player",
        "energy_wing"
      ],
      "note": "fill · pos=F · 0mpg"
    }
  ]
} as const;
