import { Container, Graphics, Text } from "pixi.js";
import type { TablePalette } from "../theme/tablePalette";

export class TurnBadgeView extends Container {
  private readonly plate = new Graphics();
  private readonly caption = new Text({
    text: "●  YOUR TURN",
    style: { fontFamily: "Segoe UI, sans-serif", fontSize: 13, fontWeight: "800", fill: 0xf2eee5, letterSpacing: 1.2 },
  });

  constructor() {
    super();
    this.addChild(this.plate, this.caption);
  }

  paint(x: number, y: number, palette: TablePalette): void {
    const padX = 16;
    const width = this.caption.width + padX * 2;
    const height = 30;
    this.position.set(x - width / 2, y - height / 2);
    this.plate.clear();
    this.plate.roundRect(0, 0, width, height, 15);
    this.plate.fill({ color: palette.playFill, alpha: 0.72 });
    this.plate.stroke({ width: 1, color: palette.playStroke, alpha: 0.9 });
    this.caption.style.fill = palette.label;
    this.caption.position.set(padX, 7);
  }
}
