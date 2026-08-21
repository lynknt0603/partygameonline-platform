import { Graphics } from "pixi.js";
import type { Rect } from "../layout/CardTableLayout";
import type { TablePalette } from "../theme/tablePalette";

export class InnerBoardView extends Graphics {
  paint(rect: Rect, palette: TablePalette): void {
    this.clear();
    this.roundRect(rect.x, rect.y, rect.width, rect.height, 22);
    this.fill({ color: palette.playFill, alpha: 0.22 });
    this.stroke({ width: 1.5, color: palette.playStroke, alpha: 0.55 });
    this.roundRect(rect.x + 8, rect.y + 8, rect.width - 16, rect.height - 16, 16);
    this.stroke({ width: 1, color: palette.rail, alpha: 0.28 });
  }
}
