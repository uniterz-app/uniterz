/**
 * 登録メールのドメイン判定。
 * - 打ち間違い（gmail.con 等）は登録前に止めて正しい候補を出す（パスワード再設定メールが届かなくなるため）
 * - 使い捨てメールは招待コードの紐づけだけ拒否する（登録自体は許可）
 */

const POPULAR_DOMAINS = [
  "gmail.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "yahoo.co.jp",
  "yahoo.com",
  "ymail.ne.jp",
  "ezweb.ne.jp",
  "au.com",
  "docomo.ne.jp",
  "i.softbank.jp",
  "softbank.ne.jp",
  "ymobile.ne.jp",
  "hotmail.com",
  "hotmail.co.jp",
  "outlook.com",
  "outlook.jp",
  "live.com",
  "live.jp",
] as const;

/** 人気ドメインに近いが実在・正当なもの */
const LEGIT_NEAR_POPULAR = new Set([
  "mail.com",
  "email.com",
  "ymail.com",
  "gmx.com",
  "aol.com",
  "msn.com",
  "yahoo.ne.jp",
  "hotmail.co.uk",
  "yahoo.co.uk",
  "mozmail.com",
]);

/** 打ち間違いとして明示的に直すもの（編集距離で拾えないもの） */
const EXPLICIT_FIXES: Record<string, string> = {
  "i.softbank.com": "i.softbank.jp",
  "softbank.jp": "i.softbank.jp",
  "docomo.jp": "docomo.ne.jp",
  "ezweb.jp": "ezweb.ne.jp",
  "ezweb.com": "ezweb.ne.jp",
  "yahoo.jp": "yahoo.co.jp",
};

const DISPOSABLE_DOMAINS = new Set([
  // 捨てメアド（kuku.lu 系）
  "sute.jp",
  "addrin.uk",
  "fanclub.pm",
  "meruado.uk",
  "cream.pink",
  "stayhome.li",
  "quicksend.ch",
  "mama3.org",
  "f5.si",
  "heisei.be",
  "moimoi.re",
  "tapi.re",
  "haren.uk",
  "cocoro.uk",
  "usako.net",
  "nyasan.com",
  "dakaka.org",
  "furoi.com",
  "aisv.lt",
  "rakumail.jp",
  "na-cat.com",
  "eay.jp",
  "catgroup.uk",
  "tatsu.uk",
  "fuwamofu.com",
  "ruru.be",
  "nekosan.uk",
  "kagi.be",
  "fukurou.ch",
  "nezumi.be",
  "exdonuts.com",
  "honeys.be",
  "prin.be",
  "mbox.re",
  "hamham.uk",
  "choco.la",
  "instaddr.ch",
  "instaddr.uk",
  "instaddr.win",
  "magim.be",
  "mirai.re",
  "sofia.re",
  "mofu.be",
  "hotsoup.be",
  "svk.jp",
  // 海外の使い捨て
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "sharklasers.com",
  "10minutemail.com",
  "yopmail.com",
  "temp-mail.org",
  "tempmail.com",
  "trashmail.com",
  "getnada.com",
  "dispostable.com",
  "maildrop.cc",
  "throwawaymail.com",
  "emailondeck.com",
  "mohmal.com",
]);

export function emailDomainOf(email: string): string {
  const at = email.lastIndexOf("@");
  return at < 0 ? "" : email.slice(at + 1).trim().toLowerCase();
}

export function isDisposableEmail(email: string | null | undefined): boolean {
  const domain = emailDomainOf(String(email ?? ""));
  return domain !== "" && DISPOSABLE_DOMAINS.has(domain);
}

function editDistance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        diag + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      diag = tmp;
    }
  }
  return prev[b.length];
}

function fixDomain(domain: string): string | null {
  if (!domain || (POPULAR_DOMAINS as readonly string[]).includes(domain)) return null;
  if (LEGIT_NEAR_POPULAR.has(domain)) return null;
  if (EXPLICIT_FIXES[domain]) return EXPLICIT_FIXES[domain];

  let best: string | null = null;
  let bestDist = Infinity;
  for (const p of POPULAR_DOMAINS) {
    const d = editDistance(domain, p);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  const maxDist = domain.length >= 8 ? 2 : 1;
  if (best && bestDist <= maxDist) return best;

  // 人気ドメイン以外でも末尾の打ち間違いは直す（example.con → example.com）
  if (/\.(con|cpm|cmo|ocm|vom|xom|comm)$/.test(domain)) {
    return domain.replace(/\.[a-z]+$/, ".com");
  }
  if (/\.(ne|co|or|ac)\.(jo|jpp|op)$/.test(domain)) {
    return domain.replace(/\.[a-z]+$/, ".jp");
  }
  return null;
}

/** 打ち間違いと思われるとき、直したメールアドレスを返す。問題なければ null */
export function suggestEmailTypoFix(email: string): string | null {
  const trimmed = email.trim();
  const at = trimmed.lastIndexOf("@");
  if (at <= 0) return null;
  const fixed = fixDomain(trimmed.slice(at + 1).toLowerCase());
  return fixed ? `${trimmed.slice(0, at)}@${fixed}` : null;
}
