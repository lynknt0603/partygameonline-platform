import { Container, Graphics, Text } from "pixi.js";
import type { TablePalette } from "../theme/tablePalette";

export class DeckView extends Container {
  private readonly stack = new Graphics();
  private readonly mark = new Text({
    text: "DECK",
    style: { fontFamily: "Segoe UI, sans-serif", fontSize: 11, fontWeight: "800", fill: 0xc9a45c, letterSpacing: 1 },
  });
  private readonly count = new Text({
    text: "32",
    style: { fontFamily: "Segoe UI, sans-serif", fontSize: 13, fontWeight: "700", fill: 0xf2eee5 },
  });
  remaining = 32;

  constructor() {
    super();
    this.addChild(this.stack, this.mark, this.count);
  }

  paint(width: number, height: number, palette: TablePalette): void {
    this.stack.clear();
    for (let i = 3; i >= 0; i -= 1) {
      this.stack.roundRect(i * 2.2, -i * 2.2, width, height, 8);
      this.stack.fill({ color: palette.cardBack });
      this.stack.stroke({ width: 1.2, color: palette.cardBackPattern, alpha: 0.85 });
    }
    this.mark.style.fill = palette.cardBackPattern;
    this.count.style.fill = palette.label;
    this.count.text = String(this.remaining);
    this.mark.position.set((width - this.mark.width) / 2, height * 0.42);
    this.count.position.set((width - this.count.width) / 2, height + 8);
  }
}
