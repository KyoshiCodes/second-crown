import React from "react";
import { Fold } from "../hud/Fold";
import { GAME_NEWS, formatNewsDate, newsSummary, sortedNews, type NewsEntry } from "./gameNews";
import "./game-news.css";

/** Game News fold for the Crown tab. Data lives in ./gameNews.ts (app only). */
export function GameNewsPanel(props: { news?: readonly NewsEntry[] }) {
  const list = props.news ?? GAME_NEWS;
  const entries = sortedNews(list);
  return (
    <Fold id="crown-news" title="Game News" summary={newsSummary(list)} className="sc-news-fold">
      {entries.length === 0 ? (
        <p className="sc-news-empty">No news yet.</p>
      ) : (
        <ol className="sc-news-list">
          {entries.map((n) => (
            <li key={n.id} className={`sc-work-card sc-news-card is-${n.kind}`} data-news-id={n.id}>
              <div className="sc-work-head sc-news-head">
                <span className="sc-work-name sc-news-title">{n.title}</span>
                <span className={`sc-news-kind is-${n.kind}`}>{n.kind === "major" ? "Major" : "Minor"}</span>
                <time className="sc-news-date" dateTime={n.date}>{formatNewsDate(n.date)}</time>
              </div>
              <div className="sc-news-body">
                {n.body.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Fold>
  );
}
