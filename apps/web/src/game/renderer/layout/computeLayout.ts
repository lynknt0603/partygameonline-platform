import type { CardTableLayout } from "./CardTableLayout";
import { isMobileTable } from "./CardTableLayout";
import { desktopCardTableLayout } from "./desktopCardTableLayout";
import { mobileCardTableLayout } from "./mobileCardTableLayout";

export function computeCardTableLayout(width: number, height: number): CardTableLayout {
  const w = Math.max(320, width);
  const h = Math.max(480, height);
  return isMobileTable(w, h) ? mobileCardTableLayout(w, h) : desktopCardTableLayout(w, h);
}
