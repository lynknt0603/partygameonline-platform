import { Container, Graphics, Text } from "pixi.js";
import type { Rect } from "../layout/CardTableLayout";
import type { TablePalette } from "../theme/tablePalette";

export class PlayZoneView extends Container {
  private readonly frame = new Graphics();
  private readonly title = new Text({
    text: "PLAY AREA",
    style: { fontFamily: "Segoe UI, sans-serif", fontSize: 11, fontWeight: "800", fill: 0xc9a45c, letterSpacing: 1.4 },
  });
  private readonly hint = new Text({
    text: "Drop card here",
    style: { fontFamily: "Segoe UI, sans-serif", fontSize: 12, fill: 0xf2eee5 },
  });
  private hot = false;

  constructor() {
    super();
    this.addChild(this.frame, this.title, this.hint);
  }

  paint(rect: Rect, palette: TablePalette): void {
    this.position.set(rect.x, rect.y);
    this.frame.clear();
    this.frame.roundRect(4, 4, rect.width - 8, rect.height - 8, 18);
    this.frame.fill({ color: palette.playFill, alpha: this.hot ? 0.42 : 0.16 });
    this.drawDots(rect.width, rect.height, this.hot ? palette.playHot : palette.playStroke, this.hot ? 1 : 0.7);
    this.title.style.fill = palette.playStroke;
    this.hint.style.fill = palette.label;
    this.hint.alpha = this.hot ? 1 : 0.72;
    this.title.position.set((rect.width - this.title.width) / 2, 10);
    this.hint.position.set((rect.width - this.hint.width) / 2, rect.height / 2 - 8);
  }

  setHot(hot: boolean, rect: Rect, palette: TablePalette): void {
    if (this.hot === hot) {
      return;
    }
    this.hot = hot;
    this.paint(rect, palette);
  }

  containsGlobal(x: number, y: number): boolean {
    return this.getBounds().containsPoint(x, y);
  }

  private drawDots(width: number, height: number, color: number, alpha: number): void {
    const inset = 10;
    const radius = 14;
    const step = this.hot ? 7 : 9;
    const left = inset;
    const top = inset;
    const right = width - inset;
    const bottom = height - inset;
    for (let x = left + radius; x <= right - radius; x += step) {
      this.dot(x, top, color, alpha);
      this.dot(x, bottom, color, alpha);
    }
    for (let y = top + radius; y <= bottom - radius; y += step) {
      this.dot(left, y, color, alpha);
      this.dot(right, y, color, alpha);
    }
  }

  private dot(x: number, y: number, color: number, alpha: number): void {
    this.frame.circle(x, y, this.hot ? 1.6 : 1.2);
    this.frame.fill({ color, alpha });
  }
}
