import React from "react";
import { Fold } from "../hud/Fold";
import {
  CHAT_CLOCK_TICK_MS,
  CHAT_MAX_LEN,
  SEED_CHAT,
  appendChat,
  chatSummary,
  formatChatRelative,
  formatChatStamp,
  isOwnMessage,
  makeLocalMessage,
  sendToServer,
  type ChatMessage,
} from "./globalChat";
import "./global-chat.css";
import "./chat-living.css";
import "./chat-polish.css";

export const CHAT_ARRIVAL_MS = 900;

/** Stand-in for "last id" once the list has been cleared after mount, so the next send still glows. */
const EMPTY_AFTER_MOUNT = "__chat-empty__";

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
  /** Fixed clock for SSR / render tests. When omitted the panel ticks every 30s. */
  now?: number;
}) {
  const author = props.author ?? "You";
  const [messages, setMessages] = React.useState<ChatMessage[]>(() => [...(props.initial ?? SEED_CHAT)]);
  const [draft, setDraft] = React.useState("");
  const [arrivalId, setArrivalId] = React.useState<string | null>(null);
  const listRef = React.useRef<HTMLOListElement | null>(null);
  const initialIdsRef = React.useRef<Set<string>>(new Set(messages.map((m) => m.id)));
  const prevLastIdRef = React.useRef<string | null>(messages[messages.length - 1]?.id ?? null);
  const activeArrivalId = props.arrivalOverrideId ?? arrivalId;
  const [clock, setClock] = React.useState(() => Date.now());
  const now = props.now ?? clock;

  React.useEffect(() => {
    if (props.now !== undefined || typeof window === "undefined") return undefined;
    const timer = window.setInterval(() => setClock(Date.now()), CHAT_CLOCK_TICK_MS);
    return () => window.clearInterval(timer);
  }, [props.now]);

  React.useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;

    const arrived = detectNewChatMessageId(prevLastIdRef.current, messages);
    prevLastIdRef.current = messages[messages.length - 1]?.id ?? EMPTY_AFTER_MOUNT;
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
    setClock(Date.now());
    void sendToServer(msg); // the one server seam; a no-op until the endpoint exists
  };

  /** Testing aid: wipes this tab's chat. Nothing is stored, so there is nothing else to clear. */
  const clearLocal = () => setMessages([]);
  const restoreSamples = () => setMessages([...SEED_CHAT]);

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
        <ol className="sc-chat-list" ref={listRef} aria-live="polite">
          {messages.length === 0 ? (
            <li className="sc-chat-empty">
              <span className="sc-chat-empty-glyph" aria-hidden="true">✦</span>
              <p className="sc-chat-empty-title">The hall is quiet.</p>
              <p className="sc-chat-empty-hint">Say something below to start the conversation.</p>
              <button type="button" className="sc-chat-linkbtn" onClick={restoreSamples}>
                Restore sample messages
              </button>
            </li>
          ) : (
            messages.map((m) => {
              const isEntering = !initialIdsRef.current.has(m.id) || m.id === props.arrivalOverrideId;
              const own = isOwnMessage(m, author);
              return (
                <li
                  key={m.id}
                  className={`sc-work-card sc-chat-msg${m.local ? " is-local" : ""}${own ? " is-own" : ""}${isEntering ? " is-entering" : ""}`}
                  data-chat-id={m.id}
                  data-chat-own={own ? "true" : "false"}
                >
                  <div className="sc-chat-meta">
                    <span className="sc-chat-author">
                      {m.author}
                      {m.local ? <span className="sc-chat-own-tag" title="Not sent to the server yet. Only you can see this.">only you</span> : null}
                    </span>
                    <time
                      className="sc-chat-time"
                      dateTime={new Date(m.at).toISOString()}
                      title={formatChatStamp(m.at)}
                    >
                      {formatChatRelative(m.at, now)}
                    </time>
                  </div>
                  <p className="sc-chat-text">{m.text}</p>
                </li>
              );
            })
          )}
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
        <div className="sc-chat-foot">
          <p className="sc-chat-note">
            <span className="sc-chat-note-badge">Local</span>
            Only you see these. Chat clears on reload.
          </p>
          <button
            type="button"
            className="sc-chat-linkbtn sc-chat-clear"
            onClick={clearLocal}
            disabled={messages.length === 0}
            title="Testing: clear this tab's chat"
          >
            Clear
          </button>
        </div>
      </Fold>
    </aside>
  );
}
