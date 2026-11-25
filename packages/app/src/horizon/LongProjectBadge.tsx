import React from "react";
import { horizonBracket, isLongProject, pacingTier, pacingTooltip } from "./horizon";
import "./horizon-pacing.css";

/** Soft living "Long project" pill shown when a study or build waits >= 4 hours. */
export function LongProjectBadge(props: { seconds: number }) {
  const { seconds } = props;
  if (!isLongProject(seconds)) return null;
  const bracket = horizonBracket(seconds);
  const tier = pacingTier(seconds);
  return (
    <span
      className={`sc-long-project-badge is-${bracket}${tier === "multi-day" ? " is-multi-day" : ""}`}
      data-long-project={bracket}
      data-pacing-tier={tier}
      title={pacingTooltip(seconds)}
    >
      <span className="sc-long-project-pip" aria-hidden="true" />
      <span className="sc-long-project-label">Long project</span>
    </span>
  );
}
