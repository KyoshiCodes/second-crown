import React from "react";
import type { GameState } from "@second-crown/sim";
import { sharedRealmId } from "../game/settleOnLoad";
import type { HoldView } from "../net/hold";
import { getHoldViewSnapshot, subscribeHoldView } from "./holdWatch";
import "./shared-realm-seal.css";

export type SharedRealmScope = "shared-realm" | "shared-hold";

export interface SharedRealmInfo {
  scope: SharedRealmScope;
  realm: string;
  label: string;
  summary: string;
}

/** Strips the "join-" prefix added by the hold route and trims whitespace. */
export function cleanSharedRealmName(raw: string): string {
  return raw.trim().replace(/^join-/, "");
}

/**
 * Resolves whether the current view is reading a shared realm or joined shared hold,
 * using only existing app realm-scope seams (`sharedRealmId` and `holdWatch`).
 */
export function resolveSharedRealmInfo(opts: {
  state?: GameState;
  holdView?: HoldView | null;
  includeHoldWatch?: boolean;
  sharedRealmIdFn?: (state: GameState) => string | null;
}): SharedRealmInfo | null {
  if (opts.state) {
    const id = (opts.sharedRealmIdFn ?? sharedRealmId)(opts.state);
    if (id !== null) {
      const realm = cleanSharedRealmName(id);
      if (realm) {
        return {
          scope: "shared-realm",
          realm,
          label: "Shared",
          summary: `Shared realm: ${realm}`,
        };
      }
    }
  }

  if (opts.includeHoldWatch !== false && opts.holdView) {
    const realm = cleanSharedRealmName(opts.holdView.realmId);
    if (realm) {
      return {
        scope: "shared-hold",
        realm,
        label: "Shared hold",
        summary: `Shared hold joined: ${realm} (solo crown stays separate)`,
      };
    }
  }

  return null;
}

/**
 * Quiet, non-blocking living seal indicating the current view is a shared realm or joined hold.
 * Strictly phrasing-only (`<span>` + `<svg>`) so it can live in toolbars and controls cleanly.
 */
export function SharedRealmSeal(props: {
  state?: GameState;
  holdView?: HoldView | null;
  includeHoldWatch?: boolean;
  compact?: boolean;
  sharedRealmIdFn?: (state: GameState) => string | null;
}) {
  const { state, holdView, includeHoldWatch = true, compact = false, sharedRealmIdFn } = props;
  const watched = React.useSyncExternalStore(subscribeHoldView, getHoldViewSnapshot, getHoldViewSnapshot);
  const effectiveHoldView = holdView !== undefined ? holdView : includeHoldWatch ? watched : null;
  const info = resolveSharedRealmInfo({
    state,
    holdView: effectiveHoldView,
    includeHoldWatch,
    sharedRealmIdFn,
  });

  if (!info) return null;

  return (
    <span
      className={`sc-shared-realm-seal is-${info.scope}${compact ? " is-compact" : ""}`}
      data-shared-scope={info.scope}
      data-shared-realm={info.realm}
      role="status"
      aria-label={info.summary}
      title={info.summary}
      style={{ pointerEvents: "none" }}
    >
      <span className="sc-shared-realm-pip" aria-hidden="true">
        <span className="sc-shared-realm-ring" />
      </span>
      <svg
        viewBox="0 0 12 12"
        width={11}
        height={11}
        className="sc-shared-realm-icon"
        aria-hidden="true"
        style={{ pointerEvents: "none" }}
      >
        <circle cx="4.5" cy="6" r="2.75" fill="none" stroke="currentColor" strokeWidth="1.25" />
        <circle cx="7.5" cy="6" r="2.75" fill="none" stroke="currentColor" strokeWidth="1.25" />
      </svg>
      <span className="sc-shared-realm-label">{info.label}</span>
      {!compact && info.realm ? <span className="sc-shared-realm-name">· {info.realm}</span> : null}
    </span>
  );
}
