import React from "react";
import { joinRealm, readHold, recentIntents, sendBuild, sendCottage, sendLumber, sendStamp, sendTrain, type HoldView } from "./net/hold";
import { IntentPip } from "./hud/IntentPip";
import { KeySealPip } from "./hud/KeySealPip";
import { CopyFlashPip, startCopyFlashTimer } from "./hud/CopyFlashPip";
import { LeaveSealPip } from "./hud/LeaveSealPip";
import "./hud/hold-stores.css";

/** Whole units for display. The hold keeps the sim's exact decimal strings. */
function whole(value: string): string {
  const n = Number(value);
  return Number.isFinite(n) ? Math.floor(n).toLocaleString() : value;
}

/** The four hold store cards, in display order. */
const HOLD_STORES = [
  ["food", "Food"],
  ["wood", "Wood"],
  ["stone", "Stone"],
  ["gold", "Gold"],
] as const;

/**
 * Opt-in shared hold. Type a realm id and join; everyone on the same id reads one server hold,
 * a fresh kingdom the server runs through packages/sim. The first join of an id makes the hold and
 * shows its key once; friends need the id and the key. The key lives only in this card's state.
 * This card never loads, saves, or marks the solo crown, and never writes the hold or its key into
 * the local save. Leave returns to the solo crown.
 */
