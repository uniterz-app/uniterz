import type { Period, LeagueTab, Metric, RankingRow } from "@//lib/rankings/types";

const trunc = (s: string) => s;

// All/30d/Units 想定 20件
const ALL30_UNITS_BASE: RankingRow[] = [
  { uid:"u1",  displayName:trunc("Kiana Torff"),  photoURL:"", postsTotal:820, posts:38, hit:26, winRate:26/38, avgOdds:2.10, units:12.40 },
  { uid:"u2",  displayName:trunc("Abram Mango"),  photoURL:"", postsTotal:640, posts:41, hit:27, winRate:27/41, avgOdds:2.25, units:10.10 },
  { uid:"u3",  displayName:trunc("Alfonso Lubin"),photoURL:"", postsTotal:510, posts:33, hit:22, winRate:22/33, avgOdds:3.05, units:9.80 },
  { uid:"u4",  displayName:trunc("Maren Gouse"),  photoURL:"", postsTotal:480, posts:30, hit:19, winRate:19/30, avgOdds:2.70, units:8.10 },
  { uid:"u5",  displayName:trunc("Desirae Herwitz"), photoURL:"", postsTotal:720, posts:34, hit:22, winRate:22/34, avgOdds:2.55, units:7.20 },
  { uid:"u6",  displayName:trunc("Christopher"),  photoURL:"", postsTotal:300, posts:28, hit:16, winRate:16/28, avgOdds:2.20, units:6.90 },
  { uid:"u7",  displayName:trunc("HyperLong太郎"), photoURL:"", postsTotal:150, posts:25, hit:14, winRate:14/25, avgOdds:2.35, units:6.10 },
  { uid:"u8",  displayName:trunc("Mila Fox"),     photoURL:"", postsTotal:920, posts:45, hit:29, winRate:29/45, avgOdds:2.40, units:5.95 },
  { uid:"u9",  displayName:trunc("Noah A."),      photoURL:"", postsTotal:1100,posts:42, hit:26, winRate:26/42, avgOdds:3.00, units:5.60 },
  { uid:"u10", displayName:trunc("Liam K."),      photoURL:"", postsTotal:210, posts:18, hit:10, winRate:10/18, avgOdds:2.80, units:5.10 },
  { uid:"u11", displayName:trunc("Ava R."),       photoURL:"", postsTotal:260, posts:20, hit:11, winRate:11/20, avgOdds:2.65, units:4.90 },
  { uid:"u12", displayName:trunc("Emma"),         photoURL:"", postsTotal:560, posts:31, hit:18, winRate:18/31, avgOdds:3.10, units:4.40 },
  { uid:"u13", displayName:trunc("Olivia"),       photoURL:"", postsTotal:870, posts:39, hit:22, winRate:22/39, avgOdds:2.95, units:3.85 },
  { uid:"u14", displayName:trunc("James"),        photoURL:"", postsTotal:120, posts:12, hit:7,  winRate:7/12,  avgOdds:2.50, units:3.20 },
  { uid:"u15", displayName:trunc("Lucas"),        photoURL:"", postsTotal:190, posts:17, hit:9,  winRate:9/17,  avgOdds:2.20, units:2.70 },
  { uid:"u16", displayName:trunc("Mio"),          photoURL:"", postsTotal:980, posts:44, hit:24, winRate:24/44, avgOdds:5.00, units:2.40 },
  { uid:"u17", displayName:trunc("Sora"),         photoURL:"", postsTotal:75,  posts:11, hit:6,  winRate:6/11,  avgOdds:3.00, units:1.95 },
  { uid:"u18", displayName:trunc("Yui"),          photoURL:"", postsTotal:330, posts:22, hit:11, winRate:11/22, avgOdds:2.20, units:1.30 },
  { uid:"u19", displayName:trunc("Ren"),          photoURL:"", postsTotal:420, posts:29, hit:14, winRate:14/29, avgOdds:2.30, units:0.60 },
  { uid:"u20", displayName:trunc("Kai"),          photoURL:"", postsTotal:510, posts:35, hit:17, winRate:17/35, avgOdds:2.15, units:0.10 },
];

