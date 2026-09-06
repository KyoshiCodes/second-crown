import React from "react";
import { D, formatLetterSuffix, realmPower, type GameState } from "@second-crown/sim";
import { cloudToken, cloudUrl } from "./net/cloud";
import { ledgerRequest, LedgerRequestError, type AuctionView, type PvpView, type LedgerRequest } from "./net/ledger";
import { ledgerText as t } from "./content/ledger";

const validAmount = (value: string) => /^[1-9]\d{0,9}$/.test(value) && D(value).lte("1000000000");
export function AuctionPanel({ state }: { state: GameState | undefined }) {
  const [auction, setAuction] = React.useState<AuctionView>();
  const [pvp, setPvp] = React.useState<PvpView>();
  const [busy, setBusy] = React.useState(false);
  const [note, setNote] = React.useState<string>("");
  const [pending, setPending] = React.useState<LedgerRequest>();
  const [item, setItem] = React.useState("iron");
  const [quantity, setQuantity] = React.useState("1");
  const [price, setPrice] = React.useState("10");
  const [opponent, setOpponent] = React.useState("");
  const inFlight = React.useRef(false);
  const scope = React.useRef("");
  const owner = React.useRef("");
  const power = state ? realmPower(state, "player") : 0;
  const powerValid = Number.isFinite(power) && power >= 0 && power <= 1e9;
  const storageKey = (id: string) => "sc-ledger-pending:" + cloudUrl() + ":" + id;

  async function refresh() {
    const [a, p] = await Promise.all([ledgerRequest<AuctionView>("auction"), ledgerRequest<PvpView>("pvp")]);
    const saved = sessionStorage.getItem(storageKey(a.userId));
    setPending(saved ? JSON.parse(saved) as LedgerRequest : undefined);
    setAuction(a); setPvp(p);
    owner.current = a.userId;
    scope.current = cloudUrl() + "|" + cloudToken();
  }
  async function reload() {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true);
    try { await refresh(); setNote(""); }
    catch { setAuction(undefined); setPvp(undefined); setNote(t.refreshFailed); }
    finally { inFlight.current = false; setBusy(false); }
  }
  async function submit(request: LedgerRequest) {
    if (inFlight.current || !auction) return;
    if (scope.current !== cloudUrl() + "|" + cloudToken()) { await reload(); return; }
    inFlight.current = true; setBusy(true);
    const key = storageKey(owner.current);
    try {
      // Save before sending: a lost response or remount can reuse the same receipt ID.
      try { sessionStorage.setItem(key, JSON.stringify(request)); }
      catch { setNote(t.storage); return; }
      setPending(request);
      try { await ledgerRequest(request.route, request.body); }
      catch (error) {
        if (error instanceof LedgerRequestError && error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 429) {
          sessionStorage.removeItem(key); setPending(undefined); setNote(t.rejected);
        } else setNote(t.uncertain);
        return;
      }
      sessionStorage.removeItem(key); setPending(undefined);
      try { await refresh(); setNote(t.done); }
      catch { setAuction(undefined); setPvp(undefined); setNote(t.refreshFailed); }
    } finally { inFlight.current = false; setBusy(false); }
  }
  function send(route: LedgerRequest["route"], body: Record<string, string>) {
    if (pending || busy) return;
    void submit({ route, body: { ...body, requestId: crypto.randomUUID() } });
  }
  const disabled = busy || Boolean(pending);
  return <details className="sc-realm-card sc-auction-panel" onToggle={(e) => {
    if (e.currentTarget.open && !auction && !busy) void reload();
  }}>
    <summary>{t.title}</summary>
    <p>{t.intro}</p>
    <p>{t.signIn}</p>
    <button type="button" disabled={busy} onClick={() => void reload()}>{busy ? t.loading : t.refresh}</button>
    {note && <p role="status">{note}</p>}
    {pending && <p><button type="button" disabled={busy} onClick={() => void submit(pending)}>{t.retry}</button></p>}
    {auction && <>
      <p>{t.yourId}: <code>{auction.userId}</code></p>
      {!auction.account ? <><p>{t.grant}</p><button type="button" disabled={disabled} onClick={() => send("auction", { action: "enroll" })}>{t.enroll}</button></> : <>
        <h4>{t.balances}</h4>
        <p>{(["gold", "iron", "banners", "relics"] as const).map((key) => t[key] + ": " + formatLetterSuffix(auction.account![key])).join(" · ")}</p>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!validAmount(quantity) || !validAmount(price)) { setNote(t.invalid); return; }
          send("auction", { action: "list", item, quantity, price });
        }}>
          <fieldset disabled={disabled}>
            <label>{t.item} <select value={item} onChange={(e) => setItem(e.target.value)}>
              {(["iron", "banners", "relics"] as const).map((key) => <option key={key} value={key}>{t[key]}</option>)}
            </select></label>{" "}
            <label>{t.quantity} <input size={8} inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} required maxLength={10} /></label>{" "}
            <label>{t.price} <input size={10} inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} required maxLength={10} /></label>{" "}
            <button type="submit">{t.list}</button>
          </fieldset>
        </form>
      </>}
      <h4>{t.listings}</h4>
      {auction.listings.length === 0 && <p>{t.empty}</p>}
      <ul>{auction.listings.map((listing) => <li key={listing.id}>
        {formatLetterSuffix(listing.quantity)} {t[listing.item]} {t.priceFor} {formatLetterSuffix(listing.price)} {t.gold} · {t.seller}: {listing.sellerName} · {t.status[listing.status]}{" "}
        {listing.status === "open" && <button type="button" disabled={disabled || !auction.account} onClick={() => send("auction", {
          action: listing.sellerId === auction.userId ? "cancel" : "buy", listingId: listing.id,
        })}>{listing.sellerId === auction.userId ? t.cancel : t.buy}</button>}
      </li>)}</ul>
      <h4>{t.pvp}</h4>
      <p>{t.pvpHelp}</p><p>{t.saveHelp}</p>
      <p>{t.power}: {powerValid ? formatLetterSuffix(D(power).floor().toString()) : t.invalidPower}</p>
      <form onSubmit={(e) => { e.preventDefault(); if (powerValid) send("pvp", { action: "challenge", opponentId: opponent.trim(), power: D(power).floor().toString() }); }}>
        <fieldset disabled={disabled || !state || !powerValid}>
          <label>{t.opponent} <input value={opponent} onChange={(e) => setOpponent(e.target.value)} required maxLength={100} /></label>{" "}
          <button type="submit">{t.challenge}</button>
        </fieldset>
      </form>
      {pvp?.challenges.length === 0 && <p>{t.noChallenges}</p>}
      <ul>{pvp?.challenges.map((c) => <li key={c.id}>
        {c.challengerName} {t.vs} {c.opponentName} · {t.status[c.status]}
        <p>{formatLetterSuffix(c.challenger.power)} ({t.tick} {formatLetterSuffix(c.challenger.tick)})
          {c.opponent && <> / {formatLetterSuffix(c.opponent.power)} ({t.tick} {formatLetterSuffix(c.opponent.tick)})</>}</p>
        {c.status === "open" && c.opponentId === auction.userId && <button type="button" disabled={disabled || !state || !powerValid} onClick={() => send("pvp", { action: "accept", challengeId: c.id, power: D(power).floor().toString() })}>{t.accept}</button>}
        {c.status !== "cancelled" && <button type="button" disabled={disabled} onClick={() => send("pvp", { action: "cancel", challengeId: c.id })}>{t.cancel}</button>}
      </li>)}</ul>
    </>}
  </details>;
}
