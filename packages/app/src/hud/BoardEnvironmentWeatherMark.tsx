import React from "react";
import {
  ENVIRONMENT_WEATHER_MARK,
  environmentSnapshot,
  type GameState,
} from "@second-crown/sim";
import "./board-environment-weather-mark.css";

export type BoardEnvironmentWeatherKind = "clear" | "rain" | "storm" | "snow";

export interface BoardEnvironmentWeatherMarkView {
  weatherMark: string;
  weatherKind: BoardEnvironmentWeatherKind;
}

function classifyWeatherKind(weatherMark: string): BoardEnvironmentWeatherKind {
  for (const [k, label] of Object.entries(ENVIRONMENT_WEATHER_MARK)) {
    if (label === weatherMark) return k as BoardEnvironmentWeatherKind;
  }
  return "clear";
}

/**
 * Pure wrapper reading `environmentSnapshot(state)?.weatherMark` with safe guards
 * so `BoardLiving` shows a quiet fourth weather mark beneath `BoardEnvironmentSeasonNotePill`.
 * Returns `null` when the snapshot or `weatherMark` (`living_environment_weather`) is null.
 */
export function resolveBoardEnvironmentWeatherMark(
  state: GameState | null | undefined,
): BoardEnvironmentWeatherMarkView | null {
  if (!state?.flags || !Array.isArray(state.board?.provinces)) return null;
  const snap = environmentSnapshot(state);
  if (!snap || !snap.weatherMark) return null;
  return {
    weatherMark: snap.weatherMark,
    weatherKind: classifyWeatherKind(snap.weatherMark),
  };
}

function renderWeatherMark(kind: BoardEnvironmentWeatherKind): React.ReactNode {
  switch (kind) {
    case "rain":
      return (
        <>
          <line x1="3.4" y1="2.2" x2="2.2" y2="5.4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <line x1="6.4" y1="2.2" x2="5.2" y2="5.4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <line x1="4.8" y1="5.2" x2="3.6" y2="8.2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </>
      );
    case "storm":
      return <path d="M1.8 4 H7.5 Q8.8 4 8.2 5.4 M2.2 6.8 H6.4" fill="none" stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" />;
    case "snow":
      return (
        <>
          <line x1="1.8" y1="4.2" x2="8.2" y2="4.2" stroke="currentColor" strokeWidth="0.95" strokeLinecap="round" />
          <line x1="2.4" y1="6.4" x2="7.6" y2="6.4" stroke="currentColor" strokeWidth="0.95" strokeLinecap="round" />
        </>
      );
    case "clear":
    default:
      return <path d="M2 5.2 Q5 3.6 8 5.2" fill="none" stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" />;
  }
}

/**
 * Calm top-right fourth environment pill stacked beneath `BoardEnvironmentSeasonNotePill`,
 * reading `environmentSnapshot(state).weatherMark`. Hides cleanly when `null` or switched off.
 */
export const BoardEnvironmentWeatherMarkPill: React.FC<{
  state: GameState | null | undefined;
}> = ({ state }) => {
  const v = resolveBoardEnvironmentWeatherMark(state);
  if (!v) return null;

  return (
    <div
      className={`sc-bweather-pill is-${v.weatherKind}`}
      data-bweather-mark={v.weatherMark}
      data-bweather-kind={v.weatherKind}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <svg
        className="sc-bweather-mark"
        viewBox="0 0 10 10"
        width={10}
        height={10}
        aria-hidden="true"
      >
        {renderWeatherMark(v.weatherKind)}
      </svg>
      <span className="sc-bweather-label">{v.weatherMark}</span>
    </div>
  );
};
