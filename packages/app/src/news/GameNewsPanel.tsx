import React from "react";
import { Fold } from "../hud/Fold";
import { formatNewsDate, getActiveNewsFeed, newsSummary, sortedNews, type NewsEntry } from "./gameNews";
import { markNewsSeen } from "./newsState";
import "./game-news.css";
import "./news-living.css";

/** Game News fold for the Crown tab. Data lives in ./gameNews.ts (app only). */
export function GameNewsPanel(props: { news?: readonly NewsEntry[] }) {
  const list = props.news ?? getActiveNewsFeed();
  const entries = sortedNews(list);

  React.useEffect(() => {
    if (!props.news) {
      markNewsSeen(list);
    }
  }, [list, props.news]);

  return (
    <Fold id="crown-news" title="Game News" summary={newsSummary(list)} className="sc-news-fold">
      {entries.length === 0 ? (
        <p className="sc-news-empty">No news yet.</p>
      ) : (
        <ol className="sc-news-list">
          {entries.map((n, idx) => (
            <li key={n.id} className={`sc-work-card sc-news-card is-${n.kind}`} data-news-id={n.id}>
              <div className="sc-work-head sc-news-head">
                <span
                  className={`sc-news-pip is-${n.kind}${idx === 0 ? " is-latest" : ""}`}
                  aria-hidden="true"
                  style={{ pointerEvents: "none" }}
                />
                <span className="sc-work-name sc-news-title">{n.title}</span>
                <span className={`sc-news-kind is-${n.kind}`}>{n.kind === "major" ? "Major" : "Minor"}</span>
                <span className="sc-news-date-seal">
                  <svg
                    className="sc-news-seal-icon"
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                    aria-hidden="true"
                    style={{ pointerEvents: "none" }}
                  >
                    <circle
                      cx="5"
                      cy="5"
                      r="3.8"
                      stroke={n.kind === "major" ? "#e8c36a" : "#9aa4b2"}
                      strokeWidth="1"
                      fill={n.kind === "major" ? "rgba(232, 195, 106, 0.22)" : "rgba(154, 164, 178, 0.16)"}
                    />
                    <circle cx="5" cy="5" r="1.4" fill={n.kind === "major" ? "#fef08a" : "#cbd5e1"} />
                  </svg>
                  <time className="sc-news-date" dateTime={n.date}>{formatNewsDate(n.date)}</time>
                </span>
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
