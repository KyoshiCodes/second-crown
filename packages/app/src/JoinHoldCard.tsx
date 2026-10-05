import React from "react";
import { joinRealm, readHold, sendBuild, sendCottage, sendLumber, sendStamp, sendTrain, type HoldView } from "./net/hold";

/** Whole units for display. The hold keeps the sim's exact decimal strings. */
function whole(value: string): string {
  const n = Number(value);
  return Number.isFinite(n) ? Math.floor(n).toLocaleString() : value;
}

/**
 * Opt-in shared hold. Type a realm id and join; everyone on the same id reads one server hold,
 * a fresh kingdom the server runs through packages/sim. The first join of an id makes the hold and
 * shows its key once; friends need the id and the key. The key lives only in this card's state.
 * This card never loads, saves, or marks the solo crown, and never writes the hold or its key into
 * the local save. Leave returns to the solo crown.
 */
export function JoinHoldCard({ signedIn }: { signedIn: boolean }) {
  const [code, setCode] = React.useState("");
  const [key, setKey] = React.useState("");
  // The key this hold was opened with, and the key just made by a first join (shown until Leave).
  const [holdKey, setHoldKey] = React.useState("");
  const [madeKey, setMadeKey] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [view, setView] = React.useState<HoldView | null>(null);
  const [status, setStatus] = React.useState("");
  const realmId = view?.realmId ?? null;

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
    } catch {
      setStatus("Stamp failed.");
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

  async function cottage() {
    if (realmId === null) return;
    try {
      setView(await sendCottage(realmId, holdKey));
      setStatus("");
    } catch (e) {
      setStatus(`Cottage refused: ${e instanceof Error ? e.message : "unknown"}`);
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

  async function copyKey() {
    if (madeKey === null) return;
    try {
      await navigator.clipboard.writeText(madeKey);
      setCopied(true);
    } catch {
      setStatus("Could not copy. Select the key and copy it by hand.");
    }
  }

  function leave() {
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
          <input value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void join(); }} placeholder="Realm id, e.g. oak-hill" maxLength={24} style={input} aria-label="Realm id" />
          <input value={key} onChange={(e) => setKey(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void join(); }} placeholder="Hold key (blank for a new hold)" maxLength={64} autoComplete="off" spellCheck={false} style={input} aria-label="Hold key" />
          <button type="button" className="sc-work-btn" disabled={!signedIn || code.trim() === ""} onClick={() => void join()}>Join hold</button>
          {!signedIn ? <span className="sc-work-status">Sign in (guest is fine) to join.</span> : null}
        </div>
      ) : (
        <div>
          {madeKey !== null ? (
            <div className="sc-plain-inline" style={{ fontSize: 13, marginBottom: 6, gap: 8, flexWrap: "wrap" }} aria-label="New hold key">
              <span>New hold. Key: <code style={{ userSelect: "all" }}>{madeKey}</code></span>
              <button type="button" className="sc-work-btn" onClick={() => void copyKey()}>{copied ? "Copied" : "Copy key"}</button>
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
            <button type="button" className="sc-work-btn" onClick={leave}>Leave</button>
          </div>
          <div className="sc-plain-inline" style={{ fontSize: 13, marginTop: 6, gap: 12, flexWrap: "wrap" }} aria-label="Hold stores">
            <span>Food {whole(view.stores.food)}</span>
            <span>Wood {whole(view.stores.wood)}</span>
            <span>Stone {whole(view.stores.stone)}</span>
            <span>Gold {whole(view.stores.gold)}</span>
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
    </div>
  );
}
