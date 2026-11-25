import React from "react";
import { GAME_NEWS, type NewsEntry } from "./gameNews";
import { useUnreadNews } from "./newsState";
import "./news-living.css";

export interface NewsUnreadBadgeProps {
  news?: readonly NewsEntry[];
  /** Deterministic override for SSR / render tests. */
  unreadOverride?: number;
}

/** Compact "What's new" indicator for the Crown tab when unread news exists. */
export function NewsUnreadBadge({ news = GAME_NEWS, unreadOverride }: NewsUnreadBadgeProps) {
  const { unreadCount: liveCount } = useUnreadNews(news);
  const unreadCount = unreadOverride ?? liveCount;
  if (unreadCount <= 0) return null;

  const label = `What's new: ${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`;
  return (
    <span
      className="sc-news-tab-badge"
      data-unread-count={unreadCount}
      title={label}
      aria-label={`What's new (${unreadCount} unread)`}
      style={{ pointerEvents: "none" }}
    >
      <span className="sc-news-tab-dot" aria-hidden="true" style={{ pointerEvents: "none" }} />
      <span className="sc-news-tab-label">New</span>
    </span>
  );
}
