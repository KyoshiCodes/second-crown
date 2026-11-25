import React from "react";
import { Fold } from "../hud/Fold";
import { useChatFeed } from "../chat/chatFeed";
import { formatChatRelative, isOwnMessage, type ChatMessage } from "../chat/globalChat";
import {
  MOD_ACTION_LABEL,
  fetchPlayerList,
  fetchServerStatus,
  moderatePlayer,
  setStaffFlag,
  useStaffFlag,
  type ModAction,
} from "./staff";
import "./admin-panel.css";

/** How many recent chat lines the moderation list shows. */
export const ADMIN_RECENT_LIMIT = 8;
export const ADMIN_TOAST_MS = 2600;
const MOD_ACTIONS: readonly ModAction[] = ["mute", "kick", "ban"];

/** Newest first, capped. Pure, for tests. */
export function recentForModeration(list: readonly ChatMessage[], limit = ADMIN_RECENT_LIMIT): ChatMessage[] {
  return list.slice(-limit).reverse();
}

/** Distinct authors seen in chat (excluding this client), in first-seen order. Pure. */
export function playersSeenInChat(list: readonly ChatMessage[], author: string): string[] {
  const seen: string[] = [];
  for (const m of list) {
    if (isOwnMessage(m, author)) continue;
    if (!seen.includes(m.author)) seen.push(m.author);
  }
  return seen;
}

/**
 * Staff-only Admin panel, floating bottom-left. Renders nothing unless the local
 * staff flag is on (see ./staff.ts). Every action is a stub: it logs, shows a toast
 * and marks the row locally. Nothing reaches the server.
 */
export function AdminPanel(props: {
  /** Tests: skip the localStorage gate. */
  forceStaff?: boolean;
  /** Tests: fixed chat list instead of the live feed. */
  messages?: readonly ChatMessage[];
  author?: string;
  now?: number;
}) {
  const staffFlag = useStaffFlag();
  const staff = props.forceStaff ?? staffFlag;
  const feed = useChatFeed();
  const messages = props.messages ?? feed;
  const author = props.author ?? "You";
  const now = props.now ?? Date.now();

  const [toast, setToast] = React.useState<{ id: number; text: string } | null>(null);
  const [marks, setMarks] = React.useState<Record<string, ModAction>>({});
  const [armedBan, setArmedBan] = React.useState<string | null>(null);
  const toastSeq = React.useRef(0);

  React.useEffect(() => {
    if (!toast || typeof window === "undefined") return undefined;
    const t = window.setTimeout(() => setToast(null), ADMIN_TOAST_MS);
    return () => window.clearTimeout(t);
  }, [toast]);

  if (!staff) return null;

  const say = (text: string) => {
    toastSeq.current += 1;
    setToast({ id: toastSeq.current, text });
  };

  const act = (action: ModAction, msg: ChatMessage) => {
    // Ban needs a second click on the same row.
    if (action === "ban" && armedBan !== msg.id) {
      setArmedBan(msg.id);
      return;
    }
    setArmedBan(null);
    setMarks((m) => ({ ...m, [msg.author]: action }));
    say(`${MOD_ACTION_LABEL[action]}: ${msg.author} (local stub, not sent)`);
    void moderatePlayer(action, msg.author); // future: POST /api/admin/<action>
  };

  const recent = recentForModeration(messages);
  const players = playersSeenInChat(messages, author);

  return (
    <aside className="sc-admin-float" aria-label="Admin">
      <Fold
        id="admin-panel"
        noisy
        className="sc-admin-fold"
        title={
          <span className="sc-admin-title">
            <span className="sc-admin-badge">Staff</span>
            Admin
          </span>
        }
        summary={`${recent.length} recent · stubs`}
      >
        <section className="sc-admin-section" aria-label="Chat moderation">
          <h4 className="sc-admin-h">Chat moderation</h4>
          {recent.length === 0 ? (
            <p className="sc-admin-empty">No chat messages.</p>
          ) : (
            <ol className="sc-admin-list">
              {recent.map((m) => {
                const own = isOwnMessage(m, author);
                const mark = marks[m.author];
                return (
                  <li key={m.id} className="sc-admin-row" data-admin-msg={m.id}>
                    <div className="sc-admin-row-meta">
                      <span className="sc-admin-author">{m.author}</span>
                      {mark ? <span className={`sc-admin-mark mark-${mark}`}>{mark}d</span> : null}
                      <span className="sc-admin-time">{formatChatRelative(m.at, now)}</span>
                    </div>
                    <p className="sc-admin-text" title={m.text}>{m.text}</p>
                    <div className="sc-admin-actions">
                      {MOD_ACTIONS.map((a) => (
                        <button
                          key={a}
                          type="button"
                          className={`sc-admin-btn act-${a}${a === "ban" && armedBan === m.id ? " is-armed" : ""}`}
                          disabled={own}
                          title={own ? "That's you" : `${MOD_ACTION_LABEL[a]} ${m.author} (stub)`}
                          onClick={() => act(a, m)}
                        >
                          {a === "ban" && armedBan === m.id ? "Confirm ban" : MOD_ACTION_LABEL[a]}
                        </button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section className="sc-admin-section" aria-label="Players">
          <h4 className="sc-admin-h">Players</h4>
          {/* Placeholder. Future: GET /api/admin/players (fetchPlayerList in ./staff.ts). */}
          <p className="sc-admin-placeholder">
            Online list needs a server endpoint. Seen in chat:{" "}
            {players.length === 0 ? "nobody" : players.join(", ")}
          </p>
          <button
            type="button"
            className="sc-admin-btn"
            onClick={() => {
              void fetchPlayerList();
              say("Player list: no server endpoint yet");
            }}
          >
            Refresh players
          </button>
        </section>

        <section className="sc-admin-section" aria-label="Server status">
          <h4 className="sc-admin-h">Server status</h4>
          {/* Placeholder. Future: GET /api/admin/status (fetchServerStatus in ./staff.ts). */}
          <dl className="sc-admin-status">
            <dt>Server</dt>
            <dd>Not connected (stub)</dd>
            <dt>Uptime</dt>
            <dd>—</dd>
            <dt>Online</dt>
            <dd>—</dd>
          </dl>
          <button
            type="button"
            className="sc-admin-btn"
            onClick={() => {
              void fetchServerStatus();
              say("Server status: no server endpoint yet");
            }}
          >
            Check status
          </button>
        </section>

        <div className="sc-admin-foot">
          <p className="sc-admin-note">Local stubs only. Nothing is sent to the server.</p>
          <button type="button" className="sc-admin-linkbtn" onClick={() => setStaffFlag(false)}>
            Turn off staff tools
          </button>
        </div>

        {toast ? (
          <div key={toast.id} className="sc-admin-toast" role="status">
            {toast.text}
          </div>
        ) : null}
      </Fold>
    </aside>
  );
}
