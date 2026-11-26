import React from "react";
import {
  cultureOfRealm,
  getCulture,
  getCultureNews,
  type CultureNews,
  type GameState,
} from "@second-crown/sim";
import { CultureCrestPip } from "./CultureCrestPip";
import "./living-realm-ui.css";

export interface CultureNewsDisplayItem extends CultureNews {
  fromCultureId: string;
  fromCultureName: string;
  fromRealmName: string;
  toRealmName: string;
  isPlayerInvolved: boolean;
}

/** Projects `getCultureNews(state)` newest-first with culture crest & realm display labels. */
export function summarizeCultureNews(state: GameState | undefined): CultureNewsDisplayItem[] {
  if (!state) return [];
  const items = getCultureNews(state);
  const nameOf = (id: string) => state.realms.find((r) => r.id === id)?.name ?? id;

  const out: CultureNewsDisplayItem[] = [];
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    const fromCultureId = cultureOfRealm(state, item.fromRealmId);
    out.push({
      ...item,
      fromCultureId,
      fromCultureName: getCulture(fromCultureId).name,
      fromRealmName: nameOf(item.fromRealmId),
      toRealmName: nameOf(item.toRealmId),
      isPlayerInvolved: item.fromRealmId === "player" || item.toRealmId === "player",
    });
  }
  return out;
}

/**
 * Read-only Culture Whispers & Caravans list for the World tab.
 * Shows culture crests and kind tags ("Whisper" / "Caravan") with zero chat input.
 */
export function CultureWhispersCard(props: { state: GameState | undefined }) {
  const entries = summarizeCultureNews(props.state);

  return (
    <div className="sc-culture-whispers" data-culture-whispers={entries.length}>
      {entries.length === 0 ? (
        <p className="sc-culture-whisper-empty">
          No whispers or caravans on the roads yet.
        </p>
      ) : (
        <ul className="sc-culture-whisper-list">
          {entries.map((item, idx) => (
            <li
              key={`${item.tick}-${item.kind}-${item.fromRealmId}-${idx}`}
              className={`sc-culture-whisper-item is-${item.kind}`}
              data-culture-news-kind={item.kind}
              data-from-culture={item.fromCultureId}
            >
              <CultureCrestPip
                cultureId={item.fromCultureId}
                size={20}
                className="sc-culture-whisper-crest"
              />
              <div className="sc-culture-whisper-body">
                <div className="sc-culture-whisper-meta">
                  <span className={`sc-culture-whisper-tag is-${item.kind}`}>
                    <span className="sc-culture-whisper-pip" aria-hidden="true" />
                    {item.kind === "caravan" ? "Caravan" : "Whisper"}
                  </span>
                  <span className="sc-culture-whisper-culture">{item.fromCultureName}</span>
                  <span className="sc-culture-whisper-tick">T{item.tick}</span>
                </div>
                <p className="sc-culture-whisper-text">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
