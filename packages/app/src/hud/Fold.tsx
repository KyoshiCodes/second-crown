import React from "react";
import "../layout-priority.css";
import "./fold-polish.css";
import "./hud-micro-feedback.css";

/**
 * Collapsible section for secondary panels (layout priority pass).
 *
 * State lives in localStorage:
 *   sc-fold:<id>       "1" open / "0" closed, written whenever the player toggles.
 *   sc-fold-seen:<id>  set the first time the panel renders.
 *
 * With no saved choice a panel starts open. A `noisy` panel starts closed once
 * the player has seen it at least once (any later page load).
 *
 * The top-bar Compact toggle sends `sc-fold-all` with `{ open: boolean }`; every
 * mounted fold follows it and saves the result.
 */

const OPEN_KEY = (id: string) => `sc-fold:${id}`;
const SEEN_KEY = (id: string) => `sc-fold-seen:${id}`;
const COMPACT_KEY = "sc-compact";
export const FOLD_ALL_EVENT = "sc-fold-all";
export const COMPACT_EVENT = "sc-compact-change";
export const FOLD_CLOSE_MS = 180;
export const FOLD_HEAD_PULSE_MS = 320;

function read(key: string): string | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

/** Resolve the starting open state for a fold. Exported for tests. */
export function initialFoldOpen(id: string, noisy: boolean, defaultOpen = true): boolean {
  const saved = read(OPEN_KEY(id));
  if (saved === "1") return true;
  if (saved === "0") return false;
  if (read(COMPACT_KEY) === "1") return false;
  if (noisy && read(SEEN_KEY(id)) === "1") return false;
  return defaultOpen;
}

export function Fold(props: {
  id: string;
  title: React.ReactNode;
  /** Short line shown next to the title (always visible, most useful when closed). */
  summary?: React.ReactNode;
  /** Close by default after the player has seen it once. */
  noisy?: boolean;
  /** Fallback open state on first visit when no user choice is stored. Defaults to true. */
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const { id, title, summary, noisy = false, defaultOpen = true, className, children } = props;
  const [open, setOpen] = React.useState(() => initialFoldOpen(id, noisy, defaultOpen));
  const [closing, setClosing] = React.useState(false);
  const [headMotion, setHeadMotion] = React.useState<"expanded" | "collapsed" | null>(null);
  const prevOpenRef = React.useRef(open);

  React.useEffect(() => {
    if (prevOpenRef.current === open) return;
    prevOpenRef.current = open;
    if (typeof window === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      setClosing(false);
      setHeadMotion(null);
      return;
    }
    setHeadMotion(open ? "expanded" : "collapsed");
    const headTimer = window.setTimeout(() => setHeadMotion(null), FOLD_HEAD_PULSE_MS);
    if (open) {
      setClosing(false);
      return () => window.clearTimeout(headTimer);
    }
    setClosing(true);
    const closeTimer = window.setTimeout(() => setClosing(false), FOLD_CLOSE_MS);
    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(headTimer);
    };
  }, [open]);

  React.useEffect(() => {
    write(SEEN_KEY(id), "1");
    const onAll = (ev: Event) => {
      const detail = (ev as CustomEvent).detail;
      if (detail && typeof detail.open === "boolean") {
        setOpen(detail.open);
        write(OPEN_KEY(id), detail.open ? "1" : "0");
      }
    };
    window.addEventListener(FOLD_ALL_EVENT, onAll);
    return () => window.removeEventListener(FOLD_ALL_EVENT, onAll);
  }, [id]);

  const toggle = () => {
    setOpen((v) => {
      write(OPEN_KEY(id), v ? "0" : "1");
      return !v;
    });
  };

  const showBody = open || closing;

  return (
    <section className={`sc-fold ${open ? "is-open" : "is-closed"}${className ? ` ${className}` : ""}`} data-fold={id}>
      <button
        type="button"
        className="sc-fold-head"
        aria-expanded={open}
        data-fold-motion={headMotion ?? undefined}
        onClick={toggle}
      >
        <span className="sc-fold-caret" aria-hidden="true">{open ? "▾" : "▸"}</span>
        <span className="sc-fold-title">{title}</span>
        {summary ? <span className="sc-fold-summary">{summary}</span> : null}
      </button>
      {showBody ? (
        <div
          className={`sc-fold-reveal ${closing ? "is-closing" : "is-opening"}`}
          aria-hidden={closing ? "true" : undefined}
        >
          <div className="sc-fold-body">{children}</div>
        </div>
      ) : null}
    </section>
  );
}

export function loadCompact(): boolean {
  return read(COMPACT_KEY) === "1";
}

/** Compact mode: tightens chrome spacing (body class) and folds every panel. */
export function setCompact(on: boolean) {
  write(COMPACT_KEY, on ? "1" : "0");
  applyCompactClass(on);
  window.dispatchEvent(new CustomEvent(FOLD_ALL_EVENT, { detail: { open: !on } }));
  window.dispatchEvent(new CustomEvent(COMPACT_EVENT, { detail: on }));
}

export function applyCompactClass(on: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("sc-compact", on);
}

export function useCompact(): boolean {
  const [on, setOn] = React.useState(loadCompact);
  React.useEffect(() => {
    const onChange = (ev: Event) => setOn(Boolean((ev as CustomEvent).detail));
    window.addEventListener(COMPACT_EVENT, onChange);
    return () => window.removeEventListener(COMPACT_EVENT, onChange);
  }, []);
  return on;
}
