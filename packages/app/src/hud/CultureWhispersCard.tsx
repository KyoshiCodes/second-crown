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
import "./correspondence-outcome.css";

export interface CultureNewsDisplayItem extends CultureNews {
  fromCultureId: string;
  fromCultureName: string;
  fromRealmName: string;
  toRealmName: string;
  isPlayerInvolved: boolean;
}

export type CultureCorrespondenceEntry =
  | {
      kind: "pair";
      id: string;
      sortTick: number;
      whisper: CultureNewsDisplayItem;
      reply: CultureNewsDisplayItem;
    }
  | {
      kind: "single";
      id: string;
      sortTick: number;
      item: CultureNewsDisplayItem;
    };

/** Projects `getCultureNews(state)` newest-first with culture crest & realm display labels. */
export function summarizeCultureNews(state: GameState | undefined): CultureNewsDisplayItem[] {
  if (!state?.flags || !Array.isArray(state.realms)) return [];
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
 * Pairs each whisper (`id`) with its matching reply (`replyTo`) newest-first while
 * leaving standalone whispers, caravans, and orphan replies intact.
 */
export function pairCultureCorrespondence(
  state: GameState | undefined,
): CultureCorrespondenceEntry[] {
  const items = summarizeCultureNews(state);
  if (items.length === 0) return [];

  const whisperIndexById = new Map<string, number>();
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.kind === "whisper" && it.id && !whisperIndexById.has(it.id)) {
      whisperIndexById.set(it.id, i);
    }
  }

  const consumedIndices = new Set<number>();
  const entries: Array<CultureCorrespondenceEntry & { order: number }> = [];

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.kind === "reply" && it.replyTo) {
      const wIdx = whisperIndexById.get(it.replyTo);
      if (wIdx !== undefined && !consumedIndices.has(wIdx)) {
        consumedIndices.add(i);
        consumedIndices.add(wIdx);
        const whisper = items[wIdx];
        entries.push({
          kind: "pair",
          id: `pair-${it.replyTo}-${it.tick}`,
          sortTick: it.tick,
          order: i,
          whisper,
          reply: it,
        });
      }
    }
  }

  for (let i = 0; i < items.length; i++) {
    if (consumedIndices.has(i)) continue;
    const it = items[i];
    entries.push({
      kind: "single",
      id: `${it.tick}-${it.kind}-${it.fromRealmId}-${i}`,
      sortTick: it.tick,
      order: i,
      item: it,
    });
  }

  entries.sort((a, b) => (b.sortTick !== a.sortTick ? b.sortTick - a.sortTick : a.order - b.order));
  return entries.map(({ order: _order, ...entry }) => entry);
}

function renderKindTag(kind: CultureNews["kind"]) {
  const label = kind === "caravan" ? "Caravan" : kind === "reply" ? "Reply" : "Whisper";
  return (
    <span className={`sc-culture-whisper-tag is-${kind}`}>
      <span className="sc-culture-whisper-pip" aria-hidden="true" />
      {label}
    </span>
  );
}

/**
 * Read-only Culture Whispers, Correspondence & Caravans list for the World tab.
 * Shows whisper + reply pairs newest-first with culture crests and zero chat input.
 */
export function CultureWhispersCard(props: { state: GameState | undefined }) {
  const rawCount = summarizeCultureNews(props.state).length;
  const entries = pairCultureCorrespondence(props.state);

  return (
    <div className="sc-culture-whispers" data-culture-whispers={rawCount}>
      {entries.length === 0 ? (
        <p className="sc-culture-whisper-empty">
          No whispers or caravans on the roads yet.
        </p>
      ) : (
        <ul className="sc-culture-whisper-list">
          {entries.map((entry) => {
            if (entry.kind === "pair") {
              const { whisper, reply } = entry;
              return (
                <li
                  key={entry.id}
                  className="sc-culture-whisper-item is-whisper is-correspondence-pair"
                  data-culture-news-kind="pair"
                  data-correspondence-pair={whisper.id}
                  data-from-culture={whisper.fromCultureId}
                >
                  <div
                    className="sc-correspondence-whisper"
                    data-culture-news-kind="whisper"
                    data-from-culture={whisper.fromCultureId}
                  >
                    <CultureCrestPip
                      cultureId={whisper.fromCultureId}
                      size={20}
                      className="sc-culture-whisper-crest"
                    />
                    <div className="sc-culture-whisper-body">
                      <div className="sc-culture-whisper-meta">
                        {renderKindTag("whisper")}
                        <span className="sc-correspondence-from">{whisper.fromRealmName}</span>
                        <span className="sc-culture-whisper-culture">{whisper.fromCultureName}</span>
                        <span className="sc-culture-whisper-tick">T{whisper.tick}</span>
                      </div>
                      <p className="sc-culture-whisper-text">{whisper.text}</p>
                    </div>
                  </div>
                  <div
                    className="sc-correspondence-reply"
                    data-culture-news-kind="reply"
                    data-reply-to={reply.replyTo}
                    data-from-culture={reply.fromCultureId}
                  >
                    <CultureCrestPip
                      cultureId={reply.fromCultureId}
                      size={18}
                      className="sc-culture-whisper-crest"
                    />
                    <div className="sc-culture-whisper-body">
                      <div className="sc-culture-whisper-meta">
                        {renderKindTag("reply")}
                        <span className="sc-correspondence-from">{reply.fromRealmName}</span>
                        <span className="sc-culture-whisper-culture">{reply.fromCultureName}</span>
                        <span className="sc-culture-whisper-tick">T{reply.tick}</span>
                      </div>
                      <p className="sc-culture-whisper-text">{reply.text}</p>
                    </div>
                  </div>
                </li>
              );
            }

            const { item } = entry;
            return (
              <li
                key={entry.id}
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
                    {renderKindTag(item.kind)}
                    <span className="sc-culture-whisper-culture">{item.fromCultureName}</span>
                    <span className="sc-culture-whisper-tick">T{item.tick}</span>
                  </div>
                  <p className="sc-culture-whisper-text">{item.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
