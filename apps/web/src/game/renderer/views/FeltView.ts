import { Graphics } from "pixi.js";
import type { TablePalette } from "../theme/tablePalette";

const GRAIN: Array<[number, number]> = Array.from({ length: 96 }, (_, index) => [
  ((index * 47) % 97) / 97,
  ((index * 83) % 89) / 89,
]);

export class FeltView extends Graphics {
  paint(width: number, height: number, palette: TablePalette): void {
    this.clear();
    this.rect(0, 0, width, height);
    this.fill({ color: palette.felt });

    const cx = width / 2;
    const cy = height / 2;
    const rx = width * 0.34;
    const ry = height * 0.28;

    this.ellipse(cx, cy, rx + 18, ry + 16);
    this.fill({ color: 0x000000, alpha: 0.18 });

    this.ellipse(cx, cy, rx, ry);
    this.fill({ color: palette.feltInner });
    this.stroke({ width: 12, color: palette.rail, alpha: 0.95 });

    this.ellipse(cx, cy, rx - 9, ry - 8);
    this.stroke({ width: 1.25, color: palette.rail, alpha: 0.35 });

    for (const [nx, ny] of GRAIN) {
      const x = cx - rx + nx * rx * 2;
      const y = cy - ry + ny * ry * 2;
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy > 0.92) {
        continue;
      }
      this.circle(x, y, 0.7);
      this.fill({ color: 0x000000, alpha: 0.07 });
    }
  }
}
