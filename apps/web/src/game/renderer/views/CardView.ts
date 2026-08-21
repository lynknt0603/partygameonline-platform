import { Container, Graphics, Text } from "pixi.js";
import { isRedSuit, type DemoCard } from "@/game/games/demo-card-game/demoCards";
import type { TablePalette } from "../theme/tablePalette";

export class CardView extends Container {
  readonly data: DemoCard;
  faceUp: boolean;
  private readonly body = new Graphics();
  private readonly rankText: Text;
  private readonly suitText: Text;
  private readonly widthPx: number;
  private readonly heightPx: number;
  selected = false;
  handIndex = 0;
  restX = 0;
  restY = 0;
  restRotation = 0;

  constructor(data: DemoCard, faceUp: boolean, width: number, height: number, palette: TablePalette) {
    super();
    this.data = data;
    this.faceUp = faceUp;
    this.widthPx = width;
    this.heightPx = height;
    this.eventMode = "static";
    this.cursor = "pointer";
    this.pivot.set(width / 2, height / 2);

    this.rankText = new Text({
      text: data.rank,
      style: { fontFamily: "Segoe UI, sans-serif", fontSize: Math.round(width * 0.28), fontWeight: "700", fill: 0x202824 },
    });
    this.suitText = new Text({
      text: data.suit,
      style: { fontFamily: "Segoe UI, sans-serif", fontSize: Math.round(width * 0.34), fill: 0x202824 },
    });

    this.addChild(this.body, this.rankText, this.suitText);
    this.paint(palette);
  }

  paint(palette: TablePalette): void {
    const w = this.widthPx;
    const h = this.heightPx;
    this.body.clear();
    this.body.roundRect(0, 0, w, h, 8);

    if (this.faceUp) {
      this.body.fill({ color: palette.cardFace });
      this.body.stroke({ width: this.selected ? 3 : 1.5, color: this.selected ? palette.playStroke : palette.cardStroke });
      const ink = isRedSuit(this.data.suit) ? palette.redSuit : palette.ink;
      this.rankText.style.fill = ink;
      this.suitText.style.fill = ink;
      this.rankText.visible = true;
      this.suitText.visible = true;
      this.rankText.position.set(8, 6);
      this.suitText.position.set((w - this.suitText.width) / 2, h * 0.38);
    } else {
      this.body.fill({ color: palette.cardBack });
      this.body.stroke({ width: 1.5, color: palette.cardStroke });
      this.body.roundRect(8, 10, w - 16, h - 20, 4);
      this.body.stroke({ width: 1, color: palette.cardBackPattern, alpha: 0.85 });
      this.rankText.visible = false;
      this.suitText.visible = false;
    }
  }

  setSelected(next: boolean, palette: TablePalette): void {
    this.selected = next;
    this.paint(palette);
  }
}