// All/30d/WinRate 想定 20件
const ALL30_WR_BASE: RankingRow[] = [
  { uid:"w1", displayName:trunc("Iris"), photoURL:"", postsTotal:400, posts:32, hit:23, winRate:23/32, avgOdds:2.25, units:8.10 },
  { uid:"w2", displayName:trunc("Leo"),  photoURL:"", postsTotal:700, posts:28, hit:19, winRate:19/28, avgOdds:2.40, units:7.20 },
  { uid:"w3", displayName:trunc("Nina"), photoURL:"", postsTotal:520, posts:31, hit:20, winRate:20/31, avgOdds:3.00, units:6.30 },
  { uid:"w4", displayName:trunc("Otis"), photoURL:"", postsTotal:600, posts:30, hit:19, winRate:19/30, avgOdds:2.60, units:5.90 },
  { uid:"w5", displayName:trunc("Pia"),  photoURL:"", postsTotal:180, posts:15, hit:10, winRate:10/15, avgOdds:2.20, units:4.10 },
  { uid:"w6", displayName:trunc("Quin"), photoURL:"", postsTotal:950, posts:40, hit:25, winRate:25/40, avgOdds:2.30, units:3.95 },
  { uid:"w7", displayName:trunc("Rio"),  photoURL:"", postsTotal:840, posts:37, hit:23, winRate:23/37, avgOdds:2.50, units:3.80 },
  { uid:"w8", displayName:trunc("Saya"), photoURL:"", postsTotal:210, posts:12, hit:8,  winRate:8/12,  avgOdds:2.10, units:3.10 },
  { uid:"w9", displayName:trunc("Tao"),  photoURL:"", postsTotal:300, posts:29, hit:18, winRate:18/29, avgOdds:2.90, units:2.50 },
  { uid:"w10",displayName:trunc("Una"),  photoURL:"", postsTotal:270, posts:20, hit:12, winRate:12/20, avgOdds:2.70, units:2.10 },
  { uid:"w11",displayName:trunc("Vic"),  photoURL:"", postsTotal:260, posts:22, hit:13, winRate:13/22, avgOdds:2.45, units:1.80 },
  { uid:"w12",displayName:trunc("Will"), photoURL:"", postsTotal:620, posts:34, hit:20, winRate:20/34, avgOdds:2.80, units:1.60 },
  { uid:"w13",displayName:trunc("Xiu"),  photoURL:"", postsTotal:430, posts:26, hit:15, winRate:15/26, avgOdds:2.30, units:1.30 },
  { uid:"w14",displayName:trunc("Yen"),  photoURL:"", postsTotal:150, posts:10, hit:6,  winRate:6/10,  avgOdds:2.20, units:1.10 },
  { uid:"w15",displayName:trunc("Zoe"),  photoURL:"", postsTotal:500, posts:33, hit:19, winRate:19/33, avgOdds:2.35, units:0.90 },
  { uid:"w16",displayName:trunc("Aki"),  photoURL:"", postsTotal:480, posts:30, hit:17, winRate:17/30, avgOdds:2.25, units:0.70 },
  { uid:"w17",displayName:trunc("Bo"),   photoURL:"", postsTotal:520, posts:31, hit:17, winRate:17/31, avgOdds:2.50, units:0.50 },
  { uid:"w18",displayName:trunc("Cai"),  photoURL:"", postsTotal:310, posts:21, hit:11, winRate:11/21, avgOdds:2.40, units:0.40 },
  { uid:"w19",displayName:trunc("Dan"),  photoURL:"", postsTotal:200, posts:18, hit:9,  winRate:9/18,  avgOdds:2.10, units:0.20 },
  { uid:"w20",displayName:trunc("Eve"),  photoURL:"", postsTotal:900, posts:45, hit:22, winRate:22/45, avgOdds:3.20, units:0.10 },
];

function sliceForLeague(rows: RankingRow[], league: LeagueTab): RankingRow[] {
  if (league === "all") return rows;
  // B1/J1 は 10件（Top3 + 4–10）
  return rows.slice(0, 10);
}

export function getMockRows(period: Period, league: LeagueTab, metric: Metric): RankingRow[] {
  const base = metric === "winRate" ? ALL30_WR_BASE : ALL30_UNITS_BASE;
  // 今回は period に関わらず同じデータを返す（UI検証目的）
  return sliceForLeague(base, league);
}
