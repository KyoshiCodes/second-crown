import React from "react";
import { GAME_NEWS, sortedNews, type NewsEntry } from "./gameNews";

export const NEWS_SEEN_KEY = "sc-news-seen-id";
export const NEWS_SEEN_EVENT = "sc-news-seen-change";

/** Newest entry id after date sorting, or null when empty. */
export function latestNewsId(list: readonly NewsEntry[] = GAME_NEWS): string | null {
  return sortedNews(list)[0]?.id ?? null;
}

/** Reads the last seen news entry id from localStorage (SSR-safe). */
export function readLastSeenNewsId(): string | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage.getItem(NEWS_SEEN_KEY);
  } catch {
    return null;
  }
}

/** Counts how many entries appear ahead of `lastSeenId` (all entries if unseen or unknown). */
export function countUnreadNews(
  list: readonly NewsEntry[] = GAME_NEWS,
  lastSeenId: string | null = readLastSeenNewsId(),
): number {
  const ordered = sortedNews(list);
  if (ordered.length === 0) return 0;
  if (!lastSeenId) return ordered.length;
  const idx = ordered.findIndex((n) => n.id === lastSeenId);
  return idx === -1 ? ordered.length : idx;
}

/** True when at least one news entry has not been marked seen yet. */
export function hasUnreadNews(
  list: readonly NewsEntry[] = GAME_NEWS,
  lastSeenId: string | null = readLastSeenNewsId(),
): boolean {
  return countUnreadNews(list, lastSeenId) > 0;
}

/** Marks the latest news entry as seen in localStorage and notifies subscribers. */
export function markNewsSeen(list: readonly NewsEntry[] = GAME_NEWS): string | null {
  const latest = latestNewsId(list);
  if (!latest) return null;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(NEWS_SEEN_KEY, latest);
    }
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(NEWS_SEEN_EVENT, { detail: latest }));
    } catch {
      /* ignore */
    }
  }
  return latest;
}

export interface UnreadNewsSnapshot {
  unreadCount: number;
  hasUnread: boolean;
  latestId: string | null;
  markSeen: () => string | null;
}

/** React view of unread news count synchronized via sc-news-seen-change and storage events. */
export function useUnreadNews(list: readonly NewsEntry[] = GAME_NEWS): UnreadNewsSnapshot {
  const [seenId, setSeenId] = React.useState<string | null>(readLastSeenNewsId);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const sync = () => setSeenId(readLastSeenNewsId());
    window.addEventListener(NEWS_SEEN_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(NEWS_SEEN_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const markSeen = React.useCallback(() => markNewsSeen(list), [list]);
  const unreadCount = countUnreadNews(list, seenId);

  return {
    unreadCount,
    hasUnread: unreadCount > 0,
    latestId: latestNewsId(list),
    markSeen,
  };
}
