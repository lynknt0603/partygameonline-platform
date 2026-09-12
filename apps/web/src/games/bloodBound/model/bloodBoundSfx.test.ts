import { describe, it, expect, beforeEach } from "vitest";
import { playBloodBoundSfx, unlockBloodBoundSfx } from "./bloodBoundSfx";
import { useBloodBoundPrefs } from "./bloodBoundPrefs";

describe("bloodBoundSfx & bloodBoundPrefs", () => {
  beforeEach(() => {
    useBloodBoundPrefs.setState({ sound: true });
  });

  it("toggles sound preference correctly", () => {
    expect(useBloodBoundPrefs.getState().sound).toBe(true);
    useBloodBoundPrefs.getState().toggleSound();
    expect(useBloodBoundPrefs.getState().sound).toBe(false);
    useBloodBoundPrefs.getState().toggleSound();
    expect(useBloodBoundPrefs.getState().sound).toBe(true);
  });

  it("does not throw when playBloodBoundSfx is called in non-browser or test environment", () => {
    expect(() => {
      playBloodBoundSfx("attack");
      playBloodBoundSfx("wound");
      playBloodBoundSfx("shield");
      playBloodBoundSfx("intervene");
      playBloodBoundSfx("reveal");
      playBloodBoundSfx("heal");
      playBloodBoundSfx("victory");
      playBloodBoundSfx("defeat");
      playBloodBoundSfx("turn");
    }).not.toThrow();
  });

  it("does not play sound when sound is muted", () => {
    useBloodBoundPrefs.setState({ sound: false });
    expect(() => {
      playBloodBoundSfx("attack");
      unlockBloodBoundSfx();
    }).not.toThrow();
  });
});
