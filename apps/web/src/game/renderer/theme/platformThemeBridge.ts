import { Color } from "pixi.js";
import type { ResolvedTheme } from "@/shared/theme";

export interface PixiThemeColors {
  bg: number;
  surface: number;
  brand: number;
  border: number;
  accent: number;
  textPrimary: number;
}

const FALLBACK: Record<keyof PixiThemeColors, string> = {
  bg: "#0B0D10",
  surface: "#14181D",
  brand: "#C9A45C",
  border: "#303844",
  accent: "#3D9C8C",
  textPrimary: "#F2EEE5",
};

export const PLATFORM_PIXI_COLORS: Record<ResolvedTheme, PixiThemeColors> = {
  dark: {
    bg: 0x0b0d10,
    surface: 0x14181d,
    brand: 0xc9a45c,
    border: 0x303844,
    accent: 0x5ca0c9,
    textPrimary: 0xf2eee5,
  },
  light: {
    bg: 0xf5f7f3,
    surface: 0xffffff,
    brand: 0xb88a3d,
    border: 0xd9e1dc,
    accent: 0x3d9c8c,
    textPrimary: 0x202824,
  },
};

function cssColorToNumber(value: string, fallback: string): number {
  try {
    return new Color(value.trim() || fallback).toNumber();
  } catch {
    return new Color(fallback).toNumber();
  }
}

/** Live CSS read. Do not call this during the same React turn as a theme toggle. */
export function extractPixiThemeColors(
  element: HTMLElement = document.documentElement,
): PixiThemeColors {
  const styles = getComputedStyle(element);
  const read = (name: string, key: keyof PixiThemeColors) =>
    cssColorToNumber(styles.getPropertyValue(name), FALLBACK[key]);

  return {
    bg: read("--bg", "bg"),
    surface: read("--surface", "surface"),
    brand: read("--brand", "brand"),
    border: read("--border", "border"),
    accent: read("--accent", "accent"),
    textPrimary: read("--text-primary", "textPrimary"),
  };
}
