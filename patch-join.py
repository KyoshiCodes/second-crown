from pathlib import Path
p = Path("packages/app/src/JoinHoldCard.tsx")
text = p.read_text(encoding="utf-8")
old = """import React from "react";
import { joinRealm, readHold, recentIntents, sendBuild, sendCottage, sendLumber, sendStamp, sendTrain, type HoldView } from "./net/hold";
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
  const lastIntents = realmId === null ? [] : recentIntents(realmId, 3);"""
new = """import React from "react";
import { joinRealm, readHold, recentIntents, sendBuild, sendCottage, sendLumber, sendStamp, sendTrain, type HoldView } from "./net/hold";
import { IntentPip } from "./hud/IntentPip";
/** Whole units for display. The hold keeps the sim's exact decimal strings. */
function whole(value: string): string {
  const n = Number(value);
  return Number.isFinite(n) ? Math.floor(n).toLocaleString() : value;
}
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
/**
 * Opt-in shared hold. Type a realm id and join; everyone on the same id reads one server hold,
 * a fresh kingdom the server runs through packages/sim. The first join of an id makes the hold and
 * shows its key once; friends need the id and the key. The key lives only in this card's state.
 * This card never loads, saves, or marks the solo crown, and never writes the hold or its key into
 * the local save. Leave returns to the solo crown.
 */
export function JoinHoldCard({
  signedIn,
  intentLines,
  intentPulseKey,
}: {
  signedIn: boolean;
  intentLines?: string[];
  intentPulseKey?: number;
}) {
  const [code, setCode] = React.useState("");
  const [key, setKey] = React.useState("");
  // The key this hold was opened with, and the key just made by a first join (shown until Leave).
  const [holdKey, setHoldKey] = React.useState("");
  const [madeKey, setMadeKey] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [view, setView] = React.useState<HoldView | null>(null);
  const [status, setStatus] = React.useState("");
  const realmId = view?.realmId ?? null;
  const lastIntents = intentLines ?? (realmId === null ? [] : recentIntents(realmId, 3));"""
if old not in text:
    raise SystemExit("signature block not found")
text = text.replace(old, new, 1)
old2 = """      {lastIntents.length > 0 ? (
        <div style={{ fontSize: 12, marginTop: 6, opacity: 0.8 }} aria-label="Last intents">
          {lastIntents.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      ) : null}"""
new2 = """      {lastIntents.length > 0 ? (
        <div style={{ fontSize: 12, marginTop: 6, opacity: 0.8, display: "flex", alignItems: "flex-start", gap: 6 }} aria-label="Last intents">
          <IntentPip pulse={intentPulseKey !== undefined} pulseKey={intentPulseKey} />
          <div className="sc-intent-log-lines">
            {lastIntents.map((line, i) => <div key={i}>{line}</div>)}
          </div>
        </div>
      ) : null}"""
if old2 not in text:
    raise SystemExit("intent-log block not found")
text = text.replace(old2, new2, 1)
p.write_text(text, encoding="utf-8")
print("patched")
