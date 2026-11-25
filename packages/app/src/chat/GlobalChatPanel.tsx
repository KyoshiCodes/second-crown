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

/**
 * Floating Global Chat (bottom-right of the shell, every tab).
 * Local only: Send appends to this component's state, then calls the
 * `sendToServer` placeholder in ./globalChat.ts (a no-op until the server has an endpoint).
 */
export function GlobalChatPanel(props: { initial?: readonly ChatMessage[]; author?: string }) {
  const author = props.author ?? "You";
  const [messages, setMessages] = React.useState<ChatMessage[]>(() => [...(props.initial ?? SEED_CHAT)]);
  const [draft, setDraft] = React.useState("");
  const listRef = React.useRef<HTMLOListElement | null>(null);

  React.useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
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
    <aside className="sc-chat-float" aria-label="Global Chat">
      <Fold id="global-chat" title="Global Chat" summary={chatSummary(messages)} noisy className="sc-chat-fold">
        <ol className="sc-chat-list" ref={listRef}>
          {messages.map((m) => (
            <li key={m.id} className={`sc-work-card sc-chat-msg${m.local ? " is-local" : ""}`} data-chat-id={m.id}>
              <div className="sc-chat-meta">
                <span className="sc-chat-author">{m.author}</span>
                <time className="sc-chat-time" dateTime={new Date(m.at).toISOString()}>{formatChatTime(m.at)}</time>
              </div>
              <p className="sc-chat-text">{m.text}</p>
            </li>
          ))}
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
