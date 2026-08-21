import { Container } from "pixi.js";
import type { FederatedPointerEvent } from "pixi.js";
import type { DemoCard } from "@/game/games/demo-card-game/demoCards";
import { prefersReducedMotion } from "@/shared/utils/motion";
import { computeCardTableLayout } from "./layout/computeLayout";
import type { CardTableLayout } from "./layout/CardTableLayout";
import { centerRect } from "./layout/CardTableLayout";
import type { TablePalette } from "./theme/tablePalette";
import { CardView } from "./views/CardView";
import { DeckView } from "./views/DeckView";
import { FeltView } from "./views/FeltView";
import { InnerBoardView } from "./views/InnerBoardView";
import { assignFanRest, layoutFan } from "./views/HandView";
import { cancelSettle, settleToRest, snapToRest } from "./views/settleCard";
import { PlayerAreaView } from "./views/PlayerAreaView";
import { PlayZoneView } from "./views/PlayZoneView";
import { TurnBadgeView } from "./views/TurnBadgeView";

export interface CardTableCallbacks {
  onHandChange: (cards: DemoCard[]) => void;
  onPlayed: (card: DemoCard) => void;
  onSelect: (card: DemoCard | null) => void;
  onDraw?: () => void;
}

export interface TableSync {
  hand: DemoCard[];
  opponentHandSize: number;
  discard: DemoCard[];
  deckSize: number;
  yourTurn: boolean;
}

export class CardTableScene {
  readonly root = new Container();
  private readonly felt = new FeltView();
  private readonly innerBoard = new InnerBoardView();
  private readonly opponent = new PlayerAreaView("OPPONENT");
  private readonly you = new PlayerAreaView("YOU");
  private readonly playZone = new PlayZoneView();
  private readonly deck = new DeckView();
  private readonly turn = new TurnBadgeView();
  private readonly handLayer = new Container();
  private readonly pileLayer = new Container();
  private readonly opponentLayer = new Container();

  private palette: TablePalette;
  private layout!: CardTableLayout;
  private hand: CardView[] = [];
  private opponentCards: CardView[] = [];
  private discardCard: CardView | null = null;
  private drag: { card: CardView; moved: boolean } | null = null;
  private reduced = prefersReducedMotion();
  private acceptPlays = true;
  private readonly callbacks: CardTableCallbacks;

  constructor(palette: TablePalette, callbacks: CardTableCallbacks) {
    this.palette = palette;
    this.callbacks = callbacks;
    this.root.sortableChildren = true;
    this.handLayer.sortableChildren = true;
    this.root.addChild(
      this.felt,
      this.innerBoard,
      this.opponent,
      this.opponentLayer,
      this.playZone,
      this.deck,
      this.pileLayer,
      this.turn,
      this.you,
      this.handLayer,
    );
    this.deck.eventMode = "static";
    this.deck.cursor = "pointer";
    this.deck.on("pointertap", () => this.callbacks.onDraw?.());
  }

  syncTable(state: TableSync): void {
    const nextIds = state.hand.map((card) => card.id).join("|");
    const currentIds = this.hand.map((card) => card.data.id).join("|");
    if (nextIds !== currentIds) {
      this.hand.forEach((card) => {
        cancelSettle(card);
        card.destroy();
      });
      this.hand = [];
      this.handLayer.removeChildren();
      state.hand.forEach((data) => {
        const card = this.makeCard(data, true);
        this.hand.push(card);
        this.handLayer.addChild(card);
      });
    }

    while (this.opponentCards.length > state.opponentHandSize) {
      this.opponentCards.pop()?.destroy();
    }
    while (this.opponentCards.length < state.opponentHandSize) {
      const index = this.opponentCards.length;
      const card = this.makeCard(
        { id: `opp-${index}`, rank: "", suit: "", name: "Hidden", nameVi: "Úp" },
        false,
        false,
      );
      this.opponentCards.push(card);
      this.opponentLayer.addChild(card);
    }

    this.discardCard?.destroy();
    this.discardCard = null;
    const top = state.discard.at(-1);
    if (top) {
      this.discardCard = this.makeCard(top, true, false);
      this.pileLayer.addChild(this.discardCard);
    }
    this.deck.remaining = state.deckSize;
    this.turn.visible = state.yourTurn;
    this.setAcceptPlays(state.yourTurn);
    if (this.layout) {
      this.positionCards();
      this.deck.paint(this.layout.cardWidth * 0.92, this.layout.cardHeight * 0.92, this.palette);
    }
    this.callbacks.onHandChange(this.getHand());
  }

  resize(width: number, height: number): void {
    this.layout = computeCardTableLayout(width, height);
    this.paintStatic();
    this.positionCards();
  }

  setPalette(palette: TablePalette): void {
    this.palette = palette;
    if (!this.layout) {
      return;
    }
    this.paintStatic();
    this.hand.forEach((card) => card.paint(palette));
    this.opponentCards.forEach((card) => card.paint(palette));
    this.discardCard?.paint(palette);
  }

  setReducedMotion(value: boolean): void {
    this.reduced = value;
  }

  setDockHand(value: boolean): void {
    this.handLayer.visible = !value;
    this.you.visible = !value;
  }

  setAcceptPlays(value: boolean): void {
    this.acceptPlays = value;
    this.hand.forEach((card) => {
      card.eventMode = value ? "static" : "none";
      card.cursor = value ? "pointer" : "default";
    });
    this.deck.eventMode = value ? "static" : "none";
  }

