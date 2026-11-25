import React from "react";
import { Fold } from "../hud/Fold";
import {
  CHAT_MAX_LEN,
  SEED_CHAT,
  appendChat,
  chatSummary,
  formatChatTime,
  makeLocalMessage,
  sendToServer,
  type ChatMessage,
} from "./globalChat";
import "./global-chat.css";
import "./chat-living.css";

export const CHAT_ARRIVAL_MS = 900;

/** Returns the newest message id when the tail changes after initial mount, else null. */
export function detectNewChatMessageId(
  prevLastId: string | null,
  messages: readonly ChatMessage[],
): string | null {
  if (!prevLastId || messages.length === 0) return null;
  const last = messages[messages.length - 1];
  return last && last.id !== prevLastId ? last.id : null;
}

/**
 * Floating Global Chat (bottom-right of the shell, every tab).
 * Local only: Send appends to this component's state, then calls the
 * `sendToServer` placeholder in ./globalChat.ts (a no-op until the server has an endpoint).
 */
export function GlobalChatPanel(props: {
  initial?: readonly ChatMessage[];
  author?: string;
  /** Deterministic override for SSR / render tests. */
  arrivalOverrideId?: string;
}) {
  const author = props.author ?? "You";
  const [messages, setMessages] = React.useState<ChatMessage[]>(() => [...(props.initial ?? SEED_CHAT)]);
  const [draft, setDraft] = React.useState("");
  const [arrivalId, setArrivalId] = React.useState<string | null>(null);
  const listRef = React.useRef<HTMLOListElement | null>(null);
  const initialIdsRef = React.useRef<Set<string>>(new Set(messages.map((m) => m.id)));
  const prevLastIdRef = React.useRef<string | null>(messages[messages.length - 1]?.id ?? null);
  const activeArrivalId = props.arrivalOverrideId ?? arrivalId;

  React.useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;

    const arrived = detectNewChatMessageId(prevLastIdRef.current, messages);
    prevLastIdRef.current = messages[messages.length - 1]?.id ?? null;
    if (!arrived || typeof window === "undefined") return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return undefined;

    setArrivalId(arrived);
    const timer = window.setTimeout(() => setArrivalId(null), CHAT_ARRIVAL_MS);
    return () => window.clearTimeout(timer);
  }, [messages]);

  const send = (ev?: React.FormEvent) => {
    ev?.preventDefault();
    const msg = makeLocalMessage(author, draft);
    if (!msg) return;
    setMessages((list) => appendChat(list, msg));
    setDraft("");
    void sendToServer(msg); // placeholder: no server call yet
  };

  return (
    <aside
      className="sc-chat-float"
      aria-label="Global Chat"
      data-chat-arrival={activeArrivalId ? "true" : "false"}
    >
      <Fold
        id="global-chat"
        title={
          <span className="sc-chat-title-wrap">
            <span
              className="sc-chat-presence-pip"
              title="Global Chat online"
              aria-hidden="true"
              style={{ pointerEvents: "none" }}
            />
            <span>Global Chat</span>
          </span>
        }
        summary={chatSummary(messages)}
        noisy
        className={`sc-chat-fold${activeArrivalId ? " has-new-message" : ""}`}
      >
        <ol className="sc-chat-list" ref={listRef}>
          {messages.map((m) => {
            const isEntering = !initialIdsRef.current.has(m.id) || m.id === props.arrivalOverrideId;
            return (
              <li
                key={m.id}
                className={`sc-work-card sc-chat-msg${m.local ? " is-local" : ""}${isEntering ? " is-entering" : ""}`}
                data-chat-id={m.id}
              >
                <div className="sc-chat-meta">
                  <span className="sc-chat-author">{m.author}</span>
                  <time className="sc-chat-time" dateTime={new Date(m.at).toISOString()}>{formatChatTime(m.at)}</time>
                </div>
                <p className="sc-chat-text">{m.text}</p>
              </li>
            );
          })}
        </ol>
        <form className="sc-chat-form" onSubmit={send}>
          <input
            className="sc-chat-input"
            type="text"
            value={draft}
            maxLength={CHAT_MAX_LEN}
            placeholder="Say something…"
            aria-label="Chat message"
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="sc-chat-send" disabled={!draft.trim()}>
            Send
          </button>
        </form>
        <p className="sc-chat-note">Local only for now. Others can't see your messages yet.</p>
      </Fold>
    </aside>
  );
}
