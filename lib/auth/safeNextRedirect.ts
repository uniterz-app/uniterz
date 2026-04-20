const POST_ONBOARDING_REDIRECT_KEY = "post_onboarding_redirect";

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

/**
 * Returns a safe in-app path for Next.js router redirects.
 * Rejects empty values, external URLs, and protocol-relative paths.
 */
export function sanitizeInternalNext(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const value = raw.trim();
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;

  try {
    const parsed = new URL(value, "https://local.internal");
    if (parsed.origin !== "https://local.internal") return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

export function stashPostOnboardingRedirect(raw: string | null | undefined): void {
  if (!canUseSessionStorage()) return;
  const safe = sanitizeInternalNext(raw);
  if (!safe) {
    window.sessionStorage.removeItem(POST_ONBOARDING_REDIRECT_KEY);
    return;
  }
  window.sessionStorage.setItem(POST_ONBOARDING_REDIRECT_KEY, safe);
}

export function consumePostOnboardingRedirect(): string | null {
  if (!canUseSessionStorage()) return null;
  const raw = window.sessionStorage.getItem(POST_ONBOARDING_REDIRECT_KEY);
  window.sessionStorage.removeItem(POST_ONBOARDING_REDIRECT_KEY);
  return sanitizeInternalNext(raw);
}
