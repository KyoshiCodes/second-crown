import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ACTION_FLASH_MS, ActionFlash, ActionFlashChip } from "./ActionFlash";

describe("ActionFlash", () => {
  it("renders nothing until an action succeeds", () => {
    expect(renderToStaticMarkup(<ActionFlash />)).toBe("");
  });

  it.each([
    ["build", "Built"],
    ["train", "Trained"],
    ["trade", "Traded"],
  ] as const)("labels a %s flash", (kind, label) => {
    const html = renderToStaticMarkup(<ActionFlashChip kind={kind} />);
    expect(html).toContain(label);
    expect(html).toContain(`data-action-flash="${kind}"`);
    expect(html).toContain('aria-hidden="true"');
  });

  it("stays brief", () => {
    expect(ACTION_FLASH_MS).toBeGreaterThan(0);
    expect(ACTION_FLASH_MS).toBeLessThanOrEqual(1500);
  });
});
