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
import { publishChatFeed } from "./chatFeed";
import "./global-chat.css";
import "./chat-living.css";
import "./chat-polish.css";
import "./chat-identity.css";

export const CHAT_ARRIVAL_MS = 900;
export const CHAT_JUST_SENT_MS = 2800;

export type ChatSenderCrestKind = "self" | "herald" | "peer";

/** Classifies a chat message sender into its miniature crest variant. */
export function resolveChatSenderCrest(msg: ChatMessage, author: string): ChatSenderCrestKind {
  if (isOwnMessage(msg, author)) return "self";
  if (msg.author.trim().toLowerCase() === "herald") return "herald";
  return "peer";
}

function ChatSenderPip({ crest }: { crest: ChatSenderCrestKind }) {
  return (
    <span
      className={`sc-chat-sender-pip sender-${crest}`}
      data-sender-crest={crest}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      {crest === "self" ? (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ pointerEvents: "none" }}>
          <path
            d="M1.5 9L2.4 3.8L4.8 6L6 2.8L7.2 6L9.6 3.8L10.5 9H1.5Z"
            fill="currentColor"
            fillOpacity="0.28"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
          <circle cx="6" cy="2.4" r="0.9" fill="currentColor" />
        </svg>
      ) : crest === "herald" ? (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ pointerEvents: "none" }}>
          <path
            d="M6 1.5L10.2 6L6 10.5L1.8 6L6 1.5Z"
            fill="currentColor"
            fillOpacity="0.24"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
          <circle cx="6" cy="6" r="1.35" fill="currentColor" />
        </svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ pointerEvents: "none" }}>
          <path
            d="M2.5 2.3H9.5V5.8C9.5 8.1 7.8 9.7 6 10.6C4.2 9.7 2.5 8.1 2.5 5.8V2.3Z"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="1.05"
            strokeLinejoin="round"
          />
          <circle cx="6" cy="5.7" r="1" fill="currentColor" />
        </svg>
      )}
    </span>
  );
}

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
 * server placeholder seam in ./globalChat.ts (a no-op until the server has an endpoint).
 */
export function GlobalChatPanel(props: {
  initial?: readonly ChatMessage[];
  author?: string;
  /** Deterministic override for SSR / render tests. */
  arrivalOverrideId?: string;
  /** Deterministic override for "just sent" SSR / render tests. */
  justSentOverrideId?: string;
  /** Initial draft text (useful for deterministic SSR tests). */
  initialDraft?: string;
  /** Fixed clock for SSR / render tests. When omitted the panel ticks every 30s. */
  now?: number;
}) {
  const author = props.author ?? "You";
  const [messages, setMessages] = React.useState<ChatMessage[]>(() => [...(props.initial ?? SEED_CHAT)]);
  const [draft, setDraft] = React.useState(() => props.initialDraft ?? "");
  const [arrivalId, setArrivalId] = React.useState<string | null>(null);
  const [justSentId, setJustSentId] = React.useState<string | null>(null);
  const listRef = React.useRef<HTMLOListElement | null>(null);
  const initialIdsRef = React.useRef<Set<string>>(new Set(messages.map((m) => m.id)));
  const prevLastIdRef = React.useRef<string | null>(messages[messages.length - 1]?.id ?? null);
  const justSentTimerRef = React.useRef<number | null>(null);
  const activeArrivalId = props.arrivalOverrideId ?? arrivalId;
  const activeJustSentId = props.justSentOverrideId ?? justSentId;
  const [clock, setClock] = React.useState(() => Date.now());
  const now = props.now ?? clock;
  const hasDraft = draft.trim().length > 0;

  React.useEffect(() => {
    if (props.now !== undefined || typeof window === "undefined") return undefined;
    const timer = window.setInterval(() => setClock(Date.now()), CHAT_CLOCK_TICK_MS);
    return () => window.clearInterval(timer);
  }, [props.now]);

  React.useEffect(() => {
    return () => {
      if (justSentTimerRef.current !== null && typeof window !== "undefined") {
        window.clearTimeout(justSentTimerRef.current);
      }
    };
  }, []);

  // Mirror the list for read-only panels (staff Admin panel). See ./chatFeed.ts.
  React.useEffect(() => {
    publishChatFeed(messages);
  }, [messages]);

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
    if (typeof window !== "undefined" && !window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      if (justSentTimerRef.current !== null) window.clearTimeout(justSentTimerRef.current);
      setJustSentId(msg.id);
      justSentTimerRef.current = window.setTimeout(() => {
        justSentTimerRef.current = null;
        setJustSentId(null);
      }, CHAT_JUST_SENT_MS);
    }
    void sendToServer(msg); // the one server seam; a no-op until the endpoint exists
  };

  /** Testing aid: wipes this tab's chat. Nothing is stored, so there is nothing else to clear. */
  const clearLocal = () => {
    if (justSentTimerRef.current !== null && typeof window !== "undefined") {
      window.clearTimeout(justSentTimerRef.current);
      justSentTimerRef.current = null;
    }
    setJustSentId(null);
    setMessages([]);
  };
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
              const crest = resolveChatSenderCrest(m, author);
              const justSent = m.id === activeJustSentId;
              return (
                <li
                  key={m.id}
                  className={`sc-work-card sc-chat-msg${m.local ? " is-local" : ""}${own ? " is-own" : ""}${isEntering ? " is-entering" : ""}${justSent ? " is-just-sent" : ""}`}
                  data-chat-id={m.id}
                  data-chat-own={own ? "true" : "false"}
                  data-just-sent={justSent ? "true" : undefined}
                >
                  <div className="sc-chat-meta">
                    <span className="sc-chat-author">
                      <ChatSenderPip crest={crest} />
                      {m.author}
                      {m.local ? <span className="sc-chat-own-tag" title="Not sent to the server yet. Only you can see this.">only you</span> : null}
                      {justSent ? (
                        <span className="sc-chat-just-sent-pill" aria-hidden="true" style={{ pointerEvents: "none" }}>
                          sent
                        </span>
                      ) : null}
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
          <button
            type="submit"
            className={`sc-chat-send${hasDraft ? " is-ready" : ""}`}
            data-send-ready={hasDraft ? "true" : "false"}
            disabled={!hasDraft}
          >
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
