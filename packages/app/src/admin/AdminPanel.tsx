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
import "./admin-living.css";

/** How many recent chat lines the moderation list shows. */
export const ADMIN_RECENT_LIMIT = 8;
export const ADMIN_TOAST_MS = 2600;
export const ADMIN_ACTION_FLASH_MS = 1400;
const MOD_ACTIONS: readonly ModAction[] = ["mute", "kick", "ban"];

export type AdminPlayerStatus = "online" | "muted" | "kicked" | "banned";

export const ADMIN_ACTION_CONFIRM_LABEL: Record<ModAction, string> = {
  mute: "Muted",
  kick: "Kicked",
  ban: "Banned",
};

export interface AdminActionFlash {
  id: number;
  msgId?: string;
  author: string;
  action: ModAction;
}

/** Map the latest local moderation mark to a player's display status. Pure. */
export function resolveAdminPlayerStatus(mark?: ModAction): AdminPlayerStatus {
  if (mark === "mute") return "muted";
  if (mark === "kick") return "kicked";
  if (mark === "ban") return "banned";
  return "online";
}

/** Lightweight client-only check for shouting or repeated punctuation spam. Pure. */
export function detectFlaggedMessage(text: string): boolean {
  if (/[!?]{4,}/.test(text)) return true;
  const letters = text.match(/[A-Za-z]/g);
  if (!letters || letters.length < 10) return false;
  let upper = 0;
  for (const ch of letters) {
    if (ch >= "A" && ch <= "Z") upper += 1;
  }
  return upper / letters.length >= 0.75;
}

/** True when a message was manually flagged, armed for ban confirmation, or auto-flagged. Pure. */
export function isMessageFlagged(
  msg: ChatMessage,
  opts?: { flaggedIds?: ReadonlySet<string> | readonly string[]; armedBanId?: string | null },
): boolean {
  if (opts?.armedBanId === msg.id) return true;
  if (opts?.flaggedIds) {
    if (Array.isArray(opts.flaggedIds)) {
      if (opts.flaggedIds.includes(msg.id)) return true;
    } else if ((opts.flaggedIds as ReadonlySet<string>).has(msg.id)) {
      return true;
    }
  }
  return detectFlaggedMessage(msg.text);
}

