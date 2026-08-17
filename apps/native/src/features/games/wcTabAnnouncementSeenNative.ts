/** Removed WC tab announcement — no-op prefs */
export async function readWcGamesTabAnnouncementSeenNative(): Promise<boolean> {
  return true;
}

export async function readWcTabAnnouncementSeenNative(): Promise<boolean> {
  return true;
}

export async function markWcGamesTabAnnouncementSeenNative(): Promise<void> {}

export async function writeWcTabAnnouncementSeenNative(_seen: boolean): Promise<void> {}
