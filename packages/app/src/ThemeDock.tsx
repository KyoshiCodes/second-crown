import React from "react";

export const CHROME_KEY = "sc-chrome";
export const CHROMES = ["dusk", "night", "parchment"] as const;
export type Chrome = (typeof CHROMES)[number];

const LABELS: Record<Chrome, string> = {
  dusk: "Dusk",
  night: "Night",
  parchment: "Parchment",
};

export function loadChrome(): Chrome {
  try {
    const v = localStorage.getItem(CHROME_KEY);
    if (v && (CHROMES as readonly string[]).includes(v)) return v as Chrome;
  } catch {
    /* ignore */
  }
  return "dusk";
}

/** Sets data-chrome on <html>; theme.css keys all chrome palettes off it. */
export function applyChrome(chrome: Chrome) {
  document.documentElement.dataset.chrome = chrome;
}

export function ThemeDock() {
  const [chrome, setChrome] = React.useState<Chrome>(loadChrome);

  function pick(next: Chrome) {
    setChrome(next);
    applyChrome(next);
    try {
      localStorage.setItem(CHROME_KEY, next);
    } catch {
      /* ignore */
    }
  }

  return (
    <div role="group" aria-label="HUD chrome" style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 12, opacity: 0.8 }}>Chrome</span>
      {CHROMES.map((c) => (
        <button
          key={c}
          type="button"
          aria-pressed={chrome === c}
          onClick={() => pick(c)}
          style={
            chrome === c
              ? { borderColor: "var(--chrome-btn-border-hover)", color: "var(--chrome-accent)", fontWeight: 600 }
              : undefined
          }
        >
          {LABELS[c]}
        </button>
      ))}
    </div>
  );
}