function AdminStatusPip(props: { status: AdminPlayerStatus }) {
  return (
    <span
      className={`sc-admin-status-pip status-${props.status}`}
      data-admin-status-pip={props.status}
      aria-hidden="true"
    >
      <span className="sc-admin-status-dot" />
      {props.status === "online" ? <span className="sc-admin-status-ring" /> : null}
    </span>
  );
}

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
  /** Tests: deterministic moderation status marks, flags, armed ban, or confirmation flash. */
  marksOverride?: Readonly<Record<string, ModAction>>;
  flaggedIdsOverride?: readonly string[];
  actionFlashOverride?: { msgId?: string; author?: string; action: ModAction } | null;
  armedBanOverride?: string | null;
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
  const [flaggedIds, setFlaggedIds] = React.useState<string[]>([]);
  const [actionFlash, setActionFlash] = React.useState<AdminActionFlash | null>(null);
  const toastSeq = React.useRef(0);
  const flashSeq = React.useRef(0);

  React.useEffect(() => {
    if (!toast || typeof window === "undefined") return undefined;
    const t = window.setTimeout(() => setToast(null), ADMIN_TOAST_MS);
    return () => window.clearTimeout(t);
  }, [toast]);

  React.useEffect(() => {
    if (!actionFlash || typeof window === "undefined") return undefined;
    const t = window.setTimeout(() => setActionFlash(null), ADMIN_ACTION_FLASH_MS);
    return () => window.clearTimeout(t);
  }, [actionFlash]);

  if (!staff) return null;

  const effectiveMarks: Readonly<Record<string, ModAction>> = props.marksOverride
    ? { ...marks, ...props.marksOverride }
    : marks;
  const effectiveArmedBan = props.armedBanOverride !== undefined ? props.armedBanOverride : armedBan;
  const effectiveFlaggedSet = new Set([...flaggedIds, ...(props.flaggedIdsOverride ?? [])]);
  const effectiveFlash: AdminActionFlash | null =
    props.actionFlashOverride !== undefined
      ? props.actionFlashOverride
        ? {
            id: 0,
            msgId: props.actionFlashOverride.msgId,
            author: props.actionFlashOverride.author ?? "",
            action: props.actionFlashOverride.action,
          }
        : null
      : actionFlash;

  const say = (text: string) => {
    toastSeq.current += 1;
    setToast({ id: toastSeq.current, text });
  };

  const toggleFlag = (id: string) => {
    setFlaggedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const act = (action: ModAction, msg: ChatMessage) => {
    // Ban needs a second click on the same row.
    if (action === "ban" && effectiveArmedBan !== msg.id) {
      setArmedBan(msg.id);
      return;
    }
    setArmedBan(null);
    setMarks((m) => ({ ...m, [msg.author]: action }));
    flashSeq.current += 1;
    setActionFlash({ id: flashSeq.current, msgId: msg.id, author: msg.author, action });
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
                const mark = effectiveMarks[m.author];
                const status = resolveAdminPlayerStatus(mark);
                const flagged =
                  !own &&
                  isMessageFlagged(m, {
                    flaggedIds: effectiveFlaggedSet,
                    armedBanId: effectiveArmedBan,
                  });
                const rowFlash =
                  effectiveFlash &&
                  (effectiveFlash.msgId === m.id || (!effectiveFlash.msgId && effectiveFlash.author === m.author))
                    ? effectiveFlash.action
                    : null;
                const rowClasses = ["sc-admin-row"];
                if (flagged) rowClasses.push("is-flagged");
                if (rowFlash) rowClasses.push("is-action-flash", `flash-${rowFlash}`);

                return (
                  <li
                    key={m.id}
                    className={rowClasses.join(" ")}
                    data-admin-msg={m.id}
                    data-admin-status={status}
                    data-admin-flagged={flagged ? "true" : undefined}
                    data-admin-flash={rowFlash ?? undefined}
                  >
                    <div className="sc-admin-row-meta">
                      <AdminStatusPip status={status} />
                      <span className="sc-admin-author">{m.author}</span>
                      {mark ? <span className={`sc-admin-mark mark-${mark}`}>{mark}d</span> : null}
                      {flagged ? (
                        <span className="sc-admin-flag-pill" aria-hidden="true">
                          Flagged
                        </span>
                      ) : null}
                      {rowFlash ? (
                        <span className={`sc-admin-confirm-pill flash-${rowFlash}`} aria-hidden="true">
                          ✓ {ADMIN_ACTION_CONFIRM_LABEL[rowFlash]}
                        </span>
                      ) : null}
                      <span className="sc-admin-time">{formatChatRelative(m.at, now)}</span>
                    </div>
                    <p className="sc-admin-text" title={m.text}>{m.text}</p>
                    <div className="sc-admin-actions">
                      {MOD_ACTIONS.map((a) => (
                        <button
                          key={a}
                          type="button"
                          className={`sc-admin-btn act-${a}${a === "ban" && effectiveArmedBan === m.id ? " is-armed" : ""}`}
                          disabled={own}
                          title={own ? "That's you" : `${MOD_ACTION_LABEL[a]} ${m.author} (stub)`}
                          onClick={() => act(a, m)}
                        >
                          {a === "ban" && effectiveArmedBan === m.id ? "Confirm ban" : MOD_ACTION_LABEL[a]}
                        </button>
                      ))}
                      {!own ? (
                        <button
                          type="button"
                          className={`sc-admin-flag-btn${flagged ? " is-flagged" : ""}`}
                          aria-pressed={flagged}
                          title={flagged ? "Clear local flag" : "Flag message for review"}
                          onClick={() => toggleFlag(m.id)}
                        >
                          {flagged ? "Unflag" : "Flag"}
                        </button>
                      ) : null}
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
          {players.length > 0 ? (
            <ul className="sc-admin-player-list" aria-label="Tracked players">
              {players.map((player) => {
                const status = resolveAdminPlayerStatus(effectiveMarks[player]);
                const playerFlash =
                  effectiveFlash && effectiveFlash.author === player ? effectiveFlash.action : null;
                const playerRowClasses = ["sc-admin-player-row"];
                if (playerFlash) playerRowClasses.push("is-action-flash", `flash-${playerFlash}`);

                return (
                  <li
                    key={player}
                    className={playerRowClasses.join(" ")}
                    data-admin-player={player}
                    data-admin-status={status}
                    data-admin-flash={playerFlash ?? undefined}
                  >
                    <AdminStatusPip status={status} />
                    <span className="sc-admin-player-name">{player}</span>
                    <span className={`sc-admin-player-state state-${status}`}>{status}</span>
                    {playerFlash ? (
                      <span className={`sc-admin-confirm-pill flash-${playerFlash}`} aria-hidden="true">
                        ✓ {ADMIN_ACTION_CONFIRM_LABEL[playerFlash]}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
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