  playById(id: string): boolean {
    const card = this.hand.find((item) => item.data.id === id);
    if (!card || !this.acceptPlays) {
      return false;
    }
    this.callbacks.onPlayed(card.data);
    return true;
  }

  getHand(): DemoCard[] {
    return this.hand.map((card) => card.data);
  }

  destroy(): void {
    this.hand.forEach(cancelSettle);
    this.root.destroy({ children: true });
  }

  private tableScale(boost = 1): number {
    return ((this.layout?.cardWidth ?? 110) / 72) * boost;
  }

  private makeCard(data: DemoCard, faceUp: boolean, interactive = true): CardView {
    const card = new CardView(data, faceUp, 72, 100, this.palette);
    if (!interactive) {
      card.eventMode = "none";
      return card;
    }
    card.on("pointerdown", (event: FederatedPointerEvent) => this.onPointerDown(card, event));
    card.on("globalpointermove", (event: FederatedPointerEvent) => this.onPointerMove(event));
    card.on("pointerup", (event: FederatedPointerEvent) => this.onPointerUp(event));
    card.on("pointerupoutside", (event: FederatedPointerEvent) => this.onPointerUp(event));
    card.on("pointerover", () => this.onHover(card, true));
    card.on("pointerout", () => this.onHover(card, false));
    return card;
  }

  private paintStatic(): void {
    const { width, height, playZone, deck, opponentArea, localHand, innerBoard, cardWidth, cardHeight } = this.layout;
    this.felt.paint(width, height, this.palette);
    this.innerBoard.paint(innerBoard, this.palette);
    this.opponent.paint(opponentArea, this.palette);
    this.you.paint({ ...localHand, y: localHand.y + localHand.height - 4, height: 22 }, this.palette);
    this.playZone.paint(playZone, this.palette);
    this.deck.position.set(deck.x, deck.y);
    this.deck.paint(cardWidth * 0.92, cardHeight * 0.92, this.palette);
    this.turn.paint(this.layout.turnLabel.x, this.layout.turnLabel.y, this.palette);
  }

  private positionCards(): void {
    const { cardWidth, cardHeight, opponentHand, discard, localHand } = this.layout;
    const scale = this.tableScale();
    this.hand.forEach((card) => {
      cancelSettle(card);
      card.scale.set(scale);
    });
    layoutFan(this.hand, localHand, cardWidth);

    this.opponentCards.forEach((card, index) => {
      card.scale.set(scale * 0.72);
      const t = this.opponentCards.length === 1 ? 0.5 : index / (this.opponentCards.length - 1);
      card.position.set(
        opponentHand.x + t * Math.max(0, opponentHand.width - cardWidth * 0.72),
        opponentHand.y + cardHeight * 0.36,
      );
      card.rotation = 0;
    });

    if (this.discardCard) {
      this.discardCard.scale.set(scale);
      const pos = centerRect(discard, cardWidth, cardHeight);
      this.discardCard.position.set(pos.x + cardWidth / 2, pos.y + cardHeight / 2);
      this.discardCard.rotation = 0.06;
    }
  }

  private onHover(card: CardView, enter: boolean): void {
    if (this.drag || this.layout?.isMobile) {
      return;
    }
    if (enter) {
      cancelSettle(card);
      if (!this.reduced) {
        card.scale.set(this.tableScale(1.08));
        card.position.y = card.restY - 18;
      }
      card.zIndex = 60;
      return;
    }
    settleToRest(card, this.tableScale(), this.reduced);
  }

  private onPointerDown(card: CardView, event: FederatedPointerEvent): void {
    event.stopPropagation();
    cancelSettle(card);
    this.drag = { card, moved: false };
    card.zIndex = 80;
  }

  private onPointerMove(event: FederatedPointerEvent): void {
    if (!this.drag) {
      return;
    }
    const { card } = this.drag;
    const local = this.root.toLocal(event.global);
    if (Math.hypot(local.x - card.restX, local.y - card.restY) > 10) {
      this.drag.moved = true;
    }
    if (!this.drag.moved) {
      return;
    }
    card.position.copyFrom(local);
    card.rotation = 0;
    card.scale.set(this.tableScale(this.reduced ? 1 : 1.08));
    this.playZone.setHot(this.playZone.containsGlobal(event.global.x, event.global.y), this.layout.playZone, this.palette);
  }

  private onPointerUp(event: FederatedPointerEvent): void {
    if (!this.drag) {
      return;
    }
    const { card, moved } = this.drag;
    this.drag = null;
    this.playZone.setHot(false, this.layout.playZone, this.palette);

    if (!moved) {
      this.hand.forEach((item) => item.setSelected(item === card ? !card.selected : false, this.palette));
      this.restackHand(true);
      const selected = this.hand.find((item) => item.selected);
      this.callbacks.onSelect(selected ? selected.data : null);
      return;
    }

    if (this.acceptPlays && this.playZone.containsGlobal(event.global.x, event.global.y)) {
      this.callbacks.onPlayed(card.data);
    }
    this.restackHand(true);
  }

  private restackHand(animate: boolean): void {
    assignFanRest(this.hand, this.layout.localHand, this.layout.cardWidth);
    const scale = this.tableScale();
    this.hand.forEach((item) => {
      if (animate) {
        settleToRest(item, scale, this.reduced);
      } else {
        snapToRest(item, scale);
      }
    });
  }

}
