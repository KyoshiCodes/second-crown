import React from "react";
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

/** Call only after a build, train, or trade has already succeeded. */
export function flashAction(kind: ActionFlashKind): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ActionFlashKind>(EVENT, { detail: kind }));
}

/** Pure view for one flash. Exported for tests. */
export function ActionFlashChip(props: { kind: ActionFlashKind; flashKey?: number }) {
  const { kind, flashKey = 0 } = props;
  return (
    <div className="sc-action-flash" aria-hidden="true" data-action-flash={kind}>
      <span key={flashKey} className={`sc-action-flash-chip is-${kind}`}>
        <span className="sc-action-flash-glyph">{GLYPH[kind]}</span>
        <span>{LABEL[kind]}</span>
      </span>
    </div>
  );
}

/** Mount once. Listens for flashAction() and shows a brief confirmation chip. */
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
