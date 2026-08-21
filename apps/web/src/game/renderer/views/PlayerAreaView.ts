import { Container, Text } from "pixi.js";
import type { Rect } from "../layout/CardTableLayout";
import type { TablePalette } from "../theme/tablePalette";

export class PlayerAreaView extends Container {
  private readonly nameText: Text;

  constructor(label: string) {
    super();
    this.nameText = new Text({
      text: label,
      style: {
        fontFamily: "Segoe UI, sans-serif",
        fontSize: 12,
        fontWeight: "800",
        fill: 0xf2eee5,
        letterSpacing: 1.6,
      },
    });
    this.addChild(this.nameText);
  }

  paint(rect: Rect, palette: TablePalette): void {
    this.position.set(rect.x, rect.y);
    this.nameText.style.fill = palette.label;
    this.nameText.alpha = 0.9;
    this.nameText.position.set((rect.width - this.nameText.width) / 2, 4);
  }
}
