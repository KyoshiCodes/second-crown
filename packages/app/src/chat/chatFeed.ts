/**
 * Read-only mirror of the Global Chat list, so other app panels (the staff Admin
 * panel today) can see recent messages without owning chat state.
 *
 * GlobalChatPanel stays the owner: it calls `publishChatFeed` whenever its list
 * changes. Readers use `useChatFeed()`. App only, never packages/sim.
 *
 * When a server chat feed exists, the poll/stream that fills GlobalChatPanel keeps
 * publishing here, so readers need no change.
 */
import React from "react";
import { SEED_CHAT, type ChatMessage } from "./globalChat";

let feed: readonly ChatMessage[] = SEED_CHAT;
const listeners = new Set<() => void>();

export function publishChatFeed(list: readonly ChatMessage[]): void {
  if (list === feed) return;
  feed = list;
  listeners.forEach((fn) => fn());
}

export function getChatFeed(): readonly ChatMessage[] {
  return feed;
}

export function subscribeChatFeed(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useChatFeed(): readonly ChatMessage[] {
  return React.useSyncExternalStore(subscribeChatFeed, getChatFeed, getChatFeed);
}
