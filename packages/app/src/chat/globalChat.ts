/**
 * Global Chat data (app only). No server call yet: sending appends locally.
 * When the server endpoint exists, fill in `sendToServer` and poll/stream into
 * the panel's message list. Never put chat in packages/sim (INVARIANTS 6, 17).
 */

export interface ChatMessage {
  id: string;
  author: string;
  text: string;
  /** Epoch milliseconds. */
  at: number;
  /** True for messages this client sent and has not had echoed by a server. */
  local?: boolean;
}

/** Max characters per message; the input enforces it too. */
export const CHAT_MAX_LEN = 240;
/** Keep the visible list short. Older messages drop off the top. */
export const CHAT_MAX_MESSAGES = 50;

/** Placeholder messages so the panel is not empty before the server feed exists. */
export const SEED_CHAT: readonly ChatMessage[] = [
  { id: "seed-1", author: "Herald", text: "Welcome to the Global Chat. Messages stay on your screen for now.", at: Date.UTC(2026, 10, 25, 9, 0) },
  { id: "seed-2", author: "Marshal Wren", text: "Anyone else push the river province before winter?", at: Date.UTC(2026, 10, 25, 9, 4) },
  { id: "seed-3", author: "Steward Ilse", text: "Granary first, then walls. Learned that the hard way.", at: Date.UTC(2026, 10, 25, 9, 7) },
];

/** Trim and clamp; returns "" for blank input (caller should not send). */
export function cleanChatText(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, CHAT_MAX_LEN);
}

/** Append a message and cap the list length. Pure, for tests and the panel. */
export function appendChat(list: readonly ChatMessage[], msg: ChatMessage): ChatMessage[] {
  const next = [...list, msg];
  return next.length > CHAT_MAX_MESSAGES ? next.slice(next.length - CHAT_MAX_MESSAGES) : next;
}

let localSeq = 0;

/** Build a local message from what the player typed. Returns null for blank text. */
export function makeLocalMessage(author: string, raw: string, now: number = Date.now()): ChatMessage | null {
  const text = cleanChatText(raw);
  if (!text) return null;
  localSeq += 1;
  return { id: `local-${now}-${localSeq}`, author, text, at: now, local: true };
}

/** "09:04" in the player's local time. */
export function formatChatTime(at: number): string {
  const d = new Date(at);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function chatSummary(list: readonly ChatMessage[]): string {
  if (list.length === 0) return "No messages";
  const last = list[list.length - 1];
  return `${list.length} · ${last.author}`;
}

/**
 * FUTURE SERVER SEND — placeholder.
 *
 * Wire this to the Oracle server (server/index.mjs) once a chat endpoint exists,
 * e.g. `POST /api/chat { author, text }`. Expected shape when done:
 *
 *   const res = await fetch("/api/chat", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({ author: msg.author, text: msg.text }),
 *   });
 *   return res.ok;
 *
 * Today it does nothing and resolves `false` (meaning "not delivered to server").
 * The panel has already appended the message locally before calling this.
 */
export async function sendToServer(_msg: ChatMessage): Promise<boolean> {
  return false;
}
