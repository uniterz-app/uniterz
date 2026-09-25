import type { NbaHierarchyTagId, NbaRoleTagId } from "./nbaPlayerRoleTaxonomy";

export type CuratedRoleRow = {
  playerId: string;
  name: string;
  hierarchy: NbaHierarchyTagId;
  roles: readonly NbaRoleTagId[];
  note?: string;
};

export const NBA_CURATED_PLAYER_ROLES_2026_REST: Readonly<
  Record<string, readonly CuratedRoleRow[]>
> = {
  "nba-rockets": [
    {
      "playerId": "56677825",
      "name": "Amen Thompson",
      "hierarchy": "third_option",
      "roles": [
        "slashing_wing",
        "primary_handler",
        "rim_pressure",
        "poa_defender"
      ]
    },
    {
      "playerId": "140",
      "name": "Kevin Durant",
      "hierarchy": "first_option",
      "roles": [
        "three_level_scorer",
        "shot_creator",
        "midrange_scorer",
        "late_clock_creator"
      ]
    },
    {
      "playerId": "38017684",
      "name": "Jabari Smith Jr.",
      "hierarchy": "high_end_starter",
      "roles": [
        "slashing_wing",
        "spot_up_shooter",
        "rebounder"
      ]
    },
    {
      "playerId": "17896062",
      "name": "Alperen Sengun",
      "hierarchy": "second_option",
      "roles": [
        "post_scorer",
        "hub_big",
        "passing_big",
        "paint_finisher"
      ]
    },
    {
      "playerId": "420",
      "name": "Marcus Smart",
      "hierarchy": "starter",
      "roles": [
        "secondary_handler",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "1028028519",
      "name": "Reed Sheppard",
      "hierarchy": "starter",
      "roles": [
        "secondary_handler",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "38017695",
      "name": "Tari Eason",
      "hierarchy": "starter",
      "roles": [
        "three_d_wing",
        "spot_up_shooter",
        "rebounder"
      ]
    },
    {
      "playerId": "3",
      "name": "Steven Adams",
      "hierarchy": "key_rotation",
      "roles": [
        "rebounder",
        "paint_finisher",
        "screen_setter"
      ]
    },
    {
      "playerId": "53",
      "name": "Bogdan Bogdanovic",
      "hierarchy": "rotation_player",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "56677778",
      "name": "Oscar Tshiebwe",
      "hierarchy": "rotation_player",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    },
    {
      "playerId": "83",
      "name": "Clint Capela",
      "hierarchy": "rotation_player",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    },
    {
      "playerId": "56677857",
      "name": "Julian Phillips",
      "hierarchy": "depth_piece",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "3547301",
      "name": "Jae'Sean Tate",
      "hierarchy": "depth_piece",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1028203948",
      "name": "Isaiah Crawford",
      "hierarchy": "end_of_bench",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1058921044",
      "name": "Sean Pedulla",
      "hierarchy": "end_of_bench",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    }
  ],
  "nba-heat": [
    {
      "playerId": "1059992972",
      "name": "Bez Mbeng",
      "hierarchy": "high_end_starter",
      "roles": [
        "secondary_handler",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "4",
      "name": "Bam Adebayo",
      "hierarchy": "second_option",
      "roles": [
        "defensive_anchor",
        "switch_defender",
        "short_roll_playmaker",
        "dho_hub"
      ]
    },
    {
      "playerId": "475",
      "name": "Andrew Wiggins",
      "hierarchy": "third_option",
      "roles": [
        "slashing_wing",
        "spot_up_shooter",
        "cns_shooter"
      ]
    },
    {
      "playerId": "15",
      "name": "Giannis Antetokounmpo",
      "hierarchy": "first_option",
      "roles": [
        "rim_pressure",
        "paint_touch_creator",
        "primary_playmaker",
        "transition_threat"
      ]
    },
    {
      "playerId": "17553994",
      "name": "Davion Mitchell",
      "hierarchy": "starter",
      "roles": [
        "playmaker",
        "spot_up_shooter",
        "pnr_handler"
      ]
    },
    {
      "playerId": "191",
      "name": "Tim Hardaway Jr.",
      "hierarchy": "starter",
      "roles": [
        "combo_guard",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "1028036986",
      "name": "Pelle Larsson",
      "hierarchy": "starter",
      "roles": [
        "secondary_handler",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "377",
      "name": "Bobby Portis",
      "hierarchy": "sixth_man",
      "roles": [
        "three_d_wing",
        "spot_up_shooter",
        "rebounder"
      ]
    },
    {
      "playerId": "443",
      "name": "Klay Thompson",
      "hierarchy": "key_rotation",
      "roles": [
        "movement_shooter",
        "cns_shooter",
        "floor_spacer"
      ]
    },
    {
      "playerId": "38017696",
      "name": "Nikola Jovic",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "38017739",
      "name": "Simone Fontecchio",
      "hierarchy": "bench_scorer",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "19465585",
      "name": "Dru Smith",
      "hierarchy": "rotation_player",
      "roles": [
        "secondary_handler",
        "connector_guard"
      ]
    },
    {
      "playerId": "3547282",
      "name": "Nick Richards",
      "hierarchy": "rotation_player",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    },
    {
      "playerId": "1057846109",
      "name": "Myron Gardner",
      "hierarchy": "depth_piece",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1028125584",
      "name": "Keshad Johnson",
      "hierarchy": "depth_piece",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1057846206",
      "name": "Vladislav Goldin",
      "hierarchy": "end_of_bench",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    }
  ],
  "nba-hornets": [
    {
      "playerId": "1057263194",
      "name": "Kon Knueppel",
      "hierarchy": "second_option",
      "roles": [
        "movement_shooter",
        "secondary_handler",
        "connector_wing"
      ]
    },
    {
      "playerId": "56677823",
      "name": "Brandon Miller",
      "hierarchy": "first_option",
      "roles": [
        "three_level_scorer",
        "shot_creator",
        "two_way_wing"
      ]
    },
    {
      "playerId": "8",
      "name": "Grayson Allen",
      "hierarchy": "starter",
      "roles": [
        "secondary_handler",
        "shot_creator",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "351",
      "name": "Royce O'Neale",
      "hierarchy": "starter",
      "roles": [
        "three_d_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "667378",
      "name": "Naz Reid",
      "hierarchy": "starter",
      "roles": [
        "stretch_big",
        "self_creator",
        "backup_big"
      ]
    },
    {
      "playerId": "38017725",
      "name": "Moussa Diabate",
      "hierarchy": "starter",
      "roles": [
        "three_d_wing",
        "hustle_player",
        "rebounder"
      ]
    },
    {
      "playerId": "666956",
      "name": "Coby White",
      "hierarchy": "third_option",
      "roles": [
        "secondary_handler",
        "shot_creator",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "409",
      "name": "Dennis Schroder",
      "hierarchy": "key_rotation",
      "roles": [
        "secondary_handler",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "1057384156",
      "name": "Sion James",
      "hierarchy": "key_rotation",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "1057384362",
      "name": "Ryan Kalkbrenner",
      "hierarchy": "key_rotation",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    },
    {
      "playerId": "666965",
      "name": "Grant Williams",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1057847894",
      "name": "Ryan Nembhard",
      "hierarchy": "rotation_player",
      "roles": [
        "playmaker",
        "connector_guard",
        "pnr_handler"
      ]
    },
    {
      "playerId": "210",
      "name": "Buddy Hield",
      "hierarchy": "rotation_player",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "1028028379",
      "name": "Tidjane Salaun",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1057278805",
      "name": "Liam McNeeley",
      "hierarchy": "depth_piece",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1028244692",
      "name": "PJ Hall",
      "hierarchy": "depth_piece",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    }
  ],
  "nba-cavaliers": [
    {
      "playerId": "192",
      "name": "James Harden",
      "hierarchy": "second_option",
      "roles": [
        "primary_handler",
        "pnr_handler",
        "primary_playmaker",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "322",
      "name": "Donovan Mitchell",
      "hierarchy": "first_option",
      "roles": [
        "volume_scorer",
        "shot_creator",
        "pull_up_shooter",
        "late_clock_creator"
      ]
    },
    {
      "playerId": "17896076",
      "name": "Evan Mobley",
      "hierarchy": "third_option",
      "roles": [
        "defensive_anchor",
        "rim_protector",
        "switch_defender",
        "short_roll_playmaker"
      ]
    },
    {
      "playerId": "38017721",
      "name": "Peyton Watson",
      "hierarchy": "starter",
      "roles": [
        "combo_guard",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "9",
      "name": "Jarrett Allen",
      "hierarchy": "starter",
      "roles": [
        "roll_man",
        "rim_protector",
        "glass_cleaner"
      ]
    },
    {
      "playerId": "1028028993",
      "name": "Jaylon Tyson",
      "hierarchy": "starter",
      "roles": [
        "three_d_wing",
        "spot_up_shooter",
        "rebounder"
      ]
    },
    {
      "playerId": "3547299",
      "name": "Sam Merrill",
      "hierarchy": "starter",
      "roles": [
        "combo_guard",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "1059542426",
      "name": "Kadary Richmond",
      "hierarchy": "key_rotation",
      "roles": [
        "secondary_handler",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "56677872",
      "name": "Craig Porter",
      "hierarchy": "rotation_player",
      "roles": [
        "secondary_handler",
        "connector_guard"
      ]
    },
    {
      "playerId": "1042560902",
      "name": "Nae'Qwan Tomlin",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "74",
      "name": "Thomas Bryant",
      "hierarchy": "rotation_player",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    },
    {
      "playerId": "1057395754",
      "name": "Tyrese Proctor",
      "hierarchy": "depth_piece",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "1028244219",
      "name": "Tristan Enaruna",
      "hierarchy": "depth_piece",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1057846921",
      "name": "Curtis Jones",
      "hierarchy": "depth_piece",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "1028245994",
      "name": "Riley Minix",
      "hierarchy": "end_of_bench",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    }
  ],
  "nba-raptors": [
    {
      "playerId": "17896055",
      "name": "Scottie Barnes",
      "hierarchy": "third_option",
      "roles": [
        "primary_playmaker",
        "multi_position_defender",
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "274",
      "name": "Kawhi Leonard",
      "hierarchy": "first_option",
      "roles": [
        "two_way_wing",
        "iso_scorer",
        "midrange_scorer",
        "wing_stopper"
      ]
    },
    {
      "playerId": "3547269",
      "name": "Immanuel Quickley",
      "hierarchy": "high_end_starter",
      "roles": [
        "playmaker",
        "shot_creator",
        "pnr_handler"
      ]
    },
    {
      "playerId": "666423",
      "name": "RJ Barrett",
      "hierarchy": "second_option",
      "roles": [
        "slashing_wing",
        "secondary_playmaker",
        "rim_pressure"
      ]
    },
    {
      "playerId": "373",
      "name": "Jakob Poeltl",
      "hierarchy": "starter",
      "roles": [
        "rebounder",
        "paint_finisher",
        "roll_man"
      ]
    },
    {
      "playerId": "1059753274",
      "name": "Malachi Smith",
      "hierarchy": "key_rotation",
      "roles": [
        "secondary_handler",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "1028038426",
      "name": "Jamal Shead",
      "hierarchy": "key_rotation",
      "roles": [
        "playmaker",
        "connector_guard",
        "pnr_handler"
      ]
    },
    {
      "playerId": "1057268940",
      "name": "Collin Murray-Boyles",
      "hierarchy": "key_rotation",
      "roles": [
        "energy_wing",
        "hustle_player",
        "rebounder"
      ]
    },
    {
      "playerId": "1028029111",
      "name": "Ja'Kobe Walter",
      "hierarchy": "key_rotation",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "12",
      "name": "Kyle Anderson",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "56677799",
      "name": "Trayce Jackson-Davis",
      "hierarchy": "depth_piece",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1028243201",
      "name": "Jamison Battle",
      "hierarchy": "depth_piece",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "56677852",
      "name": "Andre Jackson Jr.",
      "hierarchy": "depth_piece",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "1057846535",
      "name": "Chucky Hepburn",
      "hierarchy": "end_of_bench",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "1057389862",
      "name": "Alijah Martin",
      "hierarchy": "end_of_bench",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "64269023",
      "name": "Trey Jemison",
      "hierarchy": "end_of_bench",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    }
  ],
  "nba-knicks": [
    {
      "playerId": "73",
      "name": "Jalen Brunson",
      "hierarchy": "first_option",
      "roles": [
        "primary_handler",
        "shot_creator",
        "mismatch_scorer",
        "late_clock_creator"
      ]
    },
    {
      "playerId": "18",
      "name": "OG Anunoby",
      "hierarchy": "third_option",
      "roles": [
        "three_d_wing",
        "wing_stopper",
        "corner_shooter"
      ]
    },
    {
      "playerId": "61",
      "name": "Mikal Bridges",
      "hierarchy": "high_end_starter",
      "roles": [
        "two_way_wing",
        "movement_shooter",
        "wing_stopper"
      ]
    },
    {
      "playerId": "447",
      "name": "Karl-Anthony Towns",
      "hierarchy": "second_option",
      "roles": [
        "shooting_big",
        "post_scorer",
        "rebounder",
        "floor_spacer"
      ]
    },
    {
      "playerId": "202",
      "name": "Josh Hart",
      "hierarchy": "high_end_starter",
      "roles": [
        "connector_wing",
        "rebounder",
        "hustle_player",
        "transition_threat"
      ]
    },
    {
      "playerId": "17896033",
      "name": "Miles McBride",
      "hierarchy": "starter",
      "roles": [
        "secondary_handler",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "69",
      "name": "Bruce Brown",
      "hierarchy": "key_rotation",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "414",
      "name": "Landry Shamet",
      "hierarchy": "key_rotation",
      "roles": [
        "combo_guard",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "17896097",
      "name": "Jose Alvarado",
      "hierarchy": "rotation_player",
      "roles": [
        "secondary_handler",
        "connector_guard"
      ]
    },
    {
      "playerId": "666703",
      "name": "John Konchar",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "137",
      "name": "Andre Drummond",
      "hierarchy": "rotation_player",
      "roles": [
        "rebounder",
        "paint_finisher",
        "screen_setter"
      ]
    },
    {
      "playerId": "100",
      "name": "Jordan Clarkson",
      "hierarchy": "bench_scorer",
      "roles": [
        "combo_guard",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "38017620",
      "name": "Ochai Agbaji",
      "hierarchy": "rotation_player",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "3547240",
      "name": "James Wiseman",
      "hierarchy": "rotation_player",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    },
    {
      "playerId": "147",
      "name": "Drew Eubanks",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1028036898",
      "name": "Tyler Kolek",
      "hierarchy": "depth_piece",
      "roles": [
        "secondary_handler",
        "connector_guard"
      ]
    }
  ],
  "nba-wizards": [
    {
      "playerId": "117",
      "name": "Anthony Davis",
      "hierarchy": "first_option",
      "roles": [
        "defensive_anchor",
        "rim_protector",
        "post_scorer",
        "rebounder"
      ]
    },
    {
      "playerId": "1028026060",
      "name": "KyShawn George",
      "hierarchy": "starter",
      "roles": [
        "slashing_wing",
        "secondary_playmaker",
        "rebounder"
      ]
    },
    {
      "playerId": "1028025235",
      "name": "Carlton Carrington",
      "hierarchy": "starter",
      "roles": [
        "secondary_handler",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "1028028405",
      "name": "Alexandre Sarr",
      "hierarchy": "third_option",
      "roles": [
        "rim_protector",
        "shooting_big",
        "help_defender"
      ]
    },
    {
      "playerId": "22",
      "name": "Deandre Ayton",
      "hierarchy": "starter",
      "roles": [
        "rebounder",
        "paint_finisher",
        "roll_man"
      ]
    },
    {
      "playerId": "56677844",
      "name": "Bilal Coulibaly",
      "hierarchy": "starter",
      "roles": [
        "secondary_handler",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "490",
      "name": "Trae Young",
      "hierarchy": "second_option",
      "roles": [
        "primary_handler",
        "primary_playmaker",
        "deep_range_shooter",
        "pnr_handler"
      ]
    },
    {
      "playerId": "1057262985",
      "name": "Tre Johnson",
      "hierarchy": "sixth_man",
      "roles": [
        "combo_guard",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "315",
      "name": "Khris Middleton",
      "hierarchy": "key_rotation",
      "roles": [
        "energy_wing",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "1057279594",
      "name": "Will Riley",
      "hierarchy": "key_rotation",
      "roles": [
        "energy_wing",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "1057391756",
      "name": "Jamir Watkins",
      "hierarchy": "key_rotation",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "17896039",
      "name": "Justin Champagnie",
      "hierarchy": "key_rotation",
      "roles": [
        "energy_wing",
        "hustle_player",
        "rebounder"
      ]
    },
    {
      "playerId": "3547302",
      "name": "Anthony Gill",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1016384149",
      "name": "Tristan Vukcevic",
      "hierarchy": "bench_scorer",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "17896036",
      "name": "Tre Mann",
      "hierarchy": "rotation_player",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    }
  ],
  "nba-nuggets": [
    {
      "playerId": "335",
      "name": "Jamal Murray",
      "hierarchy": "second_option",
      "roles": [
        "shot_creator",
        "pnr_handler",
        "pull_up_shooter",
        "late_clock_creator"
      ]
    },
    {
      "playerId": "246",
      "name": "Nikola Jokic",
      "hierarchy": "franchise_player",
      "roles": [
        "hub_big",
        "primary_playmaker",
        "post_scorer",
        "efficient_scorer"
      ]
    },
    {
      "playerId": "38017709",
      "name": "Christian Braun",
      "hierarchy": "high_end_starter",
      "roles": [
        "secondary_handler",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "125",
      "name": "DeMar DeRozan",
      "hierarchy": "third_option",
      "roles": [
        "midrange_scorer",
        "shot_creator",
        "mismatch_scorer"
      ]
    },
    {
      "playerId": "666679",
      "name": "Cameron Johnson",
      "hierarchy": "high_end_starter",
      "roles": [
        "three_d_wing",
        "spot_up_shooter",
        "cns_shooter"
      ]
    },
    {
      "playerId": "177",
      "name": "Aaron Gordon",
      "hierarchy": "starter",
      "roles": [
        "physical_wing",
        "cutter",
        "paint_finisher",
        "multi_position_defender"
      ]
    },
    {
      "playerId": "1028255289",
      "name": "Spencer Jones",
      "hierarchy": "key_rotation",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "24",
      "name": "Marvin Bagley III",
      "hierarchy": "key_rotation",
      "roles": [
        "energy_wing",
        "spot_up_shooter",
        "rebounder"
      ]
    },
    {
      "playerId": "56677831",
      "name": "Cam Whitmore",
      "hierarchy": "bench_scorer",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "56677776",
      "name": "Julian Strawther",
      "hierarchy": "rotation_player",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "249",
      "name": "Tyus Jones",
      "hierarchy": "rotation_player",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "1028038474",
      "name": "K.J. Simpson",
      "hierarchy": "rotation_player",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "3547268",
      "name": "Zeke Nnaji",
      "hierarchy": "rotation_player",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    },
    {
      "playerId": "1028026514",
      "name": "DaRon Holmes II",
      "hierarchy": "depth_piece",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    }
  ],
  "nba-jazz": [
    {
      "playerId": "297",
      "name": "Lauri Markkanen",
      "hierarchy": "first_option",
      "roles": [
        "shooting_big",
        "movement_shooter",
        "efficient_scorer",
        "off_ball_mover"
      ]
    },
    {
      "playerId": "56677834",
      "name": "Keyonte George",
      "hierarchy": "second_option",
      "roles": [
        "playmaker",
        "shot_creator",
        "pnr_handler"
      ]
    },
    {
      "playerId": "231",
      "name": "Jaren Jackson Jr.",
      "hierarchy": "third_option",
      "roles": [
        "rim_protector",
        "stretch_big",
        "defensive_anchor"
      ]
    },
    {
      "playerId": "1057260888",
      "name": "Airious Bailey",
      "hierarchy": "starter",
      "roles": [
        "three_d_wing",
        "spot_up_shooter",
        "cns_shooter"
      ]
    },
    {
      "playerId": "349",
      "name": "Jusuf Nurkic",
      "hierarchy": "starter",
      "roles": [
        "glass_cleaner",
        "screen_setter",
        "passing_big"
      ]
    },
    {
      "playerId": "1028025362",
      "name": "Isaiah Collier",
      "hierarchy": "starter",
      "roles": [
        "playmaker",
        "spot_up_shooter",
        "pnr_handler"
      ]
    },
    {
      "playerId": "56677842",
      "name": "Brice Sensabaugh",
      "hierarchy": "sixth_man",
      "roles": [
        "slashing_wing",
        "spot_up_shooter",
        "cns_shooter"
      ]
    },
    {
      "playerId": "1028035794",
      "name": "Kyle Filipowski",
      "hierarchy": "key_rotation",
      "roles": [
        "rebounder",
        "passing_big",
        "roll_man"
      ]
    },
    {
      "playerId": "338",
      "name": "Svi Mykhailiuk",
      "hierarchy": "key_rotation",
      "roles": [
        "combo_guard",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "1028214958",
      "name": "Blake Hinson",
      "hierarchy": "key_rotation",
      "roles": [
        "energy_wing",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "666626",
      "name": "Jaxson Hayes",
      "hierarchy": "rotation_player",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    },
    {
      "playerId": "356",
      "name": "Josh Okogie",
      "hierarchy": "rotation_player",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "3547258",
      "name": "Josh Green",
      "hierarchy": "rotation_player",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "1028203085",
      "name": "Trey Alexander",
      "hierarchy": "rotation_player",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "28",
      "name": "Mo Bamba",
      "hierarchy": "depth_piece",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    },
    {
      "playerId": "1028046464",
      "name": "Harrison Ingram",
      "hierarchy": "end_of_bench",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    }
  ],
  "nba-spurs": [
    {
      "playerId": "161",
      "name": "De'Aaron Fox",
      "hierarchy": "second_option",
      "roles": [
        "primary_handler",
        "rim_pressure",
        "shot_creator",
        "transition_threat"
      ]
    },
    {
      "playerId": "3547246",
      "name": "Devin Vassell",
      "hierarchy": "high_end_starter",
      "roles": [
        "three_d_wing",
        "spot_up_shooter",
        "cns_shooter"
      ]
    },
    {
      "playerId": "1028025261",
      "name": "Stephon Castle",
      "hierarchy": "third_option",
      "roles": [
        "primary_handler",
        "playmaker",
        "poa_defender",
        "rim_pressure"
      ]
    },
    {
      "playerId": "56677822",
      "name": "Victor Wembanyama",
      "hierarchy": "first_option",
      "roles": [
        "rim_protector",
        "defensive_anchor",
        "three_level_scorer",
        "shooting_big"
      ]
    },
    {
      "playerId": "200",
      "name": "Tobias Harris",
      "hierarchy": "starter",
      "roles": [
        "three_d_wing",
        "spot_up_shooter",
        "rebounder"
      ]
    },
    {
      "playerId": "38017649",
      "name": "Julian Champagnie",
      "hierarchy": "starter",
      "roles": [
        "three_d_wing",
        "spot_up_shooter",
        "rebounder"
      ]
    },
    {
      "playerId": "30",
      "name": "Harrison Barnes",
      "hierarchy": "starter",
      "roles": [
        "three_d_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "666682",
      "name": "Keldon Johnson",
      "hierarchy": "sixth_man",
      "roles": [
        "energy_wing",
        "spot_up_shooter",
        "rebounder"
      ]
    },
    {
      "playerId": "1057262518",
      "name": "Dylan Harper",
      "hierarchy": "key_rotation",
      "roles": [
        "secondary_handler",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "261",
      "name": "Luke Kornet",
      "hierarchy": "key_rotation",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    },
    {
      "playerId": "1057395638",
      "name": "Taelon Peter",
      "hierarchy": "rotation_player",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "1057271360",
      "name": "Carter Bryant",
      "hierarchy": "depth_piece",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "666767",
      "name": "Jordan McLaughlin",
      "hierarchy": "end_of_bench",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "1028245237",
      "name": "David Jones",
      "hierarchy": "end_of_bench",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    }
  ],
  "nba-clippers": [
    {
      "playerId": "227",
      "name": "Brandon Ingram",
      "hierarchy": "first_option",
      "roles": [
        "three_level_scorer",
        "shot_creator",
        "midrange_scorer"
      ]
    },
    {
      "playerId": "666581",
      "name": "Darius Garland",
      "hierarchy": "second_option",
      "roles": [
        "primary_handler",
        "pnr_handler",
        "playmaker",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "666609",
      "name": "Rui Hachimura",
      "hierarchy": "starter",
      "roles": [
        "midrange_scorer",
        "floor_spacer",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "139",
      "name": "Kris Dunn",
      "hierarchy": "starter",
      "roles": [
        "guard_defender",
        "poa_defender",
        "secondary_handler"
      ]
    },
    {
      "playerId": "247",
      "name": "Derrick Jones Jr.",
      "hierarchy": "starter",
      "roles": [
        "three_d_wing",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "666908",
      "name": "Max Strus",
      "hierarchy": "key_rotation",
      "roles": [
        "combo_guard",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "56677856",
      "name": "Jordan Miller",
      "hierarchy": "key_rotation",
      "roles": [
        "combo_guard",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "283",
      "name": "Brook Lopez",
      "hierarchy": "key_rotation",
      "roles": [
        "stretch_5",
        "rim_protector",
        "floor_spacer"
      ]
    },
    {
      "playerId": "37",
      "name": "Bradley Beal",
      "hierarchy": "key_rotation",
      "roles": [
        "combo_guard",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "1057396055",
      "name": "Kobe Sanders",
      "hierarchy": "rotation_player",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "17896035",
      "name": "Isaiah Jackson",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player",
        "rebounder"
      ]
    },
    {
      "playerId": "56677582",
      "name": "Jalen Pickett",
      "hierarchy": "rotation_player",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "56677828",
      "name": "Gradey Dick",
      "hierarchy": "rotation_player",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "1028265377",
      "name": "Yuki Kawamura",
      "hierarchy": "depth_piece",
      "roles": [
        "secondary_handler",
        "connector_guard"
      ]
    },
    {
      "playerId": "1057279105",
      "name": "Yanic Konan Niederhauser",
      "hierarchy": "depth_piece",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    },
    {
      "playerId": "1028035215",
      "name": "Cam Christie",
      "hierarchy": "depth_piece",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    }
  ],
  "nba-suns": [
    {
      "playerId": "57",
      "name": "Devin Booker",
      "hierarchy": "franchise_player",
      "roles": [
        "three_level_scorer",
        "shot_creator",
        "primary_handler",
        "late_clock_creator"
      ]
    },
    {
      "playerId": "62",
      "name": "Miles Bridges",
      "hierarchy": "high_end_starter",
      "roles": [
        "slashing_wing",
        "secondary_playmaker",
        "transition_threat"
      ]
    },
    {
      "playerId": "66",
      "name": "Dillon Brooks",
      "hierarchy": "second_option",
      "roles": [
        "physical_wing",
        "wing_stopper",
        "cns_shooter"
      ]
    },
    {
      "playerId": "38017727",
      "name": "Collin Gillespie",
      "hierarchy": "starter",
      "roles": [
        "secondary_handler",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "17895966",
      "name": "Jalen Green",
      "hierarchy": "third_option",
      "roles": [
        "secondary_handler",
        "shot_creator",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "38017698",
      "name": "Mark Williams",
      "hierarchy": "key_rotation",
      "roles": [
        "roll_man",
        "lob_threat",
        "glass_cleaner",
        "rim_protector"
      ]
    },
    {
      "playerId": "18678058",
      "name": "Jordan Goodwin",
      "hierarchy": "key_rotation",
      "roles": [
        "combo_guard",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "1028036515",
      "name": "Oso Ighodaro",
      "hierarchy": "key_rotation",
      "roles": [
        "energy_wing",
        "hustle_player",
        "rebounder"
      ]
    },
    {
      "playerId": "254",
      "name": "Luke Kennard",
      "hierarchy": "key_rotation",
      "roles": [
        "combo_guard",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "1028025723",
      "name": "Ryan Dunn",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "795959473",
      "name": "Pat Spencer",
      "hierarchy": "rotation_player",
      "roles": [
        "secondary_handler",
        "connector_guard"
      ]
    },
    {
      "playerId": "44477062",
      "name": "Jamaree Bouyea",
      "hierarchy": "rotation_player",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "3092",
      "name": "Haywood Highsmith",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1057383369",
      "name": "Rasheer Fleming",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1057846700",
      "name": "CJ Huntley",
      "hierarchy": "depth_piece",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1057268513",
      "name": "Khaman Maluach",
      "hierarchy": "depth_piece",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    }
  ],
  "nba-warriors": [
    {
      "playerId": "79",
      "name": "Jimmy Butler",
      "hierarchy": "second_option",
      "roles": [
        "two_way_wing",
        "rim_pressure",
        "advantage_creator",
        "wing_stopper"
      ]
    },
    {
      "playerId": "115",
      "name": "Stephen Curry",
      "hierarchy": "franchise_player",
      "roles": [
        "movement_shooter",
        "deep_range_shooter",
        "shot_creator",
        "primary_handler"
      ]
    },
    {
      "playerId": "56677858",
      "name": "Brandin Podziemski",
      "hierarchy": "starter",
      "roles": [
        "secondary_handler",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "185",
      "name": "Draymond Green",
      "hierarchy": "starter",
      "roles": [
        "defensive_anchor",
        "primary_playmaker",
        "short_roll_playmaker",
        "switch_defender"
      ]
    },
    {
      "playerId": "17553992",
      "name": "Moses Moody",
      "hierarchy": "starter",
      "roles": [
        "combo_guard",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "378",
      "name": "Kristaps Porzingis",
      "hierarchy": "third_option",
      "roles": [
        "shooting_big",
        "rim_protector",
        "post_scorer"
      ]
    },
    {
      "playerId": "313",
      "name": "De'Anthony Melton",
      "hierarchy": "sixth_man",
      "roles": [
        "secondary_handler",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "24489167",
      "name": "Brandon Williams",
      "hierarchy": "sixth_man",
      "roles": [
        "secondary_handler",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "219",
      "name": "Al Horford",
      "hierarchy": "key_rotation",
      "roles": [
        "stretch_5",
        "defensive_anchor",
        "connector"
      ]
    },
    {
      "playerId": "57875092",
      "name": "Gui Santos",
      "hierarchy": "key_rotation",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1057395872",
      "name": "Will Richard",
      "hierarchy": "key_rotation",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "1057968644",
      "name": "LJ Cryer",
      "hierarchy": "bench_scorer",
      "roles": [
        "combo_guard",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "2189",
      "name": "Gary Payton II",
      "hierarchy": "rotation_player",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "17895854",
      "name": "Charles Bassey",
      "hierarchy": "depth_piece",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "38017719",
      "name": "Dalen Terry",
      "hierarchy": "depth_piece",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1028265620",
      "name": "Malevy Leons",
      "hierarchy": "depth_piece",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    }
  ],
  "nba-magic": [
    {
      "playerId": "38017683",
      "name": "Paolo Banchero",
      "hierarchy": "first_option",
      "roles": [
        "big_wing",
        "shot_creator",
        "mismatch_scorer",
        "primary_playmaker"
      ]
    },
    {
      "playerId": "3547287",
      "name": "Desmond Bane",
      "hierarchy": "third_option",
      "roles": [
        "movement_shooter",
        "shot_creator",
        "secondary_handler"
      ]
    },
    {
      "playerId": "17896026",
      "name": "Franz Wagner",
      "hierarchy": "second_option",
      "roles": [
        "slashing_wing",
        "rim_pressure",
        "secondary_playmaker"
      ]
    },
    {
      "playerId": "56677827",
      "name": "Anthony Black",
      "hierarchy": "starter",
      "roles": [
        "secondary_handler",
        "shot_creator",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "85",
      "name": "Wendell Carter Jr.",
      "hierarchy": "starter",
      "roles": [
        "three_d_wing",
        "spot_up_shooter",
        "rebounder"
      ]
    },
    {
      "playerId": "460",
      "name": "Nikola Vucevic",
      "hierarchy": "starter",
      "roles": [
        "rebounder",
        "passing_big",
        "roll_man"
      ]
    },
    {
      "playerId": "17896073",
      "name": "Jalen Suggs",
      "hierarchy": "starter",
      "roles": [
        "poa_defender",
        "combo_guard",
        "secondary_playmaker"
      ]
    },
    {
      "playerId": "1028025497",
      "name": "Tristan Da Silva",
      "hierarchy": "key_rotation",
      "roles": [
        "three_d_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "87",
      "name": "Jevon Carter",
      "hierarchy": "rotation_player",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "666442",
      "name": "Goga Bitadze",
      "hierarchy": "rotation_player",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    },
    {
      "playerId": "1057385481",
      "name": "Noah Penda",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "38017734",
      "name": "Jamal Cain",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1057279571",
      "name": "Jase Richardson",
      "hierarchy": "depth_piece",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "229",
      "name": "Jonathan Isaac",
      "hierarchy": "depth_piece",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "38017692",
      "name": "Malaki Branham",
      "hierarchy": "depth_piece",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "38017707",
      "name": "JD Davison",
      "hierarchy": "depth_piece",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    }
  ],
  "nba-thunder": [
    {
      "playerId": "175",
      "name": "Shai Gilgeous-Alexander",
      "hierarchy": "first_option",
      "roles": [
        "three_level_scorer",
        "iso_scorer",
        "rim_pressure",
        "late_clock_creator"
      ]
    },
    {
      "playerId": "38017685",
      "name": "Chet Holmgren",
      "hierarchy": "second_option",
      "roles": [
        "rim_protector",
        "shooting_big",
        "help_defender"
      ]
    },
    {
      "playerId": "38017703",
      "name": "Jalen Williams",
      "hierarchy": "third_option",
      "roles": [
        "two_way_wing",
        "secondary_playmaker",
        "shot_creator"
      ]
    },
    {
      "playerId": "56677833",
      "name": "Cason Wallace",
      "hierarchy": "starter",
      "roles": [
        "secondary_handler",
        "spot_up_shooter",
        "poa_defender",
        "perimeter_defender"
      ]
    },
    {
      "playerId": "1028037477",
      "name": "Ajay Mitchell",
      "hierarchy": "starter",
      "roles": [
        "secondary_handler",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "201",
      "name": "Isaiah Hartenstein",
      "hierarchy": "key_rotation",
      "roles": [
        "rebounder",
        "passing_big",
        "screen_setter"
      ]
    },
    {
      "playerId": "38017706",
      "name": "Jaylin Williams",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player",
        "rebounder"
      ]
    },
    {
      "playerId": "89",
      "name": "Alex Caruso",
      "hierarchy": "rotation_player",
      "roles": [
        "guard_defender",
        "poa_defender",
        "connector",
        "hustle_player"
      ]
    },
    {
      "playerId": "1028027372",
      "name": "Jared McCain",
      "hierarchy": "bench_scorer",
      "roles": [
        "combo_guard",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "1028028932",
      "name": "Nikola Topic",
      "hierarchy": "rotation_player",
      "roles": [
        "secondary_handler",
        "connector_guard"
      ]
    },
    {
      "playerId": "480",
      "name": "Kenrich Williams",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1057392335",
      "name": "Brooks Barnhizer",
      "hierarchy": "depth_piece",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    }
  ],
  "nba-pistons": [
    {
      "playerId": "17896075",
      "name": "Cade Cunningham",
      "hierarchy": "first_option",
      "roles": [
        "primary_handler",
        "primary_playmaker",
        "three_level_scorer",
        "late_clock_creator"
      ]
    },
    {
      "playerId": "38017694",
      "name": "Jalen Duren",
      "hierarchy": "high_end_starter",
      "roles": [
        "roll_man",
        "paint_finisher",
        "glass_cleaner"
      ]
    },
    {
      "playerId": "397",
      "name": "Duncan Robinson",
      "hierarchy": "starter",
      "roles": [
        "movement_shooter",
        "three_pt_specialist",
        "floor_spacer"
      ]
    },
    {
      "playerId": "101",
      "name": "John Collins",
      "hierarchy": "role_player",
      "roles": [
        "backup_big",
        "paint_finisher",
        "roll_man"
      ]
    },
    {
      "playerId": "56677826",
      "name": "Ausar Thompson",
      "hierarchy": "starter",
      "roles": [
        "defensive_wing",
        "poa_defender",
        "transition_threat",
        "cutter"
      ]
    },
    {
      "playerId": "383",
      "name": "Taurean Prince",
      "hierarchy": "key_rotation",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "221",
      "name": "Kevin Huerter",
      "hierarchy": "key_rotation",
      "roles": [
        "secondary_handler",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "3547272",
      "name": "Isaiah Joe",
      "hierarchy": "key_rotation",
      "roles": [
        "combo_guard",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "1028264794",
      "name": "Elijah Harkless",
      "hierarchy": "key_rotation",
      "roles": [
        "secondary_handler",
        "connector_guard"
      ]
    },
    {
      "playerId": "1028240128",
      "name": "Daniss Jenkins",
      "hierarchy": "key_rotation",
      "roles": [
        "secondary_handler",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "1028026508",
      "name": "Ronald Holland II",
      "hierarchy": "bench_scorer",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "666604",
      "name": "Javonte Green",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "3547270",
      "name": "Paul Reed",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "196",
      "name": "Gary Harris",
      "hierarchy": "rotation_player",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "1028267166",
      "name": "Tolu Smith",
      "hierarchy": "depth_piece",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1057389625",
      "name": "Chaz Lanier",
      "hierarchy": "depth_piece",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    }
  ],
  "nba-bulls": [
    {
      "playerId": "17896065",
      "name": "Josh Giddey",
      "hierarchy": "second_option",
      "roles": [
        "primary_handler",
        "primary_playmaker",
        "rebounder",
        "paint_touch_creator"
      ]
    },
    {
      "playerId": "380",
      "name": "Norman Powell",
      "hierarchy": "first_option",
      "roles": [
        "volume_scorer",
        "spot_up_shooter",
        "rim_pressure"
      ]
    },
    {
      "playerId": "1028025177",
      "name": "Matas Buzelis",
      "hierarchy": "third_option",
      "roles": [
        "slashing_wing",
        "spot_up_shooter",
        "rebounder"
      ]
    },
    {
      "playerId": "666508",
      "name": "Nicolas Claxton",
      "hierarchy": "starter",
      "roles": [
        "rim_protector",
        "switch_defender",
        "roll_man"
      ]
    },
    {
      "playerId": "3547274",
      "name": "Tre Jones",
      "hierarchy": "starter",
      "roles": [
        "playmaker",
        "spot_up_shooter",
        "pnr_handler"
      ]
    },
    {
      "playerId": "3547247",
      "name": "Isaac Okoro",
      "hierarchy": "starter",
      "roles": [
        "three_d_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "3547264",
      "name": "Jalen Smith",
      "hierarchy": "key_rotation",
      "roles": [
        "backup_big",
        "paint_finisher",
        "roll_man"
      ]
    },
    {
      "playerId": "3547248",
      "name": "Patrick Williams",
      "hierarchy": "key_rotation",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "102",
      "name": "Zach Collins",
      "hierarchy": "bench_scorer",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    },
    {
      "playerId": "56677782",
      "name": "Leonard Miller",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1028025639",
      "name": "Rob Dillingham",
      "hierarchy": "rotation_player",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "1057272081",
      "name": "Noa Essengue",
      "hierarchy": "end_of_bench",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    }
  ],
  "nba-timberwolves": [
    {
      "playerId": "3547238",
      "name": "Anthony Edwards",
      "hierarchy": "first_option",
      "roles": [
        "volume_scorer",
        "shot_creator",
        "rim_pressure",
        "late_clock_creator"
      ]
    },
    {
      "playerId": "3547259",
      "name": "Jaden McDaniels",
      "hierarchy": "third_option",
      "roles": [
        "defensive_wing",
        "wing_stopper",
        "cns_shooter"
      ]
    },
    {
      "playerId": "176",
      "name": "Rudy Gobert",
      "hierarchy": "high_end_starter",
      "roles": [
        "rim_protector",
        "defensive_anchor",
        "roll_man",
        "glass_cleaner"
      ]
    },
    {
      "playerId": "131",
      "name": "Donte DiVincenzo",
      "hierarchy": "high_end_starter",
      "roles": [
        "secondary_handler",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "3547239",
      "name": "LaMelo Ball",
      "hierarchy": "second_option",
      "roles": [
        "primary_handler",
        "primary_playmaker",
        "deep_range_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "17895983",
      "name": "Ayo Dosunmu",
      "hierarchy": "starter",
      "roles": [
        "secondary_handler",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "1028029291",
      "name": "Cody Williams",
      "hierarchy": "key_rotation",
      "roles": [
        "three_d_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "17553979",
      "name": "Jonathan Kuminga",
      "hierarchy": "sixth_man",
      "roles": [
        "energy_wing",
        "spot_up_shooter",
        "rebounder"
      ]
    },
    {
      "playerId": "17896031",
      "name": "Nah'Shon Hyland",
      "hierarchy": "bench_scorer",
      "roles": [
        "secondary_handler",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "1059635020",
      "name": "Payton Sandfort",
      "hierarchy": "bench_scorer",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "56677851",
      "name": "Jaylen Clark",
      "hierarchy": "rotation_player",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "1028028501",
      "name": "Terrence Shannon Jr.",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1028045812",
      "name": "Enrique Freeman",
      "hierarchy": "depth_piece",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1028112004",
      "name": "Zyon Pullin",
      "hierarchy": "depth_piece",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "1057271099",
      "name": "Joan Beringer",
      "hierarchy": "depth_piece",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1057397172",
      "name": "Rocco Zikarsky",
      "hierarchy": "depth_piece",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    }
  ],
  "nba-lakers": [
    {
      "playerId": "132",
      "name": "Luka Doncic",
      "hierarchy": "first_option",
      "roles": [
        "primary_handler",
        "primary_playmaker",
        "iso_scorer",
        "late_clock_creator"
      ]
    },
    {
      "playerId": "17553995",
      "name": "Austin Reaves",
      "hierarchy": "second_option",
      "roles": [
        "secondary_handler",
        "shot_creator",
        "pnr_handler",
        "efficient_scorer"
      ]
    },
    {
      "playerId": "38017705",
      "name": "Walker Kessler",
      "hierarchy": "high_end_starter",
      "roles": [
        "rim_protector",
        "roll_man",
        "glass_cleaner"
      ]
    },
    {
      "playerId": "17895858",
      "name": "Quentin Grimes",
      "hierarchy": "starter",
      "roles": [
        "secondary_handler",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "38017728",
      "name": "Jake LaRavia",
      "hierarchy": "starter",
      "roles": [
        "three_d_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "413",
      "name": "Collin Sexton",
      "hierarchy": "third_option",
      "roles": [
        "secondary_handler",
        "shot_creator",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "17896027",
      "name": "Ziaire Williams",
      "hierarchy": "key_rotation",
      "roles": [
        "energy_wing",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "17896059",
      "name": "Sandro Mamukelashvili",
      "hierarchy": "key_rotation",
      "roles": [
        "energy_wing",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "457",
      "name": "Jarred Vanderbilt",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "666923",
      "name": "Matisse Thybulle",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "38017679",
      "name": "Jaden Hardy",
      "hierarchy": "bench_scorer",
      "roles": [
        "combo_guard",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "282",
      "name": "Kevon Looney",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player",
        "rebounder"
      ]
    },
    {
      "playerId": "1028026974",
      "name": "Dalton Knecht",
      "hierarchy": "depth_piece",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1028046517",
      "name": "Bronny James",
      "hierarchy": "depth_piece",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "1057386376",
      "name": "Adou Thiero",
      "hierarchy": "end_of_bench",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "1057847504",
      "name": "Chris Mañon",
      "hierarchy": "end_of_bench",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    }
  ],
  "nba-hawks": [
    {
      "playerId": "17896040",
      "name": "Jalen Johnson",
      "hierarchy": "first_option",
      "roles": [
        "big_wing",
        "primary_playmaker",
        "rim_pressure",
        "transition_threat"
      ]
    },
    {
      "playerId": "666400",
      "name": "Nickeil Alexander-Walker",
      "hierarchy": "second_option",
      "roles": [
        "secondary_handler",
        "shot_creator",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "38017677",
      "name": "Dyson Daniels",
      "hierarchy": "high_end_starter",
      "roles": [
        "guard_defender",
        "poa_defender",
        "secondary_playmaker",
        "transition_threat"
      ]
    },
    {
      "playerId": "3547244",
      "name": "Onyeka Okongwu",
      "hierarchy": "high_end_starter",
      "roles": [
        "rebounder",
        "passing_big",
        "roll_man"
      ]
    },
    {
      "playerId": "303",
      "name": "CJ McCollum",
      "hierarchy": "third_option",
      "roles": [
        "secondary_handler",
        "shot_creator",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "666541",
      "name": "Luguentz Dort",
      "hierarchy": "starter",
      "roles": [
        "physical_wing",
        "poa_defender",
        "corner_shooter"
      ]
    },
    {
      "playerId": "19465326",
      "name": "Jock Landale",
      "hierarchy": "key_rotation",
      "roles": [
        "backup_big",
        "paint_finisher",
        "roll_man"
      ]
    },
    {
      "playerId": "17896078",
      "name": "Aaron Wiggins",
      "hierarchy": "key_rotation",
      "roles": [
        "combo_guard",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "17896045",
      "name": "Corey Kispert",
      "hierarchy": "bench_scorer",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1057846172",
      "name": "Keshon Gilbert",
      "hierarchy": "rotation_player",
      "roles": [
        "secondary_handler",
        "connector_guard"
      ]
    },
    {
      "playerId": "158",
      "name": "Dorian Finney-Smith",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "56677722",
      "name": "Jalen Wilson",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "56677806",
      "name": "Mouhamed Gueye",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1028274126",
      "name": "RayJ Dennis",
      "hierarchy": "rotation_player",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "1057279093",
      "name": "Asa Newell",
      "hierarchy": "depth_piece",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    }
  ],
  "nba-grizzlies": [
    {
      "playerId": "182",
      "name": "Jerami Grant",
      "hierarchy": "second_option",
      "roles": [
        "slashing_wing",
        "spot_up_shooter",
        "cns_shooter"
      ]
    },
    {
      "playerId": "1028039105",
      "name": "Jaylen Wells",
      "hierarchy": "starter",
      "roles": [
        "three_d_wing",
        "spot_up_shooter",
        "cns_shooter"
      ]
    },
    {
      "playerId": "1057266649",
      "name": "Cedric Coward",
      "hierarchy": "third_option",
      "roles": [
        "secondary_handler",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "1028025754",
      "name": "Zach Edey",
      "hierarchy": "starter",
      "roles": [
        "post_scorer",
        "roll_man",
        "glass_cleaner",
        "rim_protector"
      ]
    },
    {
      "playerId": "1028048549",
      "name": "Cam Spencer",
      "hierarchy": "key_rotation",
      "roles": [
        "playmaker",
        "spot_up_shooter",
        "pnr_handler"
      ]
    },
    {
      "playerId": "56677791",
      "name": "Kris Murray",
      "hierarchy": "key_rotation",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "3547267",
      "name": "Isaiah Stewart",
      "hierarchy": "key_rotation",
      "roles": [
        "backup_big",
        "paint_finisher",
        "roll_man"
      ]
    },
    {
      "playerId": "666676",
      "name": "Ty Jerome",
      "hierarchy": "first_option",
      "roles": [
        "playmaker",
        "shot_creator"
      ]
    },
    {
      "playerId": "1057394959",
      "name": "Jahmai Mashack",
      "hierarchy": "key_rotation",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "56677830",
      "name": "GG Jackson",
      "hierarchy": "sixth_man",
      "roles": [
        "energy_wing",
        "spot_up_shooter",
        "cns_shooter"
      ]
    },
    {
      "playerId": "38017656",
      "name": "Scotty Pippen Jr.",
      "hierarchy": "key_rotation",
      "roles": [
        "secondary_handler",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "1057271583",
      "name": "Walter Clayton Jr.",
      "hierarchy": "key_rotation",
      "roles": [
        "secondary_handler",
        "connector_guard"
      ]
    },
    {
      "playerId": "1057396260",
      "name": "Javon Small",
      "hierarchy": "key_rotation",
      "roles": [
        "secondary_handler",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "405",
      "name": "D'Angelo Russell",
      "hierarchy": "bench_scorer",
      "roles": [
        "secondary_handler",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "56677824",
      "name": "Taylor Hendricks",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "56677859",
      "name": "Olivier-Maxence Prosper",
      "hierarchy": "bench_scorer",
      "roles": [
        "energy_wing",
        "spot_up_shooter"
      ]
    }
  ],
  "nba-blazers": [
    {
      "playerId": "3547242",
      "name": "Deni Avdija",
      "hierarchy": "first_option",
      "roles": [
        "primary_playmaker",
        "rim_pressure",
        "secondary_playmaker",
        "two_way_wing"
      ]
    },
    {
      "playerId": "56677850",
      "name": "Toumani Camara",
      "hierarchy": "high_end_starter",
      "roles": [
        "three_d_wing",
        "spot_up_shooter",
        "poa_defender"
      ]
    },
    {
      "playerId": "38017690",
      "name": "Shaedon Sharpe",
      "hierarchy": "second_option",
      "roles": [
        "secondary_handler",
        "shot_creator",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "214",
      "name": "Jrue Holiday",
      "hierarchy": "starter",
      "roles": [
        "guard_defender",
        "secondary_playmaker",
        "connector_guard"
      ]
    },
    {
      "playerId": "666786",
      "name": "Ja Morant",
      "hierarchy": "third_option",
      "roles": [
        "primary_handler",
        "rim_pressure",
        "primary_playmaker",
        "transition_threat"
      ]
    },
    {
      "playerId": "1028025344",
      "name": "Donovan Clingan",
      "hierarchy": "starter",
      "roles": [
        "rim_protector",
        "glass_cleaner",
        "roll_man"
      ]
    },
    {
      "playerId": "56677747",
      "name": "Scoot Henderson",
      "hierarchy": "sixth_man",
      "roles": [
        "secondary_handler",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "4197387",
      "name": "Vit Krejci",
      "hierarchy": "key_rotation",
      "roles": [
        "combo_guard",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "19465584",
      "name": "Micah Potter",
      "hierarchy": "bench_scorer",
      "roles": [
        "energy_wing",
        "hustle_player",
        "rebounder"
      ]
    },
    {
      "playerId": "56677817",
      "name": "Sidy Cissoko",
      "hierarchy": "rotation_player",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "476",
      "name": "Robert Williams III",
      "hierarchy": "rotation_player",
      "roles": [
        "rebounder",
        "paint_finisher",
        "screen_setter",
        "rim_protector"
      ]
    },
    {
      "playerId": "1028218679",
      "name": "Branden Carlson",
      "hierarchy": "depth_piece",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    },
    {
      "playerId": "38017699",
      "name": "Jeremy Sochan",
      "hierarchy": "depth_piece",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1057396603",
      "name": "John Tonje",
      "hierarchy": "depth_piece",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "1057275769",
      "name": "Hansen Yang",
      "hierarchy": "depth_piece",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    },
    {
      "playerId": "1057849685",
      "name": "Chris Youngblood",
      "hierarchy": "end_of_bench",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    }
  ],
  "nba-mavericks": [
    {
      "playerId": "1057262088",
      "name": "Cooper Flagg",
      "hierarchy": "first_option",
      "roles": [
        "two_way_wing",
        "shot_creator",
        "help_defender",
        "secondary_playmaker"
      ]
    },
    {
      "playerId": "666950",
      "name": "P.J. Washington",
      "hierarchy": "third_option",
      "roles": [
        "slashing_wing",
        "spot_up_shooter",
        "rebounder"
      ]
    },
    {
      "playerId": "3547293",
      "name": "Naji Marshall",
      "hierarchy": "second_option",
      "roles": [
        "slashing_wing",
        "secondary_playmaker",
        "cns_shooter"
      ]
    },
    {
      "playerId": "38017697",
      "name": "Max Christie",
      "hierarchy": "starter",
      "roles": [
        "combo_guard",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "17896067",
      "name": "Santi Aldama",
      "hierarchy": "starter",
      "roles": [
        "slashing_wing",
        "spot_up_shooter",
        "rebounder"
      ]
    },
    {
      "playerId": "1028028244",
      "name": "Zaccharie Risacher",
      "hierarchy": "key_rotation",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "666577",
      "name": "Daniel Gafford",
      "hierarchy": "key_rotation",
      "roles": [
        "roll_man",
        "lob_threat",
        "rim_protector"
      ]
    },
    {
      "playerId": "1057848244",
      "name": "John Poulakidas",
      "hierarchy": "bench_scorer",
      "roles": [
        "combo_guard",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "56677840",
      "name": "Dereck Lively II",
      "hierarchy": "rotation_player",
      "roles": [
        "roll_man",
        "lob_threat",
        "rim_protector",
        "short_roll_playmaker"
      ]
    },
    {
      "playerId": "666747",
      "name": "Caleb Martin",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1057845382",
      "name": "Moussa Cisse",
      "hierarchy": "rotation_player",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    },
    {
      "playerId": "56677839",
      "name": "Jett Howard",
      "hierarchy": "rotation_player",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "56677792",
      "name": "Marcus Sasser",
      "hierarchy": "rotation_player",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    }
  ],
  "nba-pacers": [
    {
      "playerId": "416",
      "name": "Pascal Siakam",
      "hierarchy": "first_option",
      "roles": [
        "big_wing",
        "mismatch_scorer",
        "transition_threat",
        "secondary_playmaker"
      ]
    },
    {
      "playerId": "360",
      "name": "Kelly Oubre Jr.",
      "hierarchy": "third_option",
      "roles": [
        "slashing_wing",
        "spot_up_shooter",
        "rebounder"
      ]
    },
    {
      "playerId": "38017507",
      "name": "Andrew Nembhard",
      "hierarchy": "second_option",
      "roles": [
        "lead_guard",
        "pnr_handler",
        "playmaker",
        "poa_defender"
      ]
    },
    {
      "playerId": "493",
      "name": "Ivica Zubac",
      "hierarchy": "high_end_starter",
      "roles": [
        "post_scorer",
        "roll_man",
        "glass_cleaner"
      ]
    },
    {
      "playerId": "3547250",
      "name": "Aaron Nesmith",
      "hierarchy": "starter",
      "roles": [
        "three_d_wing",
        "spot_up_shooter",
        "cns_shooter"
      ]
    },
    {
      "playerId": "56677832",
      "name": "Jarace Walker",
      "hierarchy": "starter",
      "roles": [
        "three_d_wing",
        "spot_up_shooter",
        "rebounder"
      ]
    },
    {
      "playerId": "56677862",
      "name": "Jalen Slawson",
      "hierarchy": "key_rotation",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "56677861",
      "name": "Ben Sheppard",
      "hierarchy": "key_rotation",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "17896103",
      "name": "Jay Huff",
      "hierarchy": "key_rotation",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    },
    {
      "playerId": "1028035897",
      "name": "Johnny Furphy",
      "hierarchy": "rotation_player",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "44477085",
      "name": "Quenton Jackson",
      "hierarchy": "bench_scorer",
      "roles": [
        "secondary_handler",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "3547243",
      "name": "Obi Toppin",
      "hierarchy": "bench_scorer",
      "roles": [
        "energy_wing",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "304",
      "name": "T.J. McConnell",
      "hierarchy": "bench_scorer",
      "roles": [
        "playmaker",
        "paint_touch_creator",
        "table_setter",
        "poa_defender"
      ]
    },
    {
      "playerId": "56677849",
      "name": "Kobe Brown",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "340",
      "name": "Larry Nance Jr.",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    }
  ],
  "nba-pelicans": [
    {
      "playerId": "18677986",
      "name": "Trey Murphy III",
      "hierarchy": "second_option",
      "roles": [
        "slashing_wing",
        "secondary_playmaker",
        "rebounder"
      ]
    },
    {
      "playerId": "3547256",
      "name": "Saddiq Bey",
      "hierarchy": "third_option",
      "roles": [
        "slashing_wing",
        "spot_up_shooter",
        "rebounder"
      ]
    },
    {
      "playerId": "38017686",
      "name": "Bennedict Mathurin",
      "hierarchy": "high_end_starter",
      "roles": [
        "slashing_wing",
        "spot_up_shooter",
        "rebounder"
      ]
    },
    {
      "playerId": "666969",
      "name": "Zion Williamson",
      "hierarchy": "first_option",
      "roles": [
        "physical_wing",
        "rim_pressure",
        "paint_finisher",
        "advantage_creator"
      ]
    },
    {
      "playerId": "17896024",
      "name": "Herbert Jones",
      "hierarchy": "starter",
      "roles": [
        "defensive_wing",
        "wing_stopper",
        "help_defender",
        "cns_shooter"
      ]
    },
    {
      "playerId": "334",
      "name": "Dejounte Murray",
      "hierarchy": "starter",
      "roles": [
        "primary_handler",
        "playmaker",
        "midrange_scorer",
        "guard_defender"
      ]
    },
    {
      "playerId": "1057267077",
      "name": "Jeremiah Fears",
      "hierarchy": "starter",
      "roles": [
        "secondary_handler",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "1057274415",
      "name": "Derik Queen",
      "hierarchy": "starter",
      "roles": [
        "rebounder",
        "passing_big",
        "roll_man"
      ]
    },
    {
      "playerId": "666848",
      "name": "Jordan Poole",
      "hierarchy": "sixth_man",
      "roles": [
        "secondary_handler",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "38017708",
      "name": "Bryce McGowens",
      "hierarchy": "key_rotation",
      "roles": [
        "combo_guard",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "1028027567",
      "name": "Yves Missi",
      "hierarchy": "rotation_player",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    },
    {
      "playerId": "250",
      "name": "DeAndre Jordan",
      "hierarchy": "rotation_player",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    },
    {
      "playerId": "17896058",
      "name": "Trendon Watford",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1028245777",
      "name": "Karlo Matkovic",
      "hierarchy": "rotation_player",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    },
    {
      "playerId": "38017710",
      "name": "Christian Koloko",
      "hierarchy": "rotation_player",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    },
    {
      "playerId": "1028026717",
      "name": "AJ Johnson",
      "hierarchy": "depth_piece",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    }
  ],
  "nba-bucks": [
    {
      "playerId": "666849",
      "name": "Kevin Porter Jr.",
      "hierarchy": "second_option",
      "roles": [
        "playmaker",
        "shot_creator",
        "pnr_handler"
      ]
    },
    {
      "playerId": "38017712",
      "name": "Ryan Rollins",
      "hierarchy": "third_option",
      "roles": [
        "playmaker",
        "shot_creator",
        "pnr_handler"
      ]
    },
    {
      "playerId": "666633",
      "name": "Tyler Herro",
      "hierarchy": "first_option",
      "roles": [
        "shot_creator",
        "pull_up_shooter",
        "secondary_handler",
        "movement_shooter"
      ]
    },
    {
      "playerId": "38017733",
      "name": "A.J. Green",
      "hierarchy": "starter",
      "roles": [
        "combo_guard",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "56677785",
      "name": "Jaime Jaquez Jr.",
      "hierarchy": "starter",
      "roles": [
        "secondary_handler",
        "shot_creator",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "452",
      "name": "Myles Turner",
      "hierarchy": "starter",
      "roles": [
        "stretch_5",
        "rim_protector",
        "floor_spacer"
      ]
    },
    {
      "playerId": "265",
      "name": "Kyle Kuzma",
      "hierarchy": "starter",
      "roles": [
        "three_d_wing",
        "spot_up_shooter",
        "cns_shooter"
      ]
    },
    {
      "playerId": "1028266882",
      "name": "Cormac Ryan",
      "hierarchy": "sixth_man",
      "roles": [
        "combo_guard",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "1028029127",
      "name": "Kel'el Ware",
      "hierarchy": "key_rotation",
      "roles": [
        "rebounder",
        "paint_finisher",
        "roll_man"
      ]
    },
    {
      "playerId": "3089",
      "name": "Gary Trent Jr.",
      "hierarchy": "key_rotation",
      "roles": [
        "combo_guard",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "17896063",
      "name": "Jericho Sims",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player",
        "rebounder"
      ]
    },
    {
      "playerId": "38017716",
      "name": "Ousmane Dieng",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "277",
      "name": "Caris LeVert",
      "hierarchy": "rotation_player",
      "roles": [
        "secondary_handler",
        "connector_guard"
      ]
    },
    {
      "playerId": "1057272939",
      "name": "Kasparas Jakučionis",
      "hierarchy": "rotation_player",
      "roles": [
        "secondary_handler",
        "connector_guard"
      ]
    },
    {
      "playerId": "1057389374",
      "name": "Kam Jones",
      "hierarchy": "rotation_player",
      "roles": [
        "secondary_handler",
        "connector_guard"
      ]
    },
    {
      "playerId": "64270026",
      "name": "Pete Nance",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    }
  ],
  "nba-kings": [
    {
      "playerId": "38017688",
      "name": "Keegan Murray",
      "hierarchy": "third_option",
      "roles": [
        "three_d_wing",
        "spot_up_shooter",
        "floor_spacer"
      ]
    },
    {
      "playerId": "268",
      "name": "Zach LaVine",
      "hierarchy": "first_option",
      "roles": [
        "three_level_scorer",
        "shot_creator",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "406",
      "name": "Domantas Sabonis",
      "hierarchy": "second_option",
      "roles": [
        "hub_big",
        "rebounder",
        "dho_hub",
        "post_scorer"
      ]
    },
    {
      "playerId": "1057390745",
      "name": "Maxime Raynaud",
      "hierarchy": "starter",
      "roles": [
        "rebounder",
        "paint_finisher",
        "roll_man"
      ]
    },
    {
      "playerId": "1028246478",
      "name": "Daeqwon Plowden",
      "hierarchy": "starter",
      "roles": [
        "three_d_wing",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "666656",
      "name": "De'Andre Hunter",
      "hierarchy": "starter",
      "roles": [
        "three_d_wing",
        "spot_up_shooter",
        "cns_shooter"
      ]
    },
    {
      "playerId": "1057276634",
      "name": "Nique Clifford",
      "hierarchy": "starter",
      "roles": [
        "combo_guard",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "3547249",
      "name": "Precious Achiuwa",
      "hierarchy": "key_rotation",
      "roles": [
        "energy_wing",
        "spot_up_shooter",
        "rebounder"
      ]
    },
    {
      "playerId": "324",
      "name": "Malik Monk",
      "hierarchy": "sixth_man",
      "roles": [
        "playmaker",
        "shot_creator",
        "secondary_playmaker",
        "spark_plug"
      ]
    },
    {
      "playerId": "1057845274",
      "name": "Dylan Cardwell",
      "hierarchy": "key_rotation",
      "roles": [
        "rebounder",
        "paint_finisher",
        "screen_setter"
      ]
    },
    {
      "playerId": "1028037494",
      "name": "Jonathan Mogbo",
      "hierarchy": "end_of_bench",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    }
  ],
  "nba-nets": [
    {
      "playerId": "387",
      "name": "Julius Randle",
      "hierarchy": "second_option",
      "roles": [
        "primary_playmaker",
        "mismatch_scorer",
        "secondary_playmaker",
        "rebounder"
      ]
    },
    {
      "playerId": "375",
      "name": "Michael Porter Jr.",
      "hierarchy": "first_option",
      "roles": [
        "big_wing",
        "movement_shooter",
        "efficient_scorer",
        "rebounder"
      ]
    },
    {
      "playerId": "56677843",
      "name": "Noah Clowney",
      "hierarchy": "third_option",
      "roles": [
        "three_d_wing",
        "spot_up_shooter",
        "cns_shooter"
      ]
    },
    {
      "playerId": "1057266813",
      "name": "Egor Demin",
      "hierarchy": "starter",
      "roles": [
        "secondary_handler",
        "spot_up_shooter",
        "pull_up_shooter"
      ]
    },
    {
      "playerId": "666743",
      "name": "Terance Mann",
      "hierarchy": "key_rotation",
      "roles": [
        "secondary_handler",
        "connector_guard"
      ]
    },
    {
      "playerId": "1057275262",
      "name": "Nolan Traoré",
      "hierarchy": "key_rotation",
      "roles": [
        "secondary_handler",
        "spot_up_shooter"
      ]
    },
    {
      "playerId": "1057279425",
      "name": "Drake Powell",
      "hierarchy": "key_rotation",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "1057280779",
      "name": "Danny Wolf",
      "hierarchy": "key_rotation",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    },
    {
      "playerId": "1057279760",
      "name": "Ben Saraf",
      "hierarchy": "key_rotation",
      "roles": [
        "secondary_handler",
        "connector_guard"
      ]
    },
    {
      "playerId": "38017714",
      "name": "Keon Ellis",
      "hierarchy": "key_rotation",
      "roles": [
        "combo_guard",
        "connector_guard"
      ]
    },
    {
      "playerId": "1057846840",
      "name": "Chaney Johnson",
      "hierarchy": "key_rotation",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "17896038",
      "name": "Day'Ron Sharpe",
      "hierarchy": "bench_scorer",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    },
    {
      "playerId": "38017715",
      "name": "Josh Minott",
      "hierarchy": "rotation_player",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    },
    {
      "playerId": "462",
      "name": "Moritz Wagner",
      "hierarchy": "depth_piece",
      "roles": [
        "backup_big",
        "paint_finisher",
        "screen_setter"
      ]
    },
    {
      "playerId": "1059875475",
      "name": "Grant Nelson",
      "hierarchy": "depth_piece",
      "roles": [
        "energy_wing",
        "hustle_player"
      ]
    }
  ]
};