export type IntentEntry = { realmId: string; line: string };
/** Newest first, capped at 3, filtered to the active hold. Empty when there is no hold. */
export function resolveHoldIntentLines(realmId: string | null, entries: IntentEntry[]): string[] {
  if (realmId === null) return [];
  return entries
    .filter((e) => e.realmId === realmId)
    .map((e) => e.line)
    .slice(-3)
    .reverse();
}
export function JoinHoldCard({
  signedIn,
  intentLines,
  intentPulseKey,
  initialView = null,
  initialMadeKey = null,
  initialCopyFlash = false,
  initialConfirmLeave = false,
}: {
  signedIn: boolean;
  intentLines?: string[];
  intentPulseKey?: number;
  initialView?: HoldView | null;
  initialMadeKey?: string | null;
  initialCopyFlash?: boolean;
  initialConfirmLeave?: boolean;
}) {
  const [code, setCode] = React.useState("");
  const [key, setKey] = React.useState("");
  const [holdKey, setHoldKey] = React.useState("");
  const [madeKey, setMadeKey] = React.useState<string | null>(initialMadeKey);
  const [copied, setCopied] = React.useState(false);
  const [flashOn, setFlashOn] = React.useState(initialCopyFlash);
  const flashCancel = React.useRef<(() => void) | null>(null);
  const [view, setView] = React.useState<HoldView | null>(initialView);
  const [status, setStatus] = React.useState("");
  const [confirmLeave, setConfirmLeave] = React.useState(initialConfirmLeave);
  const [confirmLeaveSeq, setConfirmLeaveSeq] = React.useState(initialConfirmLeave ? 1 : 0);
  const realmId = view?.realmId ?? null;
  const lastIntents = intentLines ?? (realmId === null ? [] : recentIntents(realmId, 3));

  React.useEffect(() => {
    if (realmId === null) {
      setCopied(false);
      setFlashOn(false);
      setConfirmLeave(false);
      flashCancel.current?.();
      flashCancel.current = null;
    }
  }, [realmId]);

  React.useEffect(() => {
    if (realmId === null) return;
    let live = true;
    const id = window.setInterval(async () => {
      try {
        const next = await readHold(realmId, holdKey);
        if (live) setView(next);
      } catch {
        if (live) setStatus("Lost the hold. Leave and join again.");
      }
    }, 1000);
    return () => {
      live = false;
      window.clearInterval(id);
    };
  }, [realmId, holdKey]);

  async function join() {
    try {
      const next = await joinRealm(code, key);
      if (next === null) { setStatus("Type a realm id first (letters, numbers, dashes)."); return; }
      const { key: made, ...hold } = next;
      setHoldKey(made ?? key.trim());
      setMadeKey(made ?? null);
      if (made) setKey(made);
      setCopied(false);
      setView(hold);
      setStatus("");
    } catch (e) {
      setStatus(`Could not join: ${e instanceof Error ? e.message : "unknown"}.`);
    }
  }

  async function stamp() {
    if (realmId === null) return;
    try {
      setView(await sendStamp(realmId, holdKey));
    } catch (e) {
      setStatus(`Stamp failed: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }

  async function train() {
    if (realmId === null) return;
    try {
      setView(await sendTrain(realmId, holdKey));
      setStatus("");
    } catch (e) {
      setStatus(`Train refused: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }

  async function build() {
    if (realmId === null) return;
    try {
      setView(await sendBuild(realmId, holdKey));
      setStatus("");
    } catch (e) {
      setStatus(`Build refused: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }

  async function lumber() {
    if (realmId === null) return;
    try {
      setView(await sendLumber(realmId, holdKey));
      setStatus("");
    } catch (e) {
      setStatus(`Lumber camp refused: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }

  async function cottage() {
    if (realmId === null) return;
    try {
      setView(await sendCottage(realmId, holdKey));
      setStatus("");
    } catch (e) {
      setStatus(`Cottage refused: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }

  async function copyKey() {
    if (madeKey === null) return;
    try {
      await navigator.clipboard.writeText(madeKey);
      setCopied(true);
      setFlashOn(true);
      flashCancel.current?.();
      flashCancel.current = startCopyFlashTimer(() => setFlashOn(false));
    } catch {
      setStatus("Could not copy. Select the key and copy it by hand.");
    }
  }

  function openConfirmLeave() {
    if (!confirmLeave) {
      setConfirmLeaveSeq((n) => n + 1);
    }
    setConfirmLeave(true);
  }

  function leave() {
    setConfirmLeave(false);
    setView(null);
    setHoldKey("");
    setMadeKey(null);
    setStatus("Left the hold. Your solo crown is unchanged.");
  }

  const input = { minWidth: 160, background: "#1a1410", color: "#e8dcc8", border: "1px solid #3a3228" };
  return (
    <div className="sc-work-card sc-plain-card">
      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
        Join hold (opt-in, test): friends who type the same id and its hold key share one fresh server kingdom. Leave the key blank to make a new hold; you get its key once. It is not your solo crown, which is not touched. A joined hold survives a server restart; the solo crown is not kept with it.
      </div>
      {view === null ? (
        <div className="sc-plain-inline">
          <input style={input} value={code} onChange={(e) => setCode(e.target.value)} placeholder="realm id" />
          <input style={input} value={key} onChange={(e) => setKey(e.target.value)} placeholder="hold key (blank = new)" />
          <button type="button" className="sc-work-btn" onClick={() => void join()} disabled={!signedIn}>Join</button>
        </div>
      ) : (
        <div>
          {madeKey ? (
            <div className="sc-plain-inline" style={{ fontSize: 13, marginBottom: 6, gap: 8, flexWrap: "wrap" }} aria-label="New hold key">
              <span className="sc-key-seal-group"><KeySealPip pulse pulseKey={madeKey} /><span>New hold. Key: <code style={{ userSelect: "all" }}>{madeKey}</code></span></span>
              {madeKey && flashOn ? <CopyFlashPip flashKey={madeKey} /> : null}
              <button type="button" className="sc-work-btn" onClick={() => void copyKey()}>{copied ? "Copied" : "Copy key"}</button>
              {copied ? <span style={{ flexBasis: "100%", fontSize: 12 }} role="status">Key copied. Share the realm id and the key.</span> : null}
              <span style={{ flexBasis: "100%", fontSize: 12 }}>Share the realm id and this key with friends.</span>
              <span style={{ fontSize: 12, opacity: 0.8 }}>Copy it now and send it to friends with the id. It is shown only this once; without it nobody, you included, can join again.</span>
            </div>
          ) : null}
          <div className="sc-plain-inline">
            <span className="sc-work-status">
              Hold <code>{view.realmId.replace(/^join-/, "")}</code> · tick {view.tick}{view.pending > 0 ? ` · ${view.pending} pending` : ""}
            </span>
            <button type="button" className="sc-work-btn" onClick={() => void train()}>Train militia</button>
            <button type="button" className="sc-work-btn" onClick={() => void build()}>Build farm</button>
            <button type="button" className="sc-work-btn" onClick={() => void lumber()}>Build lumber camp</button>
            <button type="button" className="sc-work-btn" onClick={() => void cottage()}>Build cottage</button>
            <button type="button" className="sc-work-btn" onClick={() => void stamp()}>Stamp</button>
            <button type="button" className="sc-work-btn" onClick={openConfirmLeave}>Leave</button>
          </div>
          {confirmLeave ? (
            <div className="sc-plain-inline sc-leave-confirm" role="alertdialog" aria-label="Confirm leave">
              <span className="sc-leave-confirm-text">Leave hold <code>{view.realmId.replace(/^join-/, "")}</code>?</span>
              <span className="sc-leave-seal-group"><LeaveSealPip pulse pulseKey={confirmLeaveSeq} /><button type="button" className="sc-work-btn" onClick={leave}>Leave</button></span>
              <button type="button" className="sc-work-btn" onClick={() => setConfirmLeave(false)}>Stay</button>
            </div>
          ) : null}
          <div style={{ fontSize: 12, marginTop: 4, opacity: 0.75 }}>Leaving returns you to your solo crown. The hold keeps running.</div>
          <div className="sc-hold-stores" aria-label="Hold stores">
            {HOLD_STORES.map(([id, name]) => (
              <div key={id} className="sc-hold-store-card">
                <span className="sc-hold-store-name">{name}</span>
                <span className="sc-hold-store-amount">{whole(view.stores[id])}</span>
              </div>
            ))}
          </div>
          <div className="sc-plain-inline" style={{ fontSize: 13, marginTop: 6, gap: 12, flexWrap: "wrap" }} aria-label="Hold works">
            <span>Militia {view.militia}{view.training > 0 ? ` (+${view.training} training)` : ""}</span>
            <span>Farms {view.farms}</span>
            <span>Cottages {view.cottages}</span>
            <span>Lumber camps {view.lumberCamps}</span>
          </div>
          <div style={{ fontSize: 12, marginTop: 6 }}>
            {view.stamps.length === 0
              ? "No stamps yet."
              : view.stamps.slice(-5).reverse().map((s) => <div key={`${s.tick}-${s.by}`}>Tick {s.tick}: stamped by {s.by}</div>)}
          </div>
        </div>
      )}
      {status ? <div style={{ fontSize: 12, marginTop: 6, opacity: 0.8 }}>{status}</div> : null}
      {lastIntents.length > 0 ? (
        <div style={{ fontSize: 12, marginTop: 6, opacity: 0.8, display: "flex", alignItems: "flex-start", gap: 6 }} aria-label="Last intents">
          <IntentPip pulse={intentPulseKey !== undefined} pulseKey={intentPulseKey} />
          <div className="sc-intent-log-lines">
            {lastIntents.map((line, i) => <div key={i}>{line}</div>)}
          </div>
        </div>
      ) : null}
    </div>
  );
}
