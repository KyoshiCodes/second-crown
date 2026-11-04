import { afterEach, describe, expect, it, vi } from "vitest";
import { playActionSound, sfx } from "./sfx";
import { flashAction } from "./hud/ActionFlash";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("action confirmation sound", () => {
  it.each(["build", "train", "trade"] as const)("plays the %s tone", (kind) => {
    const spy = vi.spyOn(sfx, kind).mockImplementation(() => {});
    playActionSound(kind);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("is silent and safe without Web Audio", () => {
    vi.stubGlobal("AudioContext", undefined);
    expect(() => playActionSound("trade")).not.toThrow();
  });

  it("flashAction plays exactly one tone alongside the flash", () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal("window", { dispatchEvent });
    const spy = vi.spyOn(sfx, "build").mockImplementation(() => {});
    flashAction("build");
    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
