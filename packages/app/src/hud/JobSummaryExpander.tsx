import React from "react";
import {
  jobSummarySnapshot,
  type GameState,
  type JobSummary,
} from "@second-crown/sim";
import "./job-summary.css";

/**
 * Defensive pure reader over `@second-crown/sim`'s `jobSummarySnapshot(state)`.
 * Returns `null` with no player citizens, `living_job_summary` off, or partial state.
 */
export function resolveJobSummary(
  state: GameState | null | undefined,
): JobSummary | null {
  if (
    !state?.flags ||
    !Array.isArray(state.citizens) ||
    !Array.isArray(state.buildings)
  ) {
    return null;
  }
  try {
    return jobSummarySnapshot(state);
  } catch {
    return null;
  }
}

/**
 * Calm collapsed-by-default job-summary expander in `PeoplePanel` reading
 * `jobSummarySnapshot(state)` (idle count + per-job counts and up to 3 works).
 * Hides cleanly when `null` or `living_job_summary` is off.
 */
export const JobSummaryExpander: React.FC<{ state: GameState | undefined }> = ({
  state,
}) => {
  const snap = resolveJobSummary(state);
  if (!snap) return null;

  const jobPreview = snap.byJob.map((j) => `${j.name} ${j.count}`).join(" · ");

  return (
    <details
      className="sc-job-summary"
      data-job-summary-idle={snap.idle}
      data-job-summary-jobs={snap.byJob.length}
    >
      <summary className="sc-job-summary-toggle">
        <span className="sc-job-summary-pip" aria-hidden="true" />
        <span className="sc-job-summary-idle">Idle {snap.idle}</span>
        {jobPreview ? <span>· {jobPreview}</span> : null}
      </summary>
      {snap.byJob.length > 0 ? (
        <div className="sc-job-summary-list">
          {snap.byJob.map((job) => (
            <div
              key={job.id}
              className="sc-job-summary-row"
              data-job-id={job.id}
              data-job-count={job.count}
            >
              <span className="sc-job-summary-name">
                {job.name}: {job.count}
              </span>
              {job.buildings.length > 0 ? (
                <span className="sc-job-summary-works">
                  ({job.buildings.map((b) => `${b.name} ${b.x},${b.y}`).join(", ")})
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </details>
  );
};
