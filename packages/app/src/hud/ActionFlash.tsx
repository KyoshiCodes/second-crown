import React from "react";
import { playActionSound } from "../sfx";
import "./action-flash.css";

/** Which successful action the flash confirms. UI only — no game math. */
export type ActionFlashKind = "build" | "train" | "trade";

/** How long the confirmation flash stays on screen, in milliseconds. */
export const ACTION_FLASH_MS = 900;

const EVENT = "sc-action-flash";

const LABEL: Record<ActionFlashKind, string> = {
  build: "Built",
  train: "Trained",
  trade: "Traded",
};

const GLYPH: Record<ActionFlashKind, string> = {
  build: "⚒",
  train: "⚔",
  trade: "⚖",
};

/** Call only after a build, train, or trade has already succeeded. Plays sound and dispatches flash event. */
export function flashAction(kind: ActionFlashKind): void {
  playActionSound(kind);
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ActionFlashKind>(EVENT, { detail: kind }));
}

export interface ActionSparkPipProps {
  kind: ActionFlashKind;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Living vector spark / starburst glint tailored for each action kind:
 * - build: warm golden forge craftsmanship spark with radiating ember rays
 * - train: sharp silver-steel martial clash star with ruby-crimson edge
 * - trade: faceted 8-point gold coin spark with specular shimmer
 */
export function ActionSparkPip({
  kind,
  size = 15,
  className = "",
  style,
}: ActionSparkPipProps) {
  const classes = ["sc-action-flash-spark-pip", `is-${kind}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      className={classes}
      style={{ pointerEvents: "none", ...style }}
      aria-hidden="true"
      data-spark-kind={kind}
    >
      {kind === "build" && (
        <>
          {/* Warm forge glow halo */}
          <circle cx="8" cy="8" r="7" fill="rgba(251, 191, 36, 0.22)" />
          {/* Cardinal forge spark diamond */}
          <polygon
            points="8,1.2 9.6,6.4 14.8,8 9.6,9.6 8,14.8 6.4,9.6 1.2,8 6.4,6.4"
            fill="#fef08a"
            stroke="#d97706"
            strokeWidth="0.5"
          />
          {/* Diagonal forge micro-sparks */}
          <line x1="3.5" y1="3.5" x2="5.2" y2="5.2" stroke="#fde68a" strokeWidth="0.8" strokeLinecap="round" />
          <line x1="12.5" y1="3.5" x2="10.8" y2="5.2" stroke="#fde68a" strokeWidth="0.8" strokeLinecap="round" />
          <line x1="3.5" y1="12.5" x2="5.2" y2="10.8" stroke="#fde68a" strokeWidth="0.8" strokeLinecap="round" />
          <line x1="12.5" y1="12.5" x2="10.8" y2="10.8" stroke="#fde68a" strokeWidth="0.8" strokeLinecap="round" />
          {/* Core white-hot spark center */}
          <circle cx="8" cy="8" r="1.6" fill="#ffffff" />
        </>
      )}

      {kind === "train" && (
        <>
          {/* Martial clash aura */}
          <circle cx="8" cy="8" r="7" fill="rgba(248, 113, 113, 0.22)" />
          {/* Crossed clash diagonals */}
          <line x1="2.4" y1="2.4" x2="13.6" y2="13.6" stroke="#fca5a5" strokeWidth="0.75" strokeLinecap="round" opacity="0.85" />
          <line x1="13.6" y1="2.4" x2="2.4" y2="13.6" stroke="#fca5a5" strokeWidth="0.75" strokeLinecap="round" opacity="0.85" />
          {/* Elongated blade glint star */}
          <polygon
            points="8,0.6 9.4,6.6 15.4,8 9.4,9.4 8,15.4 6.6,9.4 0.6,8 6.6,6.6"
            fill="#ffffff"
            stroke="#ef4444"
            strokeWidth="0.5"
          />
          {/* Gleaming center spark */}
          <circle cx="8" cy="8" r="1.5" fill="#fef9c3" />
        </>
      )}

      {kind === "trade" && (
        <>
          {/* Sapphire & gold prosperity aura */}
          <circle cx="8" cy="8" r="7" fill="rgba(96, 165, 250, 0.22)" />
          {/* Faceted 8-point gold coin spark */}
          <polygon
            points="8,1.2 9.5,5.5 13.8,3.2 11.5,7.5 15.8,8 11.5,8.5 13.8,12.8 9.5,10.5 8,14.8 6.5,10.5 2.2,12.8 4.5,8.5 0.2,8 4.5,7.5 2.2,3.2 6.5,5.5"
            fill="#fef08a"
            stroke="#2563eb"
            strokeWidth="0.45"
          />
          {/* Radiant specular core */}
          <circle cx="8" cy="8" r="1.7" fill="#ffffff" />
        </>
      )}
    </svg>
  );
}

export interface ActionSoundPipProps {
  kind: ActionFlashKind;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Living acoustic sound glyph next to the action confirmation:
 * - build: stone & forge resonant chime emitter with radiant gold acoustic arcs
 * - train: martial clarion war-horn with sharp crimson & steel acoustic wave arcs
 * - trade: silver coin bell chime emitter with sapphire & gold resonance wave arcs
 */
export function ActionSoundPip({
  kind,
  size = 14,
  className = "",
  style,
}: ActionSoundPipProps) {
  const classes = ["sc-action-sound-pip", `is-${kind}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      className={classes}
      style={{ pointerEvents: "none", ...style }}
      aria-hidden="true"
      data-sound-kind={kind}
    >
      {kind === "build" && (
        <>
          {/* Forge chime sound cone / bell */}
          <path
            d="M2.5 6.2 L4.8 6.2 L7.8 3.8 L7.8 12.2 L4.8 9.8 L2.5 9.8 Z"
            fill="#fef08a"
            stroke="#d97706"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />
          {/* Core acoustic tone pip */}
          <circle cx="5" cy="8" r="0.8" fill="#ffffff" />
          {/* Radiating acoustic wave arcs */}
          <path
            d="M10 5.6 C11.5 6.8 11.5 9.2 10 10.4"
            fill="none"
            stroke="#fef08a"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="sc-action-sound-wave is-inner"
          />
          <path
            d="M12.4 3.8 C14.6 5.6 14.6 10.4 12.4 12.2"
            fill="none"
            stroke="#fde68a"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="sc-action-sound-wave is-outer"
          />
        </>
      )}

      {kind === "train" && (
        <>
          {/* Clarion war-horn emitter */}
          <path
            d="M2.5 6.2 L4.8 6.2 L7.8 3.8 L7.8 12.2 L4.8 9.8 L2.5 9.8 Z"
            fill="#ffffff"
            stroke="#ef4444"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />
          {/* War-horn mouthpiece ring */}
          <line x1="2.2" y1="6.8" x2="2.2" y2="9.2" stroke="#b91c1c" strokeWidth="0.7" />
          {/* Steel/ruby acoustic wavefront arcs */}
          <path
            d="M10 5.6 C11.5 6.8 11.5 9.2 10 10.4"
            fill="none"
            stroke="#fca5a5"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="sc-action-sound-wave is-inner"
          />
          <path
            d="M12.4 3.8 C14.6 5.6 14.6 10.4 12.4 12.2"
            fill="none"
            stroke="#fef08a"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="sc-action-sound-wave is-outer"
          />
        </>
      )}

      {kind === "trade" && (
        <>
          {/* Coin bell chime emitter */}
          <path
            d="M2.5 6.2 L4.8 6.2 L7.8 3.8 L7.8 12.2 L4.8 9.8 L2.5 9.8 Z"
            fill="#fef08a"
            stroke="#2563eb"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />
          {/* Silver bell clapper core */}
          <circle cx="5" cy="8" r="0.8" fill="#ffffff" />
          {/* Sapphire resonance waves */}
          <path
            d="M10 5.6 C11.5 6.8 11.5 9.2 10 10.4"
            fill="none"
            stroke="#93c5fd"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="sc-action-sound-wave is-inner"
          />
          <path
            d="M12.4 3.8 C14.6 5.6 14.6 10.4 12.4 12.2"
            fill="none"
            stroke="#fef08a"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="sc-action-sound-wave is-outer"
          />
        </>
      )}
    </svg>
  );
}

/** Pure view for one flash with living spark, sound glyph, and pulse treatment. Exported for tests. */
export function ActionFlashChip(props: { kind: ActionFlashKind; flashKey?: number }) {
  const { kind, flashKey = 0 } = props;
  return (
    <div className="sc-action-flash" aria-hidden="true" data-action-flash={kind}>
      <span key={flashKey} className={`sc-action-flash-chip is-${kind}`}>
        {/* Living radial glow halo behind the chip */}
        <span className={`sc-action-flash-halo is-${kind}`} aria-hidden="true" />
        {/* Specular diagonal shimmer sweep across chip */}
        <span className="sc-action-flash-shimmer" aria-hidden="true" />
        {/* Micro spark motes orbiting the chip */}
        <span className="sc-action-flash-sparks" aria-hidden="true">
          <span className="sc-action-flash-spark-mote is-top" />
          <span className="sc-action-flash-spark-mote is-bottom" />
          <span className="sc-action-flash-spark-mote is-trail" />
        </span>
        {/* Action Craft Glyph with corner living spark pip */}
        <span className="sc-action-flash-glyph-wrap">
          <span className="sc-action-flash-glyph">{GLYPH[kind]}</span>
          <ActionSparkPip kind={kind} size={15} />
        </span>
        {/* Action text label */}
        <span className="sc-action-flash-label">{LABEL[kind]}</span>
        {/* Living acoustic sound glyph and resonant pulse */}
        <span className="sc-action-sound-wrap" aria-hidden="true">
          <span className={`sc-action-sound-pulse is-${kind}`} />
          <ActionSoundPip kind={kind} size={14} />
        </span>
      </span>
    </div>
  );
}

/** Mount once. Listens for flashAction() and shows a brief confirmation chip with living spark & sound pulse. */
export function ActionFlash() {
  const [flash, setFlash] = React.useState<{ kind: ActionFlashKind; n: number } | null>(null);

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onFlash = (e: Event) => {
      const kind = (e as CustomEvent<ActionFlashKind>).detail;
      if (!(kind in LABEL)) return;
      setFlash((prev) => ({ kind, n: (prev?.n ?? 0) + 1 }));
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setFlash(null), ACTION_FLASH_MS);
    };
    window.addEventListener(EVENT, onFlash);
    return () => {
      window.removeEventListener(EVENT, onFlash);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!flash) return null;
  return <ActionFlashChip kind={flash.kind} flashKey={flash.n} />;
}
